import { motion } from 'framer-motion'

/**
 * En-tête de page aligné sur le Dashboard : titre dégradé AT + sous-titre + slot droit.
 */
export default function ATPageHeader({
  title,
  subtitle,
  emoji = null,
  right = null,
  className = '',
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={`mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between ${className}`}
    >
      <div>
        <h1 className="at-gradient-title m-0 text-2xl font-bold tracking-tight sm:text-[28px]">
          {title}
          {emoji ? (
            <span className="ml-1 inline-block" aria-hidden>
              {emoji}
            </span>
          ) : null}
        </h1>
        {subtitle ? (
          <p className="mt-1 text-[13px] text-[#9AA0AE] dark:text-[#8B92A8]">
            {subtitle}
          </p>
        ) : null}
      </div>
      {right ? <div className="flex shrink-0 flex-wrap items-center gap-2">{right}</div> : null}
    </motion.div>
  )
}
