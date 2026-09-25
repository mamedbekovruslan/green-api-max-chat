import { describe, expect, it } from 'vitest'
import { ApiError } from '@/shared/api/green-api'
import { FALLBACK_ERROR_MESSAGE, getErrorMessage } from './getErrorMessage'
import { UserFacingError } from './userFacingError'

describe('getErrorMessage', () => {
  it('maps ApiError kinds to Russian messages', () => {
    expect(getErrorMessage(new ApiError('unauthorized', { status: 401 }))).toBe(
      'Неверный idInstance или apiTokenInstance',
    )
    expect(getErrorMessage(new ApiError('network'))).toBe('Нет соединения с сервером GREEN-API')
  })

  it('shows the message of a UserFacingError as is', () => {
    expect(getErrorMessage(new UserFacingError('Понятное сообщение'))).toBe('Понятное сообщение')
  })

  it.each([new Error('internal details'), new TypeError('x'), 'string', null, undefined])(
    'hides details of unexpected errors (%j)',
    (error) => {
      expect(getErrorMessage(error)).toBe(FALLBACK_ERROR_MESSAGE)
    },
  )
})
