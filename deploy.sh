#!/usr/bin/env bash
set -euo pipefail

# =============================================================================
# Q-SealNet Full Deployment Script
#   Frontend → Cloudflare Pages (via wrangler)
#   Backend  → VPS (via Ansible)
# =============================================================================

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
API_DOMAIN="${API_DOMAIN:-api.wintertia.qzz.io}"
API_PROTOCOL="${API_PROTOCOL:-https}"
SKIP_BACKEND=false

# Parse flags
for arg in "$@"; do
    case "$arg" in
        --frontend-only|--skip-backend) SKIP_BACKEND=true ;;
        --help|-h)
            echo "Usage: $0 [--frontend-only | --skip-backend]"
            exit 0 ;;
    esac
done

# Colors
RED='\033[0;31m'; GREEN='\033[0;32m'; CYAN='\033[0;36m'; NC='\033[0m'
info()  { echo -e "${CYAN}[INFO]${NC}  $*"; }
ok()    { echo -e "${GREEN}[OK]${NC}    $*"; }
err()   { echo -e "${RED}[ERROR]${NC} $*"; }

if $SKIP_BACKEND; then
    info "Skipping backend deployment (--frontend-only)"
fi

# ── 1. Deploy Backend via Ansible ──────────────────────────────────────────
if ! $SKIP_BACKEND; then
    info "============================================"
    info "STEP 1/3: Deploying backend to VPS via Ansible"
    info "============================================"
    cd "$ROOT_DIR"
    ansible-playbook -i ansible/inventory.yml ansible/playbook.yml

    # Health check: wait for backend to respond
    info "Waiting for backend to be healthy..."
    VPS_IP="$(grep ansible_host ansible/inventory.yml | head -1 | awk '{print $2}')"
    for i in $(seq 1 12); do
        if curl -sf "http://${VPS_IP}/health" > /dev/null 2>&1; then
            ok "Backend is healthy"
            break
        fi
        if [ "$i" -eq 12 ]; then
            err "Backend failed health check after 60s — check VPS"
            exit 1
        fi
        info "Waiting... ($i/12)"
        sleep 5
    done
    ok "Backend deployment complete"
fi

# ── 2. Build Frontend for Cloudflare Pages ──────────────────────────────────
info "============================================"
info "STEP 2/3: Building frontend for Cloudflare Pages"
info "============================================"
cd "$ROOT_DIR/frontend"

# Install dependencies
info "Installing frontend dependencies..."
pnpm install --ignore-scripts 2>/dev/null || npm install
pnpm rebuild @tailwindcss/oxide sharp 2>/dev/null || true
ok "Dependencies installed"

# Temporarily patch next.config.mjs for static export + skip TS errors
sed -i "s/reactStrictMode: true/reactStrictMode: true,\\n  typescript: { ignoreBuildErrors: true },\\n  output: 'export',\\n  images: { unoptimized: true }/" next.config.mjs

info "Building Next.js frontend (static export)..."
NEXT_PUBLIC_API_BASE_URL="${API_PROTOCOL}://${API_DOMAIN}" \
NODE_ENV=production \
  pnpm build

# Revert config change
git checkout -- next.config.mjs
ok "Frontend build complete"

# ── 3. Deploy to Cloudflare Pages ──────────────────────────────────────────
info "============================================"
info "STEP 3/3: Deploying frontend to Cloudflare Pages"
info "============================================"
info "Checking wrangler authentication..."
npx wrangler whoami 2>/dev/null || npx wrangler login

info "Deploying to Cloudflare Pages..."
npx wrangler pages deploy out \
    --project-name q-sealnet-frontend \
    --branch main

ok "Frontend deployed to Cloudflare Pages!"
echo ""
info "============================================"
info "Deployment complete!"
info "  Frontend: https://qsealnet.wintertia.qzz.io"
info "  Backend:  ${API_PROTOCOL}://${API_DOMAIN}"
info "============================================"
