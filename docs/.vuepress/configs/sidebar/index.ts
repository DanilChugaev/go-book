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
            '/guide/introduction/first-programm.md',
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
            '/guide/pointers/other-pointers.md',
          ],          
        },
        '/guide/resources.md',
      ],
    },
  ],
}