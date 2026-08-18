# Load local configuration
. "$PSScriptRoot\config.ps1"

# Ensure the execution policy is set correctly
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser -Force

# Set PowerCLI configuration to ignore invalid certificates
Set-PowerCLIConfiguration -InvalidCertificateAction Ignore -Confirm:$false


$password = Read-Host -Prompt "Enter your vSphere password" -AsSecureString
$cred = New-Object System.Management.Automation.PSCredential($VsphereConfig.Username, $password)

Connect-VIServer -Server $VsphereConfig.Server -Credential $cred

Write-Host ""
Write-Host "Starting VM startup sequence"
Write-Host "========================================"

foreach ($group in $StartupGroups) {

    Write-Host ""
    Write-Host "Starting startup group..."
    Write-Host "----------------------------------------"

    foreach ($vmName in $group) {

        try {

            $vmObj = Get-VM -Name $vmName -ErrorAction Stop

            Write-Host "VM: $($vmObj.Name)"
            Write-Host "Power State: $($vmObj.PowerState)"

            if ($vmObj.PowerState -eq "PoweredOff") {

                Start-VM `
                    -VM $vmObj `
                    -Confirm:$false

                Write-Host "VM: $($vmObj.Name) is powering on"
            }
            else {

                Write-Host "VM: $($vmObj.Name) is already $($vmObj.PowerState)"
            }

        }
        catch {

            Write-Host "Failed to power on VM: $vmName"
            Write-Host "Error: $_"
        }
    }

    Write-Host ""
    Write-Host "Waiting $StartupGroupDelaySeconds seconds before next group..."

    Start-Sleep -Seconds $StartupGroupDelaySeconds
}

Write-Host ""
Write-Host "Startup sequence completed."

# Disconnect from vSphere
Disconnect-VIServer `
    -Server $VsphereConfig.Server `
    -Confirm:$false