import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { Message } from '../model/types'
import { MessageBubble } from './MessageBubble'

const base: Message = {
  id: '1',
  chatId: '1',
  text: 'Привет\nкак дела?',
  timestamp: new Date(2026, 4, 25, 14, 33).getTime(),
  direction: 'outgoing',
  status: 'read',
}

describe('MessageBubble', () => {
  it('shows the text and the time', () => {
    render(<MessageBubble message={base} />)

    expect(screen.getByText(/Привет/)).toHaveTextContent('Привет как дела?')
    expect(screen.getByText('14:33')).toBeInTheDocument()
  })

  it.each([
    ['pending', 'Отправляется'],
    ['sent', 'Отправлено'],
    ['delivered', 'Доставлено'],
    ['read', 'Прочитано'],
    ['failed', 'Не отправлено'],
  ] as const)('labels the %s status of outgoing messages', (status, label) => {
    render(<MessageBubble message={{ ...base, status }} />)

    expect(screen.getByRole('img', { name: label })).toBeInTheDocument()
  })

  it('shows no status for incoming messages', () => {
    render(<MessageBubble message={{ ...base, direction: 'incoming', status: null }} />)

    expect(screen.queryByRole('img')).not.toBeInTheDocument()
  })

  it('renders user text as plain text', () => {
    render(<MessageBubble message={{ ...base, text: '<img src=x onerror=alert(1)>' }} />)

    expect(screen.getByText('<img src=x onerror=alert(1)>')).toBeInTheDocument()
    expect(document.querySelector('img[src="x"]')).toBeNull()
  })
})
