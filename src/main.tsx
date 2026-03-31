import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from '@tanstack/react-router'
import { getRouter } from '#/router'
import { QueryProvider, DatabaseProvider, ToastProvider } from '#/providers'

import '#/styles.css'

const THEME_INIT_SCRIPT = `(function(){var root=document.documentElement;root.classList.remove('light','dark');root.classList.add('light');root.setAttribute('data-theme','light');root.style.colorScheme='light';})();`

const router = getRouter()

document.head.insertAdjacentHTML(
  'beforeend',
  `<script>${THEME_INIT_SCRIPT}</script>`,
)

const rootElement = document.getElementById('app-root')!

if (!rootElement.innerHTML) {
  const root = createRoot(rootElement)

  root.render(
    <StrictMode>
      <ToastProvider>
        <QueryProvider>
          <DatabaseProvider dbName="app.db">
            <RouterProvider router={router} />
          </DatabaseProvider>
        </QueryProvider>
      </ToastProvider>
    </StrictMode>,
  )
}
