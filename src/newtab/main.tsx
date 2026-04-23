import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { hydrateStores } from '@/store/storage'
import { initTheme } from '@/lib/theme'
import '@/styles/globals.css'

async function bootstrap() {
  await hydrateStores()
  initTheme()
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  )
}

bootstrap()
