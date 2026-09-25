import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { MAX_MESSAGE_LENGTH } from '@/shared/api/green-api'
import { MessageInput } from './MessageInput'

function renderInput(disabled = false) {
  const onSend = vi.fn()
  const user = userEvent.setup()
  render(<MessageInput onSend={onSend} disabled={disabled} />)
  return {
    user,
    onSend,
    textarea: screen.getByRole('textbox', { name: 'Сообщение' }),
    sendButton: screen.getByRole('button', { name: 'Отправить' }),
  }
}

describe('MessageInput', () => {
  it('sends the trimmed text on Enter and clears the field', async () => {
    const { user, onSend, textarea } = renderInput()

    await user.type(textarea, '  Привет  {Enter}')

    expect(onSend).toHaveBeenCalledWith('Привет')
    expect(textarea).toHaveValue('')
    expect(textarea).toHaveFocus()
  })

  it('inserts a line break on Shift+Enter', async () => {
    const { user, onSend, textarea } = renderInput()

    await user.type(textarea, 'Первая{Shift>}{Enter}{/Shift}Вторая')

    expect(textarea).toHaveValue('Первая\nВторая')
    expect(onSend).not.toHaveBeenCalled()
  })

  it('sends with the button', async () => {
    const { user, onSend, textarea, sendButton } = renderInput()

    await user.type(textarea, 'Привет')
    await user.click(sendButton)

    expect(onSend).toHaveBeenCalledWith('Привет')
  })

  it('does not send an empty or whitespace-only message', async () => {
    const { user, onSend, textarea, sendButton } = renderInput()
    expect(sendButton).toBeDisabled()

    await user.type(textarea, '   {Enter}')

    expect(onSend).not.toHaveBeenCalled()
    expect(sendButton).toBeDisabled()
  })

  it('is fully disabled while the chat is not ready', () => {
    const { textarea, sendButton } = renderInput(true)

    expect(textarea).toBeDisabled()
    expect(sendButton).toBeDisabled()
  })

  it('limits the length and shows a counter near the limit', () => {
    const { textarea } = renderInput()
    expect(textarea).toHaveAttribute('maxLength', String(MAX_MESSAGE_LENGTH))
    expect(screen.queryByText(/\/4000/)).not.toBeInTheDocument()

    fireEvent.change(textarea, { target: { value: 'a'.repeat(3600) } })

    expect(screen.getByText('3600/4000')).toBeInTheDocument()
  })
})
