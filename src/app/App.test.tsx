import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { saveChats, useChatStore } from '@/entities/chat'
import { useSessionStore } from '@/entities/session'
import { contactChat } from '@/test/fixtures/chats'
import { testCredentials } from '@/test/fixtures/credentials'
import { App } from './App'

describe('App', () => {
  beforeEach(() => {
    useSessionStore.setState({ session: null, remember: false })
    useChatStore.getState().reset()
  })

  it('shows the login page without a session', () => {
    render(<App />)

    expect(screen.getByRole('heading', { name: 'Вход в MAX Chat' })).toBeInTheDocument()
  })

  it('shows the chat page with a session and logs out, erasing stored data', async () => {
    const user = userEvent.setup()
    saveChats('local', testCredentials.idInstance, [contactChat])
    useSessionStore
      .getState()
      .login({ credentials: testCredentials, wid: '79990000001@c.us' }, { remember: true })
    render(<App />)

    expect(screen.getByRole('heading', { name: 'Чаты' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Имя в контактах/ })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Выйти' }))
    await user.click(screen.getByRole('button', { name: 'Да' }))

    expect(screen.getByRole('heading', { name: 'Вход в MAX Chat' })).toBeInTheDocument()
    expect(useChatStore.getState().chats).toEqual([])
    expect(localStorage.length).toBe(0)
    expect(sessionStorage.length).toBe(0)
  })
})
