import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useChatStore } from '@/entities/chat'
import { messagesQueryKey, type Message } from '@/entities/message'
import type { Notification } from '@/shared/api/green-api'
import { contactChat, otherChat } from '@/test/fixtures/chats'
import { createTestQueryClient } from '@/test/queryWrapper'
import { advanceStatus, applyNotification, type NotificationContext } from './applyNotification'

const ID = '1234567890'

const incoming = (patch: Partial<Extract<Notification, { type: 'incomingText' }>> = {}) =>
  ({
    type: 'incomingText',
    idMessage: 'in-1',
    chatId: contactChat.chatId,
    timestamp: 1790342863,
    text: 'Ответ',
    senderName: 'Имя в контактах',
    senderPhone: contactChat.phone ?? undefined,
    ...patch,
  }) satisfies Notification

const outgoing: Message = {
  id: 'out-1',
  chatId: contactChat.chatId,
  text: 'Вопрос',
  timestamp: 1_790_342_846_000,
  direction: 'outgoing',
  status: 'sent',
  failureReason: null,
}

function createContext(): NotificationContext {
  return {
    queryClient: createTestQueryClient(),
    idInstance: ID,
    seenMessageIds: new Set(),
    onQuotaExceeded: vi.fn(),
  }
}

const cached = (context: NotificationContext, chatId = contactChat.chatId) =>
  context.queryClient.getQueryData<Message[]>(messagesQueryKey(ID, chatId))

describe('applyNotification: incoming text', () => {
  beforeEach(() => {
    useChatStore.getState().setChats([otherChat, contactChat])
  })

  it('appends the message to a loaded chat history', () => {
    const context = createContext()
    context.queryClient.setQueryData(messagesQueryKey(ID, contactChat.chatId), [outgoing])

    applyNotification(incoming(), context)

    expect(cached(context)?.map((message) => message.text)).toEqual(['Вопрос', 'Ответ'])
  })

  it('does not create a partial history for a chat that was never opened', () => {
    const context = createContext()

    applyNotification(incoming(), context)

    expect(cached(context)).toBeUndefined()
  })

  it('reloads the history when the message arrives while it is loading', () => {
    const context = createContext()
    const queryKey = messagesQueryKey(ID, contactChat.chatId)
    void context.queryClient.fetchQuery({
      queryKey,
      queryFn: () => new Promise<Message[]>(() => {}),
    })
    const invalidate = vi.spyOn(context.queryClient, 'invalidateQueries')

    applyNotification(incoming(), context)

    expect(invalidate).toHaveBeenCalledWith({ queryKey })
  })

  it('updates the preview, moves the chat to the top and counts it as unread', () => {
    applyNotification(incoming(), createContext())

    const state = useChatStore.getState()
    expect(state.chats[0]?.chatId).toBe(contactChat.chatId)
    expect(state.previews[contactChat.chatId]).toEqual({
      text: 'Ответ',
      timestamp: 1_790_342_863_000,
    })
    expect(state.unread[contactChat.chatId]).toBe(1)
  })

  it('ignores a notification delivered twice', () => {
    const context = createContext()
    context.queryClient.setQueryData(messagesQueryKey(ID, contactChat.chatId), [outgoing])

    applyNotification(incoming(), context)
    applyNotification(incoming(), context)

    expect(cached(context)).toHaveLength(2)
    expect(useChatStore.getState().unread[contactChat.chatId]).toBe(1)
  })

  it('creates a chat for an unknown sender', () => {
    applyNotification(
      incoming({ chatId: '7700000', senderName: 'Новый контакт', senderPhone: '79990000009' }),
      createContext(),
    )

    expect(useChatStore.getState().chats[0]).toEqual({
      chatId: '7700000',
      phone: '79990000009',
      name: 'Новый контакт',
      avatarUrl: null,
    })
  })

  it('names an unknown sender without a name by the phone', () => {
    applyNotification(
      incoming({ chatId: '7700000', senderName: undefined, senderPhone: '79990000009' }),
      createContext(),
    )

    expect(useChatStore.getState().chats[0]?.name).toBe('+7 999 000-00-09')
  })
})

describe('applyNotification: outgoing status', () => {
  it('advances the status of a sent message', () => {
    const context = createContext()
    context.queryClient.setQueryData(messagesQueryKey(ID, contactChat.chatId), [outgoing])

    applyNotification(
      {
        type: 'outgoingStatus',
        idMessage: 'out-1',
        chatId: contactChat.chatId,
        timestamp: 1,
        status: 'read',
      },
      context,
    )

    expect(cached(context)?.[0]?.status).toBe('read')
  })

  it('ignores statuses of unknown messages and chats', () => {
    const context = createContext()

    expect(() =>
      applyNotification(
        { type: 'outgoingStatus', idMessage: 'x', chatId: 'y', timestamp: 1, status: 'read' },
        context,
      ),
    ).not.toThrow()
    expect(cached(context, 'y')).toBeUndefined()
  })
})

describe('applyNotification: other types', () => {
  it('reports an exceeded quota', () => {
    const context = createContext()

    applyNotification({ type: 'quotaExceeded' }, context)

    expect(context.onQuotaExceeded).toHaveBeenCalledOnce()
  })

  it('ignores unknown notifications', () => {
    const context = createContext()

    applyNotification({ type: 'unknown', typeWebhook: 'stateInstanceChanged' }, context)

    expect(context.onQuotaExceeded).not.toHaveBeenCalled()
  })
})

describe('advanceStatus', () => {
  it.each([
    ['sent', 'delivered', 'delivered'],
    ['delivered', 'read', 'read'],
    ['read', 'delivered', 'read'],
    ['pending', 'read', 'read'],
    ['sent', 'failed', 'failed'],
    ['delivered', 'failed', 'delivered'],
    [null, 'sent', 'sent'],
  ] as const)('%s + %s → %s', (current, next, expected) => {
    expect(advanceStatus(current, next)).toBe(expected)
  })
})
