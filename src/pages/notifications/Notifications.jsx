import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, CheckCircle2, XCircle, MessageCircle, AlertTriangle, RotateCcw } from 'lucide-react'
import toast from 'react-hot-toast'

import { notificationsAPI } from '../../services/api'
import { EmptyState, SkeletonCard, Button, Badge } from '../../components/UI'
import PageHeader from '../../components/Common/PageHeader'

function parseFrDateTime(fr) {
  if (typeof fr !== 'string') return null
  // "d/m/Y H:i:s" — pad each component to avoid invalid ISO (e.g. "14:5:30" → "14:05:30")
  const [datePart, timePart] = fr.split(' ')
  if (!datePart || !timePart) return null
  const d = datePart.split('/')
  if (d.length !== 3) return null
  const dd = String(d[0]).padStart(2, '0')
  const mm = String(d[1]).padStart(2, '0')
  const yyyy = d[2]
  const t = timePart.split(':')
  if (t.length < 3) return null
  const HH = String(t[0]).padStart(2, '0')
  const min = String(t[1]).padStart(2, '0')
  const SS = String(t[2]).padStart(2, '0')
  const iso = `${yyyy}-${mm}-${dd}T${HH}:${min}:${SS}.000Z`
  const dt = new Date(iso)
  return Number.isNaN(dt.getTime()) ? null : dt
}

function formatRelative(fr) {
  const dt = parseFrDateTime(fr)
  if (!dt) return '—'
  const diffMs = Date.now() - dt.getTime()
  const diffMin = Math.floor(diffMs / (1000 * 60))
  if (diffMin < 1) return 'il y a moins d’une minute'
  if (diffMin < 60) return `il y a ${diffMin} min`
  const diffH = Math.floor(diffMin / 60)
  if (diffH < 24) return `il y a ${diffH} h`
  const diffD = Math.floor(diffH / 24)
  return `il y a ${diffD} j`
}

function getIconForType(type) {
  const t = (type ?? '').toLowerCase()
  if (t.includes('success') || t.includes('success') || t.includes('approuve')) return <CheckCircle2 size={18} />
  if (t.includes('danger') || t.includes('reject') || t.includes('rejete')) return <XCircle size={18} />
  if (t.includes('message') || t.includes('comment') || t.includes('chat') || t.includes('info')) return <MessageCircle size={18} />
  if (t.includes('warning') || t.includes('critique') || t.includes('alert')) return <AlertTriangle size={18} />
  return <Bell size={18} />
}

function typeBadgeStyle(type, isRead) {
  if (isRead) return {}
  const t = (type ?? '').toLowerCase()
  if (t.includes('warning') || t.includes('alert')) return { background: '#FEF3C7', border: '1px solid #F59E0B' }
  if (t.includes('danger') || t.includes('reject')) return { background: '#FEE2E2', border: '1px solid #EF4444' }
  if (t.includes('success') || t.includes('approuve')) return { background: '#DCFCE7', border: '1px solid #22C55E' }
  return { background: '#E6F7EE', border: '1px solid #00A650' }
}

export default function Notifications() {
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [items, setItems] = useState([])
  const [pagination, setPagination] = useState(null)

  const [page, setPage] = useState(1)
  const perPage = 20

  const fetchNotifications = useCallback(async (p = page) => {
    setLoading(true)
    setError('')
    try {
      // Réponse backend : pagination Laravel (pas le format ApiResponse)
      const res = await notificationsAPI.list({ page: p, per_page: perPage })
      const data = res.data?.data ?? res.data?.notifications ?? res.data ?? []
      const pag =
        res.data?.pagination ??
        (res.data?.last_page ? res.data : null) // cas paginator brut

      setItems(Array.isArray(data) ? data : [])
      setPagination(pag)
    } catch (err) {
      setItems([])
      setError(
        err?.response?.data?.message || err?.message || 'Erreur lors du chargement des notifications'
      )
    } finally {
      setLoading(false)
    }
  }, [page])

  useEffect(() => {
    fetchNotifications(1)
    // Intentionnel : chargement initial page 1 uniquement (pas de refetch si `page` change ici)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleRetry = () => fetchNotifications(1)

  const nonLues = useMemo(() => items.filter(n => !n.is_read).length, [items])

  const markAllRead = async () => {
    try {
      await notificationsAPI.marquerToutLu()
      toast.success('Toutes les notifications sont marquées lues ✅')
      setItems(prev => prev.map(n => ({ ...n, is_read: true, lue: true })))
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || 'Erreur lors du marquage')
    }
  }

  const markOneRead = async (id) => {
    try {
      await notificationsAPI.marquerLu(id)
      setItems(prev => prev.map(n => (n.id === id ? { ...n, is_read: true, lue: true } : n)))
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || 'Erreur')
    }
  }

  const canPaginate = useMemo(() => {
    const total = pagination?.total ?? pagination?.total ?? 0
    const last = pagination?.last_page ?? 1
    return total > perPage && last > 1
  }, [pagination])

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <PageHeader
        title="Notifications"
        subtitle="Vos notifications"
        backTo="/"
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={markAllRead} disabled={items.length === 0 || loading}>
              <CheckCircle2 size={16} /> Tout marquer lu
            </Button>
          </div>
        }
      />

      {loading && (
        <div className="space-y-3">
          {[0, 1, 2].map(i => (
            <SkeletonCard key={i} />
          ))}
        </div>
      )}

      {!loading && error && (
        <EmptyState
          icon={AlertTriangle}
          title="Erreur de chargement"
          subtitle={error}
          actionLabel="Réessayer"
          onAction={handleRetry}
        />
      )}

      {!loading && !error && items.length === 0 && (
        <EmptyState
          icon={Bell}
          title="Aucune notification"
          subtitle="Vous n'avez rien à voir pour le moment."
        />
      )}

      {!loading && !error && items.length > 0 && (
        <>
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="mb-3 inline-flex items-center rounded-full border border-[#EAECF0] bg-[#E6F7EE] px-3 py-1 text-xs font-semibold text-[#00A650] dark:border-[#2A2D3E] dark:bg-[#00A650]/20 dark:text-[#4ade80]"
          >
            {nonLues > 0 ? `${nonLues} non lue(s)` : 'Tout est à jour'}
          </motion.div>

          <div className="space-y-3">
            <AnimatePresence initial={false}>
              {items.map((n, index) => {
                const isRead = !!(n.is_read ?? n.lue)
                const iconBg = typeBadgeStyle(n.type, isRead)
                const icon = getIconForType(n.type)
                return (
                  <motion.div
                    key={n.id ?? index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ delay: index * 0.08, duration: 0.3 }}
                    whileHover={{ y: -4, boxShadow: '0 8px 24px rgba(0,166,80,0.12)' }}
                    whileTap={{ scale: 0.98 }}
                    className={[
                      'at-card-surface mb-2 flex items-start gap-3.5 rounded-[14px] p-4',
                      !isRead
                        ? 'border-l-[3px] border-l-[#00A650] bg-[#F0FDF4]/80 dark:bg-[#00A650]/10'
                        : 'border-l-[3px] border-l-transparent',
                    ].join(' ')}
                  >
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{
                        background: isRead ? '#F1F5F9' : (iconBg.background || '#E6F7EE'),
                        border: iconBg.border || '1px solid #EAECF0',
                      }}
                    >
                      {icon}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-gray-900 text-sm truncate">
                        {n.titre ?? 'Notification'}
                      </div>
                      <div className="text-sm text-gray-700 mt-1 whitespace-pre-wrap">
                        {n.message ?? ''}
                      </div>
                      <div className="text-xs text-gray-500 mt-2">
                        {formatRelative(n.created_at)}
                      </div>
                      {n.action_url && (
                        <button
                          type="button"
                          className="text-xs font-semibold text-at-green hover:underline mt-2"
                          onClick={() => navigate(n.action_url)}
                        >
                          Ouvrir
                        </button>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-2 flex-shrink-0">
                      {!isRead ? (
                        <Button variant="outline" size="sm" onClick={() => markOneRead(n.id)}>
                          Marquer lu
                        </Button>
                      ) : (
                        <div className="text-xs text-gray-500">Lu</div>
                      )}
                    </div>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>
        </>
      )}

      {!loading && !error && items.length > 0 && canPaginate && pagination && (
        <div className="mt-5 flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            disabled={(pagination.current_page ?? page) <= 1}
            onClick={() => {
              const nextPage = Math.max(1, page - 1)
              setPage(nextPage)
              fetchNotifications(nextPage)
            }}
          >
            ← Précédent
          </Button>
          <div className="text-sm text-gray-500">
            Page {pagination.current_page ?? page} / {pagination.last_page ?? 1}
          </div>
          <Button
            variant="outline"
            size="sm"
            disabled={(pagination.current_page ?? page) >= (pagination.last_page ?? 1)}
            onClick={() => {
              const nextPage = page + 1
              setPage(nextPage)
              fetchNotifications(nextPage)
            }}
          >
            Suivant →
          </Button>
        </div>
      )}
    </motion.div>
  )
}
