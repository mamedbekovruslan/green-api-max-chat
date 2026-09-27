import type { QueryClient } from '@tanstack/react-query'
import type { GreenApiClient } from '@/shared/api/green-api'
import { sleep, type Sleep } from '@/shared/lib/async'
import { chatMessagesQuery } from './chatMessagesQuery'
import { useHistoryQueueStore } from './historyQueueStore'

export const HISTORY_PREFETCH_PAUSE_MS = 1200

export interface PrefetchChatHistoriesOptions {
  queryClient: QueryClient
  client: GreenApiClient
  idInstance: string
  chatIds: string[]
  signal: AbortSignal
  pauseMs?: number
  sleep?: Sleep
}

export async function prefetchChatHistories({
  queryClient,
  client,
  idInstance,
  chatIds,
  signal,
  pauseMs = HISTORY_PREFETCH_PAUSE_MS,
  sleep: wait = sleep,
}: PrefetchChatHistoriesOptions): Promise<void> {
  const queries = chatIds
    .map((chatId) => ({ chatId, query: chatMessagesQuery(client, idInstance, chatId) }))
    .filter(({ query }) => queryClient.getQueryData(query.queryKey) === undefined)
  const queue = useHistoryQueueStore.getState()
  queue.setQueued(queries.map(({ chatId }) => chatId))

  for (const [index, { chatId, query }] of queries.entries()) {
    if (index > 0) await wait(pauseMs, signal)
    if (signal.aborted) return
    await queryClient.prefetchQuery(query)
    queue.dequeue(chatId)
  }
}
