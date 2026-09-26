import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { CrashScreen } from './CrashScreen'

describe('CrashScreen', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('offers to reload the page', async () => {
    const reload = vi.fn()
    vi.stubGlobal('location', { ...window.location, reload })
    const user = userEvent.setup()
    render(<CrashScreen />)

    expect(screen.getByRole('alert')).toHaveTextContent('Что-то пошло не так')

    await user.click(screen.getByRole('button', { name: 'Перезагрузить страницу' }))

    expect(reload).toHaveBeenCalledOnce()
  })
})
