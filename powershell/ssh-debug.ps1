$ErrorActionPreference = 'Continue'

$output = & ssh `
  -i C:\Users\Administrator\.ssh\mcp_win10_ed25519 `
  -p 22222 `
  mcp-ssh@192.168.22.40 `
  "ssh -vvv -p 22222 -i C:\ProgramData\platform-mcp\ssh\mcp_win10_ed25519 -o BatchMode=yes -o StrictHostKeyChecking=no mcp@192.168.13.50 whoami" `
  2>&1

$output | Out-String | Set-Content D:\temp\ssh-debug.txt

Write-Host "===== SSH OUTPUT ====="
Get-Content D:\temp\ssh-debug.txt