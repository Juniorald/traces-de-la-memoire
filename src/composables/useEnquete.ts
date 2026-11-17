import { ref, watchEffect } from 'vue'
import type { Enquete } from '../types'
import { fetchEnquete } from '../services/api'

export function useEnquete(id: () => number) {
  const enquete = ref<Enquete | null>(null)
  const error = ref<string | null>(null)
  watchEffect(async () => {
    try { enquete.value = await fetchEnquete(id()) } catch (e) { error.value = (e as Error).message }
  })
  return { enquete, error }
}
