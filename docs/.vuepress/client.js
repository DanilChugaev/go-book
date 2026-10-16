import { defineClientConfig } from 'vuepress/client'
import Layout from './layouts/Layout.vue'

const components = import.meta.glob('./components/*.vue', { eager: true })

export default defineClientConfig({
  layouts: {
    Layout,
  },
  enhance({ app }) {
    Object.entries(components).forEach(([path, module]) => {
      const name = path.split('/').pop().replace('.vue', '')
      app.component(name, module.default)
    })
  },
})
