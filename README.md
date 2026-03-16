# 🪒 Barbería - Sistema de Gestión

Sistema completo de gestión para barberías con página pública y panel de administración.

## ✨ Características

### Página Pública
- **Hero Section** - Presentación del negocio con estadísticas
- **Servicios** - Catálogo de servicios con precios y duración
- **Galería** - Muestra de trabajos realizados
- **Agendamiento** - Sistema de citas online
- **Contacto** - Información de contacto, horarios y redes sociales
- **WhatsApp flotante** - Botón de contacto directo

### Panel de Administración
- **Gestión de Citas** - Ver, confirmar, cancelar y eliminar citas
- **Gestión de Servicios** - CRUD completo con imágenes
- **Galería** - Administrar fotos de trabajos
- **Configuración** - Editar toda la información del negocio:
  - Nombre, logo y lema
  - Teléfono, WhatsApp, email
  - Dirección y mapa
  - Horarios de atención
  - Redes sociales
  - Mensaje de WhatsApp predefinido

## 🚀 Despliegue en Vercel

### Paso 1: Crear base de datos en Neon

1. Ve a [neon.tech](https://neon.tech) y crea una cuenta gratuita
2. Crea un nuevo proyecto llamado "barbershop"
3. Copia la cadena de conexión (DATABASE_URL)

### Paso 2: Desplegar en Vercel

1. Ve a [vercel.com](https://vercel.com) y conecta tu repositorio
2. Importa el proyecto
3. Configura las variables de entorno:
   - `DATABASE_URL`: Tu cadena de conexión de Neon
   - `DIRECT_URL`: La misma cadena de conexión de Neon

### Paso 3: ¡Listo!

Vercel automáticamente:
- Ejecutará el script de prebuild
- Configurará la base de datos PostgreSQL
- Poblará los datos iniciales
- Desplegará la aplicación

## 🛠️ Desarrollo Local

```bash
# Instalar dependencias
bun install

# Configurar base de datos
bun run db:push
bun run db:seed

# Iniciar servidor de desarrollo
bun run dev
```

## 🔐 Acceso al Panel Admin

- **Usuario**: `admin`
- **Contraseña**: `admin123`

_Cambia estas credenciales desde el panel de administración._

## 📱 Tecnologías

- **Frontend**: Next.js 16, React 19, TypeScript
- **Estilos**: Tailwind CSS 4
- **Base de datos**: Prisma ORM (SQLite en desarrollo, PostgreSQL en producción)
- **UI**: shadcn/ui components
- **Iconos**: Lucide React

## 📁 Estructura del Proyecto

```
├── prisma/
│   ├── schema.prisma          # Schema para SQLite (desarrollo)
│   ├── schema.postgresql.prisma # Schema para PostgreSQL (producción)
│   └── seed.ts                # Datos iniciales
├── src/
│   ├── app/
│   │   ├── page.tsx           # Página principal (pública + admin)
│   │   ├── layout.tsx         # Layout principal
│   │   ├── globals.css        # Estilos globales
│   │   └── api/               # API routes
│   │       ├── auth/          # Autenticación
│   │       ├── citas/         # Gestión de citas
│   │       ├── servicios/     # Gestión de servicios
│   │       ├── cortes/        # Gestión de galería
│   │       └── configuracion/ # Configuración del negocio
│   └── lib/
│       └── db.ts              # Cliente de Prisma
├── scripts/
│   └── prebuild.ts            # Script para Vercel
└── vercel.json                # Configuración de Vercel
```

## 🌐 Variables de Entorno

### Desarrollo (.env)
```
DATABASE_URL="file:./dev.db"
```

### Producción (Vercel)
```
DATABASE_URL="postgresql://usuario:password@ep-xxx.neon.tech/barbershop?sslmode=require"
DIRECT_URL="postgresql://usuario:password@ep-xxx.neon.tech/barbershop?sslmode=require"
```

## 📝 Licencia

MIT

