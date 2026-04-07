import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, ChevronLeft, MessageCircle, UserRound, Plus } from 'lucide-react'

import PageHeader from '../../components/Common/PageHeader'
import Modal from '../../components/UI/Modal'
import { EmptyState, SkeletonCard, SkeletonLine, Button, Input } from '../../components/UI'
import toast from 'react-hot-toast'
import api, { messagesAPI } from '../../services/api'
import { usePolling } from '../../hooks/usePolling'

function initialsFromName(name) {
  if (!name || typeof name !== 'string') return '?'
  const parts = name.split(' ').map(p => p.trim()).filter(Boolean)
  if (parts.length === 0) return '?'
  const a = parts[0]?.[0] ?? ''
  const b = parts.length > 1 ? parts[parts.length - 1]?.[0] ?? '' : ''
  return `${a}${b}`.toUpperCase()
}

function truncate40(s) {
  if (s == null) return ''
  const str = String(s)
  if (str.length <= 40) return str
  return `${str.slice(0, 40)}...`
}

function formatRelative(isoString) {
  if (!isoString) return '—'
  const t = new Date(isoString)
  if (Number.isNaN(t.getTime())) return '—'
  const diffMs = Date.now() - t.getTime()
  const diffMin = Math.floor(diffMs / (1000 * 60))
  if (diffMin < 1) return 'à l’instant'
  if (diffMin < 60) return `il y a ${diffMin} min`
  const diffH = Math.floor(diffMin / 60)
  return `il y a ${diffH} h`
}

export default function Messagerie() {
  const [loadingConversations, setLoadingConversations] = useState(true)
  const [errorConversations, setErrorConversations] = useState('')
  const [conversations, setConversations] = useState([])

  const [activeConvId, setActiveConvId] = useState(null)
  const activeConversation = useMemo(
    () => conversations.find(c => c.id === activeConvId) ?? null,
    [conversations, activeConvId]
  )

  const [loadingMessages, setLoadingMessages] = useState(false)
  const [errorMessages, setErrorMessages] = useState('')
  const [messages, setMessages] = useState([])

  const [contenu, setContenu] = useState('')

  const [newConvOpen, setNewConvOpen] = useState(false)
  const [userSearch, setUserSearch] = useState('')
  const [contactsResults, setContactsResults] = useState([])
  const [loadingContacts, setLoadingContacts] = useState(false)
  const [startingConv, setStartingConv] = useState(false)
  const searchDebounceRef = useRef(null)

  const messageEndRef = useRef(null)

  const refreshConversationsAndSelect = useCallback(async (otherUserId) => {
    const convRes = await messagesAPI.conversations()
    const data = convRes.data?.data ?? convRes.data
    const list = data?.conversations ?? []
    const arr = Array.isArray(list) ? list : []
    setConversations(arr)
    const found = arr.find((c) => c.interlocuteur?.id === otherUserId)
    if (found) setActiveConvId(found.id)
  }, [])

  const fetchConversations = useCallback(async () => {
    setLoadingConversations(true)
    setErrorConversations('')
    try {
      const res = await messagesAPI.conversations()
      const data = res.data?.data ?? res.data
      const list = data?.conversations ?? []
      setConversations(Array.isArray(list) ? list : [])
    } catch (err) {
      setConversations([])
      setErrorConversations(
        err?.response?.data?.message || err?.message || 'Erreur chargement des conversations'
      )
    } finally {
      setLoadingConversations(false)
    }
  }, [])

  const fetchMessages = useCallback(async (convId) => {
    if (!convId) return
    setLoadingMessages(true)
    setErrorMessages('')
    try {
      const res = await messagesAPI.messages(convId)
      const data = res.data?.data ?? res.data
      const list = data?.messages ?? []
      setMessages(Array.isArray(list) ? list : [])
    } catch (err) {
      setMessages([])
      setErrorMessages(
        err?.response?.data?.message || err?.message || 'Erreur chargement des messages'
      )
    } finally {
      setLoadingMessages(false)
    }
  }, [])

  useEffect(() => {
    fetchConversations()
  }, [fetchConversations])

  useEffect(() => {
    if (!newConvOpen) return
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current)
    searchDebounceRef.current = setTimeout(async () => {
      setLoadingContacts(true)
      try {
        const res = await api.get('/utilisateurs/contacts', {
          params: { search: userSearch.trim() || undefined },
        })
        const raw = res.data?.data?.contacts ?? res.data?.contacts ?? []
        setContactsResults(Array.isArray(raw) ? raw : [])
      } catch {
        setContactsResults([])
        toast.error('Impossible de charger les contacts')
      } finally {
        setLoadingContacts(false)
      }
    }, 350)
    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current)
    }
  }, [userSearch, newConvOpen])

  const openNewConvModal = () => {
    setUserSearch('')
    setContactsResults([])
    setNewConvOpen(true)
  }

  const startConversationWith = async (userId) => {
    if (!userId || startingConv) return
    setStartingConv(true)
    try {
      await messagesAPI.envoyer({
        receiver_id: userId,
        contenu: 'Bonjour',
        mission_id: null,
      })
      toast.success('Conversation ouverte ✅')
      setNewConvOpen(false)
      setUserSearch('')
      await refreshConversationsAndSelect(userId)
    } catch (err) {
      toast.error(
        err?.response?.data?.message || err?.message || 'Impossible de démarrer la conversation'
      )
    } finally {
      setStartingConv(false)
    }
  }

  // Auto-sélection conversation (pour éviter écran vide côté chat).
  useEffect(() => {
    if (!activeConvId && conversations.length > 0) {
      setActiveConvId(conversations[0].id)
    }
  }, [activeConvId, conversations])

  useEffect(() => {
    if (activeConvId) fetchMessages(activeConvId)
  }, [activeConvId, fetchMessages])

  // Sondage messages + rafraîchissement liste pour badges « non lus » (15 s)
  usePolling(async () => {
    if (!activeConvId) return
    await fetchMessages(activeConvId)
    await fetchConversations()
  }, 15000, !!activeConvId)

  const sendMessage = async () => {
    const conv = activeConversation
    if (!conv) return
    const txt = contenu.trim()
    if (!txt) return

    // Optimiste : on affiche l’état "envoi" via disable bouton implicitement.
    try {
      await messagesAPI.envoyer({
        receiver_id: conv.interlocuteur?.id,
        contenu: txt,
        mission_id: conv.mission_id ?? null,
      })
      setContenu('')
      toast.success('Message envoyé ✅')
      await fetchMessages(conv.id)
      await fetchConversations()
    } catch (err) {
      toast.error(
        err?.response?.data?.message || err?.message || 'Erreur envoi message'
      )
    }
  }

  useEffect(() => {
    if (messageEndRef.current) {
      messageEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' })
    }
  }, [messages.length, activeConvId, loadingMessages])

  const showListMobile = !activeConvId
  const showChatMobile = !!activeConvId

  return (
    <div>
      <PageHeader title="Messagerie" subtitle="Messagerie interne AT" backTo="/" />

      <div className="at-card-surface overflow-hidden">
        <div className="flex h-[70vh] min-h-[520px]">
          {/* Liste conversations */}
          <div
            className={[
              'w-[340px] flex-shrink-0 overflow-y-auto border-r border-[#EAECF0] bg-[#F8F9FC] dark:border-[#2A2D3E] dark:bg-[#1A1D2E]',
              showListMobile ? 'block' : 'hidden md:block',
            ].join(' ')}
          >
            <div className="border-b border-[#EAECF0] p-4 dark:border-[#2A2D3E]">
              <div className="flex items-center gap-2 mb-3">
                <MessageCircle size={18} className="text-[#00A650]" />
                <div className="text-sm font-semibold text-[#1A1D26] dark:text-[#E8EAF0]">Conversations</div>
                <div className="ml-auto text-xs text-[#9AA0AE]">{conversations.length}</div>
              </div>
              <button
                type="button"
                onClick={openNewConvModal}
                className="w-full rounded-xl px-3 py-2.5 text-sm font-semibold text-white flex items-center justify-center gap-2"
                style={{ background: '#00A650' }}
              >
                <Plus size={18} />
                Nouvelle conversation
              </button>
            </div>

            {loadingConversations && (
              <div className="space-y-3 p-4">
                {[0, 1, 2].map(i => (
                  <SkeletonCard key={i} />
                ))}
              </div>
            )}

            {!loadingConversations && errorConversations && (
              <div className="p-4">
                <EmptyState
                  icon={UserRound}
                  title="Erreur"
                  subtitle={errorConversations}
                  actionLabel="Réessayer"
                  onAction={fetchConversations}
                />
              </div>
            )}

            {!loadingConversations && !errorConversations && conversations.length === 0 && (
              <div className="p-4">
                <EmptyState
                  icon={MessageCircle}
                  title="Aucune conversation"
                  subtitle="Quand un échange est créé, il apparaîtra ici."
                />
              </div>
            )}

            {!loadingConversations && !errorConversations && conversations.length > 0 && (
              <div className="p-3 space-y-2">
                {conversations.map((c, index) => {
                  const active = c.id === activeConvId
                  const nonLus = c.non_lus ?? 0
                  return (
                    <motion.button
                      key={c.id}
                      type="button"
                      initial={false}
                      animate={{ opacity: 1 }}
                      onClick={() => setActiveConvId(c.id)}
                      className={[
                        'w-full rounded-xl border px-3 py-3 text-left transition-colors',
                        active
                          ? 'border-[#00A650] bg-[#E6F7EE] dark:bg-[#00A650]/20'
                          : 'border-[#EAECF0] bg-white hover:bg-[#F0FDF4] dark:border-[#2A2D3E] dark:bg-[#252840] dark:hover:bg-[#1E2235]',
                      ].join(' ')}
                      style={{ transitionDelay: `${index * 0.03}s` }}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className="w-10 h-10 rounded-full bg-[#00A650]/10 flex items-center justify-center flex-shrink-0"
                          style={{ border: '1px solid rgba(0,166,80,0.20)' }}
                        >
                          <span className="text-sm font-bold text-[#00A650]">
                            {initialsFromName(c.interlocuteur?.name)}
                          </span>
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <div className="text-sm font-semibold text-gray-800 truncate">
                              {c.interlocuteur?.name || 'Interlocuteur'}
                            </div>
                          </div>
                          <div className="text-xs text-gray-500">
                            {truncate40(c.dernier_message || '')}
                          </div>
                          <div className="text-[11px] text-gray-400 mt-1">
                            {formatRelative(c.dernier_message_at)}
                          </div>
                        </div>

                        {nonLus > 0 && (
                          <div className="flex-shrink-0">
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-red-500 text-white text-[10px] font-bold">
                              {nonLus > 99 ? '99+' : nonLus}
                            </span>
                          </div>
                        )}
                      </div>
                    </motion.button>
                  )
                })}
              </div>
            )}
          </div>

          {/* Chat */}
          <div
            className={[
              'flex-1 overflow-hidden bg-white dark:bg-[#1A1D2E]',
              showChatMobile ? 'block md:block' : 'hidden md:block',
            ].join(' ')}
          >
            {!activeConvId && (
              <div className="h-full flex items-center justify-center p-6">
                <EmptyState
                  icon={MessageCircle}
                  title="Sélectionnez une conversation"
                  subtitle="Cliquez sur une conversation à gauche."
                />
              </div>
            )}

            {activeConvId && (
              <div className="h-full flex flex-col">
                <div className="border-b border-[#EAECF0] bg-[#F8F9FC] p-4 dark:border-[#2A2D3E] dark:bg-[#252840]">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      className="md:hidden p-2 rounded-lg hover:bg-gray-100 text-gray-600"
                      onClick={() => setActiveConvId(null)}
                      aria-label="Retour liste"
                    >
                      <ChevronLeft size={18} />
                    </button>

                    <div className="w-10 h-10 rounded-full bg-[#00A650]/10 flex items-center justify-center flex-shrink-0"
                      style={{ border: '1px solid rgba(0,166,80,0.20)' }}
                    >
                      <span className="text-sm font-bold text-[#00A650]">
                        {initialsFromName(activeConversation?.interlocuteur?.name)}
                      </span>
                    </div>

                    <div className="min-w-0">
                      <div className="truncate font-semibold text-[#1A1D26] dark:text-[#E8EAF0]">
                        {activeConversation?.interlocuteur?.name || 'Interlocuteur'}
                      </div>
                      <div className="text-xs text-[#9AA0AE]">
                        Mission : {activeConversation?.mission_id ?? '—'}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex-1 space-y-3 overflow-y-auto bg-white p-4 dark:bg-[#1A1D2E]">
                  {loadingMessages && (
                    <div className="space-y-3">
                      {[0, 1, 2, 3].map(i => (
                        <SkeletonLine key={i} />
                      ))}
                    </div>
                  )}

                  {!loadingMessages && errorMessages && (
                    <EmptyState
                      icon={MessageCircle}
                      title="Erreur messages"
                      subtitle={errorMessages}
                      actionLabel="Réessayer"
                      onAction={() => fetchMessages(activeConvId)}
                    />
                  )}

                  {!loadingMessages && !errorMessages && messages.length === 0 && (
                    <EmptyState
                      icon={MessageCircle}
                      title="Aucun message"
                      subtitle="Commencez la conversation en envoyant un message."
                    />
                  )}

                  {!loadingMessages && !errorMessages && messages.length > 0 && (
                    <div className="space-y-3">
                      {messages.map((m, index) => (
                        <motion.div
                          key={m.id ?? index}
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.2, delay: index * 0.02 }}
                          className={[
                            'flex',
                            m.est_moi ? 'justify-end' : 'justify-start',
                          ].join(' ')}
                        >
                          <div
                            style={
                              m.est_moi
                                ? {
                                  background: 'linear-gradient(135deg, #00A650, #003DA5)',
                                  color: 'white',
                                  borderRadius: '18px 18px 4px 18px',
                                  padding: '10px 14px',
                                  maxWidth: '70%',
                                  fontSize: 13,
                                  lineHeight: 1.5,
                                }
                                : {
                                  background: 'linear-gradient(135deg, rgba(0,61,165,0.08), rgba(0,166,80,0.08))',
                                  color: '#1A1D26',
                                  border: '1px solid #EAECF0',
                                  borderRadius: '18px 18px 18px 4px',
                                  padding: '10px 14px',
                                  maxWidth: '70%',
                                  fontSize: 13,
                                  lineHeight: 1.5,
                                }
                            }
                          >
                            <div className="whitespace-pre-wrap break-words">{m.contenu}</div>
                            <div
                              className="text-[11px] mt-1"
                              style={{ color: m.est_moi ? 'rgba(255,255,255,0.85)' : '#64748B' }}
                            >
                              {m.created_at ? formatRelative(m.created_at) : ''}
                            </div>
                          </div>
                        </motion.div>
                      ))}
                      <div ref={messageEndRef} />
                    </div>
                  )}
                </div>

                <div className="border-t border-[#EAECF0] bg-[#F8F9FC] p-4 dark:border-[#2A2D3E] dark:bg-[#252840]">
                  <div className="flex items-end gap-2">
                    <div className="flex-1">
                      <textarea
                        value={contenu}
                        onChange={(e) => setContenu(e.target.value)}
                        rows={2}
                        placeholder="Écrire un message..."
                        className="at-input resize-none rounded-2xl py-2"
                      />
                    </div>
                    <Button
                      variant="gradient"
                      onClick={sendMessage}
                      disabled={!contenu.trim()}
                      size="md"
                    >
                      <Send size={16} /> Envoyer
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <Modal
        isOpen={newConvOpen}
        onClose={() => !startingConv && setNewConvOpen(false)}
        title="Nouvelle conversation"
        size="md"
      >
        <div className="space-y-3">
          <Input
            label="Rechercher un collègue"
            value={userSearch}
            onChange={(e) => setUserSearch(e.target.value)}
            placeholder="Nom, prénom, e-mail…"
          />
          {loadingContacts && (
            <div className="text-xs text-[#9AA0AE]">Recherche…</div>
          )}
          {!loadingContacts && contactsResults.length === 0 && (
            <div className="text-sm text-[#9AA0AE] py-2">
              {userSearch.trim() ? 'Aucun résultat' : 'Saisissez un nom ou parcourez la liste.'}
            </div>
          )}
          {!loadingContacts && contactsResults.length > 0 && (
            <ul className="max-h-[280px] overflow-y-auto space-y-1 border border-[#EAECF0] rounded-xl p-2 dark:border-[#2A2D3E]">
              {contactsResults.map((u) => (
                <li key={u.id}>
                  <button
                    type="button"
                    disabled={startingConv}
                    onClick={() => startConversationWith(u.id)}
                    className="w-full text-left rounded-lg px-3 py-2.5 text-sm hover:bg-[#F0FDF4] dark:hover:bg-[#252840] disabled:opacity-50"
                  >
                    <div className="font-semibold text-[#1A1D26] dark:text-[#E8EAF0]">
                      {(u.nom_complet && String(u.nom_complet).trim())
                        || `${u.prenom ?? ''} ${u.nom ?? ''}`.trim()
                        || 'Utilisateur'}
                    </div>
                    {u.email && (
                      <div className="text-xs text-[#9AA0AE] truncate">{u.email}</div>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Modal>
    </div>
  )
}
