<script setup lang="ts">
import { ref, watch } from 'vue'
import { RouterLink, RouterView, useRoute } from 'vue-router'
import PhotoViewer from './components/PhotoViewer.vue'
import Stage3D from './components/Stage3D.vue'
import { stage } from './three/stage'
import { chapter, panelOpen } from './stores/ui'

// Immersion : la scène 3D occupe tout l'écran, les contenus vivent dans un panneau repliable.
const route = useRoute()
const scroller = ref<HTMLElement>()
watch(() => route.fullPath, () => { panelOpen.value = false; scroller.value?.scrollTo({ top: 0 }) })
function onScroll() {
  const el = scroller.value
  if (!el) return
  const max = el.scrollHeight - el.clientHeight
  stage.scroll(max > 0 ? el.scrollTop / max : 0)
  if (el.scrollTop > 40 && !panelOpen.value) panelOpen.value = true
}
</script>

<template>
  <Stage3D />
  <header class="top">
    <RouterLink to="/" class="brand" aria-label="Accueil – Les Traces de la Mémoire">
      <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="9" r="6.5" fill="#c8232c" /><circle cx="10" cy="7" r="2" fill="#fff" opacity=".6" /><line x1="12" y1="15" x2="12" y2="23" stroke="#bbb" stroke-width="2" /></svg>
      <span>Les Traces <em>de la</em> Mémoire</span>
    </RouterLink>
    <span class="stamp">Prototype</span>
  </header>

  <Transition name="chap" mode="out-in">
    <div :key="chapter.title" class="chapter" aria-live="polite">
      <p v-if="chapter.eyebrow" class="ch-eyebrow">{{ chapter.eyebrow }}</p>
      <h1>{{ chapter.title }}</h1>
      <p v-if="chapter.sub" class="ch-sub">{{ chapter.sub }}</p>
    </div>
  </Transition>

  <section class="hud" :class="{ open: panelOpen }" aria-label="Contenu de la page">
    <button class="handle" :aria-expanded="panelOpen" @click="panelOpen = !panelOpen">
      <span class="grip" aria-hidden="true" />
      <span class="lbl">{{ panelOpen ? 'Réduire pour voir le Fort' : 'Déplier le dossier' }}</span>
    </button>
    <div ref="scroller" class="hud-scroll" @scroll.passive="onScroll">
      <RouterView v-slot="{ Component, route: r }">
        <Transition name="flip" mode="out-in"><component :is="Component" :key="r.fullPath" /></Transition>
      </RouterView>
      <footer class="guard">
        <p class="eyebrow">Charte du dispositif</p>
        <p class="small muted">Aucun fait inventé, reconstitutions signalées, pas de score. La maquette 3D est schématique, d’après le plan de 1944. Photographies : Mémorial national des femmes en résistance et en déportation, diffusion autorisée pour le projet Paris 8.</p>
      </footer>
    </div>
  </section>

  <PhotoViewer />
</template>

<style scoped>
.top {
  position: fixed; top: 0; left: 0; right: 0; z-index: 1000;
  display: flex; align-items: center; justify-content: space-between; gap: 12px;
  padding: calc(10px + env(safe-area-inset-top)) 18px 10px;
}
.brand { display: flex; align-items: center; gap: 8px; font: 650 18px/1 var(--display); color: #fbf3e8; text-decoration: none; text-shadow: 0 1px 10px rgb(0 0 0 / .5); }
.brand em { font-style: italic; font-weight: 400; }
.brand svg { width: 22px; height: 22px; }
.top .stamp { font-size: 11px; padding: 4px 7px; color: #ff8f8f; mix-blend-mode: normal; }

.chapter {
  position: fixed; z-index: 10; left: 0; right: 0; top: calc(56px + env(safe-area-inset-top));
  padding: 0 20px; pointer-events: none; color: #fbf3e8; text-shadow: 0 2px 20px rgb(15 8 20 / .75), 0 1px 3px rgb(15 8 20 / .6);
  max-width: 560px;
}
.chapter h1 { font-size: clamp(30px, 8.5vw, 46px); color: #fbf3e8; }
.ch-eyebrow { margin: 0 0 6px; font: 14px/1.3 var(--type); color: #f2cfb4; }
.ch-sub { margin: 8px 0 0; font: 22px/1.1 var(--hand); color: #f2cfb4; }
.chap-enter-active, .chap-leave-active { transition: opacity .5s ease, transform .6s cubic-bezier(.2,.8,.2,1); }
.chap-enter-from { opacity: 0; transform: translateY(-14px) perspective(600px) rotateX(30deg); }
.chap-leave-to { opacity: 0; transform: translateY(10px); }

.hud {
  position: fixed; z-index: 20; left: 50%; bottom: 0; transform: translateX(-50%);
  width: min(560px, 100%); height: 40dvh; display: flex; flex-direction: column;
  background: color-mix(in srgb, var(--paper) 94%, transparent); backdrop-filter: blur(8px);
  border-radius: 18px 18px 0 0; box-shadow: 0 -18px 50px rgb(10 5 15 / .45);
  transition: height .55s cubic-bezier(.2,.8,.2,1);
}
.hud.open { height: 84dvh; }
.handle { flex: none; display: grid; justify-items: center; gap: 4px; padding: 8px 0 6px; border: 0; background: none; cursor: pointer; color: var(--mute); font: 12px/1 var(--sans); }
.grip { width: 44px; height: 5px; border-radius: 3px; background: #b9a88c; }
.hud-scroll { flex: 1; overflow-y: auto; overscroll-behavior: contain; padding: 4px 18px calc(28px + env(safe-area-inset-bottom)); perspective: 1400px; }
.guard { margin-top: 34px; padding-top: 16px; border-top: 1px dashed var(--line); text-align: center; }
.guard p { margin: 4px 0; }

@media (min-width: 960px) {
  .hud, .hud.open { left: auto; right: 18px; bottom: 18px; top: 76px; transform: none; width: 440px; height: auto; border-radius: 16px; }
  .handle { display: none; }
  .chapter { top: auto; bottom: 48px; left: 24px; max-width: calc(100% - 520px); }
  .chapter h1 { font-size: 58px; }
}
</style>
