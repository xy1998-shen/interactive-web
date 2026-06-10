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
for /f %%P in ('powershell -NoProfile -ExecutionPolicy Bypass -Command "for($p=39217;$p -lt 39250;$p++){try{$listener=[Net.Sockets.TcpListener]::new([Net.IPAddress]::Parse('127.0.0.1'),$p);$listener.Start();$listener.Stop();Write-Output $p;break}catch{}}"') do set "PORT=%%P"

if not defined PORT (
  echo 39217-39249 端口都被占用，请关闭其他本地预览服务后重试。
  pause
  exit /b 1
)

set "URL=http://127.0.0.1:%PORT%/index.html"

echo 《楚江寻艾》本地预览服务
echo 项目目录：%CD%
echo 访问地址：%URL%
echo.
echo 浏览器将自动打开页面。关闭此窗口即可停止服务。
echo.

start "" "%URL%"
if defined PYTHON_CMD (
  %PYTHON_CMD% -m http.server %PORT% --bind 127.0.0.1
) else (
  echo 未找到 Python 3，改用 Windows PowerShell 内置静态服务。
  powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0tools\windows-static-server.ps1" -Port %PORT% -Root "%CD%"
)

pause
