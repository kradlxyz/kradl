#!/usr/bin/env bash
set -euo pipefail

# Kradl 1-Command VPS Deployment Script (Ubuntu 24.04 + Docker + Caddy HTTPS)
# Usage: ./scripts/vps-deploy.sh root@2.29.171.57

TARGET="${1:-root@2.29.171.57}"
REMOTE_DIR="/opt/kradl"
PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"

echo "🚀 Deploying Kradl from ${PROJECT_ROOT} to ${TARGET}:${REMOTE_DIR}..."

# 1. Ensure remote directory & Docker exist
ssh -o StrictHostKeyChecking=accept-new "$TARGET" '
  set -e
  mkdir -p /opt/kradl
  if ! command -v docker >/dev/null 2>&1; then
    echo "📦 Installing Docker Engine & Compose..."
    curl -fsSL https://get.docker.com | sh
    systemctl enable --now docker
  fi
'

# 2. Sync repository cleanly (excluding local node_modules, .next, .env, artifacts)
rsync -az --delete \
  --exclude '.git' \
  --exclude 'node_modules' \
  --exclude '.next' \
  --exclude '.env' \
  --exclude 'apps/web/.env' \
  --exclude 'contracts/artifacts' \
  --exclude 'contracts/cache' \
  --exclude 'contracts/typechain-types' \
  "${PROJECT_ROOT}/" "${TARGET}:${REMOTE_DIR}/"

# 3. Generate production .env on VPS if missing, build & launch stack + push DB schema
ssh "$TARGET" '
  set -e
  cd /opt/kradl

  if [ ! -f .env ]; then
    PG_PASS=$(openssl rand -hex 20)
    JWT_SEC=$(openssl rand -hex 32)
    cat > .env <<EOF
POSTGRES_USER=kradl
POSTGRES_PASSWORD=${PG_PASS}
POSTGRES_DB=kradl
DATABASE_URL=postgresql://kradl:${PG_PASS}@postgres:5432/kradl?schema=public
JWT_SECRET=${JWT_SEC}
ROBINHOOD_TESTNET_RPC_URL=https://rpc.testnet.chain.robinhood.com
ROBINHOOD_MAINNET_RPC_URL=https://rpc.mainnet.chain.robinhood.com
BASE_SEPOLIA_RPC_URL=https://sepolia.base.org
BASE_MAINNET_RPC_URL=https://mainnet.base.org
NEXT_PUBLIC_DEFAULT_CHAIN_ID=46630
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=
EOF
    chmod 600 .env
    echo "🔐 Created secure production .env on VPS"
  fi

  docker compose --profile prod up -d --build
  echo "⏳ Waiting for PostgreSQL to be ready..."
  sleep 5
  docker compose --profile prod exec -T indexer pnpm --filter @kradl/web db:push
  echo "✅ Kradl is LIVE at https://kradl.xyz!"
'
