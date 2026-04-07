import { Component } from 'react'

/**
 * Empêche une erreur de rendu enfant de faire planter toute l'app.
 * variant="fullscreen" : fond AT sur tout l'écran (aucun blanc).
 */
export default class ErrorBoundary extends Component {
  state = { hasError: false, error: null }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info.componentStack)
  }

  handleReload = () => {
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      const full = this.props.variant === 'fullscreen'
      return (
        <div
          className={
            full
              ? 'min-h-screen flex flex-col items-center justify-center p-8 text-center bg-[#F4F6FA] dark:bg-[#0F1117]'
              : 'min-h-[40vh] flex flex-col items-center justify-center p-8 text-center bg-[#F4F6FA] dark:bg-[#0F1117]'
          }
          style={{ fontFamily: 'IBM Plex Sans, sans-serif' }}
        >
          <div
            className="w-12 h-12 mb-6 border-4 border-[#00A650]/20 border-t-[#00A650] rounded-full animate-spin"
            aria-hidden
          />
          <p className="text-lg font-semibold text-[#1A1D26] dark:text-[#E8EAF0] mb-2">
            Un problème d&apos;affichage est survenu
          </p>
          <p className="text-sm text-[#5A6070] dark:text-[#9CA3AF] max-w-md mb-6">
            L&apos;application reste sur le fond habituel. Vous pouvez recharger la page ou vous
            reconnecter.
          </p>
          <button
            type="button"
            onClick={this.handleReload}
            className="px-5 py-2.5 rounded-xl bg-[#00A650] text-white font-semibold text-sm
                       hover:opacity-90 transition-opacity"
          >
            Recharger la page
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
