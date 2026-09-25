import { act, screen, waitFor, within } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { useChatStore } from '@/entities/chat'
import { messagesQueryKey, type Message } from '@/entities/message'
import { useSessionStore } from '@/entities/session'
import { contactChat, otherChat } from '@/test/fixtures/chats'
import { testCredentials } from '@/test/fixtures/credentials'
import { renderWithProviders } from '@/test/renderWithProviders'
import { Sidebar } from './Sidebar'

describe('Sidebar', () => {
  beforeEach(() => {
    useSessionStore.setState({
      session: { credentials: testCredentials, wid: '79990000001@c.us' },
      remember: false,
    })
    useChatStore.getState().reset()
  })

  it('shows a hint when there are no chats', () => {
    renderWithProviders(<Sidebar />)

    expect(screen.getByText(/Чатов пока нет/)).toBeInTheDocument()
  })

  it('lists chats and opens the selected one', async () => {
    useChatStore.getState().setChats([contactChat, otherChat])
    const { user } = renderWithProviders(<Sidebar />)

    const list = screen.getByRole('list', { name: 'Список чатов' })
    expect(within(list).getAllByRole('button')).toHaveLength(2)

    await user.click(screen.getByRole('button', { name: /Другой контакт/ }))

    expect(useChatStore.getState().activeChatId).toBe(otherChat.chatId)
    expect(screen.getByRole('button', { name: /Другой контакт/ })).toHaveAttribute(
      'aria-current',
      'true',
    )
  })

  it('filters chats by the search query', async () => {
    useChatStore.getState().setChats([contactChat, otherChat])
    const { user } = renderWithProviders(<Sidebar />)

    await user.type(screen.getByRole('searchbox', { name: 'Поиск по чатам' }), 'другой')

    expect(screen.getByRole('button', { name: /Другой контакт/ })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Имя в контактах/ })).not.toBeInTheDocument()

    await user.type(screen.getByRole('searchbox', { name: 'Поиск по чатам' }), 'xyz')

    expect(screen.getByText('Ничего не найдено')).toBeInTheDocument()
  })

  it('switches to the new chat panel and back', async () => {
    const { user } = renderWithProviders(<Sidebar />)

    await user.click(screen.getByRole('button', { name: 'Новый чат' }))
    expect(screen.getByRole('heading', { name: 'Новый чат' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Назад' }))
    expect(screen.getByRole('heading', { name: 'Чаты' })).toBeInTheDocument()
  })

  it('shows the account phone and logs out after confirmation', async () => {
    useChatStore.getState().setChats([contactChat])
    const { user } = renderWithProviders(<Sidebar />)

    expect(screen.getByText('+7 999 000-00-01')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Выйти' }))
    expect(screen.getByRole('alertdialog', { name: 'Выйти из аккаунта?' })).toBeInTheDocument()
    expect(useSessionStore.getState().session).not.toBeNull()

    await user.click(screen.getByRole('button', { name: 'Да' }))

    expect(useSessionStore.getState().session).toBeNull()
    expect(useChatStore.getState().chats).toEqual([])
  })

  it('stays logged in when logout is not confirmed', async () => {
    useChatStore.getState().setChats([contactChat])
    const { user } = renderWithProviders(<Sidebar />)
    const logoutButton = screen.getByRole('button', { name: 'Выйти' })

    await user.click(logoutButton)
    await user.click(screen.getByRole('button', { name: 'Нет' }))

    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
    expect(useSessionStore.getState().session).not.toBeNull()
    expect(useChatStore.getState().chats).toEqual([contactChat])
    expect(logoutButton).toHaveFocus()
  })

  it('shows the phone until messages are loaded, then the last message', async () => {
    useChatStore.getState().setChats([contactChat])
    const { queryClient } = renderWithProviders(<Sidebar />)
    const item = screen.getByRole('button', { name: /Имя в контактах/ })
    expect(item).toHaveTextContent('+7 999 000-00-00')

    const lastMessage: Message = {
      id: '1',
      chatId: contactChat.chatId,
      text: 'Последнее сообщение',
      timestamp: new Date(2026, 8, 22, 10, 0).getTime(),
      direction: 'incoming',
      status: null,
      failureReason: null,
    }
    act(() =>
      queryClient.setQueryData(messagesQueryKey(testCredentials.idInstance, contactChat.chatId), [
        lastMessage,
      ]),
    )

    await waitFor(() => expect(item).toHaveTextContent('Последнее сообщение'))
    expect(item).toHaveTextContent('22 сент.')
    expect(item).not.toHaveTextContent('+7 999 000-00-00')
  })
})
