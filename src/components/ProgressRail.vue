<script setup lang="ts">
defineProps<{ total: number; isDone: (o: number) => boolean; current?: number }>()
</script>

<template>
  <div class="rail" role="progressbar" :aria-valuemin="0" :aria-valuemax="total"
       :aria-valuenow="Array.from({ length: total }, (_, i) => i + 1).filter(isDone).length"
       aria-label="Progression de l’enquête">
    <template v-for="o in total" :key="o">
      <span class="dot" :class="{ on: isDone(o), cur: o === current && !isDone(o) }">{{ o }}</span>
      <span v-if="o < total" class="thread" :class="{ on: isDone(o) }" />
    </template>
  </div>
</template>

<style scoped>
.rail { display: flex; align-items: center; }
.dot { flex: none; width: 26px; height: 26px; border-radius: 50%; display: grid; place-items: center; font: 700 12px/1 var(--sans); background: var(--paper-2); color: var(--mute); border: 1.5px dashed #b9a88c; }
.dot.on { background: var(--plum); color: #fff; border: 0; }
.dot.cur { background: var(--red); color: #fff; border: 0; box-shadow: 0 0 0 4px rgb(200 35 44 / .18); }
.thread { flex: 1; height: 2px; background: repeating-linear-gradient(90deg, #b9a88c 0 4px, transparent 4px 8px); }
.thread.on { background: var(--red); }
</style>
