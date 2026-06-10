@echo off
setlocal

cd /d "%~dp0"

set "PYTHON_CMD="
py -3 --version >nul 2>nul
if %ERRORLEVEL%==0 set "PYTHON_CMD=py -3"

if not defined PYTHON_CMD (
  python -c "import sys; raise SystemExit(sys.version_info[0] < 3)" >nul 2>nul
  if %ERRORLEVEL%==0 set "PYTHON_CMD=python"
)

set "PORT="
for /f %%P in ('powershell -NoProfile -ExecutionPolicy Bypass -Command "for($p=39217;$p -lt 39250;$p++){try{$ip=[Net.IPAddress]::Parse('127.0.0.1');$listener=New-Object Net.Sockets.TcpListener -ArgumentList $ip,$p;$listener.Start();$listener.Stop();Write-Output $p;break}catch{}}"') do set "PORT=%%P"

if not defined PORT (
  if defined PYTHON_CMD set "PORT=39217"
)

if not defined PORT (
  echo No available port found in 39217-39249.
  echo PowerShell is required when Python 3 is not installed.
  echo Please install Python 3, or enable Windows PowerShell, then try again.
  pause
  exit /b 1
)

set "URL=http://127.0.0.1:%PORT%/index.html"

echo ChuJiang local preview server
echo Project: %CD%
echo URL: %URL%
echo.
echo The browser will open automatically.
echo Close this command window to stop the server.
echo.

start "" "%URL%"
if defined PYTHON_CMD (
  %PYTHON_CMD% -m http.server %PORT% --bind 127.0.0.1
) else (
  echo Python 3 was not found. Falling back to PowerShell static server.
  powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0tools\windows-static-server.ps1" -Port %PORT% -Root "%CD%"
)

pause
