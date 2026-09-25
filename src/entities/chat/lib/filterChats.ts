import type { Chat } from '../model/types'

export function filterChats(chats: Chat[], query: string): Chat[] {
  const text = query.trim().toLowerCase()
  if (text === '') return chats

  const digits = text.replace(/\D/g, '')
  return chats.filter(
    (chat) =>
      chat.name.toLowerCase().includes(text) ||
      (digits !== '' && chat.phone !== null && chat.phone.includes(digits)),
  )
}
