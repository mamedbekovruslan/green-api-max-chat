import { describe, expect, it } from 'vitest'
import type { Message } from '../model/types'
import { formatDay, formatListTime, formatTime } from './formatDate'
import { groupByDay } from './groupByDay'

function message(id: string, date: Date): Message {
  return {
    id,
    chatId: '1',
    text: id,
    timestamp: date.getTime(),
    direction: 'incoming',
    status: null,
    failureReason: null,
  }
}

describe('formatDate', () => {
  it('formats time as HH:mm', () => {
    expect(formatTime(new Date(2026, 4, 25, 9, 5).getTime())).toBe('09:05')
  })

  it('formats the day without the year suffix', () => {
    expect(formatDay(new Date(2026, 4, 25, 14, 33).getTime())).toBe('25 мая 2026')
  })
})

describe('groupByDay', () => {
  it('inserts a day separator before the first message of each day', () => {
    const items = groupByDay([
      message('a', new Date(2026, 4, 25, 10, 0)),
      message('b', new Date(2026, 4, 25, 23, 59)),
      message('c', new Date(2026, 4, 29, 7, 14)),
    ])

    expect(items.map((item) => (item.type === 'day' ? item.label : item.message.id))).toEqual([
      '25 мая 2026',
      'a',
      'b',
      '29 мая 2026',
      'c',
    ])
  })

  it('returns nothing for no messages', () => {
    expect(groupByDay([])).toEqual([])
  })
})

describe('formatListTime', () => {
  it('shows the time for today and a short date otherwise', () => {
    const now = new Date(2026, 8, 25, 18, 0).getTime()

    expect(formatListTime(new Date(2026, 8, 25, 16, 27).getTime(), now)).toBe('16:27')
    expect(formatListTime(new Date(2026, 8, 22, 10, 0).getTime(), now)).toBe('22 сент.')
  })
})
