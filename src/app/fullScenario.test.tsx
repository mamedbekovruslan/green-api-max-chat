import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { delay, http, HttpResponse } from 'msw'
import { beforeEach, describe, expect, it } from 'vitest'
import { useChatStore } from '@/entities/chat'
import { useSessionStore } from '@/entities/session'
import { testCredentials } from '@/test/fixtures/credentials'
import {
  CONTACT_CHAT_ID,
  CONTACT_PHONE,
  contactInfoResponse,
  settingsResponse,
} from '@/test/fixtures/greenApi'
import { greenApiUrl } from '@/test/msw/greenApi'
import { server } from '@/test/msw/server'
import { App } from './App'

const SENT_ID = '1790400000000'
const TOKEN = 'f00dbabe0123456789abcdef0123456789abcdef0123456789'

function statusNotification(receiptId: number, status: 'delivered' | 'read') {
  return {
    receiptId,
    body: {
      typeWebhook: 'outgoingMessageStatus',
      chatId: CONTACT_CHAT_ID,
      timestamp: 1790400001 + receiptId,
      idMessage: SENT_ID,
      status,
    },
  }
}

const replyNotification = {
  receiptId: 2,
  body: {
    typeWebhook: 'incomingMessageReceived',
    idMessage: 'reply-1',
    timestamp: 1790400005,
    senderData: { chatId: CONTACT_CHAT_ID, senderContactName: 'Имя в контактах' },
    messageData: {
      typeMessage: 'textMessage',
      textMessageData: { textMessage: 'Привет, как дела?' },
    },
  },
}

function setupServer() {
  const queue: unknown[] = []
  const sent: unknown[] = []
  const deleted: string[] = []
  const readChats: unknown[] = []
  server.use(
    http.get(greenApiUrl('getStateInstance'), () =>
      HttpResponse.json({ stateInstance: 'authorized' }),
    ),
    http.get(greenApiUrl('getSettings'), () => HttpResponse.json(settingsResponse)),
    http.post(greenApiUrl('checkAccount'), () =>
      HttpResponse.json({ exist: true, chatId: CONTACT_CHAT_ID, fromCache: true }),
    ),
    http.post(greenApiUrl('getContactInfo'), () => HttpResponse.json(contactInfoResponse)),
    http.post(greenApiUrl('getChatHistory'), () => HttpResponse.json([])),
    http.post(greenApiUrl('sendMessage'), async ({ request }) => {
      sent.push(await request.json())
      return HttpResponse.json({ idMessage: SENT_ID })
    }),
    http.post(greenApiUrl('readChat'), async ({ request }) => {
      readChats.push(await request.json())
      return HttpResponse.json({ setRead: true })
    }),
    http.get(greenApiUrl('receiveNotification'), async () => {
      const next = queue.shift()
      if (next) return HttpResponse.json(next)
      await delay(20)
      return HttpResponse.json(null)
    }),
    http.delete(`${greenApiUrl('deleteNotification')}/:receiptId`, ({ params }) => {
      deleted.push(String(params.receiptId))
      return HttpResponse.json({ result: true, reason: '' })
    }),
  )
  return { queue, sent, deleted, readChats }
}

describe('full scenario', () => {
  beforeEach(() => {
    useSessionStore.setState({ session: null, remember: false })
    useChatStore.getState().reset()
  })

  it('logs in, creates a chat, sends a message and receives the reply with read receipts', async () => {
    const api = setupServer()
    const user = userEvent.setup()
    render(<App />)

    await user.type(screen.getByLabelText('idInstance'), testCredentials.idInstance)
    await user.type(screen.getByLabelText('apiTokenInstance'), TOKEN)
    await user.click(screen.getByRole('button', { name: 'Войти' }))

    await user.click(await screen.findByRole('button', { name: 'Новый чат' }))
    await user.type(screen.getByLabelText('Номер телефона'), '+7 999 000-00-00')
    await user.click(screen.getByRole('button', { name: 'Создать чат' }))

    const chatWindow = await screen.findByRole('region', { name: 'Чат с Имя в контактах' })
    await within(chatWindow).findByText('Сообщений пока нет. Напишите первым!')

    await user.type(within(chatWindow).getByRole('textbox', { name: 'Сообщение' }), 'Привет{Enter}')

    const feed = await within(chatWindow).findByRole('log', { name: 'Сообщения' })
    expect(within(feed).getByText('Привет')).toBeInTheDocument()
    expect(await within(feed).findByRole('img', { name: 'Отправлено' })).toBeInTheDocument()
    expect(api.sent).toEqual([{ chatId: CONTACT_CHAT_ID, message: 'Привет' }])

    api.queue.push(statusNotification(1, 'delivered'))
    expect(await within(feed).findByRole('img', { name: 'Доставлено' })).toBeInTheDocument()

    api.queue.push(replyNotification)
    expect(await within(feed).findByText('Привет, как дела?')).toBeInTheDocument()

    api.queue.push(statusNotification(3, 'read'))
    expect(await within(feed).findByRole('img', { name: 'Прочитано' })).toBeInTheDocument()

    await expect.poll(() => api.deleted).toEqual(['1', '2', '3'])
    expect(api.readChats).toEqual([{ chatId: CONTACT_CHAT_ID }])
    expect(useChatStore.getState().chats).toEqual([
      expect.objectContaining({ chatId: CONTACT_CHAT_ID, phone: CONTACT_PHONE }),
    ])
    expect(document.body.textContent).not.toContain(TOKEN)
  })
})
