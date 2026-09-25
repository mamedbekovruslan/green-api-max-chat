import { useMemo } from 'react'
import { createGreenApiClient, type GreenApiClient } from '@/shared/api/green-api'
import { useSessionStore } from './store'

export function useGreenApiClient(): GreenApiClient {
  const credentials = useSessionStore((state) => state.session?.credentials)
  if (!credentials) throw new Error('useGreenApiClient requires an active session')

  return useMemo(() => createGreenApiClient(credentials), [credentials])
}
