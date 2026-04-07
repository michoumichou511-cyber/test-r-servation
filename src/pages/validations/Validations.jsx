import { useCallback, useMemo, useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { FileText, Clock, AlertTriangle, CheckCircle2, XCircle, Edit3 } from 'lucide-react'
import toast from 'react-hot-toast'

import { validationsAPI } from '../../services/api'
import { Badge, Button, EmptyState, SkeletonCard } from '../../components/UI'
import PageHeader from '../../components/Common/PageHeader'
import Modal from '../../components/UI/Modal'

const STATUT_BADGE_MAP = {
  en_attente: 'pending',
  approuve: 'approuve',
  rejete: 'rejete',
}

function parseFrDate(frDate) {
  // frDate: "d/m/Y"
  if (typeof frDate !== 'string') return null
  const m = frDate.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (!m) return null
  const dd = String(m[1]).padStart(2, '0')
  const mm = String(m[2]).padStart(2, '0')
  const yyyy = m[3]
  const iso = `${yyyy}-${mm}-${dd}T00:00:00`
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? null : d
}

function daysUntil(frDate) {
  const d = parseFrDate(frDate)
  if (!d) return null
  const now = new Date()
  const diffMs = d.getTime() - now.getTime()
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24))
}

/** Temps écoulé depuis la création de la demande (pas des jours décimaux). */
function calcAttente(dateCreation) {
  if (!dateCreation) return ''
  const diff = Date.now() - new Date(dateCreation).getTime()
  if (Number.isNaN(diff)) return ''
  const minutes = Math.floor(diff / 60000)
  const heures = Math.floor(diff / 3600000)
  const jours = Math.floor(diff / 86400000)
  if (jours > 0) return `Il y a ${jours} jour(s)`
  if (heures > 0) return `Il y a ${heures} heure(s)`
  if (minutes > 0) return `Il y a ${minutes} minute(s)`
  return 'À l\'instant'
}

function formatBudgetLight(montant) {
  const n = typeof montant === 'number' ? montant : Number(montant ?? 0)
  if (Number.isNaN(n)) return '0 DZD'
  // Le backend renvoie parfois une string déjà formatée "x DA"
  if (typeof montant === 'string' && montant.includes('DA')) return montant
  return `${n.toLocaleString('fr-FR')} DZD`
}

export default function Validations() {
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [validations, setValidations] = useState([])
  const [pagination, setPagination] = useState(null)
  const [page, setPage] = useState(1)

  const [modal, setModal] = useState({ open: false, type: null, validationId: null })
  const [commentaire, setCommentaire] = useState('')
  const [modalError, setModalError] = useState('')

  const openModal = (type, validation) => {
    setModal({ open: true, type, validationId: validation.id })
    setCommentaire('')
    setModalError('')
  }

  const closeModal = () => {
    setModal({ open: false, type: null, validationId: null })
    setCommentaire('')
    setModalError('')
  }

  const fetchValidations = useCallback(async (p = page) => {
    setLoading(true)
    setError('')
    try {
      const res = await validationsAPI.list({ page: p, per_page: 15 })
      const data = res.data?.data
      const pag = res.data?.pagination
      setValidations(Array.isArray(data) ? data : [])
      setPagination(pag ?? null)
    } catch (err) {
      setValidations([])
      setError(
        err?.response?.data?.message ||
          err?.message ||
          'Erreur lors du chargement des validations'
      )
    } finally {
      setLoading(false)
    }
  }, [page])

  // Chargement initial
  // (fetch au premier rendu)
  useEffect(() => {
    fetchValidations(1)
  }, [fetchValidations])

  const handleRetry = () => fetchValidations(1)

  const removeValidation = (id) => {
    setValidations(prev => prev.filter(v => v.id !== id))
  }

  const submitAction = async () => {
    const { type, validationId } = modal
    if (!type || !validationId) return

    const isRejeterOrModifier = type === 'rejeter' || type === 'modifier'

    // Rejeter + Demander modifications: min 10 chars obligatoire
    if (isRejeterOrModifier) {
      if (!commentaire || commentaire.trim().length < 10) {
        setModalError('Le commentaire doit contenir au moins 10 caractères.')
        return
      }
    }

    const payload = {
      commentaire: commentaire || '',
    }

    setModalError('')
    try {
      if (type === 'approuver') {
        await validationsAPI.approuver(validationId, payload)
        toast.success('Validation approuvée ✅')
      } else if (type === 'rejeter') {
        await validationsAPI.rejeter(validationId, payload)
        toast.success('Mission rejetée ✅')
      } else if (type === 'modifier') {
        await validationsAPI.modifier(validationId, payload)
        toast.success('Demande de modification envoyée ✅')
      }

      removeValidation(validationId)
      closeModal()
    } catch (err) {
      setModalError(
        err?.response?.data?.message || err?.message || 'Erreur lors de l’action'
      )
    }
  }

  const canPaginate = useMemo(() => (pagination?.total ?? 0) > 0, [pagination])

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <PageHeader title="Validations" subtitle="Gérez les demandes de validation" backTo="/" />

      {loading && (
        <div className="space-y-3">
          {[0, 1, 2].map(i => <SkeletonCard key={i} />)}
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

      {!loading && !error && validations.length === 0 && (
        <EmptyState
          icon={Clock}
          title="Aucune validation en attente"
          subtitle="Il n’y a rien à traiter pour le moment."
        />
      )}

      {!loading && !error && validations.length > 0 && (
        <div className="space-y-3">
          <AnimatePresence initial={false}>
            {validations.map((v, index) => {
              const mission = v.mission ?? {}
              const depart = mission?.dates?.depart
              const budget = mission?.budget_previsionnel
              const demandeur = v.demandeur?.nom_complet ?? '—'
              const dateAttente =
                v.created_at ?? v.date_creation ?? mission?.created_at ?? null
              const libelleAttente = calcAttente(dateAttente)

              const dLeft = daysUntil(depart)
              const urgent = typeof dLeft === 'number' ? dLeft < 7 : false

              const badgeStatus = STATUT_BADGE_MAP[v.statut] ?? 'pending'

              return (
                <motion.div
                  key={v.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.08, duration: 0.3 }}
                  exit={{ opacity: 0, y: -6 }}
                  whileHover={{ y: -4, boxShadow: '0 8px 24px rgba(0,166,80,0.12)' }}
                  whileTap={{ scale: 0.98 }}
                  className="at-card-surface at-hover-lift p-5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-3 flex-wrap">
                        <div className="font-mono text-gray-500 text-xs">
                          {mission.numero_unique ?? 'OM-—'}
                        </div>
                        <Badge status={badgeStatus} />
                        {urgent && (
                          <span
                            className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold"
                            style={{ background: '#FEE2E2', color: '#B91C1C' }}
                          >
                            URGENT
                          </span>
                        )}
                      </div>

                      <div className="mt-2 font-bold text-gray-900 text-base truncate">
                        {mission.titre ?? 'Sans titre'}
                      </div>

                      <div className="text-sm text-gray-700 mt-2">
                        Demandeur : <span className="font-semibold">{demandeur}</span>
                      </div>

                      <div className="text-sm text-gray-600 mt-1">
                        {mission.destination ?? '—'} • {depart ?? '—'} →{' '}
                        {mission.dates?.retour ?? '—'}
                      </div>

                      <div className="text-sm text-gray-800 font-semibold mt-2">
                        Budget : {formatBudgetLight(budget)}
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2 flex-shrink-0">
                      <Button variant="gradient" size="sm" onClick={() => openModal('approuver', v)}>
                        <CheckCircle2 size={16} /> Approuver
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => openModal('modifier', v)}>
                        <Edit3 size={16} /> Demander modifications
                      </Button>
                      <Button variant="danger" size="sm" onClick={() => openModal('rejeter', v)}>
                        <XCircle size={16} /> Rejeter
                      </Button>

                      <div className="hidden">
                        {/* Lien bouton si besoin */}
                        <Button variant="ghost" size="sm" />
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between gap-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate(`/missions/${mission.id ?? v.mission_id ?? ''}`)}
                      disabled={!mission.id}
                    >
                      <FileText size={16} /> Ouvrir mission
                    </Button>

                    <div className="text-xs text-gray-400">
                      {libelleAttente ? `En attente : ${libelleAttente}` : 'En attente'}
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>

          {/* Pagination simple si nécessaire */}
          {canPaginate && pagination && (pagination.last_page ?? 1) > 1 && (
            <div className="mt-2 flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                disabled={(pagination.current_page ?? page) <= 1}
                onClick={() => {
                  const next = Math.max(1, page - 1)
                  setPage(next)
                  fetchValidations(next)
                }}
              >
                ← Précédent
              </Button>
              <div className="text-sm text-gray-500">
                Page {pagination.current_page ?? page} / {pagination.last_page}
              </div>
              <Button
                variant="outline"
                size="sm"
                disabled={(pagination.current_page ?? page) >= (pagination.last_page ?? 1)}
                onClick={() => {
                  const next = page + 1
                  setPage(next)
                  fetchValidations(next)
                }}
              >
                Suivant →
              </Button>
            </div>
          )}
        </div>
      )}

      <Modal
        isOpen={modal.open}
        onClose={closeModal}
        title={
          modal.type === 'approuver'
            ? 'Approuver cette validation'
            : modal.type === 'rejeter'
              ? 'Rejeter la mission'
              : 'Demander modifications'
        }
        size="lg"
      >
        <div className="space-y-4">
          <div className="text-sm text-gray-600">
            {modal.type === 'approuver' && 'Commentaire (optionnel).'}
            {modal.type === 'rejeter' && 'Commentaire (obligatoire, min 10 caractères).'}
            {modal.type === 'modifier' && 'Commentaire (obligatoire, min 10 caractères).'}
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-2">
              Commentaire
            </label>
            <textarea
              value={commentaire}
              onChange={(e) => setCommentaire(e.target.value)}
              rows={4}
              placeholder="Détaillez votre commentaire..."
              className="at-input min-h-[100px] py-2"
            />
            {modalError && (
              <p className="mt-2 text-sm font-semibold text-red-600">{modalError}</p>
            )}
          </div>

          <div className="flex items-center justify-end gap-2">
            <Button variant="outline" onClick={closeModal}>
              Annuler
            </Button>
            <Button
              variant={modal.type === 'approuver' ? 'gradient' : 'primary'}
              onClick={submitAction}
            >
              {modal.type === 'approuver' ? 'Approuver' : modal.type === 'rejeter' ? 'Rejeter' : 'Envoyer'}
            </Button>
          </div>
        </div>
      </Modal>
    </motion.div>
  )
}
