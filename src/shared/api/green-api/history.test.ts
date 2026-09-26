import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { testCredentials } from '@/test/fixtures/credentials'
import {
  CONTACT_CHAT_ID,
  chatHistoryResponse,
  historyDeletedText,
  historyIncomingImage,
  historyIncomingText,
  historyOutgoingDelivered,
  historyOutgoingExtendedText,
} from '@/test/fixtures/greenApi'
import { greenApiUrl } from '@/test/msw/greenApi'
import { server } from '@/test/msw/server'
import { createGreenApiClient } from './client'
import { parseHistoryItem } from './schemas'

describe('parseHistoryItem', () => {
  it('parses an incoming text message', () => {
    expect(parseHistoryItem(historyIncomingText)).toEqual({
      idMessage: '117331909909756411',
      timestamp: 1790342900,
      direction: 'incoming',
      text: 'Входящее сообщение',
      status: undefined,
      unread: false,
    })
  })

  it('marks incoming messages that are not read yet as unread', () => {
    expect(parseHistoryItem({ ...historyIncomingText, isRead: false })).toMatchObject({
      unread: true,
    })
    expect(parseHistoryItem({ ...historyOutgoingDelivered, isRead: false })).toMatchObject({
      unread: false,
    })
  })

  it('parses an outgoing extended text message with its status', () => {
    expect(parseHistoryItem(historyOutgoingExtendedText)).toEqual({
      idMessage: '1790342846743',
      timestamp: 1790342846,
      direction: 'outgoing',
      text: 'Исходящее сообщение',
      status: 'read',
      unread: false,
    })
  })

  it('maps outgoing statuses', () => {
    expect(parseHistoryItem(historyOutgoingDelivered)).toMatchObject({ status: 'delivered' })
    expect(
      parseHistoryItem({ ...historyOutgoingDelivered, statusMessage: undefined }),
    ).toMatchObject({ status: 'sent' })
    expect(
      parseHistoryItem({ ...historyOutgoingDelivered, statusMessage: 'noAccount' }),
    ).toMatchObject({ status: 'failed' })
  })

  it.each([
    ['non-text messages', historyIncomingImage],
    ['deleted messages', historyDeletedText],
    ['items of an unknown shape', { type: 'incoming', idMessage: 1 }],
    ['items of an unknown direction', { ...historyIncomingText, type: 'system' }],
  ])('skips %s', (_, item) => {
    expect(parseHistoryItem(item)).toBeNull()
  })
})

describe('client.getChatHistory', () => {
  it('requests the last 100 messages and keeps only text ones', async () => {
    server.use(
      http.post(greenApiUrl('getChatHistory'), async ({ request }) => {
        expect(await request.json()).toEqual({ chatId: CONTACT_CHAT_ID, count: 100 })
        return HttpResponse.json(chatHistoryResponse)
      }),
    )

    const messages = await createGreenApiClient(testCredentials).getChatHistory(CONTACT_CHAT_ID)

    expect(messages.map((message) => message.idMessage)).toEqual([
      historyIncomingText.idMessage,
      historyOutgoingExtendedText.idMessage,
      historyOutgoingDelivered.idMessage,
    ])
  })
})
