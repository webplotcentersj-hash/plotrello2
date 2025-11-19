import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import ErrorBoundary from './components/ErrorBoundary'
import './style.css'

// Manejo global de errores no capturados
window.addEventListener('error', (event) => {
  console.error('Error global:', event.error)
})

window.addEventListener('unhandledrejection', (event) => {
  console.error('Promise rechazada:', event.reason)
})

const rootElement = document.getElementById('app')

if (!rootElement) {
  throw new Error('No se encontró el elemento #app en el DOM')
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
)


