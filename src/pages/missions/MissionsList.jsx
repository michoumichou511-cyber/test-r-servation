import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Search, Plus, FileText, RotateCcw, ChevronLeft, ChevronRight } from 'lucide-react'
import {
  ATPageHeader,
  Badge,
  Button,
  EmptyState,
  SkeletonCard,
} from '../../components/UI'
import { missionsAPI } from '../../services/api'
import { useAuth } from '../../contexts/AuthContext'

const STATUT_OPTIONS = [
  { label: 'Tous', value: '' },
  { label: 'Brouillon', value: 'brouillon' },
  { label: 'Soumis', value: 'soumis' },
  { label: 'En validation', value: 'en_validation' },
  { label: 'Approuvé', value: 'approuve' },
  { label: 'Rejeté', value: 'rejete' },
  { label: 'Annulé', value: 'annule' },
  { label: 'Terminé', value: 'termine' },
]

function formatDZD(v) {
  const n = typeof v === 'number' ? v : Number(v ?? 0)
  if (Number.isNaN(n)) return '0 DZD'
  return `${n.toLocaleString('fr-FR')} DZD`
}

const BORDER_STATUT = {
  brouillon: '#94A3B8',
  soumis: '#3B82F6',
  en_validation: '#F59E0B',
  approuve: '#00A650',
  rejete: '#EF4444',
  annule: '#6B7280',
  termine: '#8B5CF6',
}

export default function MissionsList() {
  const navigate = useNavigate()
  const { hasRole } = useAuth()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [missions, setMissions] = useState([])
  const [pagination, setPagination] = useState(null)

  const [statut, setStatut] = useState('')
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [page, setPage] = useState(1)

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 500)
    return () => clearTimeout(t)
  }, [search])

  const fetchMissions = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const params = {
        page,
        per_page: 10,
        ...(statut ? { statut } : {}),
        ...(debouncedSearch ? { search: debouncedSearch } : {}),
      }
      const res = await missionsAPI.list(params)

      const data = res.data?.data
      const pag = res.data?.pagination

      setMissions(Array.isArray(data) ? data : [])
      setPagination(pag ?? null)
    } catch (err) {
      setMissions([])
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'Erreur lors du chargement des missions'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }, [debouncedSearch, page, statut])

  useEffect(() => {
    fetchMissions()
  }, [fetchMissions])

  useEffect(() => {
    setPage(1)
  }, [debouncedSearch])

  const canShowPagination = useMemo(() => {
    const total = pagination?.total ?? 0
    return total > 10
  }, [pagination])

  const handleRetry = () => {
    setPage(1)
    fetchMissions()
  }

  const missionsCount = missions.length
  const total = pagination?.total ?? missionsCount

  const canExport = hasRole('admin', 'validateur')

  const downloadBlob = (blob, filename) => {
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    a.remove()
    window.URL.revokeObjectURL(url)
  }

  const handleExport = async (format) => {
    const res = await missionsAPI.export(format)
    const date = new Date()
    const stamp = [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, '0'),
      String(date.getDate()).padStart(2, '0'),
      '-',
      String(date.getHours()).padStart(2, '0'),
      String(date.getMinutes()).padStart(2, '0'),
    ].join('')
    const ext = format === 'pdf' ? 'pdf' : 'xlsx'
    downloadBlob(res.data, `missions_export_${stamp}.${ext}`)
  }

  const bordureStatut = (st) => {
    const s = (st ?? '').toLowerCase()
    return BORDER_STATUT[s] ?? '#94A3B8'
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="pb-2"
    >
      <ATPageHeader
        title="Mes missions"
        subtitle={`${total} mission(s) au total`}
        right={(
          <div className="flex flex-wrap items-center gap-2">
            {canExport && (
              <>
                <button
                  type="button"
                  onClick={() => handleExport('xlsx')}
                  className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-white"
                  style={{ background: '#00A650' }}
                >
                  📥 Export Excel
                </button>
                <button
                  type="button"
                  onClick={() => handleExport('pdf')}
                  className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-white"
                  style={{ background: '#dc2626' }}
                >
                  📄 Export PDF
                </button>
              </>
            )}
            <Button
              type="button"
              variant="gradient"
              size="md"
              onClick={() => navigate('/missions/nouvelle')}
            >
              <Plus size={16} />
              Nouvelle mission
            </Button>
          </div>
        )}
      />

      {/* Filtres */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.05 }}
        className="at-card-surface mb-6 p-4 md:p-5"
      >
        <div className="grid gap-3 grid-cols-[repeat(auto-fit,minmax(280px,1fr))]">
          <div>
            <label className="mb-2 block text-xs font-semibold text-[#5A6070] dark:text-[#9AA0AE]">
              Statut
            </label>
            <select
              value={statut}
              onChange={(e) => {
                setStatut(e.target.value)
                setPage(1)
              }}
              className="at-input cursor-pointer"
            >
              {STATUT_OPTIONS.map((o) => (
                <option key={o.value || 'all'} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="mb-2 block text-xs font-semibold text-[#5A6070] dark:text-[#9AA0AE]">
              Recherche
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9AA0AE]">
                <Search size={16} />
              </span>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Titre ou destination..."
                className="at-input pl-10"
              />
            </div>
          </div>
        </div>
      </motion.div>

      {loading && (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      )}

      {!loading && error && (
        <motion.div
          role="alert"
          aria-live="assertive"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 rounded-[20px] border border-red-200 bg-red-50 p-4 dark:border-red-900/50 dark:bg-red-950/30"
        >
          <div className="flex items-start gap-3">
            <div className="mt-0.5 font-bold text-red-600 dark:text-red-400">Erreur</div>
            <div className="flex-1 text-sm text-red-800 dark:text-red-200">{error}</div>
          </div>
          <div className="mt-4 flex gap-2">
            <Button variant="gradient" size="sm" onClick={handleRetry}>
              <RotateCcw size={16} />
              Réessayer
            </Button>
          </div>
        </motion.div>
      )}

      {!loading && !error && missionsCount === 0 && (
        <EmptyState
          icon={FileText}
          title="Aucune mission"
          subtitle="Créez votre première mission en cliquant sur le bouton."
          actionLabel="Créer une mission"
          onAction={() => navigate('/missions/nouvelle')}
        />
      )}

      {!loading && !error && missionsCount > 0 && (
        <>
          <div className="space-y-3">
            <AnimatePresence initial={false}>
              {missions.map((m, index) => {
                const dest = m?.destination ?? ''
                const [destination_ville, destination_pays] = typeof dest === 'string'
                  ? dest.split(',').map((s) => s.trim())
                  : [undefined, undefined]

                const depart = m?.dates?.depart ?? '—'
                const retour = m?.dates?.retour ?? '—'

                return (
                  <motion.div
                    key={m.id ?? `${m.numero_unique}_${index}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    onClick={() => navigate(`/missions/${m.id}`)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && navigate(`/missions/${m.id}`)}
                    className="at-card-surface at-hover-lift flex cursor-pointer items-center justify-between border-l-[4px] px-4 py-4 md:px-5"
                    style={{ borderLeftColor: bordureStatut(m.statut) }}
                  >
                    <div className="flex min-w-0 flex-1 items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="mb-2 font-mono text-xs text-[#9AA0AE]">
                          {m.numero_unique ?? 'OM-—'}
                        </div>
                        <div className="mb-2 truncate text-base font-bold text-[#1A1D26] dark:text-[#E8EAF0]">
                          {m.titre ?? 'Sans titre'}
                        </div>
                        <div className="mb-2 text-sm text-[#5A6070] dark:text-[#9AA0AE]">
                          <span className="font-semibold text-[#1A1D26] dark:text-[#E8EAF0]">
                            {destination_ville || '—'}
                          </span>
                          {destination_pays ? `, ${destination_pays}` : ''}
                        </div>
                        <div className="mb-2 text-sm text-[#5A6070] dark:text-[#9AA0AE]">
                          {depart}
                          {' '}
                          →
                          {retour}
                        </div>
                        <div className="text-sm font-semibold text-[#1A1D26] dark:text-[#E8EAF0]">
                          {formatDZD(m.budget_previsionnel)}
                        </div>
                      </div>

                      <div className="flex shrink-0 flex-col items-end gap-3">
                        <Badge status={m.statut} />
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation()
                            navigate(`/missions/${m.id}`)
                          }}
                        >
                          Voir
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>

          {canShowPagination && pagination && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="mt-6 flex items-center justify-between"
            >
              <Button
                variant="outline"
                size="sm"
                disabled={(pagination.current_page ?? 1) <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft size={16} />
                Précédent
              </Button>
              <div className="text-sm text-[#9AA0AE]">
                Page
                {' '}
                {(pagination.current_page ?? page)}
                {' '}
                /
                {pagination.last_page ?? 1}
              </div>
              <Button
                variant="outline"
                size="sm"
                disabled={(pagination.current_page ?? 1) >= (pagination.last_page ?? 1)}
                onClick={() => setPage((p) => p + 1)}
              >
                Suivant
                <ChevronRight size={16} />
              </Button>
            </motion.div>
          )}
        </>
      )}
    </motion.div>
  )
}
