<template>
  <Teleport v-if="mounted" to=".vp-navbar-items-wrapper">
    <BookmarksMenu />
  </Teleport>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'

import BookmarksMenu from './BookmarksMenu.vue'

// До монтирования компонент ничего не рендерит — SSR и первый клиентский
// render совпадают. После hydration меню перемещается в шапку темы.
const mounted = ref(false)

onMounted(() => {
  mounted.value = true
})
</script>
