import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, Info } from 'lucide-react'

import { Button, Input } from '../../../components/UI'

const TYPE_MISSION_OPTIONS = [
  { value: '', label: 'Sélectionner…' },
  { value: 'formation', label: 'Formation' },
  { value: 'conference', label: 'Conférence' },
  { value: 'reunion', label: 'Réunion' },
  { value: 'inspection', label: 'Inspection' },
  { value: 'audit', label: 'Audit' },
  { value: 'autre', label: 'Autre' },
]

const PRIORITE_OPTIONS = [
  { value: '', label: 'Priorité (optionnel)' },
  { value: 'normale', label: 'Normale' },
  { value: 'urgente', label: 'Urgente' },
  { value: 'tres_urgente', label: 'Très urgente' },
]

function validateForm(form) {
  const requiredFields = [
    ['titre', 'Titre requis'],
    ['objet_mission', 'Objet de la mission requis'],
    ['destination_ville', 'Ville de destination requise'],
    ['destination_pays', 'Pays de destination requis'],
    ['date_depart', 'Date de départ requise'],
    ['date_retour', 'Date de retour requise'],
    ['type_mission', 'Type de mission requis'],
  ]

  for (const [key, msg] of requiredFields) {
    if (!String(form?.[key] ?? '').trim()) return msg
  }

  if (String(form.budget_previsionnel ?? '').trim()) {
    const n = Number(form.budget_previsionnel)
    if (Number.isNaN(n) || n < 0) return 'Budget prévisionnel invalide'
  }

  const depart = form.date_depart ? new Date(form.date_depart) : null
  const retour = form.date_retour ? new Date(form.date_retour) : null
  if (depart && retour && retour <= depart) return 'La date de retour doit être après la date de départ'

  return ''
}

export default function Step1Informations({ onNext, data, missionId, loading, error }) {
  const initial = useMemo(
    () => ({
      titre: data?.titre ?? '',
      objet_mission: data?.objet_mission ?? '',
      destination_ville: data?.destination_ville ?? '',
      destination_pays: data?.destination_pays ?? '',
      date_depart: data?.date_depart ?? '',
      date_retour: data?.date_retour ?? '',
      type_mission: data?.type_mission ?? '',
      priorite: data?.priorite ?? '',
      budget_previsionnel: data?.budget_previsionnel ?? '',
      description: data?.description ?? '',
    }),
    [data]
  )

  const [form, setForm] = useState(initial)
  const [localError, setLocalError] = useState('')

  // Synchronise le formulaire quand les données mission (props) changent
  /* eslint-disable react-hooks/set-state-in-effect -- reset contrôlé par data/missionId */
  useEffect(() => {
    setForm(initial)
    setLocalError('')
  }, [initial])
  /* eslint-enable react-hooks/set-state-in-effect */

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (loading) return

    const msg = validateForm(form)
    if (msg) {
      setLocalError(msg)
      return
    }

    setLocalError('')

    const payload = {
      titre: form.titre.trim(),
      objet_mission: form.objet_mission.trim(),
      destination_ville: form.destination_ville.trim(),
      destination_pays: form.destination_pays.trim(),
      date_depart: form.date_depart,
      date_retour: form.date_retour,
      type_mission: form.type_mission,
      ...(form.priorite ? { priorite: form.priorite } : {}),
      ...(String(form.budget_previsionnel ?? '').trim()
        ? { budget_previsionnel: Number(form.budget_previsionnel) }
        : {}),
      ...(String(form.description ?? '').trim()
        ? { description: form.description.trim() }
        : {}),
    }

    await onNext(payload)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <div className="flex items-start justify-between gap-4 mb-5 flex-wrap">
        <div>
          <h3 className="text-base font-semibold text-gray-700 dark:text-gray-100 mb-2">Informations générales</h3>
          <p className="text-sm text-gray-400 dark:text-gray-400">
            {missionId ? 'Mise à jour de la mission (brouillon)' : 'Créez votre mission (brouillon)'}.
          </p>
        </div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-at-green/10 border border-at-green/20 text-at-green text-xs font-semibold">
          <Info size={14} /> Étape 1/4
        </div>
      </div>

      {(error || localError) && (
        <div className="bg-red-50 border border-red-200 dark:bg-red-950/30 dark:border-red-900/50 rounded-2xl p-4 mb-4">
          <div className="text-sm text-red-800 dark:text-red-200 font-semibold mb-1">Erreur</div>
          <div className="text-sm text-red-700 dark:text-red-200/90">{localError || error}</div>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <Input
              label="Titre"
              value={form.titre}
              onChange={(e) => setForm((f) => ({ ...f, titre: e.target.value }))}
              placeholder="Ex: OM-2026 — Formation Laravel"
            />
          </div>

          <div className="md:col-span-2">
            <Input
              label="Objet de la mission"
              value={form.objet_mission}
              onChange={(e) => setForm((f) => ({ ...f, objet_mission: e.target.value }))}
              placeholder="Objectif / contenu"
            />
          </div>

          <div>
            <Input
              label="Ville de destination"
              value={form.destination_ville}
              onChange={(e) => setForm((f) => ({ ...f, destination_ville: e.target.value }))}
              placeholder="Alger"
            />
          </div>
          <div>
            <Input
              label="Pays de destination"
              value={form.destination_pays}
              onChange={(e) => setForm((f) => ({ ...f, destination_pays: e.target.value }))}
              placeholder="Algérie"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">Date de départ</label>
            <input
              type="date"
              value={form.date_depart}
              onChange={(e) => setForm((f) => ({ ...f, date_depart: e.target.value }))}
              className="w-full px-3 py-3 rounded-lg border border-gray-200 bg-white text-sm text-gray-800 dark:bg-[#1E2235] dark:text-[#E8EAF0] dark:border-[#2A2D3E]
                         focus:outline-none focus:ring-1 focus:ring-at-green/30 focus:border-at-green"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">Date de retour</label>
            <input
              type="date"
              value={form.date_retour}
              onChange={(e) => setForm((f) => ({ ...f, date_retour: e.target.value }))}
              className="w-full px-3 py-3 rounded-lg border border-gray-200 bg-white text-sm text-gray-800 dark:bg-[#1E2235] dark:text-[#E8EAF0] dark:border-[#2A2D3E]
                         focus:outline-none focus:ring-1 focus:ring-at-green/30 focus:border-at-green"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">Type de mission</label>
            <select
              value={form.type_mission}
              onChange={(e) => setForm((f) => ({ ...f, type_mission: e.target.value }))}
              className="w-full px-3 py-3 rounded-lg border border-gray-200 bg-white text-sm text-gray-800 dark:bg-[#1E2235] dark:text-[#E8EAF0] dark:border-[#2A2D3E]
                         focus:outline-none focus:ring-1 focus:ring-at-green/30 focus:border-at-green"
            >
              {TYPE_MISSION_OPTIONS.map((o) => (
                <option key={o.value || 'x'} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">Priorité (optionnel)</label>
            <select
              value={form.priorite}
              onChange={(e) => setForm((f) => ({ ...f, priorite: e.target.value }))}
              className="w-full px-3 py-3 rounded-lg border border-gray-200 bg-white text-sm text-gray-800 dark:bg-[#1E2235] dark:text-[#E8EAF0] dark:border-[#2A2D3E]
                         focus:outline-none focus:ring-1 focus:ring-at-green/30 focus:border-at-green"
            >
              {PRIORITE_OPTIONS.map((o) => (
                <option key={o.value || 'y'} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Input
              label="Budget prévisionnel (DA)"
              type="number"
              value={form.budget_previsionnel}
              onChange={(e) => setForm((f) => ({ ...f, budget_previsionnel: e.target.value }))}
              placeholder="Ex: 250000"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">Description (optionnel)</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Détails complémentaires"
              rows={4}
              className="w-full px-3 py-3 rounded-lg border border-gray-200 bg-white text-sm text-gray-800 dark:bg-[#1E2235] dark:text-[#E8EAF0] dark:border-[#2A2D3E]
                         focus:outline-none focus:ring-1 focus:ring-at-green/30 focus:border-at-green resize-none"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <Button type="submit" loading={loading} disabled={loading} className="min-w-[180px]">
            {loading ? 'Enregistrement...' : 'Suivant →'}
          </Button>
        </div>
      </form>
    </motion.div>
  )
}
