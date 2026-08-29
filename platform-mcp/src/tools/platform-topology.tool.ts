import { z } from 'zod';
import type { TerraformService } from '../services/terraform.service.js';

export class PlatformTopologyTool {
    constructor(private readonly terraformService: TerraformService) { }

    public getName(): string {
        return 'get_platform_topology';
    }

    public getDescription(): string {
        return 'Retrieves the current Kubernetes platform infrastructure topology from Terraform state outputs';
    }

    public getSchema() {
        return {};
    }

    public async execute() {
        try {
            const topology = await this.terraformService.getPlatformTopology();

            return {
                content: [
                    {
                        type: 'text' as const,
                        text: JSON.stringify(topology, null, 2),
                    },
                ],
            };
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            return {
                isError: true,
                content: [
                    {
                        type: 'text' as const,
                        text: `Failed to retrieve platform topology: ${message}`,
                    },
                ],
            };
        }
    }
}
