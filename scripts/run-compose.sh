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

if [ -z "$IMAGE_ID" ]
then
    echo "[!] Could not find the Docker image 'quest-command'. Building it..."
    sh ./build.sh || echo "Build failed."; exit 1
fi

RUNNING_CONTAINER=$(docker ps -aq -f name=^quest-command$ 2>/dev/null || echo "")

while getopts 's' arg
do
    case "$arg" in
        s) [ -n "$RUNNING_CONTAINER" ] && docker compose -f ../docker/docker-compose.yml down || echo "[!] Not running."; exit $?;;
    esac
done

docker compose -f ../docker/docker-compose.yml down 2>/dev/null || true

if docker compose -f ../docker/docker-compose.yml up -d
then
    echo "[*] Server is running at $(hostname -I | awk '{print $1}'):8080"
    docker ps -q -f name=quest-command:latest
    cat <<EOF

[*] To check for logs use: docker logs quest-command
[*] To stop the container use: docker stop quest-command or $0 -s
EOF
else
    echo "[!] Could not run the container."
    exit 1
fi
