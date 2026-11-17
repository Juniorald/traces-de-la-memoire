<script setup lang="ts">
import { computed, ref } from 'vue'
import type { Photo } from '../types'

// Image servie directement par Wikimedia Commons (licence libre) avec lien vers la page du fichier.
// Si l'image ne charge pas (hors ligne, filtrage), on affiche un cadre de remplacement lisible.
const props = defineProps<{ photo: Photo; width?: number }>()
const failed = ref(false)
const name = computed(() => props.photo.fichier.replace(/ /g, '_'))
const src = computed(() => `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(name.value)}?width=${props.width ?? 900}`)
const page = computed(() => `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(name.value)}`)
const tag = computed(() => ({ photo_actuelle: 'Photo actuelle', carte_postale: 'Carte postale ancienne', plaque: 'Plaque commémorative' }[props.photo.nature]))
</script>

<template>
  <figure class="cphoto">
    <div class="frame">
      <img v-if="!failed" :src="src" :alt="photo.legende" loading="lazy" decoding="async" referrerpolicy="no-referrer" @error="failed = true" />
      <div v-else class="missing">Image indisponible hors connexion.<br /><a :href="page" target="_blank" rel="noopener">Voir sur Wikimedia Commons</a></div>
      <span class="badge">{{ tag }}</span>
    </div>
    <figcaption>
      <span class="leg">{{ photo.legende }}</span>
      <a class="credit" :href="page" target="_blank" rel="noopener">{{ photo.credit }}</a>
    </figcaption>
  </figure>
</template>

<style scoped>
.cphoto { margin: 0; background: var(--sheet); padding: 9px 9px 12px; box-shadow: var(--shadow); }
.frame { position: relative; aspect-ratio: 4 / 3; background: #d9ccb4; overflow: hidden; }
img { width: 100%; height: 100%; object-fit: cover; display: block; filter: sepia(.12) saturate(.92); }
.missing { height: 100%; display: grid; place-content: center; text-align: center; padding: 16px; font-size: 14px; color: var(--mute); }
.badge { position: absolute; left: 8px; top: 8px; font: 12px/1 var(--type); background: rgb(251 247 239 / .92); padding: 5px 8px; border-radius: 2px; }
figcaption { display: grid; gap: 4px; margin-top: 9px; }
.leg { font: 21px/1.15 var(--hand); }
.credit { font-size: 11.5px; color: var(--mute); }
</style>
