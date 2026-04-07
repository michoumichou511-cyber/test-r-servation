# React + Vite

## Déploiement Vercel

1. **Variable d’environnement** `VITE_API_URL` : URL publique du backend **avec le suffixe `/api`** (ex. `https://ton-service.up.railway.app/api`). C’est la base utilisée par `src/services/api.js`.
2. **Build** : Vite remplace `import.meta.env.VITE_API_URL` **au moment du `vite build`**. Après toute création ou modification de la variable sur le dashboard Vercel, **redéployer** le projet (ou pousser un commit) pour régénérer le build.
3. **CORS** : le backend Laravel doit autoriser l’origine de ton site Vercel. Sur Railway, définis **`FRONTEND_URL`** (ex. `https://ton-app.vercel.app`, sans slash final) — voir `backend/README.md` section Déploiement.

---

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
