import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Explicitly register the Vite PWA Service Worker for Mobile Browsers
import { registerSW } from 'virtual:pwa-register';
registerSW({ autoUpdate: true });

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
