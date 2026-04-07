import { useCallback, useEffect, useMemo, useState } from 'react'
import CountUp from 'react-countup'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  FileText,
  Calendar,
  DollarSign,
  RotateCcw,
  TrendingUp,
  PieChart as PieChartIcon,
  Building2,
  AlertCircle,
} from 'lucide-react'

import toast from 'react-hot-toast'

import { adminAPI, dashboardAPI, missionsAPI } from '../../services/api'
import PageHeader from '../../components/Common/PageHeader'
import { Badge, Button, EmptyState, SkeletonCard } from '../../components/UI'
import { formatDZD } from '../../utils/format'

const PIE_COLORS = ['#00A650', '#003DA5', '#F59E0B', '#EF4444', '#8B5CF6', '#14B8A6', '#0EA5E9']

function parseDateDepart(fr) {
  if (typeof fr !== 'string') return null
  const m = fr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (!m) return null
  const dd = String(m[1]).padStart(2, '0')
  const mm = String(m[2]).padStart(2, '0')
  const yyyy = m[3]
  const iso = `${yyyy}-${mm}-${dd}T00:00:00`
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return null
  return d
}

function parseCreatedAt(iso) {
  if (!iso) return null
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return null
  return d
}

function extractDashboardStats(res) {
  const d = res?.data
  if (!d || typeof d !== 'object') return {}
  if (d.missions != null || d.missions_par_mois != null) return d
  if (d.data != null && typeof d.data === 'object') return d.data
  return {}
}

export default function Statistiques() {
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)

  const [stats, setStats] = useState(null)
  const [missionsTotal, setMissionsTotal] = useState(0)
  const [missionsSample, setMissionsSample] = useState([])
  const [prestatairesTotal, setPrestatairesTotal] = useState(0)
  const [prestatairesList, setPrestatairesList] = useState([])

  const [fetchErrors, setFetchErrors] = useState({
    stats: null,
    missions: null,
    prestataires: null,
  })

  const fetchAll = useCallback(async () => {
    setLoading(true)
    setFetchErrors({ stats: null, missions: null, prestataires: null })

    const settled = await Promise.allSettled([
      dashboardAPI.stats(),
      missionsAPI.list({ page: 1, per_page: 5 }),
      adminAPI.prestataires({ page: 1, per_page: 50 }),
    ])

    const [statsResult, missionsResult, prestatairesResult] = settled

    if (statsResult.status === 'fulfilled') {
      const raw = extractDashboardStats(statsResult.value)
      setStats(typeof raw === 'object' && raw !== null ? raw : {})
    } else {
      setStats({})
      const msg =
        statsResult.reason?.response?.data?.message ||
        statsResult.reason?.message ||
        'Statistiques dashboard indisponibles'
      setFetchErrors((e) => ({ ...e, stats: msg }))
      toast.error(msg)
    }

    if (missionsResult.status === 'fulfilled') {
      const r = missionsResult.value
      const body = r?.data
      const ms = body?.data
      const pag = body?.pagination
      const list = Array.isArray(ms) ? ms : []
      setMissionsSample(list)
      setMissionsTotal(Number(pag?.total ?? list.length) || 0)
    } else {
      setMissionsSample([])
      setMissionsTotal(0)
      const msg =
        missionsResult.reason?.response?.data?.message ||
        missionsResult.reason?.message ||
        'Liste missions indisponible'
      setFetchErrors((e) => ({ ...e, missions: msg }))
      toast.error(msg)
    }

    if (prestatairesResult.status === 'fulfilled') {
      const r = prestatairesResult.value
      const data = r?.data?.data ?? r?.data ?? []
      const pag = r?.data?.pagination
      const list = Array.isArray(data) ? data : []
      setPrestatairesList(list)
      setPrestatairesTotal(Number(pag?.total ?? list.length) || 0)
    } else {
      setPrestatairesList([])
      setPrestatairesTotal(0)
      const msg =
        prestatairesResult.reason?.response?.data?.message ||
        prestatairesResult.reason?.message ||
        'Prestataires indisponibles'
      setFetchErrors((e) => ({ ...e, prestataires: msg }))
      toast.error(msg)
    }

    setLoading(false)
  }, [])

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  const retry = () => fetchAll()

  const kpis = useMemo(() => {
    const s = stats ?? {}
    const missions = s.missions ?? {}
    const reservations = s.reservations ?? {}

    const totalMissionsListed = missionsTotal
    const approuvees = Number(missions.approuvees ?? missions.missions_approuvees ?? 0) || 0
    const totalFromStats = Number(missions.total ?? missions.total_missions ?? 0) || 0
    const denom = totalFromStats > 0 ? totalFromStats : totalMissionsListed
    const taux = denom > 0 ? Math.round((approuvees / denom) * 100) : 0

    const budgets = Array.isArray(s.budgets) ? s.budgets : []
    const budgetTotal = budgets.reduce((sum, b) => sum + (Number(b?.montant_alloue ?? 0) || 0), 0)

    return {
      totalMissionsListed,
      taux,
      budgetTotal,
      confirmeReservations: Number(reservations?.confirmees ?? 0) || 0,
    }
  }, [stats, missionsTotal])

  const lineData = useMemo(() => {
    const raw = Array.isArray(stats?.missions_par_mois) ? stats.missions_par_mois : []
    if (raw.length === 0) return []
    const last6 = raw.slice(Math.max(0, raw.length - 6))
    return last6.map((x) => ({
      mois: x?.mois ?? '',
      total: Number(x?.total ?? 0) || 0,
    }))
  }, [stats])

  const depensesParTypeChart = useMemo(() => {
    const raw = Array.isArray(stats?.depenses_par_type) ? stats.depenses_par_type : []
    return raw.map((row) => ({
      type: row?.type ?? '—',
      montant: Number(row?.montant ?? 0) || 0,
    }))
  }, [stats])

  const pieData = useMemo(() => {
    const counts = {}
    const sample = Array.isArray(missionsSample) ? missionsSample : []
    for (const m of sample) {
      const t = m?.type_mission ?? 'autre'
      const key = typeof t === 'string' && t.trim() ? t : 'autre'
      counts[key] = (counts[key] ?? 0) + 1
    }
    const entries = Object.entries(counts)
    return entries
      .map(([name, value]) => ({ name, value: Number(value) || 0 }))
      .sort((a, b) => b.value - a.value)
  }, [missionsSample])

  const delayMoyen = useMemo(() => {
    let sum = 0
    let count = 0
    for (const m of missionsSample) {
      const created = parseCreatedAt(m?.created_at)
      const depart = parseDateDepart(m?.dates?.depart)
      if (!created || !depart) continue
      const diffMs = depart.getTime() - created.getTime()
      const days = diffMs / (1000 * 60 * 60 * 24)
      if (!Number.isFinite(days)) continue
      sum += days
      count += 1
    }
    const avg = count > 0 ? sum / count : 0
    return {
      avgDays: avg,
      sample: count,
    }
  }, [missionsSample])

  const topPrestataires = useMemo(() => {
    const fromStats = Array.isArray(stats?.top_prestataires) ? stats.top_prestataires : []
    if (fromStats.length > 0) {
      return fromStats
        .map((p) => ({
          nom: p?.nom ?? '—',
          nb_reservations: Number(p?.nb_reservations ?? p?.nb_reservations_count ?? 0) || 0,
        }))
        .sort((a, b) => b.nb_reservations - a.nb_reservations)
    }
    return (prestatairesList ?? []).slice(0, 8).map((p) => ({
      nom: p?.nom ?? '—',
      nb_reservations: Number(p?.nombre_evaluations ?? 0) || 0,
    }))
  }, [stats, prestatairesList])

  const hasAnyFetchError = fetchErrors.stats || fetchErrors.missions || fetchErrors.prestataires

  return (
    <div>
      <PageHeader
        title="Statistiques"
        subtitle="Statistiques globales de l'application (admin)"
        backTo="/"
        actions={
          <Button size="sm" variant="outline" onClick={retry} disabled={loading}>
            <RotateCcw size={16} /> Rafraîchir
          </Button>
        }
      />

      {!loading && hasAnyFetchError && (
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-100">
          <div className="flex items-start gap-2">
            <AlertCircle className="flex-shrink-0 mt-0.5" size={18} />
            <div>
              <div className="font-semibold">Certaines données n’ont pas pu être chargées</div>
              <ul className="mt-1 list-disc list-inside text-xs opacity-90">
                {fetchErrors.stats && <li>Dashboard : {fetchErrors.stats}</li>}
                {fetchErrors.missions && <li>Missions : {fetchErrors.missions}</li>}
                {fetchErrors.prestataires && <li>Prestataires : {fetchErrors.prestataires}</li>}
              </ul>
            </div>
          </div>
        </div>
      )}

      {loading && (
        <div className="space-y-3">
          {[0, 1, 2].map(i => (
            <SkeletonCard key={i} />
          ))}
        </div>
      )}

      {!loading && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4 mb-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="at-card-surface p-5"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="p-2.5 bg-at-blue-light rounded-xl text-at-blue">
                  <TrendingUp size={18} />
                </div>
              </div>
              <div className="mt-3 text-2xl font-extrabold text-gray-900 tabular-nums">
                <CountUp end={kpis.totalMissionsListed} duration={1.8} separator=" " />
              </div>
              <div className="text-xs text-gray-500 mt-1">Total missions (GET /missions)</div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.05 }}
              className="at-card-surface p-5"
            >
              <div className="p-2.5 bg-at-green-light rounded-xl text-at-green flex items-center justify-between">
                <Calendar size={18} />
              </div>
              <div className="mt-3 text-2xl font-extrabold text-gray-900 tabular-nums">
                <CountUp end={kpis.taux} duration={1.8} suffix="%" separator=" " />
              </div>
              <div className="text-xs text-gray-500 mt-1">Taux d’approbation (dashboard)</div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              className="at-card-surface p-5"
            >
              <div className="p-2.5 bg-orange-50 rounded-xl text-orange-500 flex items-center justify-between">
                <DollarSign size={18} />
              </div>
              <div className="mt-3 text-2xl font-extrabold text-gray-900">
                <span className="tabular-nums">
                  {formatDZD(kpis.budgetTotal).replace(/[\s\u202f]*DZD.*$/i, '').trim()}
                </span>
              </div>
              <div className="text-xs text-gray-500 mt-1">Budget total (année courante)</div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.15 }}
              className="at-card-surface p-5"
            >
              <div className="p-2.5 bg-sky-50 rounded-xl text-sky-600 flex items-center justify-between">
                <Building2 size={18} />
              </div>
              <div className="mt-3 text-2xl font-extrabold text-gray-900 tabular-nums">
                <CountUp end={prestatairesTotal} duration={1.8} separator=" " />
              </div>
              <div className="text-xs text-gray-500 mt-1">Prestataires (GET /prestataires)</div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
              className="at-card-surface p-5"
            >
              <div className="p-2.5 bg-purple-50 rounded-xl text-purple-500 flex items-center justify-between">
                <FileText size={18} />
              </div>
              <div className="mt-3 text-2xl font-extrabold text-gray-900 tabular-nums">
                <CountUp end={Math.round(delayMoyen.avgDays)} duration={1.8} suffix=" j" />
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Délai moyen création → départ • n={delayMoyen.sample}
              </div>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
            <div className="at-card-surface p-5">
              <div className="flex items-center justify-between gap-3 mb-3">
                <div className="text-sm font-semibold text-gray-800">Missions (6 derniers mois)</div>
                <Badge status="actif" label={`${lineData.length} points`} />
              </div>

              {fetchErrors.stats && lineData.length === 0 ? (
                <EmptyState icon={FileText} title="Indisponible" subtitle={fetchErrors.stats} />
              ) : lineData.length === 0 ? (
                <EmptyState icon={FileText} title="Aucune donnée" subtitle="Impossible de tracer le graphe (données vides)." />
              ) : (
                <div style={{ height: 260 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={lineData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" />
                      <XAxis dataKey="mois" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Line type="monotone" dataKey="total" name="Total" stroke="#003DA5" strokeWidth={2} dot={{ r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            <div className="at-card-surface p-5">
              <div className="text-sm font-semibold text-gray-800 mb-3">Dépenses par type (réservations confirmées)</div>
              {fetchErrors.stats && depensesParTypeChart.length === 0 ? (
                <EmptyState icon={DollarSign} title="Indisponible" subtitle={fetchErrors.stats} />
              ) : depensesParTypeChart.length === 0 ? (
                <EmptyState icon={DollarSign} title="Aucune donnée" subtitle="Aucune dépense agrégée pour le moment." />
              ) : (
                <div style={{ height: 260 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={depensesParTypeChart}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" />
                      <XAxis dataKey="type" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Bar dataKey="montant" name="Montant" fill="#00A650" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 mb-6">
            <div className="at-card-surface p-5 xl:col-span-1">
              <div className="text-sm font-semibold text-gray-800 mb-3">Missions par type (échantillon {missionsSample.length})</div>
              {fetchErrors.missions && pieData.length === 0 ? (
                <EmptyState icon={PieChartIcon} title="Indisponible" subtitle={fetchErrors.missions} />
              ) : pieData.length === 0 ? (
                <EmptyState icon={PieChartIcon} title="Aucune donnée" subtitle="Impossible de calculer les types (échantillon vide)." />
              ) : (
                <div style={{ height: 280 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Tooltip />
                      <Pie data={pieData} dataKey="value" nameKey="name" outerRadius={85} label={false}>
                        {pieData.map((_, idx) => (
                          <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            <div className="at-card-surface p-5 xl:col-span-2">
              <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
                <div className="text-sm font-semibold text-gray-800">Top prestataires</div>
                <Button size="sm" variant="outline" onClick={() => navigate('/admin/prestataires')}>
                  Voir la liste
                </Button>
              </div>

              {fetchErrors.stats && fetchErrors.prestataires && topPrestataires.length === 0 ? (
                <EmptyState
                  icon={FileText}
                  title="Indisponible"
                  subtitle="Données prestataires non chargées."
                />
              ) : topPrestataires.length === 0 ? (
                <EmptyState icon={FileText} title="Aucune donnée" subtitle="Aucun prestataire à afficher pour le moment." />
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-[520px] w-full">
                    <thead className="at-table-head border-b border-[#EAECF0] dark:border-[#2A2D3E]">
                      <tr>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Prestataire</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">
                          {stats?.top_prestataires?.length ? 'Réservations confirmées' : 'Indicateur'}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <AnimatePresence initial={false}>
                        {topPrestataires.map((p, index) => (
                          <motion.tr
                            key={`${p.nom}_${index}`}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.2, delay: index * 0.03 }}
                            className="at-table-row border-b border-[#EAECF0] dark:border-[#2A2D3E]"
                          >
                            <td className="px-4 py-3 text-sm font-semibold text-gray-800">
                              {p.nom}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">
                              <CountUp end={p.nb_reservations} duration={1.4} separator=" " />
                            </td>
                          </motion.tr>
                        ))}
                      </AnimatePresence>
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

        </>
      )}
    </div>
  )
}
