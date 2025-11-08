import comp from "/Users/oskelly/Documents/projects/my/go-book/docs/.vuepress/.temp/pages/guide/resources.html.vue"
const data = JSON.parse("{\"path\":\"/guide/resources.html\",\"title\":\"Ресурсы\",\"lang\":\"ru-RU\",\"frontmatter\":{},\"headers\":[],\"git\":{\"updatedTime\":1762628819000,\"contributors\":[{\"name\":\"Danil Chugaev\",\"username\":\"\",\"email\":\"dmchugaev@gmail.com\",\"commits\":1}],\"changelog\":[{\"hash\":\"5c65eea02c98031295b5dc120c46442ecb61c7fe\",\"time\":1762628819000,\"email\":\"dmchugaev@gmail.com\",\"author\":\"Danil Chugaev\",\"message\":\"adds first chapter\"}]},\"filePathRelative\":\"guide/resources.md\"}")
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
