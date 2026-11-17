import { reactive, ref } from 'vue'
import type { Archive } from '../types'

/** Titre de chapitre affiché par-dessus la scène 3D. */
export const chapter = reactive({ eyebrow: '', title: '', sub: '' })
export function setChapter(eyebrow: string, title: string, sub = '') { Object.assign(chapter, { eyebrow, title, sub }) }

/** Panneau de contenu : replié (la 3D domine) ou déplié. */
export const panelOpen = ref(false)

/** Visionneuse plein écran (repli 2D) d'un document d'archives. */
export const viewer = ref<Archive | null>(null)

/** Tirage pris en main dans la scène 3D. */
export const inspecting = ref<Archive | null>(null)
export const flipped = ref(false)

/** Le visiteur a déjà regardé autour de lui (on masque l'aide). */
export const looked = ref(false)

/** Ouvre un document : dans la 3D si la scène sait le présenter, sinon dans la visionneuse. */
export const docHandler: { open: ((d: Archive) => boolean) | null } = { open: null }
export function openDoc(d: Archive) { if (!docHandler.open?.(d)) viewer.value = d }

export const docUrl = (src: string) => `${import.meta.env.BASE_URL}${src}`
