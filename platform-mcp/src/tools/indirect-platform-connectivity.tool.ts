import {
    PlatformConnectivityService,
} from '../services/platform-connectivity.service.js';


export class IndirectPlatformConnectivityTool {
    constructor(
        private readonly platformConnectivityService:
            PlatformConnectivityService
    ) { }

    public getName(): string {
        return 'check_platform_connectivity_indirect';
    }

    public getDescription(): string {
        return (
            'Checks platform node connectivity through ' +
            'the configured SSH access path'
        );
    }

    public getSchema() {
        return {};
    }

    public async execute() {
        const result =
            await this.platformConnectivityService
                .checkPlatformConnectivity();

        return {
            content: [
                {
                    type: 'text' as const,
                    text: JSON.stringify(
                        result,
                        null,
                        2
                    ),
                },
            ],
        };
    }
}