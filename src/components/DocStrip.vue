<script setup lang="ts">
import type { Archive } from '../types'
import { docUrl, openDoc } from '../stores/ui'

defineProps<{ docs: Archive[] }>()
</script>

<template>
  <ul class="docs">
    <li v-for="(d, i) in docs" :key="d.id" :style="{ '--r': `${[-1.2, 0.9, -0.6, 1.1][i % 4]}deg` }">
      <button class="tirage" :aria-label="`Agrandir : ${d.titre}`" @click="openDoc(d)">
        <img :src="docUrl(d.src!)" :alt="d.legende ?? d.titre" loading="lazy" />
        <span class="cap">{{ d.titre }}</span>
        <span class="by">{{ d.auteur }}</span>
      </button>
    </li>
  </ul>
</template>

<style scoped>
.docs { list-style: none; margin: 0; padding: 4px 2px 10px; display: grid; grid-auto-flow: column; grid-auto-columns: 62%; gap: 14px; overflow-x: auto; scroll-snap-type: x mandatory; perspective: 900px; }
.docs li { scroll-snap-align: start; }
.tirage {
  width: 100%; border: 0; padding: 8px 8px 10px; background: #fffdf8; text-align: left; cursor: zoom-in;
  box-shadow: 0 2px 4px rgb(60 40 20 / .2), 0 10px 20px -10px rgb(60 40 20 / .4);
  transform: rotate(var(--r)); transition: transform .3s cubic-bezier(.2,.8,.2,1), box-shadow .3s;
  display: grid; gap: 6px; font: inherit; color: var(--ink);
}
.tirage:hover, .tirage:focus-visible { transform: rotateY(-10deg) translateZ(20px); box-shadow: 0 20px 30px -12px rgb(0 0 0 / .5); }
img { width: 100%; aspect-ratio: 4 / 3; object-fit: cover; display: block; filter: contrast(1.04); }
.cap { font: 19px/1.1 var(--hand); }
.by { font-size: 11.5px; color: var(--mute); }
</style>
