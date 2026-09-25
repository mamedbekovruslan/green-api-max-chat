import { create } from 'zustand'
import type { Chat } from './types'

export interface ChatPreview {
  text: string
  timestamp: number
}

interface ChatState {
  chats: Chat[]
  activeChatId: string | null
  unread: Record<string, number>
  previews: Record<string, ChatPreview>
  setChats: (chats: Chat[]) => void
  upsertChat: (chat: Chat) => void
  bumpChat: (chatId: string) => void
  openChat: (chatId: string) => void
  closeChat: () => void
  incrementUnread: (chatId: string) => void
  setPreview: (chatId: string, preview: ChatPreview) => void
  reset: () => void
}

const initialState = {
  chats: [],
  activeChatId: null,
  unread: {},
  previews: {},
}

export const useChatStore = create<ChatState>()((set) => ({
  ...initialState,
  setChats: (chats) => set({ ...initialState, chats }),
  upsertChat: (chat) =>
    set((state) => {
      const exists = state.chats.some((item) => item.chatId === chat.chatId)
      return {
        chats: exists
          ? state.chats.map((item) => (item.chatId === chat.chatId ? { ...item, ...chat } : item))
          : [chat, ...state.chats],
      }
    }),
  bumpChat: (chatId) =>
    set((state) => {
      const chat = state.chats.find((item) => item.chatId === chatId)
      if (!chat || state.chats[0] === chat) return state
      return { chats: [chat, ...state.chats.filter((item) => item !== chat)] }
    }),
  openChat: (chatId) =>
    set((state) => {
      const { [chatId]: _, ...unread } = state.unread
      return { activeChatId: chatId, unread }
    }),
  closeChat: () => set({ activeChatId: null }),
  incrementUnread: (chatId) =>
    set((state) => ({ unread: { ...state.unread, [chatId]: (state.unread[chatId] ?? 0) + 1 } })),
  setPreview: (chatId, preview) =>
    set((state) => ({ previews: { ...state.previews, [chatId]: preview } })),
  reset: () => set(initialState),
}))
