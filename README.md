# TiendaMi - Sistema de Gestión de Tienda

Sistema web completo para gestión de pequeñas tiendas con inventario, ventas, fiados y control de usuarios.

## Características

- **Inventario**: Gestión de productos con empaquetado configurable y historial de precios
- **Ventas**: Registro de ventas al contado o fiado
- **Clientes**: Seguimiento de deudas y pagos
- **Dashboard**: Estadísticas en tiempo real, gráficos de ventas
- **Usuarios**: 3 roles (Admin, Supervisor, Vendedor) con permisos diferenciados
- **Responsive**: Optimizado para móvil y desktop

## Roles de Usuario

| Rol | Permisos |
|-----|----------|
| **Admin** | Gestión completa: usuarios, productos, ventas, configuración |
| **Supervisor** | Modificar precios (con historial), ver todo, gestionar fiados |
| **Vendedor** | Solo su inventario asignado y sus ventas |

## Instalación Local

```bash
# 1. Clonar el repositorio
git clone <repo-url>
cd tienda

# 2. Instalar dependencias
npm install
cd client && npm install && cd ..

# 3. Ejecutar en desarrollo
npm run dev
```

Accede a http://localhost:5173

**Usuario inicial:** `admin` / `admin123`

## Instalación en Servidor (LXC Debian)

```bash
# 1. Actualizar sistema
sudo apt update && sudo apt upgrade -y

# 2. Instalar Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# 5. Clonar repositorio
git clone <repo-url> /opt/tienda
cd /opt/tienda

# 6. Instalar dependencias del servidor
npm install

# 7. Instalar dependencias del cliente
cd client && npm install && cd ..

# 8. Compilar cliente para producción
npm run build

# 9. Configurar variables de entorno
export PORT=3001
export NODE_ENV=production

# 10. Instalar pm2 para gestión de procesos
sudo npm install -g pm2

# 11. Iniciar aplicación
pm2 start server/index.js --name tienda

# 12. Configurar inicio automático
pm2 startup
pm2 save

# 13. Configurar Nginx como proxy reverso (opcional)
sudo apt install -y nginx
```

### Configuración Nginx

```nginx
# /etc/nginx/sites-available/tienda
server {
    listen 80;
    server_name tu-dominio.com;

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/tienda /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## Base de Datos

Utiliza SQLite (database.sqlite). Para hacer backup:

```bash
cp database.sqlite database.sqlite.backup
```

## Estructura del Proyecto

```
tienda/
├── server/           # API Express
│   ├── routes/       # Endpoints de API
│   ├── middleware/   # Auth middleware
│   └── db/           # Schema SQLite
├── client/           # React app
│   ├── src/
│   │   ├── pages/    # Páginas principales
│   │   ├── components/
│   │   ├── context/  # Auth context
│   │   └── lib/      # API helpers
│   └── package.json
├── package.json      # Workspace root
└── database.sqlite   # Base de datos
```

## API Endpoints

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | /api/auth/login | Iniciar sesión |
| GET | /api/auth/me | Usuario actual |
| GET/POST | /api/users | Gestión de usuarios |
| GET/POST | /api/products | Gestión de productos |
| GET | /api/products/:id/price-history | Historial de precios |
| GET/POST | /api/sales | Gestión de ventas |
| GET/POST | /api/clients | Gestión de clientes |
| GET | /api/debts | Lista de deudas |
| POST | /api/debts/:id/pay | Registrar pago |
| GET | /api/dashboard/stats | Estadísticas |

## Licencia

MIT
