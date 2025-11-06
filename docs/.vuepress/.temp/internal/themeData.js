export const themeData = JSON.parse("{\"logo\":\"https://go.dev/images/go-logo-white.svg\",\"sidebar\":{\"/guide/\":[{\"text\":\"\",\"children\":[\"/guide/README.md\",{\"text\":\"Глава 13: Указатели\",\"link\":\"/guide/pointers/what-are-pointers.md\",\"children\":[\"/guide/pointers/what-are-pointers.md\",\"/guide/pointers/slice-pointers.md\",\"/guide/pointers/map-pointers.md\",\"/guide/pointers/structure-pointers.md\",\"/guide/pointers/other-pointers.md\"]}]}]},\"locales\":{\"/\":{\"selectLanguageName\":\"English\"}},\"colorMode\":\"auto\",\"colorModeSwitch\":true,\"navbar\":[],\"repo\":null,\"selectLanguageText\":\"Languages\",\"selectLanguageAriaLabel\":\"Select language\",\"sidebarDepth\":2,\"editLink\":true,\"editLinkText\":\"Edit this page\",\"lastUpdated\":true,\"contributors\":true,\"contributorsText\":\"Contributors\",\"notFound\":[\"There's nothing here.\",\"How did we get here?\",\"That's a Four-Oh-Four.\",\"Looks like we've got some broken links.\"],\"backToHome\":\"Take me home\",\"openInNewWindow\":\"open in new window\",\"toggleColorMode\":\"toggle color mode\",\"toggleSidebar\":\"toggle sidebar\"}")

if (import.meta.webpackHot) {
  import.meta.webpackHot.accept()
  if (__VUE_HMR_RUNTIME__.updateThemeData) {
    __VUE_HMR_RUNTIME__.updateThemeData(themeData)
  }
}

if (import.meta.hot) {
  import.meta.hot.accept(({ themeData }) => {
    __VUE_HMR_RUNTIME__.updateThemeData(themeData)
  })
}
