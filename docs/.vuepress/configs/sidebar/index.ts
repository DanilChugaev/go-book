import type { SidebarOptions } from '@vuepress/theme-default'

export const sidebarEn: SidebarOptions = {
  '/guide/': [
    {
      text: '',
      children: [
        '/guide/README.md',
        {
          text: 'Глава 13: Указатели',
          link: '/guide/pointers/what-are-pointers.md',
          children: [
            '/guide/pointers/what-are-pointers.md',
            '/guide/pointers/slice-pointers.md',
            '/guide/pointers/map-pointers.md',
            '/guide/pointers/structure-pointers.md',
            '/guide/pointers/other-pointers.md',
          ],          
        }
      ],
    },
  ],
}