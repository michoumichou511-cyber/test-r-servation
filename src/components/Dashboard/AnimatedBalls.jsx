import { motion } from 'framer-motion'

const GREEN = '#00A650'
const BLUE = '#003DA5'

/** 8 orbes max — blur CSS très coûteux pour le GPU ; moins d’éléments = FPS plus stable */
const BALLS = Array.from({ length: 8 }, (_, i) => ({
  id: i + 1,
  size: 110 + (i % 7) * 28,
  left: `${(i * 6 + 2) % 82}%`,
  top: `${(i * 9 + 4) % 70}%`,
  blur: 24 + (i % 4) * 10,
  color: i % 2 === 0 ? GREEN : BLUE,
  duration: 10 + (i % 7),
  delay: i * 0.12,
}))

/**
 * Grandes orbes flottantes (ambiance dashboard AT).
 */
export default function AnimatedBalls() {
  return (
    <div
      className="pointer-events-none absolute inset-0 -z-[2] overflow-hidden rounded-2xl"
      aria-hidden
    >
      {BALLS.map((b) => (
        <motion.div
          key={b.id}
          className="absolute rounded-full opacity-[0.35] dark:opacity-[0.22]"
          style={{
            width: b.size,
            height: b.size,
            left: b.left,
            top: b.top,
            filter: `blur(${b.blur}px)`,
            background: `radial-gradient(circle at 30% 30%, ${b.color} 0%, transparent 68%)`,
          }}
          animate={{
            x: [0, 24, -16, 0],
            y: [0, -32, 20, 0],
            scale: [1, 1.06, 0.98, 1],
          }}
          transition={{
            duration: b.duration,
            repeat: Infinity,
            delay: b.delay,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  )
}
