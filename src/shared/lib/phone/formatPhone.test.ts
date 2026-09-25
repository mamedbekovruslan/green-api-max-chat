import { describe, expect, it } from 'vitest'
import { formatPhone, phoneFromWid } from './formatPhone'

describe('formatPhone', () => {
  it('formats Russian numbers', () => {
    expect(formatPhone('79990000000')).toBe('+7 999 000-00-00')
  })

  it('prefixes other numbers with a plus', () => {
    expect(formatPhone('380501234567')).toBe('+380501234567')
  })
})

describe('phoneFromWid', () => {
  it('takes the phone part of wid', () => {
    expect(phoneFromWid('79990000001@c.us')).toBe('+7 999 000-00-01')
  })
})
