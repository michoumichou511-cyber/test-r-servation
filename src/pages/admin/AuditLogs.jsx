import { useCallback, useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FileText, RotateCcw, Search, Clock, User } from 'lucide-react'

import PageHeader from '../../components/Common/PageHeader'
import { adminAPI } from '../../services/api'
import { Badge, Button, EmptyState, SkeletonCard } from '../../components/UI'

const MODULE_OPTIONS = [
  { value: 'mission', label: 'Mission' },
  { value: 'reservation', label: 'Réservation' },
  { value: 'validation', label: 'Validation' },
  { value: 'user', label: 'Utilisateur' },
  { value: 'budget', label: 'Budget' },
]

const ACTION_OPTIONS = [
  { value: 'login', label: 'login' },
  { value: 'create', label: 'create' },
  { value: 'update', label: 'update' },
  { value: 'delete', label: 'delete' },
  { value: 'approve', label: 'approve' },
  { value: 'reject', label: 'reject' },
  { value: 'export', label: 'export' },
]

function safeText(v) {
  if (v == null) return ''
  return String(v)
}

function formatDateHeure(value) {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleString('fr-FR', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
}

function actionBadgeStyle(action) {
  const a = (action ?? '').toLowerCase()
  if (a === 'create') return { background: '#DBEAFE', color: '#1D4ED8' }
  if (a === 'update') return { background: '#FEF3C7', color: '#92400E' }
  if (a === 'delete') return { background: '#FEE2E2', color: '#B91C1C' }
  if (a === 'login') return { background: '#DCFCE7', color: '#15803D' }
  if (a === 'approve') return { background: '#D1FAE5', color: '#065F46' }
  if (a === 'reject') return { background: '#FEE2E2', color: '#B91C1C' }
  if (a === 'export') return { background: '#EDE9FE', color: '#6D28D9' }
  return { background: '#F3F4F6', color: '#6B7280' }
}

export default function AuditLogs() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [items, setItems] = useState([])
  const [pagination, setPagination] = useState(null)

  const [filterModule, setFilterModule] = useState('')
  const [filterAction, setFilterAction] = useState('')
  const [dateDebut, setDateDebut] = useState('')
  const [dateFin, setDateFin] = useState('')

  const [page, setPage] = useState(1)

  const fetchLogs = useCallback(async (p = 1) => {
    setLoading(true)
    setError('')
    try {
      const params = {
        page: p,
        ...(filterModule ? { module: filterModule } : {}),
        ...(filterAction ? { action: filterAction } : {}),
        ...(dateDebut ? { date_debut: dateDebut } : {}),
        ...(dateFin ? { date_fin: dateFin } : {}),
      }

      const res = await adminAPI.auditLogs(params)
      const paginator = res.data?.audit_logs ?? {}
      const list = Array.isArray(paginator.data) ? paginator.data : []
      setItems(list)
      setPagination(paginator)
    } catch (err) {
      setItems([])
      setPagination(null)
      setError(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          err?.message ||
          'Erreur lors du chargement des audit logs'
      )
    } finally {
      setLoading(false)
    }
  }, [filterModule, filterAction, dateDebut, dateFin])

  const handleRetry = () => fetchLogs(1)

  // Chargement initial
  useEffect(() => {
    fetchLogs(1)
  }, [fetchLogs])

  const handleApply = () => {
    setPage(1)
    fetchLogs(1)
  }

  const actionOptions = ACTION_OPTIONS
  const moduleOptions = MODULE_OPTIONS

  const canPaginate = !!pagination && (pagination.last_page ?? 1) > 1
  const current = pagination?.current_page ?? page
  const last = pagination?.last_page ?? 1

  const resetFilters = () => {
    setFilterModule('')
    setFilterAction('')
    setDateDebut('')
    setDateFin('')
    setPage(1)
    fetchLogs(1)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <PageHeader
        title="Audit Logs"
        subtitle="Journal des actions"
        backTo="/"
        actions={
          <Button size="sm" variant="outline" onClick={resetFilters}>
            <RotateCcw size={16} /> Réinitialiser
          </Button>
        }
      />

      {/* Filtres */}
      <div className="at-card-surface mb-6 p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-2">Module</label>
            <select
              value={filterModule}
              onChange={(e) => setFilterModule(e.target.value)}
              className="w-full px-3 py-3 rounded-xl border border-gray-200 bg-white text-sm text-gray-800
                         focus:outline-none focus:ring-1 focus:ring-at-green/30 focus:border-at-green"
            >
              <option value="">Tous</option>
              {moduleOptions.map(m => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-2">Action</label>
            <select
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
              className="w-full px-3 py-3 rounded-xl border border-gray-200 bg-white text-sm text-gray-800
                         focus:outline-none focus:ring-1 focus:ring-at-green/30 focus:border-at-green"
            >
              <option value="">Toutes</option>
              {actionOptions.map(a => (
                <option key={a.value} value={a.value}>{a.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-2">Date début</label>
            <input
              type="date"
              value={dateDebut}
              onChange={(e) => setDateDebut(e.target.value)}
              className="w-full px-3 py-3 rounded-xl border border-gray-200 bg-white text-sm text-gray-800
                         focus:outline-none focus:ring-1 focus:ring-at-green/30 focus:border-at-green"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-2">Date fin</label>
            <input
              type="date"
              value={dateFin}
              onChange={(e) => setDateFin(e.target.value)}
              className="w-full px-3 py-3 rounded-xl border border-gray-200 bg-white text-sm text-gray-800
                         focus:outline-none focus:ring-1 focus:ring-at-green/30 focus:border-at-green"
            />
          </div>
        </div>

        <div className="mt-4 flex items-center justify-end gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={handleRetry} disabled={loading}>
            <RotateCcw size={16} /> Recharger
          </Button>
          <Button size="sm" onClick={handleApply} disabled={loading}>
            <Search size={16} /> Appliquer
          </Button>
        </div>
      </div>

      {loading && (
        <div className="space-y-3">
          {[0, 1, 2, 3, 4].map(i => <SkeletonCard key={i} />)}
        </div>
      )}

      {!loading && error && (
        <EmptyState
          icon={FileText}
          title="Erreur de chargement"
          subtitle={error}
          actionLabel="Réessayer"
          onAction={handleRetry}
        />
      )}

      {!loading && !error && items.length === 0 && (
        <EmptyState
          icon={Clock}
          title="Aucun log"
          subtitle="Aucune action trouvée pour les filtres actuels."
          actionLabel="Réinitialiser"
          onAction={resetFilters}
        />
      )}

      {!loading && !error && items.length > 0 && (
        <>
          <div className="at-card-surface overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-[980px] w-full">
                <thead className="at-table-head border-b border-[#EAECF0] dark:border-[#2A2D3E]">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Date/Heure</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Utilisateur</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Action</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Module</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Description</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">IP</th>
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence initial={false}>
                    {items.map((log, index) => {
                      const action = log.action ?? ''
                      const module = log.module_formattee ?? log.module ?? '—'
                      const user = log.user ?? {}
                      const fallbackName = [user?.prenom, user?.nom]
                        .filter(Boolean)
                        .join(' ')
                      const userName = user?.nom_complet ?? fallbackName ?? '—'
                      const desc = safeText(log.description)
                      const badge = actionBadgeStyle(action)
                      return (
                        <motion.tr
                          key={log.id ?? index}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.08, duration: 0.3 }}
                          whileHover={{ backgroundColor: 'rgba(0,166,80,0.04)' }}
                          className="border-b border-gray-50"
                        >
                          <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">
                            {formatDateHeure(log.created_at)}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-800 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <User size={14} className="text-gray-400" />
                              <span className="truncate">{userName}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold"
                              style={{ background: badge.background, color: badge.color }}
                            >
                              {log.action_formattee ?? action}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">
                            {module}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            <div className="max-w-[420px] truncate">{desc}</div>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                            {log.ip_address ?? '—'}
                          </td>
                        </motion.tr>
                      )
                    })}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          </div>

          {canPaginate && (
            <div className="mt-4 flex items-center justify-between gap-3 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                disabled={current <= 1}
                onClick={() => {
                  const next = Math.max(1, current - 1)
                  setPage(next)
                  fetchLogs(next)
                }}
              >
                ← Précédent
              </Button>
              <div className="text-sm text-gray-500">
                Page {current} / {last}
              </div>
              <Button
                variant="outline"
                size="sm"
                disabled={current >= last}
                onClick={() => {
                  const next = current + 1
                  setPage(next)
                  fetchLogs(next)
                }}
              >
                Suivant →
              </Button>
            </div>
          )}
        </>
      )}
    </motion.div>
  )
}
