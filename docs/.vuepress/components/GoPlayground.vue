<template>
  <div class="go-playground">
    <div class="go-playground__actions">
      <button type="button" class="go-playground__button" @click="copyCode">
        {{ copyLabel }}
      </button>

      <a
        class="go-playground__button go-playground__button--primary"
        href="https://go.dev/play/"
        target="_blank"
        rel="noopener noreferrer"
      >
        Открыть Go Playground
      </a>
    </div>

    <p class="go-playground__hint">
      Скопируйте пример, вставьте его в Go Playground и нажмите Run.
    </p>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps<{
  code: string
}>()

const copyLabel = ref('Скопировать код')

async function copyCode() {
  try {
    await navigator.clipboard.writeText(props.code.trim())
    copyLabel.value = 'Скопировано'
  } catch {
    copyLabel.value = 'Не удалось скопировать'
  }

  window.setTimeout(() => {
    copyLabel.value = 'Скопировать код'
  }, 2000)
}
</script>

<style scoped>
.go-playground {
  margin: 1rem 0 1.5rem;
}

.go-playground__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.go-playground__button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 2.25rem;
  padding: 0.4rem 0.75rem;
  color: var(--c-text);
  font: inherit;
  line-height: 1.25;
  text-decoration: none;
  background: var(--c-bg);
  border: 1px solid var(--c-border);
  border-radius: 0.25rem;
  cursor: pointer;
}

.go-playground__button:hover {
  color: var(--c-brand);
  border-color: var(--c-brand);
}

.go-playground__button--primary {
  color: var(--c-bg);
  background: var(--c-brand);
  border-color: var(--c-brand);
}

.go-playground__button--primary:hover {
  color: var(--c-bg);
  background: var(--c-brand-light);
  border-color: var(--c-brand-light);
}

.go-playground__hint {
  margin: 0.75rem 0 0;
  color: var(--c-text-light);
  font-size: 0.9rem;
}
</style>
