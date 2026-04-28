Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
$runtimeRoot = Join-Path $repoRoot '.local-runtime'
$cacheRoot = Join-Path $repoRoot '.local-cache\downloads'
$targetDir = Join-Path $runtimeRoot 'java-21'
$stagingDir = Join-Path $runtimeRoot ('_java-21-extract-' + [Guid]::NewGuid().ToString())
$archivePath = Join-Path $cacheRoot 'temurin-21-jdk-windows-x64.zip'
$downloadUrl = 'https://api.adoptium.net/v3/binary/latest/21/ga/windows/x64/jdk/hotspot/normal/eclipse'

function Resolve-VerifiedPath {
    param(
        [Parameter(Mandatory = $true)]
        [string] $PathToCheck,
        [Parameter(Mandatory = $true)]
        [string] $RootPath
    )

    $resolvedRoot = [System.IO.Path]::GetFullPath($RootPath)
    $resolvedPath = [System.IO.Path]::GetFullPath($PathToCheck)

    if (-not $resolvedPath.StartsWith($resolvedRoot, [System.StringComparison]::OrdinalIgnoreCase)) {
        throw "Refusing to operate outside repo root: $resolvedPath"
    }

    return $resolvedPath
}

$verifiedTargetDir = Resolve-VerifiedPath -PathToCheck $targetDir -RootPath $repoRoot
$verifiedStagingDir = Resolve-VerifiedPath -PathToCheck $stagingDir -RootPath $repoRoot
$verifiedArchivePath = Resolve-VerifiedPath -PathToCheck $archivePath -RootPath $repoRoot

if (Test-Path (Join-Path $verifiedTargetDir 'bin\java.exe')) {
    Write-Host "Repo-local Java 21 is already installed at $verifiedTargetDir"
    & (Join-Path $verifiedTargetDir 'bin\java.exe') -version
    exit 0
}

New-Item -ItemType Directory -Path $runtimeRoot -Force | Out-Null
New-Item -ItemType Directory -Path $cacheRoot -Force | Out-Null

if (-not (Test-Path $verifiedArchivePath)) {
    Write-Host "Downloading Temurin JDK 21 to $verifiedArchivePath"
    [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
    Invoke-WebRequest -Uri $downloadUrl -OutFile $verifiedArchivePath
}
else {
    Write-Host "Using cached Temurin JDK 21 archive at $verifiedArchivePath"
}

if (Test-Path $verifiedTargetDir) {
    Remove-Item -LiteralPath $verifiedTargetDir -Recurse -Force
}

New-Item -ItemType Directory -Path $verifiedStagingDir -Force | Out-Null
Expand-Archive -LiteralPath $verifiedArchivePath -DestinationPath $verifiedStagingDir -Force

$extractedJavaDir = Get-ChildItem -LiteralPath $verifiedStagingDir -Directory |
    Where-Object { Test-Path (Join-Path $_.FullName 'bin\java.exe') } |
    Select-Object -First 1

if (-not $extractedJavaDir) {
    throw "Downloaded archive does not contain a JDK directory with bin\java.exe"
}

Move-Item -LiteralPath $extractedJavaDir.FullName -Destination $verifiedTargetDir
Remove-Item -LiteralPath $verifiedStagingDir -Recurse -Force

Write-Host "Installed repo-local Java 21 to $verifiedTargetDir"
& (Join-Path $verifiedTargetDir 'bin\java.exe') -version
