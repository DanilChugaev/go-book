<template>
  <span
    class="book-version"
    :title="`Версия ${bookMeta.version}, актуально на ${bookMeta.generatedDate}`">
    <span class="book-version__number">v{{ bookMeta.version }}</span>
    <span class="book-version__date"> · {{ bookMeta.generatedDate }}</span>
  </span>
</template>

<script setup lang="ts">
import { bookMeta } from '../generated/book-meta';
</script>

<style scoped lang="scss">
// Mobile-first: на узких экранах (≤449px) версия скрыта, чтобы четыре
// кнопки 44×44 в шапке не давили на уменьшенный логотип; от 450px
// показываем её, от 920px возвращаем полный отступ и дату.
.book-version {
  display: none;
  align-items: center;
  margin-inline-start: 0.35rem;
  color: var(--vp-c-text-mute);
  font-size: 0.72rem;
  font-variant-numeric: tabular-nums;
  font-weight: 500;
  line-height: 1.1;
  white-space: nowrap;
}

.book-version__date {
  display: none;
}

@media (min-width: 450px) {
  .book-version {
    display: inline-flex;
  }
}

@media (min-width: 920px) {
  .book-version {
    margin-inline-start: 0.55rem;
  }

  .book-version__date {
    display: inline;
  }
}
</style>
