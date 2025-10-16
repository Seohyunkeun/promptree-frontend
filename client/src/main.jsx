import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'        // <= 이 줄이 꼭 있어야 Tailwind 적용됨

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
