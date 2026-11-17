<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useEnquete } from '../composables/useEnquete'
import { useProgress } from '../stores/progress'
import { stageOk, stageScene } from '../three/stage'
import { docHandler, docUrl, flipped, inspecting, looked, panelOpen } from '../stores/ui'
import type { Archive } from '../types'
import type { FrameSet, PinData, View } from '../three/fortScene'

// Décor 3D permanent : la caméra suit la navigation, les étapes se visitent à hauteur de visiteur.
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

const docsOf = (ordre: number): Archive[] => {
  const e = enquete.value?.etapes.find((x) => x.ordre === ordre)
  return e ? [...e.indices.map((i) => i.archive).filter((a): a is Archive => !!a?.src), ...(e.documents ?? [])] : []
}
const allDocs = computed(() => (enquete.value?.etapes ?? []).flatMap((e) => docsOf(e.ordre)))
const frameSets = (): FrameSet[] => (enquete.value?.etapes ?? []).filter((e) => e.lieu).map((e) => ({
  ordre: e.ordre, x: e.lieu!.plan.x, y: e.lieu!.plan.y,
  docs: docsOf(e.ordre).map((d) => ({ id: d.id, url: docUrl(d.src!), verso: d.verso ? docUrl(d.verso) : undefined, titre: d.titre })),
}))

const view = computed<View>(() => {
  if (route.name === 'enquete') return { kind: 'overview' }
  if (route.name === 'fresque') return { kind: 'sky' }
  if (route.name === 'etape' && enquete.value) {
    const e = enquete.value.etapes.find((x) => x.ordre === routeOrdre.value)
    if (e?.lieu) return { kind: 'station', x: e.lieu.plan.x, y: e.lieu.plan.y, ordre: e.ordre }
  }
  return { kind: 'hero' }
})

function takeInHand(d: Archive) {
  inspecting.value = d; flipped.value = false; panelOpen.value = false
  stageScene.value?.inspect(d.id)
}

onMounted(async () => {
  const mod = await import('../three/fortScene')
  if (!mod.webglAvailable() || !host.value) { stageOk.value = false; return }
  try {
    stageScene.value = new mod.FortScene(host.value, {
      reducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches,
      onSelect: (o) => router.push(`/enquete/1/etape/${o}`),
      onPhoto: (id) => { const d = allDocs.value.find((x) => x.id === id); if (d) takeInHand(d) },
      onInspectEnd: () => { inspecting.value = null; flipped.value = false },
      onLook: () => { looked.value = true },
    })
  } catch { stageOk.value = false; return }
  // un document de l'étape en cours se prend en main dans la 3D ; sinon, visionneuse classique
  docHandler.open = (d) => {
    if (!stageScene.value || routeOrdre.value === undefined || !p.isUnlocked(routeOrdre.value)) return false
    if (!docsOf(routeOrdre.value).some((x) => x.id === d.id)) return false
    takeInHand(d)
    return true
  }
  stageScene.value.setFrames(frameSets())
  sync()
  stageScene.value.setView(view.value)
  ready.value = true
})

function sync() {
  const s = stageScene.value
  if (!s) return
  s.setPins(pins(), current.value)
  s.setUnlocked([...p.unlocked])
}

watch(view, (v) => { inspecting.value = null; stageScene.value?.setView(v) }, { deep: true })
watch(() => [current.value, [...p.done], [...p.unlocked]], sync, { deep: true })
watch(enquete, () => { stageScene.value?.setFrames(frameSets()); sync(); stageScene.value?.setView(view.value) })
watch(panelOpen, (o) => stageScene.value?.setPanel(o))
onBeforeUnmount(() => { docHandler.open = null; stageScene.value?.dispose(); stageScene.value = null })
</script>

<template>
  <div class="stage" aria-hidden="true">
    <div ref="host" class="canvas" />
    <div class="veil" :class="{ dim: !!inspecting }" />
    <p v-if="!ready && stageOk" class="loading">Montage du Fort…</p>
  </div>
</template>

<style scoped>
.stage { position: fixed; inset: 0; z-index: 0; background: linear-gradient(#2a1d36, #6b3f55 60%, #c98a6b); }
.canvas { position: absolute; inset: 0; }
.canvas :deep(canvas) { display: block; width: 100% !important; height: 100% !important; touch-action: none; }
.veil { position: absolute; inset: 0; pointer-events: none; background: linear-gradient(rgb(28 16 34 / .45), transparent 22%, transparent 70%, rgb(28 16 34 / .5)); transition: background .5s; }
.veil.dim { background: radial-gradient(ellipse at 50% 40%, transparent 30%, rgb(14 8 18 / .55) 80%); }
.loading { position: absolute; top: 30vh; left: 0; right: 0; text-align: center; margin: 0; color: #f2cfb4; font: 24px/1 var(--hand); }
</style>
