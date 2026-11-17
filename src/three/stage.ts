import { ref, shallowRef } from 'vue'
import type { FortScene } from './fortScene'

/** Scène 3D unique, partagée par toutes les pages du site. */
export const stageScene = shallowRef<FortScene | null>(null)
/** false si WebGL est indisponible : le site bascule en mode 2D. */
export const stageOk = ref(true)

export const stage = {
  ping: (ordre: number) => stageScene.value?.ping(ordre),
  nudge: () => stageScene.value?.nudge(),
  scroll: (f: number) => stageScene.value?.setScroll(f),
  panel: (open: boolean) => stageScene.value?.setPanel(open),
  /** Plan rapproché sur la porte du Fort (entrée dans l'enquête). */
  gate: () => stageScene.value?.setView({ kind: 'gate' }),
  flip: () => stageScene.value?.flip(),
  release: () => stageScene.value?.release(),
  gyro: (on: boolean) => (on ? stageScene.value?.enableGyro() ?? Promise.resolve(false) : (stageScene.value?.disableGyro(), Promise.resolve(false))),
}
