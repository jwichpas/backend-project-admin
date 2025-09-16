<template>
  <div class="relative w-full h-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-xl overflow-hidden shadow-2xl border border-slate-700">
    <!-- Loading State with Advanced Animation -->
    <div v-if="loading" class="absolute inset-0 flex items-center justify-center bg-slate-900/95 backdrop-blur-sm z-50">
      <div class="text-center">
        <div class="relative mb-6">
          <!-- 3D Cube Loading Animation -->
          <div class="relative w-16 h-16 mx-auto">
            <div class="absolute inset-0 border-4 border-blue-500 border-opacity-30 rounded-lg animate-spin"></div>
            <div class="absolute inset-2 border-4 border-cyan-400 border-opacity-50 rounded-lg animate-pulse"></div>
            <div class="absolute inset-4 border-4 border-white border-opacity-70 rounded animate-ping"></div>
          </div>
        </div>
        <h3 class="text-white font-bold text-lg mb-2">Construyendo almacén 3D</h3>
        <p class="text-slate-300 text-sm mb-1">Renderizando geometrías y texturas</p>
        <p class="text-slate-400 text-xs">{{ loadingProgress }}%</p>
      </div>
    </div>

    <!-- Empty State with 3D Icon -->
    <div v-else-if="!warehouseData" class="absolute inset-0 flex items-center justify-center">
      <div class="text-center max-w-md">
        <!-- 3D Isometric Warehouse Icon -->
        <div class="mx-auto w-40 h-40 text-slate-600 mb-8 transform perspective-1000 rotate-x-12">
          <svg viewBox="0 0 200 200" fill="currentColor" class="w-full h-full">
            <!-- Base platform -->
            <rect x="20" y="120" width="160" height="60" rx="8" fill="url(#platformGradient)" />

            <!-- Warehouse structure -->
            <rect x="40" y="60" width="120" height="80" rx="4" fill="url(#warehouseGradient)" />

            <!-- Roof -->
            <polygon points="35,60 105,30 165,60 40,60" fill="url(#roofGradient)" />

            <!-- Side walls -->
            <polygon points="160,60 160,140 180,120 180,40" fill="url(#sideGradient)" />

            <!-- Front details -->
            <rect x="60" y="80" width="20" height="40" fill="#475569" />
            <rect x="120" y="80" width="20" height="40" fill="#475569" />

            <defs>
              <linearGradient id="platformGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#64748b" />
                <stop offset="100%" stop-color="#475569" />
              </linearGradient>
              <linearGradient id="warehouseGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#6b7280" />
                <stop offset="100%" stop-color="#4b5563" />
              </linearGradient>
              <linearGradient id="roofGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#9ca3af" />
                <stop offset="100%" stop-color="#6b7280" />
              </linearGradient>
              <linearGradient id="sideGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#4b5563" />
                <stop offset="100%" stop-color="#374151" />
              </linearGradient>
            </defs>
          </svg>
        </div>
        <h3 class="text-white font-bold text-2xl mb-3">Vista 3D no disponible</h3>
        <p class="text-slate-300 mb-2">Selecciona un almacén para explorar en 3D</p>
        <p class="text-slate-400 text-sm">Navegación interactiva • Iluminación realista • Visualización de stock</p>
      </div>
    </div>

    <!-- Main 3D Scene -->
    <div v-else class="relative w-full h-full">
      <!-- Top Control Panel -->
      <div class="absolute top-0 left-0 right-0 z-20 bg-black/20 backdrop-blur-md border-b border-white/10">
        <div class="flex items-center justify-between px-6 py-4">
          <!-- Warehouse Info -->
          <div class="flex items-center gap-4">
            <div class="flex items-center gap-3">
              <div class="w-3 h-3 rounded-full bg-green-400 animate-pulse shadow-lg shadow-green-400/50"></div>
              <div>
                <h2 class="font-bold text-xl text-white">{{ warehouseData.warehouse.name }}</h2>
                <p class="text-sm text-slate-300">
                  Vista 3D • {{ filteredLocations.length }} productos • {{ warehouseData.zones.length }} zonas
                </p>
              </div>
            </div>
          </div>

          <!-- View Controls -->
          <div class="flex items-center gap-3">
            <!-- View Mode Toggle -->
            <div class="flex items-center bg-white/10 backdrop-blur-sm rounded-xl p-1 gap-1">
              <Button
                size="sm"
                :variant="viewMode === 'realistic' ? 'default' : 'ghost'"
                class="h-9 px-4 text-xs bg-white/20 hover:bg-white/30 text-white border-0"
                @click="viewMode = 'realistic'"
              >
                <Eye class="w-3 h-3 mr-2" />Realista
              </Button>
              <Button
                size="sm"
                :variant="viewMode === 'wireframe' ? 'default' : 'ghost'"
                class="h-9 px-4 text-xs bg-white/20 hover:bg-white/30 text-white border-0"
                @click="viewMode = 'wireframe'"
              >
                <Box class="w-3 h-3 mr-2" />Esquema
              </Button>
              <Button
                size="sm"
                :variant="viewMode === 'heatmap' ? 'default' : 'ghost'"
                class="h-9 px-4 text-xs bg-white/20 hover:bg-white/30 text-white border-0"
                @click="viewMode = 'heatmap'"
              >
                <TrendingUp class="w-3 h-3 mr-2" />Calor
              </Button>
            </div>

            <!-- Camera Controls -->
            <div class="flex items-center bg-white/10 backdrop-blur-sm rounded-xl p-1">
              <Button
                size="sm"
                variant="ghost"
                class="h-9 px-3 text-white border-0 hover:bg-white/20"
                @click="setCameraPreset('overview')"
                title="Vista general"
              >
                <Home class="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                class="h-9 px-3 text-white border-0 hover:bg-white/20"
                @click="setCameraPreset('floor')"
                title="Vista de suelo"
              >
                <Minimize2 class="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                class="h-9 px-3 text-white border-0 hover:bg-white/20"
                @click="setCameraPreset('aerial')"
                title="Vista aérea"
              >
                <Maximize2 class="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                :variant="autoRotate ? 'default' : 'ghost'"
                class="h-9 px-3 text-white border-0 hover:bg-white/20"
                @click="toggleAutoRotate"
                title="Rotación automática"
              >
                <RotateCw class="w-4 h-4" />
              </Button>
            </div>

            <!-- Settings -->
            <div class="flex items-center bg-white/10 backdrop-blur-sm rounded-xl p-1">
              <Button
                size="sm"
                :variant="showLabels ? 'default' : 'ghost'"
                class="h-9 px-3 text-white border-0 hover:bg-white/20"
                @click="showLabels = !showLabels"
                title="Mostrar etiquetas"
              >
                <Tag class="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                class="h-9 px-3 text-white border-0 hover:bg-white/20"
                @click="showSettings = !showSettings"
                title="Configuración"
              >
                <Settings class="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <!-- 3D Canvas Container -->
      <div
        ref="canvasContainer"
        class="w-full h-full pt-20"
        @contextmenu.prevent
      />

      <!-- Mini-Map -->
      <div class="absolute top-24 right-6 w-48 h-32 bg-black/40 backdrop-blur-md rounded-xl border border-white/20 overflow-hidden z-10">
        <div class="p-3">
          <h4 class="text-white text-xs font-semibold mb-2 flex items-center gap-2">
            <Map class="w-3 h-3" />
            Mini-mapa
          </h4>
          <div class="relative w-full h-20 bg-slate-800/50 rounded-lg overflow-hidden">
            <!-- Mini warehouse representation -->
            <div
              v-for="zone in warehouseData.zones"
              :key="`mini-${zone.id}`"
              class="absolute rounded-sm"
              :style="{
                left: `${((zone.x_coordinate || 0) / (warehouseData.warehouse.width || 100)) * 100}%`,
                top: `${((zone.y_coordinate || 0) / (warehouseData.warehouse.length || 100)) * 100}%`,
                width: `${((zone.width || 10) / (warehouseData.warehouse.width || 100)) * 100}%`,
                height: `${((zone.length || 10) / (warehouseData.warehouse.length || 100)) * 100}%`,
                backgroundColor: zone.color_hex || '#3b82f6',
                opacity: 0.7
              }"
            />
            <!-- Camera position indicator -->
            <div
              class="absolute w-2 h-2 bg-yellow-400 rounded-full transform -translate-x-1/2 -translate-y-1/2"
              :style="{
                left: `${cameraIndicatorPosition.x}%`,
                top: `${cameraIndicatorPosition.y}%`
              }"
            />
          </div>
        </div>
      </div>

      <!-- Information Panel -->
      <Transition
        enter-active-class="transition duration-300 ease-out"
        enter-from-class="opacity-0 transform translate-y-4"
        enter-to-class="opacity-100 transform translate-y-0"
        leave-active-class="transition duration-200 ease-in"
        leave-from-class="opacity-100 transform translate-y-0"
        leave-to-class="opacity-0 transform translate-y-4"
      >
        <div
          v-if="selectedObject"
          class="absolute bottom-6 left-6 bg-black/40 backdrop-blur-lg rounded-2xl border border-white/20 overflow-hidden shadow-2xl max-w-sm min-w-80"
        >
          <!-- Panel Header -->
          <div class="bg-gradient-to-r from-blue-600/80 to-purple-600/80 p-4">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                  <Component
                    :is="getObjectIcon(selectedObject.type)"
                    class="w-5 h-5 text-white"
                  />
                </div>
                <div>
                  <h3 class="font-bold text-white text-lg">{{ selectedObject.name }}</h3>
                  <p class="text-white/70 text-sm">{{ selectedObject.type }}</p>
                </div>
              </div>
              <Button
                size="sm"
                variant="ghost"
                class="text-white hover:bg-white/20 border-0"
                @click="clearSelection"
              >
                <X class="w-4 h-4" />
              </Button>
            </div>
          </div>

          <!-- Panel Content -->
          <div class="p-4 space-y-3">
            <div v-for="(value, key) in selectedObject.details" :key="key" class="flex items-center justify-between">
              <span class="text-slate-300 text-sm">{{ key }}</span>
              <span class="text-white font-medium text-sm">{{ value }}</span>
            </div>

            <!-- Progress Bar for Stock -->
            <div v-if="selectedObject.stockPercentage !== undefined" class="mt-4">
              <div class="flex items-center justify-between mb-2">
                <span class="text-slate-300 text-sm">Ocupación</span>
                <span class="text-white font-semibold text-sm">{{ selectedObject.stockPercentage }}%</span>
              </div>
              <div class="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
                <div
                  class="h-full transition-all duration-500 rounded-full"
                  :class="getStockBarColor(selectedObject.stockPercentage)"
                  :style="{ width: `${selectedObject.stockPercentage}%` }"
                />
              </div>
            </div>
          </div>
        </div>
      </Transition>

      <!-- Performance Stats -->
      <div v-if="showStats" class="absolute top-24 left-6 bg-black/40 backdrop-blur-md rounded-xl border border-white/20 p-3 text-white text-xs space-y-1">
        <div class="flex items-center gap-2">
          <div class="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          <span>FPS: {{ fps }}</span>
        </div>
        <div>Objetos: {{ objectCount }}</div>
        <div>Triángulos: {{ triangleCount }}</div>
        <div>Draw Calls: {{ drawCalls }}</div>
      </div>

      <!-- Settings Panel -->
      <Transition
        enter-active-class="transition duration-300 ease-out"
        enter-from-class="opacity-0 transform translate-x-4"
        enter-to-class="opacity-100 transform translate-x-0"
        leave-active-class="transition duration-200 ease-in"
        leave-from-class="opacity-100 transform translate-x-0"
        leave-to-class="opacity-0 transform translate-x-4"
      >
        <div
          v-if="showSettings"
          class="absolute top-24 right-6 mt-12 bg-black/40 backdrop-blur-lg rounded-2xl border border-white/20 overflow-hidden shadow-2xl w-80"
        >
          <div class="p-4 border-b border-white/10">
            <h3 class="text-white font-semibold text-lg flex items-center gap-2">
              <Settings class="w-5 h-5" />
              Configuración 3D
            </h3>
          </div>

          <div class="p-4 space-y-4">
            <!-- Quality Settings -->
            <div>
              <label class="text-slate-300 text-sm block mb-2">Calidad de Renderizado</label>
              <select v-model="renderQuality" class="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm">
                <option value="low">Baja</option>
                <option value="medium">Media</option>
                <option value="high">Alta</option>
                <option value="ultra">Ultra</option>
              </select>
            </div>

            <!-- Lighting -->
            <div>
              <label class="text-slate-300 text-sm block mb-2">Iluminación</label>
              <div class="space-y-2">
                <label class="flex items-center gap-2">
                  <input type="checkbox" v-model="enableShadows" class="rounded">
                  <span class="text-white text-sm">Sombras</span>
                </label>
                <label class="flex items-center gap-2">
                  <input type="checkbox" v-model="enableReflections" class="rounded">
                  <span class="text-white text-sm">Reflejos</span>
                </label>
              </div>
            </div>

            <!-- Performance -->
            <div>
              <label class="flex items-center justify-between gap-2">
                <span class="text-slate-300 text-sm">Mostrar FPS</span>
                <input type="checkbox" v-model="showStats" class="rounded">
              </label>
            </div>
          </div>
        </div>
      </Transition>

      <!-- Navigation Help -->
      <div class="absolute bottom-6 right-6 bg-black/40 backdrop-blur-md rounded-xl border border-white/20 p-4 text-white text-xs">
        <h4 class="font-semibold mb-2 flex items-center gap-2">
          <Mouse class="w-3 h-3" />
          Controles
        </h4>
        <div class="space-y-1 text-slate-300">
          <div class="flex items-center gap-2">
            <div class="w-4 text-center">🖱️</div>
            <span>Arrastrar para rotar</span>
          </div>
          <div class="flex items-center gap-2">
            <div class="w-4 text-center">⚬</div>
            <span>Rueda para zoom</span>
          </div>
          <div class="flex items-center gap-2">
            <div class="w-4 text-center">⌨️</div>
            <span>Click derecho para panear</span>
          </div>
          <div class="flex items-center gap-2">
            <div class="w-4 text-center">👆</div>
            <span>Click para seleccionar</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, nextTick, computed } from 'vue'
import {
  Eye, Box, TrendingUp, Home, Minimize2, Maximize2, RotateCw, Tag, Settings, Map, X, Mouse,
  Layers, Navigation, Archive, Package
} from 'lucide-vue-next'
import Button from '@/components/ui/Button.vue'
import type {
  WarehouseVisualizerData,
  WarehouseZone,
  WarehouseAisle,
  WarehouseShelf,
  ProductLocationDetailed
} from '@/composables/useWarehouseVisualizer'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass'
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass'

interface Props {
  warehouseData: WarehouseVisualizerData | null
  filteredLocations: ProductLocationDetailed[]
  loading?: boolean
}

const props = defineProps<Props>()

// UI State
const viewMode = ref<'realistic' | 'wireframe' | 'heatmap'>('realistic')
const showLabels = ref(true)
const showSettings = ref(false)
const showStats = ref(false)
const autoRotate = ref(false)
const loadingProgress = ref(0)

// Render Settings
const renderQuality = ref('high')
const enableShadows = ref(true)
const enableReflections = ref(false)

// Performance Stats
const fps = ref(60)
const objectCount = ref(0)
const triangleCount = ref(0)
const drawCalls = ref(0)

// Selection State
const selectedObject = ref<{
  type: string
  name: string
  details: Record<string, any>
  stockPercentage?: number
} | null>(null)

// Three.js Core
const canvasContainer = ref<HTMLDivElement>()
let scene: THREE.Scene
let camera: THREE.PerspectiveCamera
let renderer: THREE.WebGLRenderer
let controls: OrbitControls
let composer: EffectComposer
let animationId: number

// Interaction
let raycaster: THREE.Raycaster
let mouse: THREE.Vector2
let clickableObjects: THREE.Object3D[] = []

// Materials and Textures
const materials = ref<{
  floor: THREE.Material
  wall: THREE.Material
  zone: THREE.Material
  aisle: THREE.Material
  shelf: THREE.Material
  productHigh: THREE.Material
  productMedium: THREE.Material
  productLow: THREE.Material
  productEmpty: THREE.Material
}>()

// Camera Indicator Position for Mini-map
const cameraIndicatorPosition = computed(() => {
  if (!camera || !props.warehouseData) return { x: 50, y: 50 }

  const bounds = {
    width: props.warehouseData.warehouse.width || 100,
    length: props.warehouseData.warehouse.length || 100
  }

  return {
    x: ((camera.position.x) / bounds.width) * 100,
    y: ((camera.position.z) / bounds.length) * 100
  }
})

// Initialize 3D Scene
const init3DScene = async () => {
  if (!canvasContainer.value || !props.warehouseData) return

  loadingProgress.value = 10

  const container = canvasContainer.value
  const rect = container.getBoundingClientRect()

  // Scene Setup
  scene = new THREE.Scene()
  scene.background = new THREE.Color(0x0f172a)
  scene.fog = new THREE.Fog(0x0f172a, 50, 500)

  loadingProgress.value = 20

  // Camera Setup
  camera = new THREE.PerspectiveCamera(60, rect.width / rect.height, 0.1, 2000)
  const bounds = {
    width: props.warehouseData.warehouse.width || 100,
    height: props.warehouseData.warehouse.height || 20,
    length: props.warehouseData.warehouse.length || 100
  }
  camera.position.set(bounds.width * 1.2, bounds.height * 3, bounds.length * 1.2)

  loadingProgress.value = 30

  // Renderer Setup with Enhanced Settings
  renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
    powerPreference: 'high-performance'
  })
  renderer.setSize(rect.width, rect.height)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.shadowMap.enabled = enableShadows.value
  renderer.shadowMap.type = THREE.PCFSoftShadowMap
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.2

  container.appendChild(renderer.domElement)

  loadingProgress.value = 40

  // Post-processing Setup
  composer = new EffectComposer(renderer)
  const renderPass = new RenderPass(scene, camera)
  composer.addPass(renderPass)

  const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(rect.width, rect.height),
    0.3, // strength
    0.4, // radius
    0.1  // threshold
  )
  composer.addPass(bloomPass)

  const outputPass = new OutputPass()
  composer.addPass(outputPass)

  loadingProgress.value = 50

  // Controls Setup
  controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.dampingFactor = 0.05
  controls.target.set(bounds.width / 2, 0, bounds.length / 2)
  controls.maxDistance = bounds.width * 3
  controls.minDistance = 10

  loadingProgress.value = 60

  // Advanced Lighting Setup
  await setupLighting()

  loadingProgress.value = 70

  // Materials Setup
  await createMaterials()

  loadingProgress.value = 80

  // Build 3D World
  await build3DWorld()

  loadingProgress.value = 90

  // Interaction Setup
  raycaster = new THREE.Raycaster()
  mouse = new THREE.Vector2()
  renderer.domElement.addEventListener('click', onCanvasClick)
  window.addEventListener('resize', onWindowResize)

  loadingProgress.value = 100

  // Start Animation Loop
  animate()
}

// Enhanced Lighting System
const setupLighting = async () => {
  // Ambient Light
  const ambientLight = new THREE.AmbientLight(0x404040, 0.3)
  scene.add(ambientLight)

  // Main Directional Light (Sun)
  const directionalLight = new THREE.DirectionalLight(0xffffff, 1.2)
  directionalLight.position.set(50, 100, 50)
  directionalLight.castShadow = true
  directionalLight.shadow.mapSize.width = 4096
  directionalLight.shadow.mapSize.height = 4096
  directionalLight.shadow.camera.near = 0.5
  directionalLight.shadow.camera.far = 200
  directionalLight.shadow.camera.left = -100
  directionalLight.shadow.camera.right = 100
  directionalLight.shadow.camera.top = 100
  directionalLight.shadow.camera.bottom = -100
  scene.add(directionalLight)

  // Hemisphere Light for Natural Look
  const hemisphereLight = new THREE.HemisphereLight(0x87CEEB, 0x362D1D, 0.5)
  scene.add(hemisphereLight)

  // Point Lights for Area Illumination
  const pointLight1 = new THREE.PointLight(0xffffff, 0.8, 100)
  pointLight1.position.set(25, 20, 25)
  pointLight1.castShadow = true
  scene.add(pointLight1)

  const pointLight2 = new THREE.PointLight(0xffffff, 0.8, 100)
  pointLight2.position.set(75, 20, 75)
  pointLight2.castShadow = true
  scene.add(pointLight2)
}

// Advanced Materials Creation
const createMaterials = async () => {
  // Floor Material with Texture-like Effect
  const floorMaterial = new THREE.MeshLambertMaterial({
    color: 0xe5e7eb,
    transparent: false,
  })

  // Wall Material
  const wallMaterial = new THREE.MeshLambertMaterial({
    color: 0x6b7280,
    transparent: true,
    opacity: 0.1,
    wireframe: true
  })

  // Zone Materials
  const zoneMaterial = new THREE.MeshPhongMaterial({
    transparent: true,
    opacity: 0.6,
    shininess: 30
  })

  // Aisle Material
  const aisleMaterial = new THREE.MeshLambertMaterial({
    color: 0x9ca3af,
    transparent: true,
    opacity: 0.8
  })

  // Shelf Material with Metallic Look
  const shelfMaterial = new THREE.MeshPhongMaterial({
    color: 0x4a5568,
    shininess: 100,
    specular: 0x222222
  })

  // Product Materials by Stock Level
  const productHighMaterial = new THREE.MeshPhongMaterial({
    color: 0x22c55e,
    emissive: 0x002200,
    shininess: 30
  })

  const productMediumMaterial = new THREE.MeshPhongMaterial({
    color: 0xf59e0b,
    emissive: 0x221100,
    shininess: 30
  })

  const productLowMaterial = new THREE.MeshPhongMaterial({
    color: 0xef4444,
    emissive: 0x220000,
    shininess: 30
  })

  const productEmptyMaterial = new THREE.MeshLambertMaterial({
    color: 0x6b7280,
    transparent: true,
    opacity: 0.5
  })

  materials.value = {
    floor: floorMaterial,
    wall: wallMaterial,
    zone: zoneMaterial,
    aisle: aisleMaterial,
    shelf: shelfMaterial,
    productHigh: productHighMaterial,
    productMedium: productMediumMaterial,
    productLow: productLowMaterial,
    productEmpty: productEmptyMaterial
  }
}

// Build Complete 3D World
const build3DWorld = async () => {
  if (!props.warehouseData || !materials.value) return

  clickableObjects = []

  const bounds = {
    width: props.warehouseData.warehouse.width || 100,
    height: props.warehouseData.warehouse.height || 20,
    length: props.warehouseData.warehouse.length || 100
  }

  // Enhanced Floor with Grid Pattern
  const floorGeometry = new THREE.PlaneGeometry(bounds.width + 20, bounds.length + 20, 50, 50)
  const floorMesh = new THREE.Mesh(floorGeometry, materials.value.floor)
  floorMesh.rotation.x = -Math.PI / 2
  floorMesh.position.set(bounds.width / 2, 0, bounds.length / 2)
  floorMesh.receiveShadow = true
  scene.add(floorMesh)

  // Warehouse Walls (Transparent)
  const wallGeometry = new THREE.BoxGeometry(bounds.width, bounds.height, bounds.length)
  const wallMesh = new THREE.Mesh(wallGeometry, materials.value.wall)
  wallMesh.position.set(bounds.width / 2, bounds.height / 2, bounds.length / 2)
  scene.add(wallMesh)

  // Zones with Enhanced 3D Effect
  for (const zone of props.warehouseData.zones) {
    await createZone3D(zone)
  }

  // Aisles as 3D Corridors
  for (const aisle of props.warehouseData.aisles) {
    await createAisle3D(aisle)
  }

  // Shelves with Detailed Structure
  for (const shelf of props.warehouseData.shelves) {
    await createShelf3D(shelf)
  }

  // Product Locations with Stock Visualization
  for (const location of props.filteredLocations) {
    await createProductLocation3D(location)
  }

  objectCount.value = scene.children.length
  triangleCount.value = calculateTriangleCount()
}

// Enhanced Zone Creation
const createZone3D = async (zone: WarehouseZone) => {
  const zoneWidth = zone.width || 20
  const zoneHeight = 1
  const zoneLength = zone.length || 20

  // Zone Base Platform
  const zoneGeometry = new THREE.BoxGeometry(zoneWidth, zoneHeight, zoneLength)
  const zoneMaterial = materials.value!.zone.clone()
  zoneMaterial.color = new THREE.Color(zone.color_hex || '#3b82f6')

  const zoneMesh = new THREE.Mesh(zoneGeometry, zoneMaterial)
  zoneMesh.position.set(
    (zone.x_coordinate || 0) + zoneWidth / 2,
    zoneHeight / 2,
    (zone.y_coordinate || 0) + zoneLength / 2
  )
  zoneMesh.castShadow = true
  zoneMesh.receiveShadow = true
  zoneMesh.userData = {
    type: 'zone',
    data: zone,
    selectable: true
  }

  clickableObjects.push(zoneMesh)
  scene.add(zoneMesh)

  // Zone Border Lines
  const edgesGeometry = new THREE.EdgesGeometry(zoneGeometry)
  const edgesMaterial = new THREE.LineBasicMaterial({
    color: zone.color_hex || '#3b82f6',
    linewidth: 2
  })
  const edges = new THREE.LineSegments(edgesGeometry, edgesMaterial)
  edges.position.copy(zoneMesh.position)
  scene.add(edges)

  // Zone Label (3D Text would go here)
  if (showLabels.value) {
    await createZoneLabel(zone, zoneMesh.position)
  }
}

// Enhanced Aisle Creation
const createAisle3D = async (aisle: WarehouseAisle) => {
  const aisleWidth = aisle.width || 3
  const aisleHeight = 0.2
  const aisleLength = aisle.length || 20

  const aisleGeometry = new THREE.BoxGeometry(aisleWidth, aisleHeight, aisleLength)
  const aisleMesh = new THREE.Mesh(aisleGeometry, materials.value!.aisle)

  aisleMesh.position.set(
    (aisle.x_coordinate || 0) + aisleWidth / 2,
    aisleHeight / 2,
    (aisle.y_coordinate || 0) + aisleLength / 2
  )

  aisleMesh.userData = {
    type: 'aisle',
    data: aisle,
    selectable: true
  }

  clickableObjects.push(aisleMesh)
  scene.add(aisleMesh)
}

// Enhanced Shelf Creation
const createShelf3D = async (shelf: WarehouseShelf) => {
  const shelfWidth = shelf.width || 1.5
  const shelfHeight = shelf.height || 3
  const shelfDepth = shelf.depth || 0.8
  const levels = shelf.levels || 4

  // Main Shelf Structure
  const shelfGeometry = new THREE.BoxGeometry(shelfWidth, shelfHeight, shelfDepth)
  const shelfMesh = new THREE.Mesh(shelfGeometry, materials.value!.shelf)

  shelfMesh.position.set(
    (shelf.position_x || 0) + shelfWidth / 2,
    shelfHeight / 2,
    (shelf.position_y || 0) + shelfDepth / 2
  )

  shelfMesh.castShadow = true
  shelfMesh.receiveShadow = true
  shelfMesh.userData = {
    type: 'shelf',
    data: shelf,
    selectable: true
  }

  clickableObjects.push(shelfMesh)
  scene.add(shelfMesh)

  // Shelf Levels
  const levelHeight = shelfHeight / levels
  for (let i = 0; i < levels; i++) {
    const levelGeometry = new THREE.BoxGeometry(shelfWidth - 0.1, 0.05, shelfDepth - 0.1)
    const levelMesh = new THREE.Mesh(levelGeometry, materials.value!.shelf)
    levelMesh.position.set(
      shelfMesh.position.x,
      (i + 0.5) * levelHeight,
      shelfMesh.position.z
    )
    scene.add(levelMesh)
  }
}

// Enhanced Product Location Creation
const createProductLocation3D = async (location: ProductLocationDetailed) => {
  const stockPercentage = getStockPercentage(location)
  const radius = Math.max(0.3, Math.min(1.2, (location.stock_actual || 1) / 50 + 0.3))

  let material: THREE.Material
  if (stockPercentage >= 75) {
    material = materials.value!.productHigh
  } else if (stockPercentage >= 25) {
    material = materials.value!.productMedium
  } else if (stockPercentage > 0) {
    material = materials.value!.productLow
  } else {
    material = materials.value!.productEmpty
  }

  // Product Sphere with Glow Effect
  const productGeometry = new THREE.SphereGeometry(radius, 16, 12)
  const productMesh = new THREE.Mesh(productGeometry, material)

  productMesh.position.set(
    location.final_x || location.position_x || 0,
    (location.final_z || 1) + radius,
    location.final_y || location.position_y || 0
  )

  productMesh.castShadow = true
  productMesh.userData = {
    type: 'product',
    data: location,
    selectable: true
  }

  clickableObjects.push(productMesh)
  scene.add(productMesh)

  // Add glowing ring for high-stock items
  if (stockPercentage >= 75) {
    const ringGeometry = new THREE.RingGeometry(radius * 1.2, radius * 1.4, 16)
    const ringMaterial = new THREE.MeshBasicMaterial({
      color: 0x22c55e,
      transparent: true,
      opacity: 0.3,
      side: THREE.DoubleSide
    })
    const ringMesh = new THREE.Mesh(ringGeometry, ringMaterial)
    ringMesh.position.copy(productMesh.position)
    ringMesh.rotation.x = -Math.PI / 2
    scene.add(ringMesh)
  }
}

// Helper Functions
const createZoneLabel = async (zone: WarehouseZone, position: THREE.Vector3) => {
  // This would create 3D text labels - placeholder for now
  // Could use THREE.TextGeometry or sprite-based labels
}

const getStockPercentage = (location: ProductLocationDetailed) => {
  const capacity = location.capacity_max || 1
  const stock = location.stock_actual || 0
  return capacity > 0 ? Math.min((stock / capacity) * 100, 100) : 0
}

const calculateTriangleCount = () => {
  let count = 0
  scene.traverse((object) => {
    if (object instanceof THREE.Mesh) {
      const geometry = object.geometry
      if (geometry instanceof THREE.BufferGeometry) {
        const positionAttribute = geometry.getAttribute('position')
        if (positionAttribute) {
          count += positionAttribute.count / 3
        }
      }
    }
  })
  return Math.floor(count)
}

// Event Handlers
const onCanvasClick = (event: MouseEvent) => {
  if (!canvasContainer.value) return

  const rect = canvasContainer.value.getBoundingClientRect()
  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1

  raycaster.setFromCamera(mouse, camera)
  const intersects = raycaster.intersectObjects(clickableObjects)

  if (intersects.length > 0) {
    const object = intersects[0].object
    const userData = object.userData

    switch (userData.type) {
      case 'zone':
        selectZone(userData.data)
        break
      case 'aisle':
        selectAisle(userData.data)
        break
      case 'shelf':
        selectShelf(userData.data)
        break
      case 'product':
        selectProduct(userData.data)
        break
    }
  } else {
    clearSelection()
  }
}

const selectZone = (zone: WarehouseZone) => {
  selectedObject.value = {
    type: 'Zona de Almacén',
    name: zone.name || zone.code,
    details: {
      'Código': zone.code,
      'Dimensiones': `${zone.width || 0}m × ${zone.length || 0}m`,
      'Tipo': zone.shape_type || 'Rectangular',
      'Capacidad': `${zone.capacity_kg || 0} kg`,
      'Productos': props.filteredLocations.filter(l => l.warehouse_zone_id === zone.id).length
    }
  }
}

const selectAisle = (aisle: WarehouseAisle) => {
  selectedObject.value = {
    type: 'Pasillo',
    name: aisle.name || aisle.code,
    details: {
      'Código': aisle.code,
      'Dirección': aisle.direction || 'Norte-Sur',
      'Ancho': `${aisle.width || 0}m`,
      'Longitud': `${aisle.length || 0}m`,
      'Tipo': aisle.is_main_aisle ? 'Principal' : 'Secundario'
    }
  }
}

const selectShelf = (shelf: WarehouseShelf) => {
  selectedObject.value = {
    type: 'Estante',
    name: shelf.name || shelf.code,
    details: {
      'Código': shelf.code,
      'Tipo': shelf.shelf_type || 'Estándar',
      'Niveles': shelf.levels || 4,
      'Material': shelf.material || 'Acero',
      'Capacidad': `${shelf.max_weight_kg || 0} kg`,
      'Estado': shelf.is_active ? 'Activo' : 'Inactivo'
    }
  }
}

const selectProduct = (location: ProductLocationDetailed) => {
  const stockPercentage = getStockPercentage(location)

  selectedObject.value = {
    type: 'Producto',
    name: location.product_name || 'Producto sin nombre',
    details: {
      'SKU': location.product_sku || 'N/A',
      'Ubicación': location.full_location_code || 'Sin código',
      'Stock': `${location.stock_actual || 0} / ${location.capacity_max || 0}`,
      'Almacén': location.warehouse_name || 'N/A',
      'Zona': location.zone_name || 'N/A',
      'Estante': location.shelf_name || 'N/A',
      'Principal': location.es_principal ? 'Sí' : 'No'
    },
    stockPercentage
  }
}

const clearSelection = () => {
  selectedObject.value = null
}

const getObjectIcon = (type: string) => {
  switch (type.toLowerCase()) {
    case 'zona de almacén':
      return Layers
    case 'pasillo':
      return Navigation
    case 'estante':
      return Archive
    case 'producto':
      return Package
    default:
      return Box
  }
}

const getStockBarColor = (percentage: number) => {
  if (percentage >= 75) return 'bg-green-500'
  if (percentage >= 50) return 'bg-yellow-500'
  if (percentage >= 25) return 'bg-orange-500'
  return 'bg-red-500'
}

// Camera Controls
const setCameraPreset = (preset: string) => {
  if (!props.warehouseData) return

  const bounds = {
    width: props.warehouseData.warehouse.width || 100,
    height: props.warehouseData.warehouse.height || 20,
    length: props.warehouseData.warehouse.length || 100
  }

  switch (preset) {
    case 'overview':
      camera.position.set(bounds.width * 1.2, bounds.height * 3, bounds.length * 1.2)
      controls.target.set(bounds.width / 2, 0, bounds.length / 2)
      break
    case 'floor':
      camera.position.set(bounds.width / 2, bounds.height * 0.5, bounds.length * 1.5)
      controls.target.set(bounds.width / 2, 0, bounds.length / 2)
      break
    case 'aerial':
      camera.position.set(bounds.width / 2, bounds.height * 5, bounds.length / 2)
      controls.target.set(bounds.width / 2, 0, bounds.length / 2)
      break
  }

  controls.update()
}

const toggleAutoRotate = () => {
  autoRotate.value = !autoRotate.value
  controls.autoRotate = autoRotate.value
}

// Animation Loop
const animate = () => {
  animationId = requestAnimationFrame(animate)

  controls.update()

  // Apply view mode effects
  if (viewMode.value === 'wireframe') {
    scene.traverse((object) => {
      if (object instanceof THREE.Mesh && object.material instanceof THREE.Material) {
        object.material.wireframe = true
      }
    })
  } else {
    scene.traverse((object) => {
      if (object instanceof THREE.Mesh && object.material instanceof THREE.Material) {
        object.material.wireframe = false
      }
    })
  }

  composer.render()

  // Update performance stats
  fps.value = Math.round(1000 / (Date.now() % 1000 + 1))
  drawCalls.value = renderer.info.render.calls
}

const onWindowResize = () => {
  if (!canvasContainer.value) return

  const rect = canvasContainer.value.getBoundingClientRect()
  camera.aspect = rect.width / rect.height
  camera.updateProjectionMatrix()
  renderer.setSize(rect.width, rect.height)
  composer.setSize(rect.width, rect.height)
}

// Cleanup
const cleanup = () => {
  if (animationId) {
    cancelAnimationFrame(animationId)
  }

  if (renderer) {
    renderer.domElement.removeEventListener('click', onCanvasClick)
    if (canvasContainer.value && canvasContainer.value.contains(renderer.domElement)) {
      canvasContainer.value.removeChild(renderer.domElement)
    }
    renderer.dispose()
  }

  window.removeEventListener('resize', onWindowResize)
}

// Watchers
watch(() => props.warehouseData, async (newData) => {
  if (newData && scene) {
    // Clear existing objects
    clickableObjects = []
    while(scene.children.length > 0) {
      scene.remove(scene.children[0])
    }
    await setupLighting()
    await build3DWorld()
  }
}, { deep: true })

watch(() => props.filteredLocations, async () => {
  if (scene && props.warehouseData) {
    await build3DWorld()
  }
}, { deep: true })

// Lifecycle
onMounted(async () => {
  await nextTick()
  if (props.warehouseData) {
    await init3DScene()
  }
})

onUnmounted(() => {
  cleanup()
})

// Initialize when data becomes available
watch(() => props.warehouseData, async (newData) => {
  if (newData && !scene) {
    await nextTick()
    await init3DScene()
  }
})
</script>

<style scoped>
canvas {
  display: block;
  cursor: grab;
}

canvas:active {
  cursor: grabbing;
}

/* Custom checkbox styling for dark theme */
input[type="checkbox"] {
  accent-color: #3b82f6;
}

select {
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e");
  background-position: right 0.5rem center;
  background-repeat: no-repeat;
  background-size: 1.5em 1.5em;
  padding-right: 2.5rem;
}
</style>