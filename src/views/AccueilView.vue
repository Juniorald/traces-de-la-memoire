<script setup lang="ts">
import { computed } from 'vue'
import CommonsPhoto from '../components/CommonsPhoto.vue'
import SceneWindow from '../components/SceneWindow.vue'
import { useEnquete } from '../composables/useEnquete'
import { useProgress } from '../stores/progress'
import galerie from '../data/galerie.json'
import type { Photo } from '../types'

const { enquete } = useEnquete(() => 1)
const p = useProgress()
const started = computed(() => p.done.length > 0)
const photos = galerie as Photo[]
</script>

<template>
  <section v-if="enquete" class="stack">
    <SceneWindow height="64vh">
      <span class="stamp hero-stamp in">Dossier n° 01</span>
      <h1 class="big">{{ enquete.titre }}</h1>
      <p class="where">Fort de Romainville, Les Lilas</p>
      <p class="hint">Glissez pour tourner autour du Fort</p>
    </SceneWindow>

    <blockquote class="sheet tape">
      <p class="q">« {{ enquete.questionCentrale }} »</p>
      <p class="hand note">À vous de mener l’enquête, trace après trace.</p>
    </blockquote>

    <ol class="how sheet">
      <li><span class="n">1</span><div><strong>Rendez-vous au point</strong><p class="small muted">Plan, QR code ou mode manuel : le GPS n’est jamais obligatoire.</p></div></li>
      <li><span class="n">2</span><div><strong>Examinez les pièces</strong><p class="small muted">Archives, témoignages et reconstitutions sont toujours identifiés.</p></div></li>
      <li><span class="n">3</span><div><strong>Tirez le fil rouge</strong><p class="small muted">Une fresque collective, sans score ni classement.</p></div></li>
    </ol>

    <RouterLink class="btn red" :to="`/enquete/${enquete.id}`">
      {{ started ? `Reprendre le dossier (${p.done.length} sur ${enquete.etapes.length})` : 'Ouvrir le dossier' }}
    </RouterLink>
    <button v-if="started" class="btn ghost light" @click="p.reset()">Recommencer depuis le début</button>

    <section class="today sheet">
      <h2>Le Fort aujourd’hui</h2>
      <p class="small muted">Photographies sous licence libre (Wikimedia Commons). Ce ne sont pas des archives de l’enquête.</p>
      <div class="strip">
        <CommonsPhoto v-for="ph in photos" :key="ph.fichier" :photo="ph" :width="700" />
      </div>
    </section>
  </section>
</template>

<style scoped>
.big { font-size: clamp(36px, 11vw, 50px); margin-top: 12px; }
.hero-stamp { color: #ff7a7a; mix-blend-mode: normal; }
.where { margin: 8px 0 0; font: 23px/1 var(--hand); color: #f2cfb4; }
.hint { margin: 14px 0 0; font: 17px/1 var(--hand); color: #f2cfb4; opacity: .8; }
blockquote { margin: 26px 0 0; }
.q { font: italic 500 19px/1.45 var(--display); margin: 0 0 8px; }
.note { margin: 0; text-align: right; }
.how { list-style: none; margin: 0; display: grid; gap: 14px; }
.how li { display: flex; gap: 14px; align-items: flex-start; }
.how .n { flex: none; display: grid; place-items: center; width: 30px; height: 30px; border-radius: 50%; border: 1.5px solid var(--red); font: 600 15px/1 var(--display); color: var(--red); }
.how p { margin: 2px 0 0; }
.today h2 { font-size: 26px; }
.today > p { margin: 6px 0 14px; }
.strip { display: grid; grid-auto-flow: column; grid-auto-columns: 82%; gap: 14px; overflow-x: auto; scroll-snap-type: x mandatory; padding: 4px 2px 12px; }
.strip > * { scroll-snap-align: start; }
</style>
