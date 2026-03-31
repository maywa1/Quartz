import { defineConfig } from 'vite'
import { devtools } from '@tanstack/devtools-vite'
import tsconfigPaths from 'vite-tsconfig-paths'
import { tanstackRouter } from '@tanstack/router-plugin/vite'
import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const config = defineConfig({
  plugins: [
    devtools(),
    tsconfigPaths({ projects: ['./tsconfig.json'] }),
    tailwindcss(),
    tanstackRouter(),
    viteReact(),
    // viteStaticCopy({
    //   targets: [
    //     {
    //       src: 'node_modules/wa-sqlite/dist/wa-sqlite.wasm',
    //       dest: '.',
    //     },
    //     {
    //       src: 'node_modules/wa-sqlite/dist/wa-sqlite-async.wasm',
    //       dest: '.',
    //     }
    //   ],
    // }),
  ],
  optimizeDeps: {
    exclude: ['wa-sqlite'],
  },
  build: {
    target: 'esnext',
  },
  server: {
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    },
  },
  worker: {
    format: 'es',
  },
})

export default config
