$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$venvDir = Join-Path $projectRoot ".venv"
$pythonExe = Join-Path $venvDir "Scripts\python.exe"
$frontendDist = Join-Path $projectRoot "frontend\dist\index.html"

if (-not (Test-Path $pythonExe)) {
  Write-Host "Creating Python virtual environment..."
  python -m venv $venvDir
  & $pythonExe -m pip install --upgrade pip
  & $pythonExe -m pip install -r (Join-Path $projectRoot "backend\requirements.txt")
}

if (-not (Get-Command npm.cmd -ErrorAction SilentlyContinue)) {
  throw "Frontend build missing and npm is not installed. Install Node.js first."
}

Write-Host "Building frontend..."
Push-Location (Join-Path $projectRoot "frontend")
try {
  npm.cmd run build
}
finally {
  Pop-Location
}

Write-Host "Starting app at http://127.0.0.1:8000 ..."

# 检查端口是否可用，不可用时使用备用端口
$port = 8000
$altPort = 8001
$usedPort = $port
$listener = $null
try {
  $listener = [System.Net.Sockets.TcpClient]::new()
  $listener.Connect("127.0.0.1", $port)
  $listener.Close()
  Write-Host "端口 $port 已被占用，尝试使用 $altPort ..."
  $usedPort = $altPort
} catch {
  $usedPort = $port
}

Start-Job -ScriptBlock {
  Param($p)
  Start-Sleep -Seconds 2
  try {
    & cmd.exe /c start "" "http://127.0.0.1:$p" | Out-Null
  }
  catch {
  }
} -ArgumentList $usedPort | Out-Null

Push-Location (Join-Path $projectRoot "backend")
try {
  $env:ENV = "production"
  $env:ALLOWED_ORIGINS = "http://127.0.0.1:$usedPort,http://localhost:$usedPort"
  $env:PORT = "$usedPort"
  & $pythonExe run.py
}
finally {
  Pop-Location
}
