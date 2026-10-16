<template>
  <section class="bookmarks-home" aria-labelledby="bookmarks-home-title">
    <h2 id="bookmarks-home-title">Ваши закладки</h2>
    <p v-if="bookmarks.length === 0" class="bookmarks-home__empty">
      Закладок пока нет. На нужной странице откройте кнопку с иконкой закладки в шапке и сохраните её.
    </p>
    <ul v-else>
      <li v-for="bookmark in bookmarks" :key="bookmark.path">
        <button type="button" @click="navigate(bookmark.path)">{{ formatBookmark(bookmark) }}</button>
      </li>
    </ul>
  </section>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vuepress/client'

import { useBookmarks } from '../composables/useBookmarks'
import type { Bookmark } from '../composables/useBookmarks'
import type { ISearchIndex } from '../configs/search/types.js'

const router = useRouter()
const { bookmarks, load } = useBookmarks()
const searchIndex = ref<ISearchIndex | null>(null)

function navigate(path: string): void {
  void router.push(path)
}

function formatBookmark(bookmark: Bookmark): string {
  const indexed = searchIndex.value?.pages.find((page) => page.path === bookmark.path)
  const chapter = indexed?.chapter ?? bookmark.chapter
  const title = indexed?.title || bookmark.title
  return chapter ? `${chapter} — ${title}` : title
}

onMounted(async () => {
  load()

  try {
    const module: { searchIndex: ISearchIndex } = await import(
      // @ts-ignore Индекс создаётся search plugin во время сборки VuePress.
      '../.temp/search/data.js'
    )
    searchIndex.value = module.searchIndex
  } catch {
    searchIndex.value = null
  }
})
</script>

<style scoped lang="scss">
.bookmarks-home { width: calc(100vw - 4rem); max-width: var(--homepage-width); margin: 0; padding: 1.25rem 1.5rem; border: 1px solid var(--vp-c-border); border-radius: .75rem; background: var(--vp-c-bg-alt); box-sizing: border-box; }
.bookmarks-home h2 { margin: 0;
  padding: 0 0 1.25rem; font-size: 1.25rem; }
.bookmarks-home__empty { margin: 0; margin-top: 1.25rem !important; color: var(--vp-c-text-mute); line-height: 1.55; }
.bookmarks-home ul { padding: 0; margin: 0; list-style: none; }
.bookmarks-home li + li { margin-top: .35rem; }
.bookmarks-home button { width: 100%; padding: .5rem .65rem; border: none; border-radius: .35rem; background: transparent; color: var(--vp-c-accent); cursor: pointer; font: inherit; text-align: left; &:hover, &:focus-visible { background: var(--vp-c-bg); text-decoration: underline; } }
@media (max-width: 719px) { .bookmarks-home { padding: 1rem; } }
</style>
