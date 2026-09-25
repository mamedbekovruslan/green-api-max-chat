import { describe, expect, it } from 'vitest'
import { historyToMessages } from './fromHistory'

describe('historyToMessages', () => {
  it('maps history items to messages in chronological order', () => {
    const messages = historyToMessages('5500000', [
      { idMessage: 'b', timestamp: 200, direction: 'incoming', text: 'Ответ', status: undefined },
      { idMessage: 'a', timestamp: 100, direction: 'outgoing', text: 'Вопрос', status: 'read' },
    ])

    expect(messages).toEqual([
      {
        id: 'a',
        chatId: '5500000',
        text: 'Вопрос',
        timestamp: 100_000,
        direction: 'outgoing',
        status: 'read',
      },
      {
        id: 'b',
        chatId: '5500000',
        text: 'Ответ',
        timestamp: 200_000,
        direction: 'incoming',
        status: null,
      },
    ])
  })
})
