import { exec } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import type { ClusterTopology } from '../types/terraform.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class TerraformService {
    // Список усіх шарів інфраструктури для сканування
    private readonly layers: string[];
    private readonly terraformBaseDir: string;

    constructor() {
        this.terraformBaseDir = path.resolve(__dirname, '../../../terraform');
        this.layers = ['01-foundation', '02-network', '03-compute'];
    }

    private async getLayerOutputs(layerPath: string): Promise<Record<string, any>> {
        return new Promise((resolve) => {
            exec('terraform output -json', { cwd: layerPath }, (error, stdout) => {
                if (error) {

                    return resolve({});
                }
                try {
                    resolve(JSON.parse(stdout));
                } catch {
                    resolve({});
                }
            });
        });
    }

    async getPlatformTopology(): Promise<ClusterTopology> {
        let combinedOutputs: Record<string, any> = {};

        for (const layer of this.layers) {
            const layerPath = path.join(this.terraformBaseDir, layer);
            const layerOutputs = await this.getLayerOutputs(layerPath);

            combinedOutputs = { ...combinedOutputs, ...layerOutputs };
        }

        if (!combinedOutputs.platform_topology) {
            throw new Error(
                `Output 'platform_topology' not found in any Terraform layers (${this.layers.join(', ')}). ` +
                `Перевірте, чи додали ви блок output в один із цих шарів та чи виконали terraform apply.`
            );
        }

        return combinedOutputs.platform_topology.value;
    }
}
