import { beforeEach, describe, expect, it } from 'vitest'
import { contactChat, otherChat } from '@/test/fixtures/chats'
import { useChatStore } from './store'

describe('useChatStore', () => {
  beforeEach(() => {
    useChatStore.getState().reset()
  })

  it('adds new chats to the top of the list', () => {
    useChatStore.getState().upsertChat(contactChat)
    useChatStore.getState().upsertChat(otherChat)

    expect(useChatStore.getState().chats.map((chat) => chat.chatId)).toEqual([
      otherChat.chatId,
      contactChat.chatId,
    ])
  })

  it('updates an existing chat in place', () => {
    useChatStore.getState().setChats([contactChat, otherChat])

    useChatStore.getState().upsertChat({ ...otherChat, name: 'Новое имя' })

    expect(useChatStore.getState().chats).toEqual([
      contactChat,
      { ...otherChat, name: 'Новое имя' },
    ])
  })

  it('opens and closes a chat', () => {
    useChatStore.getState().openChat(contactChat.chatId)
    expect(useChatStore.getState().activeChatId).toBe(contactChat.chatId)

    useChatStore.getState().closeChat()
    expect(useChatStore.getState().activeChatId).toBeNull()
  })

  it('reset clears chats and the active chat', () => {
    useChatStore.getState().setChats([contactChat])
    useChatStore.getState().openChat(contactChat.chatId)

    useChatStore.getState().reset()

    expect(useChatStore.getState()).toMatchObject({ chats: [], activeChatId: null })
  })

  it('moves a chat to the top', () => {
    useChatStore.getState().setChats([contactChat, otherChat])

    useChatStore.getState().bumpChat(otherChat.chatId)

    expect(useChatStore.getState().chats.map((chat) => chat.chatId)).toEqual([
      otherChat.chatId,
      contactChat.chatId,
    ])
  })

  it('counts unread messages', () => {
    useChatStore.getState().setChats([contactChat])
    useChatStore.getState().incrementUnread(contactChat.chatId)
    useChatStore.getState().incrementUnread(contactChat.chatId)

    expect(useChatStore.getState().unread[contactChat.chatId]).toBe(2)
  })

  it('sets the unread count and drops it at zero', () => {
    useChatStore.getState().setUnread(contactChat.chatId, 3)
    expect(useChatStore.getState().unread[contactChat.chatId]).toBe(3)

    useChatStore.getState().setUnread(contactChat.chatId, 0)
    expect(useChatStore.getState().unread).toEqual({})
  })

  it('stores a preview per chat', () => {
    useChatStore.getState().setPreview(contactChat.chatId, { text: 'Привет', timestamp: 1 })

    expect(useChatStore.getState().previews[contactChat.chatId]).toEqual({
      text: 'Привет',
      timestamp: 1,
    })
  })
})
