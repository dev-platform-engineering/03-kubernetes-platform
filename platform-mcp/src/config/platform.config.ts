import type {
    SshAccessPath,
} from '../types/ssh.js';


export const platformAccessPath:
    SshAccessPath = {

    jumpHost: {
        host: '192.168.22.40',
        port: 22222,
        username: 'mcp-ssh',
    },

    targetHost: {
        host: '192.168.13.50',
        port: 22,
        username: 'ansible',
    },
};