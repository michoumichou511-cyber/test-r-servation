import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Download, FileText, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

import { documentsAPI, missionsAPI, reservationsAPI } from '../../../services/api'
import { Badge, Button, EmptyState, SkeletonCard } from '../../../components/UI'

function dlFromBlob(data, nom) {
  const blob = data instanceof Blob ? data : new Blob([data])
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = nom
  a.click()
  URL.revokeObjectURL(url)
}

function safeParseDA(v) {
  const s = String(v ?? '').replace(/[^0-9,.-]/g, '')
  if (!s) return 0
  return Number(s.replace(',', '.')) || 0
}

export default function Step4Recap({ missionId, onPrev }) {
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [mission, setMission] = useState(null)
  const [reservations, setReservations] = useState([])
  const [documents, setDocuments] = useState([])

  const [submitting, setSubmitting] = useState(false)

  const canSubmit = useMemo(() => {
    const s = mission?.statut ?? ''
    return s === 'brouillon' || s === 'rejete'
  }, [mission?.statut])

  const budgetEstimeReservations = useMemo(() => {
    return reservations.reduce((acc, r) => acc + safeParseDA(r?.montant_estime), 0)
  }, [reservations])

  const loadAll = useCallback(async () => {
    if (!missionId) return
    setLoading(true)
    setError('')
    try {
      const [mRes, rRes, dRes] = await Promise.all([
        missionsAPI.get(missionId),
        reservationsAPI.getByMission(missionId),
        documentsAPI.list(missionId),
      ])

      const m = mRes?.data?.data ?? mRes?.data ?? null
      const rRaw = rRes?.data?.data ?? rRes?.data?.reservations ?? rRes?.data
      const rList = Array.isArray(rRaw) ? rRaw : []
      const dBody = dRes?.data?.data ?? dRes?.data
      const dList = Array.isArray(dBody) ? dBody : []

      setMission(m)
      setReservations(rList)
      setDocuments(dList)
    } catch (err) {
      setMission(null)
      setReservations([])
      setDocuments([])
      setError(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          err?.message ||
          'Erreur chargement du récapitulatif'
      )
    } finally {
      setLoading(false)
    }
  }, [missionId])

  useEffect(() => {
    loadAll()
  }, [loadAll])

  const handleDownload = async (id, nomFichier) => {
    try {
      const res = await documentsAPI.telecharger(id)
      dlFromBlob(res.data, nomFichier)
      toast.success('Téléchargement lancé ✅')
    } catch (err) {
      toast.error(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          err?.message ||
          'Erreur téléchargement'
      )
    }
  }

  const saveDraft = () => {
    if (!missionId) return
    toast.success('Brouillon enregistré — vous pouvez reprendre plus tard')
    navigate('/missions')
  }

  const submit = async () => {
    if (!missionId || !canSubmit || submitting) return
    setSubmitting(true)
    setError('')
    try {
      await missionsAPI.soumettre(missionId)
      toast.success('Mission soumise ✅')
      navigate(`/missions/${missionId}`)
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        'Erreur lors de la soumission'
      setError(msg)
      toast.error(msg)
    } finally {
      setSubmitting(false)
    }
  }

  if (!missionId) {
    return (
      <div className="at-card-surface p-6">
        <div className="text-sm font-semibold text-red-700 mb-2">Mission introuvable</div>
        <Button variant="outline" onClick={onPrev}>
          ← Précédent
        </Button>
      </div>
    )
  }

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
      <div className="flex items-start justify-between gap-4 flex-wrap mb-5">
        <div>
          <h3 className="text-base font-semibold text-gray-700 dark:text-gray-100 mb-2">Récapitulatif</h3>
          <p className="text-sm text-gray-400 dark:text-gray-400">Vérifiez les informations avant soumission.</p>
        </div>
        {mission?.statut && <Badge status={mission.statut} label={`Statut: ${mission.statut}`} />}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 dark:bg-red-950/30 dark:border-red-900/50 rounded-2xl p-4 mb-4">
          <div className="text-sm font-semibold text-red-800 dark:text-red-200 mb-1">Erreur</div>
          <div className="text-sm text-red-700 dark:text-red-200/90">{error}</div>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : !mission ? (
        <EmptyState title="Mission introuvable" subtitle="Impossible de charger la mission." />
      ) : (
        <div className="space-y-4">
          <div className="at-card-surface p-4">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div className="min-w-0">
                <div className="font-mono text-gray-500 dark:text-gray-400 text-xs mb-1">
                  {mission.numero_unique ?? `OM-${missionId}`}
                </div>
                <div className="text-gray-900 dark:text-gray-100 font-bold text-lg mb-2 truncate">{mission.titre ?? 'Sans titre'}</div>
                <div className="text-sm text-gray-600 dark:text-gray-300 mb-1">
                  Destination: <span className="font-semibold">{mission.destination ?? '—'}</span>
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-300 mb-1">
                  Dates: <span className="font-semibold">{mission.dates?.depart ?? '—'} → {mission.dates?.retour ?? '—'}</span>
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-300">
                  Budget prévisionnel: <span className="font-semibold">{mission.budget_previsionnel?.toLocaleString?.('fr-FR') ?? mission.budget_previsionnel} DA</span>
                </div>
              </div>

              <div className="min-w-[220px]">
                <div className="bg-at-green/10 border border-at-green/20 rounded-xl p-3">
                  <div className="text-xs font-semibold text-at-green mb-1">Réservations (estimé)</div>
                  <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
                    {budgetEstimeReservations.toLocaleString('fr-FR')} DA
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-300 mt-1">{reservations.length} élément(s)</div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="at-card-surface p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="text-sm font-semibold text-gray-800 dark:text-gray-100">Réservations</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">{reservations.length} au total</div>
              </div>
              {reservations.length === 0 ? (
                <EmptyState title="Aucune réservation" subtitle="Ajoutez des réservations à l’étape précédente." />
              ) : (
                <div className="space-y-3">
                  {reservations.map((r, idx) => (
                    <motion.div
                      key={r.id ?? `${r.type}_${idx}`}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2, delay: idx * 0.02 }}
                      className="rounded-xl border border-[#EAECF0] p-3 dark:border-[#2A2D3E]"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge status="actif" label={r.type_label ?? r.type} />
                          </div>
                          <div className="text-sm text-gray-700 dark:text-gray-200">
                            Montant: <span className="font-semibold">{r.montant_estime ?? '—'}</span>
                          </div>
                          <div className="text-sm text-gray-700 dark:text-gray-200">
                            Prestataire: <span className="font-semibold">{r.prestataire?.nom ?? '—'}</span>
                          </div>
                          {r.notes && <div className="text-sm text-gray-700 dark:text-gray-200 mt-2">Notes: {r.notes}</div>}
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <Badge status={r.statut ?? 'brouillon'} label={r.statut_label ?? r.statut} />
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            <div className="at-card-surface p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="text-sm font-semibold text-gray-800 dark:text-gray-100">Documents</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">{documents.length} au total</div>
              </div>
              {documents.length === 0 ? (
                <EmptyState title="Aucun document" subtitle="Vous pourrez en ajouter à l’étape 3." icon={FileText} />
              ) : (
                <div className="space-y-3">
                  {documents.map((d, idx) => (
                    <motion.div
                      key={d.id ?? `${d.nom_fichier}_${idx}`}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2, delay: idx * 0.02 }}
                      className="rounded-xl border border-[#EAECF0] p-3 dark:border-[#2A2D3E]"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">{d.nom_fichier ?? '—'}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{d.type_document ?? 'document'}</div>
                        </div>
                        <Button size="sm" variant="outline" onClick={() => handleDownload(d.id, d.nom_fichier)}>
                          <Download size={14} /> Télécharger
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 flex-wrap">
            <Button variant="outline" onClick={onPrev} disabled={submitting}>
              ← Précédent
            </Button>
            <div className="flex flex-col sm:flex-row gap-2 sm:ml-auto">
              <Button variant="secondary" onClick={saveDraft} disabled={submitting}>
                Enregistrer brouillon
              </Button>
              <Button
                onClick={submit}
                disabled={!canSubmit || submitting}
                className={`min-w-[200px] transition-opacity ${submitting ? 'opacity-60 cursor-not-allowed' : ''}`}
              >
                {submitting ? <Loader2 size={16} className="animate-spin" /> : null}
                Soumettre la mission
              </Button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  )
}
