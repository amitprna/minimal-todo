import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Amplify } from 'aws-amplify'
import { amplifyConfig } from './aws-config'
import { AuthProvider } from './hooks/useAuth'
import AuthGate from './components/AuthGate'
import './index.css'
import App from './App.jsx'

Amplify.configure(amplifyConfig)

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <AuthGate>
        <App />
      </AuthGate>
    </AuthProvider>
  </StrictMode>,
)
