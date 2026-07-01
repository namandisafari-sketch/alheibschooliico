#!/bin/bash
set -e

REPO_DIR="/home/iico/alheibschooliico"
LOG_FILE="$REPO_DIR/scripts/auto-fix.log"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" | tee -a "$LOG_FILE"
}

log "=== Auto-Fix: Starting diagnostics ==="

# 1. Fix source code type safety issues
log "[1/6] Fixing common React type safety issues..."

# searchable-select: ensure String() wrapping for .toLowerCase()
if grep -q '\.filter((o) => o\.toLowerCase()' "$REPO_DIR/src/components/ui/searchable-select.tsx" 2>/dev/null; then
    sed -i "s/\.filter((o) => o\.toLowerCase()/.filter((o) => String(o).toLowerCase()/" "$REPO_DIR/src/components/ui/searchable-select.tsx"
    log "  Fixed toLowerCase in searchable-select.tsx"
fi

# 2. Check & restart server if not running
log "[2/6] Checking application server..."
SERVER_PID=$(pgrep -f "node dist/server.cjs" | head -1)
if [ -z "$SERVER_PID" ]; then
    log "  Server not running. Starting..."
    export NODE_ENV=production
    export PORT=8080
    nohup node "$REPO_DIR/dist/server.cjs" >> "$REPO_DIR/server.log" 2>&1 &
    log "  Server started (PID: $!)"
else
    log "  Server running (PID: $SERVER_PID)"
fi

# 3. Check & restart cloudflared tunnel if not running
log "[3/6] Checking Cloudflare tunnel..."
TUNNEL_PID=$(pgrep -f "cloudflared.*tunnel run" | head -1)
if [ -z "$TUNNEL_PID" ]; then
    log "  Tunnel not running. Starting..."
    nohup cloudflared tunnel --config /etc/cloudflared/config.yml run > /dev/null 2>&1 &
    log "  Tunnel started (PID: $!)"
else
    log "  Tunnel running (PID: $TUNNEL_PID)"
fi

# 4. Verify DNS records point to the correct tunnel
log "[4/6] Verifying Cloudflare DNS records..."
CURRENT_TUNNEL="22586b5b-0faf-472d-ac42-854269e0d18e"
API_TOKEN=$(cat /home/iico/.cloudflared/cert.pem 2>/dev/null | grep -v "BEGIN\|END" | base64 -d 2>/dev/null | python3 -c "import sys,json; print(json.load(sys.stdin).get('apiToken',''))" 2>/dev/null || echo "")

if [ -n "$API_TOKEN" ]; then
    ZONE_ID="e578f6cd329337f32db8464c628aea12"
    for HOST in "alheibschool.org" "www.alheibschool.org" "supabase.alheibschool.org"; do
        RECORD=$(curl -s -H "Authorization: Bearer $API_TOKEN" \
            "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/dns_records?name=$HOST&type=CNAME" \
            | python3 -c "import sys,json; d=json.load(sys.stdin); r=d.get('result',[]); print(r[0]['id'] if r else '')" 2>/dev/null)
        
        if [ -n "$RECORD" ]; then
            CONTENT=$(curl -s -H "Authorization: Bearer $API_TOKEN" \
                "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/dns_records/$RECORD" \
                | python3 -c "import sys,json; print(json.load(sys.stdin)['result']['content'])" 2>/dev/null)
            
            if [ "$CONTENT" != "$CURRENT_TUNNEL.cfargotunnel.com" ]; then
                log "  Fixing $HOST: $CONTENT -> $CURRENT_TUNNEL.cfargotunnel.com"
                curl -s -X PATCH "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/dns_records/$RECORD" \
                    -H "Authorization: Bearer $API_TOKEN" \
                    -H "Content-Type: application/json" \
                    -d "{\"type\":\"CNAME\",\"name\":\"$HOST\",\"content\":\"$CURRENT_TUNNEL.cfargotunnel.com\",\"proxied\":true,\"ttl\":1}" > /dev/null
                log "  Fixed $HOST"
            else
                log "  $HOST OK"
            fi
        fi
    done
else
    log "  Skipping DNS check (no API token available)"
fi

# 5. Check & restart Docker Supabase services
log "[5/7] Checking Docker Supabase services..."
DOCKER_DIR="/home/iico/IICO/Alheib-24/docker"
if command -v docker &>/dev/null; then
    # Check if Kong is running (key service)
    if ! docker ps --format '{{.Names}}' | grep -q supabase-kong; then
        log "  Supabase Docker services not running. Starting..."
        docker compose -f "$DOCKER_DIR/docker-compose.yml" up -d 2>&1 | while IFS= read -r line; do log "  $line"; done
        log "  Supabase services started"
    else
        log "  Supabase Docker services OK"
    fi
else
    log "  Docker not available, skipping"
fi

# 6. Verify local services (ports)
log "[6/7] Verifying local services..."
for PORT_DESC in "80:Nginx Proxy Manager" "443:Nginx SSL" "8000:Supabase Kong" "5432:PostgreSQL" "8080:Node App" "20241:cloudflared metrics"; do
    PORT="${PORT_DESC%%:*}"
    NAME="${PORT_DESC#*:}"
    if ss -tlnp | grep -q ":$PORT "; then
        log "  $NAME (:$PORT) OK"
    else
        log "  $NAME (:$PORT) NOT LISTENING"
    fi
done

# 7. Rebuild if source was modified
log "[7/7] Rebuilding application..."
cd "$REPO_DIR"
npm run build 2>&1 | tail -5
log "  Build complete"

log "=== Auto-Fix: Complete ==="
echo ""
echo "If you still see errors in the browser:"
echo "  - Hard refresh: Ctrl+Shift+R (Win/Linux) or Cmd+Shift+R (Mac)"
echo "  - Or open DevTools > Application > Service Workers > Unregister, then reload"
