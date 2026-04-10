import { createConsola } from 'consola'
import { createLogger, defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const viteTerminal = createConsola({
  fancy: true,
  level: 4,
  defaults: { tag: 'vite' },
})

const proxyTerminal = createConsola({
  fancy: true,
  level: 4,
  defaults: { tag: 'proxy' },
})

const viteConfig = defineConfig({
  customLogger: createLogger('info', {
    console: {
      log: (msg, ...args) => viteTerminal.log(msg, ...args),
      warn: (msg, ...args) => viteTerminal.warn(msg, ...args),
      error: (msg, ...args) => viteTerminal.error(msg, ...args),
    },
  }),
  plugins: [react(), tailwindcss()],
  server: {
    port: 5001,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        configure: proxy => {
          proxy.on('proxyReq', (_proxyReq, req) => {
            const u = req.url ?? ''
            proxyTerminal.info(`→ ${req.method ?? 'GET'} ${u}`)
          })
          proxy.on('proxyRes', (proxyRes, req) => {
            const u = req.url ?? ''
            const code = proxyRes.statusCode ?? 0
            if (code >= 500) proxyTerminal.error(`← ${code} ${u}`)
            else if (code >= 400) proxyTerminal.warn(`← ${code} ${u}`)
            else proxyTerminal.success(`← ${code} ${u}`)
          })
          proxy.on('error', (err, req) => {
            proxyTerminal.error(`✖ ${req?.url ?? '(proxy)'}`, err.message)
          })
        },
      },
    },
  },
})

export default viteConfig
