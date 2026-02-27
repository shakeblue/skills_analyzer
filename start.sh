#!/usr/bin/env bash
# Skills & Project Fit Analyzer — build and start frontend + backend in background
#
# Usage:
#   ./start.sh          Start both servers (background, survives logout)
#   ./start.sh stop     Stop both servers
#   ./start.sh status   Check if servers are running
#   ./start.sh logs     Tail logs from both servers
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
FRONTEND_DIR="$ROOT_DIR/frontend"
LOG_DIR="$ROOT_DIR/logs"
BACKEND_LOG="$LOG_DIR/backend.log"
FRONTEND_LOG="$LOG_DIR/frontend.log"
BACKEND_PID_FILE="$LOG_DIR/backend.pid"
FRONTEND_PID_FILE="$LOG_DIR/frontend.pid"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

mkdir -p "$LOG_DIR"

# ---------- stop ----------
do_stop() {
  local stopped=0
  if [ -f "$BACKEND_PID_FILE" ]; then
    pid=$(cat "$BACKEND_PID_FILE")
    if kill "$pid" 2>/dev/null; then
      echo -e "${GREEN}Backend stopped (PID $pid)${NC}"
      stopped=1
    fi
    rm -f "$BACKEND_PID_FILE"
  fi
  if [ -f "$FRONTEND_PID_FILE" ]; then
    pid=$(cat "$FRONTEND_PID_FILE")
    if kill "$pid" 2>/dev/null; then
      echo -e "${GREEN}Frontend stopped (PID $pid)${NC}"
      stopped=1
    fi
    rm -f "$FRONTEND_PID_FILE"
  fi
  if [ $stopped -eq 0 ]; then
    echo -e "${YELLOW}No running servers found${NC}"
  fi
}

# ---------- status ----------
do_status() {
  local running=0
  if [ -f "$BACKEND_PID_FILE" ] && kill -0 "$(cat "$BACKEND_PID_FILE")" 2>/dev/null; then
    echo -e "${GREEN}Backend:  running (PID $(cat "$BACKEND_PID_FILE"))${NC}  http://localhost:8000"
    running=1
  else
    echo -e "${RED}Backend:  not running${NC}"
  fi
  if [ -f "$FRONTEND_PID_FILE" ] && kill -0 "$(cat "$FRONTEND_PID_FILE")" 2>/dev/null; then
    echo -e "${GREEN}Frontend: running (PID $(cat "$FRONTEND_PID_FILE"))${NC}  http://localhost:3000"
    running=1
  else
    echo -e "${RED}Frontend: not running${NC}"
  fi
  return $(( 1 - running ))
}

# ---------- logs ----------
do_logs() {
  echo -e "${CYAN}Tailing logs (Ctrl+C to stop)...${NC}"
  tail -f "$BACKEND_LOG" "$FRONTEND_LOG" 2>/dev/null
}

# ---------- Handle subcommands ----------
CMD="${1:-start}"

case "$CMD" in
  stop)
    do_stop
    exit 0
    ;;
  status)
    do_status
    exit 0
    ;;
  logs)
    do_logs
    exit 0
    ;;
  start) ;;
  *)
    echo "Usage: $0 {start|stop|status|logs}"
    exit 1
    ;;
esac

# ---------- Stop existing servers first ----------
do_stop 2>/dev/null || true

# ---------- Prerequisites ----------
echo -e "${CYAN}[0/4] Checking prerequisites...${NC}"

# Python 3
if ! command -v python3 &>/dev/null; then
  echo -e "${RED}  python3 not found. Please install Python 3.11+${NC}"
  exit 1
fi
echo -e "${GREEN}  python3 $(python3 --version 2>&1 | awk '{print $2}')${NC}"

# Node.js
if ! command -v node &>/dev/null; then
  echo -e "${YELLOW}  Node.js not found. Installing via nvm...${NC}"
  curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
  export NVM_DIR="$HOME/.nvm"
  # shellcheck source=/dev/null
  [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
  nvm install 20
  nvm use 20
fi
echo -e "${GREEN}  node $(node --version)${NC}"

# pnpm
if ! command -v pnpm &>/dev/null; then
  echo -e "${YELLOW}  pnpm not found. Installing...${NC}"
  npm install -g pnpm
fi
echo -e "${GREEN}  pnpm $(pnpm --version)${NC}"

# ---------- Backend ----------
echo -e "${CYAN}[1/4] Setting up backend...${NC}"
cd "$BACKEND_DIR"

if [ ! -d "venv" ]; then
  echo "  Creating Python venv..."
  python3 -m venv venv
fi

source venv/bin/activate
pip install -q --upgrade pip
pip install -q -r requirements.txt

echo -e "${GREEN}  Backend dependencies installed${NC}"

# ---------- Frontend ----------
echo -e "${CYAN}[2/4] Setting up frontend...${NC}"
cd "$FRONTEND_DIR"

if [ ! -d "node_modules" ]; then
  echo "  Installing node modules..."
  pnpm install
fi

echo -e "${GREEN}  Frontend dependencies installed${NC}"

# ---------- Build frontend ----------
echo -e "${CYAN}[3/4] Building frontend...${NC}"
pnpm build
echo -e "${GREEN}  Frontend build complete${NC}"

# ---------- Start both servers in background ----------
echo -e "${CYAN}[4/4] Starting servers in background...${NC}"

cd "$BACKEND_DIR"
source venv/bin/activate
nohup uvicorn app.main:app --host 0.0.0.0 --port 8000 >> "$BACKEND_LOG" 2>&1 &
echo $! > "$BACKEND_PID_FILE"

cd "$FRONTEND_DIR"
nohup pnpm start >> "$FRONTEND_LOG" 2>&1 &
echo $! > "$FRONTEND_PID_FILE"

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Skills Analyzer is running!${NC}"
echo -e "${GREEN}========================================${NC}"
echo -e "  Frontend:  ${CYAN}http://localhost:3000${NC}"
echo -e "  Backend:   ${CYAN}http://localhost:8000${NC}"
echo -e "  API Docs:  ${CYAN}http://localhost:8000/docs${NC}"
echo ""
echo -e "  Backend PID:  $(cat "$BACKEND_PID_FILE")"
echo -e "  Frontend PID: $(cat "$FRONTEND_PID_FILE")"
echo -e "  Logs:         ${CYAN}$LOG_DIR/${NC}"
echo ""
echo -e "  ${YELLOW}./start.sh stop${NC}    — stop servers"
echo -e "  ${YELLOW}./start.sh status${NC}  — check status"
echo -e "  ${YELLOW}./start.sh logs${NC}    — tail logs"
echo ""
