import { create } from 'zustand'
import { clearSession, loadSession, saveSession, type Session } from './persistence'

interface SessionState {
  session: Session | null
  login: (session: Session, options: { remember: boolean }) => void
  logout: () => void
}

export const useSessionStore = create<SessionState>()((set) => ({
  session: loadSession(),
  login: (session, { remember }) => {
    saveSession(session, remember)
    set({ session })
  },
  logout: () => {
    clearSession()
    set({ session: null })
  },
}))
