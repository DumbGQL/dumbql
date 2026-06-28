#!/usr/bin/env bash
set -euo pipefail

REPO_URL="https://github.com/DumbGQL/dumbql.git"
TEMP_DIR="/tmp/dumbql-deploy-$(date +%s)"

print_usage() {
  cat <<EOF
Usage: $0 -d <domain> [-p <nginx-root>] [-r <repo-url>]

Deploys DumbQL to a server with nginx + SSL (Let's Encrypt).

Required:
  -d <domain>       Domain name (e.g. dumbql.dev, docs.dumbql.dev)

Optional:
  -p <nginx-root>   nginx root directory (default: /var/www/<domain>)
  -r <repo-url>     Git repository URL (default: $REPO_URL)
  -h                Show this help
EOF
  exit 1
}

while getopts "d:p:r:h" opt; do
  case "$opt" in
    d) DOMAIN="$OPTARG" ;;
    p) NGINX_ROOT="$OPTARG" ;;
    r) REPO_URL="$OPTARG" ;;
    h) print_usage ;;
    *) print_usage ;;
  esac
done

if [[ -z "${DOMAIN:-}" ]]; then
  echo "Error: -d <domain> is required"
  print_usage
fi

NGINX_ROOT="${NGINX_ROOT:-/var/www/$DOMAIN}"
BUILD_DIR="$NGINX_ROOT/build"

# ── 1. Clone into temp directory ──────────────────────────────────────
echo "=== Cloning $REPO_URL into $TEMP_DIR ==="
git clone --depth=1 "$REPO_URL" "$TEMP_DIR"
cd "$TEMP_DIR"

# ── 2. Install dependencies ───────────────────────────────────────────
echo "=== Installing dependencies ==="
npm ci

# ── 3. Build packages (link @dumbql/* locally) ────────────────────────
echo "=== Building @dumbql/* packages ==="
node scripts/build-packages.mjs

# ── 4. Build Angular app (production) ─────────────────────────────────
echo "=== Building Angular app ==="
npx ng build --configuration=production

# ── 5. Copy to nginx directory ────────────────────────────────────────
echo "=== Deploying to $BUILD_DIR ==="
mkdir -p "$BUILD_DIR"
cp -r dist/dumb-keystore/* "$BUILD_DIR"
rm -rf "$TEMP_DIR"

# ── 6. nginx config ───────────────────────────────────────────────────
NGINX_CONF="/etc/nginx/sites-available/$DOMAIN"
NGINX_ENABLED="/etc/nginx/sites-enabled/$DOMAIN"

if [[ ! -f "$NGINX_CONF" ]]; then
  echo "=== Creating nginx config: $NGINX_CONF ==="
  sudo tee "$NGINX_CONF" > /dev/null <<NGINXEOF
server {
    listen 80;
    server_name $DOMAIN;
    root $BUILD_DIR;
    index index.html;

    location / {
        try_files \$uri \$uri/ /index.html;
    }

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
NGINXEOF

  sudo mkdir -p /etc/nginx/sites-enabled
  if [[ ! -L "$NGINX_ENABLED" ]]; then
    sudo ln -sf "$NGINX_CONF" "$NGINX_ENABLED"
  fi
  sudo nginx -t
  sudo systemctl reload nginx
fi

# ── 7. SSL via Let's Encrypt ──────────────────────────────────────────
if ! sudo certbot certificates 2>/dev/null | grep -q "$DOMAIN"; then
  echo "=== Obtaining SSL certificate for $DOMAIN ==="
  sudo certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos -m "admin@$DOMAIN" || {
    echo "WARNING: certbot failed. Run manually:"
    echo "  sudo certbot --nginx -d $DOMAIN"
  }
fi

echo ""
echo "=== Deploy complete! ==="
echo "  Domain:  https://$DOMAIN"
echo "  Root:    $BUILD_DIR"
