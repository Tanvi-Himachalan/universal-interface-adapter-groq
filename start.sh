#!/bin/bash
# ═══════════════════════════════════════════════════════════
#  Universal Interface Adapter — Quick Start Script
#  Run: chmod +x start.sh && ./start.sh
# ═══════════════════════════════════════════════════════════

set -e  # Exit on any error

CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color
BOLD='\033[1m'

echo ""
echo -e "${CYAN}${BOLD}╔══════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}${BOLD}║  Universal Interface Adapter — Quick Start   ║${NC}"
echo -e "${CYAN}${BOLD}╚══════════════════════════════════════════════╝${NC}"
echo ""

# ── Check prerequisites ─────────────────────────────────────
echo -e "${YELLOW}▸ Checking prerequisites...${NC}"

if ! command -v node &>/dev/null; then
  echo -e "${RED}✗ Node.js not found. Install from https://nodejs.org${NC}"
  exit 1
fi

NODE_VERSION=$(node -v | sed 's/v//' | cut -d. -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
  echo -e "${RED}✗ Node.js 18+ required. Current: $(node -v)${NC}"
  exit 1
fi

echo -e "${GREEN}✓ Node.js $(node -v) found${NC}"

# ── Backend setup ────────────────────────────────────────────
echo ""
echo -e "${YELLOW}▸ Installing backend dependencies...${NC}"
cd backend
npm install --silent
cd ..
echo -e "${GREEN}✓ Backend ready${NC}"

# ── Frontend setup ───────────────────────────────────────────
echo ""
echo -e "${YELLOW}▸ Installing frontend dependencies...${NC}"
cd frontend
npm install --silent
cd ..
echo -e "${GREEN}✓ Frontend ready${NC}"

# ── .env check ───────────────────────────────────────────────
if [ ! -f "backend/.env" ]; then
  echo ""
  echo -e "${YELLOW}▸ Creating backend/.env from template...${NC}"
  cp backend/.env.example backend/.env
  echo -e "${YELLOW}⚠ ACTION REQUIRED: Edit backend/.env with your API keys:${NC}"
  echo -e "   ${BOLD}OPENAI_API_KEY${NC}  — from platform.openai.com"
  echo -e "   ${BOLD}FIREBASE_*${NC}      — from Firebase Console → Service Accounts"
  echo ""
  echo -e "   Open: ${CYAN}nano backend/.env${NC}"
else
  echo -e "${GREEN}✓ backend/.env exists${NC}"
fi

# ── Build extension overlay ──────────────────────────────────
echo ""
echo -e "${YELLOW}▸ Building React overlay for extension...${NC}"
cd frontend
npm run build:extension
cd ..
echo -e "${GREEN}✓ Extension overlay built${NC}"

# ── Summary ──────────────────────────────────────────────────
echo ""
echo -e "${CYAN}${BOLD}════════════════════════════════════════════════${NC}"
echo -e "${GREEN}${BOLD}  Setup complete! Next steps:${NC}"
echo -e "${CYAN}${BOLD}════════════════════════════════════════════════${NC}"
echo ""
echo -e "  ${BOLD}1. Edit backend/.env${NC} with your API keys"
echo ""
echo -e "  ${BOLD}2. Start the backend:${NC}"
echo -e "     ${CYAN}cd backend && npm run dev${NC}"
echo ""
echo -e "  ${BOLD}3. Load the extension in Chrome:${NC}"
echo -e "     • Open ${CYAN}chrome://extensions/${NC}"
echo -e "     • Enable Developer Mode"
echo -e "     • Click 'Load unpacked' → select ${BOLD}extension/${NC} folder"
echo ""
echo -e "  ${BOLD}4. Add your Extension ID to backend/.env:${NC}"
echo -e "     ${CYAN}ALLOWED_ORIGINS=chrome-extension://YOUR_ID_HERE${NC}"
echo ""
echo -e "  ${BOLD}5. Visit any website and click the ♿ toolbar icon${NC}"
echo ""
echo -e "  ${YELLOW}Optional: Generate placeholder icons${NC}"
echo -e "     ${CYAN}npm install canvas && node generate-icons.js${NC}"
echo ""
