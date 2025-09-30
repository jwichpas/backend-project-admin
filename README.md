# Sistema de Administración y Punto de Venta (POS)

Sistema integral de administración empresarial con punto de venta moderno, facturación electrónica SUNAT, gestión de inventarios con almacenes 2D/3D y dashboard de ventas con gráficos interactivos. Construido con Vue 3, TypeScript, TailwindCSS v4 y Supabase.

## 🚀 Características Principales

### 💼 Gestión Empresarial
- **Dashboard Interactivo** con gráficos de ventas usando ApexCharts
- **Gestión de Compañías** multi-empresa con sucursales
- **Administración de Usuarios** con roles y permisos
- **Gestión de Clientes** con datos completos y historial
- **Gestión de Proveedores** con compras y pagos

### 🛒 Punto de Venta (POS)
- **Interfaz Moderna de POS** con carrito de compras intuitivo
- **Búsqueda Inteligente** de productos con filtros avanzados
- **Edición Inline** de productos en el carrito con animaciones elegantes
- **Conversiones de Unidades** automáticas (ej: litros a cajas)
- **Múltiples Métodos de Pago** y cálculo automático de cambio
- **Generación de Documentos** (Facturas, Boletas) desde el POS

### 📊 Facturación Electrónica
- **Integración SUNAT** para facturación electrónica peruana
- **Generación XML/PDF** automática de comprobantes en 2 formatos:
  - **Formato A4**: Diseño moderno y limpio para impresión estándar
  - **Formato Ticket 80mm**: Optimizado para impresoras térmicas
- **Boletas y Facturas** con numeración secuencial
- **Guías de Remisión** electrónicas
- **Cumplimiento Normativo** con validaciones SUNAT
- **Logos Personalizados** en documentos desde base de datos

### 📦 Gestión de Inventarios
- **Control de Stock** en tiempo real con alertas de stock mínimo
- **Gestión de Almacenes** con ubicaciones específicas
- **Visualización 2D/3D** de ubicaciones de productos usando Three.js y Konva.js
- **Sistema de Unidades** con conversiones automáticas
- **Trazabilidad Completa** de movimientos de inventario
- **Gestión de Compras** con órdenes de compra

### 🚚 Logística
- **Gestión de Vehículos** para transporte
- **Guías de Remisión** electrónicas
- **Órdenes de Despacho** integradas

### 📈 Análisis y Reportes
- **Dashboard de Ventas** con gráficos interactivos
- **Reportes de Inventario** y movimientos de stock
- **Análisis de Tendencias** de ventas por período
- **Métricas en Tiempo Real** del negocio

## 🛠️ Tecnologías

### Frontend
- **Vue 3** con Composition API y sintaxis `<script setup>`
- **TypeScript** para mayor seguridad de tipos y mejor DX
- **TailwindCSS v4** con sistema de componentes shadcn/ui
- **Pinia** para gestión de estado reactiva
- **Vite** con Rolldown bundler para builds ultrarrápidos

### Backend & Servicios
- **Supabase** (PostgreSQL, Auth, Storage, Realtime)
- **Laravel 10** microservicio para facturación electrónica
- **Greenter** librería PHP para integración SUNAT

### Visualización & Gráficos
- **ApexCharts** para dashboards interactivos
- **Three.js** para visualización 3D de almacenes
- **Konva.js** para mapas 2D de ubicaciones

### Calidad & Testing
- **Vitest** para testing unitario
- **ESLint + Prettier** para calidad de código
- **TypeScript Strict** para máxima seguridad de tipos

## 🛠️ Configuración del Entorno de Desarrollo

### IDE Recomendado
[VSCode](https://code.visualstudio.com/) + [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (desactivar Vetur)

### Soporte de Tipos para Importaciones `.vue`
TypeScript no puede manejar información de tipos para importaciones `.vue` por defecto, por lo que utilizamos `vue-tsc` para verificación de tipos. En editores, necesitamos [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) para hacer que el servicio de lenguaje TypeScript reconozca los tipos `.vue`.

## ⚙️ Configuración del Proyecto

### Instalación de Dependencias

```sh
pnpm install
```

### Variables de Entorno

Crea un archivo `.env` con las siguientes variables:

```env
# Supabase
VITE_SUPABASE_URL=tu_supabase_url
VITE_SUPABASE_ANON_KEY=tu_supabase_key

# Microservicio de Facturación (Laravel)
VITE_FACTURACION_URL=http://localhost:8000
VITE_FACTURACION_USER=tu_usuario
VITE_FACTURACION_PASSWORD=tu_password
```

## 🚀 Scripts de Desarrollo

### Desarrollo Local
```sh
pnpm dev                    # Servidor de desarrollo con hot reload
```

### Construcción para Producción
```sh
pnpm build                  # Verificación de tipos + construcción optimizada
pnpm preview                # Vista previa de la construcción de producción
```

### Calidad de Código
```sh
pnpm lint                   # Linting con ESLint (incluye --fix)
pnpm format                 # Formateo de código con Prettier
pnpm type-check             # Verificación de tipos con vue-tsc
```

### Testing
```sh
pnpm test:unit              # Pruebas unitarias con Vitest
```

## 🗄️ Supabase (Desarrollo Local)

Si utilizas el stack local de Supabase:

```sh
npx supabase start          # Iniciar servicios locales de Supabase
npx supabase stop           # Detener servicios locales
npx supabase status         # Estado de los servicios
```

### Servicios Locales de Supabase
- **Base de datos**: `http://localhost:54322`
- **API REST**: `http://localhost:54321`
- **Studio**: `http://localhost:54323`
- **Inbucket (Email)**: `http://localhost:54324`

## 📁 Estructura del Proyecto

```
backend-project-admin/
├── src/
│   ├── components/
│   │   └── ui/                    # Componentes shadcn/ui
│   │       ├── button/
│   │       ├── card/
│   │       ├── dialog/
│   │       ├── input/
│   │       ├── table/
│   │       └── ...
│   ├── composables/              # Funciones composables de Vue
│   ├── layouts/                  # Layouts de la aplicación
│   │   ├── AuthLayout.vue        # Layout para autenticación
│   │   └── DefaultLayout.vue     # Layout principal con sidebar
│   ├── lib/                      # Utilidades y configuración
│   │   ├── supabase.ts          # Cliente de Supabase
│   │   └── utils.ts             # Funciones de utilidad
│   ├── stores/                   # Stores de Pinia (Estado Global)
│   │   ├── auth.ts              # Autenticación y usuario actual
│   │   ├── companies.ts         # Gestión de empresas
│   │   ├── branches.ts          # Sucursales
│   │   ├── customers.ts         # Clientes
│   │   ├── suppliers.ts         # Proveedores
│   │   ├── products.ts          # Productos e inventario
│   │   ├── sales.ts             # POS y ventas
│   │   ├── salesDashboard.ts    # Dashboard de ventas
│   │   ├── purchases.ts         # Compras
│   │   ├── despatchGuides.ts    # Guías de remisión
│   │   ├── sunat.ts             # Integración SUNAT
│   │   └── theme.ts             # Tema de la aplicación
│   ├── views/                    # Vistas/Páginas del sistema
│   │   ├── Auth/                # Páginas de autenticación
│   │   │   ├── LoginView.vue
│   │   │   └── RegisterView.vue
│   │   ├── Sales/               # Módulo de ventas
│   │   │   ├── SalesPosView.vue        # Punto de venta
│   │   │   ├── SalesDocsView.vue       # Documentos de venta
│   │   │   └── SalesDashboardView.vue  # Dashboard de ventas
│   │   ├── Products/            # Gestión de productos
│   │   │   ├── ProductsView.vue
│   │   │   └── ProductFormView.vue
│   │   ├── Customers/           # Gestión de clientes
│   │   │   └── CustomersView.vue
│   │   ├── Suppliers/           # Gestión de proveedores
│   │   │   └── SuppliersView.vue
│   │   ├── Purchases/           # Gestión de compras
│   │   │   └── PurchasesView.vue
│   │   ├── Warehouse/           # Almacenes e inventario
│   │   │   ├── WarehouseView.vue
│   │   │   └── LocationsView.vue
│   │   └── Vehicles/            # Gestión de vehículos
│   │       └── VehiclesView.vue
│   ├── router/                   # Configuración de rutas Vue Router
│   │   └── index.ts
│   ├── App.vue                   # Componente raíz
│   ├── main.ts                   # Punto de entrada
│   └── style.css                 # Estilos globales y TailwindCSS
├── public/                       # Archivos estáticos
├── supabase/                     # Configuración de Supabase
│   ├── config.toml              # Configuración local
│   ├── migrations/              # Migraciones de base de datos
│   └── seed.sql                 # Datos de prueba
├── components.json               # Configuración de shadcn/ui
├── tailwind.config.js           # Configuración de TailwindCSS
├── vite.config.ts               # Configuración de Vite
├── tsconfig.json                # Configuración de TypeScript
└── package.json                 # Dependencias y scripts
```

## 🎨 Sistema de Componentes

Este proyecto utiliza **shadcn/ui** con la variante "new-york" y TailwindCSS v4. Los componentes se configuran automáticamente mediante `components.json`.

### Aliases de Rutas
- `@/` → `src/`
- `@/components` → `src/components`
- `@/lib` → `src/lib`
- `@/stores` → `src/stores`
- `@/views` → `src/views`

## 🔄 Arquitectura de Estado (Pinia Stores)

### Stores Principales

1. **auth.ts** - Gestión de autenticación
   - Login/logout
   - Usuario actual
   - Permisos y roles

2. **companies.ts** - Gestión multi-empresa
   - CRUD de empresas
   - Cambio de empresa activa
   - Configuración empresarial

3. **sales.ts** - Sistema POS y ventas
   - Carrito de compras
   - Procesamiento de ventas
   - Generación de documentos

4. **products.ts** - Inventario
   - Gestión de productos
   - Control de stock
   - Conversiones de unidades

5. **salesDashboard.ts** - Analytics
   - Métricas de ventas
   - Gráficos interactivos
   - Reportes

## 🔗 Integración con Microservicios

### Microservicio de Facturación (Laravel)
El frontend se integra con un microservicio Laravel independiente para:
- Generación de XML/PDF de comprobantes
- Envío a SUNAT
- Validaciones fiscales
- Almacenamiento de CDR (Constancia de Recepción)

**Endpoint principal**: `POST /api/invoices/download-pdf`
- Soporta formato A4 y Ticket (80mm)
- Incluye logo de empresa desde base de datos
- Diseño moderno sin gradientes

## 📄 Formatos de PDF

El sistema genera PDFs en dos formatos seleccionables por el usuario:

### Formato A4
- Diseño moderno y limpio
- Color de acento azul (#3498db)
- Layout tipo card con sombras
- Incluye logo de empresa
- Optimizado para impresión estándar

### Formato Ticket (80mm)
- Optimizado para impresoras térmicas
- Fuente monoespaciada (Courier New)
- Diseño compacto
- Márgenes ajustados (5mm 3mm)
- Incluye logo de empresa

## 🚀 Características Recientes

### ✨ Últimas Actualizaciones

- **Generación de PDF multi-formato**: Selección entre A4 y Ticket 80mm
- **Rediseño de comprobantes**: Diseño moderno sin gradientes
- **Soporte de logos**: Logos personalizados desde base de datos (`companies.logo_path`)
- **Migración a Spatie PDF**: Mejor rendimiento en generación de PDFs
- **Diálogo de selección de formato**: UI mejorada para elegir formato antes de descargar

## 📝 Configuración Adicional

Para más detalles de configuración, consulta:
- [Referencia de Configuración de Vite](https://vite.dev/config/)
- [Documentación de shadcn/ui](https://ui.shadcn.com/)
- [Documentación de Supabase](https://supabase.com/docs)
- [Documentación de Vue 3](https://vuejs.org/)
- [Documentación de Pinia](https://pinia.vuejs.org/)

## 📞 Soporte

Para problemas o preguntas sobre el proyecto, consulta la documentación en el repositorio o contacta al equipo de desarrollo.

## 📄 Licencia

Este proyecto es privado y propietario. Todos los derechos reservados.