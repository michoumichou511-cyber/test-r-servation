import { motion } from 'framer-motion'

/**
 * Animation d’entrée standard pour le contenu d’une page (complète celle du MainLayout si besoin).
 */
export default function PageEnter({ children, className = '' }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={className}
    >
      {children}
    </motion.div>
  )
}
