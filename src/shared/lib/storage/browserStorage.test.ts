import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import { readJson, removeItem, storageKindFor, writeJson } from './browserStorage'

const schema = z.object({ value: z.number() })

describe('browserStorage', () => {
  it('writes and reads JSON from the chosen storage', () => {
    writeJson('session', 'key', { value: 1 })

    expect(readJson('session', 'key', schema)).toEqual({ value: 1 })
    expect(readJson('local', 'key', schema)).toBeNull()
  })

  it.each([
    ['malformed JSON', '{oops'],
    ['data not matching the schema', JSON.stringify({ value: 'one' })],
  ])('discards %s', (_, raw) => {
    localStorage.setItem('key', raw)

    expect(readJson('local', 'key', schema)).toBeNull()
    expect(localStorage.getItem('key')).toBeNull()
  })

  it('removes an item', () => {
    writeJson('local', 'key', { value: 1 })

    removeItem('local', 'key')

    expect(localStorage.getItem('key')).toBeNull()
  })

  it('maps the remember option to a storage kind', () => {
    expect(storageKindFor(true)).toBe('local')
    expect(storageKindFor(false)).toBe('session')
  })
})
