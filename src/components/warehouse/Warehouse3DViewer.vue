<template>
  <div class="warehouse-3d-viewer h-full w-full bg-gray-50 rounded-lg border overflow-hidden">
    <!-- Controls -->
    <div class="bg-white border-b p-4 flex items-center justify-between">
      <div class="flex items-center gap-4">
        <Button variant="outline" size="sm" @click="resetCamera">
          <RotateCcw class="h-4 w-4 mr-1" />
          Resetear Cámara
        </Button>
        <Button variant="outline" size="sm" @click="toggleWireframe">
          <Grid3x3 class="h-4 w-4 mr-1" />
          {{ showWireframe ? 'Sólido' : 'Wireframe' }}
        </Button>
        <div class="flex items-center gap-2">
          <label class="text-sm font-medium text-gray-700">Vista:</label>
          <select
            v-model="cameraMode"
            class="text-sm rounded border border-gray-300 px-2 py-1"
            @change="setCameraMode"
          >
            <option value="perspective">Perspectiva</option>
            <option value="top">Vista Superior</option>
            <option value="front">Vista Frontal</option>
            <option value="side">Vista Lateral</option>
          </select>
        </div>
      </div>
      
      <div class="flex items-center gap-2">
        <Badge v-if="selectedLocation" variant="outline" class="bg-blue-50">
          {{ selectedLocation.product?.name || 'Producto seleccionado' }}
        </Badge>
        <Button
          v-if="selectedLocation"
          variant="ghost"
          size="sm"
          @click="clearSelection"
        >
          <X class="h-4 w-4" />
        </Button>
      </div>
    </div>

    <!-- 3D Scene -->
    <div class="relative h-full w-full">
      <div
        ref="sceneContainer"
        class="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200"
        @contextmenu.prevent
      />
      
      <!-- Loading overlay -->
      <div
        v-if="isLoading"
        class="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75"
      >
        <div class="flex items-center gap-3">
          <Loader2 class="h-6 w-6 animate-spin" />
          <span class="text-sm text-gray-600">Cargando vista 3D...</span>
        </div>
      </div>

      <!-- Location details panel -->
      <div
        v-if="selectedLocation"
        class="absolute top-4 left-4 bg-white rounded-lg shadow-lg p-4 max-w-xs border"
      >
        <div class="flex items-start justify-between mb-3">
          <h4 class="font-semibold text-gray-900">Detalles 3D</h4>
          <Button
            variant="ghost"
            size="icon"
            class="h-6 w-6"
            @click="clearSelection"
          >
            <X class="h-4 w-4" />
          </Button>
        </div>
        
        <div class="space-y-2 text-sm">
          <div>
            <span class="font-medium text-gray-700">Producto:</span>
            <p class="text-gray-900">{{ selectedLocation.product?.name || 'Sin nombre' }}</p>
          </div>
          <div>
            <span class="font-medium text-gray-700">SKU:</span>
            <code class="bg-gray-100 px-1 py-0.5 rounded text-xs">
              {{ selectedLocation.product?.sku || '-' }}
            </code>
          </div>
          <div>
            <span class="font-medium text-gray-700">Posición 3D:</span>
            <p class="text-gray-900 font-mono text-xs">
              X:{{ selectedLocation.position_x || 0 }}<br>
              Y:{{ selectedLocation.position_y || 0 }}<br>
              Z:{{ selectedLocation.position_z || 0 }}
            </p>
          </div>
          <div>
            <span class="font-medium text-gray-700">Stock:</span>
            <div class="flex items-center gap-2">
              <span class="font-semibold">{{ selectedLocation.stock_actual }}</span>
              <Badge
                v-if="selectedLocation.capacity_max && selectedLocation.stock_actual >= selectedLocation.capacity_max"
                variant="warning"
                class="text-xs"
              >
                Lleno
              </Badge>
            </div>
          </div>
          <div>
            <Button
              variant="outline"
              size="sm"
              class="w-full mt-2"
              @click="focusOnLocation(selectedLocation)"
            >
              <Target class="h-4 w-4 mr-1" />
              Enfocar
            </Button>
          </div>
        </div>
      </div>

      <!-- Controls info -->
      <div class="absolute bottom-4 right-4 bg-white rounded-lg shadow p-3 text-xs text-gray-600">
        <div class="space-y-1">
          <div><strong>Clic izquierdo:</strong> Seleccionar producto</div>
          <div><strong>Clic derecho + arrastrar:</strong> Rotar cámara</div>
          <div><strong>Scroll:</strong> Zoom</div>
          <div><strong>Clic medio + arrastrar:</strong> Pan</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { X, RotateCcw, Grid3x3, Loader2, Target } from 'lucide-vue-next'
import Button from '@/components/ui/Button.vue'
import Badge from '@/components/ui/Badge.vue'
import type { LocationWithProduct, WarehouseZone } from '@/composables/useWarehouseVisualizer'

interface Props {
  locations: LocationWithProduct[]
  zones: WarehouseZone[]
  warehouseBounds: { width: number; height: number; length: number } | null
  searchQuery?: string
}

const props = withDefaults(defineProps<Props>(), {
  locations: () => [],
  zones: () => [],
  searchQuery: ''
})

const emit = defineEmits<{
  locationSelected: [location: LocationWithProduct]
  zoneSelected: [zone: WarehouseZone]
}>()

// State
const sceneContainer = ref<HTMLElement>()
const isLoading = ref(true)
const selectedLocation = ref<LocationWithProduct | null>(null)
const showWireframe = ref(false)
const cameraMode = ref<'perspective' | 'top' | 'front' | 'side'>('perspective')

// Three.js objects
let scene: THREE.Scene
let camera: THREE.PerspectiveCamera
let renderer: THREE.WebGLRenderer
let controls: OrbitControls
let raycaster: THREE.Raycaster
let mouse: THREE.Vector2

// Object collections
let locationMeshes: { mesh: THREE.Mesh; location: LocationWithProduct }[] = []
let zoneMeshes: { mesh: THREE.Mesh; zone: WarehouseZone }[] = []
let warehouseBoundingBox: THREE.Mesh | null = null
let selectedHighlight: THREE.Mesh | null = null

// Initialize Three.js scene
const initScene = async () => {
  if (!sceneContainer.value) return
  
  isLoading.value = true
  
  // Scene
  scene = new THREE.Scene()
  scene.background = new THREE.Color(0xf8fafc)
  
  // Camera
  const bounds = props.warehouseBounds || { width: 100, height: 50, length: 100 }
  const aspect = sceneContainer.value.clientWidth / sceneContainer.value.clientHeight
  camera = new THREE.PerspectiveCamera(75, aspect, 0.1, 1000)
  
  // Position camera to view the entire warehouse
  const maxDimension = Math.max(bounds.width, bounds.height, bounds.length)
  camera.position.set(
    bounds.width * 0.7,
    bounds.height + maxDimension * 0.5,
    bounds.length * 0.7
  )
  camera.lookAt(bounds.width / 2, 0, bounds.length / 2)
  
  // Renderer
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
  renderer.setSize(sceneContainer.value.clientWidth, sceneContainer.value.clientHeight)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap
  sceneContainer.value.appendChild(renderer.domElement)
  
  // Controls
  controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.dampingFactor = 0.05
  controls.target.set(bounds.width / 2, 0, bounds.length / 2)
  
  // Lighting
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
  scene.add(ambientLight)
  
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
  directionalLight.position.set(bounds.width, bounds.height + 20, bounds.length)
  directionalLight.castShadow = true
  directionalLight.shadow.mapSize.width = 2048
  directionalLight.shadow.mapSize.height = 2048
  scene.add(directionalLight)
  
  // Raycaster for mouse interaction
  raycaster = new THREE.Raycaster()
  mouse = new THREE.Vector2()
  
  // Add event listeners
  renderer.domElement.addEventListener('click', onMouseClick)
  window.addEventListener('resize', onWindowResize)
  
  // Create scene objects
  createWarehouse()
  createZones()
  createLocations()
  
  // Start render loop
  animate()
  
  isLoading.value = false
}

const createWarehouse = () => {
  if (!props.warehouseBounds) return
  
  const { width, height, length } = props.warehouseBounds
  
  // Floor
  const floorGeometry = new THREE.PlaneGeometry(width, length)
  const floorMaterial = new THREE.MeshLambertMaterial({ 
    color: 0xe2e8f0,
    transparent: true,
    opacity: 0.8
  })
  const floor = new THREE.Mesh(floorGeometry, floorMaterial)
  floor.rotation.x = -Math.PI / 2
  floor.receiveShadow = true
  scene.add(floor)
  
  // Warehouse boundary (wireframe)
  const boundaryGeometry = new THREE.BoxGeometry(width, height, length)
  const boundaryMaterial = new THREE.MeshBasicMaterial({ 
    color: 0x64748b,
    wireframe: true,
    transparent: true,
    opacity: 0.3
  })
  warehouseBoundingBox = new THREE.Mesh(boundaryGeometry, boundaryMaterial)
  warehouseBoundingBox.position.set(width / 2, height / 2, length / 2)
  scene.add(warehouseBoundingBox)
  
  // Grid helper
  const gridHelper = new THREE.GridHelper(Math.max(width, length), 20, 0x94a3b8, 0xd1d5db)
  gridHelper.position.set(width / 2, 0, length / 2)
  scene.add(gridHelper)
}

const createZones = () => {
  // Clear existing zones
  zoneMeshes.forEach(({ mesh }) => scene.remove(mesh))
  zoneMeshes = []
  
  props.zones.forEach(zone => {
    const geometry = new THREE.BoxGeometry(
      zone.width || 10,
      5, // Fixed height for zones
      zone.length || 10
    )
    
    const color = new THREE.Color(zone.color_hex || '#3B82F6')
    const material = new THREE.MeshLambertMaterial({
      color: color,
      transparent: true,
      opacity: zone.opacity || 0.3,
      wireframe: showWireframe.value
    })
    
    const mesh = new THREE.Mesh(geometry, material)
    mesh.position.set(
      (zone.x_coordinate || 0) + (zone.width || 10) / 2,
      2.5,
      (zone.y_coordinate || 0) + (zone.length || 10) / 2
    )
    mesh.castShadow = true
    mesh.receiveShadow = true
    
    scene.add(mesh)
    zoneMeshes.push({ mesh, zone })
  })
}

const createLocations = () => {
  // Clear existing locations
  locationMeshes.forEach(({ mesh }) => scene.remove(mesh))
  locationMeshes = []
  
  props.locations.forEach(location => {
    const geometry = new THREE.SphereGeometry(
      getLocationRadius(location),
      16,
      12
    )
    
    const material = new THREE.MeshLambertMaterial({
      color: getLocationColor(location),
      wireframe: showWireframe.value
    })
    
    const mesh = new THREE.Mesh(geometry, material)
    const position = get3DPosition(location)
    mesh.position.set(position.x, position.y, position.z)
    mesh.castShadow = true
    
    // Add user data for raycasting
    mesh.userData = { type: 'location', data: location }
    
    scene.add(mesh)
    locationMeshes.push({ mesh, location })
    
    // Add stock label if there's stock
    if (location.stock_actual > 0) {
      createStockLabel(mesh, location.stock_actual.toString())
    }
  })
}

const createStockLabel = (parentMesh: THREE.Mesh, text: string) => {
  const canvas = document.createElement('canvas')
  const context = canvas.getContext('2d')!
  canvas.width = 64
  canvas.height = 32
  
  context.fillStyle = 'white'
  context.fillRect(0, 0, 64, 32)
  context.fillStyle = 'black'
  context.font = 'bold 16px Arial'
  context.textAlign = 'center'
  context.fillText(text, 32, 20)
  
  const texture = new THREE.CanvasTexture(canvas)
  const spriteMaterial = new THREE.SpriteMaterial({ map: texture })
  const sprite = new THREE.Sprite(spriteMaterial)
  sprite.scale.set(6, 3, 1)
  sprite.position.set(0, getLocationRadius(parentMesh.userData?.data) + 3, 0)
  
  parentMesh.add(sprite)
}

const getLocationRadius = (location: LocationWithProduct) => {
  const baseRadius = 1.5
  const stockMultiplier = Math.min(location.stock_actual / 20, 2)
  return baseRadius + stockMultiplier
}

const getLocationColor = (location: LocationWithProduct): THREE.Color => {
  if (location.es_principal) {
    return new THREE.Color(0x10B981) // green for primary locations
  } else if (location.stock_actual === 0) {
    return new THREE.Color(0x94A3B8) // gray for empty locations
  } else if (location.capacity_max && location.stock_actual >= location.capacity_max) {
    return new THREE.Color(0xF59E0B) // amber for full locations
  }
  return new THREE.Color(0x3B82F6) // blue for regular locations
}

const get3DPosition = (location: LocationWithProduct) => {
  return {
    x: location.position_x || 0,
    y: Math.max(location.position_z || 0, getLocationRadius(location)), // Ensure objects are above ground
    z: location.position_y || 0
  }
}

// Event handlers
const onMouseClick = (event: MouseEvent) => {
  if (!sceneContainer.value) return
  
  const rect = sceneContainer.value.getBoundingClientRect()
  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
  
  raycaster.setFromCamera(mouse, camera)
  
  const locationObjects = locationMeshes.map(({ mesh }) => mesh)
  const intersects = raycaster.intersectObjects(locationObjects)
  
  if (intersects.length > 0) {
    const selectedMesh = intersects[0].object as THREE.Mesh
    const location = selectedMesh.userData?.data as LocationWithProduct
    
    if (location) {
      selectLocation(location, selectedMesh)
    }
  } else {
    clearSelection()
  }
}

const selectLocation = (location: LocationWithProduct, mesh: THREE.Mesh) => {
  selectedLocation.value = location
  emit('locationSelected', location)
  
  // Remove previous highlight
  if (selectedHighlight) {
    scene.remove(selectedHighlight)
  }
  
  // Create highlight ring
  const ringGeometry = new THREE.TorusGeometry(
    getLocationRadius(location) + 2,
    0.3,
    8,
    16
  )
  const ringMaterial = new THREE.MeshBasicMaterial({ color: 0xef4444 })
  selectedHighlight = new THREE.Mesh(ringGeometry, ringMaterial)
  selectedHighlight.position.copy(mesh.position)
  selectedHighlight.rotation.x = Math.PI / 2
  scene.add(selectedHighlight)
}

const clearSelection = () => {
  selectedLocation.value = null
  if (selectedHighlight) {
    scene.remove(selectedHighlight)
    selectedHighlight = null
  }
}

const focusOnLocation = (location: LocationWithProduct) => {
  const position = get3DPosition(location)
  const offset = 20
  
  camera.position.set(
    position.x + offset,
    position.y + offset,
    position.z + offset
  )
  controls.target.set(position.x, position.y, position.z)
  controls.update()
}

const resetCamera = () => {
  const bounds = props.warehouseBounds || { width: 100, height: 50, length: 100 }
  const maxDimension = Math.max(bounds.width, bounds.height, bounds.length)
  
  camera.position.set(
    bounds.width * 0.7,
    bounds.height + maxDimension * 0.5,
    bounds.length * 0.7
  )
  controls.target.set(bounds.width / 2, 0, bounds.length / 2)
  controls.update()
  clearSelection()
}

const toggleWireframe = () => {
  showWireframe.value = !showWireframe.value
  
  // Update all materials
  locationMeshes.forEach(({ mesh }) => {
    (mesh.material as THREE.MeshLambertMaterial).wireframe = showWireframe.value
  })
  zoneMeshes.forEach(({ mesh }) => {
    (mesh.material as THREE.MeshLambertMaterial).wireframe = showWireframe.value
  })
}

const setCameraMode = () => {
  const bounds = props.warehouseBounds || { width: 100, height: 50, length: 100 }
  
  switch (cameraMode.value) {
    case 'top':
      camera.position.set(bounds.width / 2, bounds.height + 50, bounds.length / 2)
      controls.target.set(bounds.width / 2, 0, bounds.length / 2)
      break
    case 'front':
      camera.position.set(bounds.width / 2, bounds.height / 2, bounds.length + 50)
      controls.target.set(bounds.width / 2, bounds.height / 2, bounds.length / 2)
      break
    case 'side':
      camera.position.set(bounds.width + 50, bounds.height / 2, bounds.length / 2)
      controls.target.set(bounds.width / 2, bounds.height / 2, bounds.length / 2)
      break
    default: // perspective
      resetCamera()
      return
  }
  
  controls.update()
}

const onWindowResize = () => {
  if (!sceneContainer.value) return
  
  camera.aspect = sceneContainer.value.clientWidth / sceneContainer.value.clientHeight
  camera.updateProjectionMatrix()
  renderer.setSize(sceneContainer.value.clientWidth, sceneContainer.value.clientHeight)
}

const animate = () => {
  requestAnimationFrame(animate)
  
  controls.update()
  
  // Rotate selection highlight
  if (selectedHighlight) {
    selectedHighlight.rotation.z += 0.02
  }
  
  renderer.render(scene, camera)
}

// Cleanup
const cleanup = () => {
  if (renderer && sceneContainer.value) {
    renderer.domElement.removeEventListener('click', onMouseClick)
    window.removeEventListener('resize', onWindowResize)
    sceneContainer.value.removeChild(renderer.domElement)
    renderer.dispose()
  }
  
  if (controls) {
    controls.dispose()
  }
}

// Watchers
watch(() => props.locations, () => {
  if (scene) {
    createLocations()
  }
}, { deep: true })

watch(() => props.zones, () => {
  if (scene) {
    createZones()
  }
}, { deep: true })

watch(() => props.searchQuery, (query) => {
  if (query && scene) {
    const foundLocation = props.locations.find(location => {
      const product = location.product
      return product && (
        product.name.toLowerCase().includes(query.toLowerCase()) ||
        product.sku.toLowerCase().includes(query.toLowerCase())
      )
    })
    
    if (foundLocation) {
      const locationMesh = locationMeshes.find(({ location }) => location.id === foundLocation.id)
      if (locationMesh) {
        selectLocation(foundLocation, locationMesh.mesh)
        focusOnLocation(foundLocation)
      }
    }
  }
})

onMounted(async () => {
  await nextTick()
  await initScene()
})

onUnmounted(() => {
  cleanup()
})
</script>

<style scoped>
.warehouse-3d-viewer {
  min-height: 500px;
}

canvas {
  outline: none;
}
</style>