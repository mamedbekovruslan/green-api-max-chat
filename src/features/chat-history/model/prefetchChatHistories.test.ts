import { http, HttpResponse } from 'msw'
import { beforeEach, describe, expect, it } from 'vitest'
import { useChatStore } from '@/entities/chat'
import { messagesQueryKey, type Message } from '@/entities/message'
import { createGreenApiClient } from '@/shared/api/green-api'
import { contactChat, otherChat } from '@/test/fixtures/chats'
import { testCredentials } from '@/test/fixtures/credentials'
import { historyIncomingText, historyOutgoingDelivered } from '@/test/fixtures/greenApi'
import { greenApiUrl } from '@/test/msw/greenApi'
import { server } from '@/test/msw/server'
import { createTestQueryClient } from '@/test/queryWrapper'
import { useHistoryQueueStore } from './historyQueueStore'
import { prefetchChatHistories, type PrefetchChatHistoriesOptions } from './prefetchChatHistories'

const ID = testCredentials.idInstance

function setup(patch: Partial<PrefetchChatHistoriesOptions> = {}) {
  const requested: string[] = []
  const events: string[] = []
  server.use(
    http.post(greenApiUrl('getChatHistory'), async ({ request }) => {
      const { chatId } = (await request.json()) as { chatId: string }
      requested.push(chatId)
      events.push(`request ${chatId}`)
      return chatId === contactChat.chatId
        ? HttpResponse.json([
            { ...historyIncomingText, idMessage: 'in-2', timestamp: 1790343000, isRead: false },
            { ...historyIncomingText, isRead: false },
            historyOutgoingDelivered,
          ])
        : HttpResponse.json([historyOutgoingDelivered])
    }),
  )
  const queryClient = createTestQueryClient()
  const options: PrefetchChatHistoriesOptions = {
    queryClient,
    client: createGreenApiClient(testCredentials),
    idInstance: ID,
    chatIds: [contactChat.chatId, otherChat.chatId],
    signal: new AbortController().signal,
    sleep: async (ms) => {
      events.push(`pause ${ms}`)
    },
    ...patch,
  }
  return { queryClient, options, requested, events }
}

const cached = (queryClient: ReturnType<typeof createTestQueryClient>, chatId: string) =>
  queryClient.getQueryData<Message[]>(messagesQueryKey(ID, chatId))

describe('prefetchChatHistories', () => {
  beforeEach(() => {
    useChatStore.getState().setChats([contactChat, otherChat])
    useHistoryQueueStore.getState().setQueued([])
  })

  it('keeps the chats that wait for their history in the queue', async () => {
    const snapshots: string[][] = []
    const { options, queryClient } = setup({
      sleep: async () => {
        snapshots.push(useHistoryQueueStore.getState().queued)
      },
    })
    queryClient.setQueryData(messagesQueryKey(ID, 'cached'), [])

    await prefetchChatHistories({ ...options, chatIds: ['cached', ...options.chatIds] })

    expect(snapshots).toEqual([[otherChat.chatId]])
    expect(useHistoryQueueStore.getState().queued).toEqual([])
  })

  it('loads histories one by one with a pause between requests', async () => {
    const { options, events } = setup()

    await prefetchChatHistories(options)

    expect(events).toEqual([
      `request ${contactChat.chatId}`,
      'pause 1200',
      `request ${otherChat.chatId}`,
    ])
  })

  it('puts the messages into the chat cache and counts unread ones', async () => {
    const { options, queryClient } = setup()

    await prefetchChatHistories(options)

    expect(cached(queryClient, contactChat.chatId)?.at(-1)?.id).toBe('in-2')
    expect(cached(queryClient, otherChat.chatId)).toHaveLength(1)
    expect(useChatStore.getState().unread).toEqual({ [contactChat.chatId]: 2 })
  })

  it('skips chats whose history is already loaded', async () => {
    const { options, queryClient, requested } = setup()
    queryClient.setQueryData(messagesQueryKey(ID, contactChat.chatId), [])

    await prefetchChatHistories(options)

    expect(requested).toEqual([otherChat.chatId])
  })

  it('continues with the next chat when a request fails', async () => {
    const { options, queryClient } = setup()
    server.use(
      http.post(greenApiUrl('getChatHistory'), async ({ request }) => {
        const { chatId } = (await request.json()) as { chatId: string }
        return chatId === contactChat.chatId
          ? new HttpResponse(null, { status: 500 })
          : HttpResponse.json([historyOutgoingDelivered])
      }),
    )

    await prefetchChatHistories(options)

    expect(cached(queryClient, contactChat.chatId)).toBeUndefined()
    expect(cached(queryClient, otherChat.chatId)).toHaveLength(1)
    expect(useHistoryQueueStore.getState().queued).toEqual([])
  })

  it('retries after 429 and keeps the chat in the queue meanwhile', async () => {
    let attempts = 0
    const queuedDuringRetry: boolean[] = []
    const { options, queryClient } = setup({ chatIds: [contactChat.chatId] })
    server.use(
      http.post(greenApiUrl('getChatHistory'), () => {
        attempts += 1
        queuedDuringRetry.push(useHistoryQueueStore.getState().queued.includes(contactChat.chatId))
        return attempts === 1
          ? new HttpResponse(null, { status: 429 })
          : HttpResponse.json([historyOutgoingDelivered])
      }),
    )

    await prefetchChatHistories(options)

    expect(attempts).toBe(2)
    expect(queuedDuringRetry).toEqual([true, true])
    expect(cached(queryClient, contactChat.chatId)).toHaveLength(1)
  })

  it('stops when aborted', async () => {
    const controller = new AbortController()
    const { options, requested } = setup({
      signal: controller.signal,
      sleep: async () => controller.abort(),
    })

    await prefetchChatHistories(options)

    expect(requested).toEqual([contactChat.chatId])
  })
})
