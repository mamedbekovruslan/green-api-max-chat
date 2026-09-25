import type { Message } from '../model/types'
import { dayKey, formatDay } from './formatDate'

export type FeedItem =
  { type: 'day'; key: string; label: string } | { type: 'message'; key: string; message: Message }

export function groupByDay(messages: Message[]): FeedItem[] {
  const items: FeedItem[] = []
  let currentDay: string | null = null

  for (const message of messages) {
    const day = dayKey(message.timestamp)
    if (day !== currentDay) {
      currentDay = day
      items.push({ type: 'day', key: `day-${day}`, label: formatDay(message.timestamp) })
    }
    items.push({ type: 'message', key: message.id, message })
  }
  return items
}
