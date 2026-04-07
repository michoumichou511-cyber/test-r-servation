# AUDIT PROJET — AT Réservations (frontend)

*Généré à partir d’une analyse statique du dossier `src/` (mars 2026).*

---

## SECTION 1 — Console.log trouvés

*Recherche : `console.` dans `src/**/*.js` et `src/**/*.jsx` (hors `node_modules`, `dist`).*

- `src/components/Common/ErrorBoundary.jsx`  
  **ligne 15 :** `console.error('[ErrorBoundary]', error, info.componentStack)`

- `src/hooks/useLocalStorage.js`  
  **ligne 20 :** `console.error(error);`

> **Note :** aucun `console.log` de debug n’a été trouvé dans `src/`. Les seules occurrences sont `console.error` (erreurs).

---

## SECTION 2 — Erreurs potentielles

- **Référence non définie (risque de crash au runtime)**  
  - `src/pages/profil/Profil.jsx` : utilisation de `AlertTriangle` pour `EmptyState` (vers la ligne 415) **sans import** depuis `lucide-react`. Dès que `statsError` est défini, React peut lever une erreur de référence.

- **Variables / accès sans garde-fou**  
  - Beaucoup d’écrans utilisent `optional chaining` (`?.`) et valeurs par défaut pour les réponses API — bonne pratique globale.  
  - `AuthContext.login` : si `token` est absent dans la réponse, `localStorage.setItem('at_token', t)` peut stocker `"undefined"` — à valider côté contrat API.

- **Appels API**  
  - La majorité des pages encapsulent les appels dans `try/catch` avec message utilisateur ou `toast`.  
  - **Blocs `catch` vides** (erreurs silencieuses) : `Navbar.jsx` (polling notifs), `Sidebar.jsx` (polling messages / notifs), `AuthContext.jsx` (`logout`), `api.js` (interceptor 401). Comportement voulu par endroit, mais masque les erreurs réseau pour le polling.

- **Composants / gestion d’erreur**  
  - `ErrorBoundary` entoure `AppRoutes` et chaque `Outlet` dans `MainLayout` — limite les plantages de rendu.  
  - Pas de boundary dédiée par page métier (hors layout).

- **Props / typage**  
  - Projet en **JavaScript** sans PropTypes/TypeScript : pas de typage statique des props. Risque d’erreurs à l’exécution si l’API change.

---

## SECTION 3 — Code de mauvaise qualité

- **Fichiers longs (> 400 lignes)** — comptage approximatif des lignes :
  - `src/pages/dashboard/Dashboard.jsx` — **~1070**
  - `src/pages/missions/MissionDetail.jsx` — **~1000**
  - `src/pages/auth/Login.jsx` — **~582**
  - `src/pages/profil/Profil.jsx` — **~583**
  - `src/pages/admin/Prestataires.jsx` — **~540**
  - `src/pages/missions/NewMission/Step2Reservations.jsx` — **~484**
  - `src/pages/admin/Utilisateurs.jsx` — **~461**
  - `src/pages/messagerie/Messagerie.jsx` — **~421**
  - `src/pages/admin/Statistiques.jsx` — **~408**

- **Code dupliqué**  
  - Fonctions du type **`formatDZD`** / formatage monétaire répétées dans plusieurs fichiers (`Budgets.jsx`, `Statistiques.jsx`, etc.). À factoriser dans un utilitaire (`utils/format.js`).

- **Imports inutilisés** (d’après `npm run lint` / ESLint)  
  - Nombreux fichiers : `motion` importé depuis `framer-motion` sans usage (`Dashboard.jsx`, `Navbar.jsx`, `MissionDetail.jsx`, `Messagerie.jsx`, etc.).  
  - Autres exemples : `useNavigate` non utilisé (`Budgets.jsx`, `AuditLogs.jsx`, `Utilisateurs.jsx`, `Messagerie.jsx`), `useMemo` non utilisé (`AuditLogs.jsx`, `Utilisateurs.jsx`), `motion` dans `Register.jsx`, etc.

- **Variables non utilisées** (ESLint)  
  - Exemples : `hasRole`, `searching` (`Navbar.jsx`), `NavItem` prop `Icon` (`Sidebar.jsx`), `missionsActions`, `loadingAnyTab` (`MissionDetail.jsx`), `isRejeter` (`Validations.jsx`), `tag`/`Tag` (`GlassCard.jsx`), etc.

- **Hook mort**  
  - `src/hooks/useLocalStorage.js` : **aucun import** ailleurs dans `src/` — code mort ou prévu pour usage futur.

- **Commentaires en anglais** (exemples)  
  - `Sidebar.jsx`, `Navbar.jsx` : `// Polling messages`, `// Polling notifications`  
  - `Prestataires.jsx` : `// Optimistic UI`, `// create | edit`  
  - `Rapports.jsx` : `// monthIndex1Based: 1..12`  
  - `AuditLogs.jsx` : libellés d’actions `login`, `create`, `update` (données métier, pas seulement commentaires)

- **Autres signaux ESLint**  
  - Blocs `catch {}` vides (`no-empty`).  
  - `Step1Informations.jsx` : `setState` synchrone dans un `useEffect` (règle `react-hooks/set-state-in-effect`).  
  - `Notifications.jsx` : dépendances `useEffect` incomplètes (warning).

---

## SECTION 4 — Problèmes de design

- **Pages qui peuvent crasher**  
  - **`Profil`** : onglet statistiques en erreur → `AlertTriangle` non importé (voir section 2).  
  - Hors ça, erreurs de rendu non testées exhaustivement sur toutes les routes.

- **Pages placeholder**  
  - Aucune page « Coming soon » évidente dans le code parcouru : les modules principaux (missions, validations, messagerie, rapports, admin) semblent implémentés avec formulaires et appels API.

- **Mode sombre**  
  - `MainLayout`, zone principale et certains composants utilisent `dark:`.  
  - **`Login.jsx` / `Register.jsx`** : styles souvent **inline** (couleurs fixes), **sans** classes `dark:` — si `document.documentElement` a la classe `dark` (préférence persistée), l’apparence peut être **incohérente** (formulaire clair sur fond système sombre).  
  - **`ErrorBoundary`** : fond clair fixe `#F4F6FA`, pas de variante dark.  
  - **`Sidebar`** : fond majoritairement blanc ; le contraste en mode sombre global peut être inégal selon les écrans.

- **Responsive**  
  - `Login` : panneau gauche vidéo `hidden md:flex` — OK mobile.  
  - Tableaux (audit, listes) avec `overflow-x-auto` sur plusieurs pages — à valider sur très petits écrans.  
  - Pas de tests device automatisés dans ce rapport.

---

## SECTION 5 — Sécurité

- **URL API figée** — `src/services/api.js` : `baseURL: 'http://127.0.0.1:8000/api'` (pas de `import.meta.env.VITE_*`). En production, risque de mauvaise cible ou de mixed content si mal configuré.

- **Jeton d’authentification** — stocké dans **`localStorage`** (`at_token`). Classique en SPA, mais exposé en cas de XSS ; pas de httpOnly cookie ici.

- **Données sensibles dans le code**  
  - **`Login.jsx`** : objet `comptes` avec **emails et mots de passe** de démonstration (`Password@123`) en clair dans le source — **à retirer avant toute mise en production ou dépôt public**.

- **Routes**  
  - Routes applicatives sensibles sont sous `<PrivateRoute>` dans `App.jsx`.  
  - `/login`, `/register`, `/403`, `*` (404) restent publics — attendu.

---

## SECTION 6 — Performance

- **Polling** (`usePolling`)  
  - **10 s** : messages non lus (`Sidebar.jsx`), rafraîchissement messagerie active (`Messagerie.jsx`).  
  - **30 s** : compteur notifications (`Navbar.jsx`, `Sidebar.jsx`).  
  - Fréquence **10 s** : limite haute pour charge serveur + batterie ; acceptable pour démo, à ajuster si besoin (15–30 s).

- **Images / médias**  
  - Logo `logo-at.jpg`, vidéos `/videos/` — pas de lazy loading systématique ni formats modernes (WebP/AVIF) mentionnés dans le code.

- **Re-renders**  
  - `Dashboard.jsx` très volumineux : beaucoup d’état et de sous-composants inline — risque de re-renders si non mémoïsés (non profilé ici).  
  - `Messagerie` : polling déclenche `fetchMessages` + `fetchConversations` toutes les 10 s si conversation active — charge réseau notable.

---

## SECTION 7 — Score global

| Critère | Score | Commentaire court |
|--------|-------|---------------------|
| **Qualité du code** | **62/100** | ESLint : 52+ erreurs (imports inutilisés, variables mortes, bug `AlertTriangle`). Structure correcte mais dette technique réelle. |
| **Design** | **78/100** | Cohérence AT (couleurs, layout), animations ; mode sombre inégal (login/register, boundary). |
| **Fonctionnalités** | **85/100** | Couverture large (missions, admin, exports, messagerie) ; un bug bloquant potentiel sur Profil. |
| **Performance** | **72/100** | Polling raisonnable sauf 10 s × messagerie ; bundle volumineux (déjà signalé au build Vite). |

- **Prêt pour soutenance : OUI** *(avec réserves)* — démo probablement viable après correction du **Profil** (`AlertTriangle`) et idéalement suppression des **comptes demo** en dur dans `Login.jsx`.

---

*Fin du fichier AUDIT_PROJET.md*
