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
            '/guide/introduction/best-practices.md',
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
            '/guide/variables-and-data-types/best-practices.md',
          ],          
        },
        {
          text: 'Глава 3: Строки и обработка текста',
          link: '/guide/strings/README.md',
          collapsible: true,
          children: [
            '/guide/strings/README.md',
            '/guide/strings/tests.md',
            '/guide/strings/practice.md',
            '/guide/strings/best-practices.md',
          ],
        },
        {
          text: 'Глава 4: Операторы и выражения',
          link: '/guide/operators-and-expressions/README.md',
          collapsible: true,
          children: [
            '/guide/operators-and-expressions/README.md',
            '/guide/operators-and-expressions/tests.md',
            '/guide/operators-and-expressions/practice.md',
            '/guide/operators-and-expressions/best-practices.md',
          ],
        },
        {
          text: 'Глава 5: Условия — if и switch',
          link: '/guide/control-flow/README.md',
          collapsible: true,
          children: [
            '/guide/control-flow/README.md',
            '/guide/control-flow/tests.md',
            '/guide/control-flow/practice.md',
            '/guide/control-flow/best-practices.md',
          ],
        },
        {
          text: 'Глава 6: Циклы — for и range',
          link: '/guide/loops/README.md',
          collapsible: true,
          children: [
            '/guide/loops/README.md',
            '/guide/loops/tests.md',
            '/guide/loops/practice.md',
            '/guide/loops/best-practices.md',
          ],
        },
        {
          text: 'Глава 7: Функции',
          link: '/guide/functions/README.md',
          collapsible: true,
          children: [
            '/guide/functions/README.md',
            '/guide/functions/tests.md',
            '/guide/functions/practice.md',
            '/guide/functions/best-practices.md',
          ],
        },
        {
          text: 'Глава 8: Массивы и слайсы',
          link: '/guide/slices-and-arrays/README.md',
          collapsible: true,
          children: [
            '/guide/slices-and-arrays/README.md',
            '/guide/slices-and-arrays/tests.md',
            '/guide/slices-and-arrays/practice.md',
            '/guide/slices-and-arrays/best-practices.md',
          ],
        },
        {
          text: 'Глава 9: Map',
          link: '/guide/maps/README.md',
          collapsible: true,
          children: [
            '/guide/maps/README.md',
            '/guide/maps/tests.md',
            '/guide/maps/practice.md',
            '/guide/maps/best-practices.md',
          ],
        },
        {
          text: 'Глава 10: Структуры',
          link: '/guide/structs/README.md',
          collapsible: true,
          children: [
            '/guide/structs/README.md',
            '/guide/structs/tests.md',
            '/guide/structs/practice.md',
            '/guide/structs/best-practices.md',
          ],
        },
        {
          text: 'Глава 11: Методы',
          link: '/guide/methods/README.md',
          collapsible: true,
          children: [
            '/guide/methods/README.md',
            '/guide/methods/tests.md',
            '/guide/methods/practice.md',
            '/guide/methods/best-practices.md',
          ],
        },
        {
          text: 'Глава 12: Указатели',
          link: '/guide/pointers/README.md',
          collapsible: true,
          children: [
            '/guide/pointers/README.md',
            '/guide/pointers/tests.md',
            '/guide/pointers/practice.md',
            '/guide/pointers/best-practices.md',
          ],          
        },
        {
          text: 'Глава 13: Интерфейсы',
          link: '/guide/interfaces/README.md',
          collapsible: true,
          children: [
            '/guide/interfaces/README.md',
            '/guide/interfaces/tests.md',
            '/guide/interfaces/practice.md',
            '/guide/interfaces/best-practices.md',
          ],
        },
        {
          text: 'Глава 14: Обработка ошибок',
          link: '/guide/errors/README.md',
          collapsible: true,
          children: [
            '/guide/errors/README.md',
            '/guide/errors/tests.md',
            '/guide/errors/practice.md',
            '/guide/errors/best-practices.md',
          ],
        },
        {
          text: 'Глава 15: Пакеты и модули',
          link: '/guide/packages-and-modules/README.md',
          collapsible: true,
          children: [
            '/guide/packages-and-modules/README.md',
            '/guide/packages-and-modules/tests.md',
            '/guide/packages-and-modules/practice.md',
            '/guide/packages-and-modules/best-practices.md',
          ],
        },
        {
          text: 'Глава 16: Файлы и ввод-вывод',
          link: '/guide/file-io/README.md',
          collapsible: true,
          children: [
            '/guide/file-io/README.md',
            '/guide/file-io/tests.md',
            '/guide/file-io/practice.md',
            '/guide/file-io/best-practices.md',
          ],
        },
        {
          text: 'Глава 17: JSON и сериализация',
          link: '/guide/json/README.md',
          collapsible: true,
          children: [
            '/guide/json/README.md',
            '/guide/json/tests.md',
            '/guide/json/practice.md',
            '/guide/json/best-practices.md',
          ],
        },
        {
          text: 'Глава 18: Время и дедлайны',
          link: '/guide/time/README.md',
          collapsible: true,
          children: [
            '/guide/time/README.md',
            '/guide/time/tests.md',
            '/guide/time/practice.md',
            '/guide/time/best-practices.md',
          ],
        },
        {
          text: 'Глава 19: Goroutine',
          link: '/guide/goroutines/README.md',
          collapsible: true,
          children: [
            '/guide/goroutines/README.md',
            '/guide/goroutines/tests.md',
            '/guide/goroutines/practice.md',
            '/guide/goroutines/best-practices.md',
          ],
        },
        {
          text: 'Глава 20: Каналы',
          link: '/guide/channels/README.md',
          collapsible: true,
          children: [
            '/guide/channels/README.md',
            '/guide/channels/tests.md',
            '/guide/channels/practice.md',
            '/guide/channels/best-practices.md',
          ],
        },
        {
          text: 'Глава 21: Select и таймауты',
          link: '/guide/select-and-timeouts/README.md',
          collapsible: true,
          children: [
            '/guide/select-and-timeouts/README.md',
            '/guide/select-and-timeouts/tests.md',
            '/guide/select-and-timeouts/practice.md',
            '/guide/select-and-timeouts/best-practices.md',
          ],
        },
        {
          text: 'Глава 22: Mutex и синхронизация',
          link: '/guide/mutex-and-synchronization/README.md',
          collapsible: true,
          children: [
            '/guide/mutex-and-synchronization/README.md',
            '/guide/mutex-and-synchronization/tests.md',
            '/guide/mutex-and-synchronization/practice.md',
            '/guide/mutex-and-synchronization/best-practices.md',
          ],
        },
        {
          text: 'Глава 23: Context',
          link: '/guide/context/README.md',
          collapsible: true,
          children: [
            '/guide/context/README.md',
            '/guide/context/tests.md',
            '/guide/context/practice.md',
            '/guide/context/best-practices.md',
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
