<script setup lang="ts">
import IllustrationFrame from './IllustrationFrame.vue'
import { stageOk } from '../three/stage'

// « Fenêtre » transparente sur le décor 3D, en haut de chaque page.
withDefaults(defineProps<{ height?: string; fallback?: string }>(), { height: '42vh', fallback: 'heroFort' })
</script>

<template>
  <div class="scene-window" :style="{ height }">
    <IllustrationFrame v-if="!stageOk" :name="fallback" class="fb" caption="Illustration" />
    <div class="over"><slot /></div>
  </div>
</template>

<style scoped>
.scene-window { position: relative; margin: 0 -18px; display: flex; align-items: flex-end; }
.fb { position: absolute; inset: 0; border-radius: 0; }
.fb :deep(svg) { height: 100%; }
.over { position: relative; width: 100%; padding: 48px 20px 18px; background: linear-gradient(transparent, rgb(26 14 32 / .62) 60%); color: #fbf3e8; text-shadow: 0 2px 18px rgb(20 10 25 / .6); }
.over :deep(h1) { color: #fbf3e8; }
.over :deep(.eyebrow) { color: #f2cfb4; }
</style>
