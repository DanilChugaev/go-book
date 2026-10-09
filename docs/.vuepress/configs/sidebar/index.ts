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
            '/guide/introduction/tests.md',
            '/guide/introduction/practice.md',
          ],          
        },
        {
          text: 'Глава 2: Переменные и базовые типы',
          link: '/guide/variables-and-data-types/variables.md',
          collapsible: true,
          children: [
            '/guide/variables-and-data-types/variables.md',
            '/guide/variables-and-data-types/simple-data-types.md',
            '/guide/variables-and-data-types/tests.md',
            '/guide/variables-and-data-types/practice.md',
          ],          
        },
        {
          text: 'Глава 3: Операторы и выражения',
          link: '/guide/operators-and-expressions/README.md',
          collapsible: true,
          children: [
            '/guide/operators-and-expressions/README.md',
            '/guide/operators-and-expressions/tests.md',
            '/guide/operators-and-expressions/practice.md',
          ],
        },
        {
          text: 'Глава 4: Условия — if и switch',
          link: '/guide/control-flow/README.md',
          collapsible: true,
          children: [
            '/guide/control-flow/README.md',
            '/guide/control-flow/tests.md',
            '/guide/control-flow/practice.md',
          ],
        },
        {
          text: 'Глава 5: Циклы — for и range',
          link: '/guide/loops/README.md',
          collapsible: true,
          children: [
            '/guide/loops/README.md',
            '/guide/loops/tests.md',
            '/guide/loops/practice.md',
          ],
        },
        {
          text: 'Глава 6: Функции',
          link: '/guide/functions/README.md',
          collapsible: true,
          children: [
            '/guide/functions/README.md',
            '/guide/functions/tests.md',
            '/guide/functions/practice.md',
          ],
        },
        {
          text: 'Глава 7: Массивы и слайсы',
          link: '/guide/slices-and-arrays/README.md',
          collapsible: true,
          children: [
            '/guide/slices-and-arrays/README.md',
            '/guide/slices-and-arrays/tests.md',
            '/guide/slices-and-arrays/practice.md',
          ],
        },
        {
          text: 'Глава 8: Map',
          link: '/guide/maps/README.md',
          collapsible: true,
          children: [
            '/guide/maps/README.md',
            '/guide/maps/tests.md',
            '/guide/maps/practice.md',
          ],
        },
        {
          text: 'Глава 9: Структуры',
          link: '/guide/structs/README.md',
          collapsible: true,
          children: [
            '/guide/structs/README.md',
            '/guide/structs/tests.md',
            '/guide/structs/practice.md',
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
            '/guide/pointers/tests.md',
            '/guide/pointers/practice.md',
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
