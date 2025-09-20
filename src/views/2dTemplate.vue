<template>
  <div class="warehouse-view">
    <v-stage ref="stage" :config="stageConfig" @wheel="handleZoom">
      <v-layer>
        <!-- Warehouse Border -->
        <v-rect :config="warehouseBorder" />

        <!-- Zones -->
        <v-rect v-for="zone in zones" :key="zone.id" :config="getZoneConfig(zone)" />
        <v-text v-for="zone in zones" :key="`label-${zone.id}`" :config="getZoneLabel(zone)" />

        <!-- Aisles -->
        <v-rect v-for="aisle in aisles" :key="aisle.id" :config="getAisleConfig(aisle)" />

        <!-- Shelves (interactive) -->
        <v-group v-for="shelf in shelves" :key="shelf.id" :config="getShelfGroup(shelf)" draggable>
          <v-rect :config="getShelfRect(shelf)" />
          <v-text :config="getShelfLabel(shelf)" />
        </v-group>
      </v-layer>
    </v-stage>
    <div class="controls">
      <button @click="resetZoom">Reset Zoom</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { Stage, Layer, Rect, Text, Group } from 'vue-konva';

const stage = ref(null);
const scale = ref(1);
const stageConfig = ref({
  width: 1200,
  height: 800,
  scale: { x: 1, y: 1 },
});

// Example data (fetch from your API based on SQL tables)
const zones = ref([
  { id: 1, name: 'Zone A', x: 0, y: 0, width: 600, height: 800, color: '#E3F2FD' },
  { id: 2, name: 'Zone B', x: 600, y: 0, width: 600, height: 800, color: '#E8F5E9' },
]);

const aisles = ref([
  { id: 1, zoneId: 1, x: 100, y: 0, width: 50, height: 800, color: '#F5F5F5' },
  // Add more from warehouse_aisles table
]);

const shelves = ref([
  { id: 1, aisleId: 1, x: 50, y: 100, width: 40, height: 20, label: 'Shelf A1-01' },
  // Add more from warehouse_shelves
]);

const warehouseBorder = {
  x: 0, y: 0, width: 1200, height: 800, stroke: '#333', strokeWidth: 2, fill: '#FAFAFA',
};

const getZoneConfig = (zone) => ({
  x: zone.x, y: zone.y, width: zone.width, height: zone.height,
  fill: zone.color, stroke: '#2196F3', strokeWidth: 1, cornerRadius: 5,
});

const getZoneLabel = (zone) => ({
  x: zone.x + 20, y: zone.y + 20, text: zone.name,
  fontSize: 24, fontFamily: 'Arial', fill: '#333', fontStyle: 'bold',
});

const getAisleConfig = (aisle) => ({
  x: aisle.x, y: aisle.y, width: aisle.width, height: aisle.height,
  fill: aisle.color, stroke: '#BDBDBD', strokeWidth: 1,
});

const getShelfGroup = (shelf) => ({
  x: shelf.x, y: shelf.y,
});

const getShelfRect = (shelf) => ({
  width: shelf.width, height: shelf.height, fill: '#757575', cornerRadius: 3,
  shadowBlur: 5, shadowColor: 'rgba(0,0,0,0.2)', shadowOffset: { x: 2, y: 2 },
});

const getShelfLabel = (shelf) => ({
  x: 5, y: 5, text: shelf.label, fontSize: 12, fill: '#FFF',
});

const handleZoom = (e) => {
  e.evt.preventDefault();
  const oldScale = scale.value;
  scale.value += e.evt.deltaY * -0.001;
  scale.value = Math.min(Math.max(0.5, scale.value), 3); // Clamp scale
  const pointer = stage.value.getStage().getPointerPosition();
  const mousePointTo = {
    x: (pointer.x / oldScale) - pointer.x / scale.value,
    y: (pointer.y / oldScale) - pointer.y / scale.value,
  };
  stageConfig.value.scale = { x: scale.value, y: scale.value };
  stageConfig.value.x = mousePointTo.x;
  stageConfig.value.y = mousePointTo.y;
};

const resetZoom = () => {
  scale.value = 1;
  stageConfig.value.scale = { x: 1, y: 1 };
  stageConfig.value.x = 0;
  stageConfig.value.y = 0;
};

onMounted(() => {
  // Fetch real data from API here
});
</script>

<style>
.warehouse-view {
  background: #FFF;
  border: 1px solid #DDD;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  overflow: hidden;
  position: relative;
}
.controls {
  position: absolute;
  bottom: 10px;
  right: 10px;
  display: flex;
  gap: 8px;
}
button {
  background: #2196F3;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.3s;
}
button:hover {
  background: #1976D2;
}
</style>
