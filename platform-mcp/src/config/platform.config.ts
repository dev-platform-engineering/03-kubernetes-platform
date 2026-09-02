import type {
    SshAccessPath,
} from '../types/ssh.js';


export const platformAccessPath:
    SshAccessPath =
{
    jumpHost: {
        host: '192.168.22.40',
        port: 22222,
        username: 'mcp-ssh',

        privateKeyPath:
            'C:/Users/Administrator/.ssh/mcp_win10_ed25519',
        //debug: console.log
    },

    targetHost: {
        host: '192.168.13.50',
        port: 22222,
        username: 'mcp',

        privateKeyPath:
            //     'C:/Users/Administrator/.ssh/mcp_win10_ed25519',
            'C:/ProgramData/platform-mcp/ssh/mcp_win10_ed25519',
        //debug: console.log
    },
};