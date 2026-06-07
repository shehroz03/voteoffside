import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import { ThemeProvider } from './context/ThemeContext.jsx'
import { AppProvider } from './context/AppContext.jsx'
import { VotesProvider } from './context/VotesContext.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <AppProvider>
          <VotesProvider>
            <App />
          </VotesProvider>
        </AppProvider>
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
