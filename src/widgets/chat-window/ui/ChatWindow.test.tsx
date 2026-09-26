import { screen, within } from '@testing-library/react'
import { delay, http, HttpResponse } from 'msw'
import { beforeEach, describe, expect, it } from 'vitest'
import { useChatStore } from '@/entities/chat'
import { useSessionStore } from '@/entities/session'
import { contactChat } from '@/test/fixtures/chats'
import { testCredentials } from '@/test/fixtures/credentials'
import { chatHistoryResponse, historyIncomingText } from '@/test/fixtures/greenApi'
import { greenApiUrl } from '@/test/msw/greenApi'
import { server } from '@/test/msw/server'
import { renderWithProviders } from '@/test/renderWithProviders'
import { ChatWindow } from './ChatWindow'

function openContactChat() {
  useChatStore.getState().setChats([contactChat])
  useChatStore.getState().openChat(contactChat.chatId)
}

describe('ChatWindow', () => {
  beforeEach(() => {
    useSessionStore.setState({ session: { credentials: testCredentials }, remember: false })
    useChatStore.getState().reset()
  })

  it('asks to choose a chat when none is active', () => {
    renderWithProviders(<ChatWindow />)

    expect(screen.getByText('Выберите чат или создайте новый')).toBeInTheDocument()
  })

  it('shows the header and the text messages of the active chat', async () => {
    server.use(
      http.post(greenApiUrl('getChatHistory'), () => HttpResponse.json(chatHistoryResponse)),
    )
    openContactChat()

    renderWithProviders(<ChatWindow />)

    expect(screen.getByRole('heading', { name: 'Имя в контактах' })).toBeInTheDocument()
    expect(screen.getByText('+7 999 000-00-00')).toBeInTheDocument()
    expect(screen.getByText('Загрузка сообщений…')).toBeInTheDocument()

    const feed = await screen.findByRole('log', { name: 'Сообщения' })
    expect(
      within(feed)
        .getAllByText(/сообщение/i)
        .map((node) => node.textContent),
    ).toEqual(['Сообщение за прошлый день', 'Исходящее сообщение', 'Входящее сообщение'])
    expect(within(feed).getByRole('img', { name: 'Прочитано' })).toBeInTheDocument()
  })

  it('marks the chat as read when it has unread messages', async () => {
    const readChats: unknown[] = []
    server.use(
      http.post(greenApiUrl('getChatHistory'), () =>
        HttpResponse.json([{ ...historyIncomingText, isRead: false }]),
      ),
      http.post(greenApiUrl('readChat'), async ({ request }) => {
        readChats.push(await request.json())
        return HttpResponse.json({ setRead: true })
      }),
    )
    openContactChat()

    renderWithProviders(<ChatWindow />)

    await screen.findByRole('log', { name: 'Сообщения' })
    await expect.poll(() => readChats).toEqual([{ chatId: contactChat.chatId }])
    expect(useChatStore.getState().unread).toEqual({})
  })

  it('does not mark a chat without unread messages as read', async () => {
    let readChatCalls = 0
    server.use(
      http.post(greenApiUrl('getChatHistory'), () => HttpResponse.json(chatHistoryResponse)),
      http.post(greenApiUrl('readChat'), () => {
        readChatCalls += 1
        return HttpResponse.json({ setRead: true })
      }),
    )
    openContactChat()

    renderWithProviders(<ChatWindow />)

    await screen.findByRole('log', { name: 'Сообщения' })
    expect(readChatCalls).toBe(0)
  })

  it('closes the chat with the back button', async () => {
    server.use(http.post(greenApiUrl('getChatHistory'), () => HttpResponse.json([])))
    openContactChat()
    const { user } = renderWithProviders(<ChatWindow />)

    await user.click(screen.getByRole('button', { name: 'Назад к чатам' }))

    expect(useChatStore.getState().activeChatId).toBeNull()
    expect(screen.getByText('Выберите чат или создайте новый')).toBeInTheDocument()
  })

  it('shows an empty state for a chat without messages', async () => {
    server.use(http.post(greenApiUrl('getChatHistory'), () => HttpResponse.json([])))
    openContactChat()

    renderWithProviders(<ChatWindow />)

    expect(await screen.findByText('Сообщений пока нет. Напишите первым!')).toBeInTheDocument()
  })

  it('shows an error with a retry button when history fails to load', async () => {
    let attempts = 0
    server.use(
      http.post(greenApiUrl('getChatHistory'), () => {
        attempts += 1
        return attempts === 1
          ? new HttpResponse(null, { status: 500 })
          : HttpResponse.json(chatHistoryResponse)
      }),
    )
    openContactChat()
    const { user } = renderWithProviders(<ChatWindow />)

    expect(await screen.findByRole('alert')).toHaveTextContent('Не удалось загрузить историю')

    await user.click(screen.getByRole('button', { name: 'Повторить' }))

    expect(await screen.findByRole('log', { name: 'Сообщения' })).toBeInTheDocument()
  })

  it('keeps the input disabled until the history is loaded', async () => {
    server.use(http.post(greenApiUrl('getChatHistory'), () => HttpResponse.json([])))
    openContactChat()

    renderWithProviders(<ChatWindow />)

    const input = screen.getByRole('textbox', { name: 'Сообщение' })
    expect(input).toBeDisabled()
    await screen.findByText('Сообщений пока нет. Напишите первым!')
    expect(input).toBeEnabled()
  })

  it('shows a sent message immediately and marks it as sent', async () => {
    server.use(
      http.post(greenApiUrl('getChatHistory'), () => HttpResponse.json([])),
      http.post(greenApiUrl('sendMessage'), async ({ request }) => {
        expect(await request.json()).toEqual({ chatId: contactChat.chatId, message: 'Привет' })
        await delay(50)
        return HttpResponse.json({ idMessage: '1790400000000' })
      }),
    )
    openContactChat()
    const { user } = renderWithProviders(<ChatWindow />)
    const input = await screen.findByRole('textbox', { name: 'Сообщение' })
    await screen.findByText('Сообщений пока нет. Напишите первым!')

    await user.type(input, 'Привет{Enter}')

    const feed = await screen.findByRole('log', { name: 'Сообщения' })
    expect(within(feed).getByText('Привет')).toBeInTheDocument()
    expect(within(feed).getByRole('img', { name: 'Отправляется' })).toBeInTheDocument()
    expect(await within(feed).findByRole('img', { name: 'Отправлено' })).toBeInTheDocument()
  })

  it('marks a failed message and sends it again on retry', async () => {
    let attempts = 0
    server.use(
      http.post(greenApiUrl('getChatHistory'), () => HttpResponse.json([])),
      http.post(greenApiUrl('sendMessage'), () => {
        attempts += 1
        return attempts === 1
          ? HttpResponse.json({ quotaData: {} }, { status: 466 })
          : HttpResponse.json({ idMessage: '1790400000001' })
      }),
    )
    openContactChat()
    const { user } = renderWithProviders(<ChatWindow />)
    await screen.findByText('Сообщений пока нет. Напишите первым!')

    await user.type(screen.getByRole('textbox', { name: 'Сообщение' }), 'Привет{Enter}')

    const feed = await screen.findByRole('log', { name: 'Сообщения' })
    expect(await within(feed).findByRole('img', { name: 'Не отправлено' })).toBeInTheDocument()
    expect(within(feed).getByText(/Превышен лимит тарифа/)).toBeInTheDocument()

    await user.click(within(feed).getByRole('button', { name: 'Повторить' }))

    expect(await within(feed).findByRole('img', { name: 'Отправлено' })).toBeInTheDocument()
    expect(within(feed).getAllByText('Привет')).toHaveLength(1)
    expect(within(feed).queryByText(/Превышен лимит тарифа/)).not.toBeInTheDocument()
  })
})
