import { defaultTheme } from '@vuepress/theme-default'
import { defineUserConfig } from 'vuepress'
import { viteBundler } from '@vuepress/bundler-vite'
import { sidebarEn } from './configs'

export default defineUserConfig({
  lang: 'ru-RU',

  title: ' ',
  description: 'Изучение языка GO на практике',

  theme: defaultTheme({
    logo: 'https://go.dev/images/go-logo-white.svg',

    // navbar: ['/', '/guide/'],

    sidebar: sidebarEn
  }),

  bundler: viteBundler(),
})
