import { execFile } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import { fileURLToPath } from 'url';

import type { ClusterTopology } from '../types/terraform.js';

const execFileAsync = promisify(execFile);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class TerraformService {
    private readonly platformLayer = '04-platform';

    private readonly terraformBaseDir: string;

    constructor() {
        this.terraformBaseDir = path.resolve(
            __dirname,
            '../../../terraform'
        );
    }

    private async getLayerOutputs(
        layerPath: string
    ): Promise<Record<string, unknown>> {
        try {
            const { stdout } = await execFileAsync(
                'terraform',
                ['output', '-json'],
                {
                    cwd: layerPath,
                }
            );

            return JSON.parse(stdout) as Record<string, unknown>;
        } catch (error) {
            const message =
                error instanceof Error
                    ? error.message
                    : 'Unknown error';

            throw new Error(
                `Failed to get Terraform outputs from ${layerPath}: ${message}`
            );
        }
    }

    public async getPlatformTopology(): Promise<ClusterTopology> {
        const platformLayerPath = path.join(
            this.terraformBaseDir,
            this.platformLayer
        );

        const outputs =
            await this.getLayerOutputs(platformLayerPath);

        const platformTopology =
            outputs['platform_topology'];

        if (!platformTopology) {
            throw new Error(
                `Output 'platform_topology' not found in Terraform layer: ` +
                this.platformLayer
            );
        }

        return (
            platformTopology as {
                value: ClusterTopology;
            }
        ).value;
    }
}