import { defineUserConfig } from 'vuepress'
import { fileURLToPath } from 'node:url'

import { defaultTheme } from '@vuepress/theme-default'
import { viteBundler } from '@vuepress/bundler-vite'
import { pwaPlugin } from '@vuepress/plugin-pwa'

import { searchPlugin, sidebarEn } from './configs'

export default defineUserConfig({
  lang: 'ru-RU',

  base: '/go-book/',
  title: 'Учебник Go',
  description: 'Учебник для изучения языка программирования Go с тестированием и практическими заданиями',

  // Service Worker управляет кэшем ресурсов, поэтому VuePress не должен
  // дополнительно добавлять ссылки prefetch для всех страниц.
  shouldPrefetch: false,

  theme: defaultTheme({
    logo: '/go-logo.svg',

    // navbar: ['/', '/guide/'],

    sidebar: sidebarEn
  }),

  plugins: [
    // Индекс поиска по учебнику: собирается из сайдбара и страниц,
    // пишется в `.vuepress/.temp/search/data.js` и подгружается
    // компонентом SearchBox лениво, отдельным чанком.
    searchPlugin(),
    pwaPlugin({
      appendBase: true,
      showInstall: true,
      // Режим «available»: когда новая версия готова (waiting),
      // показывается постоянный попап, а «Обновить» шлёт SKIP_WAITING —
      // новый service worker активируется сразу, страница автоперезагружается.
      // Режим «hint» сломан в rc.137 плагина: тост исчезает ровно тогда,
      // когда версия готова, а его кнопка только перезагружает страницу,
      // что не активирует waiting-worker.
      update: 'available',
      cacheHTML: true,
      cacheImage: true,
      // Навигация на страницу, которой нет в precache (опечатка,
      // битая ссылка, оффлайн), обслуживается 404-страницей вместо
      // экрана «нет сети» браузера. Относительный путь резолвится
      // от директории service worker (/go-book/).
      generateSWConfig: {
        navigateFallback: '404.html',
        // Полнотекстовый индекс загружается только при первом использовании
        // поиска или закладок. Его нельзя добавлять в precache: иначе service
        // worker скачивает более 1 МБ до любого действия пользователя.
        globIgnores: ['assets/data-*.js'],
        runtimeCaching: [
          {
            urlPattern: /\/go-book\/assets\/data-[\w-]+\.js$/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'go-book-search-index',
              expiration: {
                maxEntries: 1,
                maxAgeSeconds: 60 * 60 * 24 * 30,
              },
            },
          },
        ],
      },
      themeColor: '#00ADD8',
      // Явный favicon не нужен: плагин уже вставляет ссылку на
      // 192-иконку из manifest — дублировать один и тот же файл дважды
      // в <head> нет смысла.
      apple: {
        icon: '/icons/go-book-180.png',
      },
      manifest: {
        // GitHub Pages публикует учебник в подпути. Эти три поля должны
        // быть внутри base, иначе браузер считает PWA приложением сайта в корне.
        id: '/go-book/',
        name: 'Учебник Go',
        short_name: 'Учебник Go',
        description: 'Интерактивный учебник Go: теория, самопроверка и практика',
        lang: 'ru-RU',
        start_url: '/go-book/',
        scope: '/go-book/',
        display: 'standalone',
        background_color: '#FFFFFF',
        theme_color: '#00ADD8',
        categories: ['education', 'books'],
        icons: [
          {
            src: '/icons/go-book-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/icons/go-book-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: '/icons/go-book-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      locales: {
        '/': {
          install: 'Установить',
          iOSInstall: 'Нажмите «Поделиться», затем выберите «На экран «Домой»»',
          cancel: 'Отмена',
          close: 'Закрыть',
          prevImage: 'Предыдущее изображение',
          nextImage: 'Следующее изображение',
          desc: 'Описание',
          feature: 'Возможности',
          explain: 'Установите учебник на телефон или компьютер, чтобы открыть его как отдельное приложение.',
          hint: 'Доступна новая версия учебника.',
          update: 'Обновить',
        },
      },
    }),
  ],

  // Представленные ниже компоненты темы отличаются от исходных версий только атрибутами
  // загрузки изображений. Явное указание внутренних размеров предотвращает сдвиги макета,
  // вызванные логотипом, а атрибут fetchpriority позволяет определить главный логотип как элемент LCP.
  bundler: viteBundler({
    viteOptions: {
      build: {
        // Стили редких интерактивных компонентов не должны блокировать
        // первую отрисовку. Vite загрузит их вместе с соответствующим
        // асинхронным JavaScript-чанком.
        cssCodeSplit: true,
      },
      resolve: {
        alias: {
          '@theme/VPHomeHero.vue': fileURLToPath(
            new URL('./components/VPHomeHero.vue', import.meta.url),
          ),
          '@theme/VPNavbarBrand.vue': fileURLToPath(
            new URL('./components/VPNavbarBrand.vue', import.meta.url),
          ),
        },
      },
    },
  }),
})
