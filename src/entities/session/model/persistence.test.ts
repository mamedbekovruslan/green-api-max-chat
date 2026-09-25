import { describe, expect, it } from 'vitest'
import { testCredentials } from '@/test/fixtures/credentials'
import {
  clearSession,
  loadSession,
  saveSession,
  SESSION_STORAGE_KEY,
  type Session,
} from './persistence'

const session: Session = { credentials: testCredentials, wid: '79990000001@c.us' }

describe('session persistence', () => {
  it('saves to sessionStorage by default', () => {
    saveSession(session, false)

    expect(sessionStorage.getItem(SESSION_STORAGE_KEY)).not.toBeNull()
    expect(localStorage.getItem(SESSION_STORAGE_KEY)).toBeNull()
    expect(loadSession()).toEqual({ session, remember: false })
  })

  it('saves to localStorage when remember is set', () => {
    saveSession(session, true)

    expect(localStorage.getItem(SESSION_STORAGE_KEY)).not.toBeNull()
    expect(sessionStorage.getItem(SESSION_STORAGE_KEY)).toBeNull()
    expect(loadSession()).toEqual({ session, remember: true })
  })

  it('keeps a single copy when the remember choice changes', () => {
    saveSession(session, true)
    saveSession(session, false)

    expect(localStorage.getItem(SESSION_STORAGE_KEY)).toBeNull()
    expect(sessionStorage.getItem(SESSION_STORAGE_KEY)).not.toBeNull()
  })

  it('returns null when nothing is stored', () => {
    expect(loadSession()).toBeNull()
  })

  it.each([
    ['malformed JSON', '{not json'],
    ['wrong shape', JSON.stringify({ credentials: { idInstance: 1 } })],
    [
      'foreign apiUrl',
      JSON.stringify({ credentials: { ...testCredentials, apiUrl: 'https://evil.example.com' } }),
    ],
  ])('discards %s', (_, raw) => {
    localStorage.setItem(SESSION_STORAGE_KEY, raw)

    expect(loadSession()).toBeNull()
    expect(localStorage.getItem(SESSION_STORAGE_KEY)).toBeNull()
  })

  it('clearSession removes both copies', () => {
    sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session))
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session))

    clearSession()

    expect(sessionStorage.getItem(SESSION_STORAGE_KEY)).toBeNull()
    expect(localStorage.getItem(SESSION_STORAGE_KEY)).toBeNull()
  })
})
