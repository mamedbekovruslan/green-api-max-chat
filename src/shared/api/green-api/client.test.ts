import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { testCredentials } from '@/test/fixtures/credentials'
import {
  CONTACT_CHAT_ID,
  CONTACT_PHONE,
  contactInfoResponse,
  incomingTextBody,
  settingsResponse,
} from '@/test/fixtures/greenApi'
import { greenApiUrl } from '@/test/msw/greenApi'
import { server } from '@/test/msw/server'
import { createGreenApiClient, MAX_MESSAGE_LENGTH } from './client'

const client = createGreenApiClient(testCredentials)

describe('createGreenApiClient', () => {
  it('getStateInstance returns the state string', async () => {
    server.use(
      http.get(greenApiUrl('getStateInstance'), () =>
        HttpResponse.json({ stateInstance: 'authorized' }),
      ),
    )

    await expect(client.getStateInstance()).resolves.toBe('authorized')
  })

  it('getSettings returns the fields the app relies on', async () => {
    server.use(http.get(greenApiUrl('getSettings'), () => HttpResponse.json(settingsResponse)))

    await expect(client.getSettings()).resolves.toEqual({
      wid: '79990000001@c.us',
      webhookUrl: '',
      incomingWebhook: 'yes',
      outgoingWebhook: 'yes',
    })
  })

  describe('checkAccount', () => {
    it('sends the phone as a number and returns the internal chatId', async () => {
      server.use(
        http.post(greenApiUrl('checkAccount'), async ({ request }) => {
          expect(await request.json()).toEqual({ phoneNumber: Number(CONTACT_PHONE) })
          return HttpResponse.json({ exist: true, chatId: CONTACT_CHAT_ID, fromCache: true })
        }),
      )

      await expect(client.checkAccount(CONTACT_PHONE)).resolves.toBe(CONTACT_CHAT_ID)
    })

    it('returns null when the account does not exist', async () => {
      server.use(
        http.post(greenApiUrl('checkAccount'), () =>
          HttpResponse.json({ exist: false, chatId: '', fromCache: true }),
        ),
      )

      await expect(client.checkAccount(CONTACT_PHONE)).resolves.toBeNull()
    })

    it.each(['', '123', '+79990000000', '7999000000012345'])(
      'rejects %j without a request',
      async (phone) => {
        await expect(client.checkAccount(phone)).rejects.toBeInstanceOf(RangeError)
      },
    )
  })

  it('getContactInfo posts chatId and returns contact details', async () => {
    server.use(
      http.post(greenApiUrl('getContactInfo'), async ({ request }) => {
        expect(await request.json()).toEqual({ chatId: CONTACT_CHAT_ID })
        return HttpResponse.json(contactInfoResponse)
      }),
    )

    await expect(client.getContactInfo(CONTACT_CHAT_ID)).resolves.toMatchObject({
      chatId: CONTACT_CHAT_ID,
      name: 'Имя в профиле',
      contactName: 'Имя в контактах',
      avatar: 'https://i.oneme.ru/i?r=avatar',
    })
  })

  it('readChat posts chatId and returns the setRead flag', async () => {
    server.use(
      http.post(greenApiUrl('readChat'), async ({ request }) => {
        expect(await request.json()).toEqual({ chatId: CONTACT_CHAT_ID })
        return HttpResponse.json({ setRead: true })
      }),
    )

    await expect(client.readChat(CONTACT_CHAT_ID)).resolves.toBe(true)
  })

  describe('sendMessage', () => {
    it('posts chatId and message and returns idMessage', async () => {
      server.use(
        http.post(greenApiUrl('sendMessage'), async ({ request }) => {
          expect(await request.json()).toEqual({ chatId: CONTACT_CHAT_ID, message: 'Привет' })
          return HttpResponse.json({ idMessage: '1790342846743' })
        }),
      )

      await expect(client.sendMessage(CONTACT_CHAT_ID, 'Привет')).resolves.toBe('1790342846743')
    })

    it.each([
      ['empty', ''],
      ['whitespace only', '   \n'],
      ['too long', 'a'.repeat(MAX_MESSAGE_LENGTH + 1)],
    ])('rejects %s message without a request', async (_, message) => {
      await expect(client.sendMessage(CONTACT_CHAT_ID, message)).rejects.toBeInstanceOf(RangeError)
    })

    it('accepts a message of exactly the maximum length', async () => {
      server.use(http.post(greenApiUrl('sendMessage'), () => HttpResponse.json({ idMessage: '1' })))

      await expect(
        client.sendMessage(CONTACT_CHAT_ID, 'a'.repeat(MAX_MESSAGE_LENGTH)),
      ).resolves.toBe('1')
    })
  })

  describe('receiveNotification', () => {
    it('returns null when the queue is empty', async () => {
      server.use(http.get(greenApiUrl('receiveNotification'), () => HttpResponse.json(null)))

      await expect(client.receiveNotification()).resolves.toBeNull()
    })

    it('passes receiveTimeout and returns the parsed notification', async () => {
      server.use(
        http.get(greenApiUrl('receiveNotification'), ({ request }) => {
          expect(new URL(request.url).searchParams.get('receiveTimeout')).toBe('5')
          return HttpResponse.json({ receiptId: 2, body: incomingTextBody })
        }),
      )

      await expect(client.receiveNotification({ receiveTimeout: 5 })).resolves.toEqual({
        receiptId: 2,
        notification: expect.objectContaining({ type: 'incomingText', text: 'Текст ответа' }),
      })
    })

    it('keeps notifications with an unexpected body as unknown', async () => {
      server.use(
        http.get(greenApiUrl('receiveNotification'), () =>
          HttpResponse.json({ receiptId: 3, body: { typeWebhook: 'somethingNew' } }),
        ),
      )

      await expect(client.receiveNotification()).resolves.toEqual({
        receiptId: 3,
        notification: { type: 'unknown', typeWebhook: 'somethingNew' },
      })
    })
  })

  it('deleteNotification sends DELETE with receiptId', async () => {
    server.use(
      http.delete(`${greenApiUrl('deleteNotification')}/:receiptId`, ({ params }) => {
        expect(params.receiptId).toBe('2')
        return HttpResponse.json({ result: true, reason: '' })
      }),
    )

    await expect(client.deleteNotification(2)).resolves.toBe(true)
  })
})
