import { motion } from 'framer-motion'
import { useMemo } from 'react'

const BUBBLES = [
  { x: 8, y: 12, size: 12, dur: 28, delay: 0, color: '#00A650', opacity: 0.12 },
  { x: 20, y: 65, size: 18, dur: 32, delay: 3, color: '#003DA5', opacity: 0.1 },
  { x: 35, y: 25, size: 8, dur: 24, delay: 6, color: '#00A650', opacity: 0.15 },
  { x: 50, y: 75, size: 22, dur: 35, delay: 1, color: '#003DA5', opacity: 0.08 },
  { x: 65, y: 15, size: 14, dur: 26, delay: 8, color: '#00A650', opacity: 0.12 },
  { x: 78, y: 55, size: 10, dur: 30, delay: 4, color: '#003DA5', opacity: 0.1 },
  { x: 88, y: 35, size: 16, dur: 22, delay: 7, color: '#00A650', opacity: 0.14 },
  { x: 15, y: 45, size: 20, dur: 38, delay: 2, color: '#003DA5', opacity: 0.09 },
  { x: 45, y: 88, size: 6, dur: 20, delay: 9, color: '#00A650', opacity: 0.16 },
  { x: 72, y: 80, size: 24, dur: 42, delay: 5, color: '#003DA5', opacity: 0.07 },
  { x: 92, y: 70, size: 9, dur: 25, delay: 11, color: '#00A650', opacity: 0.13 },
  { x: 28, y: 92, size: 15, dur: 33, delay: 13, color: '#003DA5', opacity: 0.11 },
]

export default function FloatingBubbles({ count = 8 }) {
  const bubbles = useMemo(
    () => BUBBLES.slice(0, count),
    [count]
  )

  return (
    <div
      className="pointer-events-none fixed inset-0 overflow-hidden"
      style={{ zIndex: 0 }}
      aria-hidden="true"
    >
      {bubbles.map((b, i) => (
        <motion.div
          key={i}
          className="floating-bubble"
          style={{
            position: 'absolute',
            left: `${b.x}%`,
            top: `${b.y}%`,
            width: b.size,
            height: b.size,
            borderRadius: '50%',
            background: `radial-gradient(circle at 35% 35%,
              ${b.color}40, ${b.color}15)`,
            border: `1px solid ${b.color}25`,
            opacity: b.opacity,
            willChange: 'transform',
          }}
          animate={{
            y: [0, -40, 0],
            x: [0, 15, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: b.dur,
            repeat: Infinity,
            delay: b.delay,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  )
}
