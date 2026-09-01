export interface SshConnection {
    host: string;
    port: number;
    username: string;
    privateKeyPath?: string;
}

export interface SshAccessPath {
    jumpHost: SshConnection;
    targetHost: SshConnection;
}

export interface SshCommandResult {
    stdout: string;
    stderr: string;
    exitCode: number;
}