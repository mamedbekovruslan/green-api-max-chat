import { describe, expect, it } from 'vitest'
import { contactChat } from '@/test/fixtures/chats'
import { clearChats, CHATS_STORAGE_KEY, loadChats, saveChats } from './persistence'

describe('chats persistence', () => {
  it('saves and loads chats for the same instance', () => {
    saveChats('session', '1234567890', [contactChat])

    expect(loadChats('session', '1234567890')).toEqual([contactChat])
    expect(loadChats('local', '1234567890')).toEqual([])
  })

  it('ignores chats saved for another instance', () => {
    saveChats('local', '1111111111', [contactChat])

    expect(loadChats('local', '1234567890')).toEqual([])
  })

  it('discards invalid stored data', () => {
    localStorage.setItem(CHATS_STORAGE_KEY, JSON.stringify({ idInstance: '1', chats: [{}] }))

    expect(loadChats('local', '1')).toEqual([])
    expect(localStorage.getItem(CHATS_STORAGE_KEY)).toBeNull()
  })

  it('clearChats removes chats from both storages', () => {
    saveChats('session', '1', [contactChat])
    saveChats('local', '1', [contactChat])

    clearChats()

    expect(sessionStorage.getItem(CHATS_STORAGE_KEY)).toBeNull()
    expect(localStorage.getItem(CHATS_STORAGE_KEY)).toBeNull()
  })
})
