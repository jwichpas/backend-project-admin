<template>
  <Card>
    <CardHeader>
      <CardTitle>
        Bar Chart - Multiple
        <Badge 
          variant="outline" 
          class="text-red-500 bg-red-500/10 border-none ml-2"
        >
          <TrendingDown class="h-4 w-4" />
          <span>-5.2%</span>
        </Badge>
      </CardTitle>
      <CardDescription>January - June 2025</CardDescription>
    </CardHeader>
    <CardContent>
      <div class="relative">
        <div class="dots-pattern"></div>
        <div style="width: 100%; height: 350px; position: relative; z-10;">
          <Bar 
            :data="chartData" 
            :options="chartOptions"
          />
        </div>
      </div>
    </CardContent>
  </Card>
</template>

<script setup lang="ts">
import { 
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  type ChartOptions
} from 'chart.js'
import { Bar } from 'vue-chartjs'
import { TrendingDown } from 'lucide-vue-next'

import Card from '@/components/ui/Card.vue'
import CardContent from '@/components/ui/CardContent.vue'
import CardDescription from '@/components/ui/CardDescription.vue'
import CardHeader from '@/components/ui/CardHeader.vue'
import CardTitle from '@/components/ui/CardTitle.vue'
import Badge from '@/components/ui/Badge.vue'

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
)

const chartData = {
  labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
  datasets: [
    {
      label: 'Desktop',
      backgroundColor: '#3b82f6',
      borderColor: '#3b82f6',
      borderRadius: 4,
      data: [186, 305, 237, 73, 209, 214]
    },
    {
      label: 'Mobile',
      backgroundColor: '#ef4444',
      borderColor: '#ef4444', 
      borderRadius: 4,
      data: [80, 200, 120, 190, 130, 140]
    }
  ]
}

const chartOptions: ChartOptions<'bar'> = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false
    },
    tooltip: {
      mode: 'index',
      intersect: false,
      backgroundColor: 'rgb(255, 255, 255)',
      titleColor: 'rgb(0, 0, 0)',
      bodyColor: 'rgb(0, 0, 0)',
      borderColor: 'rgb(229, 231, 235)',
      borderWidth: 1,
      cornerRadius: 8,
      displayColors: true
    }
  },
  scales: {
    x: {
      grid: {
        display: false
      },
      ticks: {
        color: 'rgb(107, 114, 128)'
      },
      border: {
        display: false
      }
    },
    y: {
      grid: {
        display: false
      },
      ticks: {
        color: 'rgb(107, 114, 128)'
      },
      border: {
        display: false
      }
    }
  },
  elements: {
    bar: {
      borderRadius: {
        topLeft: 4,
        topRight: 4,
        bottomLeft: 0,
        bottomRight: 0
      }
    }
  }
}
</script>

<style scoped>
:root {
  --chart-1: #3b82f6;
  --chart-2: #ef4444;
  --color-desktop: var(--chart-1);
  --color-mobile: var(--chart-2);
}

.dots-pattern {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  pointer-events: none;
  opacity: 0.2;
  background-image: radial-gradient(circle at 2px 2px, #666 1px, transparent 0);
  background-size: 10px 10px;
}
</style>