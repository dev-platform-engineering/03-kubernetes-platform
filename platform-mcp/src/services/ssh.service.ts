import { spawn } from 'node:child_process';

import type {
    SshCommandResult,
    SshConnection,
} from '../types/ssh.js';


export class SshService {
    public execute(
        connection: SshConnection,
        command: string
    ): Promise<SshCommandResult> {
        return new Promise((resolve, reject) => {
            const ssh = spawn(
                'ssh',
                [
                    '-p',
                    String(connection.port),

                    `${connection.username}@${connection.host}`,

                    command,
                ]
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
                        exitCode: exitCode ?? -1,
                    });
                }
            );
        });
    }
}