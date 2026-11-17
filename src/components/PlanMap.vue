<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref, watch } from 'vue'
import L from 'leaflet'
import type { Etape } from '../types'
import { PLAN_H, PLAN_URL, PLAN_W } from './plan'

const props = defineProps<{
  etapes: Etape[]
  done: number[]
  isReachable: (o: number) => boolean
  current?: number
}>()
const emit = defineEmits<{ select: [ordre: number] }>()

const el = ref<HTMLDivElement>()
let map: L.Map | null = null
let layer: L.LayerGroup | null = null

// y Leaflet (CRS.Simple) = hauteur - y image
const toLatLng = (x: number, y: number) => L.latLng(PLAN_H - y, x)

function draw() {
  if (!map) return
  layer?.remove()
  layer = L.layerGroup().addTo(map)
  const done = props.etapes.filter((e) => props.done.includes(e.ordre) && e.lieu)
  const path = done.map((e) => toLatLng(e.lieu!.plan.x, e.lieu!.plan.y))
  const cur = props.etapes.find((e) => e.ordre === props.current)
  if (cur?.lieu) path.push(toLatLng(cur.lieu.plan.x, cur.lieu.plan.y))
  if (path.length > 1) L.polyline(path, { color: '#c8232c', weight: 3, lineCap: 'round', opacity: 0.9 }).addTo(layer)

  for (const e of props.etapes) {
    if (!e.lieu) continue // lieu facultatif : l'étape reste accessible sans point sur le plan
    const state = props.done.includes(e.ordre) ? 'done' : e.ordre === props.current ? 'current' : 'locked'
    const m = L.marker(toLatLng(e.lieu.plan.x, e.lieu.plan.y), {
      icon: L.divIcon({ className: '', html: `<div class="pin-marker ${state}"><span class="needle"></span><span class="head">${e.ordre}</span></div>`, iconSize: [38, 46], iconAnchor: [19, 42] }),
      keyboard: true,
      title: `Étape ${e.ordre} : ${e.titre}`,
      alt: `Étape ${e.ordre} : ${e.titre}`,
    })
    m.bindTooltip(`${e.ordre}. ${e.titre}${props.isReachable(e.ordre) ? '' : ' (verrouillée)'}`, { direction: 'top', offset: [0, -40] })
    m.on('click', () => props.isReachable(e.ordre) && emit('select', e.ordre))
    m.addTo(layer)
  }
}

onMounted(() => {
  const bounds = L.latLngBounds([0, 0], [PLAN_H, PLAN_W])
  map = L.map(el.value!, {
    crs: L.CRS.Simple, // plan interne, pas de GPS
    minZoom: -1.2, maxZoom: 1.5, zoomSnap: 0.1,
    attributionControl: false, maxBounds: bounds.pad(0.2), zoomControl: true,
  })
  L.imageOverlay(PLAN_URL, bounds).addTo(map)
  map.fitBounds(bounds, { padding: [6, 6] })
  draw()
})
watch(() => [props.current, props.etapes, [...props.done]], draw, { deep: true })
onBeforeUnmount(() => map?.remove())
</script>

<template>
  <div ref="el" class="plan" role="application" aria-label="Plan interactif du parcours" />
</template>

<style scoped>
.plan { width: 100%; aspect-ratio: 5 / 3.4; }
</style>
