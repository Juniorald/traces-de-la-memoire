<script setup lang="ts">
import { computed } from 'vue'
import { illustrations } from '../illustrations'

const props = withDefaults(defineProps<{ name: string; caption?: string }>(), { caption: 'Illustration – pas une archive' })
const svg = computed(() => illustrations[props.name]?.() ?? '')
</script>

<template>
  <figure v-if="svg" class="illus">
    <div v-html="svg" />
    <figcaption>{{ caption }}</figcaption>
  </figure>
</template>

<style scoped>
figure { margin: 0; }
</style>
