import { act, renderHook, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { testCredentials } from '@/test/fixtures/credentials'
import { settingsResponse } from '@/test/fixtures/greenApi'
import { greenApiUrl } from '@/test/msw/greenApi'
import { server } from '@/test/msw/server'
import { createQueryWrapper } from '@/test/queryWrapper'
import { useLogin } from './useLogin'

describe('useLogin', () => {
  it('verifies the instance and returns the session to store', async () => {
    server.use(
      http.get(greenApiUrl('getStateInstance'), () =>
        HttpResponse.json({ stateInstance: 'authorized' }),
      ),
      http.get(greenApiUrl('getSettings'), () => HttpResponse.json(settingsResponse)),
    )
    const { result } = renderHook(() => useLogin(), { wrapper: createQueryWrapper() })

    act(() => result.current.mutate({ ...testCredentials, remember: true }))

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual({
      session: { credentials: testCredentials, wid: '79990000001@c.us' },
      remember: true,
      warnings: [],
    })
  })

  it('exposes the error when verification fails', async () => {
    server.use(
      http.get(greenApiUrl('getStateInstance'), () => new HttpResponse(null, { status: 401 })),
    )
    const { result } = renderHook(() => useLogin(), { wrapper: createQueryWrapper() })

    act(() => result.current.mutate({ ...testCredentials, remember: false }))

    await waitFor(() => expect(result.current.isError).toBe(true))
  })
})
