<script setup lang="ts">
import { onBeforeUnmount, onMounted } from 'vue'
import { docUrl, viewer } from '../stores/ui'

const close = () => { viewer.value = null }
const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close() }
onMounted(() => addEventListener('keydown', onKey))
onBeforeUnmount(() => removeEventListener('keydown', onKey))
</script>

<template>
  <Transition name="zoom">
    <div v-if="viewer?.src" class="viewer" role="dialog" aria-modal="true" :aria-label="viewer.titre" @click.self="close">
      <figure>
        <img :src="docUrl(viewer.src)" :alt="viewer.legende ?? viewer.titre" />
        <figcaption>
          <strong>{{ viewer.titre }}</strong>
          <span v-if="viewer.legende">{{ viewer.legende }}</span>
          <span class="credit">{{ viewer.auteur }}<template v-if="viewer.date">, {{ viewer.date }}</template><template v-if="viewer.cote">, n° {{ viewer.cote }}</template>. {{ viewer.source }}. {{ viewer.droits }}.</span>
        </figcaption>
      </figure>
      <button class="close" aria-label="Fermer" @click="close">✕</button>
    </div>
  </Transition>
</template>

<style scoped>
.viewer { position: fixed; inset: 0; z-index: 3000; background: rgb(16 9 20 / .92); display: grid; place-items: center; padding: 20px; backdrop-filter: blur(6px); }
figure { margin: 0; max-width: min(960px, 100%); display: grid; gap: 12px; }
img { max-width: 100%; max-height: 72dvh; object-fit: contain; justify-self: center; background: #fbf7ef; padding: 10px; box-shadow: 0 20px 60px rgb(0 0 0 / .6); }
figcaption { color: #f3e6d6; display: grid; gap: 4px; font-size: 14.5px; max-width: 70ch; }
figcaption strong { font: 600 20px/1.2 var(--display); }
.credit { font-size: 12px; opacity: .75; }
.close { position: absolute; top: 14px; right: 14px; width: 44px; height: 44px; border-radius: 50%; border: 0; background: #fbf7ef; color: var(--ink); font-size: 18px; cursor: pointer; }
.zoom-enter-active, .zoom-leave-active { transition: opacity .3s ease; }
.zoom-enter-active img { transition: transform .45s cubic-bezier(.2,.8,.2,1); }
.zoom-enter-from { opacity: 0; }
.zoom-enter-from img { transform: perspective(900px) rotateY(-25deg) scale(.8); }
.zoom-leave-to { opacity: 0; }
</style>
