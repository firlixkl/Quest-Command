#!/usr/bin/env bash
# Ejecutar como root en Debian, desde la carpeta del proyecto
set -e
apt update && apt install -y nginx
mkdir -p /var/www/pentesthub
cp -r index.html style.css app.js data /var/www/pentesthub/
cp nginx-pentesthub.conf /etc/nginx/sites-available/pentesthub
ln -sf /etc/nginx/sites-available/pentesthub /etc/nginx/sites-enabled/pentesthub
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl enable --now nginx && systemctl reload nginx
echo "Listo: http://$(hostname -I | awk '{print $1}')/"
