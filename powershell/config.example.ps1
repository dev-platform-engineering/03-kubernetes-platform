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
        "ubuntu-route",
        "ubuntu-test-pr",
        "repo-01"
    ),
    @(
        "etcd-01", 
        "etcd-02", 
        "etcd-03"
    ),
    @(
        "lb-01",
        "lb-02"
    ),
    @(
        "cp-01",
        "cp-02",
        "cp-03"
    ),
    @(
        "worker-01",
        "worker-02",
        "worker-03"
    )
)

# Delay between groups
$StartupGroupDelaySeconds = 60

# Delay between VMs
$StartupVMDelaySeconds = 15