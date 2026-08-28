# Load local configuration
. "$PSScriptRoot\config.ps1"

# Ensure the execution policy is set correctly
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser -Force

# Set PowerCLI configuration to ignore invalid certificates
Set-PowerCLIConfiguration -InvalidCertificateAction Ignore -Confirm:$false


$password = Read-Host -Prompt "Enter your vSphere password" -AsSecureString
$cred = New-Object System.Management.Automation.PSCredential($VsphereConfig.Username, $password)

Connect-VIServer -Server $VsphereConfig.Server -Credential $cred

# Get parent Resource Pool
$resourcePool = Get-ResourcePool -Name $ParentResourcePoolName

if ($resourcePool) {

    Write-Host "Resource Pool: $ParentResourcePoolName found."

    # Get Resource Pool and its children
    $resourcePools = Get-ResourcePool |
        Where-Object {
            $_.Id -eq $resourcePool.Id -or
            $_.ParentId -eq $resourcePool.Id
        }

    # Collect VMs
    $vmsInResourcePool = @()

    foreach ($rp in $resourcePools) {

        Write-Host "VMs in Resource Pool: $($rp.Name)"

        $vms = $rp.ExtensionData.Vm | ForEach-Object {
            Get-View -Id $_
        }

        $vms | ForEach-Object {
            Write-Host "  $($_.Name)"
        }

        $vmsInResourcePool += $vms
    }

    # Add additional VMs from config
    foreach ($vmName in $AdditionalVMs) {

        try {
            $vm = Get-VM -Name $vmName -ErrorAction Stop |
                Get-View

            Write-Host "Additional VM: $($vm.Name)"

            $vmsInResourcePool += $vm
        }
        catch {
            Write-Host "Additional VM '$vmName' not found."
        }
    }

    # Remove duplicates
    $vmsInResourcePool = $vmsInResourcePool |
        Sort-Object MoRef -Unique

    Write-Host ""
    Write-Host "Powering off VMs..."

    foreach ($vm in $vmsInResourcePool) {

        try {

            $vmObj = Get-VM -Id $vm.MoRef

            if ($vmObj.PowerState -eq "PoweredOn") {

                Stop-VM -VM $vmObj -Confirm:$false

                Write-Host "VM: $($vm.Name) is being powered off"
            }
            else {
                Write-Host "VM: $($vm.Name) is already $($vmObj.PowerState)"
            }

        }
        catch {
            Write-Host "Failed to initiate power off for VM: $($vm.Name) - Error: $_"
        }
    }
}
else {
    Write-Host "Resource Pool: $ParentResourcePoolName not found."
}
# Disconnect from vSphere
Disconnect-VIServer -Server $VsphereConfig.Server -Confirm:$false
