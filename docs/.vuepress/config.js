import { defineUserConfig } from 'vuepress'

import { defaultTheme } from '@vuepress/theme-default'
import { viteBundler } from '@vuepress/bundler-vite'
import { pwaPlugin } from '@vuepress/plugin-pwa'

import { sidebarEn } from './configs'

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
    pwaPlugin({
      appendBase: true,
      showInstall: true,
      update: 'hint',
      cacheHTML: true,
      cacheImage: true,
      themeColor: '#00ADD8',
      favicon: '/icons/go-book-192.png',
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

  bundler: viteBundler(),
})
