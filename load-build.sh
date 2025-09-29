#!/bin/bash
set -euo pipefail

# Usage check
if [ $# -ne 2 ]; then
  echo "Usage: $0 <remote_machine_ip> <password>"
  exit 1
fi

REMOTE_IP=$1
REMOTE_PASS=$2
REMOTE_USER="service"

# Check if sshpass is installed
if ! command -v sshpass &> /dev/null; then
  echo "sshpass not found. Please install it first (e.g., brew install sshpass)"
  exit 1
fi

echo ">>> Cleaning old build"
rm -rf dist

echo ">>> Building project"
npm run build || { echo "Build failed"; exit 1; }

echo ">>> Copying dist to remote machine $REMOTE_IP"
sshpass -p "$REMOTE_PASS" scp  -o  StrictHostKeyChecking=no -r dist/* ${REMOTE_USER}@${REMOTE_IP}:/tmp/ || { echo "SCP failed"; exit 1; }

echo ">>> Running remote build steps on $REMOTE_IP"
sshpass -p "$REMOTE_PASS" ssh -o StrictHostKeyChecking=no ${REMOTE_USER}@${REMOTE_IP} bash -s << 'EOF'
  set -euo pipefail

  echo ">>> Creating overlay directories and mounting"
  sudo mkdir -p /tmp/usr-share /tmp/usr-share-work
  sudo mount -t overlay -o lowerdir=/usr/share,upperdir=/tmp/usr-share,workdir=/tmp/usr-share-work overlay /usr/share || true

  echo ">>> Moving into /tmp"
  cd /tmp

  echo ">>> Setting permissions"
  sudo chmod 777 index.html favicon.ico || true
  sudo chmod -R 777 assets || true

  echo ">>> Copying files to /usr/share/www"
  sudo cp index.html favicon.ico /usr/share/www/
  sudo cp -R assets /usr/share/www/

  echo ">>> Restarting bmcweb service"
  sudo systemctl restart bmcweb
EOF

echo ">>> Deployment completed successfully on $REMOTE_IP"