import net from 'node:net';

import { TerraformService } from './terraform.service.js';

import type {
    ClusterTopology,
} from '../types/terraform.js';

import type {
    NodeConnectivityResult,
    PlatformConnectivity,
    PlatformNode,
    PlatformNodeRole,
    TcpConnectivityResult,
} from '../types/connectivity.js';


export class ConnectivityService {
    private readonly defaultSshPort = 22;

    private readonly timeoutMs = 3000;

    constructor(
        private readonly terraformService: TerraformService
    ) { }

    /**
     * Determine the platform role based on the node name.
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

    /**
     * Convert Terraform topology into a normalized
     * list of platform nodes.
     */
    private extractNodes(
        topology: ClusterTopology
    ): PlatformNode[] {
        const nodes: PlatformNode[] = [];

        // Linux VMs
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

        // VyOS routers
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

    /**
     * Check TCP connectivity to a single platform node.
     *
     * This checks whether the SSH TCP port is reachable.
     * It does NOT perform SSH authentication.
     */
    private async checkNode(
        node: PlatformNode
    ): Promise<NodeConnectivityResult> {
        const port =
            node.ssh_port ??
            this.defaultSshPort;

        const startedAt =
            performance.now();

        return new Promise((resolve) => {
            const socket =
                new net.Socket();

            let completed = false;

            const finish = (
                result: NodeConnectivityResult
            ): void => {
                if (completed) {
                    return;
                }

                completed = true;

                socket.destroy();

                resolve(result);
            };

            socket.setTimeout(
                this.timeoutMs
            );

            socket.connect(
                port,
                node.address,
                () => {
                    const latencyMs =
                        Math.round(
                            performance.now() -
                            startedAt
                        );

                    finish({
                        name: node.name,
                        address: node.address,
                        role: node.role,
                        port,
                        reachable: true,
                        latency_ms: latencyMs,
                    });
                }
            );

            socket.on(
                'timeout',
                () => {
                    finish({
                        name: node.name,
                        address: node.address,
                        role: node.role,
                        port,
                        reachable: false,
                        error:
                            `Connection timeout after ` +
                            `${this.timeoutMs} ms`,
                    });
                }
            );

            socket.on(
                'error',
                (error) => {
                    finish({
                        name: node.name,
                        address: node.address,
                        role: node.role,
                        port,
                        reachable: false,
                        error: error.message,
                    });
                }
            );
        });
    }

    /**
     * Check connectivity to all platform nodes.
     */
    public async checkPlatformConnectivity():
        Promise<PlatformConnectivity> {
        const topology =
            await this.terraformService
                .getPlatformTopology();

        const nodes =
            this.extractNodes(topology);

        if (nodes.length === 0) {
            throw new Error(
                'No platform nodes with IP addresses found in Terraform topology'
            );
        }

        const results =
            await Promise.all(
                nodes.map(
                    (node) => this.checkNode(node)
                )
            );

        const reachableNodes =
            results.filter(
                (node) => node.reachable
            ).length;

        const unreachableNodes =
            results.length -
            reachableNodes;

        return {
            checked_at:
                new Date().toISOString(),

            total_nodes:
                results.length,

            reachable_nodes:
                reachableNodes,

            unreachable_nodes:
                unreachableNodes,

            nodes: results,
        };
    }

    public checkTcp(
        address: string,
        port: number
    ): Promise<TcpConnectivityResult> {
        const startedAt = performance.now();

        return new Promise((resolve) => {
            const socket = new net.Socket();

            let completed = false;

            const finish = (
                result: TcpConnectivityResult
            ): void => {
                if (completed) {
                    return;
                }

                completed = true;

                socket.destroy();

                resolve(result);
            };

            socket.setTimeout(
                this.timeoutMs
            );

            socket.connect(
                port,
                address,
                () => {
                    const latencyMs =
                        Math.round(
                            performance.now() -
                            startedAt
                        );

                    finish({
                        address,
                        port,
                        reachable: true,
                        latency_ms: latencyMs,
                    });
                }
            );

            socket.once(
                'timeout',
                () => {
                    finish({
                        address,
                        port,
                        reachable: false,
                        error:
                            `Connection timeout after ` +
                            `${this.timeoutMs}ms`,
                    });
                }
            );

            socket.once(
                'error',
                (error) => {
                    finish({
                        address,
                        port,
                        reachable: false,
                        error: error.message,
                    });
                }
            );
        });
    }
}
