import { spawn } from 'node:child_process';

import type {
    SshAccessPath,
    SshCommandResult,
    SshConnection,
} from '../types/ssh.js';


export class SshService {

    /*
     * Execute a command directly on a host.
     *
     * Example:
     *
     * ssh -p 22222 -i key user@host "whoami"
     */
    public execute(
        connection: SshConnection,
        command: string
    ): Promise<SshCommandResult> {

        const args =
            this.buildConnectionArgs(connection);

        args.push(
            `${connection.username}@${connection.host}`,
            command
        );

        return this.runSsh(args);
    }


    /*
     * Execute ONE command on the target host
     * through the Jump Host.
     *
     * Architecture:
     *
     * MCP
     *   |
     *   | SSH
     *   | jumpHost key
     *   v
     * Jump Host
     *   |
     *   | SSH
     *   | targetHost key
     *   v
     * Target Host
     *
     * The target private key exists on the
     * Jump Host.
     *
     * Therefore we intentionally use nested SSH
     * instead of ProxyJump/ProxyCommand.
     */
    public executeThroughJumpHost(
        accessPath: SshAccessPath,
        command: string
    ): Promise<SshCommandResult> {

        /*
         * Build the SSH command that will run
         * FROM THE JUMP HOST.
         *
         * Example:
         *
         * ssh -p 22222
         *     -i C:/ProgramData/platform-mcp/ssh/key
         *     mcp@192.168.13.50
         *     "ping ..."
         */
        const targetArgs: string[] = [

            'ssh',

            '-p',
            String(
                accessPath.targetHost.port
            ),

            '-o',
            'BatchMode=yes',

            '-o',
            'ConnectTimeout=5',
        ];


        /*
         * Target private key.
         *
         * IMPORTANT:
         *
         * This path is interpreted on the
         * Jump Host, not on the MCP server.
         */
        if (accessPath.targetHost.privateKeyPath) {

            targetArgs.push(
                '-i',
                accessPath.targetHost.privateKeyPath
            );
        }


        /*
         * Target host.
         */
        targetArgs.push(
            `${accessPath.targetHost.username}` +
            `@${accessPath.targetHost.host}`
        );


        /*
         * The command that should execute
         * on the target.
         *
         * We put it into the remote SSH command.
         */
        targetArgs.push(command);


        /*
         * Convert the target SSH arguments
         * into the command executed on the
         * Jump Host.
         *
         * Example:
         *
         * ssh -p 22222 \
         *     -i C:/ProgramData/.../key \
         *     mcp@192.168.13.50 \
         *     "ping ..."
         */
        const remoteCommand =
            targetArgs
                .map((arg) => this.quoteRemoteArgument(arg))
                .join(' ');


        console.error(
            'SSH jump host:',
            `${accessPath.jumpHost.username}` +
            `@${accessPath.jumpHost.host}`
        );

        console.error(
            'SSH target:',
            `${accessPath.targetHost.username}` +
            `@${accessPath.targetHost.host}`
        );

        console.error(
            'Remote command:',
            command
        );


        /*
         * Now create the OUTER SSH connection.
         *
         * This is the only SSH connection created
         * by the MCP process.
         */
        return this.execute(
            accessPath.jumpHost,
            remoteCommand
        );
    }


    /*
     * Build arguments for a normal SSH connection.
     */
    private buildConnectionArgs(
        connection: SshConnection
    ): string[] {

        const args: string[] = [

            '-p',
            String(connection.port),

            /*
             * Never ask for a password.
             */
            '-o',
            'BatchMode=yes',

            /*
             * Don't hang indefinitely.
             */
            '-o',
            'ConnectTimeout=5',
        ];


        /*
         * Private key used for this connection.
         */
        if (connection.privateKeyPath) {

            args.push(
                '-i',
                connection.privateKeyPath
            );
        }


        return args;
    }


    /*
     * Quote an argument that will be passed
     * through the Jump Host shell.
     *
     * We use double quotes and escape
     * characters that are special to a
     * Windows command shell.
     *
     * Our generated commands currently contain
     * trusted IP addresses and fixed SSH options,
     * but keeping quoting here makes the boundary
     * explicit.
     */
    private quoteRemoteArgument(
        value: string
    ): string {

        /*
         * Escape double quotes.
         */
        const escaped =
            value.replace(/"/g, '\\"');

        return `"${escaped}"`;
    }


    /*
     * Start ssh.exe.
     *
     * stdout:
     *     remote command output
     *
     * stderr:
     *     SSH diagnostics/errors
     *
     * exitCode:
     *     SSH/remote command exit code
     */
    private runSsh(
        args: string[]
    ): Promise<SshCommandResult> {

        return new Promise(
            (resolve, reject) => {

                const ssh =
                    spawn(
                        'ssh',
                        args
                    );


                let stdout = '';
                let stderr = '';


                /*
                 * Remote command output.
                 */
                ssh.stdout.on(
                    'data',
                    (data: Buffer) => {

                        stdout +=
                            data.toString();
                    }
                );


                /*
                 * SSH diagnostics.
                 */
                ssh.stderr.on(
                    'data',
                    (data: Buffer) => {

                        stderr +=
                            data.toString();
                    }
                );


                /*
                 * ssh.exe itself could not
                 * be started.
                 */
                ssh.on(
                    'error',
                    reject
                );


                /*
                 * SSH process finished.
                 */
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
            }
        );
    }
}