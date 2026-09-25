import { create } from 'zustand'
import { clearSession, loadSession, saveSession, type Session } from './persistence'

interface SessionState {
  session: Session | null
  remember: boolean
  login: (session: Session, options: { remember: boolean }) => void
  logout: () => void
}

const stored = loadSession()

export const useSessionStore = create<SessionState>()((set) => ({
  session: stored?.session ?? null,
  remember: stored?.remember ?? false,
  login: (session, { remember }) => {
    saveSession(session, remember)
    set({ session, remember })
  },
  logout: () => {
    clearSession()
    set({ session: null, remember: false })
  },
}))
