import axios from 'axios'

function requiredEnv(name) {
  const v = import.meta.env?.[name]
  if (!v) {
    throw new Error(
      `[config] Variable manquante: ${name}. ` +
      `Créez un fichier .env à partir de .env.example et définissez ${name} (ex: http://127.0.0.1:8000/api).`
    )
  }
  return v
}

const api = axios.create({
  baseURL: requiredEnv('VITE_API_URL'),
  headers: { 'Content-Type': 'application/json' },
  // Évite un blocage infini si le backend ne répond pas (ex: API down / DNS / réseau)
  timeout: 10000,
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

  // Aliases de compatibilité (évite la duplication réelle des endpoints)
  utilisateurs:  (params) => adminAPI.users.list(params),
  toggleActif:   (id) => adminAPI.users.toggleActive(id),
  changerRole:   (id, data) => adminAPI.users.update(id, data),
  creerUtilisateur: (data) => adminAPI.users.create(data),
  modifierUtilisateur: (id, data) => adminAPI.users.update(id, data),
  supprimerUtilisateur: (id) => adminAPI.users.delete(id),

  prestataires: (params) => adminAPI.prestatairesCrud.list(params),
  creerPrestataire: (data) => adminAPI.prestatairesCrud.create(data),
  modifierPrestataire: (id, data) => adminAPI.prestatairesCrud.update(id, data),
  supprimerPrestataire: (id) => adminAPI.prestatairesCrud.delete(id),
  toggleFavori: (id) => adminAPI.prestatairesCrud.toggleFavori(id),

  budgets: (params) => adminAPI.budgetsCrud.list(params),
  modifierBudget: (id, data) => adminAPI.budgetsCrud.update(id, data),

  auditLogs: (params) => adminAPI.auditLogsList.list(params),
}

// ── Rapports / Export (routes backend réelles sous /export/...) ─────────────────
export const exportAPI = {
  // Routes /rapports/* : non définies dans le backend actuel → erreur explicite au lieu d'un 404 silencieux
  missions: () => Promise.reject(new Error('Export missions: route /rapports/missions indisponible. Utilisez missionsExcel ou missionsPdf.')),
  budgets: () => Promise.reject(new Error('Export budgets: route /rapports/budgets indisponible.')),
  prestataires: () => Promise.reject(new Error('Export prestataires: route /rapports/prestataires indisponible. Utilisez prestatairesExcel.')),
  auditLogs: () => Promise.reject(new Error('Export audit logs: route /rapports/audit-logs indisponible.')),
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
  list:    () => Promise.reject(new Error('Bons de commande: route /bons-commande indisponible. Utilisez missionsAPI.bonsCommande(missionId).')),
  get:     () => Promise.reject(new Error('Bons de commande: route /bons-commande/{id} indisponible.')),
  generer: () => Promise.reject(new Error('Bons de commande: route /missions/{id}/generer-bon indisponible.')),
  telecharger: () => Promise.reject(new Error('Bons de commande: téléchargement indisponible via cette API.')),
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
