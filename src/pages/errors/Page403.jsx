import { useNavigate } from 'react-router-dom'

export default function Page403() {
  const navigate = useNavigate()

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#F4F6FA',
        gap: 16,
        padding: 24,
      }}
    >
      <div
        style={{
          fontSize: 120,
          fontWeight: 900,
          background: 'linear-gradient(135deg, #003DA5, #00A650)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          lineHeight: 1,
        }}
      >
        403
      </div>
      <h2 style={{ fontSize: 24, fontWeight: 700, color: '#1A1D26', margin: 0 }}>
        Accès refusé
      </h2>
      <p style={{ color: '#9AA0AE', fontSize: 14, textAlign: 'center', maxWidth: 300 }}>
        Vous n&apos;avez pas les droits pour accéder à cette page.
      </p>
      <button
        type="button"
        onClick={() => navigate('/')}
        style={{
          background: 'linear-gradient(135deg, #00A650, #003DA5)',
          color: 'white',
          border: 'none',
          borderRadius: 12,
          padding: '12px 24px',
          fontWeight: 600,
          cursor: 'pointer',
          fontSize: 14,
        }}
      >
        Retour à l&apos;accueil
      </button>
    </div>
  )
}
