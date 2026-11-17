import { ref, shallowRef } from 'vue'
import type { FortScene } from './fortScene'

/** Scène 3D unique, partagée par toutes les pages du site. */
export const stageScene = shallowRef<FortScene | null>(null)
/** false si WebGL est indisponible : le site bascule en mode 2D. */
export const stageOk = ref(true)

export const stage = {
  ping: (ordre: number) => stageScene.value?.ping(ordre),
  scroll: (f: number) => stageScene.value?.setScroll(f),
  /** Plan rapproché sur la porte du Fort (entrée dans l'enquête). */
  gate: () => stageScene.value?.setView({ kind: 'gate' }),
}
