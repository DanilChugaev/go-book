<template>
  <span class="book-version" :title="`Версия ${bookMeta.version}, актуально на ${bookMeta.generatedDate}`">
    <span class="book-version__number">v{{ bookMeta.version }}</span>
    <span class="book-version__date"> · {{ bookMeta.generatedDate }}</span>
  </span>
</template>

<script setup lang="ts">
import { bookMeta } from '../generated/book-meta'
</script>

<style scoped lang="scss">
.book-version {
  display: inline-flex;
  align-items: center;
  margin-inline-start: 0.55rem;
  color: var(--vp-c-text-mute);
  font-size: 0.72rem;
  font-variant-numeric: tabular-nums;
  font-weight: 500;
  line-height: 1.1;
  white-space: nowrap;
}

@media screen and (max-width: 899px) {
  .book-version {
    margin-inline-start: 0.35rem;
  }

  .book-version__date {
    display: none;
  }
}

@media screen and (max-width: 359px) {
  .book-version {
    display: none;
  }
}
</style>
