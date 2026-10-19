import { defineAsyncComponent } from 'vue'
import { defineClientConfig } from 'vuepress/client'
import BookmarksNavbar from './components/BookmarksNavbar.vue'

// Обходной путь для бага Vue 3.5.44 (runtime-core, hydrateTeleport).
//
// Тёмная тема и поиск по учебнику — это `<Teleport to="body">` внутри
// theme-default. В SSR они пустые (v-if false), поэтому в HTML нет
// маркеров `teleport start anchor` / `teleport anchor`. При mount
// `hydrateTeleport` находит `<body>`, берёт
// `targetNode = body._lpa || body.firstChild`, а `body.firstChild` —
// whitespace-текстовый узел ПЕРЕД `#app`. Далее
// `hydrateChildren(nextSibling(targetNode), ...)` получает `div#app`:
// mismatch (элемент против Comment-vnode) вызывает `handleMismatch`,
// который УДАЛЯЕТ `#app` из `<body>` — страница становится пустой.
//
// Фикс ДО mount: разместить маркеры телепортов в `<body>` так, чтобы
// hydration их «нашёл» и адаптировал готовые comment-узлы, а не забрёл
// в `#app`:
//   - маркеры — сразу после `#app` (не в конец тела: иначе
//     `_lpa = nextSibling(маркер) = null` и скан опять упадёт
//     на `body.firstChild`);
//   - `body._lpa` указываем на первый маркер;
//   - пустой comment перед скриптом — точка входа для всех
//     последующих телепортов (их `hydrateChildren` стартует с него,
//     а не со скриптового тега).
// В dev hydration не происходит (`createApp`), поэтому блок
// выполняется только в production-сборке.
const ensureTeleportAnchors = () => {
  // client.js импортируется и в SSR-бандле: на сервере document нет.
  if (import.meta.env.DEV || typeof document === 'undefined') return
  const body = document.body
  const app = document.getElementById('app')
  if (!app || body.__vpTeleportAnchors) return

  app.insertAdjacentHTML(
    'afterend',
    '<!--teleport start anchor--><!--teleport anchor-->',
  )

  const moduleScript = document.querySelector('body > script[type="module"]')
  if (moduleScript) {
    moduleScript.insertAdjacentHTML('beforebegin', '<!---->')
  } else {
    body.insertAdjacentHTML('beforeend', '<!---->')
  }

  // `nextSibling` app — это только что вставленный
  // «teleport start anchor».
  body._lpa = app.nextSibling
  body.__vpTeleportAnchors = true
}
ensureTeleportAnchors()

// Интерактивные компоненты не нужны для первичной отрисовки каждой страницы.
// Регистрируем их асинхронно, чтобы Vite вынес их код и стили из стартового
// пакета. SSR по-прежнему ждёт эти компоненты и отдаёт готовую HTML-разметку.
const components = {
  BookmarksHome: defineAsyncComponent(
    () => import('./components/BookmarksHome.vue'),
  ),
  GoPlayground: defineAsyncComponent(
    () => import('./components/GoPlayground.vue'),
  ),
  QuizContainer: defineAsyncComponent(
    () => import('./components/QuizContainer.vue'),
  ),
  SearchBox: defineAsyncComponent(
    () => import('./components/SearchBox.vue'),
  ),
}

export default defineClientConfig({
  rootComponents: [BookmarksNavbar],
  enhance({ app }) {
    Object.entries(components).forEach(([name, component]) => {
      app.component(name, component)
    })
  },
})
