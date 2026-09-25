import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { beforeEach, describe, expect, it } from 'vitest'
import { loadSession, useSessionStore } from '@/entities/session'
import { settingsResponse } from '@/test/fixtures/greenApi'
import { greenApiUrl } from '@/test/msw/greenApi'
import { server } from '@/test/msw/server'
import { createQueryWrapper } from '@/test/queryWrapper'
import { LoginForm } from './LoginForm'

const ID_INSTANCE = '1234567890'
const TOKEN = 'abcdef0123456789abcdef0123456789'

function mockInstance({ state = 'authorized', settings = settingsResponse } = {}) {
  server.use(
    http.get(greenApiUrl('getStateInstance'), () => HttpResponse.json({ stateInstance: state })),
    http.get(greenApiUrl('getSettings'), () => HttpResponse.json(settings)),
  )
}

function renderForm() {
  const user = userEvent.setup()
  render(<LoginForm />, { wrapper: createQueryWrapper() })
  return {
    user,
    idInstance: screen.getByLabelText('idInstance'),
    token: screen.getByLabelText('apiTokenInstance'),
    apiUrl: screen.getByLabelText('Адрес API'),
    remember: screen.getByLabelText('Не выходить после закрытия вкладки'),
    submit: screen.getByRole('button', { name: 'Войти' }),
  }
}

async function fillCredentials(form: ReturnType<typeof renderForm>) {
  await form.user.type(form.idInstance, ID_INSTANCE)
  await form.user.type(form.token, TOKEN)
}

describe('LoginForm', () => {
  beforeEach(() => {
    useSessionStore.setState({ session: null })
  })

  it('fills apiUrl from idInstance', async () => {
    const form = renderForm()

    await form.user.type(form.idInstance, '3100227')

    expect(form.apiUrl).toHaveValue('https://3100.api.green-api.com')
  })

  it('stops updating apiUrl after the user edits it', async () => {
    const form = renderForm()
    await form.user.type(form.apiUrl, 'https://7103.api.green-api.com')

    await form.user.type(form.idInstance, '3100227')

    expect(form.apiUrl).toHaveValue('https://7103.api.green-api.com')
  })

  it('hides the token by default and reveals it on demand', async () => {
    const form = renderForm()
    expect(form.token).toHaveAttribute('type', 'password')

    await form.user.click(screen.getByRole('button', { name: 'Показать apiTokenInstance' }))

    expect(form.token).toHaveAttribute('type', 'text')
  })

  it('explains the remember option in an accessible tooltip', () => {
    renderForm()

    expect(
      screen.getByRole('button', { name: 'Подробнее о сохранении входа' }),
    ).toHaveAccessibleDescription(
      'Данные сохранятся в браузере до нажатия «Выйти». Не включайте на чужом компьютере',
    )
  })

  it('shows field errors without calling the API', async () => {
    const form = renderForm()

    await form.user.click(form.submit)

    expect(screen.getByText('Введите idInstance')).toBeInTheDocument()
    expect(screen.getByText('Введите apiTokenInstance')).toBeInTheDocument()
    expect(form.idInstance).toHaveAttribute('aria-invalid', 'true')
  })

  it('clears a field error when the field changes', async () => {
    const form = renderForm()
    await form.user.click(form.submit)

    await form.user.type(form.idInstance, '1')

    expect(screen.queryByText('Введите idInstance')).not.toBeInTheDocument()
  })

  it('logs in and keeps the session only for the tab by default', async () => {
    mockInstance()
    const form = renderForm()
    await fillCredentials(form)

    await form.user.click(form.submit)

    await expect.poll(() => useSessionStore.getState().session).not.toBeNull()
    expect(useSessionStore.getState().session?.credentials.idInstance).toBe(ID_INSTANCE)
    expect(sessionStorage.length).toBe(1)
    expect(localStorage.length).toBe(0)
  })

  it('remembers the session when the remember option is checked', async () => {
    mockInstance()
    const form = renderForm()
    await fillCredentials(form)
    await form.user.click(form.remember)

    await form.user.click(form.submit)

    await expect.poll(() => useSessionStore.getState().session).not.toBeNull()
    expect(localStorage.length).toBe(1)
    expect(loadSession()).toMatchObject({ session: { wid: '79990000001@c.us' }, remember: true })
  })

  it('shows a readable error for a wrong token', async () => {
    server.use(
      http.get(greenApiUrl('getStateInstance'), () => new HttpResponse(null, { status: 401 })),
    )
    const form = renderForm()
    await fillCredentials(form)

    await form.user.click(form.submit)

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Неверный idInstance или apiTokenInstance',
    )
    expect(useSessionStore.getState().session).toBeNull()
  })

  it('shows a readable error for an unauthorized instance', async () => {
    mockInstance({ state: 'notAuthorized' })
    const form = renderForm()
    await fillCredentials(form)

    await form.user.click(form.submit)

    expect(await screen.findByRole('alert')).toHaveTextContent('Инстанс не привязан к аккаунту MAX')
  })

  it('warns about settings and lets the user continue', async () => {
    mockInstance({ settings: { ...settingsResponse, incomingWebhook: 'no' } })
    const form = renderForm()
    await fillCredentials(form)

    await form.user.click(form.submit)

    expect(await screen.findByText('Инстанс настроен не полностью')).toBeInTheDocument()
    expect(useSessionStore.getState().session).toBeNull()

    await form.user.click(screen.getByRole('button', { name: 'Всё равно войти' }))

    expect(useSessionStore.getState().session).not.toBeNull()
  })

  it('returns to the form from the settings warning', async () => {
    mockInstance({ settings: { ...settingsResponse, webhookUrl: 'https://example.com' } })
    const form = renderForm()
    await fillCredentials(form)
    await form.user.click(form.submit)

    await form.user.click(await screen.findByRole('button', { name: 'Назад' }))

    expect(screen.getByRole('button', { name: 'Войти' })).toBeInTheDocument()
    expect(useSessionStore.getState().session).toBeNull()
  })
})
