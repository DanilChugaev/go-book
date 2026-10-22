export interface ISearchPage {
  /**
   * Маршрут страницы (формат ключей таблицы маршрутов):
   * `/guide/strings/tests.html` или `/guide/strings/`.
   */
  path: string;
  /** Название страницы (`title` из frontmatter или первый `H1`) */
  title: string;
  /** Название главы, к которой относится страница, или `undefined` для общих страниц */
  chapter?: string;
  /** Маршрут первой страницы главы */
  chapterPath?: string;
  /** Чистый текст страницы для полнотекстового поиска */
  text: string;
}

export interface ISearchChapter {
  /** Название главы */
  title: string;
  /** Маршрут первой страницы главы */
  path: string;
}

/**
 * Индекс поиска по учебнику.
 *
 * Собирается плагином `searchPlugin` (см. `plugin.ts`) в момент сборки
 * и пишется в `.vuepress/.temp/search/data.js`. Компонент `SearchBox`
 * подгружает этот модуль лениво, отдельным чанком.
 */
export interface ISearchIndex {
  chapters: ISearchChapter[];
  pages: ISearchPage[];
}
