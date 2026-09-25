import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { useSessionStore } from '@/entities/session'
import { testCredentials } from '@/test/fixtures/credentials'
import { App } from './App'

describe('App', () => {
  beforeEach(() => {
    useSessionStore.setState({ session: null })
  })

  it('shows the login page without a session', () => {
    render(<App />)

    expect(screen.getByRole('heading', { name: 'Вход в MAX Chat' })).toBeInTheDocument()
  })

  it('shows the chat page with a session and logs out', async () => {
    const user = userEvent.setup()
    useSessionStore
      .getState()
      .login({ credentials: testCredentials, wid: '79990000001@c.us' }, { remember: true })
    render(<App />)

    expect(screen.getByText('Аккаунт MAX: +7 999 000-00-01')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Выйти' }))

    expect(screen.getByRole('heading', { name: 'Вход в MAX Chat' })).toBeInTheDocument()
    expect(localStorage.length).toBe(0)
  })
})
