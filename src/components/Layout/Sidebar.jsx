import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, FileText, CheckSquare, MessageCircle,
  Bell, User, Users, Building2, Wallet, ClipboardList,
  BarChart3, FileBarChart, LogOut, ChevronDown,
  X,
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { messagesAPI, notificationsAPI } from '../../services/api'
import { usePolling } from '../../hooks/usePolling'
import './Sidebar.css'

const roleCouleurs = {
  admin: 'bg-gradient-to-br from-purple-500 to-violet-600',
  validateur: 'bg-gradient-to-br from-blue-500 to-blue-700',
  utilisateur: 'bg-gradient-to-br from-green-500 to-emerald-700',
  demandeur: 'bg-gradient-to-br from-orange-500 to-amber-700',
}

const roleBadgeClass = {
  admin: '',
  validateur: 'sb-badge--validateur',
  utilisateur: 'sb-badge--utilisateur',
  demandeur: 'sb-badge--demandeur',
}

function appendRipple(e, el) {
  if (!el || typeof el.getBoundingClientRect !== 'function') return
  const rect = el.getBoundingClientRect()
  const size = Math.max(rect.width, rect.height)
  const x = e.clientX - rect.left - size / 2
  const y = e.clientY - rect.top - size / 2
  const span = document.createElement('span')
  span.className = 'sb-ripple'
  span.style.width = `${size}px`
  span.style.height = `${size}px`
  span.style.left = `${x}px`
  span.style.top = `${y}px`
  el.appendChild(span)
  setTimeout(() => span.remove(), 600)
}

function NavItem({
  to,
  icon: Icon,
  label,
  badge = 0,
  end = false,
  onClick,
  animDelay = 0,
}) {
  return (
    <NavLink
      to={to}
      end={end}
      style={{ animationDelay: `${animDelay}s` }}
      onClick={(e) => {
        appendRipple(e, e.currentTarget)
        onClick?.()
      }}
      className={({ isActive }) =>
        ['sb-menu-item', isActive ? 'sb-menu-item--active' : ''].join(' ')
      }
    >
      {({ isActive }) => (
        <>
          <Icon className="sb-menu-icon" strokeWidth={2} aria-hidden />
          <span className="sb-menu-text">{label}</span>
          {badge > 0 ? (
            <span className="sb-count-badge">
              {badge > 99 ? '99+' : badge}
            </span>
          ) : isActive ? (
            <span className="sb-active-dot" aria-hidden />
          ) : null}
        </>
      )}
    </NavLink>
  )
}

export default function Sidebar({ onClose }) {
  const { user, hasRole, logout, darkMode } = useAuth()
  const navigate = useNavigate()
  const [msgCount, setMsgCount] = useState(0)
  const [notifCount, setNotifCount] = useState(0)
  const [adminOpen, setAdminOpen] = useState(true)

  const role = (user?.role?.name ?? user?.role ?? 'utilisateur').toLowerCase()
  const avatarColor = roleCouleurs[role] ?? roleCouleurs.utilisateur
  const badgeModifier = roleBadgeClass[role] ?? 'sb-badge--defaut'

  const initiales = [user?.prenom?.[0], user?.nom?.[0]]
    .filter(Boolean)
    .join('')
    .toUpperCase()

  usePolling(async () => {
    try {
      const res = await messagesAPI.nonLusCount()
      setMsgCount(res.data?.data?.count ?? res.data?.count ?? 0)
    } catch {
      /* ignore */
    }
  }, 60000, !!user)

  usePolling(async () => {
    try {
      const res = await notificationsAPI.count()
      setNotifCount(res.data?.data?.count ?? res.data?.data ?? res.data?.count ?? 0)
    } catch {
      /* ignore */
    }
  }, 30000, !!user)

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const isAdmin = hasRole('admin')
  const isValidateur = hasRole('validateur', 'admin')

  return (
    <aside
      className="sb-root"
      style={{
        position: 'relative',
        zIndex: 1,
        ...(!darkMode
          ? {
              background: '#ffffff',
              borderRight: '1px solid #e5e7eb',
            }
          : {}),
      }}
    >
      <div className="sb-particles" aria-hidden>
        {[1, 2, 3, 4, 5].map((i) => (
          <span key={i} className="sb-particle" />
        ))}
      </div>

      <div className="sb-inner">
        <div className="sb-logo-row">
          <div className="sb-logo-section">
            <div className="sb-logo-icon-wrap">
              <img
                src="/logo-at.jpg"
                alt="Algérie Télécom"
                className="sb-logo-img"
              />
            </div>
            <div className="min-w-0">
              <div className="sb-logo-title">Réservations AT</div>
              <div className="sb-logo-sub">Algérie Télécom</div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="sb-close-mobile md:hidden"
            aria-label="Fermer le menu"
          >
            <X size={18} />
          </button>
        </div>

        {user && (
          <div className="sb-profile-card">
            {user.avatar_url ? (
              <img
                src={user.avatar_url}
                alt=""
                className="sb-profile-avatar object-cover"
              />
            ) : (
              <div
                className={`sb-profile-avatar ${avatarColor}`}
              >
                {initiales || '?'}
              </div>
            )}
            <div className="sb-profile-info">
              <div className="sb-profile-name">
                {user.prenom} {user.nom}
              </div>
              <span className={`sb-profile-badge ${badgeModifier}`}>
                {role}
              </span>
            </div>
          </div>
        )}

        <nav className="sb-nav">
          <NavItem
            to="/"
            icon={LayoutDashboard}
            label="Tableau de bord"
            end
            onClick={onClose}
            animDelay={0.1}
          />
          <NavItem
            to="/organigramme"
            icon={ClipboardList}
            label="Organigramme"
            onClick={onClose}
            animDelay={0.12}
          />
          <NavItem
            to="/missions"
            icon={FileText}
            label="Mes missions"
            onClick={onClose}
            animDelay={0.14}
          />

          {isValidateur && (
            <NavItem
              to="/validations"
              icon={CheckSquare}
              label="Validations"
              onClick={onClose}
              animDelay={0.18}
            />
          )}

          <NavItem
            to="/messagerie"
            icon={MessageCircle}
            label="Messagerie"
            badge={msgCount}
            onClick={onClose}
            animDelay={0.22}
          />
          <NavItem
            to="/notifications"
            icon={Bell}
            label="Notifications"
            badge={notifCount}
            onClick={onClose}
            animDelay={0.26}
          />
          <NavItem
            to="/profil"
            icon={User}
            label="Mon profil"
            onClick={onClose}
            animDelay={0.3}
          />

          {(isValidateur || isAdmin) && (
            <NavItem
              to="/rapports"
              icon={FileBarChart}
              label="Rapports"
              onClick={onClose}
              animDelay={0.34}
            />
          )}

          {isAdmin && (
            <div className="sb-admin-wrap">
              <button
                type="button"
                onClick={() => setAdminOpen((v) => !v)}
                className={[
                  'sb-section-header',
                  !adminOpen ? 'sb-section-header--collapsed' : '',
                ].join(' ')}
              >
                <span className="sb-section-title">Administration</span>
                <ChevronDown className="sb-section-arrow" size={16} strokeWidth={2} />
              </button>

              <AnimatePresence>
                {adminOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.22 }}
                    className="overflow-hidden space-y-0.5"
                  >
                    <NavItem
                      to="/admin/utilisateurs"
                      icon={Users}
                      label="Utilisateurs"
                      onClick={onClose}
                      animDelay={0.38}
                    />
                    <NavItem
                      to="/admin/prestataires"
                      icon={Building2}
                      label="Prestataires"
                      onClick={onClose}
                      animDelay={0.42}
                    />
                    <NavItem
                      to="/admin/budgets"
                      icon={Wallet}
                      label="Budgets"
                      onClick={onClose}
                      animDelay={0.46}
                    />
                    <NavItem
                      to="/admin/audit-logs"
                      icon={ClipboardList}
                      label="Audit Logs"
                      onClick={onClose}
                      animDelay={0.5}
                    />
                    <NavItem
                      to="/admin/statistiques"
                      icon={BarChart3}
                      label="Statistiques"
                      onClick={onClose}
                      animDelay={0.54}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </nav>

        <div className="sb-logout-wrap">
          <button
            type="button"
            onClick={(e) => {
              appendRipple(e, e.currentTarget)
              handleLogout()
            }}
            className="sb-logout-btn"
          >
            <LogOut className="sb-logout-icon" strokeWidth={2} />
            <span className="sb-logout-text">Déconnexion</span>
          </button>
        </div>
      </div>
    </aside>
  )
}
