import { spawn } from 'node:child_process';

import type {
    SshAccessPath,
    SshCommandResult,
    SshConnection,
} from '../types/ssh.js';


export class SshService {
    public execute(
        connection: SshConnection,
        command: string
    ): Promise<SshCommandResult> {

        const args: string[] = [
            '-p',
            String(connection.port),
        ];

        if (connection.privateKeyPath) {
            args.push(
                '-i',
                connection.privateKeyPath
            );
        }

        args.push(
            `${connection.username}@${connection.host}`,
            command
        );

        return new Promise((resolve, reject) => {
            const ssh = spawn(
                'ssh',
                args
            );

            let stdout = '';
            let stderr = '';

            ssh.stdout.on(
                'data',
                (data: Buffer) => {
                    stdout += data.toString();
                }
            );

            ssh.stderr.on(
                'data',
                (data: Buffer) => {
                    stderr += data.toString();
                }
            );

            ssh.on(
                'error',
                (error) => {
                    reject(error);
                }
            );

            ssh.on(
                'close',
                (exitCode) => {
                    resolve({
                        stdout,
                        stderr,
                        exitCode:
                            exitCode ?? -1,
                    });
                }
            );
        });
    }

    public executeThroughJumpHost(
        accessPath: SshAccessPath,
        command: string
    ): Promise<SshCommandResult> {

        const target =
            `${accessPath.targetHost.username}` +
            `@${accessPath.targetHost.host}`;

        const remoteCommand =
            `ssh -p ${accessPath.targetHost.port} ` +
            `${target} "${command}"`;

        return this.execute(
            accessPath.jumpHost,
            remoteCommand
        );
    }
}