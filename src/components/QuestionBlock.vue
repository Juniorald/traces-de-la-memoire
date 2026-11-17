<script setup lang="ts">
import { computed } from 'vue'
import type { Question } from '../types'

const props = defineProps<{ question: Question; chosen?: string }>()
const emit = defineEmits<{ choose: [id: string] }>()
const answered = computed(() => !!props.chosen)
const good = computed(() => props.question.options.find((o) => o.id === props.chosen)?.correcte)
</script>

<template>
  <fieldset class="q">
    <legend>
      <span class="eyebrow">Question d’enquête</span>
      <h3>{{ question.libelle }}</h3>
    </legend>
    <div class="cards">
      <button
        v-for="(o, i) in question.options" :key="o.id" type="button" class="opt"
        :class="{ picked: chosen === o.id, right: answered && o.correcte }"
        :style="{ '--r': `${[-0.8, 0.6, -0.4][i % 3]}deg` }"
        :aria-pressed="chosen === o.id" @click="emit('choose', o.id)">
        <span class="letter">{{ o.id.toUpperCase() }}</span>
        <span>{{ o.texte }}</span>
        <span v-if="answered && o.correcte" class="check" aria-label="Bonne réponse">✓</span>
      </button>
    </div>
    <Transition name="fade">
      <div v-if="answered" class="explain" role="status">
        <p class="hand">{{ good ? 'Bien vu !' : 'Pas tout à fait… et ce n’est pas grave.' }}</p>
        <p>{{ question.explication }}</p>
      </div>
    </Transition>
  </fieldset>
</template>

<style scoped>
.q { border: 0; padding: 0; margin: 0; min-width: 0; }
legend { padding: 0; margin-bottom: 12px; display: grid; gap: 6px; }
h3 { font-size: 21px; }
.cards { display: grid; gap: 10px; }
.opt {
  position: relative; display: flex; align-items: center; gap: 12px; width: 100%; text-align: left;
  padding: 14px 14px 14px 12px; border-radius: 3px; cursor: pointer; font: inherit; color: var(--ink);
  border: 0; transform: rotate(var(--r));
  background: linear-gradient(transparent 0 30px, transparent 30px), #fffdf8;
  background-image: repeating-linear-gradient(transparent 0 23px, #e3ecf6 23px 24px);
  box-shadow: 0 1px 2px rgb(60 40 20 / .15), 0 4px 10px -6px rgb(60 40 20 / .3);
  transition: transform .15s ease, box-shadow .15s ease;
}
.opt:hover { transform: rotate(0) translateY(-2px); }
.letter { flex: none; display: grid; place-items: center; width: 30px; height: 30px; border-radius: 50%; border: 1.5px solid var(--ink); font: 15px/1 var(--type); }
.opt.picked { box-shadow: 0 0 0 2px var(--ink), 0 6px 14px -6px rgb(60 40 20 / .4); }
.opt.picked .letter { background: var(--ink); color: #fff; }
.opt.right { box-shadow: 0 0 0 2px var(--ok); }
.opt.right .letter { background: var(--ok); border-color: var(--ok); color: #fff; }
.check { margin-left: auto; font: 700 26px/1 var(--hand); color: var(--ok); }
.explain { margin-top: 16px; padding: 12px 14px; border-left: 3px solid var(--red); background: rgb(200 35 44 / .05); }
.explain p { margin: 0; }
.explain .hand { margin-bottom: 4px; }
</style>
