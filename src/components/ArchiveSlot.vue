<script setup lang="ts">
import { computed } from 'vue'
import type { Archive } from '../types'

const props = defineProps<{ archive: Archive; numero: number }>()
const label = computed(() => ({ archive: 'Archive', temoignage: 'Témoignage', reconstitution: 'Reconstitution' }[props.archive.nature]))
const verified = computed(() => props.archive.statut === 'publie')
const missing = (v: string | null) => v ?? '— à renseigner'
</script>

<template>
  <figure class="doc">
    <div class="folder">
      <span class="tab">Pièce n° {{ String(numero).padStart(2, '0') }} · {{ label }}</span>
      <div class="media" :class="archive.nature">
        <span class="kind">{{ archive.type }}</span>
        <span class="title">{{ archive.titre }}</span>
        <span class="slot">emplacement réservé au document original</span>
      </div>
      <span class="stamp" :class="{ ok: verified }">{{ verified ? 'Vérifiée' : 'À authentifier' }}</span>
      <span v-if="archive.nature === 'reconstitution'" class="stamp plum second">Reconstitution</span>
    </div>
    <dl>
      <dt>Source</dt><dd>{{ missing(archive.source) }}</dd>
      <dt>Cote</dt><dd>{{ missing(archive.cote) }}</dd>
      <dt>Droits</dt><dd>{{ missing(archive.droits) }}</dd>
    </dl>
  </figure>
</template>

<style scoped>
.doc { margin: 0; }
.folder { position: relative; background: #d9bf8f; border-radius: 0 6px 6px 6px; padding: 14px; margin-top: 18px; box-shadow: inset 0 0 0 1px rgb(120 90 40 / .25); }
.tab { position: absolute; left: 0; top: -20px; background: #d9bf8f; padding: 4px 12px 2px; border-radius: 6px 6px 0 0; font: 12px/1.3 var(--type); color: #5a4321; }
.media {
  min-height: 160px; display: grid; place-content: center; gap: 6px; text-align: center; padding: 18px;
  background: var(--sheet); border: 1px solid #e3d6bd; box-shadow: 0 2px 6px rgb(60 40 20 / .18); transform: rotate(-1deg);
}
.kind { font: 11px/1 var(--type); letter-spacing: .1em; text-transform: uppercase; color: var(--plum); }
.title { font: 600 17px/1.25 var(--display); }
.slot { font: 18px/1 var(--hand); color: var(--mute); }
.stamp { position: absolute; right: 18px; bottom: 18px; background: rgb(251 247 239 / .5); }
.stamp.second { right: auto; left: 22px; transform: rotate(5deg); }
dl { display: grid; grid-template-columns: auto 1fr; gap: 3px 14px; margin: 12px 2px 0; font: 13px/1.45 var(--type); }
dt { color: var(--mute); }
dd { margin: 0; color: var(--ink); opacity: .7; }
</style>
