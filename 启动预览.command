#!/bin/zsh
set -e

PROJECT_DIR="${0:A:h}"
SERVER_KIND=""
SERVER_BIN=""

if command -v python3 >/dev/null 2>&1 && python3 -c 'import sys; raise SystemExit(sys.version_info[0] < 3)' >/dev/null 2>&1; then
  SERVER_KIND="python"
  SERVER_BIN="$(command -v python3)"
elif command -v python >/dev/null 2>&1 && python -c 'import sys; raise SystemExit(sys.version_info[0] < 3)' >/dev/null 2>&1; then
  SERVER_KIND="python"
  SERVER_BIN="$(command -v python)"
elif command -v ruby >/dev/null 2>&1; then
  SERVER_KIND="ruby"
  SERVER_BIN="$(command -v ruby)"
elif command -v php >/dev/null 2>&1; then
  SERVER_KIND="php"
  SERVER_BIN="$(command -v php)"
fi

if [ -z "$SERVER_KIND" ]; then
  echo "未找到可用的本地静态服务运行环境。"
  echo "请安装 Python 3，或确保系统可用 ruby / php 后重试。"
  exit 1
fi

PORT=""
for candidate in {39217..39249}; do
  if ! lsof -nP -iTCP:"$candidate" -sTCP:LISTEN >/dev/null 2>&1; then
    PORT="$candidate"
    break
  fi
done

if [ -z "$PORT" ]; then
  echo "39217-39249 端口都被占用，请关闭其他本地预览服务后重试。"
  exit 1
fi

URL="http://127.0.0.1:${PORT}/index.html"

cd "$PROJECT_DIR"

echo "《楚江寻艾》本地预览服务"
echo "项目目录：$PROJECT_DIR"
echo "访问地址：$URL"
echo ""
echo "浏览器将自动打开页面。关闭此 Terminal 窗口即可停止服务。"
echo ""

if [ "$SERVER_KIND" = "python" ]; then
  "$SERVER_BIN" -m http.server "$PORT" --bind 127.0.0.1 &
elif [ "$SERVER_KIND" = "ruby" ]; then
  "$SERVER_BIN" -run -e httpd . -p "$PORT" &
else
  "$SERVER_BIN" -S 127.0.0.1:"$PORT" -t . &
fi
SERVER_PID=$!

cleanup() {
  kill "$SERVER_PID" >/dev/null 2>&1 || true
}
trap cleanup EXIT INT TERM

sleep 0.8
open "$URL"
wait "$SERVER_PID"
