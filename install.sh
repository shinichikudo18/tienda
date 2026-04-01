#!/bin/bash
export SSHPASS='AdmNewcore!2025'
cd /opt/tienda
git pull
rm -rf node_modules
npm install
cd client && npm install && cd ..
npm run build
npm install -g pm2
pm2 kill 2>/dev/null || true
pm2 start server/index.js --name tienda
pm2 save
pm2 startup
echo "INSTALACION COMPLETADA"
