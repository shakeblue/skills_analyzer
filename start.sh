#!/usr/bin/env bash
# Skills & Project Fit Analyzer — build and start frontend + backend
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
FRONTEND_DIR="$ROOT_DIR/frontend"

# Colors
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

# ---------- Backend ----------
echo -e "${CYAN}[1/4] Setting up backend...${NC}"
cd "$BACKEND_DIR"

if [ ! -d "venv" ]; then
  echo "  Creating Python venv..."
  python3 -m venv venv
fi

source venv/bin/activate
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

# ---------- Start both servers ----------
echo -e "${CYAN}[4/4] Starting servers...${NC}"

cd "$BACKEND_DIR"
source venv/bin/activate
uvicorn app.main:app --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!

cd "$FRONTEND_DIR"
pnpm start &
FRONTEND_PID=$!

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Skills Analyzer is running!${NC}"
echo -e "${GREEN}========================================${NC}"
echo -e "  Frontend:  ${CYAN}http://localhost:3000${NC}"
echo -e "  Backend:   ${CYAN}http://localhost:8000${NC}"
echo -e "  API Docs:  ${CYAN}http://localhost:8000/docs${NC}"
echo -e "${YELLOW}  Press Ctrl+C to stop${NC}"
echo ""

wait
