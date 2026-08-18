$VsphereConfig = @{
    Server   = "10.."
    Username = "esxi@corp"
}

#resource pools
$ParentResourcePoolName = "RP-Platform"

# Additional VMs outside the Resource Pool hierarchy
$AdditionalVMs = @(
    "vm1",
    "vm3"
)

# Startup groups
$StartupGroups = @(
    @(
        "vyos-router-01",
        "vyos-router-02"
    ),
    @(
        "repo-01"
    ),
    @(
        "etcd-01",
        "etcd-02",
        "etcd-03"
    ),
    @(
        "k8s-master-01",
        "k8s-master-02",
        "k8s-master-03"
    ),
    @(
        "k8s-worker-01",
        "k8s-worker-02"
    )
)

# Delay between groups
$StartupGroupDelaySeconds = 60