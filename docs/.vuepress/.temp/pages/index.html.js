import comp from "/Users/oskelly/Documents/projects/my/go-book/docs/.vuepress/.temp/pages/index.html.vue"
const data = JSON.parse("{\"path\":\"/\",\"title\":\"Home\",\"lang\":\"ru-RU\",\"frontmatter\":{\"home\":true,\"title\":\"Home\",\"heroImage\":\"https://go.dev/images/go-logo-white.svg\",\"actions\":[{\"text\":\"Начать изучение\",\"link\":\"/guide/\",\"type\":\"primary\"}]},\"headers\":[],\"git\":{},\"filePathRelative\":\"README.md\"}")
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
