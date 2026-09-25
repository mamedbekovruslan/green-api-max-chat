import type { HistoryMessage } from '@/shared/api/green-api'
import type { Message } from './types'

export function historyToMessages(chatId: string, history: HistoryMessage[]): Message[] {
  return history
    .map((item) => ({
      id: item.idMessage,
      chatId,
      text: item.text,
      timestamp: item.timestamp * 1000,
      direction: item.direction,
      status: item.status ?? null,
      failureReason: null,
    }))
    .sort((a, b) => a.timestamp - b.timestamp)
}
