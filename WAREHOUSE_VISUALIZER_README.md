# Visualizador de Almacenes con Estructura Jerárquica

## 📋 Resumen

Se ha implementado un sistema completo de visualización de almacenes con estructura jerárquica completa, incluyendo vistas 2D y 3D, y un selector jerárquico de ubicaciones.

### Estructura Jerárquica Implementada:
```
Almacén → Zona → Pasillo → Estante → Posición
```

## 🎯 Componentes Creados

### 1. **Composables Actualizados**

#### `useWarehouseVisualizer.ts`
- Maneja la lógica de visualización con la nueva estructura jerárquica
- Integra datos de todas las entidades: almacenes, zonas, pasillos, estantes, posiciones
- Utiliza la vista SQL `v_product_locations_detailed` para datos optimizados

#### `useWarehouseManager.ts` (Existente)
- Gestión CRUD completa de toda la jerarquía
- Operaciones en cascada para mantener integridad de datos

### 2. **Componentes de Visualización**

#### `Warehouse2DView.vue`
- Vista 2D interactiva en SVG
- Muestra zonas, pasillos, estantes y ubicaciones de productos
- Sistema de colores basado en ocupación
- Controles para mostrar/ocultar etiquetas
- Panel de información detallada al hacer clic

#### `Warehouse3DView.vue`
- Vista 3D completa usando Three.js
- Renderizado de almacén, zonas, pasillos, estantes con niveles
- Productos como esferas con colores según ocupación
- Controles de cámara (rotación, zoom, pan)
- Modo wireframe/sólido
- Auto-rotación opcional
- Sistema de iluminación y sombras

#### `HierarchicalLocationSelector.vue`
- Selector jerárquico completo con validación
- Navegación tipo breadcrumb
- Auto-selección inteligente
- Mapa visual de posiciones del estante
- Estados de disponibilidad (disponible, reservada, ocupada)
- Detalles completos de la posición seleccionada

### 3. **Vistas Principales**

#### `WarehouseVisualizerView.vue`
- Vista principal que integra todos los componentes
- Selector de modos de vista (tabla, 2D, 3D)
- Filtros por almacén, producto y búsqueda
- Estadísticas resumidas
- Modal de selector jerárquico
- Modal de detalles de ubicación

#### `WarehouseManagementView.vue` (Actualizada)
- Agregado botón para acceder al visualizador
- Integración completa con la gestión existente

## 🗄️ Base de Datos

### Tablas Nuevas (desde `warehouse_improvements.sql`):
- `warehouse_aisles` - Pasillos dentro de las zonas
- `warehouse_shelves` - Estantes en los pasillos
- `warehouse_shelf_positions` - Posiciones específicas en los estantes

### Vista Optimizada:
- `v_product_locations_detailed` - Vista consolidada con toda la jerarquía

### Triggers Automáticos:
- Cálculo automático de coordenadas para posiciones
- Generación automática de códigos de ubicación
- Ejemplo: `A1-01-3-2` (Pasillo-Estante-Nivel-Posición)

## 🚀 Instalación y Configuración

### 1. **Dependencias**
```bash
pnpm add three @types/three
```

### 2. **Base de Datos**
1. Ejecutar `warehouse_improvements.sql` para crear las nuevas tablas
2. Ejecutar `sample_warehouse_data.sql` para datos de ejemplo (reemplazar `YOUR_COMPANY_ID`)

### 3. **Rutas**
Agregar a tu router:
```javascript
{
  path: '/warehouse/visualizer',
  name: 'WarehouseVisualizer',
  component: () => import('@/views/Warehouse/WarehouseVisualizerView.vue')
}
```

## 🎮 Funcionalidades

### Vista 2D:
- **Zoom y Pan**: Navegación intuitiva
- **Colores por Estado**: Verde (bajo), Amarillo (medio), Rojo (alto)
- **Información Contextual**: Click en elementos para detalles
- **Leyenda Visual**: Identificación de cada elemento

### Vista 3D:
- **Navegación**: Drag para rotar, rueda para zoom, click derecho para pan
- **Renderizado Realista**: Sombras, iluminación, texturas
- **Interactividad**: Click en objetos para información detallada
- **Controles Avanzados**: Wireframe, auto-rotación, reset de cámara

### Selector Jerárquico:
- **Navegación en Cascada**: Selección automática de dependencias
- **Validación Completa**: Errores claros en campos requeridos
- **Mapa Visual**: Grid de posiciones del estante seleccionado
- **Estados Visuales**: Colores para disponible, reservada, ocupada
- **Auto-selección**: Botón para llenar automáticamente

## 🎨 Personalización

### Colores de Estado:
```typescript
// En los componentes de visualización
const getLocationColor = (location) => {
  const percentage = (stock / capacity) * 100
  if (percentage >= 80) return '#ef4444' // rojo
  if (percentage >= 60) return '#f59e0b' // amarillo
  if (percentage >= 20) return '#10b981' // verde
  return '#6b7280' // gris
}
```

### Configuración 3D:
```typescript
// Materiales personalizables
const materials = {
  zone: new THREE.MeshLambertMaterial({ color: 0x3b82f6 }),
  shelf: new THREE.MeshLambertMaterial({ color: 0x8b5cf6 }),
  product: new THREE.MeshLambertMaterial({ color: 0x10b981 })
}
```

## 📊 Ejemplos de Uso

### 1. **Gestión Básica**
```vue
<HierarchicalLocationSelector
  :warehouses="warehouses"
  :zones="zones"
  :aisles="aisles"
  :shelves="shelves"
  :positions="positions"
  v-model="selectedLocation"
  :required="true"
/>
```

### 2. **Visualización 3D**
```vue
<Warehouse3DView
  :warehouse-data="selectedWarehouseData"
  :filtered-locations="filteredLocations"
  :loading="loading"
/>
```

## 🔧 Resolución de Problemas

### Three.js no carga:
- Verificar que `three` está instalado
- Revisar la consola del navegador por errores WebGL

### Datos no aparecen:
- Verificar que `YOUR_COMPANY_ID` fue reemplazado en el SQL
- Confirmar que la vista `v_product_locations_detailed` existe
- Revisar permisos RLS en Supabase

### Vista 2D/3D en blanco:
- Verificar que existen datos en `product_location` con coordenadas
- Confirmar que las dimensiones del almacén están configuradas

## 🎯 Próximas Mejoras

### Funcionalidades Adicionales:
- [ ] Exportación de mapas en PDF/PNG
- [ ] Animaciones de movimiento de productos
- [ ] Heatmaps de actividad
- [ ] Modo realidad aumentada (AR)
- [ ] Integración con códigos QR/códigos de barras
- [ ] Planificación automática de rutas de picking
- [ ] Dashboard de métricas de almacén

### Optimizaciones:
- [ ] Virtualización para almacenes muy grandes
- [ ] Caching de geometrías 3D
- [ ] Web Workers para cálculos pesados
- [ ] Progressive loading de datos

## 📝 Estructura de Archivos

```
src/
├── components/
│   ├── warehouse/
│   │   ├── Warehouse2DView.vue
│   │   ├── Warehouse3DView.vue
│   │   └── HierarchicalLocationSelector.vue
│   └── ui/
│       └── Modal.vue
├── composables/
│   ├── useWarehouseVisualizer.ts
│   └── useWarehouseManager.ts
└── views/
    └── Warehouse/
        ├── WarehouseVisualizerView.vue
        └── WarehouseManagementView.vue
```

## 🤝 Contribuciones

Para contribuir:
1. Seguir la estructura jerárquica existente
2. Mantener consistencia en naming conventions
3. Agregar tests para nuevas funcionalidades
4. Documentar cambios en este README

---

**¡Tu sistema de visualización de almacenes está listo para usar! 🎉**