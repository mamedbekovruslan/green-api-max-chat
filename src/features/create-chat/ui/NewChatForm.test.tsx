import { screen } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useChatStore } from '@/entities/chat'
import { useSessionStore } from '@/entities/session'
import { testCredentials } from '@/test/fixtures/credentials'
import { CONTACT_CHAT_ID, contactInfoResponse } from '@/test/fixtures/greenApi'
import { greenApiUrl } from '@/test/msw/greenApi'
import { server } from '@/test/msw/server'
import { renderWithProviders } from '@/test/renderWithProviders'
import { INVALID_PHONE_MESSAGE } from '../model/resolveChat'
import { NewChatForm } from './NewChatForm'

function mockCheckAccount(exist: boolean) {
  server.use(
    http.post(greenApiUrl('checkAccount'), () =>
      HttpResponse.json({ exist, chatId: exist ? CONTACT_CHAT_ID : '', fromCache: true }),
    ),
    http.post(greenApiUrl('getContactInfo'), () => HttpResponse.json(contactInfoResponse)),
  )
}

function renderForm() {
  const onClose = vi.fn()
  const view = renderWithProviders(<NewChatForm onClose={onClose} />)
  return { ...view, onClose, phone: screen.getByLabelText('Номер телефона') }
}

describe('NewChatForm', () => {
  beforeEach(() => {
    useSessionStore.setState({ session: { credentials: testCredentials }, remember: false })
    useChatStore.getState().reset()
  })

  it('validates the phone before calling the API', async () => {
    const { user, phone } = renderForm()

    await user.type(phone, '123')
    await user.click(screen.getByRole('button', { name: 'Создать чат' }))

    expect(screen.getByText(INVALID_PHONE_MESSAGE)).toBeInTheDocument()
    expect(phone).toHaveAttribute('aria-invalid', 'true')
  })

  it('creates the chat, opens it and closes the panel', async () => {
    mockCheckAccount(true)
    const { user, phone, onClose } = renderForm()

    await user.type(phone, '+7 999 000-00-00')
    await user.click(screen.getByRole('button', { name: 'Создать чат' }))

    await expect.poll(() => onClose.mock.calls.length).toBe(1)
    expect(useChatStore.getState()).toMatchObject({
      activeChatId: CONTACT_CHAT_ID,
      chats: [{ chatId: CONTACT_CHAT_ID, name: 'Имя в контактах' }],
    })
  })

  it('shows an error when the phone is not registered in MAX', async () => {
    mockCheckAccount(false)
    const { user, phone, onClose } = renderForm()

    await user.type(phone, '+7 999 000-00-00')
    await user.click(screen.getByRole('button', { name: 'Создать чат' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Этот номер не зарегистрирован в MAX',
    )
    expect(onClose).not.toHaveBeenCalled()
  })

  it('closes on "Назад"', async () => {
    const { user, onClose } = renderForm()

    await user.click(screen.getByRole('button', { name: 'Назад' }))

    expect(onClose).toHaveBeenCalledOnce()
  })
})
