import { describe, expect, it, vi } from 'vitest'
import { ApiError, type Notification, type ReceivedNotification } from '@/shared/api/green-api'
import { NotificationPoller, type NotificationPollerOptions } from './NotificationPoller'

type Step = ReceivedNotification | null | Error

const unknown = (typeWebhook: string): Notification => ({ type: 'unknown', typeWebhook })
const received = (receiptId: number, typeWebhook = `n${receiptId}`): ReceivedNotification => ({
  receiptId,
  notification: unknown(typeWebhook),
})

function waitForAbort(signal: AbortSignal | undefined): Promise<never> {
  return new Promise((_, reject) => {
    signal?.addEventListener('abort', () => reject(new ApiError('aborted')), { once: true })
  })
}

function createHarness(steps: Step[], options: Partial<NotificationPollerOptions> = {}) {
  const log: string[] = []
  const sleeps: number[] = []
  let active = 0
  let maxActive = 0
  let finish: () => void = () => {}
  const exhausted = new Promise<void>((resolve) => {
    finish = resolve
  })

  const client = {
    receiveNotification: vi.fn(async ({ signal }: { signal?: AbortSignal | undefined } = {}) => {
      active += 1
      maxActive = Math.max(maxActive, active)
      log.push('receive')
      try {
        const step = steps.shift()
        if (step === undefined) {
          finish()
          return await waitForAbort(signal)
        }
        if (step instanceof Error) throw step
        return step
      } finally {
        active -= 1
      }
    }),
    deleteNotification: vi.fn(async (receiptId: number) => {
      log.push(`delete ${receiptId}`)
      return true
    }),
  }

  const onNotification = vi.fn((notification: Notification) => {
    log.push(`handle ${notification.type === 'unknown' ? notification.typeWebhook : ''}`)
  })
  const onUnauthorized = vi.fn()
  const onStatusChange = vi.fn()

  const poller = new NotificationPoller({
    client,
    onNotification,
    onUnauthorized,
    onStatusChange,
    sleep: async (ms) => {
      sleeps.push(ms)
    },
    ...options,
  })

  return {
    poller,
    client,
    log,
    sleeps,
    onNotification,
    onUnauthorized,
    onStatusChange,
    exhausted,
    maxActive: () => maxActive,
  }
}

describe('NotificationPoller', () => {
  it('handles notifications in order and deletes each one after handling', async () => {
    const harness = createHarness([received(1), null, received(2)])

    harness.poller.start()
    await harness.exhausted
    harness.poller.stop()

    expect(harness.log).toEqual([
      'receive',
      'handle n1',
      'delete 1',
      'receive',
      'receive',
      'handle n2',
      'delete 2',
      'receive',
    ])
  })

  it('deletes a notification even when handling it fails', async () => {
    const onHandlerError = vi.fn()
    const harness = createHarness([received(1)], {
      onNotification: () => {
        throw new Error('handler failed')
      },
      onHandlerError,
    })

    harness.poller.start()
    await harness.exhausted
    harness.poller.stop()

    expect(onHandlerError).toHaveBeenCalledOnce()
    expect(harness.client.deleteNotification).toHaveBeenCalledWith(1, expect.anything())
  })

  it('never runs two requests at the same time, even if started twice', async () => {
    const harness = createHarness([received(1), received(2), null])

    harness.poller.start()
    harness.poller.start()
    await harness.exhausted
    harness.poller.stop()

    expect(harness.maxActive()).toBe(1)
  })

  it('backs off exponentially on errors and resets after a success', async () => {
    const network = () => new ApiError('network')
    const harness = createHarness([network(), network(), network(), network(), null, network()], {
      minBackoffMs: 1000,
      maxBackoffMs: 5000,
    })

    harness.poller.start()
    await harness.exhausted
    harness.poller.stop()

    expect(harness.sleeps).toEqual([1000, 2000, 4000, 5000, 1000])
  })

  it('reports connection status changes', async () => {
    const harness = createHarness([new ApiError('network'), null])

    harness.poller.start()
    await harness.exhausted
    harness.poller.stop()

    expect(harness.onStatusChange.mock.calls).toEqual([['reconnecting'], ['online']])
  })

  it('stops and reports when the token is rejected', async () => {
    const harness = createHarness([new ApiError('unauthorized', { status: 401 }), received(1)])

    harness.poller.start()
    await vi.waitFor(() => expect(harness.onUnauthorized).toHaveBeenCalledOnce())

    expect(harness.poller.isRunning).toBe(false)
    expect(harness.client.receiveNotification).toHaveBeenCalledOnce()
    expect(harness.onNotification).not.toHaveBeenCalled()
  })

  it('stop() aborts the pending request and ends the loop', async () => {
    const harness = createHarness([])

    harness.poller.start()
    await harness.exhausted
    harness.poller.stop()
    await Promise.resolve()

    expect(harness.poller.isRunning).toBe(false)
    expect(harness.client.receiveNotification).toHaveBeenCalledOnce()
    expect(harness.sleeps).toEqual([])
  })
})
