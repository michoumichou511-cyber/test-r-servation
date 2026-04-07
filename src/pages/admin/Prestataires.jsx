import { useCallback, useEffect, useMemo, useState } from 'react'
import Swal from 'sweetalert2'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Star,
  Pencil,
  Trash2,
  Plus,
  RotateCcw,
  StarOff,
  Globe,
  Phone,
  Mail,
  Building2,
} from 'lucide-react'
import toast from 'react-hot-toast'

import PageHeader from '../../components/Common/PageHeader'
import { adminAPI } from '../../services/api'
import { Badge, Button, EmptyState, Input, SkeletonCard, Toggle, StarRating } from '../../components/UI'
import Modal from '../../components/UI/Modal'

const TYPE_OPTIONS = [
  { value: 'hotel', label: 'Hôtel' },
  { value: 'restaurant', label: 'Restaurant' },
  { value: 'compagnie_aerienne', label: 'Compagnie aérienne' },
  { value: 'transport', label: 'Transport' },
  { value: 'autre', label: 'Autre' },
]

function extractPrestataireFromResponse(res) {
  const d = res?.data
  const maybe = d?.data?.prestataire ?? d?.prestataire ?? d?.data ?? null
  if (maybe && maybe.id != null && (maybe.nom || typeof maybe.nom === 'string')) return maybe
  return null
}

export default function Prestataires() {
  const perPage = 15

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [items, setItems] = useState([])
  const [pagination, setPagination] = useState(null)
  const [page, setPage] = useState(1)

  const fetchPrestataires = useCallback(async (p = page) => {
    setLoading(true)
    setError('')
    try {
      const res = await adminAPI.prestataires({ page: p, per_page: perPage })
      const data = res.data?.data ?? []
      const pag = res.data?.pagination ?? null
      setItems(Array.isArray(data) ? data : [])
      setPagination(pag)
    } catch (err) {
      setItems([])
      setError(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          err?.message ||
          'Erreur lors du chargement des prestataires'
      )
    } finally {
      setLoading(false)
    }
  }, [page])

  useEffect(() => {
    fetchPrestataires(1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleRetry = () => fetchPrestataires(1)

  const last = pagination?.last_page ?? 1
  const current = pagination?.current_page ?? page

  // Création / édition
  const [modalOpen, setModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState('create') // création | modification
  const [editingId, setEditingId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')

  const [form, setForm] = useState({
    nom: '',
    type: 'hotel',
    ville: '',
    adresse: '',
    telephone: '',
    email: '',
    site_web: '',
    note_performance: '',
    is_active: true,
  })

  const openCreate = () => {
    setModalMode('create')
    setEditingId(null)
    setFormError('')
    setForm({
      nom: '',
      type: 'hotel',
      ville: '',
      adresse: '',
      telephone: '',
      email: '',
      site_web: '',
      note_performance: '',
      is_active: true,
    })
    setModalOpen(true)
  }

  const openEdit = (p) => {
    setModalMode('edit')
    setEditingId(p.id)
    setFormError('')
    setForm({
      nom: p.nom ?? '',
      type: p.type ?? 'hotel',
      ville: p.ville ?? '',
      adresse: p.adresse ?? '',
      telephone: p.telephone ?? '',
      email: p.email ?? '',
      site_web: p.site_web ?? '',
      note_performance:
        p.note_performance === null || p.note_performance === undefined
          ? ''
          : String(p.note_performance),
      is_active: !!p.is_active,
    })
    setModalOpen(true)
  }

  const submit = async () => {
    setSaving(true)
    setFormError('')
    try {
      const payload = {
        nom: form.nom,
        type: form.type,
        ville: form.ville,
        adresse: form.adresse || undefined,
        telephone: form.telephone || undefined,
        email: form.email || undefined,
        site_web: form.site_web || undefined,
        note_performance: form.note_performance === '' ? undefined : Number(form.note_performance),
        is_active: !!form.is_active,
      }

      if (modalMode === 'create') {
        const res = await adminAPI.creerPrestataire(payload)
        const created = extractPrestataireFromResponse(res)
        toast.success('Prestataire créé ✅')
        // Pour éviter tout souci de parsing/fields manquants, on recharge.
        await fetchPrestataires(current)
        setModalOpen(false)
        return created
      }

      if (!editingId) throw new Error('ID prestataire manquant')

      const res = await adminAPI.modifierPrestataire(editingId, payload)
      toast.success('Prestataire modifié ✅')
      await fetchPrestataires(current)
      setModalOpen(false)
      return res
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        'Erreur lors de la sauvegarde'
      setFormError(msg)
      toast.error(msg)
    } finally {
      setSaving(false)
    }
  }

  // Favoris
  const toggleFavori = async (id) => {
    // Mise à jour optimiste
    const prev = items
    setItems((cur) =>
      cur.map((x) =>
        x.id === id
          ? {
              ...x,
              is_favori: !x.is_favori,
            }
          : x
      )
    )
    try {
      const res = await adminAPI.toggleFavori(id)
      const d = res.data?.data ?? res.data
      const isFav = d?.is_favori
      setItems((cur) =>
        cur.map((x) => (x.id === id ? { ...x, is_favori: typeof isFav === 'boolean' ? isFav : x.is_favori } : x))
      )
    } catch (err) {
      setItems(prev)
      toast.error(
        err?.response?.data?.message || err?.response?.data?.error || err?.message || 'Erreur favori'
      )
    }
  }

  const suppr = async (id, nom) => {
    const result = await Swal.fire({
      title: 'Supprimer ce prestataire ?',
      text: nom ? `Prestataire : ${nom}` : 'Cette action est irréversible.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Oui, supprimer',
      cancelButtonText: 'Annuler',
      confirmButtonColor: '#EF4444',
      cancelButtonColor: '#9CA3AF',
    })
    if (!result?.isConfirmed) return

    try {
      await adminAPI.supprimerPrestataire(id)
      toast.success('Prestataire supprimé ✅')
      await fetchPrestataires(current)
    } catch (err) {
      toast.error(
        err?.response?.data?.message || err?.response?.data?.error || err?.message || 'Erreur suppression'
      )
    }
  }

  const cards = useMemo(() => items ?? [], [items])

  const headerParType = (type) => {
    const t = (type ?? '').toLowerCase()
    if (t === 'compagnie_aerienne') return 'linear-gradient(135deg, #DBEAFE 0%, #EFF6FF 100%)'
    if (t === 'hotel') return 'linear-gradient(135deg, #DCFCE7 0%, #F0FDF4 100%)'
    if (t === 'restaurant' || t === 'catering') return 'linear-gradient(135deg, #FFEDD5 0%, #FFF7ED 100%)'
    if (t === 'agence_voyage') return 'linear-gradient(135deg, #EDE9FE 0%, #F5F3FF 100%)'
    if (t === 'transport') return 'linear-gradient(135deg, #F1F5F9 0%, #F8FAFC 100%)'
    return 'linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 100%)'
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <PageHeader
        title="Prestataires"
        subtitle="Gestion des prestataires"
        backTo="/"
        actions={
          <Button variant="gradient" size="sm" onClick={openCreate}>
            <Plus size={16} /> + Nouveau
          </Button>
        }
      />

      {loading && (
        <div className="space-y-3">
          {[0, 1, 2, 3, 4, 5].map(i => <SkeletonCard key={i} />)}
        </div>
      )}

      {!loading && error && (
        <EmptyState
          icon={Building2}
          title="Erreur de chargement"
          subtitle={error}
          actionLabel="Réessayer"
          onAction={handleRetry}
        />
      )}

      {!loading && !error && cards.length === 0 && (
        <EmptyState
          icon={Star}
          title="Aucun prestataire"
          subtitle="Aucune donnée disponible."
          actionLabel="Créer un prestataire"
          onAction={openCreate}
        />
      )}

      {!loading && !error && cards.length > 0 && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            <AnimatePresence initial={false}>
              {cards.map((p, index) => {
                const isActive = !!p.is_active
                const isFav = !!p.is_favori
                const note = typeof p.note_performance === 'number' ? p.note_performance : Number(p.note_performance ?? 0)
                const ratingValue = Number.isNaN(note) ? 0 : note
                return (
                  <motion.div
                    key={p.id ?? index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.08, duration: 0.3 }}
                    exit={{ opacity: 0, y: -6 }}
                    whileHover={{ y: -4, boxShadow: '0 8px 24px rgba(0,166,80,0.12)' }}
                    whileTap={{ scale: 0.98 }}
                    className="at-card overflow-hidden p-0"
                  >
                    <div
                      style={{
                        padding: '12px 16px',
                        background: headerParType(p.type),
                        borderBottom: '1px solid #EAECF0',
                        fontWeight: 700,
                        fontSize: 13,
                        color: '#1A1D26',
                      }}
                    >
                      {TYPE_OPTIONS.find(t => t.value === p.type)?.label ?? p.type ?? '—'}
                    </div>
                    <div className="p-5 flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <div className="font-bold text-gray-900 text-base truncate">
                            {p.nom ?? 'Prestataire'}
                          </div>
                          <Badge status={isActive ? 'actif' : 'inactif'} />
                        </div>
                        <div className="text-sm text-gray-600 mt-1">
                          {TYPE_OPTIONS.find(t => t.value === p.type)?.label ?? p.type ?? '—'}
                        </div>
                        <div className="text-sm text-gray-600 mt-1">
                          {p.ville ?? '—'}
                        </div>

                        <div className="mt-3">
                          <div className="flex items-center gap-2">
                            <StarRating value={ratingValue} readonly size={16} />
                            <span className="text-xs text-gray-500 font-semibold">
                              {ratingValue.toFixed(1)}/5
                            </span>
                          </div>
                          <div className="text-[11px] text-gray-400 mt-1">
                            {Number(p.nombre_evaluations ?? 0)} évaluation(s)
                          </div>
                        </div>

                        {(p.email || p.telephone || p.site_web) && (
                          <div className="mt-4 space-y-1">
                            {p.email && (
                              <div className="flex items-center gap-2 text-xs text-gray-500">
                                <Mail size={14} /> {p.email}
                              </div>
                            )}
                            {p.telephone && (
                              <div className="flex items-center gap-2 text-xs text-gray-500">
                                <Phone size={14} /> {p.telephone}
                              </div>
                            )}
                            {p.site_web && (
                              <div className="flex items-center gap-2 text-xs text-gray-500">
                                <Globe size={14} /> {p.site_web}
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col items-end gap-2 flex-shrink-0">
                        <Button
                          variant={isFav ? 'secondary' : 'outline'}
                          size="sm"
                          onClick={() => toggleFavori(p.id)}
                        >
                          {isFav ? <Star size={16} /> : <StarOff size={16} />}
                          <span className="ml-1">Favori</span>
                        </Button>
                      </div>
                    </div>

                    <div className="px-5 pb-5 pt-0 flex items-center justify-between gap-2 flex-wrap">
                      <Button variant="outline" size="sm" onClick={() => openEdit(p)}>
                        <Pencil size={16} /> Modifier
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => suppr(p.id, p.nom)}
                      >
                        <Trash2 size={16} /> Supprimer
                      </Button>
                    </div>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>

          {pagination && (last ?? 1) > 1 && (
            <div className="mt-5 flex items-center justify-between gap-3">
              <Button
                variant="outline"
                size="sm"
                disabled={current <= 1}
                onClick={() => {
                  const next = Math.max(1, current - 1)
                  setPage(next)
                  fetchPrestataires(next)
                }}
              >
                <RotateCcw size={16} /> Précédent
              </Button>
              <div className="text-sm text-gray-500">
                Page {current} / {last}
              </div>
              <Button
                variant="outline"
                size="sm"
                disabled={current >= last}
                onClick={() => {
                  const next = Math.min(last, current + 1)
                  setPage(next)
                  fetchPrestataires(next)
                }}
              >
                Suivant
              </Button>
            </div>
          )}
        </>
      )}

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={modalMode === 'create' ? '+ Nouveau prestataire' : 'Modifier prestataire'}
        size="lg"
      >
        <div className="space-y-4">
          {formError && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {formError}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Input
              label="Nom"
              value={form.nom}
              onChange={(e) => setForm(f => ({ ...f, nom: e.target.value }))}
              required
            />
            <div>
              <Input
                label="Type"
                value={form.type}
                onChange={(e) => setForm(f => ({ ...f, type: e.target.value }))}
                required
                placeholder="Type"
              />
              <select
                value={form.type}
                onChange={(e) => setForm(f => ({ ...f, type: e.target.value }))}
                className="w-full mt-1 px-3 py-3 rounded-lg border border-gray-200 bg-white text-sm text-gray-800
                           focus:outline-none focus:ring-1 focus:ring-at-green/30 focus:border-at-green"
              >
                {TYPE_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Input
              label="Ville"
              value={form.ville}
              onChange={(e) => setForm(f => ({ ...f, ville: e.target.value }))}
              required
            />
            <Input
              label="Note performance (0-5)"
              value={form.note_performance}
              type="number"
              onChange={(e) => setForm(f => ({ ...f, note_performance: e.target.value }))}
              placeholder="Ex: 4.5"
            />
          </div>

          <Input
            label="Adresse (optionnel)"
            value={form.adresse}
            onChange={(e) => setForm(f => ({ ...f, adresse: e.target.value }))}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Input
              label="Téléphone (optionnel)"
              value={form.telephone}
              onChange={(e) => setForm(f => ({ ...f, telephone: e.target.value }))}
            />
            <Input
              label="Email (optionnel)"
              value={form.email}
              onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))}
              type="email"
            />
          </div>

          <Input
            label="Site web (optionnel)"
            value={form.site_web}
            onChange={(e) => setForm(f => ({ ...f, site_web: e.target.value }))}
          />

          <div className="flex items-center gap-4">
            <Toggle
              checked={form.is_active}
              onChange={(val) => setForm(f => ({ ...f, is_active: val }))}
              label={form.is_active ? 'Actif' : 'Inactif'}
            />
          </div>

          <div className="flex items-center justify-end gap-2 flex-wrap">
            <Button variant="outline" onClick={() => setModalOpen(false)} disabled={saving}>
              Annuler
            </Button>
            <Button onClick={submit} loading={saving} disabled={saving}>
              {modalMode === 'create' ? (
                <>
                  <Plus size={16} /> Créer
                </>
              ) : (
                <>
                  <Pencil size={16} /> Enregistrer
                </>
              )}
            </Button>
          </div>
        </div>
      </Modal>
    </motion.div>
  )
}
