import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { authAPI } from '../../services/api'
import PageHeader from '../../components/Common/PageHeader'
import { Button, EmptyState, Input, SkeletonCard, SkeletonLine } from '../../components/UI'
import { Badge } from '../../components/UI'
import { motion, AnimatePresence } from 'framer-motion'
import {
  AlertTriangle,
  Info, Shield, LineChart as LineChartIcon, Save, Lock, RotateCcw,
} from 'lucide-react'
import toast from 'react-hot-toast'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts'

const TABS = [
  { key: 'informations', label: 'Informations', icon: Info },
  { key: 'statistiques', label: 'Statistiques', icon: LineChartIcon },
  { key: 'securite', label: 'Sécurité', icon: Shield },
]

function formatDZD(v) {
  const n = typeof v === 'number' ? v : Number(v ?? 0)
  if (Number.isNaN(n)) return '0 DZD'
  return `${n.toLocaleString('fr-FR')} DZD`
}

export default function Profil() {
  const { user, updateUser } = useAuth()

  const [activeTab, setActiveTab] = useState('informations')

  // Informations
  const [editing, setEditing] = useState(false)
  const [savingProfile, setSavingProfile] = useState(false)
  const [profileError, setProfileError] = useState('')
  const [profileForm, setProfileForm] = useState({
    nom: '',
    prenom: '',
    email: '',
    matricule: '',
    direction: '',
    service: '',
    poste: '',
    telephone: '',
  })

  useEffect(() => {
    if (!user) return
    setProfileForm({
      nom: user.nom ?? '',
      prenom: user.prenom ?? '',
      email: user.email ?? '',
      matricule: user.matricule ?? '',
      direction: user.direction ?? '',
      service: user.service ?? '',
      poste: user.poste ?? '',
      telephone: user.telephone ?? '',
    })
  }, [user])

  const startEdit = () => {
    setProfileError('')
    setEditing(true)
  }

  const cancelEdit = () => {
    setProfileError('')
    setEditing(false)
    if (!user) return
    setProfileForm({
      nom: user.nom ?? '',
      prenom: user.prenom ?? '',
      email: user.email ?? '',
      matricule: user.matricule ?? '',
      direction: user.direction ?? '',
      service: user.service ?? '',
      poste: user.poste ?? '',
      telephone: user.telephone ?? '',
    })
  }

  const saveProfile = useCallback(async () => {
    if (!user) return
    setSavingProfile(true)
    setProfileError('')
    try {
      const payload = {
        nom: profileForm.nom || undefined,
        prenom: profileForm.prenom || undefined,
        telephone: profileForm.telephone || undefined,
        service: profileForm.service || undefined,
        direction: profileForm.direction || undefined,
        poste: profileForm.poste || undefined,
      }

      const res = await authAPI.updateProfile(payload)
      const u = res.data?.data
      if (u) updateUser(u)
      toast.success('Profil sauvegardé ✅')
      setEditing(false)
    } catch (err) {
      setProfileError(
        err?.response?.data?.message || err?.message || 'Erreur sauvegarde profil'
      )
      toast.error('Erreur lors de la sauvegarde')
    } finally {
      setSavingProfile(false)
    }
  }, [profileForm, updateUser, user])

  // Statistiques
  const [statsLoading, setStatsLoading] = useState(false)
  const [statsError, setStatsError] = useState('')
  const [stats, setStats] = useState(null)

  const chargerStats = useCallback(async () => {
    setStatsLoading(true)
    setStatsError('')
    try {
      const res = await authAPI.statistiques()
      // ApiResponse::success([...]) => response.data.data
      const d = res.data?.data ?? {}
      setStats(d)
    } catch (err) {
      setStats(null)
      setStatsError(
        err?.response?.data?.message || err?.message || 'Erreur chargement statistiques'
      )
    } finally {
      setStatsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (activeTab === 'statistiques' && stats == null && !statsLoading) {
      chargerStats()
    }
  }, [activeTab, stats, statsLoading, chargerStats])

  const totalMissions = stats?.total_missions ?? 0
  const taux = stats?.taux_approbation ?? 0
  const budgetTotal = stats?.budget_total ?? 0
  const destFav = stats?.destination_favorite ?? 'Aucune'

  const parMois = Array.isArray(stats?.par_mois) ? stats.par_mois : []

  // Sécurité
  const [securityLoading, setSecurityLoading] = useState(false)
  const [securityError, setSecurityError] = useState('')
  const [pwdForm, setPwdForm] = useState({
    current_password: '',
    new_password: '',
    new_password_confirmation: '',
  })

  const changePassword = useCallback(async () => {
    setSecurityLoading(true)
    setSecurityError('')
    try {
      const payload = {
        current_password: pwdForm.current_password,
        new_password: pwdForm.new_password,
        new_password_confirmation: pwdForm.new_password_confirmation,
      }
      await authAPI.changePassword(payload)
      toast.success('Mot de passe modifié ✅. Reconnexion nécessaire.')
      setPwdForm({ current_password: '', new_password: '', new_password_confirmation: '' })
    } catch (err) {
      setSecurityError(
        err?.response?.data?.message ||
          err?.message ||
          'Erreur lors du changement de mot de passe'
      )
      toast.error('Changement de mot de passe échoué')
    } finally {
      setSecurityLoading(false)
    }
  }, [pwdForm])

  const tabButtons = useMemo(
    () => (
      <div className="at-card-surface mb-4 p-2">
        <div className="flex items-center gap-2 overflow-x-auto px-1">
          {TABS.map(t => {
            const active = activeTab === t.key
            const Icon = t.icon
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => setActiveTab(t.key)}
                className={[
                  'flex items-center gap-2 whitespace-nowrap rounded-xl px-3 py-2.5 text-sm font-semibold transition-all',
                  active
                    ? 'bg-[#E6F7EE] text-[#00A650] ring-2 ring-[#00A650]/30 dark:bg-[#00A650]/15 dark:text-[#4ade80]'
                    : 'border border-transparent bg-transparent text-[#5A6070] hover:bg-[#F8F9FC] dark:text-[#9AA0AE] dark:hover:bg-[#252840]',
                ].join(' ')}
              >
                <Icon size={16} />
                {t.label}
              </button>
            )
          })}
        </div>
      </div>
    ),
    [activeTab]
  )

  if (!user) {
    return (
      <div>
        <PageHeader title="Mon profil" subtitle="Chargement..." backTo="/" />
        <div className="space-y-3">
          {[0, 1, 2].map(i => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    )
  }

  const roleLabel = user.role?.name ?? user.role ?? 'Utilisateur'
  const initialesHero = [user.prenom?.[0], user.nom?.[0]].filter(Boolean).join('').toUpperCase() || '?'

  return (
    <div>
      <div
        style={{
          background: 'linear-gradient(135deg, #003DA5 0%, #00A650 100%)',
          borderRadius: 20,
          padding: '32px 28px',
          marginBottom: 24,
          display: 'flex',
          alignItems: 'center',
          gap: 20,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            width: 200,
            height: 200,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.05)',
            top: -80,
            right: -40,
          }}
        />
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.2)',
            border: '3px solid rgba(255,255,255,0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 24,
            fontWeight: 700,
            color: 'white',
            flexShrink: 0,
            zIndex: 1,
          }}
        >
          {user.avatar_url ? (
            <img src={user.avatar_url} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
          ) : (
            initialesHero
          )}
        </div>
        <div style={{ zIndex: 1, minWidth: 0 }}>
          <h2 style={{ color: 'white', fontSize: 20, fontWeight: 700, margin: 0 }}>
            {user.prenom} {user.nom}
          </h2>
          <div style={{ display: 'flex', gap: 8, marginTop: 6, flexWrap: 'wrap', alignItems: 'center' }}>
            <span
              style={{
                padding: '4px 10px',
                borderRadius: 999,
                fontSize: 12,
                fontWeight: 600,
                background: 'rgba(255,255,255,0.25)',
                color: 'white',
              }}
            >
              {roleLabel}
            </span>
            {user.matricule && (
              <span style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 13, color: 'white' }}>
                {user.matricule}
              </span>
            )}
            {user.direction && (
              <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)' }}>{user.direction}</span>
            )}
          </div>
        </div>
      </div>

      {tabButtons}

      {/* Informations */}
      {activeTab === 'informations' && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.18 }}
        >
          <div className="at-card-surface p-5">
            <div className="flex items-start justify-between gap-3 mb-4 flex-wrap">
              <div>
                <div className="text-sm font-semibold text-gray-700">Identité</div>
                <div className="text-xs text-gray-500 mt-1">
                  Champs verrouillés sauf lorsque vous cliquez sur “Modifier”.
                </div>
              </div>
              <div className="flex items-center gap-2">
                {!editing ? (
                  <Button onClick={startEdit}>
                    <Info size={16} /> Modifier
                  </Button>
                ) : (
                  <>
                    <Button variant="outline" onClick={cancelEdit} disabled={savingProfile}>
                      <RotateCcw size={16} /> Annuler
                    </Button>
                    <Button onClick={saveProfile} loading={savingProfile} disabled={savingProfile}>
                      <Save size={16} /> Sauvegarder
                    </Button>
                  </>
                )}
              </div>
            </div>

            {profileError && (
              <div
                className="mb-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
                role="alert"
              >
                {profileError}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Nom"
                value={profileForm.nom}
                onChange={(e) => setProfileForm(f => ({ ...f, nom: e.target.value }))}
                disabled={!editing}
              />
              <Input
                label="Prénom"
                value={profileForm.prenom}
                onChange={(e) => setProfileForm(f => ({ ...f, prenom: e.target.value }))}
                disabled={!editing}
              />
              <Input label="Email" value={profileForm.email} disabled />
              <Input label="Matricule" value={profileForm.matricule} disabled />
              <Input
                label="Direction"
                value={profileForm.direction}
                onChange={(e) => setProfileForm(f => ({ ...f, direction: e.target.value }))}
                disabled={!editing}
              />
              <Input
                label="Service"
                value={profileForm.service}
                onChange={(e) => setProfileForm(f => ({ ...f, service: e.target.value }))}
                disabled={!editing}
              />
              <Input
                label="Poste"
                value={profileForm.poste}
                onChange={(e) => setProfileForm(f => ({ ...f, poste: e.target.value }))}
                disabled={!editing}
              />
              <Input
                label="Téléphone"
                value={profileForm.telephone}
                onChange={(e) => setProfileForm(f => ({ ...f, telephone: e.target.value }))}
                disabled={!editing}
              />
            </div>
          </div>
        </motion.div>
      )}

      {/* Statistiques */}
      {activeTab === 'statistiques' && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.18 }}
        >
          <AnimatePresence initial={false}>
            {statsLoading && (
              <div className="space-y-3">
                {[0, 1, 2].map(i => (
                  <SkeletonCard key={i} />
                ))}
              </div>
            )}

            {!statsLoading && statsError && (
              <EmptyState
                icon={AlertTriangle}
                title="Erreur chargement"
                subtitle={statsError}
                actionLabel="Réessayer"
                onAction={chargerStats}
              />
            )}

            {!statsLoading && !statsError && stats && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-4">
                  <div className="at-card-surface p-5">
                    <div className="text-xs font-semibold text-gray-500">Total missions</div>
                    <div className="text-2xl font-extrabold text-gray-900 mt-1 tabular-nums">
                      {totalMissions}
                    </div>
                  </div>
                  <div className="at-card-surface p-5">
                    <div className="text-xs font-semibold text-gray-500">Taux d&apos;approbation</div>
                    <div className="text-2xl font-extrabold text-gray-900 mt-1 tabular-nums">
                      {taux}%
                    </div>
                  </div>
                  <div className="at-card-surface p-5">
                    <div className="text-xs font-semibold text-gray-500">Budget total approuvé</div>
                    <div className="text-2xl font-extrabold text-gray-900 mt-1 tabular-nums">
                      {formatDZD(budgetTotal)}
                    </div>
                  </div>
                  <div className="at-card-surface p-5">
                    <div className="text-xs font-semibold text-gray-500">Destination favorite</div>
                    <div className="text-sm font-semibold text-gray-900 mt-2">
                      {destFav || 'Aucune'}
                    </div>
                  </div>
                </div>

                <div className="at-card-surface p-5">
                  <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
                    <div>
                      <div className="text-sm font-semibold text-gray-800">Missions par mois (6 mois)</div>
                      <div className="text-xs text-gray-500 mt-1">
                        Visualisation basée sur les données backend.
                      </div>
                    </div>
                  </div>

                  {parMois.length === 0 ? (
                    <div className="py-12">
                      <EmptyState
                        icon={LineChartIcon}
                        title="Aucune donnée"
                        subtitle="Vous n&apos;avez pas encore assez de missions pour ce graphique."
                      />
                    </div>
                  ) : (
                    <div style={{ height: 260, width: '100%' }}>
                      <ResponsiveContainer>
                        <LineChart data={parMois}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" />
                          <XAxis dataKey="mois" tick={{ fontSize: 12 }} />
                          <YAxis tick={{ fontSize: 12 }} />
                          <Tooltip />
                          <Line type="monotone" dataKey="count" name="Missions" stroke="#003DA5" strokeWidth={2} dot={{ r: 3 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>

                {/* Dernières missions (petit tableau rapide) */}
                {Array.isArray(stats.dernieres_missions) && stats.dernieres_missions.length > 0 && (
                  <div className="at-card-surface mt-4 p-5">
                    <div className="text-sm font-semibold text-gray-800 mb-3">
                      Dernières missions
                    </div>
                    <div className="space-y-2">
                      {stats.dernieres_missions.slice(0, 5).map((m, idx) => (
                        <div
                          key={m.id ?? idx}
                          className="flex items-center justify-between gap-3 p-3 rounded-xl border border-gray-100 bg-[#F8FAFC]"
                        >
                          <div className="min-w-0">
                            <div className="text-sm font-semibold text-gray-900 truncate">
                              {m.titre ?? '—'}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              {m.destination_ville ?? m.destination ?? '—'} • {m.type_mission ?? '—'}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <Badge status={m.statut} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Sécurité */}
      {activeTab === 'securite' && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.18 }}
        >
          <div className="at-card-surface p-5">
            <div className="mb-4">
              <div className="text-sm font-semibold text-gray-800">Changer le mot de passe</div>
              <div className="text-xs text-gray-500 mt-1">
                La validation backend impose un mot de passe fort (majuscule, chiffre, caractère spécial).
              </div>
            </div>

            {securityError && (
              <div
                className="mb-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
                role="alert"
              >
                {securityError}
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault()
                changePassword()
              }}
              className="space-y-4"
            >
              <Input
                label="Ancien mot de passe"
                type="password"
                value={pwdForm.current_password}
                onChange={(e) => setPwdForm(f => ({ ...f, current_password: e.target.value }))}
                required
              />
              <Input
                label="Nouveau mot de passe"
                type="password"
                value={pwdForm.new_password}
                onChange={(e) => setPwdForm(f => ({ ...f, new_password: e.target.value }))}
                required
              />
              <Input
                label="Confirmer le nouveau mot de passe"
                type="password"
                value={pwdForm.new_password_confirmation}
                onChange={(e) => setPwdForm(f => ({ ...f, new_password_confirmation: e.target.value }))}
                required
              />

              <div className="flex items-center gap-2 flex-wrap">
                <Button type="submit" loading={securityLoading}>
                  <Lock size={16} /> Mettre à jour
                </Button>
              </div>
            </form>
          </div>
        </motion.div>
      )}
    </div>
  )
}
