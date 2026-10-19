<template>
  <Teleport v-if="mounted" to=".vp-navbar-items-wrapper">
    <BookmarksMenu />
  </Teleport>
</template>

<script setup lang="ts">
import { defineAsyncComponent, nextTick, onMounted, ref } from 'vue'

// Меню открывается только по действию пользователя, поэтому его код не должен
// попадать в стартовый пакет каждой страницы.
const BookmarksMenu = defineAsyncComponent(
  () => import('./BookmarksMenu.vue'),
)

// До монтирования компонент ничего не рендерит — SSR и первый клиентский
// render совпадают. После hydration меню перемещается в шапку темы.
const mounted = ref(false)

onMounted(() => {
  mounted.value = true

  // Кнопка темы создаётся темой раньше пользовательских компонентов.
  // Переставляем элементы в DOM, чтобы порядок Tab совпадал с визуальным:
  // поиск → закладки → смена темы.
  void nextTick(() => {
    const wrapper = document.querySelector('.vp-navbar-items-wrapper')
    const search = wrapper?.querySelector('.search-box')
    const bookmarks = wrapper?.querySelector('.bookmarks-menu')
    const colorMode = wrapper?.querySelector('.vp-toggle-color-mode-button')

    if (search && bookmarks && colorMode) {
      wrapper.append(search, bookmarks, colorMode)
    }
  })
})
</script>
