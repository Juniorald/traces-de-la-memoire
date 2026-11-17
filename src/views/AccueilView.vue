<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import DocStrip from '../components/DocStrip.vue'
import { useEnquete } from '../composables/useEnquete'
import { useProgress } from '../stores/progress'
import { setChapter } from '../stores/ui'
import { stage, stageOk } from '../three/stage'
import type { Archive } from '../types'

const { enquete } = useEnquete(() => 1)
const p = useProgress()
const router = useRouter()
const started = computed(() => p.done.length > 0)
const entering = ref(false)
setChapter('Dossier n° 01', 'Sur les traces d’une résistante', 'Fort de Romainville, Les Lilas')

const docs = computed<Archive[]>(() => (enquete.value?.etapes ?? []).flatMap((e) => [
  ...e.indices.map((i) => i.archive).filter((a): a is Archive => !!a?.src),
  ...(e.documents ?? []),
]))

// Entrée dans le Fort : la caméra file vers la porte, puis l'enquête s'ouvre.
function enter() {
  if (!enquete.value) return
  const go = () => router.push(`/enquete/${enquete.value!.id}`)
  if (!stageOk.value || matchMedia('(prefers-reduced-motion: reduce)').matches) return go()
  entering.value = true
  stage.gate()
  setTimeout(go, 1900)
}
</script>

<template>
  <section v-if="enquete" class="stack">
    <button class="btn red big" :disabled="entering" @click="enter">
      {{ entering ? 'Passage de la porte…' : started ? `Reprendre l’enquête (${p.done.length} sur ${enquete.etapes.length})` : 'Entrer dans le Fort' }}
    </button>
    <button v-if="started" class="btn ghost" @click="p.reset()">Recommencer depuis le début</button>

    <blockquote class="sheet tape">
      <p class="q">« {{ enquete.questionCentrale }} »</p>
      <p class="hand note">À vous de mener l’enquête, trace après trace.</p>
    </blockquote>

    <ol class="how">
      <li><span class="n">1</span><div><strong>Entrez dans le Fort</strong><p class="small muted">Faites pivoter la maquette, touchez une punaise. Le GPS n’est jamais obligatoire.</p></div></li>
      <li><span class="n">2</span><div><strong>Examinez les pièces</strong><p class="small muted">Sur chaque lieu, des photographies d’archives sont exposées : touchez-les pour les agrandir.</p></div></li>
      <li><span class="n">3</span><div><strong>Tirez le fil rouge</strong><p class="small muted">Une fresque collective, sans score ni classement.</p></div></li>
    </ol>

    <section>
      <h2>Les photographies du Fort</h2>
      <p class="small muted intro">Tirages conservés par le Mémorial national des femmes en résistance et en déportation, dont une série de Brassaï prise à la Libération.</p>
      <DocStrip :docs="docs" />
    </section>
  </section>
</template>

<style scoped>
.big { font-size: 18px; padding: 17px 18px; }
blockquote { margin: 22px 0 0; }
.q { font: italic 500 19px/1.45 var(--display); margin: 0 0 8px; }
.note { margin: 0; text-align: right; }
.how { list-style: none; margin: 0; padding: 0; display: grid; gap: 14px; }
.how li { display: flex; gap: 14px; align-items: flex-start; }
.how .n { flex: none; display: grid; place-items: center; width: 30px; height: 30px; border-radius: 50%; border: 1.5px solid var(--red); font: 600 15px/1 var(--display); color: var(--red); }
.how p { margin: 2px 0 0; }
h2 { font-size: 24px; margin-top: 10px; }
.intro { margin: 6px 0 12px; }
</style>
