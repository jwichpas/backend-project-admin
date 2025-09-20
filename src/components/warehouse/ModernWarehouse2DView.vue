<template>
  <div class="relative w-full h-full bg-white dark:bg-zinc-950 rounded-xl overflow-hidden shadow-2xl border border-zinc-200 dark:border-zinc-800">
    <!-- Loading State -->
    <div v-if="loading" class="absolute inset-0 flex items-center justify-center bg-slate-900/95 backdrop-blur-md z-50">
      <div class="text-center">
        <div class="relative mb-8">
          <div class="w-20 h-20 border-4 border-blue-500/30 border-t-blue-400 rounded-full animate-spin mx-auto"></div>
          <div class="absolute inset-0 flex items-center justify-center">
            <div class="w-3 h-3 bg-blue-400 rounded-full animate-pulse"></div>
          </div>
        </div>
        <h3 class="text-xl font-bold text-white mb-2">Cargando Visualizador Moderno</h3>
        <p class="text-blue-300 mb-4">Procesando canvas 2D avanzado...</p>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else-if="!warehouseData" class="absolute inset-0 flex items-center justify-center">
      <div class="text-center max-w-lg px-8">
        <div class="relative mb-8">
          <div class="w-32 h-32 mx-auto bg-gradient-to-br from-blue-500/20 to-purple-600/20 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-white/10">
            <Building2 class="w-16 h-16 text-blue-400" />
          </div>
        </div>
        <h3 class="text-2xl font-bold text-white mb-3">Visualizador 2D Moderno</h3>
        <p class="text-slate-400 text-lg leading-relaxed">Selecciona un almacén para acceder a la vista 2D profesional con tecnología Canvas avanzada.</p>
      </div>
    </div>

    <!-- Modern Canvas Interface -->
    <div v-else class="relative w-full h-full">
      <!-- Professional Header with Advanced Controls -->
      <div class="absolute top-0 left-0 right-0 z-40 bg-slate-800/95 backdrop-blur-xl border-b border-slate-700/50">
        <div class="flex items-center justify-between px-8 py-6">
          <!-- Warehouse Status Info -->
          <div class="flex items-center gap-6">
            <div class="flex items-center gap-4">
              <div class="relative">
                <div class="w-4 h-4 bg-emerald-400 rounded-full animate-pulse shadow-lg shadow-emerald-400/50"></div>
                <div class="absolute inset-0 w-4 h-4 bg-emerald-400 rounded-full animate-ping"></div>
              </div>
              <div>
                <h1 class="text-xl font-bold text-white tracking-tight">{{ warehouseData.warehouse.name }}</h1>
                <div class="flex items-center gap-4 mt-1">
                  <span class="text-sm text-emerald-400 font-medium">{{ warehouseData.zones.length }} zonas activas</span>
                  <span class="text-sm text-blue-400 font-medium">{{ filteredLocations.length }} productos ubicados</span>
                  <span class="text-sm text-purple-400 font-medium">Canvas Engine: {{ canvasEngine }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Advanced Modern Controls -->
          <div class="flex items-center gap-4">
            <!-- Rendering Mode -->
            <div class="flex items-center bg-slate-700/50 rounded-xl p-1 border border-slate-600/50">
              <Button
                size="sm"
                :variant="renderMode === 'performance' ? 'default' : 'ghost'"
                :class="renderMode === 'performance' ? 'bg-gradient-to-r from-green-500 to-green-600 text-white' : 'text-slate-300 hover:text-white'"
                class="h-9 px-4 font-semibold transition-all duration-200"
                @click="setRenderMode('performance')"
              >
                <Zap class="w-4 h-4 mr-2" />
                Performance
              </Button>
              <Button
                size="sm"
                :variant="renderMode === 'quality' ? 'default' : 'ghost'"
                :class="renderMode === 'quality' ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white' : 'text-slate-300 hover:text-white'"
                class="h-9 px-4 font-semibold transition-all duration-200"
                @click="setRenderMode('quality')"
              >
                <Sparkles class="w-4 h-4 mr-2" />
                Quality
              </Button>
            </div>

            <!-- Zoom Controls -->
            <div class="flex items-center bg-slate-700/50 rounded-xl p-1 border border-slate-600/50 gap-1">
              <Button size="sm" variant="ghost" class="h-9 px-3 text-slate-300 hover:text-white" @click="zoomOut">
                <Minus class="w-4 h-4" />
              </Button>
              <div class="px-3 py-2 text-sm font-mono text-slate-300 min-w-[60px] text-center">
                {{ Math.round(camera.zoom * 100) }}%
              </div>
              <Button size="sm" variant="ghost" class="h-9 px-3 text-slate-300 hover:text-white" @click="zoomIn">
                <Plus class="w-4 h-4" />
              </Button>
              <Button size="sm" variant="ghost" class="h-9 px-3 text-slate-300 hover:text-white border-l border-slate-600/50" @click="resetView">
                <RotateCcw class="w-4 h-4" />
              </Button>
            </div>

            <!-- Edit Mode Controls -->
            <div class="flex items-center bg-slate-700/50 rounded-xl p-1 border border-slate-600/50">
              <Button
                size="sm"
                :variant="editMode ? 'default' : 'ghost'"
                :class="editMode ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/25' : 'text-slate-300 hover:text-white'"
                class="h-9 px-4 font-semibold transition-all duration-200"
                @click="toggleEditMode"
              >
                <Edit class="w-4 h-4 mr-2" />
                {{ editMode ? 'Edición' : 'Editar' }}
              </Button>
            </div>

            <!-- Creation Tools -->
            <div v-if="editMode" class="flex items-center bg-slate-700/50 rounded-xl p-1 border border-slate-600/50 gap-1">
              <Button
                size="sm"
                :variant="creationMode === 'zone' ? 'default' : 'ghost'"
                :class="creationMode === 'zone' ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white' : 'text-slate-300 hover:text-white'"
                class="h-9 px-3 text-sm transition-all duration-200"
                @click="setCreationMode('zone')"
              >
                <Square class="w-4 h-4 mr-1" />Zona
              </Button>
              <Button
                size="sm"
                :variant="creationMode === 'aisle' ? 'default' : 'ghost'"
                :class="creationMode === 'aisle' ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white' : 'text-slate-300 hover:text-white'"
                class="h-9 px-3 text-sm transition-all duration-200"
                @click="setCreationMode('aisle')"
              >
                <Minus class="w-4 h-4 mr-1" />Pasillo
              </Button>
              <Button
                size="sm"
                :variant="creationMode === 'shelf' ? 'default' : 'ghost'"
                :class="creationMode === 'shelf' ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white' : 'text-slate-300 hover:text-white'"
                class="h-9 px-3 text-sm transition-all duration-200"
                @click="setCreationMode('shelf')"
              >
                <Layers class="w-4 h-4 mr-1" />Estante
              </Button>
            </div>

            <!-- View Options -->
            <div class="flex items-center bg-slate-700/50 rounded-xl p-1 border border-slate-600/50 gap-1">
              <Button
                size="sm"
                :variant="showGrid ? 'default' : 'ghost'"
                :class="showGrid ? 'bg-slate-600 text-white' : 'text-slate-300 hover:text-white'"
                class="h-9 px-3 text-sm"
                @click="showGrid = !showGrid"
              >
                <Grid3x3 class="w-4 h-4 mr-1" />Grid
              </Button>
              <Button
                size="sm"
                :variant="showHeatmap ? 'default' : 'ghost'"
                :class="showHeatmap ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white' : 'text-slate-300 hover:text-white'"
                class="h-9 px-3 text-sm"
                @click="showHeatmap = !showHeatmap"
              >
                <Thermometer class="w-4 h-4 mr-1" />Heat
              </Button>
              <Button
                size="sm"
                :variant="showLabels ? 'default' : 'ghost'"
                :class="showLabels ? 'bg-slate-600 text-white' : 'text-slate-300 hover:text-white'"
                class="h-9 px-3 text-sm"
                @click="showLabels = !showLabels"
              >
                <Tag class="w-4 h-4 mr-1" />Labels
              </Button>
            </div>
          </div>
        </div>
      </div>

      <!-- Modern Canvas Container -->
      <div class="relative pt-24 w-full h-full overflow-hidden">
        <canvas
          ref="canvasRef"
          :width="canvasSize.width"
          :height="canvasSize.height"
          class="w-full h-full"
          :class="{
            'cursor-move': !editMode,
            'cursor-crosshair': editMode && creationMode,
            'cursor-pointer': editMode && !creationMode
          }"
          @mousedown="handleMouseDown"
          @mousemove="handleMouseMove"
          @mouseup="handleMouseUp"
          @wheel="handleWheel"
          @mouseleave="handleMouseLeave"
          @click="handleClick"
          @dblclick="handleDoubleClick"
        />

        <!-- Modern Minimap -->
        <div class="absolute bottom-4 right-4 w-48 h-36 bg-slate-800/90 backdrop-blur-sm rounded-lg border border-slate-600/50 overflow-hidden">
          <div class="p-2">
            <div class="text-xs font-medium text-slate-300 mb-2">Mapa General</div>
            <canvas
              ref="minimapRef"
              width="176"
              height="120"
              class="w-full h-full rounded border border-slate-600/30"
            />
          </div>
        </div>

        <!-- Performance Stats -->
        <div v-if="showStats" class="absolute top-24 left-4 bg-slate-800/90 backdrop-blur-sm rounded-lg border border-slate-600/50 p-4">
          <div class="text-xs font-medium text-slate-300 mb-3">Estadísticas de Rendimiento</div>
          <div class="space-y-2 text-xs">
            <div class="flex justify-between">
              <span class="text-slate-400">FPS:</span>
              <span class="text-green-400 font-mono">{{ Math.round(stats.fps) }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-400">Objetos:</span>
              <span class="text-blue-400 font-mono">{{ stats.objects }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-400">Render Time:</span>
              <span class="text-purple-400 font-mono">{{ stats.renderTime.toFixed(2) }}ms</span>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-400">Engine:</span>
              <span class="text-emerald-400 font-mono">{{ canvasEngine }}</span>
            </div>
          </div>
        </div>

        <!-- Modern Context Menu -->
        <div
          v-if="contextMenu.visible"
          :style="{ left: contextMenu.x + 'px', top: contextMenu.y + 'px' }"
          class="absolute z-50 min-w-48 bg-slate-800/95 backdrop-blur-xl border border-slate-600/50 rounded-lg shadow-2xl py-2"
        >
          <div class="px-4 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-600/50">
            Acciones Rápidas
          </div>
          <button
            v-for="action in contextMenu.actions"
            :key="action.id"
            @click="executeAction(action)"
            class="w-full px-4 py-2 text-left text-sm text-slate-200 hover:bg-slate-700/50 transition-colors flex items-center gap-3"
          >
            <component :is="action.icon" class="w-4 h-4" />
            {{ action.label }}
          </button>
        </div>

        <!-- Product Search Panel -->
        <div class="absolute top-4 right-4 bg-slate-800/90 backdrop-blur-sm rounded-lg border border-slate-600/50 px-4 py-3 min-w-80">
          <div class="flex items-center gap-3 mb-2">
            <svg class="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
            </svg>
            <input
              v-model="productSearch.query"
              @input="searchProducts(productSearch.query)"
              placeholder="Buscar producto por nombre o SKU..."
              class="bg-transparent text-sm text-slate-200 placeholder-slate-400 flex-1 outline-none"
            />
          </div>
          <div v-if="productSearch.results.length > 0" class="space-y-1">
            <div class="text-xs text-slate-400 mb-2">
              {{ productSearch.results.length }} producto(s) encontrado(s)
            </div>
            <div class="max-h-32 overflow-y-auto space-y-1">
              <button
                v-for="result in productSearch.results.slice(0, 5)"
                :key="result.id"
                @click="highlightProduct(result)"
                class="w-full text-left p-2 rounded text-xs text-slate-300 hover:bg-slate-700/50 transition-colors"
              >
                <div class="font-medium">{{ result.product_name }}</div>
                <div class="text-slate-400">SKU: {{ result.product_sku }} | Stock: {{ result.stock_actual }}</div>
              </button>
            </div>
          </div>
        </div>

        <!-- Edit Modal -->
        <div
          v-if="editModal.visible"
          class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          @click.self="cancelEdit"
        >
          <div class="bg-white rounded-xl shadow-2xl border border-slate-200 p-6 max-w-md w-full mx-4">
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-lg font-semibold text-slate-900">
                Editar {{ editModal.element?.type === 'zone' ? 'Zona' : editModal.element?.type === 'aisle' ? 'Pasillo' : 'Estante' }}
              </h3>
              <button @click="cancelEdit" class="text-slate-400 hover:text-slate-600">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>

            <div class="space-y-4">
              <div v-if="editModal.element?.type === 'zone'">
                <label class="block text-sm font-medium text-slate-700 mb-1">Nombre</label>
                <input v-model="editModal.formData.name" class="w-full px-3 py-2 border border-slate-300 rounded-md text-sm" />

                <label class="block text-sm font-medium text-slate-700 mb-1 mt-3">Código</label>
                <input v-model="editModal.formData.code" class="w-full px-3 py-2 border border-slate-300 rounded-md text-sm" />

                <div class="grid grid-cols-2 gap-3 mt-3">
                  <div>
                    <label class="block text-sm font-medium text-slate-700 mb-1">Ancho</label>
                    <input v-model.number="editModal.formData.width" type="number" class="w-full px-3 py-2 border border-slate-300 rounded-md text-sm" />
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-slate-700 mb-1">Largo</label>
                    <input v-model.number="editModal.formData.length" type="number" class="w-full px-3 py-2 border border-slate-300 rounded-md text-sm" />
                  </div>
                </div>
              </div>

              <div v-else-if="editModal.element?.type === 'aisle'">
                <label class="block text-sm font-medium text-slate-700 mb-1">Nombre</label>
                <input v-model="editModal.formData.name" class="w-full px-3 py-2 border border-slate-300 rounded-md text-sm" />

                <label class="block text-sm font-medium text-slate-700 mb-1 mt-3">Ancho</label>
                <input v-model.number="editModal.formData.width" type="number" class="w-full px-3 py-2 border border-slate-300 rounded-md text-sm" />
              </div>

              <div v-else-if="editModal.element?.type === 'shelf'">
                <label class="block text-sm font-medium text-slate-700 mb-1">Nombre</label>
                <input v-model="editModal.formData.name" class="w-full px-3 py-2 border border-slate-300 rounded-md text-sm" />

                <div class="grid grid-cols-2 gap-3 mt-3">
                  <div>
                    <label class="block text-sm font-medium text-slate-700 mb-1">Ancho</label>
                    <input v-model.number="editModal.formData.width" type="number" class="w-full px-3 py-2 border border-slate-300 rounded-md text-sm" />
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-slate-700 mb-1">Profundidad</label>
                    <input v-model.number="editModal.formData.depth" type="number" class="w-full px-3 py-2 border border-slate-300 rounded-md text-sm" />
                  </div>
                </div>

                <label class="block text-sm font-medium text-slate-700 mb-1 mt-3">Niveles</label>
                <input v-model.number="editModal.formData.levels" type="number" min="1" max="10" class="w-full px-3 py-2 border border-slate-300 rounded-md text-sm" />
              </div>
            </div>

            <div class="flex gap-3 mt-6">
              <button
                @click="saveElementChanges"
                class="flex-1 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors text-sm font-medium"
              >
                Guardar
              </button>
              <button
                @click="cancelEdit"
                class="flex-1 bg-slate-200 text-slate-800 px-4 py-2 rounded-lg hover:bg-slate-300 transition-colors text-sm font-medium"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import {
  Building2, Zap, Sparkles, Minus, Plus, RotateCcw, Grid3x3, Thermometer, Tag,
  Move, Trash2, Copy, Eye, Settings, Edit, Square, Layers
} from 'lucide-vue-next'
import Button from '@/components/ui/Button.vue'
import type {
  WarehouseVisualizerData,
  WarehouseZone,
  WarehouseAisle,
  WarehouseShelf,
  ProductLocationDetailed
} from '@/composables/useWarehouseVisualizer'

interface Props {
  warehouseData: WarehouseVisualizerData | null
  filteredLocations: ProductLocationDetailed[]
  loading?: boolean
}

const props = defineProps<Props>()

// Canvas and Engine State
const canvasRef = ref<HTMLCanvasElement>()
const minimapRef = ref<HTMLCanvasElement>()
const ctx = ref<CanvasRenderingContext2D>()
const minimapCtx = ref<CanvasRenderingContext2D>()
const animationId = ref<number>()

// Modern Camera System - Zoom inicial más alto para ver mejor
const camera = ref({
  x: 0,
  y: 0,
  zoom: 3,
  targetX: 0,
  targetY: 0,
  targetZoom: 3
})

// Canvas Configuration
const canvasSize = ref({
  width: 1920,
  height: 1080
})

// Rendering State
const renderMode = ref<'performance' | 'quality'>('quality')
const canvasEngine = ref('Canvas 2D + OffscreenCanvas')
const showGrid = ref(true)
const showHeatmap = ref(false)
const showLabels = ref(true)

// Edit Mode State
const editMode = ref(false)
const creationMode = ref<'zone' | 'aisle' | 'shelf' | null>(null)
const selectedElement = ref<{ type: string; id: string; data: any } | null>(null)
const editModal = ref({
  visible: false,
  element: null as any,
  formData: {} as any
})
const productSearch = ref({
  query: '',
  results: [] as any[],
  highlightedProduct: null as any
})
const isResizing = ref(false)
const resizeState = ref({
  isResizing: false,
  handleType: null as string | null,
  startX: 0,
  startY: 0,
  startElementX: 0,
  startElementY: 0,
  startElementWidth: 0,
  startElementHeight: 0,
  element: null as any
})
const dragState = ref({
  isDragging: false,
  startX: 0,
  startY: 0,
  element: null as any
})
const showStats = ref(true)

// Performance Stats
const stats = ref({
  fps: 60,
  objects: 0,
  renderTime: 0,
  lastFrameTime: 0
})

// Interaction State
const isMouseDown = ref(false)
const lastMousePos = ref({ x: 0, y: 0 })
const mousePos = ref({ x: 0, y: 0 })

// Context Menu
const contextMenu = ref({
  visible: false,
  x: 0,
  y: 0,
  actions: [
    { id: 'move', label: 'Mover', icon: Move },
    { id: 'copy', label: 'Duplicar', icon: Copy },
    { id: 'view', label: 'Ver Detalles', icon: Eye },
    { id: 'settings', label: 'Configurar', icon: Settings },
    { id: 'delete', label: 'Eliminar', icon: Trash2 }
  ]
})

// Modern Colors and Themes - Light theme with zinc palette
const theme = ref({
  background: '#ffffff',
  grid: '#e4e4e7',
  zone: {
    stroke: '#059669',
    fill: '#dcfce7',
    hover: '#bbf7d0'
  },
  aisle: {
    stroke: '#2563eb',
    fill: '#dbeafe'
  },
  shelf: {
    stroke: '#7c3aed',
    fill: '#ede9fe'
  },
  product: {
    stroke: '#dc2626',
    fill: '#fee2e2'
  }
})

// Computed Properties
const bounds = computed(() => {
  if (!props.warehouseData) {
    return { width: 1000, height: 800 }
  }
  const warehouse = props.warehouseData.warehouse
  return {
    width: Math.max(warehouse.width || 1000, 500),
    height: Math.max(warehouse.length || 800, 400)
  }
})

// Canvas Initialization
const initializeCanvas = async () => {
  if (!canvasRef.value || !minimapRef.value) return

  const canvas = canvasRef.value
  const minimap = minimapRef.value

  // Setup main canvas with modern features
  ctx.value = canvas.getContext('2d', {
    alpha: false,
    desynchronized: true,
    colorSpace: 'display-p3'
  }) as CanvasRenderingContext2D

  // Setup minimap
  minimapCtx.value = minimap.getContext('2d') as CanvasRenderingContext2D

  // Configure canvas for high DPI
  const dpr = window.devicePixelRatio || 1
  const rect = canvas.getBoundingClientRect()

  canvas.width = rect.width * dpr
  canvas.height = rect.height * dpr
  canvas.style.width = rect.width + 'px'
  canvas.style.height = rect.height + 'px'

  canvasSize.value = {
    width: canvas.width,
    height: canvas.height
  }

  if (ctx.value) {
    ctx.value.scale(dpr, dpr)
    ctx.value.imageSmoothingEnabled = renderMode.value === 'quality'
    ctx.value.imageSmoothingQuality = 'high'
  }

  // Initialize camera
  resetView()

  // Add event listeners for interaction
  canvas.addEventListener('click', handleClick)
  canvas.addEventListener('dblclick', handleDoubleClick)
  canvas.addEventListener('mousedown', handleMouseDown)
  canvas.addEventListener('mousemove', handleMouseMove)
  canvas.addEventListener('mouseup', handleMouseUp)
  canvas.addEventListener('wheel', handleWheel)

  // Start render loop
  startRenderLoop()
}

// Modern Render Loop with Performance Monitoring
const startRenderLoop = () => {
  const render = (timestamp: number) => {
    const deltaTime = timestamp - stats.value.lastFrameTime
    stats.value.fps = 1000 / deltaTime
    stats.value.lastFrameTime = timestamp

    const renderStart = performance.now()

    // Smooth camera interpolation
    camera.value.x += (camera.value.targetX - camera.value.x) * 0.1
    camera.value.y += (camera.value.targetY - camera.value.y) * 0.1
    camera.value.zoom += (camera.value.targetZoom - camera.value.zoom) * 0.1

    renderFrame()
    renderMinimap()

    stats.value.renderTime = performance.now() - renderStart

    animationId.value = requestAnimationFrame(render)
  }

  animationId.value = requestAnimationFrame(render)
}

// Main Rendering Function
const renderFrame = () => {
  if (!ctx.value || !props.warehouseData) return

  const canvas = canvasRef.value!
  const rect = canvas.getBoundingClientRect()

  // Clear canvas with modern background
  ctx.value.fillStyle = theme.value.background
  ctx.value.fillRect(0, 0, rect.width, rect.height)

  // Save context and apply camera transform
  ctx.value.save()
  ctx.value.translate(rect.width / 2, rect.height / 2)
  ctx.value.scale(camera.value.zoom, camera.value.zoom)
  ctx.value.translate(-camera.value.x, -camera.value.y)

  // Render grid if enabled
  if (showGrid.value) {
    renderGrid()
  }

  // Render warehouse elements
  renderZones()
  renderAisles()
  renderShelves()
  renderProducts()

  // Render labels if enabled
  if (showLabels.value) {
    renderLabels()
  }

  // Render heatmap if enabled
  if (showHeatmap.value) {
    renderHeatmap()
  }

  ctx.value.restore()

  // Update stats
  stats.value.objects =
    (props.warehouseData.zones?.length || 0) +
    (props.warehouseData.aisles?.length || 0) +
    (props.warehouseData.shelves?.length || 0) +
    props.filteredLocations.length
}

// Helper functions for zoom-aware scaling
const getScaledSize = (baseSize: number) => {
  // Escala inversa: cuando zoom es mayor, el tamaño relativo es menor
  return baseSize / camera.value.zoom
}

const getScaledFont = (baseSize: number) => {
  // Los textos deben mantenerse legibles independientemente del zoom
  // Con un escalado mínimo para legibilidad
  const scaledSize = Math.max(10, Math.min(24, baseSize / Math.max(camera.value.zoom, 0.5)))
  return `bold ${scaledSize}px Inter, system-ui`
}

const getScaledLineWidth = (baseWidth: number) => {
  // Las líneas deben mantenerse visibles pero proporcionales
  return Math.max(0.5, baseWidth / Math.max(camera.value.zoom, 0.5))
}

// Rendering Functions
const renderGrid = () => {
  if (!ctx.value) return

  const gridSize = 50
  const bounds = { width: 2000, height: 2000 }

  ctx.value.strokeStyle = theme.value.grid
  ctx.value.lineWidth = getScaledLineWidth(1)
  ctx.value.setLineDash([getScaledSize(2), getScaledSize(2)])
  ctx.value.beginPath()

  for (let x = -bounds.width; x <= bounds.width; x += gridSize) {
    ctx.value.moveTo(x, -bounds.height)
    ctx.value.lineTo(x, bounds.height)
  }

  for (let y = -bounds.height; y <= bounds.height; y += gridSize) {
    ctx.value.moveTo(-bounds.width, y)
    ctx.value.lineTo(bounds.width, y)
  }

  ctx.value.stroke()
  ctx.value.setLineDash([]) // Reset line dash
}

const renderZones = () => {
  if (!ctx.value || !props.warehouseData?.zones) return

  props.warehouseData.zones.forEach(zone => {
    const x = (zone.x_coordinate || 0) * 3
    const y = (zone.y_coordinate || 0) * 3
    const width = (zone.width || 200) * 3
    const height = (zone.length || 150) * 3

    // Zone background with modern styling
    ctx.value!.fillStyle = zone.color_hex ? `${zone.color_hex}40` : theme.value.zone.fill
    ctx.value!.fillRect(x, y, width, height)

    // Zone border with glow effect
    ctx.value!.strokeStyle = zone.color_hex || theme.value.zone.stroke
    ctx.value!.lineWidth = getScaledLineWidth(3)
    ctx.value!.shadowColor = zone.color_hex || theme.value.zone.stroke
    ctx.value!.shadowBlur = getScaledSize(10)
    ctx.value!.strokeRect(x, y, width, height)
    ctx.value!.shadowBlur = 0

    // Zone header
    ctx.value!.fillStyle = zone.color_hex || theme.value.zone.stroke
    ctx.value!.fillRect(x, y, width, getScaledSize(40))

    // Zone label
    if (showLabels.value) {
      ctx.value!.fillStyle = '#ffffff'
      ctx.value!.font = getScaledFont(16)
      ctx.value!.textAlign = 'center'
      ctx.value!.fillText(zone.code || zone.name || 'Zona', x + width/2, y + getScaledSize(25))
    }

    // Selection indicator and resize handles
    if (editMode.value && selectedElement.value?.type === 'zone' && selectedElement.value?.id === zone.id) {
      // Selection outline
      ctx.value!.strokeStyle = '#00ff00'
      ctx.value!.lineWidth = getScaledLineWidth(4)
      ctx.value!.setLineDash([getScaledSize(8), getScaledSize(4)])
      ctx.value!.strokeRect(x - getScaledSize(2), y - getScaledSize(2), width + getScaledSize(4), height + getScaledSize(4))
      ctx.value!.setLineDash([])

      // Resize handles
      const handleSize = getScaledSize(8)
      ctx.value!.fillStyle = '#00ff00'

      // Corner handles
      ctx.value!.fillRect(x - handleSize/2, y - handleSize/2, handleSize, handleSize)
      ctx.value!.fillRect(x + width - handleSize/2, y - handleSize/2, handleSize, handleSize)
      ctx.value!.fillRect(x - handleSize/2, y + height - handleSize/2, handleSize, handleSize)
      ctx.value!.fillRect(x + width - handleSize/2, y + height - handleSize/2, handleSize, handleSize)

      // Edge handles
      ctx.value!.fillRect(x + width/2 - handleSize/2, y - handleSize/2, handleSize, handleSize)
      ctx.value!.fillRect(x + width/2 - handleSize/2, y + height - handleSize/2, handleSize, handleSize)
      ctx.value!.fillRect(x - handleSize/2, y + height/2 - handleSize/2, handleSize, handleSize)
      ctx.value!.fillRect(x + width - handleSize/2, y + height/2 - handleSize/2, handleSize, handleSize)
    }
  })
}

const renderAisles = () => {
  if (!ctx.value || !props.warehouseData?.aisles) return

  props.warehouseData.aisles.forEach(aisle => {
    const x = (aisle.start_x || 0) * 3
    const y = (aisle.start_y || 0) * 3
    const width = (aisle.width || 30) * 3
    const length = Math.abs(((aisle.end_y || 20) - (aisle.start_y || 0)) * 3)

    // Aisle with modern gradient
    const gradient = ctx.value!.createLinearGradient(x, y, x, y + length)
    gradient.addColorStop(0, theme.value.aisle.fill)
    gradient.addColorStop(1, theme.value.aisle.stroke + '40')

    ctx.value!.fillStyle = gradient
    ctx.value!.fillRect(x, y, width, length)

    ctx.value!.strokeStyle = theme.value.aisle.stroke
    ctx.value!.lineWidth = getScaledLineWidth(2)
    ctx.value!.strokeRect(x, y, width, length)

    // Aisle direction indicator
    ctx.value!.fillStyle = theme.value.aisle.stroke
    ctx.value!.beginPath()
    ctx.value!.moveTo(x + width/2, y + getScaledSize(15))
    ctx.value!.lineTo(x + width/2 - getScaledSize(6), y + getScaledSize(30))
    ctx.value!.lineTo(x + width/2 + getScaledSize(6), y + getScaledSize(30))
    ctx.value!.fill()

    // Selection indicator and resize handles for aisles
    if (editMode.value && selectedElement.value?.type === 'aisle' && selectedElement.value?.id === aisle.id) {
      // Selection outline
      ctx.value!.strokeStyle = '#00ff00'
      ctx.value!.lineWidth = getScaledLineWidth(4)
      ctx.value!.setLineDash([getScaledSize(8), getScaledSize(4)])
      ctx.value!.strokeRect(x - getScaledSize(2), y - getScaledSize(2), width + getScaledSize(4), length + getScaledSize(4))
      ctx.value!.setLineDash([])

      // Resize handles
      const handleSize = getScaledSize(8)
      ctx.value!.fillStyle = '#00ff00'

      // Corner handles
      ctx.value!.fillRect(x - handleSize/2, y - handleSize/2, handleSize, handleSize)
      ctx.value!.fillRect(x + width - handleSize/2, y - handleSize/2, handleSize, handleSize)
      ctx.value!.fillRect(x - handleSize/2, y + length - handleSize/2, handleSize, handleSize)
      ctx.value!.fillRect(x + width - handleSize/2, y + length - handleSize/2, handleSize, handleSize)

      // Edge handles
      ctx.value!.fillRect(x + width/2 - handleSize/2, y - handleSize/2, handleSize, handleSize)
      ctx.value!.fillRect(x + width/2 - handleSize/2, y + length - handleSize/2, handleSize, handleSize)
      ctx.value!.fillRect(x - handleSize/2, y + length/2 - handleSize/2, handleSize, handleSize)
      ctx.value!.fillRect(x + width - handleSize/2, y + length/2 - handleSize/2, handleSize, handleSize)
    }
  })
}

const renderShelves = () => {
  if (!ctx.value || !props.warehouseData?.shelves) return

  props.warehouseData.shelves.forEach(shelf => {
    const x = (shelf.position_x || 0) * 3
    const y = (shelf.position_y || 0) * 3
    const width = (shelf.width || 15) * 3
    const depth = (shelf.depth || 8) * 3

    // Shelf with 3D effect
    ctx.value!.fillStyle = theme.value.shelf.fill
    ctx.value!.fillRect(x, y, width, depth)

    ctx.value!.strokeStyle = theme.value.shelf.stroke
    ctx.value!.lineWidth = getScaledLineWidth(2)
    ctx.value!.strokeRect(x, y, width, depth)

    // Shelf levels
    const levels = shelf.levels || 3
    for (let level = 1; level < levels; level++) {
      const levelY = y + (level * depth / levels)
      ctx.value!.strokeStyle = theme.value.shelf.stroke + '80'
      ctx.value!.lineWidth = getScaledLineWidth(1)
      ctx.value!.beginPath()
      ctx.value!.moveTo(x + getScaledSize(2), levelY)
      ctx.value!.lineTo(x + width - getScaledSize(2), levelY)
      ctx.value!.stroke()
    }

    // Selection indicator and resize handles for shelves
    if (editMode.value && selectedElement.value?.type === 'shelf' && selectedElement.value?.id === shelf.id) {
      // Selection outline
      ctx.value!.strokeStyle = '#00ff00'
      ctx.value!.lineWidth = getScaledLineWidth(4)
      ctx.value!.setLineDash([getScaledSize(8), getScaledSize(4)])
      ctx.value!.strokeRect(x - getScaledSize(2), y - getScaledSize(2), width + getScaledSize(4), depth + getScaledSize(4))
      ctx.value!.setLineDash([])

      // Resize handles
      const handleSize = getScaledSize(8)
      ctx.value!.fillStyle = '#00ff00'

      // Corner handles
      ctx.value!.fillRect(x - handleSize/2, y - handleSize/2, handleSize, handleSize)
      ctx.value!.fillRect(x + width - handleSize/2, y - handleSize/2, handleSize, handleSize)
      ctx.value!.fillRect(x - handleSize/2, y + depth - handleSize/2, handleSize, handleSize)
      ctx.value!.fillRect(x + width - handleSize/2, y + depth - handleSize/2, handleSize, handleSize)

      // Edge handles
      ctx.value!.fillRect(x + width/2 - handleSize/2, y - handleSize/2, handleSize, handleSize)
      ctx.value!.fillRect(x + width/2 - handleSize/2, y + depth - handleSize/2, handleSize, handleSize)
      ctx.value!.fillRect(x - handleSize/2, y + depth/2 - handleSize/2, handleSize, handleSize)
      ctx.value!.fillRect(x + width - handleSize/2, y + depth/2 - handleSize/2, handleSize, handleSize)
    }
  })
}

const renderProducts = () => {
  if (!ctx.value) return

  props.filteredLocations.forEach(location => {
    const x = ((location.final_x || location.position_x || 0) * 3) - getScaledSize(5)
    const y = ((location.final_y || location.position_y || 0) * 3) - getScaledSize(5)
    const baseRadius = Math.min(Math.max((location.stock_actual || 0) / 10, 3), 15)
    const radius = getScaledSize(baseRadius)

    // Check if this is the highlighted product
    const isHighlighted = productSearch.value.highlightedProduct?.id === location.id

    if (isHighlighted) {
      // Pulsing effect for highlighted product
      const time = Date.now() / 500
      const pulse = Math.sin(time) * 0.3 + 1
      const highlightRadius = radius * (1.5 + pulse * 0.5)

      // Outer glow
      ctx.value!.beginPath()
      ctx.value!.arc(x + getScaledSize(5), y + getScaledSize(5), highlightRadius, 0, Math.PI * 2)
      ctx.value!.fillStyle = '#ff6b35'
      ctx.value!.shadowColor = '#ff6b35'
      ctx.value!.shadowBlur = getScaledSize(20)
      ctx.value!.fill()
      ctx.value!.shadowBlur = 0
    }

    // Product indicator with glow
    ctx.value!.beginPath()
    ctx.value!.arc(x + getScaledSize(5), y + getScaledSize(5), radius, 0, Math.PI * 2)
    ctx.value!.fillStyle = isHighlighted ? '#ff6b35' : theme.value.product.fill
    ctx.value!.fill()

    ctx.value!.strokeStyle = isHighlighted ? '#ff4500' : theme.value.product.stroke
    ctx.value!.lineWidth = getScaledLineWidth(isHighlighted ? 3 : 2)
    ctx.value!.shadowColor = isHighlighted ? '#ff4500' : theme.value.product.stroke
    ctx.value!.shadowBlur = getScaledSize(isHighlighted ? 12 : 8)
    ctx.value!.stroke()
    ctx.value!.shadowBlur = 0

    // Product label for highlighted item
    if (isHighlighted && showLabels.value) {
      ctx.value!.fillStyle = '#000000'
      ctx.value!.font = getScaledFont(12)
      ctx.value!.textAlign = 'center'
      ctx.value!.fillText(
        location.product_name || location.product_sku || 'Producto',
        x + getScaledSize(5),
        y - getScaledSize(15)
      )
    }
  })
}

const renderLabels = () => {
  // Labels are rendered within each element's render function
}

const renderHeatmap = () => {
  if (!ctx.value) return

  // Create heatmap overlay based on product density
  const zones = props.warehouseData?.zones || []
  zones.forEach(zone => {
    const productCount = props.filteredLocations.filter(
      loc => loc.warehouse_zone_id === zone.id
    ).length

    if (productCount > 0) {
      const intensity = Math.min(productCount / 50, 1)
      const x = (zone.x_coordinate || 0) * 1.5
      const y = (zone.y_coordinate || 0) * 1.5
      const width = (zone.width || 200) * 1.5
      const height = (zone.length || 150) * 1.5

      ctx.value!.fillStyle = `rgba(255, 100, 100, ${intensity * 0.3})`
      ctx.value!.fillRect(x, y, width, height)
    }
  })
}

const renderMinimap = () => {
  if (!minimapCtx.value || !props.warehouseData) return

  const minimap = minimapRef.value!
  const scale = 0.1

  // Clear minimap
  minimapCtx.value.fillStyle = theme.value.background
  minimapCtx.value.fillRect(0, 0, minimap.width, minimap.height)

  // Render simplified zones
  props.warehouseData.zones?.forEach(zone => {
    const x = (zone.x_coordinate || 0) * scale
    const y = (zone.y_coordinate || 0) * scale
    const width = (zone.width || 200) * scale
    const height = (zone.length || 150) * scale

    minimapCtx.value!.fillStyle = zone.color_hex || theme.value.zone.stroke
    minimapCtx.value!.fillRect(x + 10, y + 10, width, height)
  })

  // Render viewport indicator
  const viewX = camera.value.x * scale + minimap.width/2
  const viewY = camera.value.y * scale + minimap.height/2
  const viewWidth = 100 / camera.value.zoom
  const viewHeight = 80 / camera.value.zoom

  minimapCtx.value.strokeStyle = '#ffffff'
  minimapCtx.value.lineWidth = 2
  minimapCtx.value.strokeRect(viewX - viewWidth/2, viewY - viewHeight/2, viewWidth, viewHeight)
}

// Event Handlers
const handleMouseDown = (event: MouseEvent) => {
  if (!editMode.value) {
    isMouseDown.value = true
    lastMousePos.value = { x: event.clientX, y: event.clientY }
    contextMenu.value.visible = false
    return
  }

  const coords = getCanvasCoordinates(event)
  const element = findElementAtPosition(coords.x, coords.y)

  if (element && selectedElement.value?.id === element.id) {
    // Check if clicking on a resize handle
    const handle = getResizeHandleAtPosition(coords.x, coords.y, element)
    if (handle) {
      startResize(event, element, handle)
      return
    }
  }

  isMouseDown.value = true
  lastMousePos.value = { x: event.clientX, y: event.clientY }
  contextMenu.value.visible = false
}

const handleMouseMove = (event: MouseEvent) => {
  mousePos.value = { x: event.clientX, y: event.clientY }

  if (resizeState.value.isResizing) {
    handleResize(event)
    return
  }

  if (isMouseDown.value && !editMode.value) {
    const deltaX = event.clientX - lastMousePos.value.x
    const deltaY = event.clientY - lastMousePos.value.y

    camera.value.targetX -= deltaX / camera.value.zoom
    camera.value.targetY -= deltaY / camera.value.zoom

    lastMousePos.value = { x: event.clientX, y: event.clientY }
  }
}

const handleMouseUp = () => {
  if (resizeState.value.isResizing) {
    endResize()
    return
  }
  isMouseDown.value = false
}

const handleMouseLeave = () => {
  isMouseDown.value = false
}

const handleWheel = (event: WheelEvent) => {
  event.preventDefault()
  const zoomFactor = event.deltaY > 0 ? 0.9 : 1.1
  camera.value.targetZoom = Math.max(0.1, Math.min(5, camera.value.targetZoom * zoomFactor))
}

const getCanvasCoordinates = (event: MouseEvent) => {
  if (!canvasRef.value) return { x: 0, y: 0 }

  const rect = canvasRef.value.getBoundingClientRect()
  const scaleX = canvasSize.value.width / rect.width
  const scaleY = canvasSize.value.height / rect.height

  return {
    x: (event.clientX - rect.left) * scaleX - camera.value.x,
    y: (event.clientY - rect.top) * scaleY - camera.value.y
  }
}

const findElementAtPosition = (x: number, y: number) => {
  // Check zones first
  if (props.warehouseData?.zones) {
    for (const zone of props.warehouseData.zones) {
      const zx = (zone.x_coordinate || 0) * 3
      const zy = (zone.y_coordinate || 0) * 3
      const width = (zone.width || 200) * 3
      const height = (zone.length || 150) * 3

      if (x >= zx && x <= zx + width && y >= zy && y <= zy + height) {
        return { type: 'zone', id: zone.id, data: zone }
      }
    }
  }

  // Check aisles
  if (props.warehouseData?.aisles) {
    for (const aisle of props.warehouseData.aisles) {
      const ax = (aisle.start_x || 0) * 3
      const ay = (aisle.start_y || 0) * 3
      const width = (aisle.width || 30) * 3
      const length = Math.abs(((aisle.end_y || 20) - (aisle.start_y || 0)) * 3)

      if (x >= ax && x <= ax + width && y >= ay && y <= ay + length) {
        return { type: 'aisle', id: aisle.id, data: aisle }
      }
    }
  }

  // Check shelves
  if (props.warehouseData?.shelves) {
    for (const shelf of props.warehouseData.shelves) {
      const sx = (shelf.position_x || 0) * 3
      const sy = (shelf.position_y || 0) * 3
      const width = (shelf.width || 15) * 3
      const depth = (shelf.depth || 8) * 3

      if (x >= sx && x <= sx + width && y >= sy && y <= sy + depth) {
        return { type: 'shelf', id: shelf.id, data: shelf }
      }
    }
  }

  return null
}

const handleClick = (event: MouseEvent) => {
  if (!editMode.value) return

  const coords = getCanvasCoordinates(event)
  const element = findElementAtPosition(coords.x, coords.y)

  if (element) {
    selectedElement.value = element
    console.log('Selected element:', element)
  } else {
    selectedElement.value = null
  }
}

const handleDoubleClick = (event: MouseEvent) => {
  if (!editMode.value) return

  const coords = getCanvasCoordinates(event)
  const element = findElementAtPosition(coords.x, coords.y)

  if (element) {
    // Open edit modal or enable inline editing
    startElementEdit(element)
  }
}

const startElementEdit = (element: any) => {
  editModal.value.element = element

  // Create form data based on element type
  if (element.type === 'zone') {
    editModal.value.formData = {
      name: element.data.name || '',
      code: element.data.code || '',
      width: element.data.width || 200,
      length: element.data.length || 150,
      x_coordinate: element.data.x_coordinate || 0,
      y_coordinate: element.data.y_coordinate || 0,
      color_hex: element.data.color_hex || '#059669'
    }
  } else if (element.type === 'aisle') {
    editModal.value.formData = {
      name: element.data.name || '',
      code: element.data.code || '',
      width: element.data.width || 30,
      start_x: element.data.start_x || 0,
      start_y: element.data.start_y || 0,
      end_y: element.data.end_y || 20
    }
  } else if (element.type === 'shelf') {
    editModal.value.formData = {
      name: element.data.name || '',
      code: element.data.code || '',
      width: element.data.width || 15,
      depth: element.data.depth || 8,
      position_x: element.data.position_x || 0,
      position_y: element.data.position_y || 0,
      levels: element.data.levels || 3
    }
  }

  editModal.value.visible = true
}

// Resize Handle Detection
const getResizeHandleAtPosition = (x: number, y: number, element: any) => {
  if (!element) return null

  const handleSize = getScaledSize(8)
  const tolerance = handleSize

  let elementX = 0, elementY = 0, elementWidth = 0, elementHeight = 0

  if (element.type === 'zone') {
    elementX = (element.data.x_coordinate || 0) * 3
    elementY = (element.data.y_coordinate || 0) * 3
    elementWidth = (element.data.width || 200) * 3
    elementHeight = (element.data.length || 150) * 3
  } else if (element.type === 'aisle') {
    elementX = (element.data.start_x || 0) * 3
    elementY = (element.data.start_y || 0) * 3
    elementWidth = (element.data.width || 30) * 3
    elementHeight = Math.abs(((element.data.end_y || 20) - (element.data.start_y || 0)) * 3)
  } else if (element.type === 'shelf') {
    elementX = (element.data.position_x || 0) * 3
    elementY = (element.data.position_y || 0) * 3
    elementWidth = (element.data.width || 15) * 3
    elementHeight = (element.data.depth || 8) * 3
  }

  // Check corner handles
  if (Math.abs(x - elementX) <= tolerance && Math.abs(y - elementY) <= tolerance) return 'nw'
  if (Math.abs(x - (elementX + elementWidth)) <= tolerance && Math.abs(y - elementY) <= tolerance) return 'ne'
  if (Math.abs(x - elementX) <= tolerance && Math.abs(y - (elementY + elementHeight)) <= tolerance) return 'sw'
  if (Math.abs(x - (elementX + elementWidth)) <= tolerance && Math.abs(y - (elementY + elementHeight)) <= tolerance) return 'se'

  // Check edge handles
  if (Math.abs(x - (elementX + elementWidth/2)) <= tolerance && Math.abs(y - elementY) <= tolerance) return 'n'
  if (Math.abs(x - (elementX + elementWidth/2)) <= tolerance && Math.abs(y - (elementY + elementHeight)) <= tolerance) return 's'
  if (Math.abs(x - elementX) <= tolerance && Math.abs(y - (elementY + elementHeight/2)) <= tolerance) return 'w'
  if (Math.abs(x - (elementX + elementWidth)) <= tolerance && Math.abs(y - (elementY + elementHeight/2)) <= tolerance) return 'e'

  return null
}

// Resize Operations
const startResize = (event: MouseEvent, element: any, handleType: string) => {
  const coords = getCanvasCoordinates(event)

  resizeState.value = {
    isResizing: true,
    handleType,
    startX: coords.x,
    startY: coords.y,
    startElementX: element.type === 'zone' ? (element.data.x_coordinate || 0) * 3 :
                   element.type === 'aisle' ? (element.data.start_x || 0) * 3 :
                   (element.data.position_x || 0) * 3,
    startElementY: element.type === 'zone' ? (element.data.y_coordinate || 0) * 3 :
                   element.type === 'aisle' ? (element.data.start_y || 0) * 3 :
                   (element.data.position_y || 0) * 3,
    startElementWidth: element.type === 'zone' ? (element.data.width || 200) * 3 :
                       element.type === 'aisle' ? (element.data.width || 30) * 3 :
                       (element.data.width || 15) * 3,
    startElementHeight: element.type === 'zone' ? (element.data.length || 150) * 3 :
                        element.type === 'aisle' ? Math.abs(((element.data.end_y || 20) - (element.data.start_y || 0)) * 3) :
                        (element.data.depth || 8) * 3,
    element
  }

  event.preventDefault()
  event.stopPropagation()
}

const handleResize = (event: MouseEvent) => {
  if (!resizeState.value.isResizing || !resizeState.value.element) return

  const coords = getCanvasCoordinates(event)
  const deltaX = coords.x - resizeState.value.startX
  const deltaY = coords.y - resizeState.value.startY

  const element = resizeState.value.element
  const handle = resizeState.value.handleType

  let newX = resizeState.value.startElementX
  let newY = resizeState.value.startElementY
  let newWidth = resizeState.value.startElementWidth
  let newHeight = resizeState.value.startElementHeight

  // Apply resize based on handle type
  switch (handle) {
    case 'nw':
      newX += deltaX
      newY += deltaY
      newWidth -= deltaX
      newHeight -= deltaY
      break
    case 'ne':
      newY += deltaY
      newWidth += deltaX
      newHeight -= deltaY
      break
    case 'sw':
      newX += deltaX
      newWidth -= deltaX
      newHeight += deltaY
      break
    case 'se':
      newWidth += deltaX
      newHeight += deltaY
      break
    case 'n':
      newY += deltaY
      newHeight -= deltaY
      break
    case 's':
      newHeight += deltaY
      break
    case 'w':
      newX += deltaX
      newWidth -= deltaX
      break
    case 'e':
      newWidth += deltaX
      break
  }

  // Enforce minimum sizes
  const minSize = 20
  newWidth = Math.max(minSize, newWidth)
  newHeight = Math.max(minSize, newHeight)

  // Update element data (temporarily for visual feedback)
  if (element.type === 'zone') {
    element.data.x_coordinate = newX / 3
    element.data.y_coordinate = newY / 3
    element.data.width = newWidth / 3
    element.data.length = newHeight / 3
  } else if (element.type === 'aisle') {
    element.data.start_x = newX / 3
    element.data.start_y = newY / 3
    element.data.width = newWidth / 3
    element.data.end_y = (newY + newHeight) / 3
  } else if (element.type === 'shelf') {
    element.data.position_x = newX / 3
    element.data.position_y = newY / 3
    element.data.width = newWidth / 3
    element.data.depth = newHeight / 3
  }
}

const endResize = () => {
  if (resizeState.value.isResizing && resizeState.value.element) {
    // Here you would typically save the changes to the backend
    console.log('Resize completed for:', resizeState.value.element)
    // TODO: Implement API call to save changes
  }

  resizeState.value = {
    isResizing: false,
    handleType: null,
    startX: 0,
    startY: 0,
    startElementX: 0,
    startElementY: 0,
    startElementWidth: 0,
    startElementHeight: 0,
    element: null
  }
}

// Control Functions
const setRenderMode = (mode: 'performance' | 'quality') => {
  renderMode.value = mode
  if (ctx.value) {
    ctx.value.imageSmoothingEnabled = mode === 'quality'
  }
}

const zoomIn = () => {
  camera.value.targetZoom = Math.min(5, camera.value.targetZoom * 1.2)
}

const zoomOut = () => {
  camera.value.targetZoom = Math.max(0.1, camera.value.targetZoom * 0.8)
}

const resetView = () => {
  camera.value.targetX = 0
  camera.value.targetY = 0
  camera.value.targetZoom = 0.8
}

// Edit Mode Functions
const toggleEditMode = () => {
  editMode.value = !editMode.value
  if (!editMode.value) {
    creationMode.value = null
  }
}

const setCreationMode = (mode: 'zone' | 'aisle' | 'shelf') => {
  if (creationMode.value === mode) {
    creationMode.value = null
  } else {
    creationMode.value = mode
  }
}

const executeAction = (action: any) => {
  contextMenu.value.visible = false
  // Implement action logic
}

// Product Search Functions
const searchProducts = (query: string) => {
  productSearch.value.query = query
  if (!query.trim()) {
    productSearch.value.results = []
    productSearch.value.highlightedProduct = null
    return
  }

  // Filter products based on search query
  const results = props.filteredLocations.filter(location =>
    location.product_name?.toLowerCase().includes(query.toLowerCase()) ||
    location.product_sku?.toLowerCase().includes(query.toLowerCase())
  )

  productSearch.value.results = results
  if (results.length > 0) {
    highlightProduct(results[0])
  }
}

const highlightProduct = (product: any) => {
  productSearch.value.highlightedProduct = product

  // Center camera on product location
  const x = (product.final_x || product.position_x || 0) * 3
  const y = (product.final_y || product.position_y || 0) * 3

  camera.value.targetX = -x + canvasSize.value.width / 2
  camera.value.targetY = -y + canvasSize.value.height / 2
  camera.value.targetZoom = 4
}

// Modal Functions
const saveElementChanges = () => {
  if (!editModal.value.element) return

  const element = editModal.value.element
  const formData = editModal.value.formData

  // Update element data
  Object.assign(element.data, formData)

  // TODO: Save to backend
  console.log('Saving changes:', element, formData)

  editModal.value.visible = false
}

const cancelEdit = () => {
  editModal.value.visible = false
  editModal.value.element = null
  editModal.value.formData = {}
}

// Lifecycle
onMounted(() => {
  nextTick(() => {
    initializeCanvas()
  })
})

onUnmounted(() => {
  if (animationId.value) {
    cancelAnimationFrame(animationId.value)
  }

  // Clean up event listeners
  if (canvasRef.value) {
    canvasRef.value.removeEventListener('click', handleClick)
    canvasRef.value.removeEventListener('dblclick', handleDoubleClick)
    canvasRef.value.removeEventListener('mousedown', handleMouseDown)
    canvasRef.value.removeEventListener('mousemove', handleMouseMove)
    canvasRef.value.removeEventListener('mouseup', handleMouseUp)
    canvasRef.value.removeEventListener('wheel', handleWheel)
  }
})

// Watch for data changes
watch(() => props.warehouseData, (newData) => {
  if (newData) {
    resetView()
  }
}, { immediate: true })
</script>

<style scoped>
canvas {
  image-rendering: -webkit-optimize-contrast;
  image-rendering: crisp-edges;
}
</style>