Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
$nodeHome = Join-Path $repoRoot '.local-runtime\node-22.12.0'
$nodeExe = Join-Path $nodeHome 'node.exe'
$npmCmd = Join-Path $nodeHome 'npm.cmd'
$npmPackageJson = Join-Path $nodeHome 'node_modules\npm\package.json'
$npmCache = Join-Path $repoRoot '.local-cache\npm'

if ((-not (Test-Path $nodeExe)) -or (-not (Test-Path $npmCmd)) -or (-not (Test-Path $npmPackageJson))) {
    throw "Repo-local Node 22.12.0 is missing. Run .\scripts\bootstrap\install-node22.ps1 first."
}

New-Item -ItemType Directory -Path $npmCache -Force | Out-Null

$env:PATH = "$nodeHome;$env:PATH"
$env:npm_config_cache = $npmCache

Write-Host "NODE_HOME=$nodeHome"
Write-Host "npm_config_cache=$env:npm_config_cache"
& $nodeExe -v
& $npmCmd -v
