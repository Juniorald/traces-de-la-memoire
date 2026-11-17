<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import PlanMap from '../components/PlanMap.vue'
import ProgressRail from '../components/ProgressRail.vue'
import SceneWindow from '../components/SceneWindow.vue'
import { useEnquete } from '../composables/useEnquete'
import { useProgress } from '../stores/progress'
import { stageOk } from '../three/stage'

const props = defineProps<{ id: number }>()
const { enquete } = useEnquete(() => props.id)
const p = useProgress()
const router = useRouter()
const show2d = ref(false)
const current = computed(() => enquete.value?.etapes.find((e) => !p.isDone(e.ordre))?.ordre)
const allDone = computed(() => !!enquete.value && enquete.value.etapes.every((e) => p.isDone(e.ordre)))
const open = (ordre: number) => router.push(`/enquete/${props.id}/etape/${ordre}`)
</script>

<template>
  <section v-if="enquete" class="stack">
    <SceneWindow height="50vh" fallback="heroFort">
      <p class="eyebrow">Dossier n° 01, le parcours</p>
      <h1>Le plan de l’enquête</h1>
      <p v-if="stageOk" class="hint">Touchez une punaise sur le Fort</p>
    </SceneWindow>

    <div class="sheet rail-sheet">
      <ProgressRail :total="enquete.etapes.length" :is-done="p.isDone" :current="current" />
      <button class="toggle" :aria-expanded="show2d || !stageOk" @click="show2d = !show2d">
        {{ show2d || !stageOk ? 'Masquer le plan 2D' : 'Afficher le plan 2D (accessible)' }}
      </button>
      <PlanMap v-if="show2d || !stageOk" class="plan2d" :etapes="enquete.etapes" :done="p.done" :is-reachable="p.isReachable" :current="current" @select="open" />
    </div>

    <ul class="steps">
      <li v-for="(e, i) in enquete.etapes" :key="e.id" :style="{ '--r': `${[-0.5, 0.4, -0.3, 0.5, -0.4][i]}deg` }">
        <button class="fiche" :class="{ done: p.isDone(e.ordre), cur: e.ordre === current }" :disabled="!p.isReachable(e.ordre)" @click="open(e.ordre)">
          <span class="num">{{ e.ordre }}</span>
          <span class="txt">
            <strong>{{ e.titre }}</strong>
            <span class="small muted">{{ e.lieu?.nom ?? 'Sans lieu associé' }}</span>
          </span>
          <span v-if="p.isDone(e.ordre)" class="stamp ok">Classée</span>
          <span v-else-if="p.isReachable(e.ordre)" class="go">Ouvrir</span>
          <span v-else class="lock" aria-label="Verrouillée">🔒</span>
        </button>
      </li>
    </ul>

    <RouterLink v-if="allDone" class="btn red" :to="`/enquete/${id}/fresque`">Voir la fresque</RouterLink>
  </section>
</template>

<style scoped>
.hint { margin: 10px 0 0; font: 20px/1 var(--hand); color: #f2cfb4; }
h1 { margin-top: 6px; }
.toggle { margin-top: 14px; border: 0; background: none; padding: 0; color: var(--plum); font: 600 14px/1.2 var(--sans); text-decoration: underline; cursor: pointer; }
.plan2d { margin-top: 12px; border-radius: 3px; overflow: hidden; }
.steps { list-style: none; padding: 0; margin: 0; display: grid; gap: 12px; perspective: 900px; }
.fiche {
  display: flex; align-items: center; gap: 14px; width: 100%; padding: 14px 16px; text-align: left; font: inherit; color: inherit; cursor: pointer;
  border: 0; border-radius: 3px; background: var(--sheet); box-shadow: var(--shadow); transform: rotate(var(--r));
  border-left: 5px solid #cbb89a; transition: transform .25s cubic-bezier(.2,.8,.2,1), box-shadow .25s;
}
.fiche:hover:not(:disabled) { transform: rotateY(-8deg) rotateX(4deg) translateZ(18px); box-shadow: 0 18px 30px -12px rgb(0 0 0 / .55); }
.fiche:active:not(:disabled) { transform: rotateY(0) translateZ(-10px); }
.fiche.cur { border-left-color: var(--red); }
.fiche.done { border-left-color: var(--plum); }
.fiche:disabled { cursor: not-allowed; background: #e9dfcd; color: #8a7d72; }
.num { font: 600 24px/1 var(--display); color: var(--mute); min-width: 18px; }
.cur .num { color: var(--red); }
.txt { flex: 1; display: grid; }
.txt strong { font: 600 18px/1.2 var(--display); }
.go { font: 22px/1 var(--hand); color: var(--red); }
.fiche .stamp { font-size: 11px; padding: 3px 6px; }
</style>
