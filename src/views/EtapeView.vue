<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import ArchiveSlot from '../components/ArchiveSlot.vue'
import IllustrationFrame from '../components/IllustrationFrame.vue'
import ProgressRail from '../components/ProgressRail.vue'
import QuestionBlock from '../components/QuestionBlock.vue'
import { useEnquete } from '../composables/useEnquete'
import { useProgress } from '../stores/progress'

const props = defineProps<{ id: number; ordre: number }>()
const { enquete } = useEnquete(() => props.id)
const p = useProgress()
const router = useRouter()

const etape = computed(() => enquete.value?.etapes.find((e) => e.ordre === props.ordre))
const total = computed(() => enquete.value?.etapes.length ?? 0)
const isLast = computed(() => props.ordre === total.value)
const reachable = computed(() => p.isReachable(props.ordre))
const unlocked = computed(() => p.isUnlocked(props.ordre))
const chosen = computed(() => (etape.value ? p.answers[etape.value.question.id] : undefined))
const note = computed({
  get: () => (etape.value ? p.notes[etape.value.id] ?? '' : ''),
  set: (v: string) => { if (etape.value) p.notes[etape.value.id] = v },
})

function next() {
  p.complete(props.ordre)
  router.push(isLast.value ? `/enquete/${props.id}/fresque` : `/enquete/${props.id}/etape/${props.ordre + 1}`)
}
</script>

<template>
  <section v-if="etape" class="stack">
    <ProgressRail :total="total" :is-done="p.isDone" :current="ordre" />

    <header class="head">
      <p class="eyebrow">Étape {{ String(ordre).padStart(2, '0') }} / {{ String(total).padStart(2, '0') }} · {{ etape.lieu?.nom }}</p>
      <h1>{{ etape.titre }}</h1>
    </header>

    <IllustrationFrame v-if="etape.illustration" :name="etape.illustration" />

    <!-- Étape pas encore accessible -->
    <div v-if="!reachable" class="sheet stack">
      <p>Classez d’abord l’étape {{ ordre - 1 }} pour ouvrir celle-ci.</p>
      <RouterLink class="btn ghost" :to="`/enquete/${id}/etape/${ordre - 1}`">Aller à l’étape {{ ordre - 1 }}</RouterLink>
    </div>

    <!-- Arrivée sur le lieu : QR code ou mode manuel (repli sans GPS) -->
    <div v-else-if="!unlocked" class="sheet tape stack lock">
      <span class="stamp">Pièce scellée</span>
      <p class="rdv">Rendez-vous au point<br /><strong>« {{ etape.lieu?.nom }} »</strong></p>
      <p class="small muted">{{ etape.lieu?.description }} Scannez le QR code posé sur place ou confirmez votre arrivée.</p>
      <button class="btn red" @click="p.unlock(ordre)">Je suis arrivé·e au point</button>
      <RouterLink class="btn ghost" :to="`/e/${etape.id}`">Simuler le scan du QR code</RouterLink>
    </div>

    <template v-else>
      <article class="sheet tilt-l">
        <p class="eyebrow">Consigne</p>
        <p class="consigne">{{ etape.consigne }}</p>
        <div v-for="i in etape.indices" :key="i.id">
          <p class="hand indice">Indice {{ i.ordre }} : {{ i.consigne }}</p>
          <ArchiveSlot v-if="i.archive" :archive="i.archive" :numero="etape.ordre" />
        </div>
      </article>

      <article class="sheet">
        <QuestionBlock :question="etape.question" :chosen="chosen" @choose="(o) => p.answer(etape!.question.id, o)" />
      </article>

      <article class="carnet">
        <label for="note"><span class="eyebrow">Carnet d’enquête</span> <span class="small muted">· enregistré sur cet appareil</span></label>
        <textarea id="note" v-model="note" placeholder="Mes observations, mes hypothèses…" />
      </article>

      <button class="btn red" :disabled="!chosen" @click="next">
        {{ isLast ? 'Classer la pièce et tirer le fil rouge →' : 'Classer la pièce · étape suivante →' }}
      </button>
      <p v-if="!chosen" class="small muted center">Choisissez une réponse pour continuer : chaque réponse est expliquée.</p>
    </template>

    <RouterLink class="btn ghost" :to="`/enquete/${id}`">← Retour au plan</RouterLink>
  </section>
</template>

<style scoped>
.head h1 { margin-top: 6px; }
.consigne { font: 500 20px/1.4 var(--display); margin: 6px 0 4px; }
.indice { margin: 14px 0 0; }
.lock { text-align: center; padding-top: 26px; }
.lock .stamp { font-size: 15px; }
.rdv { font: 400 20px/1.35 var(--display); margin: 14px 0 0; }
.carnet { background: #fffdf6; padding: 14px 12px 6px; border-radius: 3px; box-shadow: var(--shadow); }
.carnet label { display: block; padding-left: 4px; margin-bottom: 6px; }
.center { text-align: center; margin-top: -4px; }
</style>
