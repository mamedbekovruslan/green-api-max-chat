import { beforeEach, describe, expect, it } from 'vitest'
import { testCredentials } from '@/test/fixtures/credentials'
import { loadSession } from './persistence'
import { useSessionStore } from './store'

describe('useSessionStore', () => {
  beforeEach(() => {
    useSessionStore.setState({ session: null, remember: false })
  })

  it('login stores the session and the remember choice', () => {
    useSessionStore.getState().login({ credentials: testCredentials }, { remember: true })

    expect(useSessionStore.getState()).toMatchObject({
      session: { credentials: testCredentials },
      remember: true,
    })
    expect(loadSession()).toEqual({ session: { credentials: testCredentials }, remember: true })
  })

  it('logout clears the state and the browser storage', () => {
    useSessionStore.getState().login({ credentials: testCredentials }, { remember: true })

    useSessionStore.getState().logout()

    expect(useSessionStore.getState()).toMatchObject({ session: null, remember: false })
    expect(loadSession()).toBeNull()
  })
})
