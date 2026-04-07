import { motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'

const variants = {
  gradient:
    'bg-gradient-to-br from-[#003DA5] to-[#00A650] text-white shadow-sm hover:shadow-lg hover:-translate-y-0.5',
  primary:   'bg-at-green hover:bg-at-green-dark text-white shadow-sm hover:shadow',
  secondary: 'bg-at-blue hover:bg-at-blue-dark text-white shadow-sm hover:shadow',
  danger:    'bg-red-500 hover:bg-red-600 text-white shadow-sm',
  outline:   'border-2 border-[#00A650] text-[#00A650] bg-transparent hover:bg-[#E6F7EE] dark:hover:bg-[#00A650]/15',
  ghost:     'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700',
  loading:   'bg-at-green/70 text-white cursor-not-allowed',
};

const sizes = {
  sm: 'text-xs px-3 py-1.5 gap-1.5',
  md: 'text-sm px-4 py-2 gap-2',
  lg: 'text-base px-6 py-3 gap-2.5',
};

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  disabled = false,
  loading = false,
  onClick,
  type = 'button',
  className = '',
  ...props
}) {
  const isDisabled = disabled || loading;

  const Btn = motion.button

  return (
    <Btn
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      whileTap={isDisabled ? undefined : { scale: 0.95 }}
      whileHover={isDisabled ? undefined : { scale: 1.02 }}
      transition={{ duration: 0.2 }}
      className={[
        'inline-flex items-center justify-center font-medium rounded-xl',
        'transition-all duration-150 select-none',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-at-green/50 focus-visible:ring-offset-2',
        'dark:focus-visible:ring-offset-gray-900',
        variants[loading ? 'loading' : variant],
        sizes[size],
        fullWidth ? 'w-full' : '',
        isDisabled ? 'opacity-60 cursor-not-allowed' : '',
        className,
      ].join(' ')}
      {...props}
    >
      {loading && <Loader2 size={size === 'sm' ? 14 : 16} className="animate-spin" />}
      {children}
    </Btn>
  )
}
