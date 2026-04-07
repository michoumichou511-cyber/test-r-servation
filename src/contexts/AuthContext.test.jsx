import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AuthProvider, useAuth } from './AuthContext'

vi.mock('../services/api', () => ({
  authAPI: {
    me: vi.fn(() => Promise.resolve({ data: { data: { id: 1, email: 'u@at.dz' } } })),
  },
}))

function Probe() {
  const { loading, isAuthenticated } = useAuth()
  if (loading) return <span>loading</span>
  return <span>{isAuthenticated ? 'ok' : 'guest'}</span>
}

describe('AuthProvider', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  it('termine le chargement sans token', async () => {
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    )
    expect(await screen.findByText('guest')).toBeInTheDocument()
  })
})
