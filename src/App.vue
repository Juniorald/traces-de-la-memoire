<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
</script>

<template>
  <header class="top">
    <RouterLink to="/" class="brand" aria-label="Accueil – Les Traces de la Mémoire">
      <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="9" r="6.5" fill="#c8232c" /><circle cx="10" cy="7" r="2" fill="#fff" opacity=".6" /><line x1="12" y1="15" x2="12" y2="23" stroke="#555" stroke-width="2" /></svg>
      <span>Les Traces <em>de la</em> Mémoire</span>
    </RouterLink>
    <span class="stamp plum">Prototype</span>
  </header>
  <main class="wrap">
    <RouterView v-slot="{ Component }">
      <Transition name="fade" mode="out-in"><component :is="Component" /></Transition>
    </RouterView>
    <footer class="guard">
      <p class="eyebrow">Charte du dispositif</p>
      <p class="small muted">Aucun fait inventé · reconstitutions signalées · pas de score. Les illustrations sont des créations graphiques ; les documents sont des emplacements à remplacer par des archives vérifiées et autorisées.</p>
    </footer>
  </main>
</template>

<style scoped>
.top {
  position: sticky; top: 0; z-index: 1000;
  display: flex; align-items: center; justify-content: space-between; gap: 12px;
  padding: 10px 18px; backdrop-filter: blur(10px);
  background: rgb(239 230 214 / .86); border-bottom: 1px solid var(--line);
}
.brand { display: flex; align-items: center; gap: 8px; font: 650 18px/1 var(--display); color: var(--ink); text-decoration: none; }
.brand em { font-style: italic; font-weight: 400; }
.brand svg { width: 22px; height: 22px; }
.top .stamp { font-size: 11px; padding: 4px 7px; }
.guard { margin-top: 40px; padding-top: 18px; border-top: 1px dashed var(--line); text-align: center; }
.guard p { margin: 4px 0; }
</style>
