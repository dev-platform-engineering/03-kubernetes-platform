import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { TerraformService } from './services/terraform.service.js';
import { PlatformTopologyTool } from './tools/platform-topology.tool.js';

export class PlatformMcpServer {
    private readonly server: McpServer;
    private readonly terraformService: TerraformService;

    constructor() {
        this.server = new McpServer({
            name: 'platform-mcp',
            version: '1.0.0',
        });

        this.terraformService = new TerraformService();

        this.registerTools();
    }

    private registerTools(): void {
        const topologyTool = new PlatformTopologyTool(this.terraformService);

        this.server.tool(
            topologyTool.getName(),
            topologyTool.getDescription(),
            topologyTool.getSchema(),
            () => topologyTool.execute()
        );
    }

    async start(): Promise<void> {
        const transport = new StdioServerTransport();
        await this.server.connect(transport);
        console.error('Platform MCP server running on stdio');
    }
}
