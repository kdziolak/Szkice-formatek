Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
$frontendDir = Join-Path $repoRoot 'frontend'
$activateNodeScript = Join-Path $PSScriptRoot 'use-node22.ps1'

function Invoke-Step {
    param(
        [Parameter(Mandatory = $true)]
        [string] $Command,
        [Parameter(Mandatory = $true)]
        [string[]] $Arguments
    )

    & $Command @Arguments
    if ($LASTEXITCODE -ne 0) {
        throw "Command failed with exit code ${LASTEXITCODE}: $Command $($Arguments -join ' ')"
    }
}

& $activateNodeScript
Push-Location $frontendDir
try {
    Invoke-Step -Command 'npm' -Arguments @('ci')
    Invoke-Step -Command 'npm' -Arguments @('run', 'build')
    Invoke-Step -Command 'npm' -Arguments @('run', 'test')
}
finally {
    Pop-Location
}
