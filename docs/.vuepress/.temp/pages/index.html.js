import comp from "/Users/oskelly/Documents/projects/my/go-book/docs/.vuepress/.temp/pages/index.html.vue"
const data = JSON.parse("{\"path\":\"/\",\"title\":\"Home\",\"lang\":\"ru-RU\",\"frontmatter\":{\"home\":true,\"title\":\"Home\",\"heroImage\":\"https://go.dev/images/go-logo-white.svg\",\"actions\":[{\"text\":\"Начать изучение\",\"link\":\"/guide/\",\"type\":\"primary\"}],\"footer\":\"Статус: в процессе...\"},\"headers\":[],\"git\":{\"updatedTime\":1762455042000,\"contributors\":[{\"name\":\"Danil Chugaev\",\"username\":\"\",\"email\":\"dmchugaev@gmail.com\",\"commits\":1}],\"changelog\":[{\"hash\":\"68353a1da016c1342abe3afb36d0a71cf927ee86\",\"time\":1762455042000,\"email\":\"dmchugaev@gmail.com\",\"author\":\"Danil Chugaev\",\"message\":\"initial commit\"}]},\"filePathRelative\":\"README.md\"}")
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
