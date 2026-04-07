import axios from 'axios'

/** Base API : Railway par défaut si VITE_API_URL n’est pas défini. */
const defaultBaseURL = import.meta.env.VITE_API_URL
  ?? 'https://backend-production-170c.up.railway.app/api'

const api = axios.create({
  baseURL: defaultBaseURL,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('at_token')
  if (token)
    config.headers.Authorization = `Bearer ${token}`
  return config
})

let unauthorizedHandler = () => {}
export const setUnauthorizedHandler = (fn) => {
  unauthorizedHandler = fn
}

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

api.interceptors.response.use(
  (r) => r,
  async (error) => {
    const cfg = error.config
    const status = error.response?.status
    const method = (cfg?.method || 'get').toLowerCase()
    const noResponse = !error.response
    const gatewayOrUnavailable = status === 502 || status === 503 || status === 504
    const safeMethod = method === 'get' || method === 'head'
    const eligible =
      cfg &&
      !cfg.signal?.aborted &&
      safeMethod &&
      (noResponse || gatewayOrUnavailable)
    const n = (cfg?.__atRetry ?? 0) + 1
    if (eligible && n <= 2) {
      cfg.__atRetry = n
      await delay(350 * n)
      return api(cfg)
    }
    if (status === 401) {
      try { unauthorizedHandler() } catch { /* ignore */ }
    }
    return Promise.reject(error)
  }
)

// ── Auth ──────────────────────────────
export const authAPI = {
  login:   (data) => api.post('/auth/login', data),
  logout:  ()     => api.post('/auth/logout'),
  me:      ()     => api.get('/auth/me'),
  register:(data) => api.post('/auth/register', data),
  updateProfile: (data) => api.put('/auth/profile', data),
  statistiques: () => api.get('/profil/statistiques'),
  changePassword: (data) => api.post('/auth/change-password', data),
}

// ── Missions ──────────────────────────
export const missionsAPI = {
  list:    (params) => api.get('/missions', { params }),
  get:     (id)     => api.get(`/missions/${id}`),
  create:  (data)   => api.post('/missions', data),
  update:  (id, data) => api.put(`/missions/${id}`, data),
  delete:  (id)     => api.delete(`/missions/${id}`),
  /** @deprecated préférer submit */
  submit:  (id)     => api.post(`/missions/${id}/submit`),
  /** @deprecated préférer cancel */
  cancel:  (id)     => api.post(`/missions/${id}/cancel`),
  soumettre: (id)   => api.post(`/missions/${id}/submit`),
  annuler: (id)     => api.post(`/missions/${id}/cancel`),
  /** Alias backend : /historique (pas /timeline) */
  timeline:(id)     => api.get(`/missions/${id}/historique`),
  historique: (id)  => api.get(`/missions/${id}/historique`),
  documents:(id)    => api.get(`/missions/${id}/documents`),
  bonsCommande:(id) => api.get(`/missions/${id}/bons-commande`),
  export:  (format) =>
    api.get('/missions/export', {
      params: { format },
      responseType: 'blob',
    }),
  /** Export liste missions (format pdf / xlsx) — GET /api/missions/export */
  exportPdf: (params) =>
    api.get('/missions/export', {
      params: { ...(params || {}), format: 'pdf' },
      responseType: 'blob',
    }),
  exportExcel: (params) =>
    api.get('/missions/export', {
      params: { ...(params || {}), format: 'xlsx' },
      responseType: 'blob',
    }),
  /** PDF ordre de mission pour une mission (GET /api/missions/{id}/export/pdf) */
  exportOrdreMissionPdf: (id) =>
    api.get(`/missions/${id}/export/pdf`, { responseType: 'blob' }),
  uploadDocument:(id, data) =>
    api.post(`/missions/${id}/documents`, data, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
  deleteDocument:(_missionId, docId) =>
    api.delete(`/documents/${docId}`),
}

/** Documents mission — routes `/missions/{id}/documents` et `/documents/{id}` */
export const documentsAPI = {
  list:       (missionId) => api.get(`/missions/${missionId}/documents`),
  upload:     (missionId, data) =>
    api.post(`/missions/${missionId}/documents`, data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  telecharger:(id) =>
    api.get(`/documents/${id}/telecharger`, { responseType: 'blob' }),
  delete:     (id) => api.delete(`/documents/${id}`),
}

// ── Réservations ─────────────────────
export const reservationsAPI = {
  /** @deprecated Utiliser getByMission / list avec missionId */
  list:    (missionId, params) => {
    if (missionId == null || missionId === '') {
      // TODO: pas de route GET /api/reservations sans mission — filtrer côté client si besoin
      return Promise.reject(new Error('missionId requis pour lister les réservations'))
    }
    return api.get(`/missions/${missionId}/reservations`, { params })
  },
  getByMission: (missionId, params) =>
    api.get(`/missions/${missionId}/reservations`, { params }),
  get:     (id)     => api.get(`/reservations/${id}`),
  creer:   (missionId, data) =>
    api.post(`/missions/${missionId}/reservations`, data),
  create:  (missionId, data) =>
    api.post(`/missions/${missionId}/reservations`, data),
  update:  (id, data) => api.put(`/reservations/${id}`, data),
  delete:  (id)     => api.delete(`/reservations/${id}`),
}

// ── Validations ───────────────────────
export const validationsAPI = {
  list:    (params) => api.get('/validations', { params }),
  approuver:(id, data) =>
    api.post(`/validations/${id}/approuver`, data),
  rejeter: (id, data) =>
    api.post(`/validations/${id}/rejeter`, data),
  demanderModification:(id, data) =>
    api.post(`/validations/${id}/modifier`, data),
  modifier: (id, data) =>
    api.post(`/validations/${id}/modifier`, data),
}

// ── Notifications ─────────────────────
export const notificationsAPI = {
  list:    (params) => api.get('/notifications', { params }),
  countNonLues: () =>
    api.get('/notifications/non-lues/count'),
  count: () =>
    api.get('/notifications/non-lues/count'),
  marquerLu: (id) =>
    api.put(`/notifications/${id}/lire`),
  marquerToutLu: () =>
    api.put('/notifications/tout-lire'),
  supprimer: (id) =>
    api.delete(`/notifications/${id}`),
}

// ── Messages ──────────────────────────
export const messagesAPI = {
  conversations: () =>
    api.get('/conversations'),
  messages: (convId) =>
    api.get(`/conversations/${convId}/messages`),
  envoyer: (data) =>
    api.post('/messages', data),
  nonLusCount: () =>
    api.get('/messages/non-lus/count'),
  /** Marque un message comme lu (id = id du message, pas de la conversation) */
  marquerLu: (messageId) =>
    api.put(`/messages/${messageId}/lire`),
}

// ── Dashboard ─────────────────────────
export const dashboardAPI = {
  stats:   () => api.get('/dashboard/stats'),
  alertes: () => api.get('/dashboard/alertes'),
  missionsDuMois: () =>
    api.get('/dashboard/missions-du-mois'),
  depensesParDirection: (params) =>
    api.get('/dashboard/depenses-par-direction', { params }),
  validateur: () =>
    api.get('/dashboard/validateur'),
}

// ── Admin ─────────────────────────────
export const adminAPI = {
  users: {
    list:   (params) =>
      api.get('/admin/utilisateurs', { params }),
    get:    (id) =>
      api.get(`/admin/utilisateurs/${id}`),
    create: (data) =>
      api.post('/admin/utilisateurs', data),
    update: (id, data) =>
      api.put(`/admin/utilisateurs/${id}`, data),
    delete: (id) =>
      api.delete(`/admin/utilisateurs/${id}`),
    toggleActive: (id) =>
      api.put(`/admin/utilisateurs/${id}/toggle-active`),
  },
  prestatairesCrud: {
    list:   (params) =>
      api.get('/prestataires', { params }),
    get:    (id) =>
      api.get(`/prestataires/${id}`),
    create: (data) =>
      api.post('/admin/prestataires', data),
    update: (id, data) =>
      api.put(`/admin/prestataires/${id}`, data),
    delete: (id) =>
      api.delete(`/admin/prestataires/${id}`),
    toggleFavori: (id) =>
      api.post(`/prestataires/${id}/favori`, {}),
    evaluer: (id, data) =>
      api.post(`/prestataires/${id}/evaluer`, data),
  },
  budgetsCrud: {
    list:   (params) =>
      api.get('/admin/budgets', { params }),
    get:    (id) =>
      api.get(`/admin/budgets/${id}`),
    create: (data) =>
      api.post('/admin/budgets', data),
    update: (id, data) =>
      api.put(`/admin/budgets/${id}`, data),
    delete: (id) =>
      api.delete(`/admin/budgets/${id}`),
    stats:  () =>
      api.get('/admin/budgets/stats'),
  },
  auditLogsList: {
    list:   (params) =>
      api.get('/admin/audit-logs', { params }),
  },
  statistiques: {
    general: (params) =>
      api.get('/admin/statistiques', { params }),
    missions: (params) =>
      api.get('/admin/statistiques/missions',
        { params }),
    prestataires: (params) =>
      api.get('/admin/statistiques/prestataires',
        { params }),
  },

  utilisateurs: (params) => api.get('/admin/utilisateurs', { params }),
  toggleActif: (id) => api.put(`/admin/utilisateurs/${id}/toggle-active`),
  changerRole: (id, data) => api.put(`/admin/utilisateurs/${id}/role`, data),
  // TODO: le backend n’expose pas POST /api/admin/utilisateurs — création utilisateur via authAPI.register
  creerUtilisateur: (data) => api.post('/admin/utilisateurs', data),
  modifierUtilisateur: (id, data) => api.put(`/admin/utilisateurs/${id}`, data),
  supprimerUtilisateur: (id) => api.delete(`/admin/utilisateurs/${id}`),

  prestataires: (params) => api.get('/prestataires', { params }),
  creerPrestataire: (data) => api.post('/admin/prestataires', data),
  modifierPrestataire: (id, data) => api.put(`/admin/prestataires/${id}`, data),
  supprimerPrestataire: (id) => api.delete(`/admin/prestataires/${id}`),
  toggleFavori: (id) => api.post(`/prestataires/${id}/favori`, {}),

  budgets: (params) => api.get('/admin/budgets', { params }),
  modifierBudget: (id, data) => api.put(`/admin/budgets/${id}`, data),

  auditLogs: (params) => api.get('/admin/audit-logs', { params }),
}

// ── Rapports / Export (routes backend réelles sous /export/...) ─────────────────
export const exportAPI = {
  // TODO: pas de routes GET /api/rapports/* dans le backend — préférer missionsExcel / missionsPdf / depensesExcel / prestatairesExcel
  missions: (params) =>
    api.get('/rapports/missions', {
      params, responseType: 'blob' }),
  budgets: (params) =>
    api.get('/rapports/budgets', {
      params, responseType: 'blob' }),
  prestataires: (params) =>
    api.get('/rapports/prestataires', {
      params, responseType: 'blob' }),
  auditLogs: (params) =>
    api.get('/rapports/audit-logs', {
      params, responseType: 'blob' }),
  missionsExcel: (params) =>
    api.get('/export/missions/excel', { params, responseType: 'blob' }),
  missionsPdf: (params) =>
    api.get('/export/missions/pdf', { params, responseType: 'blob' }),
  depensesExcel: (params) =>
    api.get('/export/depenses/excel', { params, responseType: 'blob' }),
  prestatairesExcel: (params) =>
    api.get('/export/prestataires/excel', { params, responseType: 'blob' }),
}

/** Alias rapports — mêmes routes que exportAPI (missions via ExportController ou MissionController selon cas) */
export const rapportsAPI = {
  exportMissionsExcel: (params) =>
    api.get('/export/missions/excel', { params, responseType: 'blob' }),
  exportMissionsPdf: (params) =>
    api.get('/export/missions/pdf', { params, responseType: 'blob' }),
  exportDepenses: (params) =>
    api.get('/export/depenses/excel', { params, responseType: 'blob' }),
  exportDirection: (params) =>
    api.get('/export/depenses/excel', { params, responseType: 'blob' }),
  exportPrestataires: (params) =>
    api.get('/export/prestataires/excel', { params, responseType: 'blob' }),
}

// ── Bons de commande ──────────────────
// TODO: les routes /api/bons-commande et /api/missions/{id}/generer-bon ne sont pas définies dans api.php — utiliser missionsAPI.bonsCommande(missionId) si besoin
export const bonCommandeAPI = {
  list:    (params) =>
    api.get('/bons-commande', { params }),
  get:     (id) =>
    api.get(`/bons-commande/${id}`),
  generer: (missionId) =>
    api.post(`/missions/${missionId}/generer-bon`),
  telecharger: (id) =>
    api.get(`/bons-commande/${id}/telecharger`, {
      responseType: 'blob' }),
}

// ── Recherche ─────────────────────────
export const searchAPI = {
  global: (q) =>
    api.get('/search', { params: { q } }),
}

// ── Health ────────────────────────────
export const healthAPI = {
  check: () => api.get('/health'),
}

// ── Utilitaire téléchargement ─────────
export const telechargerBlob = (blob, nom) => {
  const url = URL.createObjectURL(blob)
  const a   = document.createElement('a')
  a.href    = url
  a.download = nom
  a.click()
  URL.revokeObjectURL(url)
}

export default api
