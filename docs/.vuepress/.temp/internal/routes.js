export const redirects = JSON.parse("{}")

export const routes = Object.fromEntries([
  ["/", { loader: () => import(/* webpackChunkName: "index.html" */"/Users/oskelly/Documents/projects/my/go-book/docs/.vuepress/.temp/pages/index.html.js"), meta: {"title":"Home"} }],
  ["/guide/", { loader: () => import(/* webpackChunkName: "guide_index.html" */"/Users/oskelly/Documents/projects/my/go-book/docs/.vuepress/.temp/pages/guide/index.html.js"), meta: {"title":"Предисловие"} }],
  ["/guide/content.html", { loader: () => import(/* webpackChunkName: "guide_content.html" */"/Users/oskelly/Documents/projects/my/go-book/docs/.vuepress/.temp/pages/guide/content.html.js"), meta: {"title":"Содержание"} }],
  ["/guide/resources.html", { loader: () => import(/* webpackChunkName: "guide_resources.html" */"/Users/oskelly/Documents/projects/my/go-book/docs/.vuepress/.temp/pages/guide/resources.html.js"), meta: {"title":"Ресурсы"} }],
  ["/guide/introduction/first-programm.html", { loader: () => import(/* webpackChunkName: "guide_introduction_first-programm.html" */"/Users/oskelly/Documents/projects/my/go-book/docs/.vuepress/.temp/pages/guide/introduction/first-programm.html.js"), meta: {"title":"Первая программа: Hello World"} }],
  ["/guide/introduction/installation.html", { loader: () => import(/* webpackChunkName: "guide_introduction_installation.html" */"/Users/oskelly/Documents/projects/my/go-book/docs/.vuepress/.temp/pages/guide/introduction/installation.html.js"), meta: {"title":"Установка и настройка"} }],
  ["/guide/introduction/what-is-go.html", { loader: () => import(/* webpackChunkName: "guide_introduction_what-is-go.html" */"/Users/oskelly/Documents/projects/my/go-book/docs/.vuepress/.temp/pages/guide/introduction/what-is-go.html.js"), meta: {"title":"Что такое Go и зачем он нужен?"} }],
  ["/guide/pointers/map-pointers.html", { loader: () => import(/* webpackChunkName: "guide_pointers_map-pointers.html" */"/Users/oskelly/Documents/projects/my/go-book/docs/.vuepress/.temp/pages/guide/pointers/map-pointers.html.js"), meta: {"title":"Указатели на мапы"} }],
  ["/guide/pointers/other-pointers.html", { loader: () => import(/* webpackChunkName: "guide_pointers_other-pointers.html" */"/Users/oskelly/Documents/projects/my/go-book/docs/.vuepress/.temp/pages/guide/pointers/other-pointers.html.js"), meta: {"title":"Другие виды указателей"} }],
  ["/guide/pointers/slice-pointers.html", { loader: () => import(/* webpackChunkName: "guide_pointers_slice-pointers.html" */"/Users/oskelly/Documents/projects/my/go-book/docs/.vuepress/.temp/pages/guide/pointers/slice-pointers.html.js"), meta: {"title":"Указатели на слайсы"} }],
  ["/guide/pointers/structure-pointers.html", { loader: () => import(/* webpackChunkName: "guide_pointers_structure-pointers.html" */"/Users/oskelly/Documents/projects/my/go-book/docs/.vuepress/.temp/pages/guide/pointers/structure-pointers.html.js"), meta: {"title":"Указатели в структурах"} }],
  ["/guide/pointers/what-are-pointers.html", { loader: () => import(/* webpackChunkName: "guide_pointers_what-are-pointers.html" */"/Users/oskelly/Documents/projects/my/go-book/docs/.vuepress/.temp/pages/guide/pointers/what-are-pointers.html.js"), meta: {"title":"Что такое указатели в GO?"} }],
  ["/404.html", { loader: () => import(/* webpackChunkName: "404.html" */"/Users/oskelly/Documents/projects/my/go-book/docs/.vuepress/.temp/pages/404.html.js"), meta: {"title":""} }],
]);

if (import.meta.webpackHot) {
  import.meta.webpackHot.accept()
  if (__VUE_HMR_RUNTIME__.updateRoutes) {
    __VUE_HMR_RUNTIME__.updateRoutes(routes)
  }
  if (__VUE_HMR_RUNTIME__.updateRedirects) {
    __VUE_HMR_RUNTIME__.updateRedirects(redirects)
  }
}

if (import.meta.hot) {
  import.meta.hot.accept(({ routes, redirects }) => {
    __VUE_HMR_RUNTIME__.updateRoutes(routes)
    __VUE_HMR_RUNTIME__.updateRedirects(redirects)
  })
}
