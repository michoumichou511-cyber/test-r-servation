/**
 * Logo animé AT — fichier dans public/videos/at-logo.mp4
 * (URL absolue /videos/... = toujours correct avec Vite)
 * muted + playsInline + loop : obligatoire pour l’autoplay
 */
const LOGO_SRC = '/videos/at-logo.mp4'

export default function LogoVideo({
  className = '',
  /** 'contain' | 'cover' */
  fit = 'contain',
  /** Cadre type verre (panneau login gauche) */
  glass = false,
}) {
  const shell = glass
    ? 'relative overflow-hidden bg-white/20 backdrop-blur-sm border border-white/30 shadow-lg'
    : 'relative overflow-hidden bg-white shadow-xl ring-1 ring-black/5'

  return (
    <div className={`${shell} ${className}`} aria-hidden>
      <video
        src={LOGO_SRC}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        className={`h-full w-full ${fit === 'cover' ? 'object-cover' : 'object-contain'}`}
      />
    </div>
  )
}
