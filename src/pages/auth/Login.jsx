import { useState, useEffect, useRef, useMemo, lazy, Suspense, useId } from 'react'
import { useNavigate } from 'react-router-dom'
import { LazyMotion, domAnimation, m } from 'framer-motion'
import { useAuth } from '../../contexts/AuthContext'
import toast from 'react-hot-toast'
import { Eye, EyeOff, Loader2, Sun, Moon } from 'lucide-react'
import ParticleBackground from '../../components/Dashboard/ParticleBackground'

const MOBILE_MQ = '(max-width: 767px)'

const LoginDecor3D = lazy(() => import('../../components/auth/LoginDecor3D'))

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(() =>
    typeof window !== 'undefined'
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false,
  )
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const apply = () => setReduced(mq.matches)
    apply()
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [])
  return reduced
}

/** Bulles larges AT — rgba comme demandé, mouvement type FloatingBubbles.jsx */
const AT_FLOAT_BUBBLES = [
  { x: 6, y: 10, size: 88, dur: 26, delay: 0, fill: 'rgba(0,212,122,0.15)' },
  { x: 72, y: 8, size: 72, dur: 30, delay: 2, fill: 'rgba(0,150,255,0.12)' },
  { x: 18, y: 58, size: 96, dur: 24, delay: 4, fill: 'rgba(0,212,122,0.15)' },
  { x: 52, y: 42, size: 64, dur: 28, delay: 1, fill: 'rgba(0,150,255,0.12)' },
  { x: 84, y: 70, size: 76, dur: 22, delay: 6, fill: 'rgba(0,212,122,0.15)' },
  { x: 34, y: 78, size: 58, dur: 32, delay: 3, fill: 'rgba(0,150,255,0.12)' },
]

/**
 * Connexion mobile : canvas (vagues AnimatedBackground + réseau type ParticleBackground,
 * 25 pts #00D47A / #0096D6, liens &lt; 100px) + bulles AT. Desktop inchangé.
 */
function LoginMobileAnimated({
  email,
  setEmail,
  password,
  setPassword,
  loading,
  error,
  showPass,
  setShowPass,
  handleSubmit,
  comptes,
  darkMode,
}) {
  const canvasRef = useRef(null)
  const floatBubbles = useMemo(() => AT_FLOAT_BUBBLES, [])
  const reducedMotion = usePrefersReducedMotion()
  const emailFieldId = useId()
  const passwordFieldId = useId()
  const loginErrorId = useId()

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d', { alpha: true })
    if (!ctx) return

    const isDark = darkMode
    const COL_GREEN = isDark
      ? { r: 0, g: 212, b: 122 }
      : { r: 0, g: 150, b: 70 }
    const COL_BLUE = isDark
      ? { r: 0, g: 150, b: 214 }
      : { r: 0, g: 80, b: 200 }
    const LINK_DIST = 100
    const LINK_DIST_SQ = LINK_DIST * LINK_DIST

    if (reducedMotion) {
      const paintStatic = () => {
        const dpr = Math.min(window.devicePixelRatio || 1, 1.5)
        const lw = window.innerWidth
        const lh = window.innerHeight
        canvas.width = Math.floor(lw * dpr)
        canvas.height = Math.floor(lh * dpr)
        canvas.style.width = `${lw}px`
        canvas.style.height = `${lh}px`
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
        ctx.clearRect(0, 0, lw, lh)
        const g = ctx.createLinearGradient(0, 0, 0, lh)
        g.addColorStop(0, isDark ? 'rgba(0, 26, 94, 0.4)' : 'rgba(230, 240, 255, 0.95)')
        g.addColorStop(1, isDark ? 'rgba(0, 61, 165, 0.25)' : 'rgba(0, 166, 80, 0.12)')
        ctx.fillStyle = g
        ctx.fillRect(0, 0, lw, lh)
      }
      paintStatic()
      window.addEventListener('resize', paintStatic)
      return () => window.removeEventListener('resize', paintStatic)
    }

    const waves = isDark
      ? [
          { yRatio: 0.75, color: 'rgba(0,150,214,0.10)', speed: 0.8, freq: 0.012, amp: 18 },
          { yRatio: 0.82, color: 'rgba(0,180,120,0.08)', speed: -0.6, freq: 0.016, amp: 18 },
          { yRatio: 0.9, color: 'rgba(0,120,200,0.07)', speed: 1.1, freq: 0.02, amp: 18 },
        ]
      : [
          { yRatio: 0.75, color: 'rgba(0,100,180,0.10)', speed: 0.8, freq: 0.012, amp: 18 },
          { yRatio: 0.82, color: 'rgba(0,140,100,0.08)', speed: -0.6, freq: 0.016, amp: 18 },
          { yRatio: 0.9, color: 'rgba(0,80,160,0.07)', speed: 1.1, freq: 0.02, amp: 18 },
        ]

    let animId = 0
    let t = 0
    let particles = []

    const seed = (lw, lh) => {
      particles = []
      const count = lw < 400 ? 12 : 25
      for (let i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * lw,
          y: Math.random() * lh,
          vx: (Math.random() - 0.5) * 0.5,
          vy: (Math.random() - 0.5) * 0.5,
          radius: Math.random() * 2 + 1.2,
          opacity: Math.random() * 0.45 + 0.35,
          isGreen: i % 2 === 0,
        })
      }
    }

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5)
      const lw = window.innerWidth
      const lh = window.innerHeight
      canvas.width = Math.floor(lw * dpr)
      canvas.height = Math.floor(lh * dpr)
      canvas.style.width = `${lw}px`
      canvas.style.height = `${lh}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      seed(lw, lh)
    }

    const loop = () => {
      const w = window.innerWidth
      const h = window.innerHeight
      ctx.clearRect(0, 0, w, h)

      waves.forEach((wv) => {
        ctx.beginPath()
        ctx.moveTo(0, h)
        for (let x = 0; x <= w; x++) {
          ctx.lineTo(x, h * wv.yRatio + Math.sin(x * wv.freq + t * wv.speed) * wv.amp)
        }
        ctx.lineTo(w, h)
        ctx.closePath()
        ctx.fillStyle = wv.color
        ctx.fill()
      })

      particles.forEach((p) => {
        p.x += p.vx
        p.y += p.vy
        if (p.x < 0 || p.x > w) p.vx *= -1
        if (p.y < 0 || p.y > h) p.vy *= -1
      })

      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const a = particles[i]
          const b = particles[j]
          const dx = a.x - b.x
          const dy = a.y - b.y
          const distSq = dx * dx + dy * dy
          if (distSq < LINK_DIST_SQ) {
            const distance = Math.sqrt(distSq)
            const alpha = (1 - distance / LINK_DIST) * 0.35
            ctx.beginPath()
            ctx.moveTo(a.x, a.y)
            ctx.lineTo(b.x, b.y)
            ctx.strokeStyle = `rgba(0, 200, 140, ${alpha * 0.5})`
            ctx.lineWidth = 0.65
            ctx.stroke()
          }
        }
      }

      particles.forEach((p) => {
        const c = p.isGreen ? COL_GREEN : COL_BLUE
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2)
        const fillAlpha = isDark ? p.opacity : 1
        ctx.fillStyle = `rgba(${c.r},${c.g},${c.b},${fillAlpha})`
        ctx.fill()
      })

      t += 0.025
      animId = requestAnimationFrame(loop)
    }

    const onVisibility = () => {
      cancelAnimationFrame(animId)
      if (document.visibilityState === 'visible') {
        animId = requestAnimationFrame(loop)
      }
    }

    resize()
    animId = requestAnimationFrame(loop)
    window.addEventListener('resize', resize)
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', resize)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [darkMode, reducedMotion])

  const demoBtns = [
    { label: 'Administrateur', key: 'admin', color: '#6D28D9', bg: '#F5F3FF', border: '#DDD6FE' },
    { label: 'Validateur', key: 'validateur', color: '#1D4ED8', bg: '#EFF6FF', border: '#BFDBFE' },
    { label: 'Utilisateur', key: 'utilisateur', color: '#15803D', bg: '#F0FDF4', border: '#BBF7D0' },
    { label: 'Demandeur', key: 'demandeur', color: '#C2410C', bg: '#FFF7ED', border: '#FED7AA' },
  ]

  const mt = darkMode
    ? {
        pageBg: '#0b1220',
        cardBg: 'rgba(255,255,255,0.06)',
        cardBorder: 'rgba(255,255,255,0.12)',
        title: '#fff',
        subtitle: 'rgba(255,255,255,0.65)',
        h2: 'rgba(255,255,255,0.95)',
        hint: 'rgba(255,255,255,0.55)',
        inputBorder: 'rgba(255,255,255,0.15)',
        inputBg: 'rgba(255,255,255,0.08)',
        inputColor: '#fff',
        iconBtn: 'rgba(255,255,255,0.55)',
        sep: 'rgba(255,255,255,0.12)',
        sepLabel: 'rgba(255,255,255,0.45)',
        footerMuted: 'rgba(255,255,255,0.5)',
        footerSmall: 'rgba(255,255,255,0.45)',
        radial:
          'radial-gradient(ellipse at 20% 50%, rgba(0,61,165,0.22) 0%, transparent 60%), radial-gradient(ellipse at 80% 50%, rgba(0,166,80,0.15) 0%, transparent 60%)',
      }
    : {
        pageBg: '#f0f4ff',
        cardBg: 'rgba(255,255,255,0.92)',
        cardBorder: 'rgba(0,61,165,0.14)',
        title: '#1A1D26',
        subtitle: 'rgba(26,29,38,0.65)',
        h2: '#1A1D26',
        hint: 'rgba(26,29,38,0.55)',
        inputBorder: 'rgba(0,61,165,0.2)',
        inputBg: 'rgba(255,255,255,0.95)',
        inputColor: '#1A1D26',
        iconBtn: 'rgba(26,29,38,0.55)',
        sep: 'rgba(0,61,165,0.15)',
        sepLabel: 'rgba(26,29,38,0.45)',
        footerMuted: 'rgba(26,29,38,0.65)',
        footerSmall: 'rgba(26,29,38,0.5)',
        radial:
          'radial-gradient(ellipse at 20% 50%, rgba(0,61,165,0.12) 0%, transparent 60%), radial-gradient(ellipse at 80% 50%, rgba(0,166,80,0.08) 0%, transparent 60%)',
      }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: mt.pageBg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
        fontFamily: 'IBM Plex Sans, sans-serif',
        padding: 16,
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          zIndex: 0,
          pointerEvents: 'none',
        }}
        aria-hidden
      />
      <div
        className="pointer-events-none fixed inset-0 overflow-hidden"
        style={{ zIndex: 0 }}
        aria-hidden
      >
        {floatBubbles.map((b, i) => (
          <m.div
            key={i}
            style={{
              position: 'absolute',
              left: `${b.x}%`,
              top: `${b.y}%`,
              width: b.size,
              height: b.size,
              borderRadius: '50%',
              background: `radial-gradient(circle at 35% 35%, ${b.fill}, transparent 72%)`,
              border: `1px solid ${i % 2 === 0 ? 'rgba(0,212,122,0.22)' : 'rgba(0,150,255,0.2)'}`,
              willChange: reducedMotion ? undefined : 'transform',
            }}
            animate={
              reducedMotion
                ? undefined
                : {
                    y: [0, -36, 0],
                    x: [0, 14, 0],
                    scale: [1, 1.06, 1],
                  }
            }
            transition={{
              duration: reducedMotion ? 0 : b.dur,
              repeat: reducedMotion ? 0 : Infinity,
              delay: reducedMotion ? 0 : b.delay,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>
      <div
        style={{
          position: 'fixed',
          inset: 0,
          background: mt.radial,
          pointerEvents: 'none',
          zIndex: 0,
        }}
        aria-hidden
      />

      <div
        style={{
          position: 'relative',
          zIndex: 1,
          width: '100%',
          maxWidth: 440,
          background: mt.cardBg,
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: `1px solid ${mt.cardBorder}`,
          borderRadius: 24,
          padding: 32,
          boxShadow: darkMode ? '0 25px 50px rgba(0,0,0,0.35)' : '0 20px 40px rgba(0,61,165,0.12)',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <img
            src="/logo-at.jpg"
            alt="Algérie Télécom"
            style={{
              height: 56,
              width: 'auto',
              objectFit: 'contain',
              borderRadius: 12,
              background: 'rgba(255,255,255,0.95)',
              padding: 4,
              marginBottom: 12,
            }}
          />
          <h1
            style={{
              color: mt.title,
              fontWeight: 800,
              fontSize: 22,
              marginBottom: 4,
            }}
          >
            AT Réservations
          </h1>
          <p style={{ color: mt.subtitle, fontSize: 13 }}>
            Algérie Télécom
          </p>
        </div>

        <h2
          style={{
            color: mt.h2,
            fontWeight: 800,
            fontSize: 20,
            marginBottom: 4,
          }}
        >
          Connexion
        </h2>
        <p style={{ color: mt.hint, fontSize: 13, marginBottom: 20 }}>
          Entrez vos identifiants Algérie Télécom
        </p>

        {error && (
          <div
            id={loginErrorId}
            role="alert"
            aria-live="assertive"
            className="rounded-[10px] border px-4 py-3 mb-4 text-[13px]"
            style={{
              background: 'rgba(254, 242, 242, 0.12)',
              borderColor: 'rgba(252, 165, 165, 0.45)',
              color: '#fecaca',
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} aria-describedby={error ? loginErrorId : undefined}>
          <label htmlFor={emailFieldId} className="sr-only">
            Adresse e-mail professionnelle
          </label>
          <div style={{ position: 'relative', marginBottom: 14 }}>
            <span
              aria-hidden
              style={{
                position: 'absolute',
                left: 15,
                top: '50%',
                transform: 'translateY(-50%)',
                fontSize: 16,
                opacity: 0.75,
              }}
            >
              ✉️
            </span>
            <input
              id={emailFieldId}
              type="email"
              name="email"
              autoComplete="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="prenom.nom@at.dz"
              required
              style={{
                width: '100%',
                borderRadius: 12,
                border: `1px solid ${mt.inputBorder}`,
                background: mt.inputBg,
                color: mt.inputColor,
                fontSize: 14,
                fontFamily: 'inherit',
                paddingLeft: 44,
                paddingRight: 12,
                minHeight: 44,
                paddingTop: 14,
                paddingBottom: 14,
                outline: 'none',
              }}
              className={
                darkMode
                  ? 'placeholder:text-[rgba(255,255,255,0.4)] focus-visible:border-[#00A650] focus-visible:ring-2 focus-visible:ring-[#00A650]/35'
                  : 'placeholder:text-[rgba(26,29,38,0.4)] focus-visible:border-[#00A650] focus-visible:ring-2 focus-visible:ring-[#00A650]/35'
              }
            />
          </div>
          <label htmlFor={passwordFieldId} className="sr-only">
            Mot de passe
          </label>
          <div style={{ position: 'relative', marginBottom: 24 }}>
            <span
              aria-hidden
              style={{
                position: 'absolute',
                left: 15,
                top: '50%',
                transform: 'translateY(-50%)',
                fontSize: 16,
                opacity: 0.75,
              }}
            >
              🔒
            </span>
            <input
              id={passwordFieldId}
              type={showPass ? 'text' : 'password'}
              name="password"
              autoComplete="current-password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Mot de passe"
              required
              style={{
                width: '100%',
                borderRadius: 12,
                border: `1px solid ${mt.inputBorder}`,
                background: mt.inputBg,
                color: mt.inputColor,
                fontSize: 14,
                fontFamily: 'inherit',
                paddingLeft: 44,
                paddingRight: 48,
                minHeight: 44,
                paddingTop: 14,
                paddingBottom: 14,
                outline: 'none',
              }}
              className={
                darkMode
                  ? 'placeholder:text-[rgba(255,255,255,0.4)] focus-visible:border-[#00A650] focus-visible:ring-2 focus-visible:ring-[#00A650]/35'
                  : 'placeholder:text-[rgba(26,29,38,0.4)] focus-visible:border-[#00A650] focus-visible:ring-2 focus-visible:ring-[#00A650]/35'
              }
            />
            <button
              type="button"
              onClick={() => setShowPass(!showPass)}
              aria-label={showPass ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
              className="absolute right-1 top-1/2 -translate-y-1/2 flex h-11 min-w-[44px] items-center justify-center rounded-lg bg-transparent border-0 cursor-pointer"
              style={{
                color: mt.iconBtn,
              }}
            >
              {showPass ? <EyeOff size={18} aria-hidden /> : <Eye size={18} aria-hidden />}
            </button>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="min-h-[44px]"
            style={{
              width: '100%',
              padding: 15,
              borderRadius: 12,
              border: 'none',
              background: 'linear-gradient(135deg, #003DA5, #00A650)',
              color: 'white',
              fontSize: 14,
              fontWeight: 700,
              fontFamily: 'inherit',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              marginBottom: 20,
            }}
          >
            {loading ? (
              <>
                <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
                Connexion...
              </>
            ) : (
              'Se connecter →'
            )}
          </button>
        </form>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            marginBottom: 14,
          }}
        >
          <div style={{ flex: 1, height: 1, background: mt.sep }} />
          <span
            style={{
              fontSize: 10,
              fontWeight: 600,
              color: mt.sepLabel,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
            }}
          >
            Comptes de démonstration
          </span>
          <div style={{ flex: 1, height: 1, background: mt.sep }} />
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 8,
            marginBottom: 20,
          }}
        >
          {demoBtns.map(b => (
            <button
              key={b.key}
              type="button"
              aria-label={`Remplir avec le compte démo ${b.label}`}
              onClick={() => {
                setEmail(comptes[b.key].email)
                setPassword(comptes[b.key].password)
              }}
              className="min-h-[44px]"
              style={{
                padding: '10px 12px',
                borderRadius: 10,
                border: `1.5px solid ${b.border}`,
                background: b.bg,
                color: b.color,
                fontSize: 12,
                fontWeight: 600,
                fontFamily: 'inherit',
                cursor: 'pointer',
              }}
            >
              {b.label}
            </button>
          ))}
        </div>

        <p style={{ textAlign: 'center', fontSize: 11, color: mt.footerMuted, marginBottom: 16, lineHeight: 1.5 }}>
          Mot de passe démo (tous les comptes) :
          {' '}
          <strong style={{ color: darkMode ? '#7AB8FF' : '#003DA5', fontFamily: 'monospace' }}>Password@123</strong>
          <br />
          <span style={{ fontSize: 10, color: mt.footerSmall }}>Cliquez un rôle ci-dessus pour remplir email + mot de passe.</span>
        </p>
        <p style={{ textAlign: 'center', fontSize: 12, color: mt.footerSmall }}>
          Problème de connexion ?
          {' '}
          <a href="mailto:it-support@at.dz" style={{ color: darkMode ? '#4ADE80' : '#00A650', fontWeight: 600, textDecoration: 'none' }}>
            Contacter le support IT
          </a>
        </p>
      </div>
    </div>
  )
}

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPass, setShowPass] = useState(false)
  const { login, darkMode, toggleDarkMode } = useAuth()
  const navigate = useNavigate()

  const comptes = {
    admin: { email: 'admin@at.dz', password: 'Password@123' },
    validateur: { email: 'validateur@at.dz', password: 'Password@123' },
    utilisateur: { email: 'user@at.dz', password: 'Password@123' },
    demandeur: { email: 'demandeur@at.dz', password: 'Password@123' },
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await login(email, password)
      toast.success('Connexion réussie !')
      navigate('/')
    } catch (err) {
      if (!err.response) {
        const apiBase = import.meta.env.VITE_API_URL
        const apiLooksLocal = /localhost|127\.0\.0\.1/.test(apiBase || '')
        if (import.meta.env.PROD && apiLooksLocal) {
          setError(
            'Configuration invalide : VITE_API_URL pointe vers une URL locale en production. ' +
              'Définissez VITE_API_URL avec l’URL publique du backend (incluant /api), puis rebuild/redeploy le frontend.',
          )
        } else {
          setError(
            'Serveur injoignable. Lancez le backend (ex: `php artisan serve` port 8000) et vérifiez VITE_API_URL.',
          )
        }
      } else {
        setError(
          err.response?.data?.message
            ?? err.response?.data?.errors?.email?.[0]
            ?? 'Email ou mot de passe incorrect',
        )
      }
    } finally {
      setLoading(false)
    }
  }

  const [isMobile, setIsMobile] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(MOBILE_MQ).matches,
  )

  useEffect(() => {
    const mq = window.matchMedia(MOBILE_MQ)
    const apply = () => setIsMobile(mq.matches)
    apply()
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [])

  const reducedMotion = usePrefersReducedMotion()
  const desktopEmailId = useId()
  const desktopPasswordId = useId()
  const desktopFormErrorId = useId()

  const themeToggle = (
    <m.button
      type="button"
      onClick={toggleDarkMode}
      whileTap={reducedMotion ? undefined : { rotate: 180 }}
      transition={{ duration: 0.3 }}
      className="fixed top-4 right-4 z-[100] inline-flex h-11 min-w-[44px] items-center justify-center rounded-xl p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/10 transition-colors"
      aria-label={darkMode ? 'Passer en mode clair' : 'Passer en mode sombre'}
    >
      {darkMode ? <Sun size={18} /> : <Moon size={18} />}
    </m.button>
  )

  if (isMobile) {
    return (
      <LazyMotion features={domAnimation}>
        <>
        {themeToggle}
        <LoginMobileAnimated
          email={email}
          setEmail={setEmail}
          password={password}
          setPassword={setPassword}
          loading={loading}
          error={error}
          showPass={showPass}
          setShowPass={setShowPass}
          handleSubmit={handleSubmit}
          comptes={comptes}
          darkMode={darkMode}
        />
        </>
      </LazyMotion>
    )
  }

  return (
    <LazyMotion features={domAnimation}>
    <>
      {themeToggle}
      <div
        style={{
          display: 'flex',
          height: '100vh',
          overflow: 'hidden',
          fontFamily: 'IBM Plex Sans, sans-serif',
        }}
      >
      {/* ═══ GAUCHE ═══ */}
      <div
        style={{
          flex: 1,
          background: '#001a5e',
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: 40,
        }}
        className="hidden md:flex overflow-hidden relative"
      >
        {!reducedMotion && (
          <ParticleBackground isDarkMode={!!darkMode} zIndex={2} opacity={0.9} />
        )}
        <video
          autoPlay
          muted
          loop
          playsInline
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            zIndex: 0,
            filter: 'brightness(0.65)',
          }}
        >
          <source src="/videos/logo-at.mp4" type="video/mp4" />
        </video>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `linear-gradient(160deg, rgba(0,26,94,0.82) 0%, rgba(0,61,165,0.72) 45%, rgba(0,166,80,0.65) 100%)`,
            zIndex: 1,
            pointerEvents: 'none',
          }}
        />

        {!reducedMotion && (
          <Suspense fallback={null}>
            <LoginDecor3D />
          </Suspense>
        )}

        {/* Cercle déco haut droite */}
        <div
          style={{
            position: 'absolute',
            width: 300,
            height: 300,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.05)',
            top: -80,
            right: -80,
            zIndex: 2,
            pointerEvents: 'none',
          }}
        />

        {/* Cercle déco bas gauche */}
        <div
          style={{
            position: 'absolute',
            width: 200,
            height: 200,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.05)',
            bottom: -60,
            left: -40,
            zIndex: 2,
            pointerEvents: 'none',
          }}
        />

        {/* Logo + nom */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            position: 'relative',
            zIndex: 10,
          }}
        >
          <img
            src="/logo-at.jpg"
            alt="Algérie Télécom"
            style={{
              height: 56,
              width: 'auto',
              objectFit: 'contain',
              borderRadius: 12,
              background: 'white',
              padding: 4,
            }}
          />
          <div>
            <div
              style={{
                color: 'white',
                fontWeight: 700,
                fontSize: 16,
              }}
            >
              AT Réservations
            </div>
            <div
              style={{
                color: 'rgba(255,255,255,0.6)',
                fontSize: 12,
              }}
            >
              Algérie Télécom
            </div>
          </div>
        </div>

        {/* Texte central */}
        <div
          style={{
            position: 'relative',
            zIndex: 10,
            paddingBottom: 24,
          }}
        >
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '4px 12px',
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: 20,
              marginBottom: 16,
            }}
          >
            <div
              style={{
                width: 7,
                height: 7,
                borderRadius: '50%',
                background: '#52FF8A',
              }}
            />
            <span
              style={{
                fontSize: 10,
                fontWeight: 600,
                color: 'rgba(255,255,255,0.85)',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
              }}
            >
              Espace employé
            </span>
          </div>

          <h1
            style={{
              fontSize: 32,
              fontWeight: 800,
              color: 'white',
              lineHeight: 1.25,
              marginBottom: 12,
            }}
          >
            Bienvenue sur
            <br />
            votre{' '}
            <span style={{ color: '#52FF8A' }}>
              espace de travail.
            </span>
          </h1>

          <p
            style={{
              fontSize: 13,
              color: 'rgba(255,255,255,0.6)',
              lineHeight: 1.7,
              maxWidth: 280,
            }}
          >
            Plateforme sécurisée de gestion des missions réservée aux agents Algérie Télécom.
          </p>
        </div>

        {/* Bloc accès sécurisé */}
        <div
          className="backdrop-blur-sm max-w-xs"
          style={{
            background: 'rgba(255,255,255,0.08)',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: 14,
            padding: 16,
            position: 'relative',
            zIndex: 10,
            marginTop: 'auto',
          }}
        >
          <p
            style={{
              fontSize: 10,
              fontWeight: 600,
              color: 'rgba(255,255,255,0.4)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginBottom: 10,
            }}
          >
            Accès sécurisé
          </p>
          {[
            { icon: '🔐', text: 'Connexion avec votre email @at.dz' },
            { icon: '🏢', text: 'Réservé aux agents Algérie Télécom' },
            { icon: '📞', text: 'Support IT : it-support@at.dz' },
          ].map((item, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                fontSize: 12,
                color: 'rgba(255,255,255,0.75)',
                marginBottom: i < 2 ? 8 : 0,
              }}
            >
              <span>{item.icon}</span>
              <span>{item.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ═══ DROITE ═══ */}
      <div
        className="flex flex-1 flex-col justify-center px-10 py-12 sm:px-12 max-w-[520px] transition-colors"
        style={{
          display: 'flex',
          flexDirection: 'column',
          background: darkMode ? '#0b1220' : '#ffffff',
        }}
      >
        <m.div
          className="flex flex-col flex-1 w-full min-h-0"
          style={
            darkMode
              ? {
                  background: 'rgba(15,25,45,0.95)',
                  borderRadius: 16,
                  padding: '28px 24px',
                }
              : undefined
          }
          initial={reducedMotion ? false : { opacity: 0, y: 14 }}
          animate={reducedMotion ? false : { opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        >
        <h1
          className={`text-[28px] font-extrabold mb-1 ${
            darkMode ? 'text-white' : 'text-[#1A1D26]'
          }`}
        >
          Connexion
        </h1>
        <p
          className={`text-[13px] mb-8 ${
            darkMode ? 'text-gray-300' : 'text-[#9AA0AE]'
          }`}
        >
          Entrez vos identifiants Algérie Télécom
        </p>

        {error && (
          <div
            id={desktopFormErrorId}
            role="alert"
            aria-live="assertive"
            className={`rounded-[10px] border px-4 py-3 mb-4 text-[13px] border-l-4 ${
              darkMode
                ? 'bg-red-950/40 border-red-800/60 text-red-200 border-l-red-500'
                : 'bg-[#FEF2F2] border-[#FECACA] border-l-[#EF4444] text-[#B91C1C]'
            }`}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} aria-describedby={error ? desktopFormErrorId : undefined}>
          <label htmlFor={desktopEmailId} className="sr-only">
            Adresse e-mail professionnelle
          </label>
          {/* Email */}
          <div
            style={{
              position: 'relative',
              marginBottom: 14,
            }}
          >
            <span
              aria-hidden
              style={{
                position: 'absolute',
                left: 15,
                top: '50%',
                transform: 'translateY(-50%)',
                fontSize: 16,
                color: '#C0C5D0',
              }}
            >
              ✉️
            </span>
            <input
              id={desktopEmailId}
              name="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="prenom.nom@at.dz"
              required
              className={`min-h-[44px] w-full rounded-xl border-2 text-[13px] outline-none font-inherit pl-11 pr-3.5 py-3.5 focus-visible:ring-2 focus-visible:ring-[#00A650]/40 ${
                darkMode
                  ? 'border-[rgba(255,255,255,0.1)] text-white placeholder:text-gray-500 bg-[rgba(255,255,255,0.06)]'
                  : 'border-[#EAECF0] text-[#1A1D26] bg-[#F8F9FC] placeholder:text-gray-400'
              }`}
              style={{
                fontFamily: 'inherit',
              }}
            />
          </div>

          <label htmlFor={desktopPasswordId} className="sr-only">
            Mot de passe
          </label>
          {/* Password */}
          <div
            style={{
              position: 'relative',
              marginBottom: 24,
            }}
          >
            <span
              aria-hidden
              style={{
                position: 'absolute',
                left: 15,
                top: '50%',
                transform: 'translateY(-50%)',
                fontSize: 16,
                color: '#C0C5D0',
              }}
            >
              🔒
            </span>
            <input
              id={desktopPasswordId}
              name="password"
              type={showPass ? 'text' : 'password'}
              autoComplete="current-password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Mot de passe"
              required
              className="min-h-[44px] w-full rounded-xl border-2 border-[#EAECF0] dark:border-gray-600 text-[13px] text-[#1A1D26] dark:text-white outline-none font-inherit px-11 py-3.5 dark:placeholder:text-gray-500 focus-visible:ring-2 focus-visible:ring-[#00A650]/40"
              style={{
                background: 'var(--input-bg, #F8F9FC)',
                fontFamily: 'inherit',
              }}
            />
            <button
              type="button"
              onClick={() => setShowPass(!showPass)}
              aria-label={showPass ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
              className="absolute right-1 top-1/2 -translate-y-1/2 flex h-11 min-w-[44px] items-center justify-center rounded-lg border-0 bg-transparent cursor-pointer"
              style={{
                color: darkMode ? 'rgba(255,255,255,0.55)' : '#C0C5D0',
              }}
            >
              {showPass ? <EyeOff size={18} aria-hidden /> : <Eye size={18} aria-hidden />}
            </button>
          </div>

          {/* Bouton connexion */}
          <m.button
            type="submit"
            disabled={loading}
            whileHover={reducedMotion || loading ? undefined : { scale: 1.01 }}
            whileTap={reducedMotion || loading ? undefined : { scale: 0.99 }}
            className="min-h-[44px]"
            style={{
              width: '100%',
              padding: 15,
              borderRadius: 12,
              border: 'none',
              background: 'linear-gradient(135deg, #00A650, #003DA5)',
              color: 'white',
              fontSize: 14,
              fontWeight: 700,
              fontFamily: 'inherit',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              marginBottom: 20,
            }}
          >
            {loading ? (
              <>
                <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
                Connexion...
              </>
            ) : (
              'Se connecter →'
            )}
          </m.button>
        </form>

        {/* Séparateur */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            marginBottom: 14,
          }}
        >
          <div
            className="flex-1 h-px"
            style={{ background: darkMode ? 'rgba(255,255,255,0.12)' : '#EAECF0' }}
          />
          <span
            className={`text-[10px] font-semibold uppercase tracking-wider whitespace-nowrap ${
              darkMode ? 'text-gray-500' : 'text-[#C0C5D0]'
            }`}
          >
            Comptes de démonstration
          </span>
          <div
            className="flex-1 h-px"
            style={{ background: darkMode ? 'rgba(255,255,255,0.12)' : '#EAECF0' }}
          />
        </div>

        {/* Boutons démo */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 8,
            marginBottom: 20,
          }}
        >
          {[
            { label: 'Administrateur', key: 'admin', color: '#6D28D9', bg: '#F5F3FF', border: '#DDD6FE' },
            { label: 'Validateur', key: 'validateur', color: '#1D4ED8', bg: '#EFF6FF', border: '#BFDBFE' },
            { label: 'Utilisateur', key: 'utilisateur', color: '#15803D', bg: '#F0FDF4', border: '#BBF7D0' },
            { label: 'Demandeur', key: 'demandeur', color: '#C2410C', bg: '#FFF7ED', border: '#FED7AA' },
          ].map(b => (
            <m.button
              key={b.key}
              type="button"
              aria-label={`Remplir avec le compte démo ${b.label}`}
              onClick={() => {
                setEmail(comptes[b.key].email)
                setPassword(comptes[b.key].password)
              }}
              whileHover={reducedMotion ? undefined : { scale: 1.02 }}
              whileTap={reducedMotion ? undefined : { scale: 0.98 }}
              className="min-h-[44px]"
              style={{
                padding: '10px 12px',
                borderRadius: 10,
                border: `1.5px solid ${b.border}`,
                background: b.bg,
                color: b.color,
                fontSize: 12,
                fontWeight: 600,
                fontFamily: 'inherit',
                cursor: 'pointer',
              }}
            >
              {b.label}
            </m.button>
          ))}
        </div>

        <p
          className={`text-center text-[11px] mb-4 leading-snug ${
            darkMode ? 'text-gray-400' : 'text-[#9AA0AE]'
          }`}
        >
          Mot de passe démo (tous les comptes) :
          {' '}
          <strong
            className={`font-mono ${darkMode ? 'text-[#7AB8FF]' : 'text-[#003DA5]'}`}
          >
            Password@123
          </strong>
          <br />
          <span
            className={`text-[10px] ${darkMode ? 'text-gray-500' : 'text-[#C0C5D0]'}`}
          >
            Cliquez un rôle ci-dessus pour remplir email + mot de passe.
          </span>
        </p>

        <p
          className={`text-center text-xs ${darkMode ? 'text-gray-500' : 'text-[#C0C5D0]'}`}
        >
          Problème de connexion ?{' '}
          <a
            href="mailto:it-support@at.dz"
            className={`font-semibold no-underline ${
              darkMode ? 'text-[#4ADE80]' : 'text-[#00A650]'
            }`}
          >
            Contacter le support IT
          </a>
        </p>
        </m.div>
      </div>
    </div>
    </>
    </LazyMotion>
  )
}
