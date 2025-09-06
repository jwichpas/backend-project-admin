# Backend Project Admin

Una aplicación de administración moderna construida con Vue 3, TypeScript, TailwindCSS v4 y shadcn/ui, con integración completa de Supabase para backend services.

## 🚀 Características

- **Vue 3** con Composition API y sintaxis `<script setup>`
- **TypeScript** para mayor seguridad de tipos
- **TailwindCSS v4** con sistema de componentes shadcn/ui
- **Pinia** para gestión de estado reactiva
- **Supabase** integrado (base de datos, autenticación, tiempo real)
- **Vitest** para testing unitario
- **ESLint + Prettier** para calidad de código

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
src/
├── components/
│   └── ui/                 # Componentes shadcn/ui
├── layouts/               # Layouts de la aplicación
│   ├── AuthLayout.vue     # Layout para autenticación
│   └── DefaultLayout.vue  # Layout principal
├── stores/                # Stores de Pinia
│   ├── auth.ts           # Estado de autenticación
│   ├── company.ts        # Datos de empresa
│   └── theme.ts          # Preferencias de tema
├── views/                 # Páginas/vistas
│   └── Auth/             # Páginas de autenticación
└── router/               # Configuración de rutas
```

## 🎨 Sistema de Componentes

Este proyecto utiliza **shadcn/ui** con la variante "new-york" y TailwindCSS v4. Los componentes se configuran automáticamente mediante `components.json`.

### Aliases de Rutas
- `@/` → `src/`
- `@/components` → `src/components`
- `@/lib` → `src/lib`

## 📝 Configuración Adicional

Para más detalles de configuración, consulta:
- [Referencia de Configuración de Vite](https://vite.dev/config/)
- [Documentación de shadcn/ui](https://ui.shadcn.com/)
- [Documentación de Supabase](https://supabase.com/docs)
