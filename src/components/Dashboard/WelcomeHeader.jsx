import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'

/**
 * En-tête animé (style app/) — couleurs marque AT (#003DA5, #00A650).
 */
export default function WelcomeHeader({
  name,
  isDarkMode,
  showActionButton = false,
  actionButtonText = '',
  onActionClick,
}) {
  const [currentTime, setCurrentTime] = useState(() => new Date())

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const formatDate = (date) => date.toLocaleDateString('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.15,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: [0.4, 0, 0.2, 1] },
    },
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className={`relative mb-8 overflow-hidden rounded-3xl p-6 sm:p-8 ${
        isDarkMode
          ? 'border border-white/10 bg-gradient-to-br from-[#003DA5]/25 via-[#0f172a]/80 to-[#00A650]/20'
          : 'border border-slate-200/80 bg-gradient-to-br from-[#E6EDF8] via-white to-[#E6F7EE]'
      } backdrop-blur-xl`}
    >
      <motion.div
        className="absolute right-0 top-0 h-64 w-64 rounded-full opacity-25"
        style={{
          background: 'radial-gradient(circle, rgba(0,61,165,0.45) 0%, transparent 70%)',
        }}
        animate={{
          scale: [1, 1.2, 1],
          x: [0, 20, 0],
          y: [0, -20, 0],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute bottom-0 left-0 h-48 w-48 rounded-full opacity-25"
        style={{
          background: 'radial-gradient(circle, rgba(0,166,80,0.4) 0%, transparent 70%)',
        }}
        animate={{
          scale: [1, 1.3, 1],
          x: [0, -15, 0],
          y: [0, 15, 0],
        }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
      />

      <div className="relative z-10 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <motion.div variants={itemVariants} className="mb-2 flex flex-wrap items-center gap-3">
            <motion.span
              animate={{
                rotate: [0, 20, -10, 20, 0],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                repeatDelay: 3,
                ease: 'easeInOut',
              }}
              className="text-4xl"
              aria-hidden
            >
              👋
            </motion.span>
            <h1 className={`text-2xl font-bold sm:text-3xl ${isDarkMode ? 'text-white' : 'text-[#1A1D26]'}`}>
              Bonjour
              {' '}
              {name}
            </h1>
          </motion.div>

          <motion.p
            variants={itemVariants}
            className={`text-base ${isDarkMode ? 'text-white/75' : 'text-[#5A6070]'}`}
          >
            {formatDate(currentTime)}
          </motion.p>

          <motion.div
            variants={itemVariants}
            className="mt-4 flex flex-wrap items-center gap-4"
          >
            <div className={`flex items-center gap-2 rounded-full px-4 py-2 ${
              isDarkMode ? 'bg-white/10' : 'bg-white/90'
            } backdrop-blur-sm`}>
              <motion.div
                className="h-2 w-2 rounded-full bg-[#00A650]"
                animate={{
                  scale: [1, 1.5, 1],
                  opacity: [1, 0.5, 1],
                }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <span className={`text-sm ${isDarkMode ? 'text-white/85' : 'text-[#5A6070]'}`}>
                En ligne
              </span>
            </div>
            <div className={`text-sm tabular-nums ${isDarkMode ? 'text-white/50' : 'text-[#9AA0AE]'}`}>
              {currentTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </div>
          </motion.div>
        </div>

        {showActionButton && onActionClick && (
          <motion.button
            type="button"
            variants={itemVariants}
            onClick={onActionClick}
            className="shrink-0 rounded-xl bg-gradient-to-r from-[#003DA5] to-[#00A650] px-6 py-3 font-semibold text-white shadow-lg shadow-[#003DA5]/30 transition-all hover:shadow-[#00A650]/25"
            whileHover={{
              scale: 1.05,
              boxShadow: '0 20px 40px rgba(0, 61, 165, 0.35)',
            }}
            whileTap={{ scale: 0.95 }}
          >
            <span className="flex items-center gap-2">
              <motion.span
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              >
                +
              </motion.span>
              {actionButtonText}
            </span>
          </motion.button>
        )}
      </div>

      <motion.div
        className="absolute bottom-0 left-0 right-0 h-1 origin-left bg-gradient-to-r from-[#003DA5] via-[#00A650] to-[#003DA5]"
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 1.5, delay: 0.4 }}
      />
    </motion.div>
  )
}
