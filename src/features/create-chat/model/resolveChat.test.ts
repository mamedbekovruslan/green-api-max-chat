import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { createGreenApiClient } from '@/shared/api/green-api'
import { getErrorMessage } from '@/shared/lib/errors'
import { testCredentials } from '@/test/fixtures/credentials'
import { CONTACT_CHAT_ID, CONTACT_PHONE, contactInfoResponse } from '@/test/fixtures/greenApi'
import { greenApiUrl } from '@/test/msw/greenApi'
import { server } from '@/test/msw/server'
import { ChatNotFoundError, INVALID_PHONE_MESSAGE, resolveChat, validatePhone } from './resolveChat'

const client = createGreenApiClient(testCredentials)

function mockCheckAccount(exist: boolean) {
  server.use(
    http.post(greenApiUrl('checkAccount'), () =>
      HttpResponse.json({ exist, chatId: exist ? CONTACT_CHAT_ID : '', fromCache: true }),
    ),
  )
}

describe('validatePhone', () => {
  it('returns the normalized phone', () => {
    expect(validatePhone('+7 (999) 000-00-00')).toEqual({ phone: CONTACT_PHONE })
  })

  it('returns an error for an invalid phone', () => {
    expect(validatePhone('123')).toEqual({ error: INVALID_PHONE_MESSAGE })
  })
})

describe('resolveChat', () => {
  it('builds a chat from the internal chatId and contact info', async () => {
    mockCheckAccount(true)
    server.use(
      http.post(greenApiUrl('getContactInfo'), () => HttpResponse.json(contactInfoResponse)),
    )

    await expect(resolveChat(client, CONTACT_PHONE)).resolves.toEqual({
      chatId: CONTACT_CHAT_ID,
      phone: CONTACT_PHONE,
      name: 'Имя в контактах',
      avatarUrl: 'https://i.oneme.ru/i?r=avatar',
    })
  })

  it('falls back to the profile name when there is no contact name', async () => {
    mockCheckAccount(true)
    server.use(
      http.post(greenApiUrl('getContactInfo'), () =>
        HttpResponse.json({ ...contactInfoResponse, contactName: '', avatar: '' }),
      ),
    )

    await expect(resolveChat(client, CONTACT_PHONE)).resolves.toMatchObject({
      name: 'Имя в профиле',
      avatarUrl: null,
    })
  })

  it('falls back to the formatted phone when contact info is unavailable', async () => {
    mockCheckAccount(true)
    server.use(
      http.post(greenApiUrl('getContactInfo'), () => new HttpResponse(null, { status: 500 })),
    )

    await expect(resolveChat(client, CONTACT_PHONE)).resolves.toMatchObject({
      chatId: CONTACT_CHAT_ID,
      name: '+7 999 000-00-00',
      avatarUrl: null,
    })
  })

  it('rejects a phone that is not registered in MAX', async () => {
    mockCheckAccount(false)

    const error = await resolveChat(client, CONTACT_PHONE).catch((e: unknown) => e)
    expect(error).toBeInstanceOf(ChatNotFoundError)
    expect(getErrorMessage(error)).toBe('Этот номер не зарегистрирован в MAX')
  })
})
