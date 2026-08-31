export type PlatformNodeRole =
    | 'control-plane'
    | 'etcd'
    | 'repository'
    | 'router'
    | 'unknown';

export interface PlatformNode {
    name: string;
    address: string;
    role: PlatformNodeRole;
    ssh_port: number;
}

export interface NodeConnectivityResult {
    name: string;
    address: string;
    role: PlatformNodeRole;
    port: number;
    reachable: boolean;

    latency_ms?: number;
    error?: string;
}

export interface PlatformConnectivity {
    checked_at: string;

    total_nodes: number;
    reachable_nodes: number;
    unreachable_nodes: number;

    nodes: NodeConnectivityResult[];
}