import { SshService } from './ssh.service.js';
import { TerraformService } from './terraform.service.js';

import type {
    ClusterTopology,
} from '../types/terraform.js';

import type {
    NodeConnectivityResult,
    PlatformConnectivity,
    PlatformNode,
    PlatformNodeRole,
} from '../types/connectivity.js';

import type {
    SshAccessPath,
} from '../types/ssh.js';


export class PlatformConnectivityService {

    private readonly defaultSshPort = 22;

    private readonly pingCount = 1;

    private readonly pingTimeout = 1;


    constructor(
        private readonly terraformService: TerraformService,
        private readonly sshService: SshService,
        private readonly accessPath: SshAccessPath
    ) { }


    /*
     * Determine the role of a platform node
     * from its name.
     */
    private getNodeRole(
        name: string
    ): PlatformNodeRole {

        if (name.startsWith('cp-')) {
            return 'control-plane';
        }

        if (name.startsWith('etcd-')) {
            return 'etcd';
        }

        if (name.startsWith('repo-')) {
            return 'repository';
        }

        if (name.startsWith('vyos')) {
            return 'router';
        }

        return 'unknown';
    }


    /*
     * Get all platform nodes from Terraform.
     */
    private extractNodes(
        topology: ClusterTopology
    ): PlatformNode[] {

        const nodes: PlatformNode[] = [];


        /*
         * Linux VMs.
         */
        for (const vm of Object.values(
            topology.compute.linux_vms
        )) {

            if (!vm.ip_address) {
                continue;
            }

            nodes.push({
                name: vm.name,
                address: vm.ip_address,
                role: this.getNodeRole(vm.name),
                ssh_port: this.defaultSshPort,
            });
        }


        /*
         * VyOS routers.
         */
        for (const router of Object.values(
            topology.network.vyos
        )) {

            if (!router.ip_address) {
                continue;
            }

            nodes.push({
                name: router.name,
                address: router.ip_address,
                role: 'router',
                ssh_port: this.defaultSshPort,
            });
        }


        return nodes;
    }


    /*
     * Build ONE shell script.
     *
     * IMPORTANT:
     *
     * This script runs on the TARGET host.
     *
     * We do NOT SSH to every node.
     *
     * We simply ping every node from
     * the target host.
     *
     * Example generated command:
     *
     * ping -c 3 -W 2 10.50.30.11 >/dev/null 2>&1
     * if [ $? -eq 0 ]; then
     *     echo 'cp-01|10.50.30.11|reachable'
     * else
     *     echo 'cp-01|10.50.30.11|unreachable'
     * fi
     *
     * Then the same check is performed
     * for etcd-01, etcd-02, etc.
     *
     * ALL of this happens inside ONE
     * SSH session.
     */
    private buildConnectivityCommand(
        nodes: PlatformNode[]
    ): string {

        const commands =
            nodes.map(
                (node) => {

                    return (
                        `if ping ` +
                        `-c ${this.pingCount} ` +
                        `-W ${this.pingTimeout} ` +
                        `${node.address} ` +
                        `>/dev/null 2>&1; ` +

                        `then ` +

                        `echo '${node.name}|${node.address}|reachable'; ` +

                        `else ` +

                        `echo '${node.name}|${node.address}|unreachable'; ` +

                        `fi`
                    );
                }
            );


        return commands.join('; ');
    }


    /*
     * Convert the output from the target host
     * into NodeConnectivityResult[].
     *
     * Expected stdout:
     *
     * cp-01|10.50.30.11|reachable
     * etcd-01|10.50.30.21|reachable
     * etcd-02|10.50.30.22|unreachable
     */
    private parseResults(
        stdout: string,
        stderr: string,
        exitCode: number,
        nodes: PlatformNode[]
    ): NodeConnectivityResult[] {

        const results =
            new Map<
                string,
                NodeConnectivityResult
            >();


        const lines =
            stdout
                .split(/\r?\n/)
                .map(
                    (line) => line.trim()
                )
                .filter(
                    (line) => line.length > 0
                );


        /*
         * Parse every line returned by the
         * target host.
         */
        for (const line of lines) {

            const parts =
                line.split('|');


            /*
             * Expected:
             *
             * name
             * address
             * status
             */
            if (parts.length !== 3) {
                continue;
            }


            /*
             * Do not destructure the array.
             *
             * TypeScript strict mode can treat
             * array elements as possibly undefined.
             */
            const name =
                parts[0];

            const address =
                parts[1];

            const status =
                parts[2];


            if (
                name === undefined ||
                address === undefined ||
                status === undefined
            ) {
                continue;
            }


            /*
             * Find the original Terraform node.
             */
            const node =
                nodes.find(
                    (item) =>
                        item.name === name
                );


            if (!node) {
                continue;
            }


            const port =
                node.ssh_port ??
                this.defaultSshPort;


            const reachable =
                status === 'reachable';


            results.set(
                name,
                {
                    name:
                        node.name,

                    address:
                        node.address,

                    role:
                        node.role,

                    port,

                    reachable,

                    ...(reachable
                        ? {}
                        : {
                            error:
                                `Ping to ` +
                                `${node.address} ` +
                                `failed`,
                        }),
                }
            );
        }


        /*
         * Make sure every node from Terraform
         * is present in the final result.
         */
        return nodes.map(
            (node) => {

                const existing =
                    results.get(
                        node.name
                    );


                if (existing) {
                    return existing;
                }


                /*
                 * No result was returned for
                 * this node.
                 */
                return {
                    name:
                        node.name,

                    address:
                        node.address,

                    role:
                        node.role,

                    port:
                        node.ssh_port ??
                        this.defaultSshPort,

                    reachable:
                        false,

                    error:
                        stderr.trim() ||
                        (
                            exitCode !== 0
                                ? (
                                    `Remote connectivity ` +
                                    `check failed with exit code ` +
                                    `${exitCode}`
                                )
                                : 'No ping result returned'
                        ),
                };
            }
        );
    }


    /*
     * Check connectivity of the entire platform.
     *
     * ONE SSH SESSION.
     *
     * MCP
     *   |
     *   | SSH #1
     *   v
     * Jump Host
     *   |
     *   | SSH #2
     *   v
     * Target Host
     *   |
     *   ├── ping cp-01
     *   ├── ping etcd-01
     *   ├── ping etcd-02
     *   ├── ping etcd-03
     *   └── ping repo-01
     *
     * There is NO SSH connection to
     * cp-01, etcd-01, etcd-02, etcd-03
     * or repo-01.
     */
    public async checkPlatformConnectivity():
        Promise<PlatformConnectivity> {

        /*
         * Get topology from Terraform.
         */
        const topology =
            await this.terraformService
                .getPlatformTopology();


        /*
         * Convert topology into PlatformNode[].
         */
        const nodes =
            this.extractNodes(topology);


        if (nodes.length === 0) {

            throw new Error(
                'No platform nodes with IP addresses found in Terraform topology'
            );
        }


        /*
         * Build ONE command containing
         * all ping checks.
         */
        const command =
            this.buildConnectivityCommand(
                nodes
            );


        console.error(
            `Checking ${nodes.length} platform nodes ` +
            `from target host using ONE SSH session`
        );


        /*
         * THIS IS THE ONLY SSH CALL.
         *
         * It creates:
         *
         * MCP
         *   ↓
         * Jump Host
         *   ↓
         * Target Host
         *
         * The target then runs all pings.
         */
        const sshResult =
            await this.sshService
                .executeThroughJumpHost(
                    this.accessPath,
                    command
                );


        console.error(
            'SSH exit code:',
            sshResult.exitCode
        );

        console.error(
            'SSH stdout:',
            sshResult.stdout
        );

        console.error(
            'SSH stderr:',
            sshResult.stderr
        );


        /*
         * Parse the results from the
         * single remote command.
         */
        const results =
            this.parseResults(
                sshResult.stdout,
                sshResult.stderr,
                sshResult.exitCode,
                nodes
            );


        /*
         * Count reachable nodes.
         */
        const reachableNodes =
            results.filter(
                (node) => node.reachable
            ).length;


        return {

            checked_at:
                new Date().toISOString(),

            total_nodes:
                results.length,

            reachable_nodes:
                reachableNodes,

            unreachable_nodes:
                results.length -
                reachableNodes,

            nodes:
                results,
        };
    }
}