#!/bin/bash
# Rollback: Traefik → Nginx migration
# Use this if Traefik causes issues and you need to revert to nginx.

set -e

echo "⚠️  Rolling back from Traefik to Nginx..."

# Stop Traefik
echo "🛑 Stopping Traefik..."
docker compose stop traefik 2>/dev/null || true
docker compose rm -f traefik 2>/dev/null || true

# Restore Nginx from git
echo "📦 Restoring Nginx configuration..."
git checkout HEAD -- config/nginx/ 2>/dev/null || {
    echo "❌ Nginx config not found in git. You may need to restore it manually."
    exit 1
}

# Restore docker-compose.yml to Nginx version
echo "🔄 Restoring docker-compose.yml..."
git checkout HEAD -- docker-compose.yml

# Restart with Nginx
echo "🚀 Starting Nginx..."
docker compose up -d nginx

echo ""
echo "✅ Rollback complete. Nginx is back in control."
echo "🔗 Services available at their original ports (8081, 8082, etc.)"
