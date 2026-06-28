#!/usr/bin/env bash
set -euo pipefail

read -rp "Enter nginx deploy directory path: " DEPLOY_PATH

if [[ -z "$DEPLOY_PATH" ]]; then
  echo "Error: Path cannot be empty"
  exit 1
fi

if [[ ! -d "$DEPLOY_PATH" ]]; then
  echo "Creating directory: $DEPLOY_PATH"
  mkdir -p "$DEPLOY_PATH"
fi

echo "Building project..."
npm run build -- --configuration=production

echo "Copying dist/app/* to $DEPLOY_PATH"
cp -r dist/app/* "$DEPLOY_PATH"

echo "Deploy complete!"
