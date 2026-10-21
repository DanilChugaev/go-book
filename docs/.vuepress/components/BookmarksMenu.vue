<template>
  <div ref="root" class="bookmarks-menu">
    <button
      ref="toggle"
      class="bookmarks-menu__toggle"
      type="button"
      :aria-expanded="open ? 'true' : 'false'"
      aria-controls="bookmarks-panel"
      aria-label="Открыть закладки"
      title="Закладки"
      @click="togglePanel"
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M6 3.75A1.75 1.75 0 0 1 7.75 2h8.5A1.75 1.75 0 0 1 18 3.75V22l-6-3.75L6 22V3.75Z" />
      </svg>
      <span v-if="bookmarks.length" class="bookmarks-menu__count" aria-hidden="true">{{ bookmarks.length }}</span>
    </button>

    <Teleport to="body">
      <div v-if="open && !mobile" class="bookmarks-menu__backdrop" aria-hidden="true"></div>
    </Teleport>

    <section
      v-if="open"
      id="bookmarks-panel"
      ref="panel"
      class="bookmarks-menu__panel"
      aria-label="Закладки"
    >
      <header class="bookmarks-menu__header">
        <h2>Закладки</h2>
        <button
          ref="closeButton"
          class="bookmarks-menu__close"
          type="button"
          aria-label="Закрыть закладки"
          @click="close(true)"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
            <line x1="6" y1="6" x2="18" y2="18" />
            <line x1="18" y1="6" x2="6" y2="18" />
          </svg>
        </button>
      </header>

      <div class="bookmarks-menu__actions">
        <button class="bookmarks-menu__current" type="button" @click="toggleCurrent">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M6 3.75A1.75 1.75 0 0 1 7.75 2h8.5A1.75 1.75 0 0 1 18 3.75V22l-6-3.75L6 22V3.75Z" />
          </svg>
          {{ currentBookmarked ? 'Удалить текущую страницу' : 'Добавить текущую страницу' }}
        </button>
        <button v-if="bookmarks.length" class="bookmarks-menu__clear" type="button" @click="clearBookmarks">
          Очистить все
        </button>
      </div>

      <div class="bookmarks-menu__list" aria-live="polite">
        <p v-if="bookmarks.length === 0" class="bookmarks-menu__empty">
          Закладок пока нет. Откройте нужную страницу и добавьте её сюда.
        </p>
        <ul v-else>
          <li v-for="bookmark in bookmarks" :key="bookmark.path">
            <button class="bookmarks-menu__link" type="button" :title="bookmark.title" @click="navigate(bookmark.path)">
              {{ formatBookmark(bookmark) }}
            </button>
            <button
              class="bookmarks-menu__remove"
              type="button"
              :aria-label="`Удалить закладку «${formatBookmark(bookmark)}»`"
              title="Удалить закладку"
              @click="remove(bookmark.path)"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
                <line x1="6" y1="6" x2="18" y2="18" />
                <line x1="18" y1="6" x2="6" y2="18" />
              </svg>
            </button>
          </li>
        </ul>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { useData, useRouter } from 'vuepress/client'

import { useBookmarks } from '../composables/useBookmarks'
import type { Bookmark } from '../composables/useBookmarks'
import type { ISearchIndex, ISearchPage } from '../configs/search/types.js'

const root = ref<HTMLElement | null>(null)
const toggle = ref<HTMLButtonElement | null>(null)
const panel = ref<HTMLElement | null>(null)
const closeButton = ref<HTMLButtonElement | null>(null)
const open = ref(false)
const mobile = ref(false)
const searchIndex = ref<ISearchIndex | null>(null)
let mediaQuery: MediaQueryList | null = null

const router = useRouter()
const { page, siteLocale } = useData()
const { bookmarks, load, add, remove, clear } = useBookmarks()
const currentPath = computed(() => router.currentRoute.value.path)
const indexedPage = computed<ISearchPage | null>(() => searchIndex.value?.pages.find(
  (searchPage) => searchPage.path === currentPath.value,
) ?? null)
const currentTitle = computed(() => {
  if (indexedPage.value?.title) return indexedPage.value.title
  if (page.value.path === '/') return siteLocale.value.title || 'Учебник Go'
  return page.value.title || siteLocale.value.title || 'Страница учебника'
})
const currentChapter = computed(() => indexedPage.value?.chapter)
const currentBookmarked = computed(() => bookmarks.value.some((bookmark) => bookmark.path === currentPath.value))

function close(restoreFocus = false): void {
  open.value = false
  if (restoreFocus) {
    void nextTick(() => toggle.value?.focus())
  }
}

function togglePanel(): void {
  if (open.value) {
    close()
    return
  }

  open.value = true
  void nextTick(() => closeButton.value?.focus())
  if (searchIndex.value === null) {
    void loadCurrentPageMeta()
  }
}

function toggleCurrent(): void {
  if (currentBookmarked.value) remove(currentPath.value)
  else {
    if (searchIndex.value === null) {
      void loadCurrentPageMeta().then(() => {
        add(currentPath.value, currentTitle.value, currentChapter.value)
      })
      return
    }
    add(currentPath.value, currentTitle.value, currentChapter.value)
  }
}

function formatBookmark(bookmark: Bookmark): string {
  const indexed = searchIndex.value?.pages.find((page) => page.path === bookmark.path)
  const chapter = indexed?.chapter ?? bookmark.chapter
  const title = indexed?.title || bookmark.title
  return chapter ? `${chapter} — ${title}` : title
}

async function loadCurrentPageMeta(): Promise<void> {
  try {
    const module: { searchIndex: ISearchIndex } = await import(
      // @ts-ignore Индекс создаётся search plugin во время сборки VuePress.
      '../.temp/search/data.js'
    )
    searchIndex.value = module.searchIndex
  } catch {
    searchIndex.value = null
  }
}

function clearBookmarks(): void {
  if (window.confirm('Удалить все сохранённые закладки?')) clear()
}

function navigate(path: string): void {
  close()
  void router.push(path)
}

function onDocumentMouseDown(event: MouseEvent): void {
  if (open.value && root.value && !root.value.contains(event.target as Node)) close()
}

function onKeydown(event: KeyboardEvent): void {
  if (event.key === 'Escape' && open.value) {
    close(true)
    return
  }

  if (event.key !== 'Tab' || !open.value || panel.value === null) return

  const focusable = [...panel.value.querySelectorAll<HTMLElement>(
    'button:not(:disabled), [href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])',
  )]
  if (focusable.length === 0) return

  const first = focusable[0]
  const last = focusable[focusable.length - 1]
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault()
    last.focus()
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault()
    first.focus()
  }
}

function onMediaChange(event: MediaQueryListEvent): void {
  mobile.value = event.matches
}

onMounted(() => {
  load()
  document.addEventListener('mousedown', onDocumentMouseDown)
  window.addEventListener('keydown', onKeydown)
  mediaQuery = window.matchMedia('(max-width: 719px)')
  mobile.value = mediaQuery.matches
  mediaQuery.addEventListener('change', onMediaChange)
})

onBeforeUnmount(() => {
  document.removeEventListener('mousedown', onDocumentMouseDown)
  window.removeEventListener('keydown', onKeydown)
  mediaQuery?.removeEventListener('change', onMediaChange)
})
</script>

<style lang="scss">
.bookmarks-menu { position: relative; display: flex; align-items: center; height: 100%; }
.bookmarks-menu__toggle, .bookmarks-menu__close, .bookmarks-menu__remove, .bookmarks-menu__clear, .bookmarks-menu__current, .bookmarks-menu__link { font: inherit; }
// 44×44 (WCAG 2.5.8), как и все иконные кнопки шапки.
.bookmarks-menu__toggle {
  position: relative; display: flex; align-items: center; justify-content: center; width: var(--navbar-icon-size); min-width: var(--navbar-icon-size); height: var(--navbar-icon-size); padding: 0; border: 1px solid var(--vp-c-border);
  border-radius: 0.35rem; background: var(--vp-c-bg); color: var(--vp-c-text); cursor: pointer;
  &:hover, &[aria-expanded='true'] { background-color: var(--vp-c-bg-alt); }
  &:focus-visible { outline: 2px solid var(--vp-c-accent); outline-offset: 2px; }
  svg { width: 1.2rem; height: 1.2rem; }
}
.bookmarks-menu__count { position: absolute; top: .1rem; right: .1rem; min-width: 1rem; padding: 0 .2rem; border-radius: 1rem; background: var(--vp-c-accent-bg); color: var(--vp-c-accent-text); font-size: .65rem; font-weight: 700; line-height: 1rem; }
.bookmarks-menu__backdrop { position: fixed; inset: 0; z-index: 19; background-color: rgba(0, 0, 0, .35); }
.bookmarks-menu__panel { position: absolute; top: calc(100% + .6rem); right: 0; z-index: 30; width: min(25rem, calc(100vw - 1.5rem)); overflow: hidden; border: 1px solid var(--vp-c-border); border-radius: .75rem; background-color: var(--vp-c-bg-elv); box-shadow: 0 1rem 2.5rem var(--vp-c-shadow, rgba(0, 0, 0, .12)); animation: bookmarks-menu-panel-in .18s ease; }
.bookmarks-menu__header, .bookmarks-menu__actions, .bookmarks-menu__list li { display: flex; align-items: center; }
.bookmarks-menu__header { justify-content: space-between; padding: .65rem .85rem; border-bottom: 1px solid var(--vp-c-border); }
.bookmarks-menu__header h2 { margin: 0; font-size: 1rem; }
.bookmarks-menu__close, .bookmarks-menu__remove { display: flex; align-items: center; justify-content: center; padding: 0; border: none; border-radius: .3rem; background: transparent; color: var(--vp-c-text-mute); cursor: pointer; &:hover { background-color: var(--vp-c-bg-alt); color: var(--vp-c-text); } &:focus-visible { outline: 2px solid var(--vp-c-accent); outline-offset: -2px; } svg { width: 1.25rem; height: 1.25rem; } }
.bookmarks-menu__close { width: var(--navbar-icon-size); height: var(--navbar-icon-size); }
.bookmarks-menu__actions { justify-content: space-between; gap: .75rem; padding: .65rem .85rem; border-bottom: 1px solid var(--vp-c-border); }
.bookmarks-menu__current { display: inline-flex; align-items: center; gap: .4rem; min-height: var(--navbar-icon-size); padding: .4rem .55rem; border: 1px solid var(--vp-c-accent-bg); border-radius: .35rem; background: var(--vp-c-bg); color: var(--vp-c-accent); cursor: pointer; font-size: .8rem; &:hover { background: var(--vp-c-accent-hover); color: var(--vp-c-accent-text); } &:focus-visible { outline: 2px solid var(--vp-c-accent); outline-offset: 2px; } svg { width: .9rem; height: .9rem; } }
.bookmarks-menu__clear { min-height: var(--navbar-icon-size); padding: .4rem 0; border: none; background: transparent; color: var(--vp-c-text-mute); cursor: pointer; font-size: .8rem; text-decoration: underline; &:hover { color: var(--vp-c-text); } &:focus-visible { outline: 2px solid var(--vp-c-accent); outline-offset: 2px; } }
.bookmarks-menu__list { max-height: min(28rem, calc(100vh - var(--navbar-height) - 10rem)); overflow-y: auto; }
.bookmarks-menu__list ul { padding: 0; margin: 0; list-style: none; }
.bookmarks-menu__list li { min-width: 0; border-bottom: 1px solid var(--vp-c-border); &:last-child { border-bottom: none; } &:hover { background-color: var(--vp-c-bg-alt); } }
.bookmarks-menu__link { flex: 1; min-width: 0; min-height: var(--navbar-icon-size); padding: .65rem .85rem; border: none; background: transparent; color: var(--vp-c-text); cursor: pointer; overflow: hidden; font-size: .875rem; text-align: left; text-overflow: ellipsis; white-space: nowrap; &:focus-visible { outline: 2px solid var(--vp-c-accent); outline-offset: -2px; } }
.bookmarks-menu__remove { flex: 0 0 auto; width: var(--navbar-icon-size); height: var(--navbar-icon-size); margin-right: .45rem; }
.bookmarks-menu__empty { padding: 1rem; margin: 0; color: var(--vp-c-text-mute); font-size: .875rem; line-height: 1.5; text-align: center; }
@keyframes bookmarks-menu-panel-in { from { opacity: 0; transform: translateY(-.35rem); } to { opacity: 1; transform: translateY(0); } }
@media screen and (max-width: 719px) { .bookmarks-menu { position: static; } .bookmarks-menu__panel { position: fixed; top: var(--navbar-height); right: 0; left: 0; width: auto; max-height: calc(100vh - var(--navbar-height)); border-top: none; border-right: none; border-left: none; border-radius: 0; } .bookmarks-menu__list { max-height: calc(100vh - var(--navbar-height) - 8.5rem); } }
</style>
