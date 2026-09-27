import { isApiError, type GreenApiClient, type Notification } from '@/shared/api/green-api'
import { sleep, type Sleep } from '@/shared/lib/async'

export type ConnectionStatus = 'online' | 'reconnecting'

export interface NotificationPollingOptions {
  client: Pick<GreenApiClient, 'receiveNotification' | 'deleteNotification'>
  onNotification: (notification: Notification) => void
  onUnauthorized: () => void
  onStatusChange?: (status: ConnectionStatus) => void
  onHandlerError?: (error: unknown) => void
  receiveTimeout?: number
  minBackoffMs?: number
  maxBackoffMs?: number
  sleep?: Sleep
}

export function startNotificationPolling(options: NotificationPollingOptions): () => void {
  const controller = new AbortController()
  const stop = () => controller.abort()
  void runPolling(options, controller.signal, stop)
  return stop
}

async function runPolling(
  options: NotificationPollingOptions,
  signal: AbortSignal,
  stop: () => void,
): Promise<void> {
  const {
    client,
    receiveTimeout,
    minBackoffMs = 1000,
    maxBackoffMs = 30_000,
    sleep: wait = sleep,
  } = options
  let backoffMs = minBackoffMs
  let status: ConnectionStatus | null = null

  const setStatus = (next: ConnectionStatus) => {
    if (status === next) return
    status = next
    options.onStatusChange?.(next)
  }

  const handle = (notification: Notification) => {
    try {
      options.onNotification(notification)
    } catch (error) {
      options.onHandlerError?.(error)
    }
  }

  while (!signal.aborted) {
    try {
      const received = await client.receiveNotification({ receiveTimeout, signal })
      if (received) {
        handle(received.notification)
        await client.deleteNotification(received.receiptId, { signal })
      }
      backoffMs = minBackoffMs
      setStatus('online')
    } catch (error) {
      if (signal.aborted) return
      if (isApiError(error) && error.kind === 'unauthorized') {
        stop()
        options.onUnauthorized()
        return
      }
      setStatus('reconnecting')
      await wait(backoffMs, signal)
      backoffMs = Math.min(backoffMs * 2, maxBackoffMs)
    }
  }
}
