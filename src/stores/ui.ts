import { reactive, ref } from 'vue'
import type { Archive } from '../types'

/** Titre de chapitre affiché par-dessus la scène 3D. */
export const chapter = reactive({ eyebrow: '', title: '', sub: '' })
export function setChapter(eyebrow: string, title: string, sub = '') { Object.assign(chapter, { eyebrow, title, sub }) }

/** Panneau de contenu : replié (la 3D domine) ou déplié. */
export const panelOpen = ref(false)

/** Visionneuse plein écran d'un document d'archives. */
export const viewer = ref<Archive | null>(null)

export const docUrl = (src: string) => `${import.meta.env.BASE_URL}${src}`
