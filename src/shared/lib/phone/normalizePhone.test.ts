import { describe, expect, it } from 'vitest'
import { normalizePhone } from './normalizePhone'

describe('normalizePhone', () => {
  it.each([
    ['+7 (999) 000-00-00', '79990000000'],
    ['79990000000', '79990000000'],
    ['8 999 000 00 00', '79990000000'],
    ['9990000000', '79990000000'],
    ['+380 50 123 4567', '380501234567'],
    ['  +7 999 000-00-00  ', '79990000000'],
  ])('normalizes %j to %s', (input, expected) => {
    expect(normalizePhone(input)).toBe(expected)
  })

  it.each(['', '12345', '+7 999 abc 00 00', '7999000000012345', '79990000000@c.us'])(
    'rejects %j',
    (input) => {
      expect(normalizePhone(input)).toBeNull()
    },
  )
})
