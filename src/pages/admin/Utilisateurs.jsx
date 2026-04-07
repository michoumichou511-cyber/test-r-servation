import { useCallback, useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Users, Plus, RotateCcw, KeyRound, ShieldCheck, XCircle } from 'lucide-react'
import toast from 'react-hot-toast'

import PageHeader from '../../components/Common/PageHeader'
import { adminAPI, authAPI } from '../../services/api'
import { Badge, Button, EmptyState, Input, SkeletonCard } from '../../components/UI'
import Modal from '../../components/UI/Modal'

function initials(prenom, nom) {
  const p = (prenom ?? '').toString().trim()
  const n = (nom ?? '').toString().trim()
  const a = p ? p[0] : ''
  const b = n ? n[0] : ''
  return (a + b).toUpperCase() || '?'
}

const ROLE_OPTIONS = [
  { value: 'admin', label: 'Admin' },
  { value: 'validateur', label: 'Validateur' },
  { value: 'utilisateur', label: 'Utilisateur' },
  { value: 'demandeur', label: 'Demandeur' },
]

export default function Utilisateurs() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [items, setItems] = useState([])
  const [pagination, setPagination] = useState(null)

  const [page, setPage] = useState(1)
  const perPage = 20

  // Filtres (optionnel mais utile)
  const [filterRole, setFilterRole] = useState('')
  const [filterDirection, setFilterDirection] = useState('')
  const [filterActif, setFilterActif] = useState('') // '', 'true', 'false'

  const [modalOpen, setModalOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState('')
  const [form, setForm] = useState({
    nom: '',
    prenom: '',
    email: '',
    password: '',
    matricule: '',
    service: '',
    direction: '',
    structure_id: '',
    poste: '',
    telephone: '',
  })

  const fetchUsers = useCallback(
    async (p = page) => {
      setLoading(true)
      setError('')
      try {
        const params = {
          page: p,
          per_page: perPage,
          ...(filterRole ? { role: filterRole } : {}),
          ...(filterDirection ? { direction: filterDirection } : {}),
          ...(filterActif !== '' ? { is_active: filterActif === 'true' } : {}),
        }
        const res = await adminAPI.utilisateurs(params)
        const data = res.data?.data
        const pag = res.data?.pagination
        setItems(Array.isArray(data) ? data : [])
        setPagination(pag ?? null)
      } catch (err) {
        setItems([])
        setError(
          err?.response?.data?.message ||
            err?.response?.data?.error ||
            err?.message ||
            'Erreur lors du chargement des utilisateurs'
        )
      } finally {
        setLoading(false)
      }
    },
    [page, perPage, filterRole, filterDirection, filterActif]
  )

  useEffect(() => {
    fetchUsers(1)
  }, [fetchUsers])

  const handleRetry = () => fetchUsers(1)

  const handleToggleActive = async (id) => {
    try {
      const res = await adminAPI.toggleActif(id)
      const user = res.data?.data?.user
      setItems(prev => prev.map(u => (u.id === id ? { ...u, ...user } : u)))
      toast.success('Statut mis à jour ✅')
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || 'Erreur de mise à jour')
    }
  }

  const handleChangeRole = async (id, role) => {
    try {
      const res = await adminAPI.changerRole(id, { role })
      const user = res.data?.data?.user
      setItems(prev => prev.map(u => (u.id === id ? { ...u, ...user } : u)))
      toast.success('Rôle mis à jour ✅')
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || 'Erreur de changement de rôle')
    }
  }

  const openCreate = () => {
    setCreateError('')
    setForm({
      nom: '',
      prenom: '',
      email: '',
      password: '',
      matricule: '',
      service: '',
      direction: '',
      structure_id: '',
      poste: '',
      telephone: '',
    })
    setModalOpen(true)
  }

  const submitCreate = async () => {
    setCreating(true)
    setCreateError('')
    try {
      const payload = {
        nom: form.nom,
        prenom: form.prenom,
        email: form.email,
        password: form.password,
        matricule: form.matricule || undefined,
        service: form.service || undefined,
        direction: form.direction || undefined,
        structure_id: form.structure_id || undefined,
        poste: form.poste || undefined,
        telephone: form.telephone || undefined,
      }
      await authAPI.register(payload)
      toast.success('Utilisateur créé ✅')
      setModalOpen(false)
      await fetchUsers(page)
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.errors?.[0] ||
        err?.message ||
        'Erreur lors de la création'
      setCreateError(msg)
      toast.error(msg)
    } finally {
      setCreating(false)
    }
  }

  const last = pagination?.last_page ?? 1
  const current = pagination?.current_page ?? page

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <PageHeader
        title="Utilisateurs"
        subtitle="Gestion des utilisateurs"
        backTo="/"
        actions={
          <Button size="sm" onClick={openCreate}>
            <Plus size={16} /> + Nouvel utilisateur
          </Button>
        }
      />

      {/* Filtres */}
      <div className="at-card-surface mb-6 p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-2">Rôle</label>
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="w-full px-3 py-3 rounded-xl border border-gray-200 bg-white text-sm text-gray-800
                         focus:outline-none focus:ring-1 focus:ring-at-green/30 focus:border-at-green"
            >
              <option value="">Tous</option>
              {ROLE_OPTIONS.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-2">Direction</label>
            <input
              value={filterDirection}
              onChange={(e) => setFilterDirection(e.target.value)}
              className="w-full px-3 py-3 rounded-xl border border-gray-200 bg-white text-sm text-gray-800
                         focus:outline-none focus:ring-1 focus:ring-at-green/30 focus:border-at-green"
              placeholder="Ex: Direction X"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-2">Statut</label>
            <select
              value={filterActif}
              onChange={(e) => setFilterActif(e.target.value)}
              className="w-full px-3 py-3 rounded-xl border border-gray-200 bg-white text-sm text-gray-800
                         focus:outline-none focus:ring-1 focus:ring-at-green/30 focus:border-at-green"
            >
              <option value="">Tous</option>
              <option value="true">Actif</option>
              <option value="false">Inactif</option>
            </select>
          </div>
        </div>
      </div>

      {loading && (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      )}

      {!loading && error && (
        <EmptyState
          icon={Users}
          title="Erreur de chargement"
          subtitle={error}
          actionLabel="Réessayer"
          onAction={handleRetry}
        />
      )}

      {!loading && !error && items.length === 0 && (
        <EmptyState
          icon={Users}
          title="Aucun utilisateur"
          subtitle="Aucune donnée pour les filtres actuels."
          actionLabel="Réinitialiser"
          onAction={() => {
            setFilterRole('')
            setFilterDirection('')
            setFilterActif('')
            fetchUsers(1)
          }}
        />
      )}

      {!loading && !error && items.length > 0 && (
        <div className="at-card-surface overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-[880px] w-full">
              <thead className="at-table-head border-b border-[#EAECF0] dark:border-[#2A2D3E]">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Utilisateur</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Direction</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Rôle</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Statut</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((u, index) => {
                  const roleName = u.role?.name ?? u.role?.nom ?? u.role ?? ''
                  const isActive = !!u.is_active
                  return (
                    <motion.tr
                      key={u.id ?? index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.08, duration: 0.3 }}
                      whileHover={{ backgroundColor: 'rgba(0,166,80,0.04)' }}
                      className="at-table-row border-b border-[#EAECF0] bg-white odd:bg-[#F8F9FC] dark:border-[#2A2D3E] dark:bg-[#1A1D2E] dark:odd:bg-[#161a22]"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0"
                            style={{
                              background: isActive ? 'rgba(0,166,80,0.10)' : 'rgba(148,163,184,0.18)',
                              border: '1px solid rgba(148,163,184,0.22)',
                            }}
                          >
                            <span className="text-sm font-bold text-gray-700">{initials(u.prenom, u.nom)}</span>
                          </div>
                          <div className="min-w-0">
                            <div className="text-sm font-semibold text-gray-900 truncate">
                              {u.prenom} {u.nom}
                            </div>
                            <div className="text-xs text-gray-500 truncate">{u.email}</div>
                            <div className="text-[11px] text-gray-400 mt-1 truncate">{u.matricule ?? ''}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {u.direction || u.structure_id || '—'}
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={roleName}
                          onChange={(e) => handleChangeRole(u.id, e.target.value)}
                          className="px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm text-gray-800
                                     focus:outline-none focus:ring-1 focus:ring-at-green/30 focus:border-at-green"
                        >
                          {ROLE_OPTIONS.map((r) => (
                            <option key={r.value} value={r.value}>{r.label}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <Badge status={isActive ? 'actif' : 'inactif'} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2 flex-wrap">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleToggleActive(u.id)}
                          >
                            <RotateCcw size={16} />
                            {isActive ? 'Désactiver' : 'Activer'}
                          </Button>
                        </div>
                      </td>
                    </motion.tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className="p-4 flex items-center justify-between gap-3 border-t border-gray-100 bg-white">
            <div className="text-sm text-gray-500">
              Page {current} / {last}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={current <= 1}
                onClick={() => {
                  const next = Math.max(1, current - 1)
                  setPage(next)
                  fetchUsers(next)
                }}
              >
                ← Précédent
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={current >= last}
                onClick={() => {
                  const next = Math.min(last, current + 1)
                  setPage(next)
                  fetchUsers(next)
                }}
              >
                Suivant →
              </Button>
            </div>
          </div>
        </div>
      )}

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="+ Nouvel utilisateur"
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Input label="Prénom" value={form.prenom} onChange={(e) => setForm(f => ({ ...f, prenom: e.target.value }))} />
            <Input label="Nom" value={form.nom} onChange={(e) => setForm(f => ({ ...f, nom: e.target.value }))} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Input
              label="Email"
              type="email"
              value={form.email}
              onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))}
            />
            <Input
              label="Mot de passe"
              type="password"
              value={form.password}
              onChange={(e) => setForm(f => ({ ...f, password: e.target.value }))}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Input
              label="Matricule (optionnel)"
              value={form.matricule}
              onChange={(e) => setForm(f => ({ ...f, matricule: e.target.value }))}
            />
            <Input
              label="Service (optionnel)"
              value={form.service}
              onChange={(e) => setForm(f => ({ ...f, service: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Input
              label="Direction (optionnel)"
              value={form.direction}
              onChange={(e) => setForm(f => ({ ...f, direction: e.target.value }))}
            />
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-2">Structure</label>
              <select
                name="structure_id"
                value={form.structure_id}
                onChange={(e) => setForm(f => ({ ...f, structure_id: e.target.value }))}
                className="w-full px-3 py-3 rounded-xl border border-gray-200 bg-white text-sm text-gray-800
                           focus:outline-none focus:ring-1 focus:ring-at-green/30 focus:border-at-green"
              >
                <option value="">— Choisir une structure —</option>
                <optgroup label="Direction Générale">
                  <option value="pdg">PDG — Président Directeur Général</option>
                  <option value="cellule">Cellule Reporting & Analyse</option>
                  <option value="inspection">Inspection Générale</option>
                </optgroup>
                <optgroup label="Division Systèmes d'Information (DSI)">
                  <option value="dsi">Division DSI</option>
                  <option value="dir-secu">Direction Sécurité SI</option>
                  <option value="dir-infra">Direction Infrastructures Informatiques</option>
                  <option value="dir-dev">Direction Développement SI</option>
                  <option value="dir-billing">Direction Systèmes Billings</option>
                </optgroup>
                <optgroup label="Division RH et Formation">
                  <option value="drh">Division RH et Formation</option>
                  <option value="dir-carrieres">Direction Carrières et Compétences</option>
                  <option value="dir-formation">Direction de la Formation</option>
                  <option value="dept-qualite">Département Qualité</option>
                  <option value="dept-competences">Département Compétences</option>
                  <option value="dept-veille">Département Veille Formation</option>
                  <option value="s-qualite">Service Management Qualité</option>
                  <option value="s-etude">Service Etude Formation</option>
                  <option value="s-support">Service Support & Reporting</option>
                  <option value="s-tech">Service Formations Techniques</option>
                  <option value="s-manag">Service Formations Managériales</option>
                  <option value="s-cadres">Service Formations Cadres Supérieurs</option>
                  <option value="s-veille">Service Veille Partenariats</option>
                  <option value="s-etude2">Service Etude & Dev Formation</option>
                  <option value="dir-relations">Direction Relations Socioprofessionnelles</option>
                  <option value="dir-etudes">Direction des Etudes</option>
                </optgroup>
                <optgroup label="Autres Divisions">
                  <option value="dcm">Division Commerciale & Marketing</option>
                  <option value="dfc">Division Finances & Comptabilité</option>
                  <option value="dir-interconnexion">Division Interconnexion & Relations Internationales</option>
                  <option value="dir-achats">Division Achats, Moyens & Patrimoine</option>
                  <option value="dir-surete">Direction Sûreté Interne</option>
                  <option value="dir-juridique">Direction Affaires Juridiques</option>
                  <option value="dir-audit">Direction Audit Interne</option>
                </optgroup>
                <optgroup label="Pôle Infrastructures & Réseaux">
                  <option value="pole-infra">Pôle Infrastructures et Réseaux</option>
                  <option value="div-transport">Division Réseaux Transport</option>
                  <option value="div-core">Division Réseau Core</option>
                  <option value="div-acces">Division Réseaux Accès</option>
                </optgroup>
                <optgroup label="Directions Opérationnelles">
                  <option value="do-alger1">DOT Alger Centre</option>
                  <option value="do-alger2">DOT Alger Est</option>
                  <option value="do-alger3">DOT Alger Ouest</option>
                  <option value="do">Autre Direction Opérationnelle</option>
                </optgroup>
              </select>
            </div>
          </div>

          <Input
            label="Poste (optionnel)"
            value={form.poste}
            onChange={(e) => setForm(f => ({ ...f, poste: e.target.value }))}
          />

          <Input
            label="Téléphone (optionnel)"
            value={form.telephone}
            onChange={(e) => setForm(f => ({ ...f, telephone: e.target.value }))}
          />

          {createError && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {createError}
            </div>
          )}

          <div className="flex items-center justify-end gap-2">
            <Button variant="outline" onClick={() => setModalOpen(false)} disabled={creating}>
              Annuler
            </Button>
            <Button onClick={submitCreate} loading={creating} disabled={creating}>
              <KeyRound size={16} /> Créer
            </Button>
          </div>
        </div>
      </Modal>
    </motion.div>
  )
}
