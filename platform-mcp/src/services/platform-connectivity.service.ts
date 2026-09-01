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

    constructor(
        private readonly terraformService: TerraformService,
        private readonly sshService: SshService,
        private readonly accessPath: SshAccessPath
    ) { }

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

    private extractNodes(
        topology: ClusterTopology
    ): PlatformNode[] {
        const nodes: PlatformNode[] = [];

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

    private async checkNode(
        node: PlatformNode
    ): Promise<NodeConnectivityResult> {
        const port =
            node.ssh_port ??
            this.defaultSshPort;

        const command =
            `nc -z -w 3 ${node.address} ${port}`;

        const result =
            await this.sshService.executeThroughJumpHost(
                this.accessPath,
                command
            );

        return {
            name: node.name,
            address: node.address,
            role: node.role,
            port,
            reachable: result.exitCode === 0,
            ...(result.exitCode !== 0
                ? {
                    error:
                        result.stderr.trim() ||
                        result.stdout.trim() ||
                        `Connection check failed with exit code ${result.exitCode}`,
                }
                : {}),
        };
    }

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

            nodes: results,
        };
    }
}