import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import { ThemeProvider } from './context/ThemeContext.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { CoinsProvider } from './context/CoinsContext.jsx'
import { AppProvider } from './context/AppContext.jsx'
import { VotesProvider } from './context/VotesContext.jsx'
import { ReactionsProvider } from './context/ReactionsContext.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <ThemeProvider>
        <AuthProvider>
        <CoinsProvider>
        <AppProvider>
          <VotesProvider>
            <ReactionsProvider>
              <App />
            </ReactionsProvider>
          </VotesProvider>
        </AppProvider>
        </CoinsProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
