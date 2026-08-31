import net from 'node:net';

import type {
    PlatformNode,
} from '../types/terraform.js';

import type {
    NodeConnectivityResult,
    PlatformConnectivity,
} from '../types/connectivity.js';

import { TerraformService } from './terraform.service.js';


export class ConnectivityService {
    private readonly defaultSshPort = 22;

    private readonly timeoutMs = 3000;

    constructor(
        private readonly terraformService: TerraformService
    ) { }

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
                            `${this.timeoutMs}ms`,
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

    public async checkPlatformConnectivity():
        Promise<PlatformConnectivity> {

        const topology =
            await this.terraformService
                .getPlatformTopology();

        const results =
            await Promise.all(
                topology.nodes.map(
                    (node) =>
                        this.checkNode(node)
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