<template>
  <div class="relative w-full h-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-xl overflow-hidden shadow-2xl">
    <!-- Animated Background Grid -->
    <div class="absolute inset-0 opacity-10">
      <svg class="w-full h-full">
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" stroke-width="1" class="text-blue-400"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="absolute inset-0 flex items-center justify-center bg-slate-900/95 backdrop-blur-md z-50">
      <div class="text-center">
        <div class="relative mb-8">
          <div class="w-20 h-20 border-4 border-blue-500/30 border-t-blue-400 rounded-full animate-spin mx-auto"></div>
          <div class="absolute inset-0 flex items-center justify-center">
            <div class="w-3 h-3 bg-blue-400 rounded-full animate-pulse"></div>
          </div>
        </div>
        <h3 class="text-xl font-bold text-white mb-2">Cargando Almacén</h3>
        <p class="text-blue-300 mb-4">Procesando vista 2D avanzada...</p>
        <div class="flex justify-center space-x-2">
          <div class="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style="animation-delay: 0s"></div>
          <div class="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style="animation-delay: 0.1s"></div>
          <div class="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style="animation-delay: 0.2s"></div>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else-if="!warehouseData" class="absolute inset-0 flex items-center justify-center">
      <div class="text-center max-w-lg px-8">
        <div class="relative mb-8">
          <div class="w-32 h-32 mx-auto bg-gradient-to-br from-blue-500/20 to-purple-600/20 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-white/10">
            <svg class="w-16 h-16 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <div class="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
            <svg class="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
            </svg>
          </div>
        </div>
        <h3 class="text-2xl font-bold text-white mb-3">Sin Almacén Seleccionado</h3>
        <p class="text-slate-400 text-lg leading-relaxed">Selecciona un almacén para acceder a la vista 2D profesional con visualización avanzada de zonas, pasillos y ubicaciones de productos.</p>
      </div>
    </div>

    <!-- Main Warehouse Visualization -->
    <div v-else class="relative w-full h-full">
      <!-- Professional Header -->
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
                  <span class="text-sm text-purple-400 font-medium">{{ warehouseData.aisles.length }} pasillos</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Advanced Controls -->
          <div class="flex items-center gap-4">
            <!-- Edit Mode -->
            <div class="flex items-center bg-slate-700/50 rounded-xl p-1 border border-slate-600/50">
              <Button
                size="sm"
                :variant="editMode ? 'default' : 'ghost'"
                :class="editMode ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/25' : 'text-slate-300 hover:text-white'"
                class="h-9 px-4 font-semibold transition-all duration-200"
                @click="toggleEditMode"
              >
                <Edit class="w-4 h-4 mr-2" />
                {{ editMode ? 'Modo Edición' : 'Editar' }}
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
                <Box class="w-4 h-4 mr-1" />Estante
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
                <Grid class="w-4 h-4 mr-1" />Cuadrícula
              </Button>
              <Button
                size="sm"
                :variant="showHeatmap ? 'default' : 'ghost'"
                :class="showHeatmap ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white' : 'text-slate-300 hover:text-white'"
                class="h-9 px-3 text-sm"
                @click="showHeatmap = !showHeatmap"
              >
                <TrendingUp class="w-4 h-4 mr-1" />Mapa de Calor
              </Button>
              <Button
                size="sm"
                :variant="showLabels ? 'default' : 'ghost'"
                :class="showLabels ? 'bg-slate-600 text-white' : 'text-slate-300 hover:text-white'"
                class="h-9 px-3 text-sm"
                @click="showLabels = !showLabels"
              >
                <Tag class="w-4 h-4 mr-1" />Etiquetas
              </Button>
            </div>

            <!-- Zoom Controls -->
            <div class="flex items-center bg-slate-700/50 rounded-xl border border-slate-600/50">
              <Button size="sm" variant="ghost" class="h-9 px-3 text-slate-300 hover:text-white" @click="zoomOut">
                <Minus class="w-4 h-4" />
              </Button>
              <div class="px-3 py-2 text-sm font-mono text-slate-300 border-x border-slate-600/50">
                {{ Math.round((1 / (viewBox.width / (bounds.width + 100))) * 100) }}%
              </div>
              <Button size="sm" variant="ghost" class="h-9 px-3 text-slate-300 hover:text-white" @click="zoomIn">
                <Plus class="w-4 h-4" />
              </Button>
              <Button size="sm" variant="ghost" class="h-9 px-3 text-slate-300 hover:text-white border-l border-slate-600/50" @click="resetView">
                <RotateCcw class="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <!-- SVG Visualization Container -->
      <div class="absolute inset-0 pt-24">
        <div
          ref="containerRef"
          class="relative w-full h-full overflow-hidden cursor-move"
          @mousedown="!editMode && startPan($event)"
          @mousemove="handlePan"
          @mouseup="endPan"
          @mouseleave="endPan"
          @wheel="handleWheel"
        >
          <svg
            ref="svgRef"
            class="w-full h-full"
            :class="{ 'cursor-crosshair': editMode && creationMode, 'cursor-move': !editMode }"
            :viewBox="`${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`"
            @mousedown="handleSvgMouseDown"
            @mousemove="handleSvgMouseMove"
            @mouseup="handleSvgMouseUp"
            @mouseleave="handleSvgMouseLeave"
            @contextmenu.prevent="handleContextMenu"
          >
            <!-- Advanced Definitions -->
            <defs>
              <!-- Professional Gradients -->
              <linearGradient id="warehouseFloor" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style="stop-color:#374151;stop-opacity:0.1" />
                <stop offset="50%" style="stop-color:#475569;stop-opacity:0.05" />
                <stop offset="100%" style="stop-color:#1f2937;stop-opacity:0.1" />
              </linearGradient>
              <linearGradient id="zoneGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style="stop-color:#10b981;stop-opacity:0.8" />
                <stop offset="100%" style="stop-color:#059669;stop-opacity:0.9" />
              </linearGradient>
              <linearGradient id="aisleGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style="stop-color:#3b82f6;stop-opacity:0.8" />
                <stop offset="100%" style="stop-color:#2563eb;stop-opacity:0.9" />
              </linearGradient>
              <linearGradient id="shelfGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style="stop-color:#8b5cf6;stop-opacity:0.8" />
                <stop offset="100%" style="stop-color:#7c3aed;stop-opacity:0.9" />
              </linearGradient>

              <!-- Professional Shadows -->
              <filter id="professionalShadow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur in="SourceAlpha" stdDeviation="3"/>
                <feOffset dx="2" dy="4" result="offset" />
                <feComponentTransfer result="shadow">
                  <feFuncA type="linear" slope="0.4"/>
                </feComponentTransfer>
                <feMerge>
                  <feMergeNode in="shadow"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>

              <!-- Glow Effects -->
              <filter id="glowEffect" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>

              <!-- Advanced Grid Pattern -->
              <pattern id="professionalGrid" width="50" height="50" patternUnits="userSpaceOnUse">
                <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#334155" stroke-width="0.5" opacity="0.3"/>
                <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#475569" stroke-width="0.2" opacity="0.6"/>
              </pattern>
            </defs>

            <!-- Professional Grid Background -->
            <rect v-if="showGrid" width="100%" height="100%" fill="url(#professionalGrid)" />

            <!-- Warehouse Boundary with Professional Styling -->
            <rect
              :x="warehouseMargin"
              :y="warehouseMargin"
              :width="bounds.width"
              :height="bounds.length"
              fill="url(#warehouseFloor)"
              stroke="#475569"
              stroke-width="3"
              stroke-dasharray="10,5"
              rx="8"
              ry="8"
              filter="url(#professionalShadow)"
              class="transition-all duration-300"
            />

            <!-- Warehouse Resize Handles (visible in edit mode) -->
            <g v-if="editMode" class="warehouse-resize-handles">
              <!-- Corner resize handles -->
              <circle
                :cx="warehouseMargin"
                :cy="warehouseMargin"
                r="10"
                fill="#10b981"
                stroke="#ffffff"
                stroke-width="3"
                class="warehouse-resize-handle cursor-nw-resize hover:scale-110 transition-transform"
                @mousedown.stop="startWarehouseResize($event, 'nw')"
              />
              <circle
                :cx="bounds.width + warehouseMargin"
                :cy="warehouseMargin"
                r="10"
                fill="#3b82f6"
                stroke="#ffffff"
                stroke-width="3"
                class="warehouse-resize-handle cursor-ne-resize hover:scale-110 transition-transform"
                @mousedown.stop="startWarehouseResize($event, 'ne')"
              />
              <circle
                :cx="warehouseMargin"
                :cy="bounds.length + warehouseMargin"
                r="10"
                fill="#f59e0b"
                stroke="#ffffff"
                stroke-width="3"
                class="warehouse-resize-handle cursor-sw-resize hover:scale-110 transition-transform"
                @mousedown.stop="startWarehouseResize($event, 'sw')"
              />
              <circle
                :cx="bounds.width + warehouseMargin"
                :cy="bounds.length + warehouseMargin"
                r="10"
                fill="#ef4444"
                stroke="#ffffff"
                stroke-width="3"
                class="warehouse-resize-handle cursor-se-resize hover:scale-110 transition-transform"
                @mousedown.stop="startWarehouseResize($event, 'se')"
              />

              <!-- Edge resize handles -->
              <rect
                :x="warehouseMargin + bounds.width / 2 - 8"
                :y="warehouseMargin - 8"
                width="16"
                height="16"
                fill="#8b5cf6"
                stroke="#ffffff"
                stroke-width="2"
                rx="3"
                class="warehouse-resize-handle cursor-n-resize hover:scale-110 transition-transform"
                @mousedown.stop="startWarehouseResize($event, 'n')"
              />
              <rect
                :x="bounds.width + warehouseMargin - 8"
                :y="warehouseMargin + bounds.length / 2 - 8"
                width="16"
                height="16"
                fill="#8b5cf6"
                stroke="#ffffff"
                stroke-width="2"
                rx="3"
                class="warehouse-resize-handle cursor-e-resize hover:scale-110 transition-transform"
                @mousedown.stop="startWarehouseResize($event, 'e')"
              />
              <rect
                :x="warehouseMargin + bounds.width / 2 - 8"
                :y="bounds.length + warehouseMargin - 8"
                width="16"
                height="16"
                fill="#8b5cf6"
                stroke="#ffffff"
                stroke-width="2"
                rx="3"
                class="warehouse-resize-handle cursor-s-resize hover:scale-110 transition-transform"
                @mousedown.stop="startWarehouseResize($event, 's')"
              />
              <rect
                :x="warehouseMargin - 8"
                :y="warehouseMargin + bounds.length / 2 - 8"
                width="16"
                height="16"
                fill="#8b5cf6"
                stroke="#ffffff"
                stroke-width="2"
                rx="3"
                class="warehouse-resize-handle cursor-w-resize hover:scale-110 transition-transform"
                @mousedown.stop="startWarehouseResize($event, 'w')"
              />
            </g>

            <!-- Corner Indicators (visible when not in edit mode) -->
            <g v-else class="corner-indicators">
              <circle :cx="warehouseMargin" :cy="warehouseMargin" r="6" fill="#10b981" class="animate-pulse" />
              <circle :cx="bounds.width + warehouseMargin" :cy="warehouseMargin" r="6" fill="#3b82f6" class="animate-pulse" />
              <circle :cx="warehouseMargin" :cy="bounds.length + warehouseMargin" r="6" fill="#f59e0b" class="animate-pulse" />
              <circle :cx="bounds.width + warehouseMargin" :cy="bounds.length + warehouseMargin" r="6" fill="#ef4444" class="animate-pulse" />
            </g>

            <!-- Professional Zones -->
            <g class="zones-layer">
              <g
                v-for="zone in warehouseData.zones"
                :key="`zone-${zone.id}`"
                class="zone-group transition-all duration-300 hover:brightness-110"
                @click="selectZone(zone)"
                @mouseenter="hoveredZone = zone.id"
                @mouseleave="hoveredZone = null"
                @mousedown="editMode && startZoneDrag($event, zone)"
              >
                <!-- Zone Background with Gradient -->
                <rect
                  :x="getZoneX(zone)"
                  :y="getZoneY(zone)"
                  :width="getZoneWidth(zone)"
                  :height="getZoneHeight(zone)"
                  fill="url(#zoneGradient)"
                  :stroke="selectedZone === zone.id ? '#10b981' : '#059669'"
                  :stroke-width="selectedZone === zone.id ? 4 : 2"
                  :opacity="hoveredZone === zone.id ? 0.9 : 0.7"
                  rx="12"
                  ry="12"
                  filter="url(#professionalShadow)"
                  class="transition-all duration-300 cursor-pointer"
                />

                <!-- Zone Header Bar -->
                <rect
                  :x="getZoneX(zone)"
                  :y="getZoneY(zone)"
                  :width="getZoneWidth(zone)"
                  height="40"
                  fill="#059669"
                  rx="12"
                  ry="12"
                  class="zone-header"
                />
                <rect
                  :x="getZoneX(zone)"
                  :y="getZoneY(zone) + 40"
                  :width="getZoneWidth(zone)"
                  height="8"
                  fill="#047857"
                  class="zone-header-shadow"
                />

                <!-- Zone Title -->
                <text
                  :x="getZoneX(zone) + 20"
                  :y="getZoneY(zone) + 28"
                  class="text-sm font-bold fill-white pointer-events-none"
                  text-anchor="start"
                  dominant-baseline="middle"
                >
                  {{ zone.name || zone.code }}
                </text>

                <!-- Zone Statistics -->
                <g v-if="showLabels">
                  <rect
                    :x="getZoneX(zone) + getZoneWidth(zone) - 120"
                    :y="getZoneY(zone) + 60"
                    width="100"
                    height="50"
                    fill="rgba(0,0,0,0.7)"
                    rx="8"
                    class="zone-stats-bg"
                  />
                  <text
                    :x="getZoneX(zone) + getZoneWidth(zone) - 70"
                    :y="getZoneY(zone) + 80"
                    class="text-xs font-semibold fill-emerald-400 pointer-events-none"
                    text-anchor="middle"
                  >
                    {{ getZoneProductCount(zone) }} productos
                  </text>
                  <text
                    :x="getZoneX(zone) + getZoneWidth(zone) - 70"
                    :y="getZoneY(zone) + 95"
                    class="text-xs fill-slate-300 pointer-events-none"
                    text-anchor="middle"
                  >
                    {{ Math.round(getZoneWidth(zone)) }}m × {{ Math.round(getZoneHeight(zone)) }}m
                  </text>
                </g>

                <!-- Zone Utilization Bar -->
                <g class="utilization-bar">
                  <rect
                    :x="getZoneX(zone) + 20"
                    :y="getZoneY(zone) + getZoneHeight(zone) - 25"
                    :width="getZoneWidth(zone) - 40"
                    height="8"
                    fill="rgba(0,0,0,0.3)"
                    rx="4"
                  />
                  <rect
                    :x="getZoneX(zone) + 20"
                    :y="getZoneY(zone) + getZoneHeight(zone) - 25"
                    :width="(getZoneWidth(zone) - 40) * (getZoneProductCount(zone) / 50)"
                    height="8"
                    fill="#10b981"
                    rx="4"
                    class="animate-pulse"
                  />
                </g>

                <!-- Resize Handles (visible in edit mode) -->
                <g v-if="editMode && selectedZone === zone.id" class="resize-handles">
                  <!-- Corner handles -->
                  <circle
                    :cx="getZoneX(zone)"
                    :cy="getZoneY(zone)"
                    r="8"
                    fill="#10b981"
                    stroke="#ffffff"
                    stroke-width="2"
                    class="resize-handle cursor-nw-resize hover:scale-110 transition-transform"
                    @mousedown.stop="startZoneResize($event, zone, 'nw')"
                  />
                  <circle
                    :cx="getZoneX(zone) + getZoneWidth(zone)"
                    :cy="getZoneY(zone)"
                    r="8"
                    fill="#10b981"
                    stroke="#ffffff"
                    stroke-width="2"
                    class="resize-handle cursor-ne-resize hover:scale-110 transition-transform"
                    @mousedown.stop="startZoneResize($event, zone, 'ne')"
                  />
                  <circle
                    :cx="getZoneX(zone)"
                    :cy="getZoneY(zone) + getZoneHeight(zone)"
                    r="8"
                    fill="#10b981"
                    stroke="#ffffff"
                    stroke-width="2"
                    class="resize-handle cursor-sw-resize hover:scale-110 transition-transform"
                    @mousedown.stop="startZoneResize($event, zone, 'sw')"
                  />
                  <circle
                    :cx="getZoneX(zone) + getZoneWidth(zone)"
                    :cy="getZoneY(zone) + getZoneHeight(zone)"
                    r="8"
                    fill="#10b981"
                    stroke="#ffffff"
                    stroke-width="2"
                    class="resize-handle cursor-se-resize hover:scale-110 transition-transform"
                    @mousedown.stop="startZoneResize($event, zone, 'se')"
                  />

                  <!-- Edge handles -->
                  <rect
                    :x="getZoneX(zone) + getZoneWidth(zone) / 2 - 6"
                    :y="getZoneY(zone) - 6"
                    width="12"
                    height="12"
                    fill="#3b82f6"
                    stroke="#ffffff"
                    stroke-width="2"
                    rx="2"
                    class="resize-handle cursor-n-resize hover:scale-110 transition-transform"
                    @mousedown.stop="startZoneResize($event, zone, 'n')"
                  />
                  <rect
                    :x="getZoneX(zone) + getZoneWidth(zone) - 6"
                    :y="getZoneY(zone) + getZoneHeight(zone) / 2 - 6"
                    width="12"
                    height="12"
                    fill="#3b82f6"
                    stroke="#ffffff"
                    stroke-width="2"
                    rx="2"
                    class="resize-handle cursor-e-resize hover:scale-110 transition-transform"
                    @mousedown.stop="startZoneResize($event, zone, 'e')"
                  />
                  <rect
                    :x="getZoneX(zone) + getZoneWidth(zone) / 2 - 6"
                    :y="getZoneY(zone) + getZoneHeight(zone) - 6"
                    width="12"
                    height="12"
                    fill="#3b82f6"
                    stroke="#ffffff"
                    stroke-width="2"
                    rx="2"
                    class="resize-handle cursor-s-resize hover:scale-110 transition-transform"
                    @mousedown.stop="startZoneResize($event, zone, 's')"
                  />
                  <rect
                    :x="getZoneX(zone) - 6"
                    :y="getZoneY(zone) + getZoneHeight(zone) / 2 - 6"
                    width="12"
                    height="12"
                    fill="#3b82f6"
                    stroke="#ffffff"
                    stroke-width="2"
                    rx="2"
                    class="resize-handle cursor-w-resize hover:scale-110 transition-transform"
                    @mousedown.stop="startZoneResize($event, zone, 'w')"
                  />
                </g>
              </g>
            </g>

            <!-- Professional Aisles -->
            <g class="aisles-layer">
              <g
                v-for="aisle in warehouseData.aisles"
                :key="`aisle-${aisle.id}`"
                class="aisle-group transition-all duration-300"
                :class="{
                  'cursor-move': editMode,
                  'opacity-50 scale-105': isDraggingAisle && draggedAisle?.id === aisle.id
                }"
                @click="selectAisle(aisle)"
                @mousedown="editMode ? startAisleDrag($event, aisle) : null"
                @mouseenter="hoveredAisle = aisle.id"
                @mouseleave="hoveredAisle = null"
              >
                <!-- Aisle Background -->
                <rect
                  :x="getAisleX(aisle)"
                  :y="getAisleY(aisle)"
                  :width="getAisleWidth(aisle)"
                  :height="getAisleLength(aisle)"
                  fill="url(#aisleGradient)"
                  :stroke="selectedAisle === aisle.id ? '#3b82f6' : '#2563eb'"
                  :stroke-width="selectedAisle === aisle.id ? 3 : 2"
                  :opacity="hoveredAisle === aisle.id ? 0.9 : 0.8"
                  rx="8"
                  ry="8"
                  filter="url(#professionalShadow)"
                  class="cursor-pointer transition-all duration-300"
                />

                <!-- Aisle Center Line with Animation -->
                <line
                  :x1="getAisleX(aisle) + getAisleWidth(aisle) / 2"
                  :y1="getAisleY(aisle)"
                  :x2="getAisleX(aisle) + getAisleWidth(aisle) / 2"
                  :y2="getAisleY(aisle) + getAisleLength(aisle)"
                  stroke="#1e40af"
                  stroke-width="2"
                  stroke-dasharray="8,4"
                  opacity="0.8"
                  class="animate-pulse"
                />

                <!-- Aisle Direction Arrows -->
                <g class="direction-arrows">
                  <polygon
                    :points="`${getAisleX(aisle) + getAisleWidth(aisle) / 2},${getAisleY(aisle) + 15} ${getAisleX(aisle) + getAisleWidth(aisle) / 2 - 6},${getAisleY(aisle) + 30} ${getAisleX(aisle) + getAisleWidth(aisle) / 2 + 6},${getAisleY(aisle) + 30}`"
                    fill="#1e40af"
                    opacity="0.9"
                    class="animate-bounce"
                  />
                </g>

                <!-- Aisle Label -->
                <g v-if="showLabels">
                  <rect
                    :x="getAisleX(aisle) - 2"
                    :y="getAisleY(aisle) + getAisleLength(aisle) / 2 - 15"
                    :width="getAisleWidth(aisle) + 4"
                    height="30"
                    fill="rgba(59, 130, 246, 0.95)"
                    stroke="white"
                    stroke-width="2"
                    rx="15"
                    ry="15"
                    filter="url(#glowEffect)"
                  />
                  <text
                    :x="getAisleX(aisle) + getAisleWidth(aisle) / 2"
                    :y="getAisleY(aisle) + getAisleLength(aisle) / 2"
                    text-anchor="middle"
                    dominant-baseline="middle"
                    class="text-sm font-bold fill-white pointer-events-none"
                  >
                    {{ aisle.code }}
                  </text>
                </g>
              </g>
            </g>

            <!-- Professional Shelves -->
            <g class="shelves-layer">
              <g
                v-for="shelf in warehouseData.shelves"
                :key="`shelf-${shelf.id}`"
                class="shelf-group transition-all duration-300"
                :class="{
                  'cursor-move': editMode,
                  'opacity-50 scale-105': isDraggingShelf && draggedShelf?.id === shelf.id
                }"
                @click="selectShelf(shelf)"
                @mousedown="editMode ? startShelfDrag($event, shelf) : null"
                @mouseenter="hoveredShelf = shelf.id"
                @mouseleave="hoveredShelf = null"
              >
                <!-- Shelf Base with 3D Effect -->
                <rect
                  :x="getShelfX(shelf)"
                  :y="getShelfY(shelf)"
                  :width="getShelfWidth(shelf)"
                  :height="getShelfDepth(shelf)"
                  fill="url(#shelfGradient)"
                  :stroke="selectedShelf === shelf.id ? '#8b5cf6' : '#7c3aed'"
                  :stroke-width="selectedShelf === shelf.id ? 3 : 2"
                  :opacity="hoveredShelf === shelf.id ? 0.9 : 0.8"
                  rx="4"
                  ry="4"
                  filter="url(#professionalShadow)"
                  class="cursor-pointer transition-all duration-300"
                />

                <!-- Shelf Levels Indicator -->
                <g v-for="level in Math.min(shelf.levels || 3, 5)" :key="level" class="shelf-level">
                  <line
                    :x1="getShelfX(shelf) + 2"
                    :y1="getShelfY(shelf) + (level * getShelfDepth(shelf) / (shelf.levels || 3))"
                    :x2="getShelfX(shelf) + getShelfWidth(shelf) - 2"
                    :y2="getShelfY(shelf) + (level * getShelfDepth(shelf) / (shelf.levels || 3))"
                    stroke="#5b21b6"
                    stroke-width="1"
                    opacity="0.6"
                  />
                </g>

                <!-- Shelf Label -->
                <text
                  v-if="showLabels && getShelfWidth(shelf) > 20"
                  :x="getShelfX(shelf) + getShelfWidth(shelf) / 2"
                  :y="getShelfY(shelf) + getShelfDepth(shelf) / 2"
                  text-anchor="middle"
                  dominant-baseline="middle"
                  class="text-xs font-bold fill-white pointer-events-none"
                >
                  {{ shelf.code }}
                </text>
              </g>
            </g>

            <!-- Professional Products/Locations -->
            <g class="locations-layer">
              <g
                v-for="location in filteredLocations"
                :key="`location-${location.id}`"
                class="location-group transition-all duration-300"
                @click="selectLocation(location)"
                @mouseenter="hoveredLocation = location.id"
                @mouseleave="hoveredLocation = null"
                @mousedown="editMode && startDrag($event, location)"
              >
                <!-- Product Location Circle with Professional Styling -->
                <circle
                  :cx="getLocationX(location)"
                  :cy="getLocationY(location)"
                  :r="getLocationRadius(location)"
                  :fill="showHeatmap ? getStockHeatmapColor(location) : getLocationColor(location)"
                  :stroke="selectedLocation?.id === location.id ? '#fbbf24' : 'white'"
                  :stroke-width="selectedLocation?.id === location.id ? 3 : 2"
                  :opacity="hoveredLocation === location.id ? 1 : 0.9"
                  filter="url(#glowEffect)"
                  :class="editMode ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'"
                  class="transition-all duration-300"
                />

                <!-- Stock Level Ring -->
                <circle
                  :cx="getLocationX(location)"
                  :cy="getLocationY(location)"
                  :r="getLocationRadius(location) + 3"
                  fill="none"
                  :stroke="getStockLevelRingColor(location)"
                  stroke-width="2"
                  opacity="0.8"
                  stroke-dasharray="5,3"
                  class="animate-pulse"
                />

                <!-- Product Info on Hover -->
                <g v-if="hoveredLocation === location.id" class="location-tooltip">
                  <rect
                    :x="getLocationX(location) + 15"
                    :y="getLocationY(location) - 25"
                    width="120"
                    height="50"
                    fill="rgba(0,0,0,0.9)"
                    stroke="#374151"
                    stroke-width="1"
                    rx="8"
                    ry="8"
                    filter="url(#professionalShadow)"
                  />
                  <text
                    :x="getLocationX(location) + 75"
                    :y="getLocationY(location) - 10"
                    text-anchor="middle"
                    class="text-xs font-bold fill-white pointer-events-none"
                  >
                    {{ location.product_name?.substring(0, 15) || 'Sin nombre' }}
                  </text>
                  <text
                    :x="getLocationX(location) + 75"
                    :y="getLocationY(location) + 5"
                    text-anchor="middle"
                    class="text-xs fill-blue-400 pointer-events-none"
                  >
                    Stock: {{ location.stock_actual || 0 }}/{{ location.capacity_max || 0 }}
                  </text>
                </g>
              </g>
            </g>

            <!-- Drag Ghost -->
            <circle
              v-if="isDragging && draggedLocation"
              :cx="ghostPosition.x"
              :cy="ghostPosition.y"
              :r="getLocationRadius(draggedLocation) + 2"
              :fill="getLocationColor(draggedLocation)"
              stroke="#fbbf24"
              stroke-width="3"
              opacity="0.7"
              stroke-dasharray="5,5"
              filter="url(#glowEffect)"
              class="pointer-events-none animate-pulse"
            />

            <!-- Creation Preview -->
            <g v-if="creationPreview" class="creation-preview">
              <rect
                :x="creationPreview.x"
                :y="creationPreview.y"
                :width="creationPreview.width"
                :height="creationPreview.height"
                :fill="getCreationColor(creationPreview.type)"
                :stroke="getCreationColor(creationPreview.type)"
                stroke-width="3"
                stroke-dasharray="10,5"
                fill-opacity="0.3"
                rx="8"
                ry="8"
                class="animate-pulse pointer-events-none"
              />

              <!-- Creation Label -->
              <text
                :x="creationPreview.x + creationPreview.width / 2"
                :y="creationPreview.y + creationPreview.height / 2 - 10"
                text-anchor="middle"
                dominant-baseline="middle"
                class="text-base font-bold pointer-events-none"
                :fill="getCreationColor(creationPreview.type)"
              >
                {{ getCreationLabel(creationPreview.type) }}
              </text>

              <!-- Dimensions -->
              <text
                :x="creationPreview.x + creationPreview.width / 2"
                :y="creationPreview.y + creationPreview.height / 2 + 10"
                text-anchor="middle"
                dominant-baseline="middle"
                class="text-sm font-medium pointer-events-none"
                :fill="getCreationColor(creationPreview.type)"
              >
                {{ Math.round(creationPreview.width) }}m × {{ Math.round(creationPreview.height) }}m
              </text>
            </g>
          </svg>
        </div>
      </div>

      <!-- Professional Context Menu -->
      <Transition
        enter-active-class="transition duration-200 ease-out"
        enter-from-class="opacity-0 scale-95 translate-y-2"
        enter-to-class="opacity-100 scale-100 translate-y-0"
        leave-active-class="transition duration-150 ease-in"
        leave-from-class="opacity-100 scale-100 translate-y-0"
        leave-to-class="opacity-0 scale-95 translate-y-2"
      >
        <div
          v-if="contextMenu.show"
          :style="{ left: `${contextMenu.x}px`, top: `${contextMenu.y}px` }"
          class="absolute z-50 bg-slate-800/95 backdrop-blur-xl rounded-xl shadow-2xl border border-slate-600/50 py-3 min-w-56"
          @click.stop
        >
          <!-- Canvas Context Menu -->
          <div v-if="contextMenu.type === 'canvas'" class="space-y-2">
            <div class="px-4 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-700/50">
              Crear Elemento
            </div>
            <button
              @click="startCreation('zone', contextMenu.x, contextMenu.y)"
              class="w-full flex items-center gap-3 px-4 py-3 text-sm text-white hover:bg-emerald-500/20 transition-colors group"
            >
              <Square class="w-5 h-5 text-emerald-400 group-hover:text-emerald-300" />
              <span class="font-medium">Nueva Zona</span>
            </button>
            <button
              @click="startCreation('aisle', contextMenu.x, contextMenu.y)"
              class="w-full flex items-center gap-3 px-4 py-3 text-sm text-white hover:bg-blue-500/20 transition-colors group"
            >
              <Minus class="w-5 h-5 text-blue-400 group-hover:text-blue-300" />
              <span class="font-medium">Nuevo Pasillo</span>
            </button>
            <button
              @click="startCreation('shelf', contextMenu.x, contextMenu.y)"
              class="w-full flex items-center gap-3 px-4 py-3 text-sm text-white hover:bg-purple-500/20 transition-colors group"
            >
              <Box class="w-5 h-5 text-purple-400 group-hover:text-purple-300" />
              <span class="font-medium">Nuevo Estante</span>
            </button>
          </div>

          <!-- Element Context Menu -->
          <div v-else class="space-y-2">
            <div class="px-4 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-700/50">
              Acciones
            </div>
            <button
              @click="editElement(contextMenu.target)"
              class="w-full flex items-center gap-3 px-4 py-3 text-sm text-white hover:bg-slate-600/50 transition-colors group"
            >
              <Edit class="w-5 h-5 text-blue-400 group-hover:text-blue-300" />
              <span class="font-medium">Editar</span>
            </button>
            <button
              @click="duplicateElement(contextMenu.target)"
              class="w-full flex items-center gap-3 px-4 py-3 text-sm text-white hover:bg-slate-600/50 transition-colors group"
            >
              <Copy class="w-5 h-5 text-emerald-400 group-hover:text-emerald-300" />
              <span class="font-medium">Duplicar</span>
            </button>
            <div class="border-t border-slate-700/50 my-2"></div>
            <button
              @click="deleteElement(contextMenu.target)"
              class="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-300 hover:bg-red-500/20 transition-colors group"
            >
              <Trash2 class="w-5 h-5 group-hover:text-red-200" />
              <span class="font-medium">Eliminar</span>
            </button>
          </div>
        </div>
      </Transition>

      <!-- Professional Status Bar -->
      <div class="absolute bottom-0 left-0 right-0 bg-slate-800/95 backdrop-blur-xl border-t border-slate-700/50 px-8 py-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-6 text-sm">
            <div class="flex items-center gap-2">
              <div class="w-3 h-3 bg-emerald-400 rounded-full"></div>
              <span class="text-slate-300">Zonas: <span class="font-semibold text-white">{{ warehouseData.zones.length }}</span></span>
            </div>
            <div class="flex items-center gap-2">
              <div class="w-3 h-3 bg-blue-400 rounded-full"></div>
              <span class="text-slate-300">Pasillos: <span class="font-semibold text-white">{{ warehouseData.aisles.length }}</span></span>
            </div>
            <div class="flex items-center gap-2">
              <div class="w-3 h-3 bg-purple-400 rounded-full"></div>
              <span class="text-slate-300">Estantes: <span class="font-semibold text-white">{{ warehouseData.shelves.length }}</span></span>
            </div>
            <div class="flex items-center gap-2">
              <div class="w-3 h-3 bg-yellow-400 rounded-full animate-pulse"></div>
              <span class="text-slate-300">Productos: <span class="font-semibold text-white">{{ filteredLocations.length }}</span></span>
            </div>
          </div>
          <div class="text-sm text-slate-400">
            Dimensiones: {{ bounds.width }}m × {{ bounds.length }}m
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'
import {
  Tag, RotateCcw, X, Grid, Plus, Minus, TrendingUp, Edit, Square, Box, Move, Trash2, Copy
} from 'lucide-vue-next'
import Button from '@/components/ui/Button.vue'
import { useWarehouseManager } from '@/composables/useWarehouseManager'
import type {
  WarehouseVisualizerData,
  WarehouseZone,
  WarehouseAisle,
  WarehouseShelf,
  ProductLocationDetailed,
  Warehouse
} from '@/composables/useWarehouseVisualizer'

interface Props {
  warehouseData: WarehouseVisualizerData | null
  filteredLocations: ProductLocationDetailed[]
  loading?: boolean
}

const props = defineProps<Props>()

// Define emits
const emit = defineEmits<{
  'zone-updated': [zone: WarehouseZone]
  'warehouse-updated': [warehouse: Warehouse]
}>()

// Initialize warehouse manager composable
const { createZone, createAisle, createShelf } = useWarehouseManager()

// UI State
const showLabels = ref(true)
const showGrid = ref(true)
const showHeatmap = ref(false)
const editMode = ref(false)
const creationMode = ref<'zone' | 'aisle' | 'shelf' | null>(null)

// Selection State
const selectedZone = ref<string | null>(null)
const selectedAisle = ref<string | null>(null)
const selectedShelf = ref<string | null>(null)
const selectedLocation = ref<ProductLocationDetailed | null>(null)

// Drag & Drop State
const isDragging = ref(false)
const draggedLocation = ref<ProductLocationDetailed | null>(null)
const dragOffset = ref({ x: 0, y: 0 })
const ghostPosition = ref({ x: 0, y: 0 })

// Element Creation State
const isCreating = ref(false)
const creationStart = ref<{ x: number, y: number } | null>(null)
const creationEnd = ref<{ x: number, y: number } | null>(null)
const creationPreview = ref<{
  type: 'zone' | 'aisle' | 'shelf'
  x: number
  y: number
  width: number
  height: number
} | null>(null)

// Zone Manipulation State
const isDraggingZone = ref(false)
const isResizingZone = ref(false)
const draggedZone = ref<WarehouseZone | null>(null)
const resizedZone = ref<WarehouseZone | null>(null)
const resizeHandle = ref<string | null>(null) // 'nw', 'ne', 'sw', 'se', 'n', 's', 'e', 'w'
const dragStartPos = ref({ x: 0, y: 0 })
const resizeStartBounds = ref({ x: 0, y: 0, width: 0, height: 0 })
const resizeStart = ref<{ x: number, y: number } | null>(null)
const resizeOriginal = ref<{ x: number, y: number, width: number, height: number } | null>(null)

// Aisle Manipulation State
const isDraggingAisle = ref(false)
const draggedAisle = ref<WarehouseAisle | null>(null)
const aisleDragOffset = ref<{ x: number, y: number } | null>(null)

// Shelf Manipulation State
const isDraggingShelf = ref(false)
const draggedShelf = ref<WarehouseShelf | null>(null)
const shelfDragOffset = ref<{ x: number, y: number } | null>(null)

// Warehouse Editing State
const isEditingWarehouse = ref(false)
const warehouseDragHandle = ref<string | null>(null)
const isResizingWarehouse = ref(false)
const warehouseResizeHandle = ref<string | null>(null)
const warehouseResizeStart = ref<{ x: number, y: number } | null>(null)
const warehouseOriginalSize = ref<{ width: number, length: number } | null>(null)

// Context Menu State
const contextMenu = ref({
  show: false,
  x: 0,
  y: 0,
  type: null as 'canvas' | 'zone' | 'aisle' | 'shelf' | 'location' | null,
  target: null as any
})

// Hover State
const hoveredZone = ref<string | null>(null)
const hoveredAisle = ref<string | null>(null)
const hoveredShelf = ref<string | null>(null)
const hoveredLocation = ref<string | null>(null)

// Pan & Zoom State
const svgRef = ref<SVGElement>()
const containerRef = ref<HTMLElement>()
const isPanning = ref(false)
const lastPanPoint = ref({ x: 0, y: 0 })
const viewBox = ref({
  x: 0,
  y: 0,
  width: 1200,
  height: 900
})

// Constants
const warehouseMargin = 80
const zoomFactor = 0.15
const minZoom = 0.2
const maxZoom = 8

// Computed Properties
const bounds = computed(() => {
  if (!props.warehouseData) {
    return { width: 1200, height: 80, length: 900 }
  }

  const warehouse = props.warehouseData.warehouse
  return {
    width: Math.max(warehouse.width || 1200, 600),
    height: warehouse.height || 80,
    length: Math.max(warehouse.length || 900, 500)
  }
})

// Zone Helper Functions
const getZoneX = (zone: WarehouseZone) => (zone.x_coordinate || 0) + warehouseMargin
const getZoneY = (zone: WarehouseZone) => (zone.y_coordinate || 0) + warehouseMargin
const getZoneWidth = (zone: WarehouseZone) => Math.max(30, zone.width || 200)
const getZoneHeight = (zone: WarehouseZone) => Math.max(30, zone.length || 150)

const getZoneColor = (zone: WarehouseZone) => {
  return zone.color_hex || '#10b981'
}

const getZoneProductCount = (zone: WarehouseZone) => {
  return props.filteredLocations.filter(loc => loc.warehouse_zone_id === zone.id).length
}

// Aisle Helper Functions
const getAisleX = (aisle: WarehouseAisle) => (aisle.start_x || 0) + warehouseMargin
const getAisleY = (aisle: WarehouseAisle) => (aisle.start_y || 0) + warehouseMargin
const getAisleWidth = (aisle: WarehouseAisle) => Math.max(10, aisle.width || 30)
const getAisleLength = (aisle: WarehouseAisle) => Math.max(20, Math.abs((aisle.end_y || 20) - (aisle.start_y || 0)))

// Shelf Helper Functions
const getShelfX = (shelf: WarehouseShelf) => (shelf.position_x || 0) + warehouseMargin
const getShelfY = (shelf: WarehouseShelf) => (shelf.position_y || 0) + warehouseMargin
const getShelfWidth = (shelf: WarehouseShelf) => Math.max(5, shelf.width || 15)
const getShelfDepth = (shelf: WarehouseShelf) => Math.max(5, shelf.depth || 8)

// Location Helper Functions
const getLocationX = (location: ProductLocationDetailed) => (location.final_x || location.position_x || 0) + warehouseMargin
const getLocationY = (location: ProductLocationDetailed) => (location.final_y || location.position_y || 0) + warehouseMargin

const getLocationRadius = (location: ProductLocationDetailed) => {
  const stock = location.stock_actual || 0
  const capacity = location.capacity_max || 1
  const fillPercentage = capacity > 0 ? stock / capacity : 0
  return Math.max(6, Math.min(16, 6 + fillPercentage * 10))
}

const getLocationColor = (location: ProductLocationDetailed) => {
  const capacity = location.capacity_max || 1
  const stock = location.stock_actual || 0
  const percentage = capacity > 0 ? (stock / capacity) * 100 : 0

  if (percentage === 0) return '#64748b' // Empty - gray
  if (percentage >= 75) return '#10b981' // High - emerald
  if (percentage >= 25) return '#f59e0b' // Medium - amber
  return '#ef4444' // Low - red
}

const getStockHeatmapColor = (location: ProductLocationDetailed) => {
  const percentage = getStockPercentage(location)

  if (percentage >= 90) return '#dc2626'      // Very high - red
  if (percentage >= 75) return '#ea580c'      // High - orange
  if (percentage >= 50) return '#ca8a04'      // Medium-high - yellow
  if (percentage >= 25) return '#65a30d'      // Medium - lime
  if (percentage > 0) return '#059669'        // Low - emerald
  return '#475569'                            // Empty - slate
}

const getStockPercentage = (location: ProductLocationDetailed) => {
  const capacity = location.capacity_max || 1
  const stock = location.stock_actual || 0
  return capacity > 0 ? Math.min((stock / capacity) * 100, 100) : 0
}

const getStockLevelRingColor = (location: ProductLocationDetailed) => {
  const percentage = getStockPercentage(location)
  if (percentage >= 75) return '#10b981'
  if (percentage >= 50) return '#f59e0b'
  if (percentage >= 25) return '#ef4444'
  return '#64748b'
}

// Event Handlers
const selectZone = (zone: WarehouseZone) => {
  // Don't select if we're in the middle of resizing
  if (isResizingZone.value) return

  selectedZone.value = selectedZone.value === zone.id ? null : zone.id
  selectedAisle.value = null
  selectedShelf.value = null
  selectedLocation.value = null
}

const selectAisle = (aisle: WarehouseAisle) => {
  selectedAisle.value = selectedAisle.value === aisle.id ? null : aisle.id
  selectedZone.value = null
  selectedShelf.value = null
  selectedLocation.value = null
}

const selectShelf = (shelf: WarehouseShelf) => {
  selectedShelf.value = selectedShelf.value === shelf.id ? null : shelf.id
  selectedZone.value = null
  selectedAisle.value = null
  selectedLocation.value = null
}

const selectLocation = (location: ProductLocationDetailed) => {
  selectedLocation.value = selectedLocation.value?.id === location.id ? null : location
  selectedZone.value = null
  selectedAisle.value = null
  selectedShelf.value = null
}

// Pan & Zoom Functions
const startPan = (event: MouseEvent) => {
  isPanning.value = true
  lastPanPoint.value = { x: event.clientX, y: event.clientY }
}

const handlePan = (event: MouseEvent) => {
  if (!isPanning.value) return

  const deltaX = event.clientX - lastPanPoint.value.x
  const deltaY = event.clientY - lastPanPoint.value.y

  viewBox.value.x -= deltaX
  viewBox.value.y -= deltaY

  lastPanPoint.value = { x: event.clientX, y: event.clientY }
}

const endPan = () => {
  isPanning.value = false
}

const handleWheel = (event: WheelEvent) => {
  event.preventDefault()

  const zoomDirection = event.deltaY > 0 ? 1 : -1
  const zoomAmount = zoomDirection * zoomFactor

  // Calculate new dimensions maintaining aspect ratio
  const baseWidth = bounds.value.width + warehouseMargin * 2
  const baseHeight = bounds.value.length + warehouseMargin * 2

  // Calculate zoom constraints based on base dimensions
  const minWidth = minZoom * baseWidth
  const maxWidth = maxZoom * baseWidth
  const minHeight = minZoom * baseHeight
  const maxHeight = maxZoom * baseHeight

  const newWidth = Math.max(minWidth, Math.min(maxWidth, viewBox.value.width * (1 + zoomAmount)))
  const newHeight = Math.max(minHeight, Math.min(maxHeight, viewBox.value.height * (1 + zoomAmount)))

  // Get mouse position relative to the SVG
  const svgRect = svgRef.value?.getBoundingClientRect()
  if (svgRect) {
    const mouseX = event.clientX - svgRect.left
    const mouseY = event.clientY - svgRect.top

    // Convert mouse position to SVG coordinates
    const svgMouseX = viewBox.value.x + (mouseX / svgRect.width) * viewBox.value.width
    const svgMouseY = viewBox.value.y + (mouseY / svgRect.height) * viewBox.value.height

    // Calculate new viewBox position to zoom towards mouse
    const scaleX = newWidth / viewBox.value.width
    const scaleY = newHeight / viewBox.value.height

    viewBox.value = {
      x: svgMouseX - (svgMouseX - viewBox.value.x) * scaleX,
      y: svgMouseY - (svgMouseY - viewBox.value.y) * scaleY,
      width: newWidth,
      height: newHeight
    }
  } else {
    // Fallback: zoom towards center
    const centerX = viewBox.value.x + viewBox.value.width / 2
    const centerY = viewBox.value.y + viewBox.value.height / 2

    viewBox.value = {
      x: centerX - newWidth / 2,
      y: centerY - newHeight / 2,
      width: newWidth,
      height: newHeight
    }
  }
}

const zoomIn = () => {
  handleWheel({ deltaY: -100 } as WheelEvent)
}

const zoomOut = () => {
  handleWheel({ deltaY: 100 } as WheelEvent)
}

const resetView = () => {
  const baseWidth = bounds.value.width + warehouseMargin * 2
  const baseHeight = bounds.value.length + warehouseMargin * 2

  viewBox.value = {
    x: 0,
    y: 0,
    width: baseWidth,
    height: baseHeight
  }

  selectedZone.value = null
  selectedAisle.value = null
  selectedShelf.value = null
  selectedLocation.value = null

  showLabels.value = true
  showGrid.value = true
  showHeatmap.value = false
}

// Edit Mode Functions
const toggleEditMode = () => {
  editMode.value = !editMode.value
  if (!editMode.value) {
    creationMode.value = null
    isDragging.value = false
    draggedLocation.value = null
    contextMenu.value.show = false
  }
}

const setCreationMode = (mode: 'zone' | 'aisle' | 'shelf') => {
  creationMode.value = creationMode.value === mode ? null : mode
  // Reset any ongoing creation
  isCreating.value = false
  creationStart.value = null
  creationEnd.value = null
  creationPreview.value = null
}

// Drag and Drop Functions
const startDrag = (event: MouseEvent, location: ProductLocationDetailed) => {
  if (!editMode.value) return

  event.preventDefault()
  event.stopPropagation()

  isDragging.value = true
  draggedLocation.value = location

  const svgRect = svgRef.value?.getBoundingClientRect()
  if (svgRect) {
    const svgPoint = screenToSVGPoint(event.clientX, event.clientY)
    dragOffset.value = {
      x: svgPoint.x - getLocationX(location),
      y: svgPoint.y - getLocationY(location)
    }
    ghostPosition.value = { x: svgPoint.x, y: svgPoint.y }
  }
}

const handleGlobalMouseMove = (event: MouseEvent) => {
  if (isDragging.value && draggedLocation.value) {
    event.preventDefault()
    const svgPoint = screenToSVGPoint(event.clientX, event.clientY)
    ghostPosition.value = {
      x: svgPoint.x - dragOffset.value.x,
      y: svgPoint.y - dragOffset.value.y
    }
  }
}

const handleGlobalMouseUp = async (event: MouseEvent) => {
  if (isDragging.value && draggedLocation.value) {
    event.preventDefault()
    const newPosition = {
      x: ghostPosition.value.x - warehouseMargin,
      y: ghostPosition.value.y - warehouseMargin
    }

    // Find target zone under the drop position
    const targetZone = props.warehouseData?.zones.find(zone => {
      const zoneX = getZoneX(zone)
      const zoneY = getZoneY(zone)
      return (
        ghostPosition.value.x >= zoneX &&
        ghostPosition.value.x <= zoneX + getZoneWidth(zone) &&
        ghostPosition.value.y >= zoneY &&
        ghostPosition.value.y <= zoneY + getZoneHeight(zone)
      )
    })

    if (targetZone) {
      await updateLocationPosition(draggedLocation.value, newPosition, targetZone)
    }

    isDragging.value = false
    draggedLocation.value = null
  }
}

// Context Menu
const handleContextMenu = (event: MouseEvent) => {
  event.preventDefault()

  contextMenu.value = {
    show: true,
    x: event.clientX,
    y: event.clientY,
    type: 'canvas',
    target: null
  }
}

// Helper Functions
const screenToSVGPoint = (screenX: number, screenY: number) => {
  const svgRect = svgRef.value?.getBoundingClientRect()
  if (!svgRect) return { x: 0, y: 0 }

  const scaleX = viewBox.value.width / svgRect.width
  const scaleY = viewBox.value.height / svgRect.height

  return {
    x: viewBox.value.x + (screenX - svgRect.left) * scaleX,
    y: viewBox.value.y + (screenY - svgRect.top) * scaleY
  }
}

const updateLocationPosition = async (location: ProductLocationDetailed, newPosition: { x: number, y: number }, targetZone: WarehouseZone) => {
  try {
    const { supabase } = await import('@/lib/supabase')

    const { error } = await supabase
      .from('product_location')
      .update({
        position_x: newPosition.x,
        position_y: newPosition.y,
        warehouse_zone_id: targetZone.id,
        updated_at: new Date().toISOString()
      })
      .eq('id', location.id)

    if (error) {
      console.error('Error updating location position:', error)
      return
    }

    console.log('✅ Location position updated successfully')
  } catch (error: any) {
    console.error('Error updating location position:', error)
  }
}




const updateZonePosition = async (zone: WarehouseZone, newPosition: { x: number, y: number }) => {
  try {
    const { supabase } = await import('@/lib/supabase')

    const { error } = await supabase
      .from('warehouse_zones')
      .update({
        x_coordinate: newPosition.x,
        y_coordinate: newPosition.y,
        updated_at: new Date().toISOString()
      })
      .eq('id', zone.id)

    if (error) {
      console.error('Error updating zone position:', error)
      return
    }

    console.log('✅ Zone position updated successfully')

    // Update local zone data
    zone.x_coordinate = newPosition.x
    zone.y_coordinate = newPosition.y

  } catch (error: any) {
    console.error('Error updating zone position:', error)
  }
}

const updateZoneSize = async (zone: WarehouseZone, newBounds: { x: number, y: number, width: number, height: number }) => {
  try {
    const { supabase } = await import('@/lib/supabase')

    const { error } = await supabase
      .from('warehouse_zones')
      .update({
        x_coordinate: newBounds.x - warehouseMargin,
        y_coordinate: newBounds.y - warehouseMargin,
        width: newBounds.width,
        length: newBounds.height,
        updated_at: new Date().toISOString()
      })
      .eq('id', zone.id)

    if (error) {
      console.error('Error updating zone size:', error)
      return
    }

    console.log('✅ Zone size updated successfully')

    // Update local zone data
    zone.x_coordinate = newBounds.x - warehouseMargin
    zone.y_coordinate = newBounds.y - warehouseMargin
    zone.width = newBounds.width
    zone.length = newBounds.height

  } catch (error: any) {
    console.error('Error updating zone size:', error)
  }
}

const startCreation = (type: 'zone' | 'aisle' | 'shelf', x: number, y: number) => {
  console.log('Starting creation of', type, 'at', x, y)
  contextMenu.value.show = false
}

const duplicateLocation = (location: ProductLocationDetailed) => {
  console.log('Duplicating location:', location.id)
  contextMenu.value.show = false
}

const moveToZone = (location: ProductLocationDetailed) => {
  console.log('Moving location to zone:', location.id)
  contextMenu.value.show = false
}

const removeLocation = (location: ProductLocationDetailed) => {
  console.log('Removing location:', location.id)
  contextMenu.value.show = false
}

const editElement = (element: any) => {
  console.log('Editing element:', element)
  contextMenu.value.show = false
}

const duplicateElement = (element: any) => {
  console.log('Duplicating element:', element)
  contextMenu.value.show = false
}

const deleteElement = (element: any) => {
  console.log('Deleting element:', element)
  contextMenu.value.show = false
}

// Helper functions for creation preview
const getCreationColor = (type: 'zone' | 'aisle' | 'shelf') => {
  switch (type) {
    case 'zone': return '#10b981'
    case 'aisle': return '#3b82f6'
    case 'shelf': return '#8b5cf6'
    default: return '#64748b'
  }
}

const getCreationLabel = (type: 'zone' | 'aisle' | 'shelf') => {
  switch (type) {
    case 'zone': return 'Nueva Zona'
    case 'aisle': return 'Nuevo Pasillo'
    case 'shelf': return 'Nuevo Estante'
    default: return 'Nuevo Elemento'
  }
}

// SVG Event Handlers for Area Selection
const handleSvgMouseDown = (event: MouseEvent) => {
  if (!editMode.value || !creationMode.value) return

  event.preventDefault()
  event.stopPropagation()

  const svgPoint = screenToSVGPoint(event.clientX, event.clientY)

  isCreating.value = true
  creationStart.value = { x: svgPoint.x, y: svgPoint.y }
  creationEnd.value = { x: svgPoint.x, y: svgPoint.y }

  // Create initial preview
  creationPreview.value = {
    type: creationMode.value,
    x: svgPoint.x,
    y: svgPoint.y,
    width: 0,
    height: 0
  }
}

const handleSvgMouseMove = (event: MouseEvent) => {
  const svgPoint = screenToSVGPoint(event.clientX, event.clientY)

  // Handle warehouse manipulation
  if (isResizingWarehouse.value) {
    handleWarehouseMouseMove(event)
    return
  }

  // Handle zone manipulation
  if (isDraggingZone.value && draggedZone.value) {
    handleZoneMouseMove(event)
    return
  }

  if (isResizingZone.value && resizedZone.value) {
    handleZoneMouseMove(event)
    return
  }

  // Handle aisle manipulation
  if (isDraggingAisle.value && draggedAisle.value) {
    handleAisleMouseMove(event)
    return
  }

  // Handle shelf manipulation
  if (isDraggingShelf.value && draggedShelf.value) {
    handleShelfMouseMove(event)
    return
  }

  // Handle product location drag
  if (isDragging.value && draggedLocation.value) {
    handleGlobalMouseMove(event)
    return
  }

  // Handle creation mode
  if (!editMode.value || !creationMode.value || !isCreating.value || !creationStart.value) return

  creationEnd.value = { x: svgPoint.x, y: svgPoint.y }

  // Update preview with selection rectangle
  const x = Math.min(creationStart.value.x, svgPoint.x)
  const y = Math.min(creationStart.value.y, svgPoint.y)
  const width = Math.abs(svgPoint.x - creationStart.value.x)
  const height = Math.abs(svgPoint.y - creationStart.value.y)

  creationPreview.value = {
    type: creationMode.value,
    x,
    y,
    width,
    height
  }
}

const handleSvgMouseUp = async (event: MouseEvent) => {
  // Handle warehouse manipulation
  if (isResizingWarehouse.value) {
    handleWarehouseMouseUp()
    return
  }

  // Handle zone manipulation
  if (isDraggingZone.value || isResizingZone.value) {
    handleZoneMouseUp(event)
    return
  }

  // Handle aisle manipulation
  if (isDraggingAisle.value) {
    handleAisleMouseUp(event)
    return
  }

  // Handle shelf manipulation
  if (isDraggingShelf.value) {
    handleShelfMouseUp(event)
    return
  }

  // Handle product location drop
  if (isDragging.value && draggedLocation.value) {
    handleGlobalMouseUp(event)
    return
  }

  // Handle creation mode
  if (!editMode.value || !creationMode.value || !isCreating.value || !creationStart.value || !creationEnd.value) return

  event.preventDefault()
  event.stopPropagation()

  const x = Math.min(creationStart.value.x, creationEnd.value.x)
  const y = Math.min(creationStart.value.y, creationEnd.value.y)
  const width = Math.abs(creationEnd.value.x - creationStart.value.x)
  const height = Math.abs(creationEnd.value.y - creationStart.value.y)

  // Only create if area is large enough (minimum 30x30 units)
  if (width >= 30 && height >= 30) {
    await createNewElement(creationMode.value, { x, y, width, height })
  }

  // Reset creation state
  isCreating.value = false
  creationStart.value = null
  creationEnd.value = null
  creationPreview.value = null
}

const handleSvgMouseLeave = () => {
  if (isCreating.value) {
    // Reset creation state when mouse leaves SVG
    isCreating.value = false
    creationStart.value = null
    creationEnd.value = null
    creationPreview.value = null
  }
}

// Zone Manipulation Functions
const startZoneDrag = (event: MouseEvent, zone: WarehouseZone) => {
  if (!editMode.value) return

  // Don't start dragging if we're resizing
  if (isResizingZone.value) return

  event.preventDefault()
  event.stopPropagation()

  isDraggingZone.value = true
  draggedZone.value = zone
  selectedZone.value = zone.id

  const svgPoint = screenToSVGPoint(event.clientX, event.clientY)
  dragOffset.value = {
    x: svgPoint.x - getZoneX(zone),
    y: svgPoint.y - getZoneY(zone)
  }
}

const startZoneResize = (event: MouseEvent, zone: WarehouseZone, handle: string) => {
  if (!editMode.value) return

  event.preventDefault()
  event.stopPropagation()

  isResizingZone.value = true
  resizedZone.value = zone
  resizeHandle.value = handle
  selectedZone.value = zone.id

  const svgPoint = screenToSVGPoint(event.clientX, event.clientY)
  resizeStart.value = { x: svgPoint.x, y: svgPoint.y }
  resizeOriginal.value = {
    x: getZoneX(zone),
    y: getZoneY(zone),
    width: getZoneWidth(zone),
    height: getZoneHeight(zone)
  }
}

const handleZoneMouseMove = (event: MouseEvent) => {
  const svgPoint = screenToSVGPoint(event.clientX, event.clientY)

  if (isDraggingZone.value && draggedZone.value && dragOffset.value) {
    // Update zone position during drag
    const newX = svgPoint.x - dragOffset.value.x
    const newY = svgPoint.y - dragOffset.value.y

    // Constrain to warehouse bounds
    const constrainedX = Math.max(warehouseMargin, Math.min(newX, warehouseMargin + bounds.value.width - getZoneWidth(draggedZone.value)))
    const constrainedY = Math.max(warehouseMargin, Math.min(newY, warehouseMargin + bounds.value.length - getZoneHeight(draggedZone.value)))

    // Update zone coordinates temporarily for visual feedback
    draggedZone.value.x_coordinate = constrainedX - warehouseMargin
    draggedZone.value.y_coordinate = constrainedY - warehouseMargin
  }

  if (isResizingZone.value && resizedZone.value && resizeStart.value && resizeOriginal.value) {
    // Calculate resize delta
    const deltaX = svgPoint.x - resizeStart.value.x
    const deltaY = svgPoint.y - resizeStart.value.y

    let newX = resizeOriginal.value.x
    let newY = resizeOriginal.value.y
    let newWidth = resizeOriginal.value.width
    let newHeight = resizeOriginal.value.height

    // Apply resize based on handle
    switch (resizeHandle.value) {
      case 'nw':
        newX = resizeOriginal.value.x + deltaX
        newY = resizeOriginal.value.y + deltaY
        newWidth = resizeOriginal.value.width - deltaX
        newHeight = resizeOriginal.value.height - deltaY
        break
      case 'ne':
        newY = resizeOriginal.value.y + deltaY
        newWidth = resizeOriginal.value.width + deltaX
        newHeight = resizeOriginal.value.height - deltaY
        break
      case 'sw':
        newX = resizeOriginal.value.x + deltaX
        newWidth = resizeOriginal.value.width - deltaX
        newHeight = resizeOriginal.value.height + deltaY
        break
      case 'se':
        newWidth = resizeOriginal.value.width + deltaX
        newHeight = resizeOriginal.value.height + deltaY
        break
      case 'n':
        newY = resizeOriginal.value.y + deltaY
        newHeight = resizeOriginal.value.height - deltaY
        break
      case 'e':
        newWidth = resizeOriginal.value.width + deltaX
        break
      case 's':
        newHeight = resizeOriginal.value.height + deltaY
        break
      case 'w':
        newX = resizeOriginal.value.x + deltaX
        newWidth = resizeOriginal.value.width - deltaX
        break
    }

    // Apply minimum size constraints FIRST to prevent negative values
    const minSize = 30
    newWidth = Math.max(minSize, newWidth)
    newHeight = Math.max(minSize, newHeight)

    // Adjust position if we hit minimum size constraints
    if (newWidth === minSize) {
      if (resizeHandle.value?.includes('w')) {
        newX = resizeOriginal.value.x + resizeOriginal.value.width - minSize
      }
    }
    if (newHeight === minSize) {
      if (resizeHandle.value?.includes('n')) {
        newY = resizeOriginal.value.y + resizeOriginal.value.height - minSize
      }
    }

    // Constrain to warehouse bounds
    newX = Math.max(warehouseMargin, Math.min(newX, warehouseMargin + bounds.value.width - newWidth))
    newY = Math.max(warehouseMargin, Math.min(newY, warehouseMargin + bounds.value.length - newHeight))

    // Update zone dimensions temporarily for visual feedback (all values are now guaranteed positive)
    resizedZone.value.x_coordinate = Math.max(0, newX - warehouseMargin)
    resizedZone.value.y_coordinate = Math.max(0, newY - warehouseMargin)
    resizedZone.value.width = newWidth
    resizedZone.value.height = newHeight
    resizedZone.value.length = newHeight
  }
}

const handleZoneMouseUp = async (event: MouseEvent) => {
  if (isDraggingZone.value && draggedZone.value) {
    // Save position changes to database
    await updateZonePosition(draggedZone.value, {
      x: draggedZone.value.x_coordinate || 0,
      y: draggedZone.value.y_coordinate || 0
    })

    isDraggingZone.value = false
    draggedZone.value = null
    dragOffset.value = null
  }

  if (isResizingZone.value && resizedZone.value) {
    // Save size changes to database
    await updateZoneSize(resizedZone.value, {
      x: resizedZone.value.x_coordinate || 0,
      y: resizedZone.value.y_coordinate || 0,
      width: resizedZone.value.width || 0,
      height: resizedZone.value.height || 0
    })

    isResizingZone.value = false
    resizedZone.value = null
    resizeHandle.value = null
    resizeStart.value = null
    resizeOriginal.value = null
  }
}

// Aisle Drag and Drop Functions
const startAisleDrag = (event: MouseEvent, aisle: WarehouseAisle) => {
  if (!editMode.value) return
  event.preventDefault()
  event.stopPropagation()

  isDraggingAisle.value = true
  draggedAisle.value = aisle
  selectedAisle.value = aisle.id

  const svgPoint = screenToSVGPoint(event.clientX, event.clientY)
  aisleDragOffset.value = {
    x: svgPoint.x - getAisleX(aisle),
    y: svgPoint.y - getAisleY(aisle)
  }
}

const handleAisleMouseMove = (event: MouseEvent) => {
  if (!isDraggingAisle.value || !draggedAisle.value || !aisleDragOffset.value) return

  const svgPoint = screenToSVGPoint(event.clientX, event.clientY)
  const newX = svgPoint.x - aisleDragOffset.value.x
  const newY = svgPoint.y - aisleDragOffset.value.y

  // Calculate current length
  const currentLength = getAisleLength(draggedAisle.value)

  // Constrain to warehouse bounds
  const constrainedX = Math.max(warehouseMargin, Math.min(newX, warehouseMargin + bounds.value.width - getAisleWidth(draggedAisle.value)))
  const constrainedY = Math.max(warehouseMargin, Math.min(newY, warehouseMargin + bounds.value.length - currentLength))

  // Update aisle coordinates temporarily for visual feedback
  draggedAisle.value.start_x = constrainedX - warehouseMargin
  draggedAisle.value.start_y = constrainedY - warehouseMargin
  draggedAisle.value.end_x = constrainedX - warehouseMargin
  draggedAisle.value.end_y = (constrainedY - warehouseMargin) + currentLength
}

const handleAisleMouseUp = async (event: MouseEvent) => {
  if (!isDraggingAisle.value || !draggedAisle.value) return

  // Save position changes to database
  await updateAislePosition(draggedAisle.value, {
    x: draggedAisle.value.start_x || 0,
    y: draggedAisle.value.start_y || 0
  })

  isDraggingAisle.value = false
  draggedAisle.value = null
  aisleDragOffset.value = null
}

const updateAislePosition = async (aisle: WarehouseAisle, newPosition: { x: number, y: number }) => {
  try {
    const { supabase } = await import('@/lib/supabase')

    // Calculate the length and width of the aisle based on current dimensions
    const currentWidth = aisle.width || 2
    const currentLength = Math.abs((aisle.end_y || 20) - (aisle.start_y || 0))

    const { error } = await supabase
      .from('warehouse_aisles')
      .update({
        start_x: newPosition.x,
        start_y: newPosition.y,
        end_x: newPosition.x,
        end_y: newPosition.y + currentLength,
        updated_at: new Date().toISOString()
      })
      .eq('id', aisle.id)

    if (error) {
      console.error('Error updating aisle position:', error)
      return
    }

    // Update local aisle data
    aisle.start_x = newPosition.x
    aisle.start_y = newPosition.y
    aisle.end_x = newPosition.x
    aisle.end_y = newPosition.y + currentLength

    console.log('✅ Aisle position updated successfully')
  } catch (error: any) {
    console.error('Error updating aisle position:', error)
  }
}

// Shelf Drag and Drop Functions
const startShelfDrag = (event: MouseEvent, shelf: WarehouseShelf) => {
  if (!editMode.value) return
  event.preventDefault()
  event.stopPropagation()

  isDraggingShelf.value = true
  draggedShelf.value = shelf
  selectedShelf.value = shelf.id

  const svgPoint = screenToSVGPoint(event.clientX, event.clientY)
  shelfDragOffset.value = {
    x: svgPoint.x - getShelfX(shelf),
    y: svgPoint.y - getShelfY(shelf)
  }
}

const handleShelfMouseMove = (event: MouseEvent) => {
  if (!isDraggingShelf.value || !draggedShelf.value || !shelfDragOffset.value) return

  const svgPoint = screenToSVGPoint(event.clientX, event.clientY)
  const newX = svgPoint.x - shelfDragOffset.value.x
  const newY = svgPoint.y - shelfDragOffset.value.y

  // Constrain to warehouse bounds
  const constrainedX = Math.max(warehouseMargin, Math.min(newX, warehouseMargin + bounds.value.width - getShelfWidth(draggedShelf.value)))
  const constrainedY = Math.max(warehouseMargin, Math.min(newY, warehouseMargin + bounds.value.length - getShelfDepth(draggedShelf.value)))

  // Update shelf coordinates temporarily for visual feedback
  draggedShelf.value.position_x = constrainedX - warehouseMargin
  draggedShelf.value.position_y = constrainedY - warehouseMargin
}

const handleShelfMouseUp = async (event: MouseEvent) => {
  if (!isDraggingShelf.value || !draggedShelf.value) return

  // Save position changes to database
  await updateShelfPosition(draggedShelf.value, {
    x: draggedShelf.value.position_x || 0,
    y: draggedShelf.value.position_y || 0
  })

  isDraggingShelf.value = false
  draggedShelf.value = null
  shelfDragOffset.value = null
}

const updateShelfPosition = async (shelf: WarehouseShelf, newPosition: { x: number, y: number }) => {
  try {
    const { supabase } = await import('@/lib/supabase')
    const { error } = await supabase
      .from('warehouse_shelves')
      .update({
        position_x: newPosition.x,
        position_y: newPosition.y,
        updated_at: new Date().toISOString()
      })
      .eq('id', shelf.id)

    if (error) {
      console.error('Error updating shelf position:', error)
      return
    }

    // Update local shelf data
    shelf.position_x = newPosition.x
    shelf.position_y = newPosition.y

    console.log('✅ Shelf position updated successfully')
  } catch (error: any) {
    console.error('Error updating shelf position:', error)
  }
}

// Warehouse Resize Functions
const startWarehouseResize = (event: MouseEvent, handle: string) => {
  if (!editMode.value) return
  event.preventDefault()
  event.stopPropagation()

  isResizingWarehouse.value = true
  warehouseResizeHandle.value = handle
  warehouseResizeStart.value = screenToSVGPoint(event.clientX, event.clientY)
  warehouseOriginalSize.value = {
    width: bounds.value.width,
    length: bounds.value.length
  }

  document.addEventListener('mousemove', handleWarehouseMouseMove)
  document.addEventListener('mouseup', handleWarehouseMouseUp)
}

const handleWarehouseMouseMove = (event: MouseEvent) => {
  if (!isResizingWarehouse.value || !warehouseResizeStart.value || !warehouseOriginalSize.value) return

  const svgPoint = screenToSVGPoint(event.clientX, event.clientY)
  const deltaX = svgPoint.x - warehouseResizeStart.value.x
  const deltaY = svgPoint.y - warehouseResizeStart.value.y

  let newWidth = warehouseOriginalSize.value.width
  let newLength = warehouseOriginalSize.value.length

  // Apply resize based on handle
  switch (warehouseResizeHandle.value) {
    case 'nw':
      newWidth = warehouseOriginalSize.value.width - deltaX
      newLength = warehouseOriginalSize.value.length - deltaY
      break
    case 'ne':
      newWidth = warehouseOriginalSize.value.width + deltaX
      newLength = warehouseOriginalSize.value.length - deltaY
      break
    case 'sw':
      newWidth = warehouseOriginalSize.value.width - deltaX
      newLength = warehouseOriginalSize.value.length + deltaY
      break
    case 'se':
      newWidth = warehouseOriginalSize.value.width + deltaX
      newLength = warehouseOriginalSize.value.length + deltaY
      break
    case 'n':
      newLength = warehouseOriginalSize.value.length - deltaY
      break
    case 'e':
      newWidth = warehouseOriginalSize.value.width + deltaX
      break
    case 's':
      newLength = warehouseOriginalSize.value.length + deltaY
      break
    case 'w':
      newWidth = warehouseOriginalSize.value.width - deltaX
      break
  }

  // Apply minimum size constraints
  newWidth = Math.max(600, newWidth)
  newLength = Math.max(500, newLength)

  // Update warehouse dimensions temporarily for visual feedback
  props.warehouseData.warehouse.width = newWidth
  props.warehouseData.warehouse.length = newLength
}

const handleWarehouseMouseUp = async (event: MouseEvent) => {
  if (!isResizingWarehouse.value || !warehouseOriginalSize.value) return

  // Save warehouse size changes to database
  await updateWarehouseSize(props.warehouseData.warehouse, {
    width: props.warehouseData.warehouse.width || 0,
    length: props.warehouseData.warehouse.length || 0
  })

  isResizingWarehouse.value = false
  warehouseResizeHandle.value = null
  warehouseResizeStart.value = null
  warehouseOriginalSize.value = null

  document.removeEventListener('mousemove', handleWarehouseMouseMove)
  document.removeEventListener('mouseup', handleWarehouseMouseUp)
}

const updateWarehouseSize = async (warehouse: Warehouse, newSize: { width: number, length: number }) => {
  try {
    const { supabase } = await import('@/lib/supabase')
    const { error } = await supabase
      .from('warehouses')
      .update({
        width: newSize.width,
        length: newSize.length,
        updated_at: new Date().toISOString()
      })
      .eq('id', warehouse.id)

    if (error) {
      console.error('Error updating warehouse size:', error)
      return
    }

    // Update local warehouse data
    warehouse.width = newSize.width
    warehouse.length = newSize.length

    console.log('Warehouse size updated successfully')
  } catch (error: any) {
    console.error('Error updating warehouse size:', error)
  }
}

</script>

<style scoped>
.zone-group:hover .zone-header {
  filter: brightness(1.2);
}

.aisle-group:hover {
  filter: brightness(1.1) saturate(1.2);
}

.shelf-group:hover {
  filter: brightness(1.15) saturate(1.1);
}

.location-group:hover {
  filter: brightness(1.3) saturate(1.2);
}

.animate-bounce {
  animation: bounce 2s infinite;
}

@keyframes bounce {
  0%, 20%, 53%, 80%, 100% {
    transform: translateY(0);
  }
  40%, 43% {
    transform: translateY(-8px);
  }
  70% {
    transform: translateY(-4px);
  }
  90% {
    transform: translateY(-2px);
  }
}
</style>
