import { isApiError, type GreenApiClient, type Notification } from '@/shared/api/green-api'
import { sleep, type Sleep } from '@/shared/lib/async'

export type ConnectionStatus = 'online' | 'reconnecting'

export interface NotificationPollerOptions {
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

export class NotificationPoller {
  readonly #options: NotificationPollerOptions
  #controller: AbortController | null = null
  #status: ConnectionStatus | null = null

  constructor(options: NotificationPollerOptions) {
    this.#options = options
  }

  get isRunning(): boolean {
    return this.#controller !== null
  }

  start(): void {
    if (this.#controller) return
    const controller = new AbortController()
    this.#controller = controller
    void this.#run(controller.signal)
  }

  stop(): void {
    this.#controller?.abort()
    this.#controller = null
  }

  async #run(signal: AbortSignal): Promise<void> {
    const {
      client,
      receiveTimeout,
      minBackoffMs = 1000,
      maxBackoffMs = 30_000,
      sleep: wait = sleep,
    } = this.#options
    let backoffMs = minBackoffMs

    while (!signal.aborted) {
      try {
        const received = await client.receiveNotification({ receiveTimeout, signal })
        if (received) {
          this.#handle(received.notification)
          await client.deleteNotification(received.receiptId, { signal })
        }
        backoffMs = minBackoffMs
        this.#setStatus('online')
      } catch (error) {
        if (signal.aborted) return
        if (isApiError(error) && error.kind === 'unauthorized') {
          this.stop()
          this.#options.onUnauthorized()
          return
        }
        this.#setStatus('reconnecting')
        await wait(backoffMs, signal)
        backoffMs = Math.min(backoffMs * 2, maxBackoffMs)
      }
    }
  }

  #handle(notification: Notification): void {
    try {
      this.#options.onNotification(notification)
    } catch (error) {
      this.#options.onHandlerError?.(error)
    }
  }

  #setStatus(status: ConnectionStatus): void {
    if (this.#status === status) return
    this.#status = status
    this.#options.onStatusChange?.(status)
  }
}
