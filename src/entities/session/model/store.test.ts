import { beforeEach, describe, expect, it } from 'vitest'
import { testCredentials } from '@/test/fixtures/credentials'
import { loadSession } from './persistence'
import { useSessionStore } from './store'

describe('useSessionStore', () => {
  beforeEach(() => {
    useSessionStore.setState({ session: null })
  })

  it('login stores the session in state and in the browser storage', () => {
    useSessionStore.getState().login({ credentials: testCredentials }, { remember: true })

    expect(useSessionStore.getState().session).toEqual({ credentials: testCredentials })
    expect(loadSession()).toEqual({ credentials: testCredentials })
  })

  it('logout clears the state and the browser storage', () => {
    useSessionStore.getState().login({ credentials: testCredentials }, { remember: true })

    useSessionStore.getState().logout()

    expect(useSessionStore.getState().session).toBeNull()
    expect(loadSession()).toBeNull()
  })
})
