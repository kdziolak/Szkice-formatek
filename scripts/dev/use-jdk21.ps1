Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
$jdkHome = Join-Path $repoRoot '.local-runtime\jdk-21'
$javaExe = Join-Path $jdkHome 'bin\java.exe'

if (-not (Test-Path $javaExe)) {
    throw "Repo-local JDK 21 is missing. Run .\scripts\bootstrap\install-jdk21.ps1 first."
}

$env:JAVA_HOME = $jdkHome
$env:PATH = "$jdkHome\bin;$env:PATH"

Write-Host "JAVA_HOME=$env:JAVA_HOME"
& $javaExe -version

Push-Location $repoRoot
try {
    & '.\mvnw.cmd' -version
}
finally {
    Pop-Location
}
