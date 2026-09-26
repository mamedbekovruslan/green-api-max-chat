import type { QueryClient } from '@tanstack/react-query'
import type { GreenApiClient } from '@/shared/api/green-api'
import { sleep, type Sleep } from '@/shared/lib/async'
import { chatMessagesQuery } from './chatMessagesQuery'

export const HISTORY_PREFETCH_PAUSE_MS = 1000

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
  let hasRequested = false
  for (const chatId of chatIds) {
    const query = chatMessagesQuery(client, idInstance, chatId)
    if (queryClient.getQueryData(query.queryKey) !== undefined) continue

    if (hasRequested) await wait(pauseMs, signal)
    if (signal.aborted) return
    hasRequested = true
    await queryClient.prefetchQuery(query)
  }
}
