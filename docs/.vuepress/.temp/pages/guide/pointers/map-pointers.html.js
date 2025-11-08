import comp from "/Users/oskelly/Documents/projects/my/go-book/docs/.vuepress/.temp/pages/guide/pointers/map-pointers.html.vue"
const data = JSON.parse("{\"path\":\"/guide/pointers/map-pointers.html\",\"title\":\"Указатели на мапы\",\"lang\":\"ru-RU\",\"frontmatter\":{},\"headers\":[],\"git\":{\"updatedTime\":1762455042000,\"contributors\":[{\"name\":\"Danil Chugaev\",\"username\":\"\",\"email\":\"dmchugaev@gmail.com\",\"commits\":1}],\"changelog\":[{\"hash\":\"68353a1da016c1342abe3afb36d0a71cf927ee86\",\"time\":1762455042000,\"email\":\"dmchugaev@gmail.com\",\"author\":\"Danil Chugaev\",\"message\":\"initial commit\"}]},\"filePathRelative\":\"guide/pointers/map-pointers.md\"}")
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
