<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type { Etape } from '../types'
import type { FortScene, PinData } from '../three/fortScene'

const props = defineProps<{
  etapes: Etape[]
  done: number[]
  isReachable: (o: number) => boolean
  current?: number
  mode: 'hero' | 'map'
}>()
const emit = defineEmits<{ select: [ordre: number]; unsupported: [] }>()

const host = ref<HTMLDivElement>()
const ready = ref(false)
let scene: FortScene | null = null

const pins = (): PinData[] => props.etapes.filter((e) => e.lieu).map((e) => ({
  ordre: e.ordre, titre: e.titre, x: e.lieu!.plan.x, y: e.lieu!.plan.y,
  state: props.done.includes(e.ordre) ? 'done' : e.ordre === props.current ? 'current' : 'locked',
  reachable: props.isReachable(e.ordre),
}))

onMounted(async () => {
  // Three.js est chargé à la demande : la première page reste légère.
  const mod = await import('../three/fortScene')
  if (!mod.webglAvailable() || !host.value) { emit('unsupported'); return }
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  try {
    scene = new mod.FortScene(host.value, { mode: props.mode, reducedMotion, onSelect: (o) => emit('select', o) })
  } catch { emit('unsupported'); return }
  scene.setPins(pins(), props.current)
  ready.value = true
})
watch(() => [props.current, [...props.done]], () => scene?.setPins(pins(), props.current))
onBeforeUnmount(() => scene?.dispose())
</script>

<template>
  <div class="fort3d" :class="mode">
    <div ref="host" class="canvas" role="img"
         :aria-label="mode === 'hero' ? 'Maquette 3D schématique du Fort de Romainville au crépuscule' : 'Maquette 3D du parcours : touchez une punaise pour ouvrir une étape'" />
    <p v-if="!ready" class="loading">Montage de la maquette…</p>
  </div>
</template>

<style scoped>
.fort3d { position: relative; background: #2a1d36; overflow: hidden; }
.canvas { position: absolute; inset: 0; }
.canvas :deep(canvas) { display: block; width: 100% !important; height: 100% !important; touch-action: none; }
.map { aspect-ratio: 4 / 3.6; border-radius: 3px; }
.hero { height: 100%; }
.loading { position: absolute; inset: 0; display: grid; place-items: center; margin: 0; color: #e9d8e8; font: 20px/1 var(--hand); }
</style>
