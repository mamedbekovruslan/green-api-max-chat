import { create } from 'zustand'

interface HistoryQueueState {
  queued: string[]
  setQueued: (chatIds: string[]) => void
  dequeue: (chatId: string) => void
}

export const useHistoryQueueStore = create<HistoryQueueState>()((set) => ({
  queued: [],
  setQueued: (chatIds) => set({ queued: chatIds }),
  dequeue: (chatId) => set((state) => ({ queued: state.queued.filter((id) => id !== chatId) })),
}))

export function useIsHistoryQueued(chatId: string): boolean {
  return useHistoryQueueStore((state) => state.queued.includes(chatId))
}
