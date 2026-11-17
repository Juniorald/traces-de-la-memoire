<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import Fort3D from '../components/Fort3D.vue'
import PlanMap from '../components/PlanMap.vue'
import ProgressRail from '../components/ProgressRail.vue'
import { useEnquete } from '../composables/useEnquete'
import { useProgress } from '../stores/progress'

const props = defineProps<{ id: number }>()
const { enquete } = useEnquete(() => props.id)
const p = useProgress()
const router = useRouter()
const view = ref<'3d' | '2d'>('3d')
const current = computed(() => enquete.value?.etapes.find((e) => !p.isDone(e.ordre))?.ordre)
const allDone = computed(() => !!enquete.value && enquete.value.etapes.every((e) => p.isDone(e.ordre)))
const open = (ordre: number) => router.push(`/enquete/${props.id}/etape/${ordre}`)
</script>

<template>
  <section v-if="enquete" class="stack">
    <div>
      <p class="eyebrow">Dossier n° 01, le parcours</p>
      <h1>Le plan de l’enquête</h1>
    </div>
    <ProgressRail :total="enquete.etapes.length" :is-done="p.isDone" :current="current" />

    <div class="board">
      <div class="switch" role="tablist" aria-label="Type de plan">
        <button role="tab" :aria-selected="view === '3d'" :class="{ on: view === '3d' }" @click="view = '3d'">Maquette 3D</button>
        <button role="tab" :aria-selected="view === '2d'" :class="{ on: view === '2d' }" @click="view = '2d'">Plan 2D</button>
      </div>
      <Fort3D v-if="view === '3d'" mode="map" :etapes="enquete.etapes" :done="p.done" :is-reachable="p.isReachable" :current="current" @select="open" @unsupported="view = '2d'" />
      <PlanMap v-else :etapes="enquete.etapes" :done="p.done" :is-reachable="p.isReachable" :current="current" @select="open" />
      <p class="hand legend">{{ view === '3d' ? 'Faites pivoter la maquette, touchez une punaise' : 'Touchez une punaise pour ouvrir l’étape' }}</p>
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
.board { background: #c9a777; padding: 10px; border-radius: 4px; box-shadow: var(--shadow), inset 0 0 0 1px rgb(80 50 20 / .2); }
.board :deep(.plan) { border-radius: 2px; overflow: hidden; }
.switch { display: flex; gap: 4px; margin-bottom: 10px; background: rgb(60 35 15 / .18); padding: 3px; border-radius: 4px; }
.switch button { flex: 1; border: 0; padding: 8px; border-radius: 3px; background: transparent; font: 600 14px/1 var(--sans); color: #4a2f12; cursor: pointer; }
.switch button.on { background: var(--sheet); box-shadow: 0 1px 3px rgb(0 0 0 / .2); color: var(--ink); }
.legend { margin: 6px 0 0; text-align: center; color: #4a2f12; font-size: 20px; }
.steps { list-style: none; padding: 0; margin: 0; display: grid; gap: 12px; }
.fiche {
  display: flex; align-items: center; gap: 14px; width: 100%; padding: 14px 16px; text-align: left; font: inherit; color: inherit; cursor: pointer;
  border: 0; border-radius: 3px; background: var(--sheet); box-shadow: var(--shadow); transform: rotate(var(--r));
  border-left: 5px solid #cbb89a;
}
.fiche.cur { border-left-color: var(--red); }
.fiche.done { border-left-color: var(--plum); }
.fiche:disabled { opacity: .55; cursor: not-allowed; background: #f4ecdd; }
.num { font: 600 24px/1 var(--display); color: var(--mute); min-width: 18px; }
.cur .num { color: var(--red); }
.txt { flex: 1; display: grid; }
.txt strong { font: 600 18px/1.2 var(--display); }
.go { font: 22px/1 var(--hand); color: var(--red); }
.fiche .stamp { font-size: 11px; padding: 3px 6px; }
</style>
