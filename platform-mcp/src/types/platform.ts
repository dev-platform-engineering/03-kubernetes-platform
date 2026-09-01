export interface PlatformNode {
    name: string;
    address: string;
    role: string;
    sshPort?: number;
}

export interface ConnectivityResult {
    name: string;
    address: string;
    role: string;
    reachable: boolean;
    error?: string;
}

export interface PlatformConnectivity {
    checkedAt: string;
    totalNodes: number;
    reachableNodes: number;
    unreachableNodes: number;
    nodes: ConnectivityResult[];
}