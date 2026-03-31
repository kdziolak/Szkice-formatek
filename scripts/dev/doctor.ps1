Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
$localJdkHome = Join-Path $repoRoot '.local-runtime\jdk-21'
$localJavaExe = Join-Path $localJdkHome 'bin\java.exe'
$localNodeHome = Join-Path $repoRoot '.local-runtime\node-22.12.0'
$localNodeExe = Join-Path $localNodeHome 'node.exe'
$localNpmCmd = Join-Path $localNodeHome 'npm.cmd'
$localNpmPackageJson = Join-Path $localNodeHome 'node_modules\npm\package.json'
$mavenWrapper = Join-Path $repoRoot 'mvnw.cmd'

$failures = New-Object System.Collections.Generic.List[string]

function Test-Tool {
    param(
        [Parameter(Mandatory = $true)]
        [string] $ToolName
    )

    if (Get-Command $ToolName -ErrorAction SilentlyContinue) {
        Write-Host "[OK] $ToolName is available"
        return $true
    }

    Write-Host "[FAIL] $ToolName is not available"
    $script:failures.Add("Missing tool: $ToolName")
    return $false
}

Write-Host "Checking local developer environment for Road GIS..."
Test-Tool -ToolName 'node' | Out-Null
Test-Tool -ToolName 'npm' | Out-Null

if (Test-Path $mavenWrapper) {
    Write-Host "[OK] Maven Wrapper is available"
}
else {
    Write-Host "[FAIL] Maven Wrapper is missing"
    $failures.Add('Missing file: mvnw.cmd')
}

if (Test-Path $localJavaExe) {
    Write-Host "[OK] Repo-local JDK 21 is installed"
    $javaVersionFile = Join-Path ([System.IO.Path]::GetTempPath()) ("road-gis-java-version-" + [Guid]::NewGuid().ToString() + '.log')

    try {
        Start-Process -FilePath $localJavaExe `
            -ArgumentList '-version' `
            -Wait `
            -NoNewWindow `
            -RedirectStandardError $javaVersionFile | Out-Null

        $javaVersion = Get-Content $javaVersionFile -Raw
        Write-Host $javaVersion
    }
    finally {
        if (Test-Path $javaVersionFile) {
            Remove-Item -LiteralPath $javaVersionFile -Force
        }
    }

    if ($javaVersion -notmatch 'version "21') {
        Write-Host "[FAIL] Repo-local java is not Java 21"
        $failures.Add('Repo-local java is not version 21')
    }
    else {
        $env:JAVA_HOME = $localJdkHome
        $env:PATH = "$localJdkHome\bin;$env:PATH"
        Push-Location $repoRoot
        try {
            & '.\mvnw.cmd' -version
        }
        finally {
            Pop-Location
        }
    }
}
else {
    Write-Host "[FAIL] Repo-local JDK 21 is missing"
    Write-Host "Run .\scripts\bootstrap\install-jdk21.ps1 to install it."
    $failures.Add('Repo-local JDK 21 is missing')
}

if ((Test-Path $localNodeExe) -and (Test-Path $localNpmCmd) -and (Test-Path $localNpmPackageJson)) {
    Write-Host "[OK] Repo-local Node 22.12.0 is installed"
    $nodeVersion = & $localNodeExe -v
    $npmVersion = & $localNpmCmd -v
    Write-Host "Node $nodeVersion"
    Write-Host "npm $npmVersion"

    if ($nodeVersion -ne 'v22.12.0') {
        Write-Host "[FAIL] Repo-local node is not version 22.12.0"
        $failures.Add("Repo-local node version mismatch: $nodeVersion")
    }
}
else {
    Write-Host "[FAIL] Repo-local Node 22.12.0 is missing"
    Write-Host "Run .\scripts\bootstrap\install-node22.ps1 to install it."
    $failures.Add('Repo-local Node 22.12.0 is missing')
}

Write-Host "[INFO] Local Docker/Testcontainers are not part of this workstation workflow."
Write-Host "[INFO] Run backend integration tests only in GitHub Actions."

if ($failures.Count -gt 0) {
    Write-Host ''
    Write-Host "Doctor found issues:"
    foreach ($failure in $failures) {
        Write-Host " - $failure"
    }

    exit 1
}

Write-Host ''
Write-Host 'Local environment is ready for frontend and backend unit workflows.'
