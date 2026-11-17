<script setup lang="ts">
import { computed } from 'vue'
import IllustrationFrame from '../components/IllustrationFrame.vue'
import { useEnquete } from '../composables/useEnquete'
import { useProgress } from '../stores/progress'

const { enquete } = useEnquete(() => 1)
const p = useProgress()
const started = computed(() => p.done.length > 0)
</script>

<template>
  <section v-if="enquete" class="stack">
    <div class="hero">
      <div class="photo tilt"><IllustrationFrame name="heroFort" caption="Illustration" /><figcaption>Fort de Romainville</figcaption></div>
      <span class="stamp big">Dossier n° 01</span>
    </div>

    <div>
      <p class="eyebrow">Enquête pilote · Les Lilas</p>
      <h1>{{ enquete.titre }}</h1>
    </div>

    <blockquote class="sheet tape">
      <p class="q">« {{ enquete.questionCentrale }} »</p>
      <p class="hand note">→ à vous de mener l’enquête, trace après trace.</p>
    </blockquote>

    <ol class="how">
      <li><span class="n">01</span><div><strong>Rendez-vous au point</strong><p class="small muted">Plan, QR code ou mode manuel : le GPS n’est jamais obligatoire.</p></div></li>
      <li><span class="n">02</span><div><strong>Examinez les pièces</strong><p class="small muted">Archives, témoignages et reconstitutions sont toujours identifiés.</p></div></li>
      <li><span class="n">03</span><div><strong>Tirez le fil rouge</strong><p class="small muted">Une fresque collective, sans score ni classement.</p></div></li>
    </ol>

    <RouterLink class="btn red" :to="`/enquete/${enquete.id}`">
      {{ started ? `Reprendre le dossier · ${p.done.length}/${enquete.etapes.length}` : 'Ouvrir le dossier' }} →
    </RouterLink>
    <button v-if="started" class="btn ghost" @click="p.reset()">Recommencer depuis le début</button>
  </section>
</template>

<style scoped>
.hero { position: relative; padding: 6px 4px 10px; }
.tilt { transform: rotate(-1.6deg); }
.hero .big { position: absolute; right: -2px; top: -4px; font-size: 16px; padding: 7px 12px; transform: rotate(-8deg); background: rgb(251 247 239 / .6); }
blockquote { margin: 26px 0 0; }
.q { font: italic 500 19px/1.4 var(--display); margin: 0 0 8px; }
.note { margin: 0; text-align: right; }
.how { list-style: none; margin: 0; padding: 0; display: grid; gap: 14px; }
.how li { display: flex; gap: 14px; align-items: flex-start; }
.how .n { flex: none; font: 22px/1 var(--type); color: var(--red); padding-top: 2px; }
.how p { margin: 2px 0 0; }
</style>
