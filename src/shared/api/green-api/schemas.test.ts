import { describe, expect, it } from 'vitest'
import {
  CONTACT_CHAT_ID,
  CONTACT_PHONE,
  incomingExtendedTextBody,
  incomingImageBody,
  incomingTextBody,
  outgoingStatusBody,
  quotaExceededBody,
  stateChangedBody,
} from '@/test/fixtures/greenApi'
import { parseNotificationBody } from './schemas'

describe('parseNotificationBody', () => {
  it('parses an incoming text message', () => {
    expect(parseNotificationBody(incomingTextBody)).toEqual({
      type: 'incomingText',
      idMessage: '117331909909756411',
      chatId: CONTACT_CHAT_ID,
      timestamp: 1790342863,
      text: 'Текст ответа',
      senderName: 'Имя в контактах',
      senderPhone: CONTACT_PHONE,
    })
  })

  it('parses an incoming extended text message', () => {
    expect(parseNotificationBody(incomingExtendedTextBody)).toMatchObject({
      type: 'incomingText',
      text: 'Ссылка https://example.com',
    })
  })

  it('falls back to senderName and tolerates missing optional sender fields', () => {
    const body = {
      ...incomingTextBody,
      senderData: { chatId: CONTACT_CHAT_ID, senderName: 'Имя в профиле', senderContactName: '' },
    }
    expect(parseNotificationBody(body)).toMatchObject({
      type: 'incomingText',
      senderName: 'Имя в профиле',
      senderPhone: undefined,
    })
  })

  it('treats non-text incoming messages as unknown', () => {
    expect(parseNotificationBody(incomingImageBody)).toEqual({
      type: 'unknown',
      typeWebhook: 'incomingMessageReceived',
    })
  })

  it('treats an incoming message without chatId as unknown', () => {
    const body = { ...incomingTextBody, senderData: { senderName: 'Без chatId' } }
    expect(parseNotificationBody(body)).toMatchObject({ type: 'unknown' })
  })

  it('parses an outgoing message status', () => {
    expect(parseNotificationBody(outgoingStatusBody)).toEqual({
      type: 'outgoingStatus',
      idMessage: '1790342846743',
      chatId: CONTACT_CHAT_ID,
      timestamp: 1790342846,
      status: 'delivered',
    })
  })

  it.each([
    ['sent', 'sent'],
    ['delivered', 'delivered'],
    ['read', 'read'],
    ['failed', 'failed'],
    ['noAccount', 'failed'],
    ['yellowCard', 'failed'],
  ])('maps status %s to %s', (status, expected) => {
    expect(parseNotificationBody({ ...outgoingStatusBody, status })).toMatchObject({
      status: expected,
    })
  })

  it('parses quotaExceeded', () => {
    expect(parseNotificationBody(quotaExceededBody)).toEqual({ type: 'quotaExceeded' })
  })

  it('returns unknown with typeWebhook for other notifications', () => {
    expect(parseNotificationBody(stateChangedBody)).toEqual({
      type: 'unknown',
      typeWebhook: 'stateInstanceChanged',
    })
  })

  it.each([null, undefined, 'text', 42, [], { typeWebhook: 1 }])(
    'returns unknown without typeWebhook for %j',
    (body) => {
      expect(parseNotificationBody(body)).toEqual({ type: 'unknown', typeWebhook: undefined })
    },
  )
})
