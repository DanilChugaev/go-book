<template>
  <aside class="example-source" aria-label="Исходный код примера">
    <svg aria-hidden="true" viewBox="0 0 24 24" focusable="false">
      <path d="m8 9-3 3 3 3m8-6 3 3-3 3m-2-9-4 12" />
    </svg>
    <div>
      <strong>Полный исходный код</strong>
      <p>
        <template v-if="href">
          <a :href="href" target="_blank" rel="noopener noreferrer"><code>{{ path }}</code></a>
        </template>
        <template v-else><code>{{ path }}</code></template>
        <span v-if="description"> — {{ description }}</span>
      </p>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  path: string
  description?: string
}>()

const href = computed(() => {
  const normalized = props.path.replace(/^\/+/, '')
  return `https://github.com/DanilChugaev/go-book/tree/master/${normalized}`
})
</script>

<style scoped lang="scss">
.example-source {
  display: flex;
  gap: 0.75rem;
  margin: 1.5rem 0;
  padding: 0.85rem 1rem;
  background: var(--vp-c-bg-alt);
  border: 1px solid var(--vp-c-border);
  border-radius: 0.45rem;

  svg {
    flex: 0 0 auto;
    width: 1.3rem;
    height: 1.3rem;
    margin-top: 0.1rem;
    fill: none;
    stroke: var(--vp-c-accent);
    stroke-linecap: round;
    stroke-linejoin: round;
    stroke-width: 1.8;
  }

  strong { font-size: 0.92rem; }
  p { margin: 0.2rem 0 0; font-size: 0.9rem; }
}
</style>
