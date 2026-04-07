import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  Bell,
  Check,
  Info,
  AlertTriangle,
  XCircle,
  ChevronRight,
  Sparkles,
} from 'lucide-react'

const typeConfig = {
  info: { icon: Info, bgColor: 'bg-blue-500/20', textColor: 'text-blue-400' },
  success: { icon: Check, bgColor: 'bg-[#00A650]/20', textColor: 'text-[#00A650]' },
  warning: { icon: AlertTriangle, bgColor: 'bg-amber-500/20', textColor: 'text-amber-400' },
  error: { icon: XCircle, bgColor: 'bg-red-500/20', textColor: 'text-red-400' },
}

function inferType(n) {
  const msg = String(n?.message ?? n?.titre ?? n?.contenu ?? '')
  if (/approuv|valid|succès/i.test(msg)) return 'success'
  if (/rejet|erreur|échec/i.test(msg)) return 'error'
  if (/attention|budget|alerte/i.test(msg)) return 'warning'
  return 'info'
}

export default function NotificationCard({ notifications = [], isDarkMode = false }) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [hoveredId, setHoveredId] = useState(null)
  const navigate = useNavigate()

  const list = Array.isArray(notifications) ? notifications : []
  const unreadCount = list.filter((n) => n && !n.read).length

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4, duration: 0.5 }}
      className={`rounded-2xl overflow-hidden ${
        isDarkMode
          ? 'bg-white/5 border border-white/10'
          : 'bg-white border border-gray-200'
      } backdrop-blur-xl`}
    >
      {/* Header */}
      <motion.div
        className={`flex items-center justify-between p-6 cursor-pointer ${
          isDarkMode ? 'border-b border-white/10' : 'border-b border-gray-200'
        }`}
        onClick={() => setIsExpanded(!isExpanded)}
        whileHover={{
          backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
        }}
      >
        <div className="flex items-center gap-3">
          <motion.div
            className={`relative w-10 h-10 rounded-xl flex items-center justify-center ${
              isDarkMode ? 'bg-white/10' : 'bg-gray-100'
            }`}
            animate={{ rotate: isExpanded ? 10 : 0 }}
          >
            <Bell className={`w-5 h-5 ${isDarkMode ? 'text-white/70' : 'text-gray-600'}`} />
            {unreadCount > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-xs text-white flex items-center justify-center font-bold"
              >
                {unreadCount}
              </motion.span>
            )}
          </motion.div>
          <div>
            <h3 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Notifications récentes
            </h3>
            <p className={`text-sm ${isDarkMode ? 'text-white/50' : 'text-gray-500'}`}>
              {unreadCount > 0
                ? `${unreadCount} non lue${unreadCount > 1 ? 's' : ''}`
                : 'Tout est à jour'}
            </p>
          </div>
        </div>
        <motion.button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            navigate('/notifications')
          }}
          className={`flex items-center gap-1 text-sm font-medium ${
            isDarkMode
              ? 'text-[#00A650] hover:text-[#4ADE80]'
              : 'text-[#00A650] hover:text-[#059669]'
          }`}
          whileHover={{ x: 5 }}
        >
          Voir tout
          <motion.div animate={{ rotate: isExpanded ? 90 : 0 }} transition={{ duration: 0.3 }}>
            <ChevronRight className="w-4 h-4" />
          </motion.div>
        </motion.button>
      </motion.div>

      {/* List */}
      <AnimatePresence>
        {(isExpanded || list.length <= 3) && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className={isDarkMode ? 'divide-y divide-white/10' : 'divide-y divide-gray-100'}
          >
            {list.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-8 text-center"
              >
                <motion.div
                  animate={{ y: [0, -10, 0], rotate: [0, 5, -5, 0] }}
                  transition={{ duration: 3, repeat: Infinity }}
                  className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-[#00A650]/20 to-[#003DA5]/20 flex items-center justify-center"
                >
                  <Bell className="w-8 h-8 text-[#00A650]" />
                </motion.div>
                <p className={isDarkMode ? 'text-white/60' : 'text-gray-500'}>
                  Aucune notification récente
                </p>
              </motion.div>
            ) : (
              list.slice(0, 5).map((n, index) => {
                const type = inferType(n)
                const config = typeConfig[type]
                const Icon = config.icon
                const id = n?.id ?? index

                return (
                  <motion.div
                    key={id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    onMouseEnter={() => setHoveredId(id)}
                    onMouseLeave={() => setHoveredId(null)}
                    className={`p-4 flex items-start gap-4 cursor-pointer transition-all ${
                      n?.read === false
                        ? isDarkMode
                          ? 'bg-white/5'
                          : 'bg-blue-50/50'
                        : ''
                    } ${isDarkMode ? 'hover:bg-white/5' : 'hover:bg-gray-50'}`}
                    onClick={() => navigate('/notifications')}
                  >
                    <motion.div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${config.bgColor}`}
                      animate={{
                        scale: hoveredId === id ? 1.1 : 1,
                        rotate: hoveredId === id ? 5 : 0,
                      }}
                    >
                      <Icon className={`w-5 h-5 ${config.textColor}`} />
                    </motion.div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h4
                          className={`font-medium truncate ${
                            isDarkMode ? 'text-white' : 'text-gray-900'
                          }`}
                        >
                          {n?.titre ?? n?.title ?? 'Notification'}
                        </h4>
                        {n?.read === false && (
                          <motion.span
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="w-2 h-2 bg-[#00A650] rounded-full flex-shrink-0 mt-1.5"
                          />
                        )}
                      </div>
                      <p
                        className={`text-sm mt-0.5 line-clamp-2 ${
                          isDarkMode ? 'text-white/60' : 'text-gray-500'
                        }`}
                      >
                        {n?.message ?? n?.contenu ?? '—'}
                      </p>
                      <p
                        className={`text-xs mt-1 ${
                          isDarkMode ? 'text-white/40' : 'text-gray-400'
                        }`}
                      >
                        {n?.created_at
                          ? new Date(n.created_at).toLocaleDateString('fr-FR', {
                              day: 'numeric',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : n?.time ?? '—'}
                      </p>
                    </div>

                    {hoveredId === id && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex-shrink-0"
                      >
                        <Sparkles className="w-4 h-4 text-[#00A650]" />
                      </motion.div>
                    )}
                  </motion.div>
                )
              })
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
