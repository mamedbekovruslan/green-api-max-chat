import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ConfirmDialog } from './ConfirmDialog'

function renderDialog(open = true) {
  const onConfirm = vi.fn()
  const onCancel = vi.fn()
  const user = userEvent.setup()
  render(
    <ConfirmDialog
      open={open}
      title="Выйти из аккаунта?"
      description="Пояснение"
      confirmLabel="Да"
      cancelLabel="Нет"
      onConfirm={onConfirm}
      onCancel={onCancel}
    />,
  )
  return { user, onConfirm, onCancel }
}

describe('ConfirmDialog', () => {
  it('renders nothing when closed', () => {
    renderDialog(false)

    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
  })

  it('is an accessible modal focused on the safe option', () => {
    renderDialog()

    const dialog = screen.getByRole('alertdialog', { name: 'Выйти из аккаунта?' })
    expect(dialog).toHaveAttribute('aria-modal', 'true')
    expect(dialog).toHaveAccessibleDescription('Пояснение')
    expect(screen.getByRole('button', { name: 'Нет' })).toHaveFocus()
  })

  it('confirms and cancels with the buttons', async () => {
    const { user, onConfirm, onCancel } = renderDialog()

    await user.click(screen.getByRole('button', { name: 'Да' }))
    await user.click(screen.getByRole('button', { name: 'Нет' }))

    expect(onConfirm).toHaveBeenCalledOnce()
    expect(onCancel).toHaveBeenCalledOnce()
  })

  it('cancels on Escape and on a click outside', async () => {
    const { user, onCancel } = renderDialog()

    await user.keyboard('{Escape}')
    await user.click(screen.getByTestId('confirm-dialog-overlay'))

    expect(onCancel).toHaveBeenCalledTimes(2)
  })

  it('keeps the focus inside the dialog', async () => {
    const { user } = renderDialog()

    await user.tab()
    expect(screen.getByRole('button', { name: 'Да' })).toHaveFocus()

    await user.tab()
    expect(screen.getByRole('button', { name: 'Нет' })).toHaveFocus()
  })
})
