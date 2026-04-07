import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { FileText, History, FileArchive, CalendarDays, DollarSign, RotateCcw, Download, Pencil, X } from 'lucide-react'

import { missionsAPI, reservationsAPI, documentsAPI } from '../../services/api'
import { Badge, Button, EmptyState, SkeletonCard, SkeletonLine } from '../../components/UI'
import PageHeader from '../../components/Common/PageHeader'
import Modal from '../../components/UI/Modal'
import toast from 'react-hot-toast'

const TABS = [
  { key: 'informations', label: 'Informations' },
  { key: 'reservations', label: 'Réservations' },
  { key: 'documents', label: 'Documents' },
  { key: 'historique', label: 'Historique' },
]

function toISODate(frDate) {
  // frDate: "d/m/Y"
  if (typeof frDate !== 'string') return ''
  const m = frDate.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (!m) return ''
  const dd = String(m[1]).padStart(2, '0')
  const mm = String(m[2]).padStart(2, '0')
  const yyyy = m[3]
  return `${yyyy}-${mm}-${dd}`
}

function parseDestination(destination) {
  // store() backend: destination_ville + ', ' + destination_pays
  if (typeof destination !== 'string') return { ville: '', pays: '' }
  const parts = destination.split(',').map(s => s.trim()).filter(Boolean)
  if (parts.length === 0) return { ville: '', pays: '' }
  if (parts.length === 1) return { ville: parts[0], pays: '' }
  const ville = parts[0]
  const pays = parts.slice(1).join(', ')
  return { ville, pays }
}

function formatDZD(v) {
  const n = typeof v === 'number' ? v : Number(v ?? 0)
  if (Number.isNaN(n)) return '0 DZD'
  return `${n.toLocaleString('fr-FR')} DZD`
}

export default function MissionDetail() {
  const navigate = useNavigate()
  const { id } = useParams()
  const missionId = id

  const [mission, setMission] = useState(null)
  const [loadingMission, setLoadingMission] = useState(true)
  const [errorMission, setErrorMission] = useState('')

  const [activeTab, setActiveTab] = useState('informations')

  const [loadingReservations, setLoadingReservations] = useState(false)
  const [errorReservations, setErrorReservations] = useState('')
  const [reservations, setReservations] = useState([])

  const [loadingDocuments, setLoadingDocuments] = useState(false)
  const [errorDocuments, setErrorDocuments] = useState('')
  const [documents, setDocuments] = useState([])

  const [loadingHistorique, setLoadingHistorique] = useState(false)
  const [errorHistorique, setErrorHistorique] = useState('')
  const [historique, setHistorique] = useState([])

  const [showBonsModal, setShowBonsModal] = useState(false)
  const [loadingBons, setLoadingBons] = useState(false)
  const [bons, setBons] = useState([])

  const [editMode, setEditMode] = useState(false)
  const [draft, setDraft] = useState({
    titre: '',
    objectif: '',
    destination_ville: '',
    destination_pays: '',
    date_depart: '',
    date_retour: '',
    type_mission: '',
    priorite: '',
    budget_previsionnel: '',
    description: '',
  })

  const statut = mission?.statut ?? ''

  const isBrouillon = statut === 'brouillon'
  const isSoumis = statut === 'soumis'
  const isApprouve = statut === 'approuve'

  const chargerMission = useCallback(async () => {
    setLoadingMission(true)
    setErrorMission('')
    try {
      const res = await missionsAPI.get(missionId)
      const data = res.data?.data ?? null
      setMission(data)
    } catch (err) {
      setMission(null)
      setErrorMission(
        err?.response?.data?.message || err?.message || 'Erreur chargement de la mission'
      )
    } finally {
      setLoadingMission(false)
    }
  }, [missionId])

  const chargerReservations = useCallback(async () => {
    setLoadingReservations(true)
    setErrorReservations('')
    try {
      const res = await reservationsAPI.getByMission(missionId)
      const raw = res?.data?.data ?? res?.data?.reservations ?? res?.data
      const list = Array.isArray(raw) ? raw : []
      setReservations(list)
    } catch (err) {
      setReservations([])
      setErrorReservations(
        err?.response?.data?.message || err?.message || 'Erreur chargement des réservations'
      )
    } finally {
      setLoadingReservations(false)
    }
  }, [missionId])

  const chargerDocuments = useCallback(async () => {
    setLoadingDocuments(true)
    setErrorDocuments('')
    try {
      const res = await documentsAPI.list(missionId)
      const body = res?.data?.data ?? res?.data
      const list = Array.isArray(body) ? body : []
      setDocuments(list)
    } catch (err) {
      setDocuments([])
      setErrorDocuments(
        err?.response?.data?.message || err?.message || 'Erreur chargement des documents'
      )
    } finally {
      setLoadingDocuments(false)
    }
  }, [missionId])

  const chargerHistorique = useCallback(async () => {
    setLoadingHistorique(true)
    setErrorHistorique('')
    try {
      const res = await missionsAPI.historique(missionId)
      const raw = res?.data?.data ?? res?.data
      const list = Array.isArray(raw) ? raw : []
      setHistorique(list)
    } catch (err) {
      setHistorique([])
      setErrorHistorique(
        err?.response?.data?.message || err?.message || 'Erreur chargement de l’historique'
      )
    } finally {
      setLoadingHistorique(false)
    }
  }, [missionId])

  useEffect(() => {
    chargerMission()
  }, [chargerMission])

  // Pré-remplit le formulaire d'édition dès que la mission est chargée
  useEffect(() => {
    if (!mission) return
    const dest = parseDestination(mission.destination)
    const dates = mission.dates ?? {}
    setDraft({
      titre: mission.titre ?? '',
      objectif: mission.objet_mission ?? '',
      destination_ville: dest.ville,
      destination_pays: dest.pays,
      date_depart: toISODate(dates.depart),
      date_retour: toISODate(dates.retour),
      type_mission: mission.type_mission ?? '',
      priorite: mission.priorite ?? '',
      budget_previsionnel: mission.budget_previsionnel ?? '',
      description: mission.description ?? '',
    })
  }, [mission])

  // Charge les données d'onglets au clic
  useEffect(() => {
    if (!missionId) return
    if (activeTab === 'reservations' && reservations.length === 0 && !loadingReservations) {
      chargerReservations()
    }
    if (activeTab === 'documents' && documents.length === 0 && !loadingDocuments) {
      chargerDocuments()
    }
    if (activeTab === 'historique' && historique.length === 0 && !loadingHistorique) {
      chargerHistorique()
    }
  }, [
    activeTab,
    chargerReservations,
    chargerDocuments,
    chargerHistorique,
    historique.length,
    loadingDocuments,
    loadingHistorique,
    loadingReservations,
    documents.length,
    reservations.length,
    missionId,
  ])

  const soumettreMission = async () => {
    try {
      const res = await missionsAPI.soumettre(missionId)
      const next = res.data?.data ?? null
      if (next) setMission(next)
      toast.success('Mission soumise ✅')
      setEditMode(false)
      setActiveTab('informations')
    } catch (err) {
      toast.error(
        err?.response?.data?.message || err?.message || 'Erreur lors de la soumission'
      )
    }
  }

  const annulerMission = async () => {
    try {
      await missionsAPI.annuler(missionId)
      await chargerMission()
      toast.success('Mission annulée ✅')
    } catch (err) {
      toast.error(
        err?.response?.data?.message || err?.message || 'Erreur lors de l’annulation'
      )
    }
  }

  const telechargerPDF = async () => {
    try {
      const res = await missionsAPI.exportOrdreMissionPdf(missionId)
      // res.data est un Blob car responseType=blob
      // On utilise directement l'API utilitaire côté service si besoin plus tard.
      const blob = res.data
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `ordre_mission_${mission?.numero_unique ?? missionId}.pdf`
      a.click()
      window.URL.revokeObjectURL(url)
      toast.success('PDF téléchargé ✅')
    } catch (err) {
      toast.error(
        err?.response?.data?.message || err?.message || 'Erreur téléchargement PDF'
      )
    }
  }

  const ouvrirBonsModal = async () => {
    setShowBonsModal(true)
    setLoadingBons(true)
    setBons([])
    try {
      const res = await missionsAPI.bonsCommande(missionId)
      // ApiResponse::success([ 'bons' => $bons ]) => res.data.data.bons
      const d = res.data?.data ?? {}
      const list = Array.isArray(d.bons) ? d.bons : []
      setBons(list)
    } catch (err) {
      toast.error(
        err?.response?.data?.message || err?.message || 'Erreur chargement bons de commande'
      )
    } finally {
      setLoadingBons(false)
    }
  }

  const sauvegarderModification = async () => {
    // On mappe vers les champs attendus par MissionUpdateRequest
    const payload = {
      titre: draft.titre || undefined,
      objet_mission: draft.objectif || undefined,
      destination_ville: draft.destination_ville || undefined,
      destination_pays: draft.destination_pays || undefined,
      date_depart: draft.date_depart || undefined,
      date_retour: draft.date_retour || undefined,
      type_mission: draft.type_mission || undefined,
      priorite: draft.priorite || undefined,
      budget_previsionnel:
        draft.budget_previsionnel === '' ? undefined : Number(draft.budget_previsionnel),
      description: draft.description || undefined,
    }

    try {
      const res = await missionsAPI.update(missionId, payload)
      const next = res.data?.data ?? null
      if (next) setMission(next)
      toast.success('Mission modifiée ✅')
      setEditMode(false)
    } catch (err) {
      toast.error(
        err?.response?.data?.message || err?.message || 'Erreur sauvegarde modification'
      )
    }
  }

  const téléchargeDoc = async (doc) => {
    try {
      const res = await documentsAPI.telecharger(doc.id)
      const blob = res.data
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = doc.nom_fichier ?? `document_${doc.id}`
      a.click()
      window.URL.revokeObjectURL(url)
      toast.success('Téléchargement lancé ✅')
    } catch (err) {
      toast.error(
        err?.response?.data?.message || err?.message || 'Erreur téléchargement document'
      )
    }
  }

  const reservationsParType = useMemo(() => {
    const billets = reservations.filter(r => r.type === 'billet')
    const heb = reservations.filter(r => r.type === 'hebergement')
    const rest = reservations.filter(r => r.type === 'restauration')
    return { billets, heb, rest }
  }, [reservations])

  if (loadingMission) {
    return (
      <div>
        <PageHeader title="Détails mission" subtitle="Chargement en cours..." backTo="/missions" />
        <div className="space-y-4">
          {[0, 1, 2].map(i => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    )
  }

  if (errorMission || !mission) {
    return (
      <div>
        <PageHeader title="Détails mission" subtitle="Impossible de charger la mission" backTo="/missions" />
        <EmptyState
          icon={FileText}
          title="Mission indisponible"
          subtitle={errorMission || 'La mission n’existe pas ou vous n’y avez pas accès.'}
          actionLabel="Retour"
          onAction={() => navigate('/missions')}
        />
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        title={
          mission.titre
            ? `${mission.titre}`
            : `Mission ${mission.numero_unique ?? mission.id ?? ''}`
        }
        subtitle={`Référence : ${mission.numero_unique ?? '—'}`}
        backTo="/missions"
        actions={
          <div className="flex items-center gap-2">
            <Badge status={mission.statut} />
          </div>
        }
      />

      {/* Actions selon statut */}
      <div className="at-card-surface mb-6 p-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="inline-flex items-center gap-2 text-sm text-gray-700">
              <CalendarDays size={16} className="text-gray-400" />
              <span>
                {mission.dates?.depart ?? '—'} → {mission.dates?.retour ?? '—'}
              </span>
            </div>
            <div className="inline-flex items-center gap-2 text-sm text-gray-700">
              <DollarSign size={16} className="text-gray-400" />
              <span>{formatDZD(mission.budget_previsionnel)}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {isBrouillon && (
              <>
                <Button variant="outline" size="sm" onClick={() => setEditMode(v => !v)}>
                  <Pencil size={16} /> Modifier
                </Button>
                <Button size="sm" onClick={soumettreMission}>
                  <FileText size={16} /> Soumettre
                </Button>
              </>
            )}
            {isSoumis && (
              <Button variant="danger" size="sm" onClick={annulerMission}>
                <RotateCcw size={16} /> Annuler
              </Button>
            )}
            {isApprouve && (
              <>
                <Button variant="outline" size="sm" onClick={telechargerPDF}>
                  <Download size={16} /> Télécharger PDF
                </Button>
                <Button size="sm" onClick={ouvrirBonsModal}>
                  <FileArchive size={16} /> Bons de commande
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="at-card-surface mb-4 p-2">
        <div className="flex items-center gap-2 overflow-x-auto px-1">
          {TABS.map((t) => {
            const active = activeTab === t.key
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => setActiveTab(t.key)}
                className={[
                  'relative px-3 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all',
                  active
                    ? 'bg-[#E6F7EE] text-[#00A650] dark:bg-[#00A650]/15 dark:text-[#4ade80]'
                    : 'border border-transparent bg-transparent text-[#5A6070] hover:bg-[#F8F9FC] dark:text-[#9AA0AE] dark:hover:bg-[#252840]',
                  active ? 'ring-2 ring-[#00A650]/30' : '',
                ].join(' ')}
                aria-current={active ? 'page' : undefined}
              >
                {t.label}
              </button>
            )
          })}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'informations' && (
          <motion.div
            key="infos"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
          >
            {!editMode && (
              <div className="at-card-surface p-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InfoRow label="Destination" value={mission.destination ?? '—'} />
                  <InfoRow
                    label="Dates"
                    value={`${mission.dates?.depart ?? '—'} → ${mission.dates?.retour ?? '—'}`}
                  />
                  <InfoRow label="Type" value={mission.type_mission ?? '—'} />
                  <InfoRow label="Priorité" value={mission.priorite ?? '—'} />
                  <InfoRow
                    label="Budget"
                    value={formatDZD(mission.budget_previsionnel)}
                  />
                  <InfoRow
                    label="Objectif"
                    value={mission.objet_mission ?? mission.description ?? '—'}
                  />
                </div>
              </div>
            )}

            {editMode && (
              <div className="at-card-surface p-5">
                <div className="flex items-start justify-between gap-3 mb-5">
                  <div>
                    <h3 className="text-base font-semibold text-gray-800">
                      Modification de la mission
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      Champs requis / optionnels selon la configuration backend.
                    </p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setEditMode(false)}>
                    <X size={16} /> Fermer
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <label className="block text-xs font-semibold text-gray-500 mb-2">
                    Titre
                    <input
                      value={draft.titre}
                      onChange={(e) => setDraft(d => ({ ...d, titre: e.target.value }))}
                      className="at-input mt-2"
                    />
                  </label>

                  <label className="block text-xs font-semibold text-gray-500 mb-2">
                    Objectif
                    <input
                      value={draft.objectif}
                      onChange={(e) => setDraft(d => ({ ...d, objectif: e.target.value }))}
                      className="at-input mt-2"
                    />
                  </label>

                  <label className="block text-xs font-semibold text-gray-500 mb-2">
                    Destination (Ville)
                    <input
                      value={draft.destination_ville}
                      onChange={(e) => setDraft(d => ({ ...d, destination_ville: e.target.value }))}
                      className="at-input mt-2"
                    />
                  </label>

                  <label className="block text-xs font-semibold text-gray-500 mb-2">
                    Destination (Pays)
                    <input
                      value={draft.destination_pays}
                      onChange={(e) => setDraft(d => ({ ...d, destination_pays: e.target.value }))}
                      className="at-input mt-2"
                    />
                  </label>

                  <label className="block text-xs font-semibold text-gray-500 mb-2">
                    Date départ
                    <input
                      type="date"
                      value={draft.date_depart}
                      onChange={(e) => setDraft(d => ({ ...d, date_depart: e.target.value }))}
                      className="at-input mt-2"
                    />
                  </label>

                  <label className="block text-xs font-semibold text-gray-500 mb-2">
                    Date retour
                    <input
                      type="date"
                      value={draft.date_retour}
                      onChange={(e) => setDraft(d => ({ ...d, date_retour: e.target.value }))}
                      className="at-input mt-2"
                    />
                  </label>

                  <label className="block text-xs font-semibold text-gray-500 mb-2">
                    Type mission
                    <select
                      value={draft.type_mission}
                      onChange={(e) => setDraft(d => ({ ...d, type_mission: e.target.value }))}
                      className="at-input mt-2"
                    >
                      {['information', 'conference', 'reunion', 'inspection', 'audit', 'autre'].map(opt => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="block text-xs font-semibold text-gray-500 mb-2">
                    Priorité
                    <select
                      value={draft.priorite}
                      onChange={(e) => setDraft(d => ({ ...d, priorite: e.target.value }))}
                      className="at-input mt-2"
                    >
                      {['normale', 'urgente', 'tres_urgente'].map(opt => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="block text-xs font-semibold text-gray-500 mb-2">
                    Budget prévisionnel (DZD)
                    <input
                      type="number"
                      value={draft.budget_previsionnel}
                      onChange={(e) => setDraft(d => ({ ...d, budget_previsionnel: e.target.value }))}
                      className="at-input mt-2"
                    />
                  </label>

                  <label className="block text-xs font-semibold text-gray-500 mb-2 md:col-span-2">
                    Description (optionnel)
                    <input
                      value={draft.description}
                      onChange={(e) => setDraft(d => ({ ...d, description: e.target.value }))}
                      className="at-input mt-2"
                    />
                  </label>
                </div>

                <div className="flex items-center gap-2 mt-6">
                  <Button onClick={sauvegarderModification}>
                    <Pencil size={16} /> Sauvegarder
                  </Button>
                  <Button variant="outline" onClick={() => setEditMode(false)}>
                    Annuler
                  </Button>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'reservations' && (
          <motion.div
            key="reservations"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
            className="space-y-4"
          >
            {loadingReservations && (
              <div className="space-y-3">
                {[0, 1, 2].map(i => (
                  <SkeletonCard key={i} />
                ))}
              </div>
            )}

            {!loadingReservations && errorReservations && (
              <EmptyState
                icon={FileText}
                title="Erreur réservations"
                subtitle={errorReservations}
                actionLabel="Réessayer"
                onAction={chargerReservations}
              />
            )}

            {!loadingReservations && !errorReservations && reservations.length === 0 && (
              <EmptyState
                icon={FileText}
                title="Aucune réservation"
                subtitle="Cette mission ne contient pas encore de billets, hébergements ou restaurations."
                actionLabel="Retour"
                onAction={() => setActiveTab('informations')}
              />
            )}

            {!loadingReservations && !errorReservations && reservations.length > 0 && (
              <>
                <ReservationSection
                  title="Billets"
                  items={reservationsParType.billets}
                  renderItem={(r) => (
                    <div className="space-y-2">
                      <div className="font-semibold text-gray-800">
                        {r?.billet?.compagnie ? `${r.billet.compagnie}` : 'Billet'}
                      </div>
                      <div className="text-sm text-gray-600">
                        Vol {r?.billet?.numero_vol ?? '—'} : {r?.billet?.aeroport_depart ?? '—'} →{' '}
                        {r?.billet?.aeroport_arrivee ?? '—'}
                      </div>
                      <div className="text-sm text-gray-600">
                        {r?.billet?.date_vol ?? '—'} | {r?.billet?.heure_depart ?? '—'} → {r?.billet?.heure_arrivee ?? '—'}
                      </div>
                      <div className="text-sm text-gray-700 font-semibold">
                        {r?.billet?.prix ?? '0'} (prix)
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge status={r?.statut} />
                        <span className="text-xs text-gray-500">{r?.billet?.classe_label ?? ''}</span>
                      </div>
                    </div>
                  )}
                />

                <ReservationSection
                  title="Hébergements"
                  items={reservationsParType.heb}
                  renderItem={(r) => (
                    <div className="space-y-2">
                      <div className="font-semibold text-gray-800">
                        {r?.hebergement?.hotel_nom ?? 'Hébergement'}
                      </div>
                      <div className="text-sm text-gray-600">
                        {r?.hebergement?.localisation ?? '—'}
                      </div>
                      <div className="text-sm text-gray-600">
                        Check-in {r?.hebergement?.date_checkin ?? '—'} → Check-out {r?.hebergement?.date_checkout ?? '—'}
                      </div>
                      <div className="text-sm text-gray-700 font-semibold">
                        {r?.hebergement?.prix_total ?? '0'} (total)
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge status={r?.statut} />
                        <span className="text-xs text-gray-500">{r?.hebergement?.type_chambre_label ?? ''}</span>
                      </div>
                    </div>
                  )}
                />

                <ReservationSection
                  title="Restaurations"
                  items={reservationsParType.rest}
                  renderItem={(r) => (
                    <div className="space-y-2">
                      <div className="font-semibold text-gray-800">
                        {r?.restauration?.prestataire_nom ?? 'Restauration'}
                      </div>
                      <div className="text-sm text-gray-600">
                        Repas : {r?.restauration?.type_repas_label ?? '—'} | Lieu : {r?.restauration?.lieu ?? '—'}
                      </div>
                      <div className="text-sm text-gray-600">
                        Date : {r?.restauration?.date_repas ?? '—'} | Personnes : {r?.restauration?.nombre_personnes ?? '—'}
                      </div>
                      <div className="text-sm text-gray-700 font-semibold">
                        {r?.restauration?.prix_total ?? '0'} (total)
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge status={r?.statut} />
                      </div>
                    </div>
                  )}
                />
              </>
            )}
          </motion.div>
        )}

        {activeTab === 'documents' && (
          <motion.div
            key="documents"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
          >
            {loadingDocuments && (
              <div className="space-y-3">
                {[0, 1, 2].map(i => (
                  <SkeletonCard key={i} />
                ))}
              </div>
            )}

            {!loadingDocuments && errorDocuments && (
              <EmptyState
                icon={FileText}
                title="Erreur documents"
                subtitle={errorDocuments}
                actionLabel="Réessayer"
                onAction={chargerDocuments}
              />
            )}

            {!loadingDocuments && !errorDocuments && documents.length === 0 && (
              <EmptyState
                icon={FileArchive}
                title="Aucun document"
                subtitle="Aucun document n’a encore été uploadé pour cette mission."
                actionLabel="Retour"
                onAction={() => setActiveTab('informations')}
              />
            )}

            {!loadingDocuments && !errorDocuments && documents.length > 0 && (
              <div className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <AnimatePresence initial={false}>
                    {documents.map((doc, index) => (
                      <motion.div
                        key={doc.id ?? index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2, delay: index * 0.05 }}
                        className="at-card-surface p-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="text-sm font-semibold text-gray-800 truncate">
                              {doc.nom_fichier ?? 'document'}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              {doc.type_document ?? '—'} • {doc.taille ? `${doc.taille}` : ''}
                            </div>
                            <div className="text-xs text-gray-400 mt-2">
                              {doc.uploaded_by?.nom_complet
                                ? `Ajouté par ${doc.uploaded_by.nom_complet}`
                                : '—'}
                            </div>
                          </div>
                          <Badge status="pending" />
                        </div>

                        <div className="mt-4">
                          <Button
                            size="sm"
                            onClick={() => téléchargeDoc(doc)}
                          >
                            <Download size={16} /> Télécharger
                          </Button>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'historique' && (
          <motion.div
            key="historique"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
          >
            {loadingHistorique && (
              <div className="space-y-3">
                {[0, 1, 2].map(i => (
                  <SkeletonCard key={i} />
                ))}
              </div>
            )}

            {!loadingHistorique && errorHistorique && (
              <EmptyState
                icon={History}
                title="Erreur historique"
                subtitle={errorHistorique}
                actionLabel="Réessayer"
                onAction={chargerHistorique}
              />
            )}

            {!loadingHistorique && !errorHistorique && historique.length === 0 && (
              <EmptyState
                icon={History}
                title="Aucun historique"
                subtitle="Aucune action enregistrée pour cette mission."
                actionLabel="Retour"
                onAction={() => setActiveTab('informations')}
              />
            )}

            {!loadingHistorique && !errorHistorique && historique.length > 0 && (
              <div className="at-card-surface p-5">
                <div className="space-y-3">
                  {historique.map((t, index) => (
                    <motion.div
                      key={`${t.date ?? index}_${index}`}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2, delay: index * 0.05 }}
                      className="rounded-xl border border-[#EAECF0] bg-[#F8F9FC] p-3 dark:border-[#2A2D3E] dark:bg-[#252840]"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-gray-800 truncate">
                            {t.action ?? 'Action'}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {t.date ?? '—'} • {t.par ?? 'Système'}
                          </div>
                          {t.description && (
                            <div className="text-sm text-gray-600 mt-2">
                              {t.description}
                            </div>
                          )}
                          {t.commentaire && (
                            <div className="text-sm text-gray-600 mt-2">
                              <span className="font-semibold">Commentaire :</span> {t.commentaire}
                            </div>
                          )}
                        </div>
                        <div className="flex-shrink-0">
                          <Badge status={t.couleur === 'blue' ? 'approuve' : 'en_validation'} />
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal Bons de commande */}
      <Modal
        isOpen={showBonsModal}
        onClose={() => setShowBonsModal(false)}
        title="Bons de commande"
        size="lg"
      >
        {loadingBons && (
          <div className="space-y-3">
            {[0, 1, 2].map(i => <SkeletonCard key={i} />)}
          </div>
        )}

        {!loadingBons && bons.length === 0 && (
          <EmptyState
            icon={FileArchive}
            title="Aucun bon"
            subtitle="Aucun bon de commande n’a été généré pour cette mission."
          />
        )}

        {!loadingBons && bons.length > 0 && (
          <div className="space-y-3">
            {bons.map((bon, index) => (
              <div key={bon.id ?? index} className="at-card-surface rounded-xl p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-semibold text-gray-800">
                      {bon.numero ?? 'BC'}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {bon.type ?? '—'} • {formatDZD(bon.montant_total)}
                    </div>
                    <div className="text-xs text-gray-400 mt-2">
                      Statut : {bon.statut ?? '—'}
                    </div>
                  </div>
                  <Badge status="pending" />
                </div>

                {bon.pdf_path && (
                  <div className="mt-4">
                    <a
                      className="inline-flex items-center gap-2 text-sm font-semibold text-at-green hover:underline"
                      href={bon.pdf_path.startsWith('http') ? bon.pdf_path : `/storage/${bon.pdf_path}` }
                      target="_blank"
                      rel="noreferrer"
                    >
                      <Download size={16} /> Ouvrir PDF
                    </a>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Modal>
    </div>
  )
}

function InfoRow({ label, value }) {
  return (
    <div className="rounded-[20px] border border-[#EAECF0] bg-[#F8F9FC] p-4 dark:border-[#2A2D3E] dark:bg-[#252840]">
      <div className="text-xs font-semibold text-gray-500">{label}</div>
      <div className="text-sm font-semibold text-gray-800 mt-1 break-words">{value ?? '—'}</div>
    </div>
  )
}

function ReservationSection({ title, items, renderItem }) {
  if (!items || items.length === 0) return null
  return (
    <div className="at-card-surface p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
        <div className="text-xs text-gray-500">{items.length} élément(s)</div>
      </div>
      <div className="space-y-3">
        <AnimatePresence initial={false}>
          {items.map((r, index) => (
            <motion.div
              key={r.id ?? index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2, delay: index * 0.05 }}
              className="at-card-surface rounded-xl p-4"
            >
              {renderItem(r)}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}

