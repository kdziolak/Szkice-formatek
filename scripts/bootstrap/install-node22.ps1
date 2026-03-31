Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
$runtimeRoot = Join-Path $repoRoot '.local-runtime'
$cacheRoot = Join-Path $repoRoot '.local-cache\downloads'
$targetDir = Join-Path $runtimeRoot 'node-22.12.0'
$stagingDir = Join-Path $runtimeRoot ('_node-22.12.0-extract-' + [Guid]::NewGuid().ToString())
$archivePath = Join-Path $cacheRoot 'node-v22.12.0-win-x64.zip'
$downloadUrl = 'https://nodejs.org/dist/v22.12.0/node-v22.12.0-win-x64.zip'

function Ensure-NpmWrappers {
    param(
        [Parameter(Mandatory = $true)]
        [string] $NodeHome
    )

    $npmCmdPath = Join-Path $NodeHome 'npm.cmd'
    $npxCmdPath = Join-Path $NodeHome 'npx.cmd'
    $npmWrapper = "@echo off`r`n""%~dp0node.exe"" ""%~dp0node_modules\\npm\\bin\\npm-cli.js"" %*`r`n"
    $npxWrapper = "@echo off`r`n""%~dp0node.exe"" ""%~dp0node_modules\\npm\\bin\\npx-cli.js"" %*`r`n"

    Set-Content -LiteralPath $npmCmdPath -Value $npmWrapper -Encoding ASCII
    Set-Content -LiteralPath $npxCmdPath -Value $npxWrapper -Encoding ASCII
}

function Ensure-NpmPackage {
    param(
        [Parameter(Mandatory = $true)]
        [string] $NodeHome
    )

    $localNpmRoot = Join-Path $NodeHome 'node_modules\npm'
    $localNpmPackageJson = Join-Path $localNpmRoot 'package.json'
    $localNpmCli = Join-Path $localNpmRoot 'bin\npm-cli.js'

    if ((Test-Path $localNpmPackageJson) -and (Test-Path $localNpmCli)) {
        return
    }

    $globalNpmCommand = Get-Command npm -ErrorAction SilentlyContinue
    if (-not $globalNpmCommand) {
        throw "Global npm command is unavailable; cannot seed repo-local npm package."
    }

    $globalNpmRoot = Join-Path ([System.IO.Path]::GetDirectoryName($globalNpmCommand.Source)) 'node_modules\npm'
    $globalNpmPackageJson = Join-Path $globalNpmRoot 'package.json'

    if (-not (Test-Path $globalNpmPackageJson)) {
        throw "Global npm package root not found at $globalNpmRoot"
    }

    New-Item -ItemType Directory -Path (Join-Path $NodeHome 'node_modules') -Force | Out-Null
    if (Test-Path $localNpmRoot) {
        Remove-Item -LiteralPath $localNpmRoot -Recurse -Force
    }

    New-Item -ItemType Directory -Path $localNpmRoot -Force | Out-Null
    Copy-Item -Path (Join-Path $globalNpmRoot '*') -Destination $localNpmRoot -Recurse -Force
}

function Test-NodeInstallation {
    param(
        [Parameter(Mandatory = $true)]
        [string] $NodeHome
    )

    return (Test-Path (Join-Path $NodeHome 'node.exe')) -and
        (Test-Path (Join-Path $NodeHome 'npm.cmd')) -and
        (Test-Path (Join-Path $NodeHome 'node_modules\npm\package.json'))
}

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

if (Test-Path (Join-Path $verifiedTargetDir 'node.exe')) {
    Ensure-NpmPackage -NodeHome $verifiedTargetDir
    Ensure-NpmWrappers -NodeHome $verifiedTargetDir

    if (Test-NodeInstallation -NodeHome $verifiedTargetDir) {
        Write-Host "Repo-local Node 22.12.0 is already installed at $verifiedTargetDir"
        & (Join-Path $verifiedTargetDir 'node.exe') -v
        & (Join-Path $verifiedTargetDir 'npm.cmd') -v
        exit 0
    }
}

New-Item -ItemType Directory -Path $runtimeRoot -Force | Out-Null
New-Item -ItemType Directory -Path $cacheRoot -Force | Out-Null

if (-not (Test-Path $verifiedArchivePath)) {
    Write-Host "Downloading Node 22.12.0 to $verifiedArchivePath"
    [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
    Invoke-WebRequest -Uri $downloadUrl -OutFile $verifiedArchivePath
}
else {
    Write-Host "Using cached Node 22.12.0 archive at $verifiedArchivePath"
}

if (Test-Path $verifiedTargetDir) {
    Remove-Item -LiteralPath $verifiedTargetDir -Recurse -Force
}

New-Item -ItemType Directory -Path $verifiedStagingDir -Force | Out-Null
Expand-Archive -LiteralPath $verifiedArchivePath -DestinationPath $verifiedStagingDir -Force

$extractedNodeDir = Get-ChildItem -LiteralPath $verifiedStagingDir -Directory |
    Where-Object { Test-Path (Join-Path $_.FullName 'node.exe') } |
    Select-Object -First 1

if (-not $extractedNodeDir) {
    throw "Downloaded archive does not contain a Node directory with node.exe"
}

Move-Item -LiteralPath $extractedNodeDir.FullName -Destination $verifiedTargetDir
Remove-Item -LiteralPath $verifiedStagingDir -Recurse -Force
Ensure-NpmPackage -NodeHome $verifiedTargetDir
Ensure-NpmWrappers -NodeHome $verifiedTargetDir

Write-Host "Installed repo-local Node 22.12.0 to $verifiedTargetDir"
& (Join-Path $verifiedTargetDir 'node.exe') -v
& (Join-Path $verifiedTargetDir 'npm.cmd') -v
