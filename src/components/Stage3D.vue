<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useEnquete } from '../composables/useEnquete'
import { useProgress } from '../stores/progress'
import { stageOk, stageScene } from '../three/stage'
import type { PinData, View } from '../three/fortScene'

// Décor 3D permanent du site : la caméra suit la navigation (accueil, plan, étape, fresque) et le défilement.
const host = ref<HTMLDivElement>()
const ready = ref(false)
const route = useRoute()
const router = useRouter()
const p = useProgress()
const { enquete } = useEnquete(() => 1)

const routeOrdre = computed(() => (route.name === 'etape' ? Number(route.params.ordre) : undefined))
const current = computed(() => routeOrdre.value ?? enquete.value?.etapes.find((e) => !p.isDone(e.ordre))?.ordre)

const pins = (): PinData[] => (enquete.value?.etapes ?? []).filter((e) => e.lieu).map((e) => ({
  ordre: e.ordre, titre: e.titre, x: e.lieu!.plan.x, y: e.lieu!.plan.y,
  state: p.isDone(e.ordre) ? 'done' : e.ordre === current.value ? 'current' : 'locked',
  reachable: p.isReachable(e.ordre),
}))

const view = computed<View>(() => {
  if (route.name === 'enquete') return { kind: 'overview' }
  if (route.name === 'fresque') return { kind: 'sky' }
  if (route.name === 'etape' && enquete.value) {
    const e = enquete.value.etapes.find((x) => x.ordre === routeOrdre.value)
    if (e?.lieu) return { kind: 'focus', x: e.lieu.plan.x, y: e.lieu.plan.y, ordre: e.ordre }
  }
  return { kind: 'hero' }
})

function onScroll() {
  const max = document.documentElement.scrollHeight - innerHeight
  stageScene.value?.setScroll(max > 0 ? scrollY / max : 0)
}

onMounted(async () => {
  const mod = await import('../three/fortScene')
  if (!mod.webglAvailable() || !host.value) { stageOk.value = false; return }
  try {
    stageScene.value = new mod.FortScene(host.value, {
      reducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches,
      onSelect: (o) => router.push(`/enquete/1/etape/${o}`),
    })
  } catch { stageOk.value = false; return }
  stageScene.value.setPins(pins(), current.value)
  stageScene.value.setView(view.value)
  ready.value = true
  addEventListener('scroll', onScroll, { passive: true })
})
watch(view, (v) => stageScene.value?.setView(v), { deep: true })
watch(() => [current.value, [...p.done], [...p.unlocked], enquete.value], () => stageScene.value?.setPins(pins(), current.value), { deep: true })
watch(() => route.fullPath, () => stageScene.value?.setScroll(0))
onBeforeUnmount(() => { removeEventListener('scroll', onScroll); stageScene.value?.dispose(); stageScene.value = null })
</script>

<template>
  <div class="stage" aria-hidden="true">
    <div ref="host" class="canvas" />
    <div class="veil" />
    <p v-if="!ready && stageOk" class="loading">Montage du Fort…</p>
  </div>
</template>

<style scoped>
.stage { position: fixed; inset: 0; z-index: 0; background: linear-gradient(#2a1d36, #6b3f55 60%, #c98a6b); }
.canvas { position: absolute; inset: 0; }
.canvas :deep(canvas) { display: block; width: 100% !important; height: 100% !important; touch-action: pan-y; }
/* voile en bas d'écran pour que les fiches restent lisibles au-dessus du décor */
.veil { position: absolute; inset: 0; pointer-events: none; background: linear-gradient(transparent 38%, rgb(28 16 34 / .55) 78%, rgb(28 16 34 / .75)); }
.loading { position: absolute; top: 30vh; left: 0; right: 0; text-align: center; margin: 0; color: #f2cfb4; font: 24px/1 var(--hand); }
</style>
