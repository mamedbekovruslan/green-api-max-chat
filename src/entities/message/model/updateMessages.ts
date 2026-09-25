import type { Message } from './types'

export function upsertMessage(messages: Message[] | undefined, message: Message): Message[] {
  const list = messages ?? []
  return list.some((item) => item.id === message.id)
    ? list.map((item) => (item.id === message.id ? message : item))
    : [...list, message]
}

export function patchMessage(
  messages: Message[] | undefined,
  id: string,
  patch: Partial<Omit<Message, 'chatId' | 'direction'>>,
): Message[] | undefined {
  return messages?.map((item) => (item.id === id ? { ...item, ...patch } : item))
}
