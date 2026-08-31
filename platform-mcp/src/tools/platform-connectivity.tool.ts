import type {
    ConnectivityService,
} from '../services/connectivity.service.js';


export class PlatformConnectivityTool {
    constructor(
        private readonly connectivityService:
            ConnectivityService
    ) { }

    public getName(): string {
        return 'check_platform_connectivity';
    }

    public getDescription(): string {
        return (
            'Checks TCP connectivity to SSH ports ' +
            'of all nodes in the platform topology'
        );
    }

    public getSchema() {
        return {};
    }

    public async execute() {
        try {
            const connectivity =
                await this.connectivityService
                    .checkPlatformConnectivity();

            return {
                content: [
                    {
                        type: 'text' as const,

                        text: JSON.stringify(
                            connectivity,
                            null,
                            2
                        ),
                    },
                ],
            };
        } catch (error) {
            const message =
                error instanceof Error
                    ? error.message
                    : 'Unknown error';

            return {
                isError: true,

                content: [
                    {
                        type: 'text' as const,

                        text:
                            'Failed to check platform connectivity: ' +
                            message,
                    },
                ],
            };
        }
    }
}