<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import IllustrationFrame from '../components/IllustrationFrame.vue'
import SceneWindow from '../components/SceneWindow.vue'
import { useEnquete } from '../composables/useEnquete'
import { useProgress } from '../stores/progress'

const props = defineProps<{ id: number }>()
const { enquete } = useEnquete(() => props.id)
const p = useProgress()
const router = useRouter()
const complete = computed(() => !!enquete.value && enquete.value.etapes.every((e) => p.isDone(e.ordre)))
function restart() { p.reset(); router.push('/') }
</script>

<template>
  <section v-if="enquete" class="stack">
    <SceneWindow height="52vh" fallback="liens">
      <p class="eyebrow">Fresque collective</p>
      <h1>Les parcours se rejoignent</h1>
      <p class="hand sub">Le fil rouge relie maintenant les cinq lieux.</p>
    </SceneWindow>

    <div v-if="!complete" class="sheet stack">
      <p>La fresque s’ouvre une fois les {{ enquete.etapes.length }} pièces classées.</p>
      <RouterLink class="btn ghost" :to="`/enquete/${id}`">Retour au plan</RouterLink>
    </div>

    <template v-else>
      <div class="board">
        <IllustrationFrame name="liens" caption="Illustration – liens à documenter" />
        <span class="stamp ok solved in">Enquête classée</span>
      </div>
      <p class="small muted after sheet">Votre enquête rejoint d’autres parcours de femmes passées par le Fort. Chaque fil sera tendu uniquement à partir d’une source qui l’atteste (relation historique → archive).</p>

      <div class="carnet sheet">
        <p class="eyebrow">Votre carnet d’enquête</p>
        <ol class="recap">
          <li v-for="e in enquete.etapes" :key="e.id">
            <span class="t">{{ e.ordre }}. {{ e.titre }}</span>
            <span class="hand">{{ p.notes[e.id] || '—' }}</span>
          </li>
        </ol>
      </div>

      <button class="btn ghost" @click="restart">Rouvrir un dossier vierge</button>
    </template>
  </section>
</template>

<style scoped>
.board { position: relative; background: #c9a777; padding: 10px; border-radius: 4px; box-shadow: var(--shadow); }
.solved { position: absolute; left: 14px; bottom: -14px; font-size: 16px; background: rgb(251 247 239 / .7); transform: rotate(-5deg); background: var(--sheet); }
.after { margin-top: 30px; }
.sub { color: #f2cfb4; margin: 8px 0 0; }
.recap { list-style: none; padding: 0; margin: 10px 0 0; display: grid; gap: 10px; }
.recap li { display: grid; gap: 2px; padding-bottom: 10px; border-bottom: 1px dashed var(--line); }
.recap li:last-child { border: 0; padding-bottom: 0; }
.t { font: 13px/1.3 var(--type); color: var(--mute); }
.recap .hand { color: #24306b; font-size: 22px; }
</style>
