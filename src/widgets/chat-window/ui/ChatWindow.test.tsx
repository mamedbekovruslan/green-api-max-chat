import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { useChatStore } from '@/entities/chat'
import { contactChat } from '@/test/fixtures/chats'
import { ChatWindow } from './ChatWindow'

describe('ChatWindow', () => {
  beforeEach(() => {
    useChatStore.getState().reset()
  })

  it('asks to choose a chat when none is active', () => {
    render(<ChatWindow />)

    expect(screen.getByText('Выберите чат или создайте новый')).toBeInTheDocument()
  })

  it('shows the header of the active chat', () => {
    useChatStore.getState().setChats([contactChat])
    useChatStore.getState().openChat(contactChat.chatId)

    render(<ChatWindow />)

    expect(screen.getByRole('heading', { name: 'Имя в контактах' })).toBeInTheDocument()
    expect(screen.getByText('+7 999 000-00-00')).toBeInTheDocument()
  })
})
