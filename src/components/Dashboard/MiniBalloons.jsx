import { useEffect, useMemo, useRef } from 'react'
import { motion, motionValue } from 'framer-motion'

const GREEN = '#00A650'
const BLUE = '#003DA5'

/** Lissage type ressort doux, sans animate(spring) × 12 à chaque event */
const LERP = 0.16
const EPS = 0.35

/** 6 ballons — moins de motion.div + une seule boucle rAF */
const BALLOONS = Array.from({ length: 6 }, (_, i) => {
  const size = 18 + ((i * 19) % 27) // 18–44 px
  return {
    id: i,
    size,
    left: `${(i * 13 + 5) % 86}%`,
    top: `${(i * 23 + 8) % 78}%`,
    duration: 16 + (i % 6) * 2.2,
    delay: i * 0.35,
    hue: i % 2 === 0 ? 'green' : 'blue',
  }
})

/**
 * Bulles flottantes + répulsion douce (lerp sur motion values, une boucle rAF max).
 * Pas d’animate(spring) par bulle à chaque mousemove : coût réduit, rendu identique.
 */
export default function MiniBalloons() {
  const containerRef = useRef(null)
  const repX = useMemo(() => BALLOONS.map(() => motionValue(0)), [])
  const repY = useMemo(() => BALLOONS.map(() => motionValue(0)), [])
  const mouseRef = useRef({ x: null, y: null })
  const loopId = useRef(0)
  const needsFrameRef = useRef(false)

  useEffect(() => {
    const targetsX = new Float32Array(BALLOONS.length)
    const targetsY = new Float32Array(BALLOONS.length)

    const computeTargets = (rect, mx, my) => {
      const R = 170
      const maxPush = 44
      if (mx == null || my == null || rect.width < 1 || rect.height < 1) {
        targetsX.fill(0)
        targetsY.fill(0)
        return
      }
      for (let i = 0; i < BALLOONS.length; i++) {
        const b = BALLOONS[i]
        const cx = (parseFloat(b.left) / 100) * rect.width + b.size / 2
        const cy = (parseFloat(b.top) / 100) * rect.height + b.size / 2
        const dx = cx - mx
        const dy = cy - my
        const dist = Math.sqrt(dx * dx + dy * dy) || 1
        let tx = 0
        let ty = 0
        if (dist < R) {
          const strength = (1 - dist / R) ** 1.45
          tx = (dx / dist) * strength * maxPush
          ty = (dy / dist) * strength * maxPush
        }
        targetsX[i] = tx
        targetsY[i] = ty
      }
    }

    const step = () => {
      loopId.current = 0
      const el = containerRef.current
      if (!el) return

      const rect = el.getBoundingClientRect()
      const { x: mx, y: my } = mouseRef.current
      computeTargets(rect, mx, my)

      let active = false
      for (let i = 0; i < BALLOONS.length; i++) {
        const tx = targetsX[i]
        const ty = targetsY[i]
        const cx = repX[i].get()
        const cy = repY[i].get()
        const nx = cx + (tx - cx) * LERP
        const ny = cy + (ty - cy) * LERP
        repX[i].set(nx)
        repY[i].set(ny)
        if (Math.abs(tx - nx) > EPS || Math.abs(ty - ny) > EPS || Math.abs(nx) > EPS || Math.abs(ny) > EPS) {
          active = true
        }
      }

      /** Continuer tant que la souris bouge ou que les offsets ne sont pas stabilisés */
      if (needsFrameRef.current || active) {
        needsFrameRef.current = false
        loopId.current = requestAnimationFrame(step)
      }
    }

    const schedule = () => {
      if (loopId.current) return
      loopId.current = requestAnimationFrame(step)
    }

    const onMove = (e) => {
      const el = containerRef.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      const inside =
        e.clientX >= rect.left &&
        e.clientX <= rect.right &&
        e.clientY >= rect.top &&
        e.clientY <= rect.bottom

      if (!inside) {
        mouseRef.current = { x: null, y: null }
      } else {
        mouseRef.current = {
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        }
      }
      needsFrameRef.current = true
      schedule()
    }

    const onLeaveWindow = () => {
      mouseRef.current = { x: null, y: null }
      needsFrameRef.current = true
      schedule()
    }

    const onResize = () => {
      needsFrameRef.current = true
      schedule()
    }

    window.addEventListener('mousemove', onMove, { passive: true })
    window.addEventListener('resize', onResize, { passive: true })
    window.addEventListener('blur', onLeaveWindow)

    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('resize', onResize)
      window.removeEventListener('blur', onLeaveWindow)
      if (loopId.current) cancelAnimationFrame(loopId.current)
    }
  }, [repX, repY])

  return (
    <div
      ref={containerRef}
      className="pointer-events-none absolute inset-0 z-0 overflow-hidden rounded-2xl"
      aria-hidden
    >
      {BALLOONS.map((b, i) => (
        <motion.div
          key={b.id}
          className="absolute"
          style={{
            width: b.size,
            height: b.size,
            left: b.left,
            top: b.top,
            x: repX[i],
            y: repY[i],
          }}
        >
          <motion.div
            className="pointer-events-none h-full w-full rounded-full"
            style={{
              border: '1.5px solid rgba(255, 255, 255, 0.45)',
              boxShadow: `
              0 4px 14px rgba(0, 61, 165, 0.18),
              0 2px 6px rgba(0, 166, 80, 0.12),
              inset 0 1px 0 rgba(255, 255, 255, 0.35)
            `,
              background:
                b.hue === 'green'
                  ? `radial-gradient(circle at 32% 28%, ${GREEN} 0%, ${BLUE} 88%, rgba(0, 61, 165, 0.35) 100%)`
                  : `radial-gradient(circle at 68% 32%, ${BLUE} 0%, ${GREEN} 78%, rgba(0, 166, 80, 0.3) 100%)`,
              opacity: 0.92,
            }}
            animate={{
              x: [0, 14, -10, 8, -6, 0],
              y: [0, -22, 14, -12, 18, 0],
              scale: [1, 1.06, 0.94, 1.05, 0.98, 1],
            }}
            transition={{
              duration: b.duration,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: b.delay,
            }}
          />
        </motion.div>
      ))}
    </div>
  )
}
