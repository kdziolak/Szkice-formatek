Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
$frontendDir = Join-Path $repoRoot 'frontend'
$activateNodeScript = Join-Path $PSScriptRoot 'use-node22.ps1'

& $activateNodeScript
Push-Location $frontendDir
try {
    npm ci
    npm run build
    npm run test
}
finally {
    Pop-Location
}
