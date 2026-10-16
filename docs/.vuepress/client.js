import { defineClientConfig } from 'vuepress/client'

const components = import.meta.glob('./components/*.vue', { eager: true })

export default defineClientConfig({
  enhance({ app }) {
    Object.entries(components).forEach(([path, module]) => {
      const name = path.split('/').pop().replace('.vue', '')
      app.component(name, module.default)
    })
  },
})