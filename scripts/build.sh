#!/bin/sh
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

cd "$SCRIPT_DIR"

CURRENT_USER="$(whoami)"

if [ "$CURRENT_USER" != "root" ] || id -nG | grep -qw docker
then
    cat <<EOF
[!] Either you're not running as root or you, ($CURRENT_USER), are not a member of the 'docker' group.
EOF
    exit 1
else
	continue
fi

IMAGE_ID=$(docker images -q quest-command:latest 2>/dev/null || echo "")

if [ -n $IMAGE_ID ]
then
    echo "[*] Cleaning up..."
    docker rmi -f quest-command:latest || true
fi

if ! docker buildx build --tag quest-command:latest -f ../docker/Dockerfile ..
then
    echo "[!] Building quest-command failed."
    exit 1
fi
