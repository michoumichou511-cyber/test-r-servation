import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Menu, Bell, Moon, Sun, Search, User,
  LogOut, X, FileText, Building2, Users,
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { searchAPI, notificationsAPI } from '../../services/api'

const titresRoutes = {
  '/':                    'Tableau de bord',
  '/missions':            'Mes missions',
  '/validations':         'Validations',
  '/messagerie':          'Messagerie',
  '/notifications':       'Notifications',
  '/profil':              'Mon profil',
  '/rapports':            'Rapports',
  '/admin/utilisateurs':  'Utilisateurs',
  '/admin/prestataires':  'Prestataires',
  '/admin/budgets':       'Budgets',
  '/admin/audit-logs':    'Audit Logs',
  '/admin/statistiques':  'Statistiques',
}

export default function Navbar({ onMenuClick }) {
  const { user, logout, darkMode, toggleDarkMode } = useAuth()
  const navigate  = useNavigate()
  const location  = useLocation()

  const [dropdownOpen, setDropdownOpen]   = useState(false)
  const [searchQuery, setSearchQuery]     = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searchOpen, setSearchOpen]       = useState(false)
  const [notifCount, setNotifCount]       = useState(0)
  const [_searching, setSearching]         = useState(false)

  const searchRef   = useRef(null)
  const debounceRef = useRef(null)

  const titre = titresRoutes[location.pathname] ?? 'AT Réservations'

  // Notifications : un seul intervalle (60s) + nettoyage au démontage
  useEffect(() => {
    if (!user) {
      setNotifCount(0)
      return
    }
    const tick = async () => {
      try {
        const res = await notificationsAPI.count()
        setNotifCount(res.data?.data?.count ?? res.data?.count ?? 0)
      } catch {
        /* ignore */
      }
    }
    tick()
    const id = setInterval(tick, 60000)
    return () => clearInterval(id)
  }, [user])

  // Recherche avec debounce
  const handleSearch = useCallback((q) => {
    setSearchQuery(q)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (q.trim().length < 3) {
      setSearchResults([])
      setSearchOpen(false)
      return
    }
    debounceRef.current = setTimeout(async () => {
      setSearching(true)
      try {
        const res = await searchAPI.search(q)
        const data = res.data?.data ?? []
        setSearchResults(Array.isArray(data) ? data : [])
        setSearchOpen(true)
      } catch {
        setSearchResults([])
      } finally {
        setSearching(false)
      }
    }, 500)
  }, [])

  // Fermer search au clic extérieur
  useEffect(() => {
    const handler = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setSearchOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleLogout = async () => {
    setDropdownOpen(false)
    await logout()
    navigate('/login')
  }

  const getResultIcon = (type) => {
    if (type === 'mission')     return <FileText size={14} className="text-[#00A650]" />
    if (type === 'prestataire') return <Building2 size={14} className="text-[#003DA5]" />
    if (type === 'user')        return <Users size={14} className="text-purple-500" />
    return <FileText size={14} />
  }

  const getResultLink = (result) => {
    if (result.type === 'mission')     return `/missions/${result.id}`
    if (result.type === 'prestataire') return `/admin/prestataires`
    if (result.type === 'user')        return `/admin/utilisateurs`
    return '/'
  }

  const initiales = [user?.prenom?.[0], user?.nom?.[0]].filter(Boolean).join('').toUpperCase()

  return (
    <header
      className="h-16 border-b border-gray-100 shadow-sm
                       dark:border-[#2A2D3E]
                       flex items-center justify-between px-4 md:px-6
                       flex-shrink-0"
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 9999,
        ...(darkMode
          ? {
              background: 'rgba(10, 15, 30, 0.85)',
              borderBottom: '1px solid #2A2D3E',
            }
          : {
              background: 'rgba(255,255,255,0.9)',
              borderBottom: '1px solid #e5e7eb',
            }),
      }}
    >

      {/* GAUCHE */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="md:hidden p-2 rounded-xl text-gray-500 hover:bg-gray-100 transition-colors"
        >
          <Menu size={20} />
        </button>
        <h1 className="font-semibold text-gray-800 dark:text-[#E8EAF0] text-base hidden sm:block">{titre}</h1>
      </div>

      {/* DROITE */}
      <div className="flex items-center gap-2">

        {/* Barre de recherche (md+) */}
        <div ref={searchRef} className="relative hidden md:block">
          <div
            aria-busy={_searching}
            className={`flex items-center gap-2 px-3 py-2 rounded-full border transition-all duration-200 ${
            searchQuery ? 'border-[#00A650] bg-white w-64' : 'border-gray-200 bg-gray-50 w-48'
          }`}>
            <Search size={15} className="text-gray-400 flex-shrink-0" />
            <input
              type="text"
              placeholder="Rechercher..."
              value={searchQuery}
              onChange={e => handleSearch(e.target.value)}
              className="bg-transparent outline-none text-sm text-gray-700 placeholder-gray-400 w-full"
            />
            {searchQuery && (
              <button onClick={() => { setSearchQuery(''); setSearchResults([]); setSearchOpen(false) }}>
                <X size={14} className="text-gray-400 hover:text-gray-600" />
              </button>
            )}
          </div>

          {/* Résultats */}
          <AnimatePresence>
            {searchOpen && searchResults.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.15 }}
                className="absolute top-full mt-2 left-0 w-72 bg-white rounded-xl shadow-xl
                           border border-gray-100 py-2 z-50 max-h-64 overflow-y-auto"
              >
                {searchResults.map((result, i) => (
                  <Link
                    key={i}
                    to={getResultLink(result)}
                    onClick={() => { setSearchOpen(false); setSearchQuery('') }}
                    className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors"
                  >
                    {getResultIcon(result.type)}
                    <div className="min-w-0">
                      <p className="text-sm text-gray-700 font-medium truncate">{result.titre ?? result.nom}</p>
                      <p className="text-xs text-gray-400 capitalize">{result.type}</p>
                    </div>
                  </Link>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Dark mode */}
        <motion.button
          onClick={toggleDarkMode}
          whileTap={{ rotate: 180 }}
          transition={{ duration: 0.3 }}
          className="p-2 rounded-xl text-gray-500 hover:bg-gray-100 transition-colors"
        >
          {darkMode ? <Sun size={18} /> : <Moon size={18} />}
        </motion.button>

        {/* Notifications */}
        <button
          onClick={() => navigate('/notifications')}
          className="relative p-2 rounded-xl text-gray-500 hover:bg-gray-100 transition-colors"
        >
          <Bell size={18} />
          {notifCount > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[9px]
                             font-bold rounded-full flex items-center justify-center leading-none">
              {notifCount > 99 ? '99+' : notifCount}
            </span>
          )}
        </button>

        {/* Avatar + dropdown */}
        <div className="relative" style={{ position: 'relative', zIndex: 9999 }}>
          <button
            onClick={() => setDropdownOpen(v => !v)}
            className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-xl
                       hover:bg-gray-100 transition-colors"
          >
            {user?.avatar_url
              ? <img src={user.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover" />
              : (
                <div className="w-8 h-8 rounded-full bg-[#00A650] flex items-center justify-center
                                text-white text-xs font-bold">
                  {initiales || '?'}
                </div>
              )
            }
            <span className="text-sm font-medium text-gray-700 hidden sm:block max-w-[100px] truncate">
              {user?.prenom}
            </span>
          </button>

          <AnimatePresence>
            {dropdownOpen && (
              <>
                <div
                  className="fixed inset-0"
                  style={{ zIndex: 9999 }}
                  onClick={() => setDropdownOpen(false)}
                />
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -8 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -8 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-xl
                             border border-gray-100 z-20 py-1.5 overflow-hidden"
                  style={{ position: 'absolute', zIndex: 10000, isolation: 'isolate' }}
                >
                  {/* Infos utilisateur */}
                  <div className="px-4 py-2.5 border-b border-gray-100">
                    <p className="text-sm font-semibold text-gray-800 truncate">
                      {user?.prenom} {user?.nom}
                    </p>
                    <p className="text-xs text-gray-400 truncate">{user?.email}</p>
                  </div>

                  <Link
                    to="/profil"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700
                               hover:bg-gray-50 transition-colors"
                  >
                    <User size={15} />
                    Mon profil
                  </Link>

                  <hr className="my-1 border-gray-100" />

                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm
                               text-red-500 hover:bg-red-50 transition-colors"
                  >
                    <LogOut size={15} />
                    Déconnexion
                  </button>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  )
}
