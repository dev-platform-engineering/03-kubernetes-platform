export interface TerraformOutputWrapper<T> {
    value: T;
    type: string;
    sensitive: boolean;
}

export interface VirtualMachine {
    id: string;
    moid: string;
    name: string;
    uuid: string;

    ip_address?: string;
}

export interface VyosRouter {
    id: string;
    name: string;
    uuid: string;

    ip_address?: string;
}

export interface Foundation {
    child_resource_pools: Record<string, string>;

    datacenter_id: string;

    datastores: Record<string, string>;

    esxi_host_id: string;

    folders: Record<string, string>;

    kubernetes_folders: Record<string, string>;

    networks: Record<string, string>;

    root_resource_pool: {
        id: string;
        name: string;
    };
}

export interface ClusterTopology {
    compute: {
        linux_vms: Record<string, VirtualMachine>;
    };

    foundation: Foundation;

    network: {
        vyos: Record<string, VyosRouter>;
    };
}

export interface PlatformTerraformOutputs {
    platform_topology:
    TerraformOutputWrapper<ClusterTopology>;
}