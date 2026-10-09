param()

$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
# Refresh PATH so newly installed user tools are available in both windows.
$env:Path = [Environment]::GetEnvironmentVariable('Path', 'Machine') + ';' + [Environment]::GetEnvironmentVariable('Path', 'User') + ';' + $env:Path
foreach ($tool in @('task', 'docker', 'node', 'pnpm')) {
    if (-not (Get-Command $tool -ErrorAction SilentlyContinue)) {
        throw "Missing $tool. See docs/petit-chef-development.md."
    }
}
foreach ($service in @(@{ Name = 'Backend'; Task = 'py'; Port = 9000 }, @{ Name = 'Frontend'; Task = 'ui'; Port = 3000 })) {
    if (Get-NetTCPConnection -LocalPort $service.Port -State Listen -ErrorAction SilentlyContinue) {
        throw "Port $($service.Port) is already in use. Stop or reuse that service before launching."
    }
}
foreach ($service in @(@{ Name = 'Backend'; Command = 'docker compose -f compose.petit-chef.yml up --build backend' }, @{ Name = 'Frontend'; Command = 'task ui' })) {
    $command = "`$Host.UI.RawUI.WindowTitle = 'Petit Chef - $($service.Name)'; $($service.Command)"
    $encodedCommand = [Convert]::ToBase64String([Text.Encoding]::Unicode.GetBytes($command))
    Start-Process powershell.exe -WorkingDirectory $projectRoot -WindowStyle Normal -ArgumentList @('-NoExit', '-EncodedCommand', $encodedCommand)
}
