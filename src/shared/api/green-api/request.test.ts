import { delay, http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import { TEST_API_URL, TEST_TOKEN, testCredentials } from '@/test/fixtures/credentials'
import { server } from '@/test/msw/server'
import { ApiError } from './errors'
import { buildUrl, greenApiRequest } from './request'

const METHOD_URL = `${TEST_API_URL}/waInstance:idInstance/:method/:token`
const okSchema = z.object({ ok: z.boolean() })

async function catchApiError(promise: Promise<unknown>): Promise<ApiError> {
  try {
    await promise
  } catch (error) {
    if (error instanceof ApiError) return error
    throw error
  }
  throw new Error('Expected the request to fail')
}

describe('buildUrl', () => {
  it('puts idInstance, method and token into the path', () => {
    expect(buildUrl(testCredentials, 'getStateInstance')).toBe(
      `${TEST_API_URL}/waInstance1234567890/getStateInstance/${TEST_TOKEN}`,
    )
  })

  it('appends path param and query, encoding unsafe characters', () => {
    const url = buildUrl(
      { ...testCredentials, apiUrl: `${TEST_API_URL}/`, apiTokenInstance: 'a/b?c' },
      'deleteNotification',
      42,
      { receiveTimeout: 5 },
    )
    expect(url).toBe(
      `${TEST_API_URL}/waInstance1234567890/deleteNotification/a%2Fb%3Fc/42?receiveTimeout=5`,
    )
  })
})

describe('greenApiRequest', () => {
  it('sends GET and parses the response with the schema', async () => {
    server.use(
      http.get(METHOD_URL, ({ params }) => {
        expect(params).toEqual({ idInstance: '1234567890', method: 'ping', token: TEST_TOKEN })
        return HttpResponse.json({ ok: true })
      }),
    )

    await expect(
      greenApiRequest(testCredentials, { method: 'ping', schema: okSchema }),
    ).resolves.toEqual({ ok: true })
  })

  it('sends POST with a JSON body when body is given', async () => {
    server.use(
      http.post(METHOD_URL, async ({ request }) => {
        expect(request.headers.get('Content-Type')).toBe('application/json')
        expect(await request.json()).toEqual({ chatId: '1', message: 'hi' })
        return HttpResponse.json({ ok: true })
      }),
    )

    await expect(
      greenApiRequest(testCredentials, {
        method: 'sendMessage',
        body: { chatId: '1', message: 'hi' },
        schema: okSchema,
      }),
    ).resolves.toEqual({ ok: true })
  })

  it('supports DELETE with a path param', async () => {
    server.use(
      http.delete(`${METHOD_URL}/:receiptId`, ({ params }) => {
        expect(params.receiptId).toBe('7')
        return HttpResponse.json({ ok: true })
      }),
    )

    await expect(
      greenApiRequest(testCredentials, {
        method: 'deleteNotification',
        httpMethod: 'DELETE',
        pathParam: 7,
        schema: okSchema,
      }),
    ).resolves.toEqual({ ok: true })
  })

  it('treats an empty 200 body as null', async () => {
    server.use(http.get(METHOD_URL, () => new HttpResponse('', { status: 200 })))

    await expect(
      greenApiRequest(testCredentials, { method: 'receiveNotification', schema: z.null() }),
    ).resolves.toBeNull()
  })

  it('refuses to send the token to a non GREEN-API host', async () => {
    const error = await catchApiError(
      greenApiRequest(
        { ...testCredentials, apiUrl: 'https://evil.example.com' },
        { method: 'ping', schema: okSchema },
      ),
    )
    // Для evil.example.com нет обработчика: реальный запрос уронил бы тест.
    expect(error.kind).toBe('invalidConfig')
  })

  describe('HTTP errors', () => {
    it.each([
      [400, 'badRequest', () => HttpResponse.json({ message: 'bad' }, { status: 400 })],
      [401, 'unauthorized', () => new HttpResponse(null, { status: 401 })],
      [403, 'unauthorized', () => new HttpResponse(null, { status: 403 })],
      [
        404,
        'notFound',
        () =>
          new HttpResponse('<html>404</html>', {
            status: 404,
            headers: { 'Content-Type': 'text/html' },
          }),
      ],
      [429, 'rateLimited', () => new HttpResponse(null, { status: 429 })],
      [466, 'quotaExceeded', () => HttpResponse.json({ quotaData: {} }, { status: 466 })],
      [500, 'server', () => new HttpResponse(null, { status: 500 })],
      [418, 'badRequest', () => new HttpResponse(null, { status: 418 })],
    ] as const)('maps HTTP %i to %s', async (status, kind, respond) => {
      server.use(http.get(METHOD_URL, respond))

      const error = await catchApiError(
        greenApiRequest(testCredentials, { method: 'ping', schema: okSchema }),
      )
      expect(error.kind).toBe(kind)
      expect(error.status).toBe(status)
    })
  })

  it('fails with invalidResponse on malformed JSON', async () => {
    server.use(http.get(METHOD_URL, () => new HttpResponse('{not json', { status: 200 })))

    const error = await catchApiError(
      greenApiRequest(testCredentials, { method: 'ping', schema: okSchema }),
    )
    expect(error.kind).toBe('invalidResponse')
  })

  it('fails with invalidResponse when the body does not match the schema', async () => {
    server.use(http.get(METHOD_URL, () => HttpResponse.json({ ok: 'yes' })))

    const error = await catchApiError(
      greenApiRequest(testCredentials, { method: 'ping', schema: okSchema }),
    )
    expect(error.kind).toBe('invalidResponse')
    expect(error.cause).toBeInstanceOf(z.ZodError)
  })

  it('fails with network on connection errors', async () => {
    server.use(http.get(METHOD_URL, () => HttpResponse.error()))

    const error = await catchApiError(
      greenApiRequest(testCredentials, { method: 'ping', schema: okSchema }),
    )
    expect(error.kind).toBe('network')
    expect(error.cause).toBeUndefined()
  })

  it('fails with timeout when the server does not answer in time', async () => {
    server.use(
      http.get(METHOD_URL, async () => {
        await delay('infinite')
        return HttpResponse.json({ ok: true })
      }),
    )

    const error = await catchApiError(
      greenApiRequest(testCredentials, { method: 'ping', schema: okSchema, timeoutMs: 20 }),
    )
    expect(error.kind).toBe('timeout')
  })

  it('fails with aborted when the caller aborts', async () => {
    server.use(
      http.get(METHOD_URL, async () => {
        await delay('infinite')
        return HttpResponse.json({ ok: true })
      }),
    )
    const controller = new AbortController()

    const promise = greenApiRequest(testCredentials, {
      method: 'ping',
      schema: okSchema,
      signal: controller.signal,
    })
    controller.abort()

    expect((await catchApiError(promise)).kind).toBe('aborted')
  })

  it('fails with aborted without a request when the signal is already aborted', async () => {
    const error = await catchApiError(
      greenApiRequest(testCredentials, {
        method: 'ping',
        schema: okSchema,
        signal: AbortSignal.abort(),
      }),
    )
    expect(error.kind).toBe('aborted')
  })

  it('never exposes the token in error messages', async () => {
    // На ответ 400 GREEN-API возвращает полный путь запроса вместе с токеном.
    server.use(
      http.get(METHOD_URL, ({ request }) =>
        HttpResponse.json({ path: new URL(request.url).pathname, message: 'bad' }, { status: 400 }),
      ),
    )

    const error = await catchApiError(
      greenApiRequest(testCredentials, { method: 'ping', schema: okSchema }),
    )
    expect(error.message).not.toContain(TEST_TOKEN)
    expect(String(error.cause ?? '')).not.toContain(TEST_TOKEN)
  })
})
