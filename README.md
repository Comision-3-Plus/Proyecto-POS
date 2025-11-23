# POS NEXUS - Sistema de Punto de Venta Multi-Tenant

Repositorio unificado que contiene dos servicios principales del ecosistema POS NEXUS.

## 📁 Estructura del Proyecto

```
POS-NEXUS/
├── POS/                          # Sistema principal POS (Python/FastAPI + Next.js)
└── stock-in-order-master/        # Sistema de gestión de stock (Go + React/Vite)
```

## 🚀 Proyectos

### **POS** - Sistema Principal
Sistema de punto de venta multi-tenant desarrollado con:
- **Backend**: FastAPI + SQLModel + PostgreSQL
- **Frontend**: Next.js 14 + React + TailwindCSS
- **Features**: Gestión de ventas, productos, usuarios, roles, reportes

📖 [Ver documentación completa →](./POS/README.md)

### **stock-in-order-master** - Gestión de Stock
Sistema complementario para gestión avanzada de inventario:
- **Backend**: Go + PostgreSQL
- **Frontend**: React + Vite + TailwindCSS
- **Features**: Órdenes de compra, proveedores, delegación de tareas, notificaciones

📖 [Ver documentación completa →](./stock-in-order-master/RESUMEN_PROYECTO.md)

## 🛠️ Tecnologías

### POS
- Python 3.11+
- FastAPI
- PostgreSQL
- Next.js 14
- Supabase

### Stock-in-Order
- Go 1.21+
- PostgreSQL
- RabbitMQ
- React 19
- Docker

## 📦 Instalación Rápida

### POS
```bash
cd POS
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Stock-in-Order
```bash
cd stock-in-order-master
docker-compose up -d
```

## 📄 Licencia

MIT

## 👥 Autor

**Juan Sarmiento** - [@JuaniSarmiento](https://github.com/JuaniSarmiento)
