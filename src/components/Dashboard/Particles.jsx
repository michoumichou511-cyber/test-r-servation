import { useMemo } from 'react'
import { motion } from 'framer-motion'

const COLORS = {
  primary: '#00A650',
  secondary: '#003DA5',
}

/**
 * Particules d’arrière-plan — 12 particules (25 × framer = trop de layers animés).
 */
export default function Particles() {
  const particles = useMemo(
    () =>
      Array.from(
        { length: 12 },
        (_, i) => ({
          id: i,
          x: (i * 37) % 100,
          y: (i * 53) % 100,
          size: 2 + (i % 5),
          duration: 12 + (i % 8),
          delay: (i % 5) * 0.35,
        }),
      ),
    [],
  )

  return (
    <div
      className="pointer-events-none absolute inset-0 -z-10 overflow-hidden rounded-2xl"
      aria-hidden
    >
      <div className="absolute inset-0 bg-gradient-to-br from-[#003DA5]/[0.06] via-transparent to-[#00A650]/[0.07] dark:from-[#003DA5]/[0.12] dark:to-[#00A650]/[0.08]" />
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full"
          style={{
            width: p.size,
            height: p.size,
            left: `${p.x}%`,
            top: `${p.y}%`,
            background:
              p.id % 2 === 0 ? COLORS.primary : COLORS.secondary,
            opacity: 0.3,
          }}
          animate={{
            y: [0, -48, 0],
            opacity: [0.22, 0.38, 0.22],
            scale: [1, 1.15, 1],
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            delay: p.delay,
            ease: 'linear',
          }}
        />
      ))}
    </div>
  )
}
