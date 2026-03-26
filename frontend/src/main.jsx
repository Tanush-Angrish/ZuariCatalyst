import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
// import { MsalProvider } from '@azure/msal-react';
// import { msalInstance } from './lib/msalConfig';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {/* MsalProvider removed — MSAL/Outlook SSO is disabled */}
    <App />
  </StrictMode>,
)
