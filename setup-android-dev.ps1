# Vektra Android Development Environment Setup Script
# Automates ADB reverse port forwarding to bridge Android devices/emulators to the local Node.js backend on port 5000.

$ErrorActionPreference = "Stop"

Write-Host "====================================================" -ForegroundColor Cyan
Write-Host " Vektra Android Local Development Setup" -ForegroundColor Cyan
Write-Host "====================================================" -ForegroundColor Cyan

# 1. Locate ADB
$adbPath = Get-Command "adb.exe" -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Path
if (-not $adbPath) {
    $sdkPaths = @(
        "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe",
        "$env:ANDROID_HOME\platform-tools\adb.exe",
        "C:\Program Files (x86)\Android\android-sdk\platform-tools\adb.exe"
    )
    foreach ($p in $sdkPaths) {
        if (Test-Path $p) {
            $adbPath = $p
            break
        }
    }
}

if (-not $adbPath) {
    Write-Host "[ERROR] adb.exe could not be found. Please ensure Android SDK platform-tools are installed." -ForegroundColor Red
    exit 1
}

Write-Host "[OK] Found ADB at: $adbPath" -ForegroundColor Green

# 2. Check for connected Android Devices/Emulators
$devicesOutput = & $adbPath devices
$devicesList = @()
foreach ($line in $devicesOutput) {
    if ($line -match "\tdevice$") {
        $devId = ($line -split "\s+")[0]
        $devicesList += $devId
    }
}

if ($devicesList.Count -eq 0) {
    Write-Host "[WARNING] No connected Android device or emulator detected." -ForegroundColor Yellow
    Write-Host "Please start an Android Emulator or connect a physical device via USB with USB Debugging enabled, then run this script again." -ForegroundColor Yellow
    exit 0
}

$devsStr = $devicesList -join ", "
Write-Host "[OK] Connected Device(s): $devsStr" -ForegroundColor Green

# 3. Configure ADB Reverse Port Forwarding
foreach ($targetId in $devicesList) {
    Write-Host "[*] Setting up ADB reverse tunnel on device $targetId (tcp:5000 -> tcp:5000)..." -ForegroundColor Cyan
    & $adbPath -s $targetId reverse tcp:5000 tcp:5000
    if ($LASTEXITCODE -eq 0) {
        Write-Host "[OK] Successfully reversed tcp:5000 -> tcp:5000 for device $targetId" -ForegroundColor Green
    } else {
        Write-Host "[ERROR] Failed to execute adb reverse for device $targetId" -ForegroundColor Red
    }
}

# 4. Verify Active Reverse Tunnels
Write-Host "`n[*] Verifying Active Reverse Forwarding Rules:" -ForegroundColor Cyan
foreach ($targetId in $devicesList) {
    $rules = & $adbPath -s $targetId reverse --list
    Write-Host "   Device [$targetId]:" -ForegroundColor White
    if ($rules) {
        Write-Host "   $rules" -ForegroundColor Green
    } else {
        Write-Host "   (No active reverse rules)" -ForegroundColor Yellow
    }
}

# 5. Check Local Backend Health Endpoint (Port 5000)
Write-Host "`n[*] Testing Vektra Node.js Backend Health (http://localhost:5000/api/health)..." -ForegroundColor Cyan
try {
    $response = Invoke-RestMethod -Uri "http://localhost:5000/api/health" -Method Get -TimeoutSec 5 -ErrorAction Stop
    $msg = $response.message
    Write-Host "[OK] Vektra Node.js Backend is ACTIVE! Message: '$msg'" -ForegroundColor Green
} catch {
    Write-Host "[WARNING] Could not connect to local backend at http://localhost:5000/api/health" -ForegroundColor Yellow
    Write-Host "Ensure the Node.js server is started: cd backend; npm run dev" -ForegroundColor Yellow
}

Write-Host "`n====================================================" -ForegroundColor Cyan
Write-Host " Setup Complete! Android app will connect to http://127.0.0.1:5000/api/" -ForegroundColor Green
Write-Host "====================================================" -ForegroundColor Cyan
