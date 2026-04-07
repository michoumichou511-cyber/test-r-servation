import { useEffect, useRef, useState } from 'react'
import { motion, useMotionValue, useSpring } from 'framer-motion'

/**
 * Curseur personnalisé (point AT + anneau) — animations forcées (soutenance).
 * mousemove agrégé par requestAnimationFrame pour limiter le travail des ressorts.
 */
export default function CustomCursor() {
  const [on, setOn] = useState(false)
  const visibleRef = useRef(false)
  const x = useMotionValue(-100)
  const y = useMotionValue(-100)
  /** Ressorts raides pour réponse instantanée, moins de lag perceptible */
  const sx = useSpring(x, { stiffness: 1200, damping: 50, mass: 0.15 })
  const sy = useSpring(y, { stiffness: 1200, damping: 50, mass: 0.15 })
  const rx = useSpring(x, { stiffness: 400, damping: 35, mass: 0.2 })
  const ry = useSpring(y, { stiffness: 400, damping: 35, mass: 0.2 })

  const pending = useRef({ x: -100, y: -100 })
  const rafId = useRef(0)

  useEffect(() => {
    const flush = () => {
      rafId.current = 0
      const { x: px, y: py } = pending.current
      x.set(px)
      y.set(py)
      if (!visibleRef.current) {
        visibleRef.current = true
        setOn(true)
      }
    }

    const move = (e) => {
      pending.current = { x: e.clientX, y: e.clientY }
      if (rafId.current) return
      rafId.current = requestAnimationFrame(flush)
    }

    const leave = () => {
      if (rafId.current) cancelAnimationFrame(rafId.current)
      rafId.current = 0
      visibleRef.current = false
      setOn(false)
    }

    window.addEventListener('mousemove', move, { passive: true })
    document.addEventListener('mouseleave', leave)
    return () => {
      window.removeEventListener('mousemove', move)
      document.removeEventListener('mouseleave', leave)
      if (rafId.current) cancelAnimationFrame(rafId.current)
    }
  }, [x, y])

  return (
    <>
      <motion.div
        className="pointer-events-none fixed left-0 top-0 z-[9998]"
        style={{ x: sx, y: sy }}
        initial={{ opacity: 0 }}
        animate={{ opacity: on ? 1 : 0 }}
      >
        <div className="-translate-x-1/2 -translate-y-1/2">
          <div className="h-2.5 w-2.5 rounded-full bg-[#00A650] shadow-[0_0_12px_rgba(0,166,80,0.7)] ring-2 ring-[#003DA5]/50" />
        </div>
      </motion.div>
      <motion.div
        className="pointer-events-none fixed left-0 top-0 z-[9997]"
        style={{ x: rx, y: ry }}
        animate={{ opacity: on ? 1 : 0 }}
      >
        <div className="-translate-x-1/2 -translate-y-1/2">
          <div className="h-9 w-9 rounded-full border border-[#003DA5]/35 bg-transparent" />
        </div>
      </motion.div>
    </>
  )
}
