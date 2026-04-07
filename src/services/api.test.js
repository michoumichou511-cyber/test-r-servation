import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import api, { missionsAPI, authAPI, messagesAPI } from './api'

describe('missionsAPI', () => {
  beforeEach(() => {
    vi.spyOn(api, 'get').mockResolvedValue({ data: {} })
  })
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('get appelle /missions/:id', async () => {
    await missionsAPI.get(7)
    expect(api.get).toHaveBeenCalledWith('/missions/7')
  })

  it('list appelle /missions avec params', async () => {
    await missionsAPI.list({ page: 2 })
    expect(api.get).toHaveBeenCalledWith('/missions', { params: { page: 2 } })
  })
})

describe('authAPI', () => {
  beforeEach(() => {
    vi.spyOn(api, 'post').mockResolvedValue({ data: {} })
  })
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('login poste sur /auth/login', async () => {
    await authAPI.login({ email: 'a@at.dz', password: 'x' })
    expect(api.post).toHaveBeenCalledWith('/auth/login', { email: 'a@at.dz', password: 'x' })
  })
})

describe('messagesAPI', () => {
  it('conversations utilise la route /conversations', () => {
    expect(messagesAPI.conversations.toString()).toContain('/conversations')
    expect(messagesAPI.conversations.toString()).not.toContain('/messages/conversations')
  })
})
