import { defineConfig } from 'vite'
import domain from 'vite-plugin-domain'

export default defineConfig(({ command }) => ({
  base: command === 'build' ? './' : '/',
  plugins: [
    domain({
      domain: 'logseq-plugin-bidi.localhost',
      failOnActiveDomain: false
    })
  ],
  server: {
    host: '127.0.0.1',
    port: 5173,
    strictPort: true,
    cors: true
  }
}))
