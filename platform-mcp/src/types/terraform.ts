export interface TerraformOutputWrapper<T> {
    value: T;
    type: string;
    sensitive: boolean;
}

export interface ClusterTopology {
    cluster_name: string;
    environment: 'dev' | 'stage' | 'prod' | string;
    vpc_id: string;
    region: string;
    control_plane_version: string;
    node_groups: NodeGroupInfo[];
}

export interface NodeGroupInfo {
    name: string;
    instance_type: string;
    min_size: number;
    max_size: number;
    desired_size: number;
    labels: Record<string, string>;
}

export interface PlatformTerraformOutputs {
    platform_topology: TerraformOutputWrapper<ClusterTopology>;

    // kubeconfig_path?: TerraformOutputWrapper<string>;
}
