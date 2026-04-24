import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { hydrateStores } from '@/store/storage'
import { initTheme } from '@/lib/theme'
import { ToastProvider } from '@/components/ui/Toast'
import '@/styles/globals.css'

async function bootstrap() {
  await hydrateStores()
  initTheme()
  const root = document.getElementById('root')
  if (!root) throw new Error('Root element #root not found')
  createRoot(root).render(
    <StrictMode>
      <ToastProvider>
        <App />
      </ToastProvider>
    </StrictMode>,
  )
}

bootstrap().catch(console.error)
