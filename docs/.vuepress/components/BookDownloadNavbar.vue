<template>
  <Teleport v-if="mounted" to=".vp-navbar-items-wrapper">
    <a
      class="book-download-navbar"
      :href="withBase('/go-book.pdf')"
      download="go-book.pdf"
      title="Скачать полную версию учебника в PDF"
    >
      <svg aria-hidden="true" viewBox="0 0 24 24" focusable="false">
        <path d="M12 3v11m0 0 4-4m-4 4-4-4m-4 7v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
      </svg>
      <span>Скачать PDF</span>
    </a>
  </Teleport>
</template>

<script setup lang="ts">
import { nextTick, onMounted, ref } from 'vue'
import { withBase } from 'vuepress/client'

const mounted = ref(false)

onMounted(() => {
  mounted.value = true

  void nextTick(() => {
    const wrapper = document.querySelector('.vp-navbar-items-wrapper')
    const download = wrapper?.querySelector('.book-download-navbar')
    const colorMode = wrapper?.querySelector('.vp-toggle-color-mode-button')

    if (download && colorMode) wrapper.append(download)
  })
})
</script>

<style lang="scss">
.book-download-navbar {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.35rem 0.65rem;
  color: var(--vp-c-accent);
  font-size: 0.82rem;
  font-weight: 600;
  line-height: 1;
  text-decoration: none;
  border: 1px solid var(--vp-c-border);
  border-radius: 0.35rem;

  &:hover {
    color: var(--vp-c-accent-text);
    background: var(--vp-c-accent-bg);
    border-color: var(--vp-c-accent-bg);
  }

  &:focus-visible {
    outline: 2px solid var(--vp-c-accent);
    outline-offset: 2px;
  }

  svg {
    width: 1rem;
    height: 1rem;
    fill: none;
    stroke: currentColor;
    stroke-linecap: round;
    stroke-linejoin: round;
    stroke-width: 2;
  }
}

@media screen and (max-width: 719px) {
  .book-download-navbar {
    width: 2.2rem;
    padding: 0;
    justify-content: center;

    span {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border: 0;
    }
  }
}
</style>
