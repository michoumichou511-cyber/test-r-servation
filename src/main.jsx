import { MotionConfig } from 'framer-motion'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

// CSS de base
import './index.css'
import 'aos/dist/aos.css'
import 'react-datepicker/dist/react-datepicker.css'
import 'react-circular-progressbar/dist/styles.css'
import 'react-loading-skeleton/dist/skeleton.css'
import 'react-toastify/dist/ReactToastify.css'

// AOS — animations au scroll (soutenance : animations max)
import AOS from 'aos'
AOS.init({
  duration: 800,
  easing: 'ease-out-cubic',
  /** once: true = moins de travail au scroll, meilleures perfs */
  once: true,
  disable: false,
})

import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <MotionConfig reducedMotion="user">
      <App />
    </MotionConfig>
  </StrictMode>,
)
