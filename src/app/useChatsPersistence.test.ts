import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { CHATS_STORAGE_KEY, loadChats, saveChats, useChatStore } from '@/entities/chat'
import { useSessionStore } from '@/entities/session'
import { contactChat, otherChat } from '@/test/fixtures/chats'
import { testCredentials } from '@/test/fixtures/credentials'
import { useChatsPersistence } from './useChatsPersistence'

const ID = testCredentials.idInstance

describe('useChatsPersistence', () => {
  beforeEach(() => {
    useChatStore.getState().reset()
    useSessionStore.setState({ session: null, remember: false })
  })

  it('restores chats of the current instance from the session storage', () => {
    saveChats('session', ID, [contactChat])
    useSessionStore.setState({ session: { credentials: testCredentials }, remember: false })

    renderHook(() => useChatsPersistence())

    expect(useChatStore.getState().chats).toEqual([contactChat])
  })

  it('saves chat changes to localStorage when the session is remembered', () => {
    useSessionStore.setState({ session: { credentials: testCredentials }, remember: true })
    renderHook(() => useChatsPersistence())

    act(() => useChatStore.getState().upsertChat(otherChat))

    expect(loadChats('local', ID)).toEqual([otherChat])
    expect(sessionStorage.getItem(CHATS_STORAGE_KEY)).toBeNull()
  })

  it('does nothing without a session', () => {
    renderHook(() => useChatsPersistence())

    act(() => useChatStore.getState().upsertChat(otherChat))

    expect(sessionStorage.getItem(CHATS_STORAGE_KEY)).toBeNull()
    expect(localStorage.getItem(CHATS_STORAGE_KEY)).toBeNull()
  })
})
