Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
$activateJavaScript = Join-Path $PSScriptRoot 'use-jdk21.ps1'
$localMavenRepo = Join-Path $repoRoot '.local-cache\m2'

& $activateJavaScript
New-Item -ItemType Directory -Path $localMavenRepo -Force | Out-Null

Push-Location (Join-Path $repoRoot 'backend')
try {
    & '..\mvnw.cmd' "-Dmaven.repo.local=$localMavenRepo" test
}
finally {
    Pop-Location
}
