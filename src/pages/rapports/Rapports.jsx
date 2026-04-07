/**
 * Exports : aucun appel API au montage — uniquement au clic sur les boutons
 * (évite le throttle 429 sur les routes /export).
 */
import { useCallback, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Download,
  FileText,
  FileSpreadsheet,
  FileArchive,
  RotateCcw,
  Filter,
} from 'lucide-react'
import toast from 'react-hot-toast'

import PageHeader from '../../components/Common/PageHeader'
import { Badge, Button, Input } from '../../components/UI'
import { exportAPI } from '../../services/api'

function dlFromBlob(data, nom) {
  const blob = data instanceof Blob ? data : new Blob([data])
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = nom
  a.click()
  URL.revokeObjectURL(url)
}

function formatISODate(d) {
  if (!d) return ''
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  return `${d.getFullYear()}-${mm}-${dd}`
}

function getDateRangeFromMonth(year, monthIndex1Based) {
  // monthIndex1Based: 1..12
  if (!year || !monthIndex1Based) return {}
  const m = Number(monthIndex1Based)
  if (Number.isNaN(m) || m < 1 || m > 12) return {}

  const start = new Date(Number(year), m - 1, 1)
  const end = new Date(Number(year), m, 0) // dernier jour du mois

  return {
    date_debut: formatISODate(start),
    date_fin: formatISODate(end),
  }
}

const TYPE_MISSION_OPTIONS = [
  { value: 'formation', label: 'Formation' },
  { value: 'conference', label: 'Conférence' },
  { value: 'reunion', label: 'Réunion' },
  { value: 'inspection', label: 'Inspection' },
  { value: 'audit', label: 'Audit' },
  { value: 'autre', label: 'Autre' },
]

const STATUT_OPTIONS = [
  { value: 'brouillon', label: 'Brouillon' },
  { value: 'soumis', label: 'Soumis' },
  { value: 'en_validation', label: 'En validation' },
  { value: 'approuve', label: 'Approuvé' },
  { value: 'rejete', label: 'Rejeté' },
  { value: 'annule', label: 'Annulé' },
  { value: 'termine', label: 'Terminé' },
]

export default function Rapports() {
  const currentYear = new Date().getFullYear()

  const [direction, setDirection] = useState('')
  const [mois, setMois] = useState('') // 1..12
  const [annee, setAnnee] = useState(String(currentYear))
  const [type_mission, setTypeMission] = useState('')
  const [statut, setStatut] = useState('')

  const [exportLoadingKey, setExportLoadingKey] = useState(null)

  const paramsMissions = useMemo(() => {
    const range = getDateRangeFromMonth(annee, mois ? Number(mois) : undefined)
    return {
      ...(direction ? { direction } : {}),
      ...(statut ? { statut } : {}),
      ...(range.date_debut ? { date_debut: range.date_debut } : {}),
      ...(range.date_fin ? { date_fin: range.date_fin } : {}),
      ...(type_mission ? { type_mission } : {}),
    }
  }, [annee, mois, direction, statut, type_mission])

  const makeStamp = useCallback(() => {
    const d = new Date()
    const pad = (n) => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}_${pad(d.getHours())}-${pad(d.getMinutes())}`
  }, [])

  const runExport = useCallback(
    async (key, fn, filenamePrefix, suffix, params) => {
      if (exportLoadingKey !== null) return
      try {
        setExportLoadingKey(key)
        const res = await fn(params)
        const stamp = makeStamp()
        dlFromBlob(res.data, `${filenamePrefix}_${stamp}${suffix}`)
        toast.success('Téléchargement lancé ✅')
      } catch (err) {
        toast.error(
          err?.response?.data?.message ||
            err?.response?.data?.error ||
            err?.message ||
            "Erreur lors de l'export"
        )
      } finally {
        setExportLoadingKey(null)
      }
    },
    [exportLoadingKey, makeStamp]
  )

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <PageHeader title="Rapports" subtitle="Export et rapports" backTo="/" />

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="at-card-surface mb-6 p-4"
      >
        <div className="flex items-center gap-2 mb-3">
          <Filter size={16} className="text-at-green" />
          <div className="text-sm font-semibold text-gray-800">Filtres d’export</div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <div>
            <Input
              label="Direction"
              value={direction}
              onChange={(e) => setDirection(e.target.value)}
              placeholder="Ex: Alger"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-2">Mois</label>
            <select
              value={mois}
              onChange={(e) => setMois(e.target.value)}
              className="w-full px-3 py-3 rounded-lg border border-gray-200 bg-white text-sm text-gray-800
                         focus:outline-none focus:ring-1 focus:ring-at-green/30 focus:border-at-green"
            >
              <option value="">Tous</option>
              {Array.from({ length: 12 }).map((_, i) => (
                <option key={i + 1} value={String(i + 1)}>
                  {String(i + 1).padStart(2, '0')}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-2">Année</label>
            <select
              value={annee}
              onChange={(e) => setAnnee(e.target.value)}
              className="w-full px-3 py-3 rounded-lg border border-gray-200 bg-white text-sm text-gray-800
                         focus:outline-none focus:ring-1 focus:ring-at-green/30 focus:border-at-green"
            >
              {Array.from({ length: 7 }).map((_, idx) => {
                const y = currentYear - 3 + idx
                return (
                  <option key={y} value={String(y)}>
                    {y}
                  </option>
                )
              })}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-2">Type mission</label>
            <select
              value={type_mission}
              onChange={(e) => setTypeMission(e.target.value)}
              className="w-full px-3 py-3 rounded-lg border border-gray-200 bg-white text-sm text-gray-800
                         focus:outline-none focus:ring-1 focus:ring-at-green/30 focus:border-at-green"
            >
              <option value="">Tous</option>
              {TYPE_MISSION_OPTIONS.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-2">Statut</label>
            <select
              value={statut}
              onChange={(e) => setStatut(e.target.value)}
              className="w-full px-3 py-3 rounded-lg border border-gray-200 bg-white text-sm text-gray-800
                         focus:outline-none focus:ring-1 focus:ring-at-green/30 focus:border-at-green"
            >
              <option value="">Tous</option>
              {STATUT_OPTIONS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge status="actif" label={`Année: ${annee}`} />
            {direction && <Badge status="actif" label={`Direction: ${direction}`} />}
            {mois && <Badge status="actif" label={`Mois: ${mois}`} />}
            {type_mission && <Badge status="actif" label={`Type: ${type_mission}`} />}
            {statut && <Badge status="actif" label={`Statut: ${statut}`} />}
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setDirection('')
              setMois('')
              setAnnee(String(currentYear))
              setTypeMission('')
              setStatut('')
            }}
          >
            <RotateCcw size={16} /> Reset
          </Button>
        </div>
      </motion.div>

      <motion.div
        className="at-card-surface p-4"
        whileHover={{ y: -2, boxShadow: '0 8px 24px rgba(0,166,80,0.08)' }}
        transition={{ duration: 0.2 }}
      >
        <div className="text-sm font-semibold text-gray-800 mb-3">Exports</div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          <Button
            variant="gradient"
            onClick={() =>
              runExport(
                'missions_excel',
                exportAPI.missionsExcel,
                'missions_excel',
                '.xlsx',
                paramsMissions
              )
            }
            loading={exportLoadingKey === 'missions_excel'}
            disabled={exportLoadingKey !== null}
          >
            <FileSpreadsheet size={16} /> Missions Excel
          </Button>

          <Button
            onClick={() =>
              runExport(
                'missions_pdf',
                exportAPI.missionsPdf,
                'missions_pdf',
                '.pdf',
                paramsMissions
              )
            }
            loading={exportLoadingKey === 'missions_pdf'}
            disabled={exportLoadingKey !== null}
          >
            <FileText size={16} /> Missions PDF
          </Button>

          <Button
            variant="gradient"
            onClick={() =>
              runExport(
                'depenses_excel',
                exportAPI.depensesExcel,
                'depenses_excel',
                '.csv',
                { annee }
              )
            }
            loading={exportLoadingKey === 'depenses_excel'}
            disabled={exportLoadingKey !== null}
          >
            <Download size={16} /> Dépenses Excel
          </Button>

          <Button
            variant="gradient"
            onClick={() =>
              runExport(
                'rapport_direction',
                exportAPI.depensesExcel,
                'rapport_direction',
                '.csv',
                { annee, direction }
              )
            }
            loading={exportLoadingKey === 'rapport_direction'}
            disabled={exportLoadingKey !== null}
          >
            <Download size={16} /> Rapport Direction
          </Button>

          <Button
            variant="gradient"
            onClick={() =>
              runExport(
                'rapport_prestataires',
                exportAPI.prestatairesExcel,
                'rapport_prestataires',
                '.csv',
                {}
              )
            }
            loading={exportLoadingKey === 'rapport_prestataires'}
            disabled={exportLoadingKey !== null}
          >
            <Download size={16} /> Rapport Prestataires
          </Button>

          <Button
            variant="gradient"
            onClick={() =>
              runExport(
                'prestataires_excel',
                exportAPI.prestatairesExcel,
                'prestataires_excel',
                '.csv',
                {}
              )
            }
            loading={exportLoadingKey === 'prestataires_excel'}
            disabled={exportLoadingKey !== null}
          >
            <FileArchive size={16} /> Prestataires Excel
          </Button>
        </div>
      </motion.div>
    </motion.div>
  )
}
