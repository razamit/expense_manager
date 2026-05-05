param(
    [switch]$NoStart,
    [switch]$SkipNodeInstall,
    [switch]$SkipInstall,
    [switch]$ForceEnv,
    [switch]$Help
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Write-SetupInfo {
    param([string]$Message)

    Write-Host "[setup] $Message"
}

function Refresh-Path {
    $machinePath = [System.Environment]::GetEnvironmentVariable("Path", "Machine")
    $userPath = [System.Environment]::GetEnvironmentVariable("Path", "User")
    $env:Path = "$machinePath;$userPath"
}

function Test-Command {
    param([string]$Name)

    return $null -ne (Get-Command $Name -ErrorAction SilentlyContinue)
}

function Invoke-ExternalCommand {
    param(
        [string]$Command,
        [string[]]$Arguments
    )

    & $Command @Arguments

    if ($LASTEXITCODE -ne 0) {
        throw "Command failed: $Command $($Arguments -join ' ')"
    }
}

function Install-NodeIfNeeded {
    if (Test-Command "node" -and Test-Command "npm") {
        Write-SetupInfo "Node.js and npm are already available."
        return
    }

    if ($SkipNodeInstall) {
        throw "Node.js/npm are missing and -SkipNodeInstall was provided. Install Node.js 18+ manually and rerun setup."
    }

    Write-SetupInfo "Node.js or npm is missing. Trying to install Node.js LTS."

    if (Test-Command "winget") {
        Invoke-ExternalCommand "winget" @(
            "install",
            "--id", "OpenJS.NodeJS.LTS",
            "--exact",
            "--source", "winget",
            "--accept-package-agreements",
            "--accept-source-agreements"
        )
        Refresh-Path
    } elseif (Test-Command "choco") {
        Invoke-ExternalCommand "choco" @("install", "nodejs-lts", "-y")
        Refresh-Path
    } else {
        throw "Could not auto-install Node.js. Install Node.js 18+ manually from https://nodejs.org/ and rerun setup."
    }

    if (-not (Test-Command "node") -or -not (Test-Command "npm")) {
        throw "Node.js installation did not put node/npm on PATH for this session. Open a new terminal and rerun setup."
    }

    Write-SetupInfo "Node.js installation succeeded."
}

function Get-RepoRoot {
    if ($PSScriptRoot) {
        return $PSScriptRoot
    }

    throw "Could not resolve the script directory. Run setup.ps1 from the checked-out repository file."
}

if ($Help) {
    Write-Host "FinanceChecker setup"
    Write-Host ""
    Write-Host "Usage: powershell -ExecutionPolicy Bypass -File .\setup.ps1 [-NoStart] [-SkipNodeInstall] [-SkipInstall] [-ForceEnv]"
    exit 0
}

$repoRoot = Get-RepoRoot
Set-Location $repoRoot

Install-NodeIfNeeded

$nodeArgs = @("scripts/setup.cjs")

if ($NoStart) {
    $nodeArgs += "--no-start"
}

if ($SkipInstall) {
    $nodeArgs += "--skip-install"
}

if ($ForceEnv) {
    $nodeArgs += "--force-env"
}

Write-SetupInfo "Running shared setup flow from $repoRoot"
Invoke-ExternalCommand "node" $nodeArgs