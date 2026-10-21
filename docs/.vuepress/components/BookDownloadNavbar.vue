<template>
  <Teleport v-if="mounted" to=".vp-navbar-items-wrapper">
    <div ref="root" class="book-download-navbar">
      <button
        ref="toggle"
        class="book-download-navbar__toggle"
        type="button"
        aria-controls="book-download-menu"
        :aria-expanded="open ? 'true' : 'false'"
        @click="toggleMenu"
        @keydown.down.prevent="openMenuAndFocusFirst"
      >
        <svg aria-hidden="true" viewBox="0 0 24 24" focusable="false">
          <path d="M12 3v11m0 0 4-4m-4 4-4-4m-4 7v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
        </svg>
        <span>Скачать книгу</span>
        <svg class="book-download-navbar__arrow" aria-hidden="true" viewBox="0 0 24 24" focusable="false">
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      <div v-if="open" id="book-download-menu" ref="menu" class="book-download-navbar__menu" role="menu" aria-label="Формат книги">
        <a
          v-for="format in formats"
          :key="format.extension"
          ref="formatLinks"
          class="book-download-navbar__format"
          :href="withBase(format.filename)"
          :download="format.filename.slice(1)"
          role="menuitem"
          @click="close"
          @keydown="onFormatKeydown"
        >
          <strong>{{ format.name }}</strong>
          <span>{{ format.description }}</span>
        </a>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { withBase } from 'vuepress/client'

interface BookFormat {
  name: string
  extension: string
  filename: string
  description: string
}

const formats: BookFormat[] = [
  {
    name: 'PDF',
    extension: 'pdf',
    filename: '/go-book.pdf',
    description: 'для компьютера и печати',
  },
  {
    name: 'EPUB',
    extension: 'epub',
    filename: '/go-book.epub',
    description: 'для ридеров и телефона',
  },
]

const root = ref<HTMLElement | null>(null)
const toggle = ref<HTMLButtonElement | null>(null)
const menu = ref<HTMLElement | null>(null)
const formatLinks = ref<HTMLAnchorElement[]>([])
const mounted = ref(false)
const open = ref(false)

function close(restoreFocus = false): void {
  open.value = false
  if (restoreFocus) void nextTick(() => toggle.value?.focus())
}

function toggleMenu(): void {
  if (open.value) {
    close()
    return
  }
  open.value = true
}

function openMenuAndFocusFirst(): void {
  if (!open.value) open.value = true
  void nextTick(() => formatLinks.value[0]?.focus())
}

function onDocumentMouseDown(event: MouseEvent): void {
  if (open.value && root.value && !root.value.contains(event.target as Node)) close()
}

function onDocumentKeydown(event: KeyboardEvent): void {
  if (event.key === 'Escape' && open.value) {
    event.preventDefault()
    close(true)
  }
}

function onFormatKeydown(event: KeyboardEvent): void {
  const current = formatLinks.value.indexOf(event.currentTarget as HTMLAnchorElement)
  if (current === -1) return

  if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
    event.preventDefault()
    const delta = event.key === 'ArrowDown' ? 1 : -1
    const next = (current + delta + formatLinks.value.length) % formatLinks.value.length
    formatLinks.value[next]?.focus()
  }
}

onMounted(() => {
  mounted.value = true
  document.addEventListener('mousedown', onDocumentMouseDown)
  document.addEventListener('keydown', onDocumentKeydown)

  void nextTick(() => {
    const wrapper = document.querySelector('.vp-navbar-items-wrapper')
    const download = wrapper?.querySelector('.book-download-navbar')
    const colorMode = wrapper?.querySelector('.vp-toggle-color-mode-button')
    if (download && colorMode) wrapper.append(download)
  })
})

onBeforeUnmount(() => {
  document.removeEventListener('mousedown', onDocumentMouseDown)
  document.removeEventListener('keydown', onDocumentKeydown)
})
</script>

<style lang="scss">
.book-download-navbar { position: relative; }
.book-download-navbar__toggle {
  display: inline-flex; align-items: center; gap: .4rem; min-height: 2.2rem; padding: .35rem .65rem;
  color: var(--vp-c-accent); font: inherit; font-size: .82rem; font-weight: 600; line-height: 1;
  background: var(--vp-c-bg); border: 1px solid var(--vp-c-border); border-radius: .35rem; cursor: pointer;
  &:hover, &[aria-expanded='true'] { color: var(--vp-c-accent-text); background: var(--vp-c-accent-bg); border-color: var(--vp-c-accent-bg); }
  &:focus-visible { outline: 2px solid var(--vp-c-accent); outline-offset: 2px; }
  svg { width: 1rem; height: 1rem; fill: none; stroke: currentColor; stroke-linecap: round; stroke-linejoin: round; stroke-width: 2; }
}
.book-download-navbar__toggle .book-download-navbar__arrow { width: .85rem; height: .85rem; }
.book-download-navbar__menu {
  position: absolute; top: calc(100% + .5rem); right: 0; z-index: 30; min-width: 15.5rem; overflow: hidden;
  border: 1px solid var(--vp-c-border); border-radius: .5rem; background: var(--vp-c-bg-elv); box-shadow: 0 .75rem 2rem rgba(0, 0, 0, .16);
}
.book-download-navbar__format {
  display: flex; flex-direction: column; gap: .2rem; padding: .7rem .85rem; color: var(--vp-c-text); text-decoration: none;
  &:hover, &:focus-visible { background: var(--vp-c-bg-alt); outline: none; }
  strong { color: var(--vp-c-accent); font-size: .88rem; }
  span { color: var(--vp-c-text-mute); font-size: .78rem; }

  strong,
  span {
    line-height: 1;
  }
}
.book-download-navbar__format + .book-download-navbar__format { border-top: 1px solid var(--vp-c-border); }
@media screen and (max-width: 719px) {
  .book-download-navbar__toggle { width: 2.2rem; padding: 0; justify-content: center; }
  .book-download-navbar__toggle span, .book-download-navbar__arrow { position: absolute; width: 1px !important; height: 1px !important; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0; }
}
</style>
