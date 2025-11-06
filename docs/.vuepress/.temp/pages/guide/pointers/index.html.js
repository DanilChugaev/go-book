import comp from "/Users/oskelly/Documents/projects/my/go-book/docs/.vuepress/.temp/pages/guide/pointers/index.html.vue"
const data = JSON.parse("{\"path\":\"/guide/pointers/\",\"title\":\"Глава 13 - Указатели\",\"lang\":\"ru-RU\",\"frontmatter\":{},\"headers\":[],\"git\":{},\"filePathRelative\":\"guide/pointers/README.md\"}")
export { comp, data }

if (import.meta.webpackHot) {
  import.meta.webpackHot.accept()
  if (__VUE_HMR_RUNTIME__.updatePageData) {
    __VUE_HMR_RUNTIME__.updatePageData(data)
  }
}

if (import.meta.hot) {
  import.meta.hot.accept(({ data }) => {
    __VUE_HMR_RUNTIME__.updatePageData(data)
  })
}
