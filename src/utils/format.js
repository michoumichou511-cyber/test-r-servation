// Formate un montant en DZD
export const formatDZD = (montant) => {
  if (!montant && montant !== 0) return '—'
  return new Intl.NumberFormat('fr-DZ', {
    style: 'currency',
    currency: 'DZD',
    minimumFractionDigits: 0,
  }).format(montant)
}

// Formate une date en français
export const formatDate = (date) => {
  if (!date) return '—'
  return new Date(date).toLocaleDateString(
    'fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
}

// Formate une date relative
export const formatDateRelative = (date) => {
  if (!date) return '—'
  const diff = Date.now() - new Date(date)
  const minutes = Math.floor(diff / 60000)
  const heures = Math.floor(diff / 3600000)
  const jours = Math.floor(diff / 86400000)
  if (jours > 0) return `Il y a ${jours}j`
  if (heures > 0) return `Il y a ${heures}h`
  if (minutes > 0) return `Il y a ${minutes}min`
  return "À l'instant"
}

// Retourne la couleur selon le statut
export const couleurStatut = (statut) => {
  const colors = {
    brouillon:    '#94A3B8',
    soumis:       '#3B82F6',
    en_validation:'#F59E0B',
    approuve:     '#10B981',
    rejete:       '#EF4444',
    annule:       '#6B7280',
    termine:      '#8B5CF6',
  }
  return colors[statut] ?? '#94A3B8'
}
