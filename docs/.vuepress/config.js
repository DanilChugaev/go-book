import { defaultTheme } from '@vuepress/theme-default'
import { defineUserConfig } from 'vuepress'
import { viteBundler } from '@vuepress/bundler-vite'
import { sidebarEn } from './configs'

export default defineUserConfig({
  lang: 'ru-RU',

  // base: '/go-book/',
  title: ' ',
  description: 'Учебник для изучения языка программирования Go с тестированием и практическими заданиями',

  theme: defaultTheme({
    logo: 'https://go.dev/images/go-logo-white.svg',

    // navbar: ['/', '/guide/'],

    sidebar: sidebarEn
  }),

  bundler: viteBundler(),
})
