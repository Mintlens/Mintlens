<#
.SYNOPSIS
    Expose Mintlens (frontend + API) via Cloudflare Quick Tunnels.
.NOTES
    Run from the repo root:  .\scripts\expose.ps1
    Press Ctrl+C to stop everything.
#>
$ErrorActionPreference = "Stop"

# --- 1. Ensure cloudflared is available ---
$cfPath = "$env:LOCALAPPDATA\cloudflared\cloudflared.exe"
if (-not (Test-Path $cfPath)) {
    Write-Host ""
    Write-Host "[DL] Downloading cloudflared..." -ForegroundColor Cyan
    $dlDir = Split-Path $cfPath
    if (-not (Test-Path $dlDir)) { New-Item -ItemType Directory -Path $dlDir | Out-Null }
    $dlUrl = "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe"
    Invoke-WebRequest -Uri $dlUrl -OutFile $cfPath -UseBasicParsing
    Write-Host "[OK] cloudflared installed at $cfPath" -ForegroundColor Green
}

# --- 2. Start API tunnel (port 3001) ---
Write-Host ""
Write-Host "[>>] Starting API tunnel (port 3001)..." -ForegroundColor Cyan
$apiLog = "$env:TEMP\cf-api.log"
if (Test-Path $apiLog) { Remove-Item $apiLog -Force }
$apiProc = Start-Process -FilePath $cfPath `
    -ArgumentList "tunnel --url http://localhost:3001 --no-tls-verify" `
    -RedirectStandardError $apiLog `
    -PassThru -WindowStyle Hidden

$apiUrl = $null
for ($i = 0; $i -lt 30; $i++) {
    Start-Sleep -Seconds 1
    if (Test-Path $apiLog) {
        $match = Select-String -Path $apiLog -Pattern "https://[a-z0-9-]+\.trycloudflare\.com" | Select-Object -First 1
        if ($match) {
            $apiUrl = ($match.Matches[0].Value)
            break
        }
    }
}
if (-not $apiUrl) {
    Write-Host "[!!] Could not get API tunnel URL. Check $apiLog" -ForegroundColor Red
    Stop-Process -Id $apiProc.Id -Force -ErrorAction SilentlyContinue
    exit 1
}
Write-Host "[OK] API tunnel ready: $apiUrl" -ForegroundColor Green

# --- 3. Start frontend tunnel (port 3000) ---
Write-Host ""
Write-Host "[>>] Starting frontend tunnel (port 3000)..." -ForegroundColor Cyan
$webLog = "$env:TEMP\cf-web.log"
if (Test-Path $webLog) { Remove-Item $webLog -Force }
$webProc = Start-Process -FilePath $cfPath `
    -ArgumentList "tunnel --url http://localhost:3000 --no-tls-verify" `
    -RedirectStandardError $webLog `
    -PassThru -WindowStyle Hidden

$webUrl = $null
for ($i = 0; $i -lt 30; $i++) {
    Start-Sleep -Seconds 1
    if (Test-Path $webLog) {
        $match = Select-String -Path $webLog -Pattern "https://[a-z0-9-]+\.trycloudflare\.com" | Select-Object -First 1
        if ($match) {
            $webUrl = ($match.Matches[0].Value)
            break
        }
    }
}
if (-not $webUrl) {
    Write-Host "[!!] Could not get frontend tunnel URL. Check $webLog" -ForegroundColor Red
    Stop-Process -Id $apiProc.Id -Force -ErrorAction SilentlyContinue
    Stop-Process -Id $webProc.Id -Force -ErrorAction SilentlyContinue
    exit 1
}
Write-Host "[OK] Frontend tunnel ready: $webUrl" -ForegroundColor Green

# --- 4. Summary ---
Write-Host ""
Write-Host "=============================================================" -ForegroundColor Green
Write-Host "  TUNNELS READY" -ForegroundColor Green
Write-Host "=============================================================" -ForegroundColor Green
Write-Host ""
Write-Host "  Frontend (share this): $webUrl" -ForegroundColor White
Write-Host "  API (internal):        $apiUrl" -ForegroundColor DarkGray
Write-Host ""
Write-Host "-------------------------------------------------------------" -ForegroundColor Yellow
Write-Host "  NOW restart your servers with these env vars:" -ForegroundColor Yellow
Write-Host ""
Write-Host "  Terminal 1 (apps/api):" -ForegroundColor White
Write-Host "    `$env:ALLOWED_ORIGINS=`"$webUrl`"; pnpm dev" -ForegroundColor Magenta
Write-Host ""
Write-Host "  Terminal 2 (apps/web):" -ForegroundColor White
Write-Host "    `$env:NEXT_PUBLIC_API_URL=`"$apiUrl`"; pnpm dev" -ForegroundColor Magenta
Write-Host "-------------------------------------------------------------" -ForegroundColor Yellow
Write-Host ""
Write-Host "  Test account:" -ForegroundColor White
Write-Host "    Email:    demo@mintlens.dev" -ForegroundColor Cyan
Write-Host "    Password: Demo1234!" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Press Ctrl+C to shut down tunnels." -ForegroundColor DarkGray

# --- 5. Keep alive ---
try {
    while ($true) { Start-Sleep -Seconds 5 }
}
finally {
    Write-Host ""
    Write-Host "[..] Shutting down tunnels..." -ForegroundColor Yellow
    Stop-Process -Id $apiProc.Id -Force -ErrorAction SilentlyContinue
    Stop-Process -Id $webProc.Id -Force -ErrorAction SilentlyContinue
    Write-Host "[OK] Tunnels closed." -ForegroundColor Green
}
