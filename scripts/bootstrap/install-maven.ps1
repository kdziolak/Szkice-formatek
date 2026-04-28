Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$mavenVersion = '3.9.15'
$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
$runtimeRoot = Join-Path $repoRoot '.local-runtime'
$cacheRoot = Join-Path $repoRoot '.local-cache\downloads'
$javaHome = Join-Path $runtimeRoot 'java-21'
$targetDir = Join-Path $runtimeRoot "apache-maven-$mavenVersion"
$stagingDir = Join-Path $runtimeRoot ("_maven-$mavenVersion-extract-" + [Guid]::NewGuid().ToString())
$archivePath = Join-Path $cacheRoot "apache-maven-$mavenVersion-bin.zip"
$downloadUrl = "https://dlcdn.apache.org/maven/maven-3/$mavenVersion/binaries/apache-maven-$mavenVersion-bin.zip"

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

if (Test-Path (Join-Path $javaHome 'bin\java.exe')) {
    $env:JAVA_HOME = $javaHome
    $env:PATH = (Join-Path $javaHome 'bin') + ';' + $env:PATH
}

if (Test-Path (Join-Path $verifiedTargetDir 'bin\mvn.cmd')) {
    Write-Host "Repo-local Apache Maven $mavenVersion is already installed at $verifiedTargetDir"
    & (Join-Path $verifiedTargetDir 'bin\mvn.cmd') -version
    exit 0
}

New-Item -ItemType Directory -Path $runtimeRoot -Force | Out-Null
New-Item -ItemType Directory -Path $cacheRoot -Force | Out-Null

if (-not (Test-Path $verifiedArchivePath)) {
    Write-Host "Downloading Apache Maven $mavenVersion to $verifiedArchivePath"
    [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
    Invoke-WebRequest -Uri $downloadUrl -OutFile $verifiedArchivePath
}
else {
    Write-Host "Using cached Apache Maven $mavenVersion archive at $verifiedArchivePath"
}

if (Test-Path $verifiedTargetDir) {
    Remove-Item -LiteralPath $verifiedTargetDir -Recurse -Force
}

New-Item -ItemType Directory -Path $verifiedStagingDir -Force | Out-Null
Expand-Archive -LiteralPath $verifiedArchivePath -DestinationPath $verifiedStagingDir -Force

$extractedMavenDir = Get-ChildItem -LiteralPath $verifiedStagingDir -Directory |
    Where-Object { Test-Path (Join-Path $_.FullName 'bin\mvn.cmd') } |
    Select-Object -First 1

if (-not $extractedMavenDir) {
    throw "Downloaded archive does not contain a Maven directory with bin\mvn.cmd"
}

Move-Item -LiteralPath $extractedMavenDir.FullName -Destination $verifiedTargetDir
Remove-Item -LiteralPath $verifiedStagingDir -Recurse -Force

Write-Host "Installed repo-local Apache Maven $mavenVersion to $verifiedTargetDir"
& (Join-Path $verifiedTargetDir 'bin\mvn.cmd') -version
