import comp from "/Users/oskelly/Documents/projects/my/go-book/docs/.vuepress/.temp/pages/guide/index.html.vue"
const data = JSON.parse("{\"path\":\"/guide/\",\"title\":\"Предисловие\",\"lang\":\"ru-RU\",\"frontmatter\":{},\"headers\":[],\"git\":{\"updatedTime\":1762628819000,\"contributors\":[{\"name\":\"Danil Chugaev\",\"username\":\"\",\"email\":\"dmchugaev@gmail.com\",\"commits\":2}],\"changelog\":[{\"hash\":\"5c65eea02c98031295b5dc120c46442ecb61c7fe\",\"time\":1762628819000,\"email\":\"dmchugaev@gmail.com\",\"author\":\"Danil Chugaev\",\"message\":\"adds first chapter\"},{\"hash\":\"68353a1da016c1342abe3afb36d0a71cf927ee86\",\"time\":1762455042000,\"email\":\"dmchugaev@gmail.com\",\"author\":\"Danil Chugaev\",\"message\":\"initial commit\"}]},\"filePathRelative\":\"guide/README.md\"}")
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
