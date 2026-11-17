import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

/**
 * Progression du visiteur, conservée localement dans le navigateur
 * (pas de compte, pas de données personnelles envoyées au serveur).
 */
interface Saved {
  unlocked: number[]
  done: number[]
  answers: Record<number, string>
  notes: Record<number, string>
}
const KEY = 'traces-memoire:progression:v1'

function load(): Saved {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return JSON.parse(raw)
  } catch { /* stockage indisponible : on repart de zéro */ }
  return { unlocked: [], done: [], answers: {}, notes: {} }
}

export const useProgress = defineStore('progress', () => {
  const s = load()
  const unlocked = ref<number[]>(s.unlocked)
  const done = ref<number[]>(s.done)
  const answers = ref<Record<number, string>>(s.answers)
  const notes = ref<Record<number, string>>(s.notes)

  watch([unlocked, done, answers, notes], () => {
    try {
      localStorage.setItem(KEY, JSON.stringify({ unlocked: unlocked.value, done: done.value, answers: answers.value, notes: notes.value }))
    } catch { /* ignoré */ }
  }, { deep: true })

  const isUnlocked = (ordre: number) => unlocked.value.includes(ordre)
  const isDone = (ordre: number) => done.value.includes(ordre)
  /** Une étape est accessible si la précédente est terminée (ou si c'est la première). */
  const isReachable = (ordre: number) => ordre === 1 || isDone(ordre - 1)

  function unlock(ordre: number) { if (!isUnlocked(ordre)) unlocked.value.push(ordre) }
  function complete(ordre: number) { if (!isDone(ordre)) done.value.push(ordre) }
  function answer(questionId: number, optionId: string) { answers.value[questionId] = optionId }
  function reset() { unlocked.value = []; done.value = []; answers.value = {}; notes.value = {} }

  return { unlocked, done, answers, notes, isUnlocked, isDone, isReachable, unlock, complete, answer, reset }
})
