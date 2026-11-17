<script setup lang="ts">
import { computed, ref } from 'vue'
import CommonsPhoto from '../components/CommonsPhoto.vue'
import Fort3D from '../components/Fort3D.vue'
import IllustrationFrame from '../components/IllustrationFrame.vue'
import { useEnquete } from '../composables/useEnquete'
import { useProgress } from '../stores/progress'
import galerie from '../data/galerie.json'
import type { Photo } from '../types'

const { enquete } = useEnquete(() => 1)
const p = useProgress()
const started = computed(() => p.done.length > 0)
const no3d = ref(false)
const photos = galerie as Photo[]
</script>

<template>
  <section v-if="enquete" class="stack">
    <div class="hero">
      <Fort3D v-if="!no3d" mode="hero" :etapes="enquete.etapes" :done="p.done" :is-reachable="p.isReachable" @unsupported="no3d = true" />
      <IllustrationFrame v-else name="heroFort" />
      <div class="hero-text">
        <span class="stamp">Dossier n° 01</span>
        <h1>{{ enquete.titre }}</h1>
        <p class="where">Fort de Romainville, Les Lilas</p>
      </div>
      <p class="hint">Maquette schématique, faites-la pivoter</p>
    </div>

    <blockquote class="sheet tape">
      <p class="q">« {{ enquete.questionCentrale }} »</p>
      <p class="hand note">À vous de mener l’enquête, trace après trace.</p>
    </blockquote>

    <ol class="how">
      <li><span class="n">1</span><div><strong>Rendez-vous au point</strong><p class="small muted">Plan, QR code ou mode manuel : le GPS n’est jamais obligatoire.</p></div></li>
      <li><span class="n">2</span><div><strong>Examinez les pièces</strong><p class="small muted">Archives, témoignages et reconstitutions sont toujours identifiés.</p></div></li>
      <li><span class="n">3</span><div><strong>Tirez le fil rouge</strong><p class="small muted">Une fresque collective, sans score ni classement.</p></div></li>
    </ol>

    <RouterLink class="btn red" :to="`/enquete/${enquete.id}`">
      {{ started ? `Reprendre le dossier (${p.done.length} sur ${enquete.etapes.length})` : 'Ouvrir le dossier' }}
    </RouterLink>
    <button v-if="started" class="btn ghost" @click="p.reset()">Recommencer depuis le début</button>

    <section class="today">
      <h2>Le Fort aujourd’hui</h2>
      <p class="small muted">Photographies sous licence libre (Wikimedia Commons). Ce ne sont pas des archives de l’enquête.</p>
      <div class="strip">
        <CommonsPhoto v-for="ph in photos" :key="ph.fichier" :photo="ph" :width="700" />
      </div>
    </section>
  </section>
</template>

<style scoped>
.hero { position: relative; margin: -18px -18px 0; height: min(68vh, 560px); overflow: hidden; }
.hero :deep(.fort3d), .hero :deep(.illus) { position: absolute; inset: 0; height: 100%; border-radius: 0; }
.hero-text {
  position: absolute; left: 0; right: 0; bottom: 0; padding: 70px 20px 22px; pointer-events: none;
  background: linear-gradient(transparent, rgb(30 18 36 / .78) 55%);
  color: #fbf3e8;
}
.hero-text .stamp { color: #ff6b6b; background: transparent; mix-blend-mode: normal; }
.hero h1 { font-size: clamp(34px, 10vw, 46px); margin-top: 12px; color: #fbf3e8; }
.where { margin: 6px 0 0; font: 22px/1 var(--hand); color: #f2cfb4; }
.hint { position: absolute; top: 12px; right: 14px; margin: 0; font: 18px/1 var(--hand); color: #f2cfb4; opacity: .85; pointer-events: none; }
blockquote { margin: 26px 0 0; }
.q { font: italic 500 19px/1.45 var(--display); margin: 0 0 8px; }
.note { margin: 0; text-align: right; }
.how { list-style: none; margin: 0; padding: 0; display: grid; gap: 14px; }
.how li { display: flex; gap: 14px; align-items: flex-start; }
.how .n { flex: none; display: grid; place-items: center; width: 30px; height: 30px; border-radius: 50%; border: 1.5px solid var(--red); font: 600 15px/1 var(--display); color: var(--red); }
.how p { margin: 2px 0 0; }
.today { margin-top: 34px; }
.today h2 { font-size: 26px; }
.today > p { margin: 6px 0 14px; }
.strip { display: grid; grid-auto-flow: column; grid-auto-columns: 78%; gap: 14px; overflow-x: auto; scroll-snap-type: x mandatory; padding: 4px 4px 14px; margin: 0 -18px; padding-left: 18px; }
.strip > * { scroll-snap-align: start; }
</style>
