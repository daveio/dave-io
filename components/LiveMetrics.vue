<template>
  <UCard class="w-full">
    <canvas ref="canvas" class="w-full h-64"></canvas>
  </UCard>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue"
import { useRuntimeConfig } from "#imports"

const canvas = ref<HTMLCanvasElement | null>(null)
interface ChartInstance {
  data: { labels: string[]; datasets: { data: number[] }[] }
  update: (mode?: string) => void
}
let chart: ChartInstance | null = null
let socket: WebSocket | null = null

async function initChart() {
  if (!canvas.value) return
  const mod = await import("https://cdn.jsdelivr.net/npm/chart.js@4.4.9/dist/chart.umd.js")
  const Chart = mod.default
  chart = new Chart(canvas.value, {
    type: "line",
    data: { labels: [], datasets: [{ label: "Requests", data: [], borderColor: "#4ade80", fill: false }] },
    options: { animation: false }
  })
}

function updateChart(data: { ok: number; error: number; timestamp: number }) {
  if (!chart) return
  chart.data.labels.push(new Date(data.timestamp).toLocaleTimeString())
  chart.data.datasets[0].data.push(data.ok)
  if (chart.data.labels.length > 20) {
    chart.data.labels.shift()
    chart.data.datasets[0].data.shift()
  }
  chart.update("none")
}

onMounted(async () => {
  await initChart()
  const config = useRuntimeConfig()
  const url = new URL(`${config.public.apiBaseUrl}/dashboard/live`, window.location.href)
  url.protocol = url.protocol === "https:" ? "wss:" : "ws:"
  socket = new WebSocket(url.toString())
  socket.addEventListener("message", (e) => updateChart(JSON.parse(e.data)))
})

onBeforeUnmount(() => {
  socket?.close()
})
</script>
