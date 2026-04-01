@echo off
"C:\Program Files\Git\git-bash.exe" -c "export SSHPASS='AdmNewcore!2025'; sshpass -e scp -o StrictHostKeyChecking=no -P 22 C:/tienda/install.sh root@192.168.22.204:/tmp/install.sh"
"C:\Program Files\Git\git-bash.exe" -c "export SSHPASS='AdmNewcore!2025'; sshpass -e ssh -o StrictHostKeyChecking=no -p 22 root@192.168.22.204 'chmod +x /tmp/install.sh && bash /tmp/install.sh'"
pause
