import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { TerraformService } from './services/terraform.service.js';
import { ConnectivityService } from './services/connectivity.service.js';
import { SshService } from './services/ssh.service.js';
import { PlatformTopologyTool } from './tools/platform-topology.tool.js';
import { PlatformConnectivityTool } from './tools/platform-connectivity.tool.js';
import { platformAccessPath } from './config/platform.config.js';
import { PlatformConnectivityService } from './services/platform-connectivity.service.js';
import { IndirectPlatformConnectivityTool } from './tools/indirect-platform-connectivity.tool.js';

export class PlatformMcpServer {
    private readonly server: McpServer;
    private readonly terraformService: TerraformService;
    private readonly connectivityService: ConnectivityService;
    private readonly sshService: SshService;
    private readonly platformConnectivityService: PlatformConnectivityService;

    constructor() {
        this.server = new McpServer({
            name: 'platform-mcp',
            version: '1.0.0',
        });

        this.terraformService = new TerraformService();
        this.connectivityService = new ConnectivityService(this.terraformService);
        this.sshService = new SshService();
        this.platformConnectivityService = new PlatformConnectivityService(
            this.terraformService,
            this.sshService,
            platformAccessPath
        );

        this.registerTools();
    }

    private registerTools(): void {
        const topologyTool = new PlatformTopologyTool(this.terraformService);
        const connectivityTool = new PlatformConnectivityTool(this.connectivityService);
        const indirectConnectivityTool =
            new IndirectPlatformConnectivityTool(
                this.platformConnectivityService
            );

        this.server.tool(
            topologyTool.getName(),
            topologyTool.getDescription(),
            topologyTool.getSchema(),
            () => topologyTool.execute()
        );

        this.server.tool(
            connectivityTool.getName(),
            connectivityTool.getDescription(),
            connectivityTool.getSchema(),
            () => connectivityTool.execute()
        );

        this.server.tool(
            indirectConnectivityTool.getName(),
            indirectConnectivityTool.getDescription(),
            indirectConnectivityTool.getSchema(),
            () => indirectConnectivityTool.execute()
        );
    }

    async start(): Promise<void> {
        const transport = new StdioServerTransport();
        await this.server.connect(transport);
        console.error('Platform MCP server running on stdio');
    }
}
