import { useMemo, useId } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  Briefcase, Plane, CheckCircle, Percent,
  Wallet, Clock, AlertTriangle, TrendingUp,
} from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell,
} from 'recharts'
import GlassCard from '../../components/Dashboard/GlassCard'
import ParticleBackground from '../../components/Dashboard/ParticleBackground'
import WelcomeHeader from '../../components/Dashboard/WelcomeHeader'
import NotificationCard from '../../components/Dashboard/NotificationCard'

const CARD_DARK = {
  background: 'rgba(26, 29, 46, 0.8)',
  border: '1px solid #2A2D3E',
}

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

function evolutionIsEmpty(rows) {
  if (!Array.isArray(rows) || rows.length === 0) return true
  return rows.every((r) => {
    const c = Number(r?.current ?? r?.total ?? 0) || 0
    const p = Number(r?.previous ?? 0) || 0
    return c === 0 && p === 0
  })
}

function depensesIsEmpty(rows) {
  if (!Array.isArray(rows) || rows.length === 0) return true
  return rows.every((r) => (Number(r?.montant ?? r?.total ?? 0) || 0) === 0)
}

export function DashboardSkeleton() {
  return (
    <div className="p-6">
      <div className="mb-2 h-7 w-52 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700" />
      <div className="mt-6 grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-[120px] animate-pulse rounded-[20px] bg-gray-100 dark:bg-gray-800"
          />
        ))}
      </div>
    </div>
  )
}

export function DashboardAdmin({
  stats,
  missions,
  alertes,
  validations,
  budget,
  graphMois,
  graphDir,
  darkMode,
  dashboardLite,
  displayName = 'Admin',
  KPICard,
  BudgetCard,
  ValidationsCard,
  MissionsRecentes,
  springSoft,
}) {
  const chartUid = useId().replace(/:/g, '')

  const evoData = useMemo(() => {
    if (evolutionIsEmpty(graphMois)) return DEFAULT_EVOLUTION
    return graphMois
  }, [graphMois])

  const depData = useMemo(() => {
    if (depensesIsEmpty(graphDir)) return DEFAULT_DEPENSES
    return graphDir
  }, [graphDir])

  const gridStroke = darkMode ? '#2A2D3E' : '#ECEFF4'
  const tickMuted = darkMode ? '#8B92A8' : '#9AA0AE'
  const tickStrong = darkMode ? '#E8EAF0' : '#1A1D26'
  const tooltipStyle = {
    backgroundColor: darkMode ? '#1A1D2E' : '#fff',
    border: `1px solid ${darkMode ? '#2A2D3E' : '#EAECF0'}`,
    borderRadius: 12,
    fontSize: 12,
    color: darkMode ? '#E8EAF0' : '#1A1D26',
  }
  const chartAnimArea = dashboardLite ? 0 : 900
  const chartAnimBar = dashboardLite ? 0 : 700
  const chartAnimOn = !dashboardLite

  return (
    <div
      className="relative isolate overflow-x-hidden overflow-y-visible rounded-2xl px-4 pb-4 sm:px-6 sm:pb-6 lg:px-8 lg:pb-8 at-kimi-dashboard"
      style={{ paddingTop: 16 }}
    >
      {!dashboardLite && (
        <ParticleBackground isDarkMode={!!darkMode} />
      )}

      <div className="relative z-[1]">
        <WelcomeHeader
          name={displayName}
          isDarkMode={!!darkMode}
        />
      </div>

      {alertes.length > 0 && (
        <div className="relative z-[1] mb-5">
          {alertes.map((a, i) => {
            const isObj = typeof a === 'object' && a !== null
            const niveau = isObj ? a.niveau : undefined
            const msg = isObj ? (a.message ?? '') : String(a)
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className={[
                  'mb-2 flex items-center gap-2.5 rounded-xl px-4 py-3 text-[13px]',
                  niveau === 'critique'
                    ? 'border border-red-200 bg-red-50 text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200'
                    : 'border border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-100',
                ].join(' ')}
              >
                <AlertTriangle size={16} className="shrink-0" />
                {msg}
              </motion.div>
            )
          })}
        </div>
      )}

      <div className="relative z-[1] mb-6 grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-5">
        <KPICard
          title="Missions totales"
          value={Number(stats?.total_missions ?? 0) || 0}
          icon={Briefcase}
          color="secondary"
          kpiVariant="missions_total"
          darkMode={!!darkMode}
          delay={0}
        />
        <KPICard
          title="En cours"
          value={Number(stats?.missions_en_cours ?? stats?.en_cours ?? 0) || 0}
          icon={Plane}
          color="warning"
          kpiVariant="encours"
          darkMode={!!darkMode}
          delay={0.1}
        />
        <KPICard
          title="Approuvées"
          value={Number(stats?.missions_approuvees ?? stats?.approuvees ?? 0) || 0}
          icon={CheckCircle}
          color="primary"
          kpiVariant="approuve"
          darkMode={!!darkMode}
          delay={0.2}
        />
        <KPICard
          title="Taux d'approbation"
          value={Number(stats?.taux_approbation ?? 0) || 0}
          suffix="%"
          icon={Percent}
          color="violet"
          kpiVariant="taux"
          darkMode={!!darkMode}
          trend="up"
          trendValue="+5%"
          delay={0.3}
        />
      </div>

      <div className="relative z-[1] mb-6 grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-5">
        <BudgetCard
          consomme={budget.consomme}
          total={budget.total}
          darkMode={!!darkMode}
        />
        <ValidationsCard
          count={validations.en_attente}
          urgentes={validations.urgentes}
          darkMode={!!darkMode}
        />
      </div>

      <div className="relative z-[1] mb-6 grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-5">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...springSoft, delay: 0.45 }}
          className="relative z-[1]"
        >
          <GlassCard darkMode={!!darkMode} className="p-6 shadow-sm">
            <div className="mb-1 text-[15px] font-semibold text-[#1A1D26] dark:text-[#E8EAF0]">
              Évolution des missions
            </div>
            <div className="mb-5 text-xs text-[#9AA0AE] dark:text-[#8B92A8]">
              Missions par mois
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={evoData}>
                <defs>
                  <linearGradient id={`gCurrent-${chartUid}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00A650" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#00A650" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id={`gPrev-${chartUid}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#003DA5" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#003DA5" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
                <XAxis dataKey="mois" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: tickMuted }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: tickMuted }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Area type="monotone" dataKey="previous" stroke="#003DA5" strokeWidth={2} fill={`url(#gPrev-${chartUid})`} strokeDasharray="5 5" isAnimationActive={chartAnimOn} animationDuration={chartAnimArea} />
                <Area type="monotone" dataKey="current" stroke="#00A650" strokeWidth={3} fill={`url(#gCurrent-${chartUid})`} isAnimationActive={chartAnimOn} animationDuration={chartAnimArea} />
              </AreaChart>
            </ResponsiveContainer>
          </GlassCard>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...springSoft, delay: 0.52 }}
          className="relative z-[1]"
        >
          <GlassCard darkMode={!!darkMode} className="p-6 shadow-sm">
            <div className="mb-1 text-[15px] font-semibold text-[#1A1D26] dark:text-[#E8EAF0]">
              Dépenses par direction
            </div>
            <div className="mb-5 text-xs text-[#9AA0AE] dark:text-[#8B92A8]">
              Budget consommé (DZD)
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={depData} layout="vertical" margin={{ left: 60 }}>
                <defs>
                  {depData.map((_, i) => (
                    <linearGradient key={i} id={`bg${chartUid}-${i}`} x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#003DA5" />
                      <stop offset="100%" stopColor="#00A650" />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} horizontal={false} />
                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: tickMuted }} tickFormatter={(v) => `${(v / 1000000).toFixed(0)}M`} />
                <YAxis type="category" dataKey="direction" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: tickStrong }} width={55} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`${Number(v).toLocaleString('fr-DZ')} DZD`, 'Montant']} />
                <Bar dataKey="montant" radius={[0, 8, 8, 0]} isAnimationActive={chartAnimOn} animationDuration={chartAnimBar}>
                  {depData.map((_, i) => (
                    <Cell key={i} fill={`url(#bg${chartUid}-${i})`} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </GlassCard>
        </motion.div>
      </div>

      <div className="relative z-[1]">
        <MissionsRecentes missions={missions} darkMode={!!darkMode} />
      </div>
    </div>
  )
}

export function DashboardValidateur({
  stats,
  missions,
  missionsEnAttente,
  validations,
  darkMode,
  dashboardLite = false,
  displayName = 'Validateur',
  KPICard,
  MissionsRecentes,
  springSoft,
}) {
  const navigate = useNavigate()

  const aValider = Number(validations?.en_attente ?? 0) || 0
  const urgentes = Number(validations?.urgentes ?? 0) || 0
  const valideesMois = Number(stats?.validations_validees_ce_mois ?? stats?.validées_ce_mois ?? 0) || 0
  const rejeteesMois = Number(stats?.validations_rejetees_ce_mois ?? stats?.rejetées_ce_mois ?? 0) || 0
  const delaiMoyen = stats?.delai_moyen_traitement ?? stats?.délai_moyen ?? '—'
  const listeAttente = Array.isArray(missionsEnAttente) ? missionsEnAttente : []

  return (
    <div
      className="relative isolate overflow-x-hidden overflow-y-visible rounded-2xl px-4 pb-4 sm:px-6 sm:pb-6 lg:px-8 lg:pb-8 at-kimi-dashboard"
      style={{ paddingTop: 16 }}
    >
      {!dashboardLite && (
        <ParticleBackground isDarkMode={!!darkMode} />
      )}

      <div className="relative z-[1]">
        <WelcomeHeader
          name={displayName}
          isDarkMode={!!darkMode}
        />
      </div>

      <div className="relative z-[1] mb-6 grid grid-cols-4-kpi grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-5">
        <KPICard
          title="Missions à valider"
          value={aValider}
          icon={Clock}
          color={aValider > 0 ? 'warning' : 'primary'}
          kpiVariant="encours"
          darkMode={!!darkMode}
          delay={0}
        />
        <KPICard
          title="Validées ce mois"
          value={valideesMois}
          icon={CheckCircle}
          color="primary"
          kpiVariant="approuve"
          darkMode={!!darkMode}
          delay={0.1}
        />
        <KPICard
          title="Rejetées ce mois"
          value={rejeteesMois}
          icon={AlertTriangle}
          color="warning"
          kpiVariant="encours"
          darkMode={!!darkMode}
          delay={0.2}
        />
        <KPICard
          title="Délai moyen"
          value={delaiMoyen}
          suffix={typeof delaiMoyen === 'number' ? ' j' : ''}
          icon={TrendingUp}
          color="violet"
          kpiVariant="taux"
          darkMode={!!darkMode}
          delay={0.3}
        />
      </div>

      <div className="relative z-[1] mb-6 grid grid-cols-[repeat(auto-fit,minmax(320px,1fr))] gap-5">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...springSoft, delay: 0.4 }}
          className="rounded-[20px] p-6 shadow-sm backdrop-blur-sm dark:shadow-[0_4px_24px_rgba(0,0,0,0.35)]"
          style={{
            background: darkMode ? CARD_DARK.background : 'rgba(255,255,255,0.95)',
            border: darkMode ? CARD_DARK.border : '1px solid rgba(15, 23, 42, 0.06)',
          }}
        >
          <div className="mb-4 flex items-center justify-between gap-2">
            <span className="text-[15px] font-semibold text-[#1A1D26] dark:text-[#E8EAF0]">
              Missions en attente de ma validation
            </span>
            {urgentes > 0 && (
              <motion.span
                animate={{ scale: [1, 1.12, 1] }}
                transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
                className="shrink-0 rounded-full bg-red-500 px-2 py-0.5 text-[11px] font-bold text-white"
              >
                {urgentes} URGENT
              </motion.span>
            )}
          </div>
          <div className="flex flex-col gap-2">
            {listeAttente.slice(0, 5).length === 0 ? (
              <p className="text-sm text-[#9AA0AE] dark:text-[#8B92A8]">
                Aucune mission en attente
              </p>
            ) : (
              listeAttente.slice(0, 5).map((v, i) => (
                <motion.div
                  key={v.id ?? i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08, duration: 0.3 }}
                  whileHover={{ y: -4, boxShadow: '0 8px 24px rgba(0,166,80,0.12)' }}
                  whileTap={{ scale: 0.98 }}
                  className="flex cursor-pointer items-center justify-between gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-[#F8F9FA] dark:hover:bg-white/[0.06]"
                  onClick={() => navigate('/validations')}
                  role="presentation"
                >
                  <span className="text-[13px] font-medium">
                    {v.mission?.numero_unique ?? v.numero_unique ?? v.id ?? '—'}
                  </span>
                  <motion.button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); navigate('/validations') }}
                    whileTap={{ scale: 0.95 }}
                    whileHover={{ scale: 1.02 }}
                    className="rounded-lg bg-gradient-to-r from-[#003DA5] to-[#00A650] px-3 py-1.5 text-xs font-semibold text-white"
                  >
                    Valider maintenant →
                  </motion.button>
                </motion.div>
              ))
            )}
          </div>
          {listeAttente.length > 0 && (
            <motion.button
              type="button"
              onClick={() => navigate('/validations')}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="mt-4 w-full rounded-[10px] border-2 border-[#003DA5] py-2.5 text-[13px] font-semibold text-[#003DA5] dark:text-[#7AB8FF]"
            >
              Voir toutes les validations →
            </motion.button>
          )}
        </motion.div>

        <MissionsRecentes missions={missions} darkMode={!!darkMode} />
      </div>
    </div>
  )
}

export function DashboardUtilisateur({
  stats,
  missions,
  notifications,
  prenom,
  displayName,
  isDemandeur,
  darkMode,
  dashboardLite = false,
  KPICard,
  MissionsRecentes,
}) {
  const navigate = useNavigate()
  const name = displayName ?? prenom ?? 'Utilisateur'

  const total = Number(stats?.total_missions ?? stats?.mes_missions ?? 0) || 0
  const enCours = Number(stats?.missions_en_cours ?? stats?.en_cours ?? 0) || 0
  const approuvees = Number(stats?.missions_approuvees ?? stats?.approuvees ?? 0) || 0
  const budgetPerso = Number(stats?.budget_consomme ?? stats?.budget_personnel ?? 0) || 0
  const enAttente = Number(stats?.en_attente ?? stats?.demandes_en_attente ?? 0) || 0
  const rejetees = Number(stats?.rejetees ?? stats?.demandes_rejetees ?? 0) || 0

  const notifs = Array.isArray(notifications) ? notifications : []

  return (
    <div
      className="relative isolate overflow-x-hidden overflow-y-visible rounded-2xl px-4 pb-4 sm:px-6 sm:pb-6 lg:px-8 lg:pb-8 at-kimi-dashboard"
      style={{ paddingTop: 16 }}
    >
      {!dashboardLite && (
        <ParticleBackground isDarkMode={!!darkMode} />
      )}

      <div className="relative z-[1]">
        <WelcomeHeader
          name={name}
          isDarkMode={!!darkMode}
          showActionButton={!!isDemandeur}
          actionButtonText="Nouvelle demande de mission"
          onActionClick={() => navigate('/missions/nouvelle')}
        />
      </div>

      <div className="relative z-[1] mb-6 grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-5">
        <KPICard
          title={isDemandeur ? 'Mes demandes' : 'Mes missions'}
          value={total}
          icon={Briefcase}
          color="secondary"
          kpiVariant="missions_total"
          darkMode={!!darkMode}
          delay={0}
        />
        <KPICard
          title={isDemandeur ? 'En attente' : 'En cours'}
          value={isDemandeur ? enAttente : enCours}
          icon={Clock}
          color="warning"
          kpiVariant="encours"
          darkMode={!!darkMode}
          delay={0.1}
        />
        <KPICard
          title="Approuvées"
          value={approuvees}
          icon={CheckCircle}
          color="primary"
          kpiVariant="approuve"
          darkMode={!!darkMode}
          delay={0.2}
        />
        <KPICard
          title={isDemandeur ? 'Rejetées' : 'Budget consommé'}
          value={isDemandeur ? rejetees : budgetPerso}
          suffix={isDemandeur ? '' : ' DZD'}
          icon={isDemandeur ? AlertTriangle : Wallet}
          color={isDemandeur ? 'warning' : 'violet'}
          kpiVariant="taux"
          darkMode={!!darkMode}
          delay={0.3}
        />
      </div>

      {/* Actions rapides (style app) */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="relative z-[1] mb-6"
      >
        <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          Actions rapides
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              label: 'Nouvelle demande',
              color: 'from-[#003DA5] to-[#00A650]',
              icon: '+',
              onClick: () => navigate('/missions/nouvelle'),
            },
            {
              label: 'Voir calendrier',
              color: 'from-[#003DA5] to-[#0ea5e9]',
              icon: '📅',
              onClick: () => navigate('/missions'),
            },
            {
              label: 'Messagerie',
              color: 'from-[#00A650] to-[#10b981]',
              icon: '💬',
              onClick: () => navigate('/messagerie'),
            },
          ].map((action, index) => (
            <motion.button
              key={action.label}
              type="button"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 + index * 0.1 }}
              whileHover={{
                scale: 1.05,
                y: -5,
                boxShadow: '0 20px 40px rgba(0,61,165,0.25)',
              }}
              whileTap={{ scale: 0.95 }}
              onClick={action.onClick}
              className={`p-6 rounded-2xl bg-gradient-to-r ${action.color} text-white font-semibold relative overflow-hidden group`}
            >
              <motion.div
                className="absolute inset-0 bg-white/20"
                initial={{ x: '-100%' }}
                whileHover={{ x: '100%' }}
                transition={{ duration: 0.5 }}
              />
              <span className="relative z-10 flex items-center justify-center gap-2">
                <span className="text-2xl">{action.icon}</span>
                {action.label}
              </span>
            </motion.button>
          ))}
        </div>
      </motion.div>

      <div className="relative z-[1] mb-6 grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-5">
        <MissionsRecentes missions={missions} darkMode={!!darkMode} />

        <NotificationCard
          notifications={notifs}
          isDarkMode={!!darkMode}
        />
      </div>
    </div>
  )
}
