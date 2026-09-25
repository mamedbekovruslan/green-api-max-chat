import { useMutation } from '@tanstack/react-query'
import type { Session } from '@/entities/session'
import { createGreenApiClient } from '@/shared/api/green-api'
import type { LoginFormValues } from '../model/loginForm'
import { verifyInstance } from '../model/verifyInstance'

export interface LoginCheckResult {
  session: Session
  remember: boolean
  warnings: string[]
}

export function useLogin() {
  return useMutation({
    mutationFn: async ({
      remember,
      ...credentials
    }: LoginFormValues): Promise<LoginCheckResult> => {
      const { wid, warnings } = await verifyInstance(createGreenApiClient(credentials))
      const session: Session = wid === undefined ? { credentials } : { credentials, wid }
      return { session, remember, warnings }
    },
  })
}
