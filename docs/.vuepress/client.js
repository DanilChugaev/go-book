import { defineClientConfig } from 'vuepress/client'
import BookmarksNavbar from './components/BookmarksNavbar.vue'

const components = import.meta.glob('./components/*.vue', { eager: true })

export default defineClientConfig({
  rootComponents: [BookmarksNavbar],
  enhance({ app }) {
    Object.entries(components).forEach(([path, module]) => {
      const name = path.split('/').pop().replace('.vue', '')
      app.component(name, module.default)
    })
  },
})
