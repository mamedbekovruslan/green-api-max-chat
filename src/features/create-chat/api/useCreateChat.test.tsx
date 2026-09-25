import { act, renderHook, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { beforeEach, describe, expect, it } from 'vitest'
import { useChatStore } from '@/entities/chat'
import { useSessionStore } from '@/entities/session'
import { contactChat } from '@/test/fixtures/chats'
import { testCredentials } from '@/test/fixtures/credentials'
import { CONTACT_CHAT_ID, CONTACT_PHONE, contactInfoResponse } from '@/test/fixtures/greenApi'
import { greenApiUrl } from '@/test/msw/greenApi'
import { server } from '@/test/msw/server'
import { createQueryWrapper } from '@/test/queryWrapper'
import { useCreateChat } from './useCreateChat'

describe('useCreateChat', () => {
  beforeEach(() => {
    useSessionStore.setState({ session: { credentials: testCredentials }, remember: false })
    useChatStore.getState().reset()
  })

  it('resolves a new chat, adds it and opens it', async () => {
    server.use(
      http.post(greenApiUrl('checkAccount'), () =>
        HttpResponse.json({ exist: true, chatId: CONTACT_CHAT_ID, fromCache: true }),
      ),
      http.post(greenApiUrl('getContactInfo'), () => HttpResponse.json(contactInfoResponse)),
    )
    const { result } = renderHook(() => useCreateChat(), { wrapper: createQueryWrapper() })

    act(() => result.current.mutate(CONTACT_PHONE))

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(useChatStore.getState()).toMatchObject({
      chats: [contactChat],
      activeChatId: CONTACT_CHAT_ID,
    })
  })

  it('opens an existing chat without calling the API', async () => {
    useChatStore.getState().setChats([contactChat])
    const { result } = renderHook(() => useCreateChat(), { wrapper: createQueryWrapper() })

    act(() => result.current.mutate(CONTACT_PHONE))

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(useChatStore.getState().activeChatId).toBe(CONTACT_CHAT_ID)
    expect(useChatStore.getState().chats).toHaveLength(1)
  })
})
