import { create } from 'zustand'
import type { Chat } from './types'

interface ChatState {
  chats: Chat[]
  activeChatId: string | null
  setChats: (chats: Chat[]) => void
  upsertChat: (chat: Chat) => void
  openChat: (chatId: string) => void
  closeChat: () => void
  reset: () => void
}

export const useChatStore = create<ChatState>()((set) => ({
  chats: [],
  activeChatId: null,
  setChats: (chats) => set({ chats, activeChatId: null }),
  upsertChat: (chat) =>
    set((state) => {
      const exists = state.chats.some((item) => item.chatId === chat.chatId)
      return {
        chats: exists
          ? state.chats.map((item) => (item.chatId === chat.chatId ? { ...item, ...chat } : item))
          : [chat, ...state.chats],
      }
    }),
  openChat: (chatId) => set({ activeChatId: chatId }),
  closeChat: () => set({ activeChatId: null }),
  reset: () => set({ chats: [], activeChatId: null }),
}))
