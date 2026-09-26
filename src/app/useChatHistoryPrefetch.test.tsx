import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { StrictMode } from 'react'
import { beforeEach, describe, expect, it } from 'vitest'
import { saveChats, useChatStore } from '@/entities/chat'
import { useSessionStore } from '@/entities/session'
import { contactChat } from '@/test/fixtures/chats'
import { testCredentials } from '@/test/fixtures/credentials'
import { historyIncomingText, historyOutgoingDelivered } from '@/test/fixtures/greenApi'
import { greenApiUrl } from '@/test/msw/greenApi'
import { server } from '@/test/msw/server'
import { App } from './App'

describe('restoring chats after a reload', () => {
  beforeEach(() => {
    useSessionStore.setState({ session: null, remember: false })
    useChatStore.getState().reset()
  })

  it('shows unread badges and previews from the server history and marks the chat read', async () => {
    let historyRequests = 0
    const readChats: unknown[] = []
    server.use(
      http.post(greenApiUrl('getChatHistory'), () => {
        historyRequests += 1
        return HttpResponse.json([
          { ...historyIncomingText, textMessage: 'Непрочитанный ответ', isRead: false },
          historyOutgoingDelivered,
        ])
      }),
      http.post(greenApiUrl('readChat'), async ({ request }) => {
        readChats.push(await request.json())
        return HttpResponse.json({ setRead: true })
      }),
    )
    saveChats('session', testCredentials.idInstance, [contactChat])
    useSessionStore.getState().login({ credentials: testCredentials }, { remember: false })
    const user = userEvent.setup()

    render(
      <StrictMode>
        <App />
      </StrictMode>,
    )

    const list = screen.getByRole('list', { name: 'Список чатов' })
    const item = await within(list).findByRole('button', { name: /Непрочитанных: 1/ })
    expect(item).toHaveTextContent('Непрочитанный ответ')
    expect(readChats).toEqual([])

    await user.click(item)

    await expect.poll(() => readChats).toEqual([{ chatId: contactChat.chatId }])
    expect(within(list).queryByRole('button', { name: /Непрочитанных/ })).not.toBeInTheDocument()
    expect(historyRequests).toBe(1)
  })
})
