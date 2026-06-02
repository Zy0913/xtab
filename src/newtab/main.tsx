import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { hydrateStores, initRemoteSync } from '@/store/storage'
import { initTheme } from '@/lib/themeEffects'
import { ToastProvider } from '@/components/ui/Toast'
import { ErrorBoundary } from '@/components/ui/ErrorBoundary'
import { error } from '@/lib/logger'
import '@/styles/globals.css'

async function bootstrap() {
  await hydrateStores()
  initRemoteSync()
  initTheme()
  const root = document.getElementById('root')
  if (!root) throw new Error('Root element #root not found')
  createRoot(root).render(
    <StrictMode>
      <ErrorBoundary>
        <ToastProvider>
          <App />
        </ToastProvider>
      </ErrorBoundary>
    </StrictMode>,
  )
}

bootstrap().catch(error)
