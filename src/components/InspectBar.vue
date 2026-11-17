<script setup lang="ts">
import { flipped, inspecting } from '../stores/ui'
import { stage } from '../three/stage'

function flip() { flipped.value = !flipped.value; stage.flip() }
function close() { stage.release(); inspecting.value = null; flipped.value = false }
</script>

<template>
  <Transition name="rise">
    <aside v-if="inspecting" class="inspect" aria-live="polite">
      <p class="hint">Glissez pour faire tourner le tirage</p>
      <h2>{{ inspecting.titre }}</h2>
      <p class="side">{{ flipped ? 'Verso : annotations, tampons et numéros portés au dos.' : inspecting.legende }}</p>
      <p class="credit">{{ inspecting.auteur }}<template v-if="inspecting.date">, {{ inspecting.date }}</template><template v-if="inspecting.cote">, n° {{ inspecting.cote }}</template>. {{ inspecting.source }}.</p>
      <div class="actions">
        <button v-if="inspecting.verso" class="btn red" @click="flip">{{ flipped ? 'Revoir le recto' : 'Retourner le tirage' }}</button>
        <button class="btn ghost" @click="close">Reposer</button>
      </div>
    </aside>
  </Transition>
</template>

<style scoped>
.inspect {
  position: fixed; z-index: 30; left: 50%; bottom: 0; transform: translateX(-50%); width: min(560px, 100%);
  padding: 14px 18px calc(18px + env(safe-area-inset-bottom)); border-radius: 18px 18px 0 0;
  background: color-mix(in srgb, var(--paper) 95%, transparent); backdrop-filter: blur(8px); box-shadow: 0 -18px 50px rgb(10 5 15 / .45);
}
.hint { margin: 0 0 6px; text-align: center; font: 18px/1 var(--hand); color: var(--plum); }
h2 { font-size: 22px; }
.side { margin: 6px 0 4px; font-size: 14.5px; }
.credit { margin: 0 0 12px; font-size: 12px; color: var(--mute); }
.actions { display: flex; gap: 10px; }
.actions .btn { flex: 1; padding: 13px 12px; font-size: 15px; }
.rise-enter-active, .rise-leave-active { transition: transform .45s cubic-bezier(.2,.8,.2,1), opacity .3s; }
.rise-enter-from, .rise-leave-to { transform: translate(-50%, 100%); opacity: 0; }
@media (min-width: 960px) { .inspect { left: auto; right: 18px; bottom: 18px; transform: none; width: 440px; border-radius: 16px; } .rise-enter-from, .rise-leave-to { transform: translateY(40px); } }
</style>
