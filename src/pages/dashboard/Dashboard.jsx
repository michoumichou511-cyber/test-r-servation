import {
  useState, useEffect, useRef,
} from 'react'
import { motion, useInView, useReducedMotion, AnimatePresence, useSpring, useTransform } from 'framer-motion'
import { useAuth } from '../../contexts/AuthContext'
import { dashboardAPI, notificationsAPI, validationsAPI } from '../../services/api'
import { useNavigate } from 'react-router-dom'
import {
  Briefcase, Plane, CheckCircle, Percent,
  Wallet, Clock, AlertTriangle,
  TrendingUp, TrendingDown, MapPin,
  Calendar,
} from 'lucide-react'
import GlassCard from '../../components/Dashboard/GlassCard'
import {
  DashboardSkeleton,
  DashboardAdmin,
  DashboardValidateur,
  DashboardUtilisateur,
} from './DashboardRoleViews'

const COLORS = {
  primary: '#00A650',
  secondary: '#003DA5',
}

/** Données de secours graphiques (backend vide / tout à zéro) */
const DEFAULT_EVOLUTION = [
  { mois: 'Jan', current: 5, previous: 3 },
  { mois: 'Fév', current: 8, previous: 6 },
  { mois: 'Mar', current: 12, previous: 9 },
  { mois: 'Avr', current: 10, previous: 8 },
  { mois: 'Mai', current: 15, previous: 11 },
  { mois: 'Jun', current: 18, previous: 13 },
]
const DEFAULT_DEPENSES = [
  { direction: 'DG', montant: 4500000, pourcentage: 85 },
  { direction: 'DRH', montant: 2500000, pourcentage: 62 },
  { direction: 'DFC', montant: 1800000, pourcentage: 45 },
  { direction: 'DT', montant: 3200000, pourcentage: 78 },
]

const KPI_LIGHT_GRADIENT = {
  missions_total:
    'linear-gradient(135deg, #EFF6FF, #DBEAFE)',
  encours:
    'linear-gradient(135deg, #FFF7ED, #FED7AA)',
  approuve:
    'linear-gradient(135deg, #F0FDF4, #DCFCE7)',
  taux:
    'linear-gradient(135deg, #F5F3FF, #EDE9FE)',
}

const CARD_DARK = {
  background: 'rgba(26, 29, 46, 0.8)',
  border: '1px solid #2A2D3E',
}

/** Ressorts — sensation « delight » sans être agressif */
const springSnappy = { type: 'spring', stiffness: 420, damping: 28 }
const springSoft = { type: 'spring', stiffness: 280, damping: 32 }

/** API stats : missions imbriquées → champs plats pour les KPI */
function normalizeStats(raw) {
  if (!raw || typeof raw !== 'object') return {}
  const m = raw.missions ?? {}
  const total = Number(m.total ?? raw.total_missions ?? 0) || 0
  const approuv = Number(m.approuvees ?? raw.missions_approuvees ?? 0) || 0
  const enCours =
    Number(raw.missions_en_cours ?? raw.en_cours ?? 0) ||
    (Number(m.soumises ?? 0) + Number(m.en_validation ?? 0)) ||
    0
  let taux = raw.taux_approbation
  if (taux == null || taux === '') {
    taux = total > 0 ? Math.round((approuv / total) * 100) : 0
  } else {
    taux = Number(taux) || 0
  }
  return {
    ...raw,
    total_missions: total,
    missions_en_cours: enCours,
    missions_approuvees: approuv,
    taux_approbation: Math.min(100, Math.max(0, taux)),
  }
}

function missionsDuMoisToChartData(d) {
  const inner = d?.data ?? d ?? {}
  const list = inner.missions
  if (Array.isArray(list) && list.length > 0) {
    const byDay = {}
    for (const m of list) {
      const ts = m.created_at ?? m.date_depart
      let label = '—'
      if (ts) {
        const dt = new Date(ts)
        label = Number.isNaN(dt.getTime())
          ? '—'
          : dt.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })
      }
      byDay[label] = (byDay[label] ?? 0) + 1
    }
    return Object.entries(byDay).map(([mois, tot]) => ({
      mois,
      total: Number(tot) || 0,
    }))
  }
  const t = Number(inner.total ?? 0) || 0
  return t > 0 ? [{ mois: 'Mois courant', total: t }] : []
}

function mapEvolutionFromRows(rows) {
  if (!Array.isArray(rows) || rows.length === 0) return []
  const last = rows.slice(Math.max(0, rows.length - 6))
  return last.map((row, i, arr) => {
    const cur = Number(row.total ?? row.current ?? 0) || 0
    const prev = i > 0
      ? Number(arr[i - 1].total ?? arr[i - 1].current ?? 0) || 0
      : Math.max(0, cur - 1)
    return {
      mois: String(row.mois ?? ''),
      current: cur,
      previous: prev,
    }
  })
}

function aggregateBudgets(stats) {
  const b = stats?.budgets
  if (!Array.isArray(b) || b.length === 0) return null
  const alloue = b.reduce((s, x) => s + Number(x?.montant_alloue ?? 0), 0)
  const consomme = b.reduce((s, x) => s + Number(x?.montant_consomme ?? 0), 0)
  if (alloue <= 0) return null
  return { alloue, consomme }
}

// ── CountUp animé (soutenance : animation complète) ─
function CountUpNumber({
  value, suffix = '', prefix = '',
}) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-40px' })
  const [count, setCount] = useState(0)
  const prefersReducedMotion = useReducedMotion()
  const num = typeof value === 'number' ? value : 0

  useEffect(() => {
    if (!isInView) return
    if (prefersReducedMotion) return
    let start = null
    const duration = 1400
    const step = (timestamp) => {
      if (!start) start = timestamp
      const progress = Math.min(
        (timestamp - start) / duration, 1)
      const ease = 1 - (2 ** (-10 * progress))
      setCount(Math.floor(num * ease))
      if (progress < 1) {
        requestAnimationFrame(step)
      } else {
        setCount(num)
      }
    }
    requestAnimationFrame(step)
  }, [value, isInView, prefersReducedMotion, num])

  const display = prefersReducedMotion && isInView ? num : count

  return (
    <span ref={ref} className="tabular-nums tracking-tight">
      {prefix}
      {display.toLocaleString('fr-DZ')}
      {suffix}
    </span>
  )
}

// ── KPI Card (style app : shimmer, particules, useSpring, icon 360°) ───────
function KPICard({
  title, value, suffix = '',
  icon: Icon, color = 'primary', delay = 0,
  trend, trendValue,
  kpiVariant = 'approuve',
  darkMode = false,
}) {
  const [hovered, setHovered] = useState(false)

  const springValue = useSpring(0, { stiffness: 100, damping: 30 })
  const displayValue = useTransform(springValue, (latest) =>
    Math.floor(latest).toLocaleString('fr-DZ'),
  )

  useEffect(() => {
    const t = setTimeout(() => springValue.set(typeof value === 'number' ? value : 0), delay * 1000 + 300)
    return () => clearTimeout(t)
  }, [value, springValue, delay])

  const colorMap = {
    primary: {
      light: 'bg-[#E6F7EE] dark:bg-[#00A650]/20',
      text: '#00A650',
    },
    secondary: {
      light: 'bg-[#E6EDF8] dark:bg-[#003DA5]/25',
      text: '#003DA5',
    },
    warning: {
      light: 'bg-[#FFF7ED] dark:bg-amber-950/40',
      text: '#F59E0B',
    },
    violet: {
      light: 'bg-[#F5F3FF] dark:bg-violet-950/30',
      text: '#8B5CF6',
    },
  }
  const c = colorMap[color] ?? colorMap.primary
  const lightBg = KPI_LIGHT_GRADIENT[kpiVariant] ?? KPI_LIGHT_GRADIENT.approuve

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay, duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`relative overflow-hidden rounded-[20px] p-6 backdrop-blur-xl cursor-pointer group ${
        darkMode
          ? 'bg-white/5 border border-white/10'
          : 'bg-white border border-gray-200'
      }`}
      style={{
        background: darkMode ? CARD_DARK.background : lightBg,
        border: darkMode ? CARD_DARK.border : '1px solid rgba(15, 23, 42, 0.06)',
      }}
      whileHover={{
        y: -8,
        scale: 1.02,
        transition: { type: 'spring', stiffness: 400 },
      }}
    >
      {/* Shimmer sweep */}
      <motion.div
        className="absolute inset-0 -translate-x-full"
        animate={hovered ? { translateX: '200%' } : { translateX: '-100%' }}
        transition={{ duration: 0.8, ease: 'easeInOut' }}
        style={{
          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)',
        }}
      />

      {/* Floating particles */}
      {hovered && (
        <>
          {[...Array(3)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 rounded-full"
              style={{ backgroundColor: c.text }}
              initial={{ x: (i * 67) % 200, y: 100, opacity: 0, scale: 0 }}
              animate={{
                y: -20,
                opacity: [0, 1, 0],
                scale: [0, 1, 0],
              }}
              transition={{ duration: 1.5, delay: i * 0.2, repeat: Infinity }}
            />
          ))}
        </>
      )}

      <div className="relative z-[1]">
        <div className="mb-4 flex items-start justify-between">
          <motion.div
            className={`flex h-12 w-12 items-center justify-center rounded-xl ${c.light}`}
            style={{ backgroundColor: `${c.text}20` }}
            animate={{
              rotate: hovered ? [0, -10, 10, 0] : 0,
              scale: hovered ? 1.1 : 1,
            }}
            transition={{ duration: 0.5 }}
          >
            <motion.div
              style={{ color: c.text }}
              animate={{ rotate: hovered ? 360 : 0 }}
              transition={{ duration: 0.5 }}
            >
              <Icon size={22} color={c.text} />
            </motion.div>
          </motion.div>

          {trend && (
            <motion.div
              className={`flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-semibold ${
                trend === 'up'
                  ? 'bg-[#E6F7EE] text-[#00A650] dark:bg-[#00A650]/20 dark:text-[#4ADE80]'
                  : 'bg-red-50 text-red-500 dark:bg-red-950/40 dark:text-red-300'
              }`}
              animate={{ scale: hovered ? 1.2 : 1 }}
            >
              {trend === 'up' ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
              {trendValue}
            </motion.div>
          )}
        </div>

        <div className="mb-1.5 flex items-baseline gap-1">
          <motion.span
            className="text-[clamp(1.5rem,4vw,2rem)] font-bold leading-none tabular-nums text-[#1A1D26] dark:text-[#E8EAF0]"
          >
            <motion.span>{displayValue}</motion.span>
          </motion.span>
          {suffix && (
            <span className="text-lg font-medium text-[#9AA0AE] dark:text-white/60">
              {suffix}
            </span>
          )}
        </div>
        <div className="text-[13px] text-[#9AA0AE] dark:text-[#8B92A8]">
          {title}
        </div>
      </div>

      {/* Corner orb */}
      <motion.div
        className="absolute -bottom-8 -right-8 w-32 h-32 rounded-full opacity-10"
        style={{ backgroundColor: c.text }}
        animate={{
          scale: hovered ? 1.5 : 1,
          opacity: hovered ? 0.2 : 0.1,
        }}
        transition={{ duration: 0.5 }}
      />
    </motion.div>
  )
}

// ── Budget Card ────────────────────────────
function BudgetCard({
  consomme, total, darkMode = false,
}) {
  const pct = total > 0
    ? Math.min((consomme / total) * 100, 100) : 0

  const color = pct >= 90
    ? '#EF4444'
    : pct >= 80
      ? '#F59E0B'
      : '#00A650'

  return (
    <motion.div
      initial={{ opacity: 0, y: 22 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...springSoft, delay: 0.35 }}
      whileHover={{ y: -6, transition: springSnappy }}
      whileTap={{ scale: 0.99 }}
      className="rounded-[20px] p-6 shadow-sm backdrop-blur-sm dark:shadow-[0_4px_24px_rgba(0,0,0,0.35)]"
      style={{
        background: darkMode ? CARD_DARK.background : 'rgba(255,255,255,0.95)',
        border: darkMode ? CARD_DARK.border : '1px solid rgba(15, 23, 42, 0.06)',
      }}
    >
      <div className="mb-4 flex items-center gap-3">
        <motion.div
          className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-[#E6EDF8] dark:bg-[#003DA5]/30"
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ duration: 4, repeat: Infinity }}
        >
          <Wallet size={18} className="text-[#003DA5] dark:text-[#7AB8FF]" />
        </motion.div>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold text-[#1A1D26] dark:text-[#E8EAF0]">
            Budget missions 2026
          </div>
          <div className="text-xs text-[#9AA0AE] dark:text-[#8B92A8]">
            Direction Générale
          </div>
        </div>
        <div
          className="ml-auto text-[22px] font-bold tabular-nums"
          style={{ color }}
        >
          {pct.toFixed(1)}
          %
        </div>
      </div>

      <div className="mb-2 flex justify-between text-xs text-[#5A6070] dark:text-[#9CA3AF]">
        <span>
          {consomme.toLocaleString('fr-DZ')}
          {' '}
          DZD
        </span>
        <span>
          /
          {' '}
          {total.toLocaleString('fr-DZ')}
          {' '}
          DZD
        </span>
      </div>

      <div className="h-2.5 overflow-hidden rounded-full bg-gray-100 dark:bg-[#252838]">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{
            duration: 1.35,
            delay: 0.45,
            ease: [0.22, 1, 0.36, 1],
          }}
          className="relative h-full rounded-full"
          style={{ background: color }}
        >
          <motion.div
            className="absolute inset-0"
            animate={{ x: ['-100%', '220%'] }}
            transition={{
              duration: 2.2,
              repeat: Infinity,
              repeatDelay: 0.8,
              ease: 'easeInOut',
            }}
            style={{
              background:
                'linear-gradient(90deg,transparent,rgba(255,255,255,0.45),transparent)',
            }}
          />
        </motion.div>
      </div>

      {pct >= 90 && (
        <div className="mt-2.5 flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400">
          <AlertTriangle size={14} />
          Budget critique !
        </div>
      )}
      {pct >= 80 && pct < 90 && (
        <div className="mt-2.5 flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400">
          <AlertTriangle size={14} />
          Attention : 80% atteint
        </div>
      )}
    </motion.div>
  )
}

// ── Validations Card ───────────────────────
function ValidationsCard({
  count, urgentes, darkMode = false,
}) {
  const navigate = useNavigate()
  const [hovered, setHovered] = useState(false)

  return (
    <motion.div
      initial={{ opacity: 0, y: 22 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...springSoft, delay: 0.42 }}
      whileHover={{ y: -6, transition: springSnappy }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      className="rounded-[20px] p-6 shadow-sm backdrop-blur-sm dark:shadow-[0_4px_24px_rgba(0,0,0,0.35)]"
      style={{
        background: darkMode ? CARD_DARK.background : 'rgba(255,255,255,0.95)',
        border: darkMode ? CARD_DARK.border : '1px solid rgba(15, 23, 42, 0.06)',
      }}
    >
      <div className="mb-4 flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2.5">
          <motion.div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-[#FFF7ED] dark:bg-amber-950/40"
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Clock size={18} className="text-amber-500" />
          </motion.div>
          <div className="text-[13px] font-medium text-[#5A6070] dark:text-[#A8B0C4]">
            En attente validation
          </div>
        </div>

        {urgentes > 0 && (
          <motion.span
            animate={{ scale: [1, 1.12, 1] }}
            transition={{
              duration: 1.6,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className="shrink-0 rounded-full bg-red-500 px-2 py-0.5 text-[11px] font-bold text-white shadow-sm dark:bg-red-600"
          >
            {urgentes}
            {' '}
            URGENT
          </motion.span>
        )}
      </div>

      <div className="mb-4 text-[40px] font-bold leading-none text-[#1A1D26] dark:text-[#E8EAF0]">
        <CountUpNumber value={count} />
        <span className="ml-2 text-sm font-normal text-[#9AA0AE] dark:text-[#8B92A8]">
          missions
        </span>
      </div>

      <motion.div
        animate={{ height: hovered ? 'auto' : 0 }}
        transition={springSoft}
        className="overflow-hidden"
      >
        <motion.button
          type="button"
          onClick={() => navigate('/validations')}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          className="w-full rounded-[10px] bg-gradient-to-r from-[#003DA5] to-[#00A650] py-2.5 text-[13px] font-semibold text-white shadow-md shadow-[#003DA5]/25 transition-shadow hover:shadow-lg hover:shadow-[#00A650]/20"
        >
          Voir les validations →
        </motion.button>
      </motion.div>
    </motion.div>
  )
}

// ── Missions Récentes ──────────────────────
function MissionsRecentes({
  missions, darkMode = false,
}) {
  const navigate = useNavigate()

  const statusColors = {
    brouillon: '#94A3B8',
    soumis: '#3B82F6',
    en_validation: '#F59E0B',
    approuve: '#00A650',
    rejete: '#EF4444',
    annule: '#6B7280',
    termine: '#8B5CF6',
  }

  if (!missions || missions.length === 0) {
    return null
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...springSoft, delay: 0.55 }}
      className="rounded-[20px] p-6 shadow-sm backdrop-blur-sm dark:shadow-[0_4px_24px_rgba(0,0,0,0.35)]"
      style={{
        background: darkMode ? CARD_DARK.background : 'rgba(255,255,255,0.95)',
        border: darkMode ? CARD_DARK.border : '1px solid rgba(15, 23, 42, 0.06)',
      }}
    >
      <div className="mb-5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-[#E6F7EE] dark:bg-[#00A650]/20">
            <Briefcase size={18} className="text-[#00A650]" />
          </div>
          <span className="text-[15px] font-semibold text-[#1A1D26] dark:text-[#E8EAF0]">
            Missions récentes
          </span>
        </div>
        <motion.button
          type="button"
          onClick={() => navigate('/missions')}
          whileHover={{ x: 3 }}
          whileTap={{ scale: 0.98 }}
          className="text-[13px] font-medium text-[#003DA5] transition-colors hover:text-[#00A650] dark:text-[#7AB8FF] dark:hover:text-[#4ADE80]"
        >
          Voir tout →
        </motion.button>
      </div>

      <div className="flex flex-col gap-2">
        {missions.slice(0, 5).map((m, i) => (
          <motion.div
            key={m.id ?? i}
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ ...springSoft, delay: 0.15 + i * 0.06 }}
            whileHover={{
              x: 6,
              scale: 1.01,
              transition: springSnappy,
            }}
            whileTap={{ scale: 0.99 }}
            onClick={() => navigate(`/missions/${m.id}`)}
            role="presentation"
            className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-[#F8F9FA] dark:hover:bg-white/[0.06]"
          >
            <motion.div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] shadow-inner"
              style={{ background: statusColors[m.statut] ?? '#94A3B8' }}
              whileHover={{ scale: 1.1, rotate: [0, -6, 6, 0] }}
              transition={{ duration: 0.45 }}
            >
              <Plane size={16} className="text-white" />
            </motion.div>

            <div className="min-w-0 flex-1">
              <div className="text-[13px] font-medium tabular-nums tracking-tight text-[#1A1D26] dark:text-[#E8EAF0]">
                {m.numero_unique ?? m.reference ?? '—'}
              </div>
              <div className="flex items-center gap-1 text-xs text-[#9AA0AE] dark:text-[#8B92A8]">
                <MapPin size={10} className="shrink-0 opacity-70" />
                <span className="truncate">
                  {m.destination
                    ?? [m.destination_ville, m.destination_pays].filter(Boolean).join(', ')
                    ?? '—'}
                </span>
              </div>
            </div>

            <div className="shrink-0 text-right">
              <div
                className="inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold text-white"
                style={{ background: statusColors[m.statut] ?? '#94A3B8' }}
              >
                {m.statut}
              </div>
              <div className="mt-0.5 flex items-center justify-end gap-1 text-[11px] text-[#9AA0AE] dark:text-[#8B92A8]">
                <Calendar size={10} />
                {m.date_depart ?? '—'}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}

// ── Dashboard Principal ────────────────────
export default function Dashboard() {
  const { user, hasRole, darkMode } = useAuth()
  const prefersReducedMotion = useReducedMotion()
  /** Mode léger : moins d’animations (fond + graphiques) — VITE_DASHBOARD_LITE=1 ou préférence « réduire les animations » */
  const dashboardLite =
    import.meta.env.VITE_DASHBOARD_LITE === '1' || prefersReducedMotion
  const [stats, setStats] = useState({})
  const [alertes, setAlertes] = useState([])
  const [graphMois, setGraphMois] = useState([])
  const [graphDir, setGraphDir] = useState([])
  const [missions, setMissions] = useState([])
  const [missionsEnAttente, setMissionsEnAttente] = useState([])
  const [notifications, setNotifications] = useState([])
  const [budget, setBudget] = useState({
    consomme: 0, total: 100000000,
  })
  const [validations, setValidations] = useState({
    en_attente: 0, urgentes: 0,
  })
  const [loading, setLoading] = useState(true)

  const isAdmin = hasRole('admin')
  const isValidateur = hasRole('validateur')
  const isUtilisateur = hasRole('utilisateur')
  const isDemandeur = hasRole('demandeur')

  const prenom = user?.prenom ?? user?.nom ?? 'Utilisateur'
  const displayName = user?.prenom ?? (typeof user?.nom === 'string' ? user.nom.split(' ')[0] : null) ?? 'Utilisateur'

  const dashboardViewKey = isAdmin
    ? 'admin'
    : isValidateur
      ? 'validateur'
      : isDemandeur
        ? 'demandeur'
        : 'utilisateur'

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      let rawStats = {}
      try {
        const r = await dashboardAPI.stats()
        rawStats = r.data?.data ?? r.data ?? {}
        setStats(normalizeStats(rawStats))
      } catch {
        setStats({})
      }

      try {
        const r = await dashboardAPI.alertes()
        const d = r.data?.data ?? r.data
        const list = d?.alertes ?? (Array.isArray(d) ? d : [])
        setAlertes(Array.isArray(list) ? list : [])
      } catch {
        setAlertes([])
      }

      let val = { en_attente: 0, urgentes: 0 }
      const bud = rawStats?.budgets
      if (bud && typeof bud === 'object' && !Array.isArray(bud) && bud.en_attente != null) {
        val.en_attente = Number(bud.en_attente) || 0
      }
      if (isValidateur) {
        try {
          const r = await dashboardAPI.validateur()
          const d = r.data?.data ?? r.data ?? {}
          val = {
            en_attente: Number(d.en_attente ?? val.en_attente) || 0,
            urgentes: Number(d.missions_urgentes ?? 0) || 0,
          }
          const list = d?.missions ?? d?.en_attente_liste ?? []
          setMissionsEnAttente(Array.isArray(list) ? list : [])
        } catch {
          /* garde val */
        }
        try {
          const r = await validationsAPI.list({ per_page: 10 })
          const data = r.data?.data ?? r.data ?? []
          const enAtt = Array.isArray(data)
            ? data.filter((v) => (v.statut ?? '').toLowerCase() === 'en_attente')
            : []
          if (enAtt.length > 0) setMissionsEnAttente(enAtt)
        } catch {
          /* ignore */
        }
      }

      if ((isUtilisateur || isDemandeur) && !isAdmin && !isValidateur) {
        try {
          const r = await notificationsAPI.list()
          const d = r.data?.data ?? r.data ?? r.data?.notifications ?? []
          setNotifications(Array.isArray(d) ? d : [])
        } catch {
          setNotifications([])
        }
      }
      setValidations(val)

      if (isAdmin) {
        const parMois = rawStats?.missions_par_mois
        if (Array.isArray(parMois) && parMois.length > 0) {
          setGraphMois(mapEvolutionFromRows(parMois))
        } else {
          try {
            const r = await dashboardAPI.missionsDuMois()
            const d = r.data?.data ?? r.data ?? {}
            const fromList = missionsDuMoisToChartData({ data: d })
            setGraphMois(mapEvolutionFromRows(fromList))
          } catch {
            setGraphMois([])
          }
        }
        try {
          const r = await dashboardAPI.depensesParDirection()
          const d = r.data?.data ?? r.data
          const dep = d?.depenses ?? d?.data ?? []
          const rows = Array.isArray(dep) ? dep : []
          setGraphDir(rows.map((row) => ({
            direction: String(row?.direction ?? '—'),
            montant: Number(row?.total ?? row?.montant ?? 0) || 0,
            pourcentage: Number(row?.pourcentage ?? 0) || 0,
          })))
        } catch {
          setGraphDir([])
        }
        const agg = aggregateBudgets(rawStats)
        if (agg) {
          setBudget({ consomme: agg.consomme, total: agg.alloue })
        }
        try {
          const r = await dashboardAPI.missionsDuMois()
          const d = r.data?.data ?? r.data ?? {}
          setMissions(Array.isArray(d.missions) ? d.missions : [])
        } catch {
          setMissions([])
        }
      } else {
        setGraphMois([])
        setGraphDir([])
        try {
          const r = await dashboardAPI.missionsDuMois()
          const d = r.data?.data ?? r.data ?? {}
          setMissions(Array.isArray(d.missions) ? d.missions : [])
        } catch {
          setMissions([])
        }
      }

      setLoading(false)
    }
    load()
  }, [isAdmin, isValidateur, isUtilisateur, isDemandeur])

  if (loading) return <DashboardSkeleton />

  const transitionMain = { duration: 0.45, ease: [0.4, 0, 0.2, 1] }

  if (isAdmin) {
    return (
      <AnimatePresence mode="wait">
        <motion.div
          key={dashboardViewKey}
          initial={{ opacity: 0, y: 20, scale: 0.985 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -16, scale: 0.985 }}
          transition={transitionMain}
        >
          <DashboardAdmin
            stats={stats}
            missions={missions}
            alertes={alertes}
            validations={validations}
            budget={budget}
            graphMois={graphMois}
            graphDir={graphDir}
            darkMode={!!darkMode}
            dashboardLite={dashboardLite}
            displayName={displayName}
            KPICard={KPICard}
            BudgetCard={BudgetCard}
            ValidationsCard={ValidationsCard}
            MissionsRecentes={MissionsRecentes}
            springSoft={springSoft}
          />
        </motion.div>
      </AnimatePresence>
    )
  }

  if (isValidateur) {
    return (
      <AnimatePresence mode="wait">
        <motion.div
          key={dashboardViewKey}
          initial={{ opacity: 0, y: 20, scale: 0.985 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -16, scale: 0.985 }}
          transition={transitionMain}
        >
          <DashboardValidateur
            stats={stats}
            missions={missions}
            missionsEnAttente={missionsEnAttente}
            validations={validations}
            darkMode={!!darkMode}
            dashboardLite={dashboardLite}
            displayName={displayName}
            KPICard={KPICard}
            MissionsRecentes={MissionsRecentes}
            springSoft={springSoft}
          />
        </motion.div>
      </AnimatePresence>
    )
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={dashboardViewKey}
        initial={{ opacity: 0, y: 20, scale: 0.985 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -16, scale: 0.985 }}
        transition={transitionMain}
      >
        <DashboardUtilisateur
          stats={stats}
          missions={missions}
          notifications={notifications}
          prenom={prenom}
          displayName={displayName}
          isDemandeur={isDemandeur}
          darkMode={!!darkMode}
          dashboardLite={dashboardLite}
          KPICard={KPICard}
          MissionsRecentes={MissionsRecentes}
        />
      </motion.div>
    </AnimatePresence>
  )
}
