import { PlatformMcpServer } from './server.js';

const mcpServer = new PlatformMcpServer();

mcpServer.start().catch((error) => {
    console.error('Fatal error starting MCP server:', error);
    process.exit(1);
});