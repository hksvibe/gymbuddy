import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { completeRedirectSignIn } from './lib/auth'

// Fires only when we're returning from a signInWithRedirect() call.
// Silent no-op on every other page load.
completeRedirectSignIn().catch((e) => console.warn('redirect sign-in complete failed', e))

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
