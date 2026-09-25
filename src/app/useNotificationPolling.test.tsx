import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { delay, http, HttpResponse } from 'msw'
import { beforeEach, describe, expect, it } from 'vitest'
import { saveChats, useChatStore } from '@/entities/chat'
import { useSessionStore } from '@/entities/session'
import { contactChat, otherChat } from '@/test/fixtures/chats'
import { testCredentials } from '@/test/fixtures/credentials'
import { historyOutgoingDelivered } from '@/test/fixtures/greenApi'
import { greenApiUrl } from '@/test/msw/greenApi'
import { server } from '@/test/msw/server'
import { App } from './App'

function login() {
  saveChats('session', testCredentials.idInstance, [contactChat, otherChat])
  useSessionStore.getState().login({ credentials: testCredentials }, { remember: false })
}

describe('receiving messages', () => {
  beforeEach(() => {
    useSessionStore.setState({ session: null, remember: false })
    useChatStore.getState().reset()
  })

  it('shows replies, read receipts and unread badges as notifications arrive', async () => {
    let releaseQueue: () => void = () => {}
    const historyLoaded = new Promise<void>((resolve) => {
      releaseQueue = resolve
    })
    const queue = [
      {
        receiptId: 1,
        body: {
          typeWebhook: 'incomingMessageReceived',
          idMessage: 'in-1',
          timestamp: 1790342900,
          senderData: { chatId: contactChat.chatId, senderContactName: contactChat.name },
          messageData: {
            typeMessage: 'textMessage',
            textMessageData: { textMessage: 'Ответ из MAX' },
          },
        },
      },
      {
        receiptId: 2,
        body: {
          typeWebhook: 'outgoingMessageStatus',
          idMessage: historyOutgoingDelivered.idMessage,
          chatId: contactChat.chatId,
          timestamp: 1790342901,
          status: 'read',
        },
      },
      {
        receiptId: 3,
        body: {
          typeWebhook: 'incomingMessageReceived',
          idMessage: 'in-2',
          timestamp: 1790342902,
          senderData: { chatId: otherChat.chatId, senderContactName: otherChat.name },
          messageData: {
            typeMessage: 'textMessage',
            textMessageData: { textMessage: 'Привет от другого' },
          },
        },
      },
    ]
    const deleted: string[] = []
    server.use(
      http.post(greenApiUrl('getChatHistory'), () => HttpResponse.json([historyOutgoingDelivered])),
      http.get(greenApiUrl('receiveNotification'), async () => {
        await historyLoaded
        const next = queue.shift()
        if (!next) await delay('infinite')
        return HttpResponse.json(next)
      }),
      http.delete(`${greenApiUrl('deleteNotification')}/:receiptId`, ({ params }) => {
        deleted.push(String(params.receiptId))
        return HttpResponse.json({ result: true, reason: '' })
      }),
    )
    login()
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: /Имя в контактах/ }))

    const feed = await screen.findByRole('log', { name: 'Сообщения' })
    releaseQueue()
    expect(await within(feed).findByText('Ответ из MAX')).toBeInTheDocument()
    expect(await within(feed).findByRole('img', { name: 'Прочитано' })).toBeInTheDocument()

    const list = screen.getByRole('list', { name: 'Список чатов' })
    const otherItem = await within(list).findByRole('button', { name: /Непрочитанных: 1/ })
    expect(otherItem).toHaveTextContent('Привет от другого')
    expect(within(list).getAllByRole('button')[0]).toBe(otherItem)
    await expect.poll(() => deleted).toEqual(['1', '2', '3'])

    await user.click(otherItem)

    expect(within(list).queryByRole('button', { name: /Непрочитанных/ })).not.toBeInTheDocument()
  })

  it('logs out when the token is rejected while polling', async () => {
    server.use(
      http.get(greenApiUrl('receiveNotification'), () => new HttpResponse(null, { status: 401 })),
    )
    login()

    render(<App />)

    expect(await screen.findByRole('heading', { name: 'Вход в MAX Chat' })).toBeInTheDocument()
    expect(sessionStorage.length).toBe(0)
  })
})
