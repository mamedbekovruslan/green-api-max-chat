import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { ApiError, createGreenApiClient } from '@/shared/api/green-api'
import { getErrorMessage } from '@/shared/lib/errors'
import { testCredentials } from '@/test/fixtures/credentials'
import { settingsResponse } from '@/test/fixtures/greenApi'
import { greenApiUrl } from '@/test/msw/greenApi'
import { server } from '@/test/msw/server'
import { getSettingsWarnings, InstanceStateError, verifyInstance } from './verifyInstance'

const client = createGreenApiClient(testCredentials)

function mockInstance(state: string, settings: object = settingsResponse) {
  server.use(
    http.get(greenApiUrl('getStateInstance'), () => HttpResponse.json({ stateInstance: state })),
    http.get(greenApiUrl('getSettings'), () => HttpResponse.json(settings)),
  )
}

describe('verifyInstance', () => {
  it('returns wid and no warnings for a correctly configured instance', async () => {
    mockInstance('authorized')

    await expect(verifyInstance(client)).resolves.toEqual({
      wid: '79990000001@c.us',
      warnings: [],
    })
  })

  it('returns warnings for a misconfigured instance', async () => {
    mockInstance('authorized', { ...settingsResponse, incomingWebhook: 'no' })

    const result = await verifyInstance(client)
    expect(result.warnings).toHaveLength(1)
  })

  it.each([
    [
      'notAuthorized',
      'Инстанс не привязан к аккаунту MAX. Авторизуйте его в личном кабинете GREEN-API',
    ],
    ['starting', 'Инстанс запускается. Попробуйте через минуту'],
    ['somethingNew', 'Инстанс недоступен (состояние: somethingNew)'],
  ])('rejects state %s with a readable message', async (state, message) => {
    mockInstance(state)

    const error = await verifyInstance(client).catch((e: unknown) => e)
    expect(error).toBeInstanceOf(InstanceStateError)
    expect(getErrorMessage(error)).toBe(message)
  })

  it('propagates API errors such as a wrong token', async () => {
    server.use(
      http.get(greenApiUrl('getStateInstance'), () => new HttpResponse(null, { status: 401 })),
    )

    const error = await verifyInstance(client).catch((e: unknown) => e)
    expect(error).toBeInstanceOf(ApiError)
    expect(getErrorMessage(error)).toBe('Неверный idInstance или apiTokenInstance')
  })
})

describe('getSettingsWarnings', () => {
  const ok = { webhookUrl: '', incomingWebhook: 'yes', outgoingWebhook: 'yes' }

  it('returns nothing for the required settings', () => {
    expect(getSettingsWarnings(ok)).toEqual([])
  })

  it.each([
    ['webhookUrl is set', { webhookUrl: 'https://example.com/hook' }, 'Адрес отправки уведомлений'],
    ['incoming notifications are off', { incomingWebhook: 'no' }, 'входящих сообщениях'],
    ['status notifications are off', { outgoingWebhook: 'no' }, 'статусах отправленных'],
  ])('warns when %s', (_, patch, fragment) => {
    const warnings = getSettingsWarnings({ ...ok, ...patch })

    expect(warnings).toHaveLength(1)
    expect(warnings[0]).toContain(fragment)
  })
})
