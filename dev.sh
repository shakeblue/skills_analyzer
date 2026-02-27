#!/usr/bin/env bash
# Skills & Project Fit Analyzer — start in dev mode (hot-reload)
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
FRONTEND_DIR="$ROOT_DIR/frontend"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

cleanup() {
  echo ""
  echo -e "${YELLOW}Shutting down...${NC}"
  kill "$BACKEND_PID" 2>/dev/null && echo -e "${GREEN}Backend stopped${NC}" || true
  kill "$FRONTEND_PID" 2>/dev/null && echo -e "${GREEN}Frontend stopped${NC}" || true
  exit 0
}
trap cleanup SIGINT SIGTERM

# ---------- Prerequisites ----------
echo -e "${CYAN}[0/3] Checking prerequisites...${NC}"

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
echo -e "${CYAN}[1/3] Setting up backend...${NC}"
cd "$BACKEND_DIR"

if [ ! -d "venv" ]; then
  echo "  Creating Python venv..."
  python3 -m venv venv
fi

source venv/bin/activate
pip install -q --upgrade pip
pip install -q -r requirements.txt
echo -e "${GREEN}  Backend ready${NC}"

# ---------- Frontend ----------
echo -e "${CYAN}[2/3] Setting up frontend...${NC}"
cd "$FRONTEND_DIR"

if [ ! -d "node_modules" ]; then
  echo "  Installing node modules..."
  pnpm install
fi
echo -e "${GREEN}  Frontend ready${NC}"

# ---------- Start both in dev mode ----------
echo -e "${CYAN}[3/3] Starting dev servers...${NC}"

cd "$BACKEND_DIR"
source venv/bin/activate
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload &
BACKEND_PID=$!

cd "$FRONTEND_DIR"
pnpm dev &
FRONTEND_PID=$!

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Skills Analyzer — Dev Mode${NC}"
echo -e "${GREEN}========================================${NC}"
echo -e "  Frontend:  ${CYAN}http://localhost:3000${NC}  (hot-reload)"
echo -e "  Backend:   ${CYAN}http://localhost:8000${NC}  (hot-reload)"
echo -e "  API Docs:  ${CYAN}http://localhost:8000/docs${NC}"
echo -e "${YELLOW}  Press Ctrl+C to stop${NC}"
echo ""

wait
