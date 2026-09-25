import { screen, within } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { beforeEach, describe, expect, it } from 'vitest'
import { useChatStore } from '@/entities/chat'
import { useSessionStore } from '@/entities/session'
import { contactChat } from '@/test/fixtures/chats'
import { testCredentials } from '@/test/fixtures/credentials'
import { chatHistoryResponse } from '@/test/fixtures/greenApi'
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
})
