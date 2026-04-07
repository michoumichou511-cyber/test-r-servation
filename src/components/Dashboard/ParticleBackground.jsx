import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'

/** Fond réseau de particules (même principe que le dossier app/) — couleurs AT. */
export default function ParticleBackground({ isDarkMode }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animationId
    let particles = []

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }

    const createParticles = () => {
      particles = []
      const particleCount = Math.min(50, Math.floor(window.innerWidth / 30))
      for (let i = 0; i < particleCount; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * 0.5,
          vy: (Math.random() - 0.5) * 0.5,
          radius: Math.random() * 2 + 1,
          opacity: Math.random() * 0.5 + 0.2,
        })
      }
    }

    const drawParticles = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      particles.forEach((particle, i) => {
        particle.x += particle.vx
        particle.y += particle.vy

        if (particle.x < 0 || particle.x > canvas.width) particle.vx *= -1
        if (particle.y < 0 || particle.y > canvas.height) particle.vy *= -1

        ctx.beginPath()
        ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2)
        const r = 0
        const g = 61
        const b = 165
        ctx.fillStyle = isDarkMode
          ? `rgba(${r}, ${g}, ${b}, ${particle.opacity})`
          : `rgba(${r}, ${g}, ${b}, ${particle.opacity * 0.45})`
        ctx.fill()

        particles.slice(i + 1).forEach((other) => {
          const dx = particle.x - other.x
          const dy = particle.y - other.y
          const distance = Math.sqrt(dx * dx + dy * dy)

          if (distance < 150) {
            ctx.beginPath()
            ctx.moveTo(particle.x, particle.y)
            ctx.lineTo(other.x, other.y)
            ctx.strokeStyle = isDarkMode
              ? `rgba(0, 61, 165, ${0.12 * (1 - distance / 150)})`
              : `rgba(0, 61, 165, ${0.06 * (1 - distance / 150)})`
            ctx.stroke()
          }
        })
      })

      animationId = requestAnimationFrame(drawParticles)
    }

    const onResize = () => {
      resize()
      createParticles()
    }

    resize()
    createParticles()
    drawParticles()
    window.addEventListener('resize', onResize)

    return () => {
      cancelAnimationFrame(animationId)
      window.removeEventListener('resize', onResize)
    }
  }, [isDarkMode])

  return (
    <>
      <canvas
        ref={canvasRef}
        className="pointer-events-none absolute inset-0 z-0 h-full min-h-[480px] w-full"
        aria-hidden
      />
      <motion.div
        className="pointer-events-none absolute left-1/4 top-1/4 z-0 h-96 w-96 rounded-full"
        style={{
          background: isDarkMode
            ? 'radial-gradient(circle, rgba(0,61,165,0.18) 0%, transparent 70%)'
            : 'radial-gradient(circle, rgba(0,61,165,0.08) 0%, transparent 70%)',
        }}
        animate={{
          x: [0, 50, 0],
          y: [0, 30, 0],
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
      <motion.div
        className="pointer-events-none absolute bottom-1/4 right-1/4 z-0 h-96 w-96 rounded-full"
        style={{
          background: isDarkMode
            ? 'radial-gradient(circle, rgba(0,166,80,0.14) 0%, transparent 70%)'
            : 'radial-gradient(circle, rgba(0,166,80,0.07) 0%, transparent 70%)',
        }}
        animate={{
          x: [0, -40, 0],
          y: [0, -50, 0],
          scale: [1, 1.3, 1],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
    </>
  )
}
