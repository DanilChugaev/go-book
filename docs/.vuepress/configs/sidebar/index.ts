import type { SidebarOptions } from '@vuepress/theme-default'

export const sidebarEn: SidebarOptions = {
  '/guide/': [
    {
      text: '',
      children: [
        '/guide/README.md',
        '/guide/content.md',
        {
          text: 'Глава 1: Введение в Go',
          link: '/guide/introduction/what-is-go.md',
          collapsible: true,
          children: [
            '/guide/introduction/what-is-go.md',
            '/guide/introduction/installation.md',
            '/guide/introduction/first-program.md',
          ],          
        },
        {
          text: 'Глава 2: Переменные и Типы Данных',
          link: '/guide/variables-and-data-types/variables.md',
          collapsible: true,
          children: [
            '/guide/variables-and-data-types/variables.md',
            '/guide/variables-and-data-types/simple-data-types.md',
            '/guide/variables-and-data-types/composite-data-types.md',
          ],          
        },
        {
          text: 'Глава 13: Указатели',
          link: '/guide/pointers/what-are-pointers.md',
          collapsible: true,
          children: [
            '/guide/pointers/what-are-pointers.md',
            '/guide/pointers/slice-pointers.md',
            '/guide/pointers/map-pointers.md',
            '/guide/pointers/structure-pointers.md',
            '/guide/pointers/embedded-structure-pointers.md',
            '/guide/pointers/function-pointers.md',
            '/guide/pointers/other-pointers.md',
          ],          
        },
        {
          text: 'Справочник',
          link: '/guide/directory/base-directory.md',
          collapsible: true,
          children: [
            '/guide/directory/base-directory.md',
            '/guide/directory/advanced-directory.md',
          ],          
        },
        '/guide/resources.md',
      ],
    },
  ],
}