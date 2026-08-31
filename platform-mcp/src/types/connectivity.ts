export interface NodeConnectivityResult {
    name: string;
    address: string;
    role: string;
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