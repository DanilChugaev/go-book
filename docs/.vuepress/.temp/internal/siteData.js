export const siteData = JSON.parse("{\"base\":\"/go-book/\",\"lang\":\"ru-RU\",\"title\":\" \",\"description\":\"Учебник для изучения языка программирования Go с тестированием и практическими заданиями\",\"head\":[],\"locales\":{}}")

if (import.meta.webpackHot) {
  import.meta.webpackHot.accept()
  if (__VUE_HMR_RUNTIME__.updateSiteData) {
    __VUE_HMR_RUNTIME__.updateSiteData(siteData)
  }
}

if (import.meta.hot) {
  import.meta.hot.accept(({ siteData }) => {
    __VUE_HMR_RUNTIME__.updateSiteData(siteData)
  })
}
