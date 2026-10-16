<template>
  <div
    ref="root"
    class="search-box"
    :class="{ 'search-box--expanded': open && !mobile }"
  >
    <!-- Мобильный режим: кнопка в шапке -->
    <button
      class="search-box__toggle"
      type="button"
      title="Поиск по учебнику"
      aria-label="Поиск по учебнику"
      @click="openMobile"
    >
      <svg
        class="search-box__icon"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        aria-hidden="true"
      >
        <circle cx="11" cy="11" r="7" />
        <line x1="20" y1="20" x2="16.5" y2="16.5" />
      </svg>
    </button>

    <!-- Десктопный режим: поле поиска в шапке -->
    <div class="search-box__field">
      <svg
        class="search-box__field-icon"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        aria-hidden="true"
      >
        <circle cx="11" cy="11" r="7" />
        <line x1="20" y1="20" x2="16.5" y2="16.5" />
      </svg>
      <input
        ref="input"
        class="search-box__input"
        type="text"
        role="combobox"
        aria-label="Поиск по учебнику"
        :aria-expanded="open ? 'true' : 'false'"
        :placeholder="placeholder"
        v-model="query"
        autocomplete="off"
        @focus="openPanel"
        @keydown="onKeydown"
      >
      <span v-show="query === ''" class="search-box__kbd">{{ kbdLabel }}</span>
      <button
        v-show="query !== ''"
        class="search-box__clear"
        type="button"
        aria-label="Очистить запрос"
        @click="clearQuery('desktop')"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          aria-hidden="true"
        >
          <line x1="6" y1="6" x2="18" y2="18" />
          <line x1="18" y1="6" x2="6" y2="18" />
        </svg>
      </button>
    </div>

    <!-- Подложка: затемняет страницу за открытой панелью.
         Телепортируется в body: её z-index (19) должен быть ниже шапки
         (20), а элементы внутри шапки туда поместить нельзя -->
    <Teleport to="body">
      <div
        v-if="open && !mobile"
        class="search-box__backdrop"
        aria-hidden="true"
      ></div>
    </Teleport>

    <!-- Панель результатов: выпадающая на десктопе,
         прикреплённая под шапку на мобильных -->
    <div v-if="open" class="search-box__panel">
      <div class="search-box__panel-bar">
        <input
          ref="mobileInput"
          class="search-box__panel-input"
          type="text"
          :placeholder="placeholder"
          v-model="query"
          autocomplete="off"
          @keydown="onKeydown"
        >
        <button
          v-show="query !== ''"
          class="search-box__clear"
          type="button"
          aria-label="Очистить запрос"
          @click="clearQuery('mobile')"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            aria-hidden="true"
          >
            <line x1="6" y1="6" x2="18" y2="18" />
            <line x1="18" y1="6" x2="6" y2="18" />
          </svg>
        </button>
        <button
          class="search-box__close"
          type="button"
          aria-label="Закрыть поиск"
          @click="close"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            aria-hidden="true"
          >
            <line x1="6" y1="6" x2="18" y2="18" />
            <line x1="18" y1="6" x2="6" y2="18" />
          </svg>
        </button>
      </div>

      <div ref="results" class="search-box__results">
        <p v-if="loading" class="search-box__state">Готовим индекс…</p>
        <p v-else-if="groups.length === 0" class="search-box__state">
          <template v-if="query.trim() !== ''">
            Ничего не найдено по запросу «{{ query.trim() }}»
          </template>
          <template v-else>Пока нет данных для поиска</template>
        </p>

        <template v-else>
          <template v-for="group in groups" :key="group.title">
            <a
              class="search-box__chapter"
              :class="{
                'search-box__chapter--active': active === group.order,
              }"
              :href="group.path"
              :title="group.title"
              @click.prevent="navigate(group.path)"
              @mouseenter="active = group.order"
            >
              {{ group.title }}
            </a>
            <a
              v-for="page in group.pages"
              :key="page.path"
              class="search-box__page"
              :class="{ 'search-box__page--active': active === page.order }"
              :href="page.path"
              @click.prevent="navigate(page.path)"
              @mouseenter="active = page.order"
            >
              <span class="search-box__page-title" v-html="page.titleHtml"></span>
              <span
                v-if="page.snippetHtml !== ''"
                class="search-box__page-snippet"
                v-html="page.snippetHtml"
              ></span>
            </a>
          </template>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'

import type { ISearchIndex, ISearchPage } from '../configs/search/types.js'

/**
 * Поле поиска по учебнику в шапке сайта.
 *
 * Индекс собирается плагином `searchPlugin` (configs/search/plugin.ts)
 * в момент сборки и пишется в `.vuepress/.temp/search/data.js`. Компонент
 * импортирует этот модуль лениво, так что индекс попадает в отдельный
 * чанк и скачивается только при первом реальном использовании поиска.
 *
 * Поддерживаются:
 * - структурный поиск: главы и страницы по названиям;
 * - полнотекстовый поиск: весь текст страниц, включая код и викторины,
 *   с фрагментом совпадения и подсветкой;
 * - список глав показывается целиком: ограничение строк действует
 *   только на строки страниц (полнотекстовые совпадения);
 * - игнорирование регистра и взаимозаменяемость `ё`/`е`;
 * - навигация с клавиатуры (Ctrl/⌘ K, стрелки, Enter, Esc);
 * - «расширение» при открытии: на десктопе поле тянется до логотипа,
 *   накрывает навигационные ссылки и кнопку смены темы, а страница
 *   за панелью затемняется;
 * - мобильная версия и тёмная тема.
 */

const MAX_PAGE_ROWS = 30
const SNIPPET_RADIUS = 90

const root = ref<HTMLElement | null>(null)
const input = ref<HTMLInputElement | null>(null)
const mobileInput = ref<HTMLInputElement | null>(null)
const results = ref<HTMLElement | null>(null)

const query = ref('')
const open = ref(false)
const active = ref(-1)
const loading = ref(false)
const index = ref<ISearchIndex | null>(null)

// Мобильный viewport: управляет мобильной панелью, а на десктопе
// отключает «расширение» поискового поля
const mobile = ref(false)
let mediaQuery: MediaQueryList | null = null

const onMediaChange = (event: MediaQueryListEvent): void => {
  mobile.value = event.matches
}

const placeholder = 'Поиск по учебнику…'

const isMac =
  typeof navigator !== 'undefined' &&
  /mac|iphone|ipad|ipod/i.test(navigator.platform ?? navigator.userAgent)

const kbdLabel = isMac ? '⌘ K' : 'Ctrl K'

let indexPromise: Promise<ISearchIndex> | null = null

const loadIndex = (): Promise<ISearchIndex> => {
  if (!indexPromise) {
    indexPromise = import(
      // Файл появляется в .temp после прогона плагина поиска,
      // поэтому модуль не проверяется статически.
      /* webpackChunkName: "search-data" */
      // @ts-ignore -- см. комментарий выше
      '../.temp/search/data.js'
    ).then(
      (module: { searchIndex: ISearchIndex }) => module.searchIndex
    )
  }
  return indexPromise
}

const ensureIndex = async (): Promise<void> => {
  if (index.value !== null || loading.value) return

  loading.value = true
  try {
    index.value = await loadIndex()
  } catch (error) {
    console.error('Не удалось загрузить индекс поиска', error)
  } finally {
    loading.value = false
  }
}

interface PageMeta {
  normTitle: string
  normText: string
}

/**
 * Нормализация один-в-один: каждому символу соответствует ровно один
 * символ, поэтому смещения в нормализованном тексте совпадают со
 * смещениями в исходном. Замена `ё` → `е` делает взаимно
 * нахожимыми оба написания слова.
 */
const toNorm = (value: string): string => {
  let result = ''
  for (const char of value) {
    if (char === 'ё' || char === 'Ё') {
      result += 'е'
    } else {
      const lower = char.toLowerCase()
      result += lower.length === 1 ? lower : char
    }
  }
  return result
}

const normCache = new Map<string, PageMeta>()

const getPageMeta = (page: ISearchPage): PageMeta => {
  let meta = normCache.get(page.path)
  if (!meta) {
    meta = {
      normTitle: toNorm(page.title),
      normText: toNorm(page.text),
    }
    normCache.set(page.path, meta)
  }
  return meta
}

const normalizeQuery = (value: string): string =>
  value
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/\s+/g, ' ')
    .trim()

const queryTokens = computed<string[]>(() => {
  const normalized = normalizeQuery(query.value)
  if (normalized === '') return []
  return [...new Set(normalized.split(' '))]
})

const chapterMatches = (title: string, tokens: string[]): boolean => {
  const norm = toNorm(title)
  return tokens.every((token) => norm.includes(token))
}

interface PageMatch {
  page: ISearchPage
  titleHit: boolean
  textHit: boolean
  score: number
}

/**
 * Полнотекстовый поиск: страница попадает в результат, если все
 * токены запроса найдены в её названии или во всём тексте. Рейтинг:
 * совпадение названия важнее совпадения по тексту, в тексте —
 * количество вхождений.
 */
const searchPages = (
  searchIndex: ISearchIndex,
  tokens: string[]
): PageMatch[] => {
  const matches: PageMatch[] = []

  for (const page of searchIndex.pages) {
    const meta = getPageMeta(page)

    let allTitle = true
    let titleScore = 0
    for (const token of tokens) {
      if (meta.normTitle.includes(token)) {
        titleScore += 100
      } else {
        allTitle = false
      }
    }

    let allText = true
    let textScore = 0
    for (const token of tokens) {
      let count = 0
      let pos = meta.normText.indexOf(token)
      while (pos !== -1) {
        count += 1
        if (count > 30) break
        pos = meta.normText.indexOf(token, pos + 1)
      }
      if (count === 0) {
        allText = false
      } else {
        textScore += count * 5
      }
    }

    if (!allTitle && !allText) continue

    let score = 0
    if (allTitle) score += 1000 + titleScore
    if (allText) score += 100 + textScore

    matches.push({
      page,
      titleHit: allTitle,
      textHit: allText,
      score,
    })
  }

  return matches.sort((a, b) => b.score - a.score)
}

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

interface Range {
  start: number
  end: number
}

/**
 * Подсвечивает вхождения всех токенов запроса в тексте. Диапазоны
 * вычисляются по нормализованному тексту (один-в-один с исходным) и
 * переносятся на исходный, поэтому регистр в подсветке сохраняется.
 */
const highlight = (
  text: string,
  norm: string,
  tokens: string[]
): string => {
  const ranges: Range[] = []
  for (const token of tokens) {
    let pos = norm.indexOf(token)
    while (pos !== -1) {
      ranges.push({ start: pos, end: pos + token.length })
      pos = norm.indexOf(token, pos + 1)
    }
  }

  ranges.sort((a, b) => a.start - b.start || b.end - a.end)
  const merged: Range[] = []
  for (const range of ranges) {
    const last = merged[merged.length - 1]
    if (last !== undefined && range.start <= last.end) {
      last.end = Math.max(last.end, range.end)
    } else {
      merged.push({ ...range })
    }
  }

  let html = ''
  let cursor = 0
  for (const range of merged) {
    html += escapeHtml(text.slice(cursor, range.start))
    html += `<mark>${escapeHtml(text.slice(range.start, range.end))}</mark>`
    cursor = range.end
  }
  html += escapeHtml(text.slice(cursor))
  return html
}

/**
 * Фрагмент текста вокруг лучшего совпадения: окно выбирается так,
 * чтобы в нём попадало как можно больше разных токенов запроса.
 */
const buildSnippet = (
  meta: PageMeta,
  text: string,
  tokens: string[]
): string => {
  const hits: number[] = []
  for (const token of tokens) {
    let pos = meta.normText.indexOf(token)
    let count = 0
    while (pos !== -1 && count < 40) {
      hits.push(pos)
      count += 1
      pos = meta.normText.indexOf(token, pos + 1)
    }
  }

  if (hits.length === 0) return ''

  let bestStart = 0
  let bestEnd = 0
  let bestScore = -1
  for (const hit of hits) {
    const start = Math.max(0, hit - SNIPPET_RADIUS)
    const end = Math.min(meta.normText.length, hit + SNIPPET_RADIUS + 1)
    const window = meta.normText.slice(start, end)
    const score = tokens.filter((token) => window.includes(token)).length
    if (score > bestScore) {
      bestScore = score
      bestStart = start
      bestEnd = end
    }
  }

  // Расширяем до границ слов
  while (bestStart > 0 && !/\s/.test(meta.normText[bestStart - 1])) {
    bestStart -= 1
  }
  while (
    bestEnd < meta.normText.length &&
    !/\s/.test(meta.normText[bestEnd])
  ) {
    bestEnd += 1
  }

  const prefix = bestStart > 0 ? '… ' : ''
  const suffix = bestEnd < meta.normText.length ? ' …' : ''
  const segmentNorm = meta.normText.slice(bestStart, bestEnd)
  const segment = text.slice(bestStart, bestEnd)

  return (
    escapeHtml(prefix) +
    highlight(segment, segmentNorm, tokens) +
    escapeHtml(suffix)
  )
}

interface RenderedPage {
  path: string
  titleHtml: string
  snippetHtml: string
  order: number
}

interface RenderedGroup {
  title: string
  path: string
  pages: RenderedPage[]
  order: number
}

const GENERAL_GROUP = 'Общие страницы'

/**
 * Результаты, сгруппированные по главам.
 *
 * Пустой запрос — режим обзора: список всех глав и общих страниц
 * (предисловие, содержание, ресурсы). Заполненный запрос — главы,
 * найденные по названию, идут первыми, затем главы со страницами,
 * совпавшими по названию или тексту.
 */
const groups = computed<RenderedGroup[]>(() => {
  if (index.value === null) return []

  const tokens = queryTokens.value

  if (tokens.length === 0) {
    const browse: RenderedGroup[] = index.value.chapters.map((chapter) => ({
      title: chapter.title,
      path: chapter.path,
      pages: [],
      order: -1,
    }))

    const generalPages = index.value.pages.filter((page) => !page.chapter)
    if (generalPages.length > 0) {
      browse.push({
        title: GENERAL_GROUP,
        path: generalPages[0].path,
        order: -1,
        pages: generalPages.map((page) => ({
          path: page.path,
          titleHtml: escapeHtml(page.title),
          snippetHtml: '',
          order: -1,
        })),
      })
    }

    return limitRows(browse)
  }

  const matches = searchPages(index.value, tokens)
  const chaptersByTitle = new Map(
    index.value.chapters.map((chapter) => [chapter.title, chapter])
  )
  const matchedChapters = index.value.chapters.filter((chapter) =>
    chapterMatches(chapter.title, tokens)
  )

  const groupMap = new Map<string, RenderedGroup>()
  const getGroup = (chapter: { title: string; path: string }): RenderedGroup => {
    let group = groupMap.get(chapter.title)
    if (!group) {
      group = {
        title: chapter.title,
        path: chapter.path,
        pages: [],
        order: -1,
      }
      groupMap.set(chapter.title, group)
    }
    return group
  }

  for (const chapter of matchedChapters) {
    getGroup(chapter)
  }

  for (const match of matches) {
    const chapter = match.page.chapter
      ? chaptersByTitle.get(match.page.chapter)
      : undefined
    const group = chapter
      ? getGroup(chapter)
      : getGroup({ title: GENERAL_GROUP, path: match.page.path })

    const meta = getPageMeta(match.page)
    group.pages.push({
      path: match.page.path,
      titleHtml: highlight(match.page.title, meta.normTitle, tokens),
      snippetHtml: match.textHit
        ? buildSnippet(meta, match.page.text, tokens)
        : '',
      order: -1,
    })
  }

  const ordered: RenderedGroup[] = []
  const seen = new Set<string>()
  for (const chapter of matchedChapters) {
    const group = groupMap.get(chapter.title)
    if (group) {
      ordered.push(group)
      seen.add(chapter.title)
    }
  }
  for (const chapter of index.value.chapters) {
    if (seen.has(chapter.title)) continue
    const group = groupMap.get(chapter.title)
    if (group && group.pages.length > 0) {
      ordered.push(group)
      seen.add(chapter.title)
    }
  }
  const general = groupMap.get(GENERAL_GROUP)
  if (general && general.pages.length > 0) ordered.push(general)

  return limitRows(ordered)
})

/**
 * Назначает последовательные номера для навигации с клавиатуры и
 * ограничивает общее число строк страниц (полнотекстовых совпадений).
 *
 * Строки глав никогда не обрезаются: это структурный каркас учебника,
 * и при их большом числе достаточно просто прокрутки. Потолок
 * действует только
 * на строки страниц — защита от патологического запроса, способного
 * дать сотни совпадений.
 */
const limitRows = (groupsList: RenderedGroup[]): RenderedGroup[] => {
  let pageBudget = MAX_PAGE_ROWS
  let counter = 0

  return groupsList.map((group) => {
    const pages: RenderedPage[] = []
    for (const page of group.pages) {
      if (pageBudget <= 0) break
      pageBudget -= 1
      pages.push(page)
    }

    const renderedGroup: RenderedGroup = {
      ...group,
      pages,
      order: counter++,
    }
    for (const page of renderedGroup.pages) {
      page.order = counter++
    }
    return renderedGroup
  })
}

const rows = computed<{ path: string }[]>(() => {
  const list: { path: string }[] = []
  for (const group of groups.value) {
    list.push({ path: group.path })
    for (const page of group.pages) list.push({ path: page.path })
  }
  return list
})

watch(query, (value) => {
  active.value = -1
  if (value.trim() !== '') void ensureIndex()
})

// Блокирует прокрутку страницы, пока панель открыта (иначе
// «затемнение» фона прерывалось бы листанием)
const lockBodyScroll = (locked: boolean): void => {
  if (typeof document === 'undefined') return
  document.body.style.overflow = locked ? 'hidden' : ''
}

watch(open, (value) => {
  lockBodyScroll(value)

  if (!value) return

  active.value = -1
  void ensureIndex()
  if (mobile.value) {
    requestAnimationFrame(() => mobileInput.value?.focus())
  }
})

const openPanel = (): void => {
  if (!open.value) open.value = true
}

const openMobile = (): void => {
  if (open.value) {
    close()
  } else {
    open.value = true
  }
}

const close = (): void => {
  open.value = false
  query.value = ''
  active.value = -1
  input.value?.blur()
  mobileInput.value?.blur()
}

// Крестик в поле: стирает введённый запрос, чтобы можно было
// сразу продолжить ввод — фокус остаётся в том же поле.
const clearQuery = (field: 'desktop' | 'mobile'): void => {
  query.value = ''
  active.value = -1
  const target = field === 'mobile' ? mobileInput.value : input.value
  target?.focus()
}

const router = useRouter()

const navigate = (path: string): void => {
  const current = router.currentRoute.value.path
  close()
  if (current !== path) void router.push(path)
}

// Панель закрывается при переходе на другую страницу
router.afterEach(() => {
  close()
})

const scrollActive = (): void => {
  const element = results.value?.querySelector(
    '.search-box__page--active, .search-box__chapter--active'
  )
  element?.scrollIntoView({ block: 'nearest' })
}

const onKeydown = (event: KeyboardEvent): void => {
  if (event.key === 'Escape') {
    event.preventDefault()
    close()
    return
  }

  if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
    event.preventDefault()
    if (rows.value.length === 0) return
    const delta = event.key === 'ArrowDown' ? 1 : -1
    const next = active.value + delta
    active.value = (next + rows.value.length) % rows.value.length
    scrollActive()
    return
  }

  if (event.key === 'Enter') {
    if (rows.value.length === 0) return
    event.preventDefault()
    const row = rows.value[active.value === -1 ? 0 : active.value]
    if (row) navigate(row.path)
  }
}

// Панель закрывается при клике вне её
const onDocumentMouseDown = (event: MouseEvent): void => {
  if (!open.value) return
  if (root.value && !root.value.contains(event.target as Node)) close()
}

/**
 * Ctrl K / ⌘ K — фокус на поиске с любого места страницы.
 *
 * `useKeys` из @vuepress/helper здесь не подходит: в текущей версии
 * библиотеки строковый хоткей ('ctrl+k') не парсится, а сравнивается
 * целиком с `event.key`, а объектная форма хоткея не имеет модификатора
 * `meta` — то есть ⌘K на macOS вообще нельзя выразить. Поэтому
 * обработчик висит на `window` напрямую.
 */
const onGlobalKeydown = (event: KeyboardEvent): void => {
  if (event.isComposing) return
  // Alt сохраняем: на macOS/Windows Alt+клавиша часто вводит
  // спецсимволы и используется другими обработчиками.
  if (event.altKey) return
  if (!event.metaKey && !event.ctrlKey) return
  // Проверяем и `code`, и `key`: на русской раскладке физическая
  // клавиша K даёт символ «к», а код остаётся 'KeyK'.
  if (event.code !== 'KeyK' && event.key.toLowerCase() !== 'k') return
  event.preventDefault()

  if (mobile.value) {
    openMobile()
  } else {
    open.value = true
    requestAnimationFrame(() => input.value?.focus())
  }
}

/**
 * Замеряет смещение «расширения»: левый край поля встаёт у правого
 * края логотипа. Шапка занимает всю ширину, поэтому поле позиционируется
 * через `position: fixed` относительно viewport — иначе абсолютно
 * позиционированный .vp-navbar-items-wrapper сдвигался бы, когда поле
 * выходит из потока. Бренд — первая ссылка в шапке (кнопка сайдбара —
 * это <div>).
 */
const updateExpandMetrics = (): void => {
  const box = root.value
  if (box === null) return

  const navbar = box.closest('.vp-navbar')
  if (navbar === null) return

  const brand = navbar.querySelector('a')
  const logoRight =
    brand !== null
      ? brand.getBoundingClientRect().right
      : navbar.getBoundingClientRect().left

  box.style.setProperty('--sb-expand-left', `${Math.round(logoRight + 75 + 24)}px`)
}

onMounted(() => {
  document.addEventListener('mousedown', onDocumentMouseDown)
  window.addEventListener('keydown', onGlobalKeydown)
  window.addEventListener('resize', updateExpandMetrics)

  const media = window.matchMedia('(max-width: 719px)')
  mediaQuery = media
  mobile.value = media.matches
  media.addEventListener('change', onMediaChange)

  updateExpandMetrics()

  // Перезамер после загрузки веб-шрифтов — логотип мог изменить размер
  if (document.fonts !== undefined) {
    void document.fonts.ready.then(() => updateExpandMetrics())
  }
})

onBeforeUnmount(() => {
  document.removeEventListener('mousedown', onDocumentMouseDown)
  window.removeEventListener('keydown', onGlobalKeydown)
  window.removeEventListener('resize', updateExpandMetrics)
  mediaQuery?.removeEventListener('change', onMediaChange)
  lockBodyScroll(false)
})

</script>

<style lang="scss">
// Стили без scoped: подсветка <mark> рендерится через v-html,
// а префикс search-box__ исключает конфликты с другими компонентами.
.search-box {
  position: relative;
  display: flex;
  align-items: center;
  height: 100%;
}

// Открытая панель «расширяет» поле: от правого края логотипа
// (--sb-expand-left, замеряется JS) до правого края шапки, накрывая
// навигационные ссылки и кнопку смены темы.
.search-box--expanded {
  position: fixed;
  top: 0;
  left: var(--sb-expand-left);
  right: var(--navbar-padding-h, 1.5rem);
  z-index: 1; // над содержимым шапки (ссылками и кнопками)
  height: var(--navbar-height);
  animation: search-box-fade-in 0.15s ease;

  .search-box__field {
    width: 100%;
    height: var(--navbar-line-height, 2.2rem);

    .search-box__input {
      width: 100%;
    }
  }
}

.search-box__toggle {
  display: none;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  padding: 0;
  border: none;
  border-radius: 0.5rem;
  background: transparent;
  color: var(--vp-c-text);
  cursor: pointer;
  margin-right: -0.625rem;

  &:hover {
    background-color: var(--vp-c-bg-alt);
  }
}

.search-box__icon {
  width: 1.25rem;
  height: 1.25rem;
}

.search-box__field {
  position: relative;
  display: flex;
  align-items: center;
  height: 100%;
}

.search-box__field-icon {
  position: absolute;
  left: 0.65rem;
  width: 1.1rem;
  height: 1.1rem;
  color: var(--vp-c-text-mute);
  pointer-events: none;
}

.search-box__input {
  width: 15rem;
  height: 100%;
  padding: 0 4.25rem 0 2rem;
  border: 1px solid var(--vp-c-border);
  border-radius: 8px;
  background-color: var(--vp-c-bg-alt);
  color: var(--vp-c-text);
  font-size: 0.9rem;
  outline: none;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;

  &::placeholder {
    color: var(--vp-c-text-mute);
  }

  &:focus {
    border-color: var(--vp-c-accent);
    box-shadow: 0 0 0 2px var(--vp-c-accent-soft);
  }
}

.search-box__kbd {
  position: absolute;
  right: 0.55rem;
  padding: 0.05rem 0.35rem;
  border: 1px solid var(--vp-c-border);
  border-radius: 0.3rem;
  background-color: var(--vp-c-bg);
  color: var(--vp-c-text-mute);
  font-size: 0.7rem;
  line-height: 1.3;
  pointer-events: none;
}

// «×» очистки запроса: показывается, когда в поле есть текст,
// и занимает то же место, где при пустом поле висит подсказка
// о хоткее. В мобильной панели кнопка сидит в баре перед
// кнопкой закрытия.
.search-box__clear {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.5rem;
  height: 1.5rem;
  padding: 0;
  border: none;
  border-radius: 0.3rem;
  background: transparent;
  color: var(--vp-c-text-mute);
  cursor: pointer;

  &:hover {
    background-color: var(--vp-c-bg);
    color: var(--vp-c-text);
  }
}

.search-box__clear svg {
  width: 0.875rem;
  height: 0.875rem;
}

// В десктопном поле кнопка прижата к его правому краю
// (само поле — position: relative)
.search-box__field .search-box__clear {
  position: absolute;
  right: 0.45rem;
}

// На десктопе панель выровнена по левому краю расширенного поля
// (логотипу); смещение --sb-expand-left наследуется от поля и ещё
// служит защитой от выхода за экран на узких окнах.
.search-box__panel {
  position: absolute;
  top: calc(100% + 0.6rem);
  left: 0;
  z-index: 30;
  width: 100%;
  max-width: calc(100vw - var(--sb-expand-left, 0px) - 1.5rem);
  max-height: min(28rem, calc(100vh - var(--navbar-height) - 2rem));
  overflow-y: auto;
  background-color: var(--vp-c-bg-elv);
  border: 1px solid var(--vp-c-border);
  border-radius: 0.75rem;
  box-shadow: 0 1rem 2.5rem var(--vp-c-shadow, rgba(0, 0, 0, 0.12));
  animation: search-box-panel-in 0.18s ease;
}

// Затемняет страницу за открытой панелью: z-index 19 ниже шапки
// (z-index: 20), поэтому темнеет только контент страницы.
.search-box__backdrop {
  position: fixed;
  inset: 0;
  z-index: 19;
  background-color: rgba(0, 0, 0, 0.35);
  animation: search-box-fade-in 0.15s ease;
}

@keyframes search-box-fade-in {
  from {
    opacity: 0;
  }

  to {
    opacity: 1;
  }
}

@keyframes search-box-panel-in {
  from {
    opacity: 0;
    transform: translateY(-0.35rem);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.search-box__panel-bar {
  display: none;
}

.search-box__results {
  min-height: 2rem;
}

.search-box__chapter {
  display: block;
  padding: 0.55rem 1rem;
  border-top: 1px solid var(--vp-c-border);
  color: var(--vp-c-text);
  font-size: 0.9rem;
  font-weight: 600;
  text-decoration: none;

  &:hover {
    background-color: var(--vp-c-bg-alt);
  }
}

.search-box__chapter--active {
  background-color: var(--vp-c-accent-soft);
}

.search-box__page {
  display: block;
  padding: 0.45rem 1rem 0.55rem 1.5rem;
  color: var(--vp-c-text);
  text-decoration: none;

  &:hover {
    background-color: var(--vp-c-bg-alt);
  }
}

.search-box__page--active {
  background-color: var(--vp-c-accent-soft);
}

.search-box__page-title {
  display: block;
  font-size: 0.875rem;
}

.search-box__page-snippet {
  display: block;
  margin-top: 0.15rem;
  color: var(--vp-c-text-mute);
  font-size: 0.8rem;
  line-height: 1.45;
  text-wrap: auto;
}

.search-box__chapter mark,
.search-box__page mark {
  padding: 0 0.1rem;
  border-radius: 0.15rem;
  background-color: var(--vp-c-accent-hover);
  color: var(--vp-c-accent-text);
}

.search-box__state {
  padding: 1rem;
  margin: 0;
  color: var(--vp-c-text-mute);
  font-size: 0.875rem;
  text-align: center;
}

// Мобильная версия: в шапке только кнопка, панель — под шапкой
@media screen and (max-width: 719px) {
  .search-box {
    position: static;
  }

  .search-box__toggle {
    display: flex;
  }

  .search-box__field {
    display: none;
  }

  .search-box__panel {
    position: fixed;
    top: var(--navbar-height);
    left: 0;
    right: 0;
    width: auto;
    max-width: none;
    max-height: calc(100vh - var(--navbar-height));
    overflow: hidden;
    border-top: none;
    border-left: none;
    border-right: none;
    border-radius: 0;
    display: flex;
    flex-direction: column;
  }

  .search-box__panel-bar {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem;
    border-bottom: 1px solid var(--vp-c-border);
    background-color: var(--vp-c-bg-elv);
  }

  .search-box__panel-input {
    flex: 1;
    height: 2.5rem;
    padding: 0 0.75rem;
    border: 1px solid var(--vp-c-border);
    border-radius: 0.5rem;
    background-color: var(--vp-c-bg);
    color: var(--vp-c-text);
    font-size: 0.9rem;
    outline: none;

    &::placeholder {
      color: var(--vp-c-text-mute);
    }

    &:focus {
      border-color: var(--vp-c-accent);
    }
  }

  .search-box__close {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 2.5rem;
    height: 2.5rem;
    padding: 0;
    border: none;
    border-radius: 0.5rem;
    background: transparent;
    color: var(--vp-c-text-mute);
    cursor: pointer;

    &:hover {
      background-color: var(--vp-c-bg-alt);
      color: var(--vp-c-text);
    }
  }

  .search-box__close svg {
    width: 1.25rem;
    height: 1.25rem;
  }

  // «×» в мобильном баре по размеру совпадает с кнопкой закрытия
  .search-box__panel-bar .search-box__clear {
    width: 2.5rem;
    height: 2.5rem;
    border-radius: 0.5rem;
  }

  .search-box__results {
    flex: 1;
    overflow-y: auto;
  }

  .search-box__chapter {
    border-top: none;

    &:first-of-type {
      border-top: 1px solid var(--vp-c-border);
    }
  }
}
</style>
