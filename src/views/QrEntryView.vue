<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { fetchEtape } from '../services/api'
import { useProgress } from '../stores/progress'
import { stage } from '../three/stage'

// Point d'entrée des QR codes : /e/:etapeId -> débloque l'étape et redirige.
const props = defineProps<{ etapeId: number }>()
const router = useRouter()
const p = useProgress()
const notFound = ref(false)

onMounted(async () => {
  const res = await fetchEtape(props.etapeId)
  if (!res) { notFound.value = true; return }
  if (p.isReachable(res.etape.ordre)) { p.unlock(res.etape.ordre); stage.ping(res.etape.ordre) }
  router.replace(`/enquete/${res.enqueteId}/etape/${res.etape.ordre}`)
})
</script>

<template>
  <div class="sheet">
    <p v-if="notFound">Ce QR code ne correspond à aucune étape publiée.</p>
    <p v-else class="eyebrow">Lecture du QR code…</p>
  </div>
</template>
