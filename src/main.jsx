import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import './index.css'
import { GameProvider } from './GameContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <GameProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </GameProvider>
  </StrictMode>,
)
