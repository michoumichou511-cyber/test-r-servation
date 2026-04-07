import { useState, useEffect, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import gsap from 'gsap'
import { User, Mail, Lock, Hash, Sparkles } from 'lucide-react'
import { authAPI } from '../../services/api'
import { Button, Input } from '../../components/UI'
import LogoVideo from '../../components/Common/LogoVideo'
import toast from 'react-hot-toast'
import AOS from 'aos'

const formVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.08 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 14 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 380, damping: 26 },
  },
}

export default function Register() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    prenom: '', nom: '', email: '', matricule: '', password: '', password_confirmation: '',
  })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors]   = useState({})

  const rootRef = useRef(null)
  const headerRef = useRef(null)

  const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }))

  useEffect(() => {
    AOS.refresh()
  }, [])

  useEffect(() => {
    const ctx = gsap.context(() => {
      if (headerRef.current) {
        gsap.from(headerRef.current.querySelectorAll('.reg-line'), {
          opacity: 0,
          y: 20,
          stagger: 0.1,
          duration: 0.55,
          ease: 'power3.out',
        })
      }
    }, rootRef)
    return () => ctx.revert()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrors({})
    setLoading(true)
    try {
      await authAPI.register(form)
      toast.success('Compte créé ! Vous pouvez vous connecter.')
      navigate('/login')
    } catch (err) {
      if (err.response?.data?.errors) {
        setErrors(err.response.data.errors)
      } else {
        toast.error(err.response?.data?.message ?? 'Erreur lors de l\'inscription.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div
      ref={rootRef}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="min-h-screen bg-[#F4F6FA] flex items-center justify-center p-4 relative overflow-hidden"
    >
      {/* Fond décoratif animé (léger) */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-at-green/10 blur-3xl"
          animate={{ scale: [1, 1.08, 1], opacity: [0.4, 0.55, 0.4] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-at-blue/10 blur-3xl"
          animate={{ scale: [1.08, 1, 1.08], opacity: [0.35, 0.5, 0.35] }}
          transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      <motion.div
        variants={formVariants}
        initial="hidden"
        animate="show"
        className="relative z-10 w-full max-w-md"
      >
        <div className="text-center mb-6" ref={headerRef}>
          <motion.div
            variants={itemVariants}
            className="inline-flex justify-center mb-3"
            data-aos="zoom-in"
            data-aos-duration="500"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 260, damping: 18 }}
            >
              <LogoVideo className="h-16 w-16 rounded-2xl shadow-lg" fit="contain" />
            </motion.div>
          </motion.div>
          <h1 className="reg-line text-xl font-bold text-gray-800 flex items-center justify-center gap-2">
            <Sparkles className="h-5 w-5 text-at-green" />
            Créer un compte
          </h1>
          <p className="reg-line text-sm text-gray-500 mt-1">
            Rejoignez AT Réservations en quelques secondes
          </p>
        </div>

        <motion.div
          variants={itemVariants}
          data-aos="fade-up"
          data-aos-delay="100"
          className="bg-white rounded-2xl shadow-lg shadow-gray-200/50 border border-gray-100 p-6 backdrop-blur-sm"
        >
          <motion.form
            variants={formVariants}
            initial="hidden"
            animate="show"
            onSubmit={handleSubmit}
            className="space-y-4"
            aria-label="Inscription AT Réservations"
          >
            <motion.div variants={itemVariants} className="grid grid-cols-2 gap-3">
              <Input label="Prénom" name="given-name" autoComplete="given-name" value={form.prenom} onChange={set('prenom')} icon={User}
                     error={!!errors.prenom} errorMessage={errors.prenom?.[0]} required />
              <Input label="Nom" name="family-name" autoComplete="family-name" value={form.nom} onChange={set('nom')} icon={User}
                     error={!!errors.nom} errorMessage={errors.nom?.[0]} required />
            </motion.div>
            <motion.div variants={itemVariants}>
              <Input label="Email" name="email" type="email" autoComplete="email" value={form.email} onChange={set('email')}
                     icon={Mail} error={!!errors.email} errorMessage={errors.email?.[0]} required />
            </motion.div>
            <motion.div variants={itemVariants}>
              <Input label="Matricule" name="matricule" autoComplete="username" value={form.matricule} onChange={set('matricule')}
                     icon={Hash} error={!!errors.matricule} errorMessage={errors.matricule?.[0]} />
            </motion.div>
            <motion.div variants={itemVariants}>
              <Input label="Mot de passe" name="new-password" type="password" autoComplete="new-password" value={form.password} onChange={set('password')}
                     icon={Lock} error={!!errors.password} errorMessage={errors.password?.[0]} required />
            </motion.div>
            <motion.div variants={itemVariants}>
              <Input label="Confirmer le mot de passe" name="new-password-confirm" type="password" autoComplete="new-password"
                     value={form.password_confirmation} onChange={set('password_confirmation')}
                     icon={Lock} required />
            </motion.div>

            <motion.div variants={itemVariants} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
              <Button type="submit" fullWidth loading={loading} size="lg">
                Créer mon compte
              </Button>
            </motion.div>
          </motion.form>

          <motion.p
            variants={itemVariants}
            className="text-center text-xs text-gray-400 mt-4"
            data-aos="fade-up"
            data-aos-delay="200"
          >
            Déjà un compte ?{' '}
            <Link to="/login" className="text-at-green font-semibold hover:underline transition-colors">
              Se connecter
            </Link>
          </motion.p>
        </motion.div>
      </motion.div>
    </motion.div>
  )
}
