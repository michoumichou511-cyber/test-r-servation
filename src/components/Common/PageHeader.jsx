import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'

/**
 * En-tête de page aligné sur le Dashboard AT : titre dégradé, sous-titre, actions.
 */
export default function PageHeader({
  title,
  subtitle,
  actions,
  backTo,
  backLabel = '← Retour',
  onBack,
}) {
  const navigate = useNavigate()

  const handleBack = () => {
    if (typeof onBack === 'function') {
      onBack()
      return
    }
    if (backTo) navigate(backTo)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="mb-6"
    >
      {(backTo || onBack) && (
        <button
          type="button"
          onClick={handleBack}
          className="mb-3 inline-flex items-center gap-2 text-sm font-semibold text-[#00A650] transition-colors hover:text-[#003DA5] dark:text-[#4ade80]"
        >
          {backLabel}
        </button>
      )}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="at-gradient-title text-xl font-bold tracking-tight md:text-2xl">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-1 text-sm text-[#9AA0AE] dark:text-[#8B92A8]">
              {subtitle}
            </p>
          )}
        </div>
        {actions && (
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            {actions}
          </div>
        )}
      </div>
    </motion.div>
  )
}
