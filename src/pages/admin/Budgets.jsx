import { useCallback, useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { PieChart, Edit3, AlertTriangle, Activity, RotateCcw } from 'lucide-react'
import toast from 'react-hot-toast'

import PageHeader from '../../components/Common/PageHeader'
import Modal from '../../components/UI/Modal'
import { adminAPI } from '../../services/api'
import { Badge, Button, EmptyState, Input, SkeletonCard } from '../../components/UI'
import { formatDZD } from '../../utils/format'

function progressInfo(pourcentage) {
  const p = typeof pourcentage === 'number' ? pourcentage : Number(pourcentage ?? 0)
  const safe = Number.isNaN(p) ? 0 : p
  if (safe > 90) {
    return { bar: 'bg-red-500', label: 'Critique', icon: '🔴' }
  }
  if (safe >= 80) {
    return { bar: 'bg-orange-500', label: 'Alerte', icon: '🟠' }
  }
  return { bar: 'bg-green-500', label: 'Normal', icon: '🟢' }
}

export default function Budgets() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [budgets, setBudgets] = useState([])

  const [modalOpen, setModalOpen] = useState(false)
  const [modalBudget, setModalBudget] = useState(null)
  const [newMontant, setNewMontant] = useState('')
  const [saving, setSaving] = useState(false)
  const [modalError, setModalError] = useState('')

  const fetchBudgets = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await adminAPI.budgets()
      const list = res.data?.data?.budgets ?? res.data?.budgets ?? res.data?.data ?? []
      // gererBudgets renvoie {budgets: [...]}
      const finalList = Array.isArray(list) ? list : Array.isArray(res.data?.budgets) ? res.data.budgets : []
      setBudgets(finalList)
    } catch (err) {
      setBudgets([])
      setError(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          err?.message ||
          'Erreur lors du chargement des budgets'
      )
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchBudgets()
  }, [fetchBudgets])

  const handleRetry = () => fetchBudgets()

  const openEdit = (b) => {
    setModalError('')
    setModalBudget(b)
    setNewMontant(b?.montant_alloue ?? '')
    setModalOpen(true)
  }

  const closeEdit = () => {
    setModalOpen(false)
    setModalBudget(null)
    setNewMontant('')
    setModalError('')
  }

  const submitEdit = async () => {
    if (!modalBudget?.id) return
    const parsed = Number(newMontant)
    if (Number.isNaN(parsed) || parsed < 0) {
      setModalError('Montant invalide')
      return
    }
    setSaving(true)
    setModalError('')
    try {
      await adminAPI.modifierBudget(modalBudget.id, {
        montant_alloue: parsed,
      })
      toast.success('Budget mis à jour ✅')
      closeEdit()
      await fetchBudgets()
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        'Erreur lors de la mise à jour'
      setModalError(msg)
      toast.error(msg)
    } finally {
      setSaving(false)
    }
  }

  const cards = useMemo(() => (Array.isArray(budgets) ? budgets : []), [budgets])

  return (
    <div>
      <PageHeader
        title="Budgets"
        subtitle="Gestion des budgets par direction"
        backTo="/"
        actions={
          <Button size="sm" variant="outline" onClick={handleRetry}>
            <RotateCcw size={16} /> Rafraîchir
          </Button>
        }
      />

      {loading && (
        <div className="space-y-3">
          {[0, 1, 2].map(i => <SkeletonCard key={i} />)}
        </div>
      )}

      {!loading && error && (
        <EmptyState
          icon={Activity}
          title="Erreur de chargement"
          subtitle={error}
          actionLabel="Réessayer"
          onAction={handleRetry}
        />
      )}

      {!loading && !error && cards.length === 0 && (
        <EmptyState
          icon={PieChart}
          title="Aucun budget"
          subtitle="Aucune donnée budget n’a été trouvée."
          actionLabel="Recharger"
          onAction={handleRetry}
        />
      )}

      {!loading && !error && cards.length > 0 && (
        <div className="space-y-3">
          <AnimatePresence initial={false}>
            {cards.map((b, index) => {
              const pInfo = progressInfo(b?.pourcentage ?? 0)
              const pNum = typeof b?.pourcentage === 'number' ? b.pourcentage : Number(b?.pourcentage ?? 0)
              const safeP = Number.isNaN(pNum) ? 0 : pNum
              const percent = Math.max(0, Math.min(100, safeP))
              return (
                <motion.div
                  key={b.id ?? index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.2, delay: index * 0.05 }}
                  className="at-card-surface at-hover-lift p-5"
                >
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <div className="font-bold text-gray-900">
                          {b.direction ?? '—'} / {b.service ?? '—'}
                        </div>
                        <div className="text-xs font-semibold text-gray-500 bg-[#F8FAFC] border border-gray-100 px-2 py-1 rounded-full">
                          {b.annee ?? ''}
                        </div>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Consommé : {formatDZD(b.montant_consomme)} / Alloué : {formatDZD(b.montant_alloue)}
                      </div>
                      <div className="text-sm font-semibold text-gray-900 mt-2">
                        {pInfo.icon} {pInfo.label} • {safeP}% consommé
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Button variant="outline" size="sm" onClick={() => openEdit(b)}>
                        <Edit3 size={16} /> Modifier
                      </Button>
                    </div>
                  </div>

                  <div className="mt-4">
                    <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          height: 10,
                          borderRadius: 5,
                          background:
                            percent >= 90
                              ? 'linear-gradient(90deg, #EF4444, #F87171)'
                              : percent >= 80
                                ? 'linear-gradient(90deg, #F59E0B, #FCD34D)'
                                : 'linear-gradient(90deg, #00A650, #34D399)',
                          width: `${percent}%`,
                          transition: 'width 1s ease',
                        }}
                      />
                    </div>
                    <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
                      <span>0%</span>
                      <span>{percent}%</span>
                      <span>100%</span>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={closeEdit} title="Modifier le budget" size="lg">
        {modalError && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 mb-4">
            {modalError}
          </div>
        )}

        <div className="space-y-4">
          <div className="rounded-[20px] border border-[#EAECF0] bg-[#F8F9FC] p-4 dark:border-[#2A2D3E] dark:bg-[#252840]">
            <div className="text-xs text-gray-500 font-semibold">
              {modalBudget?.direction ?? '—'} / {modalBudget?.service ?? '—'} • {modalBudget?.annee ?? ''}
            </div>
            <div className="text-sm font-semibold text-gray-800 mt-2">
              Montant actuel : {formatDZD(modalBudget?.montant_alloue)}
            </div>
          </div>

          <Input
            label="Nouveau montant alloué (DZD)"
            type="number"
            value={newMontant}
            onChange={(e) => setNewMontant(e.target.value)}
          />

          <div className="flex items-center justify-end gap-2 flex-wrap">
            <Button variant="outline" onClick={closeEdit} disabled={saving}>
              Annuler
            </Button>
            <Button onClick={submitEdit} loading={saving} disabled={saving}>
              <AlertTriangle size={16} /> Sauvegarder
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
