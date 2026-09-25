import { describe, expect, it } from 'vitest'
import type { Message } from './types'
import { patchMessage, upsertMessage } from './updateMessages'

const message: Message = {
  id: 'local-1',
  chatId: '1',
  text: 'Привет',
  timestamp: 1,
  direction: 'outgoing',
  status: 'pending',
  failureReason: null,
}

describe('upsertMessage', () => {
  it('appends a new message', () => {
    expect(upsertMessage(undefined, message)).toEqual([message])
  })

  it('replaces a message with the same id', () => {
    const updated = { ...message, status: 'sent' as const }

    expect(upsertMessage([message], updated)).toEqual([updated])
  })
})

describe('patchMessage', () => {
  it('patches the matching message only', () => {
    const other = { ...message, id: 'local-2' }

    expect(patchMessage([message, other], 'local-1', { id: '179', status: 'sent' })).toEqual([
      { ...message, id: '179', status: 'sent' },
      other,
    ])
  })

  it('keeps an empty cache empty', () => {
    expect(patchMessage(undefined, 'local-1', { status: 'sent' })).toBeUndefined()
  })
})
