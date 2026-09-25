import { create } from 'zustand'
import type { ConnectionStatus } from './NotificationPoller'

interface ConnectionState {
  status: ConnectionStatus
  quotaExceeded: boolean
  setStatus: (status: ConnectionStatus) => void
  setQuotaExceeded: () => void
  reset: () => void
}

export const useConnectionStore = create<ConnectionState>()((set) => ({
  status: 'online',
  quotaExceeded: false,
  setStatus: (status) => set({ status }),
  setQuotaExceeded: () => set({ quotaExceeded: true }),
  reset: () => set({ status: 'online', quotaExceeded: false }),
}))
