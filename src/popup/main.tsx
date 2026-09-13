import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { cardStyles } from '../components/styles'
import { Popup } from './Popup'

const style = document.createElement('style')
style.textContent = cardStyles.replace(':host { all: initial; }', '')
document.head.appendChild(style)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Popup />
  </StrictMode>,
)
