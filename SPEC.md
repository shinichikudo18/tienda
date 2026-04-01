# TiendaMi - Sistema de Gestión de Tienda

## 1. Concept & Vision

**TiendaMi** es una aplicación web minimalista pero poderosa para pequeñas tiendas. Combina la calidez visual de un bazar tradicional con la eficiencia moderna de un sistema POS. El diseño evoca mercados latinoamericanos: colores cálidos terrosos, tipografía amigable, y una interfaz que se siente como "contar plata en la mano" - tangible y clara.

## 2. Design Language

### Aesthetic Direction
Inspiración en marchés tradicionales: cálido, accesible, con toques de modernidad. Paleta rica con acentos vibrantes para acciones importantes.

### Color Palette
```
--primary: #E67E22 (Naranja terracota - calidez)
--primary-dark: #D35400
--secondary: #2C3E50 (Azul noche - profesionalismo)
--accent: #27AE60 (Verde - dinero/éxito)
--danger: #E74C3C (Rojo - deuda/alerta)
--warning: #F39C12 (Amarillo - atención)
--background: #FDF6E3 (Crema suave)
--surface: #FFFFFF
--text-primary: #2C3E50
--text-secondary: #7F8C8D
```

### Typography
- **Headings**: Poppins (700, 600) - moderna y amigable
- **Body**: Inter (400, 500, 600) - legible en móvil
- **Numbers/Money**: JetBrains Mono (500) - claridad en cifras

### Motion Philosophy
- Transiciones suaves: 200ms ease-out para hover
- Slide-in para modales desde abajo en móvil
- Números que "cuentan" al cambiar

## 3. Features

### 3.1 Roles de Usuario
- **Admin**: Gestión completa de usuarios, productos, ventas, configuración
- **Supervisor**: Puede modificar precios (con historial), ver todo el inventario y ventas, gestionar fiados
- **Vendedor**: Solo ve su inventario asignado y sus ventas realizadas

### 3.2 Inventario con Empaquetado
- Crear productos con presentación de compra (ej: 1Kg de maní a $5)
- Definir empaquetado (10 bolsas de 100g)
- Precio de venta configurable por unidad
- **Historial de cambios de precio** con fecha, usuario y valores anterior/nuevo
- Stock por vendedor
- Alertas de stock bajo

### 3.3 Ventas
- Venta rápida con grid de productos
- Tipos: Contado o Fiado
- Descuentos opcionales
- Historial de ventas

### 3.4 Flujo de Caja
- Dinero en caja (ventas del día)
- Valor en inventario
- Total en fiados (deuda de clientes)
- Gráficos de ventas

### 3.5 Clientes y Fiados
- Registro de clientes
- Seguimiento de deudas
- Abonos parciales/totales
- Historial de pagos

## 4. Technical Stack

- **Frontend**: React + Vite + TailwindCSS
- **Backend**: Node.js + Express
- **Database**: SQLite con better-sqlite3
- **Auth**: JWT + bcrypt
