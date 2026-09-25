import { describe, expect, it } from 'vitest'
import { validateLoginForm, type LoginFormInput } from './loginForm'

const validInput: LoginFormInput = {
  idInstance: '3100000000',
  apiTokenInstance: 'abcdef0123456789abcdef0123456789',
  apiUrl: 'https://3100.api.green-api.com',
  remember: false,
}

describe('validateLoginForm', () => {
  it('returns trimmed and normalized values for valid input', () => {
    const result = validateLoginForm({
      ...validInput,
      idInstance: ' 3100000000 ',
      apiTokenInstance: ` ${validInput.apiTokenInstance} `,
      apiUrl: ' https://3100.api.green-api.com/ ',
    })

    expect(result).toEqual({ success: true, values: validInput })
  })

  it('reports an error per empty field', () => {
    const result = validateLoginForm({
      idInstance: '',
      apiTokenInstance: '',
      apiUrl: '',
      remember: false,
    })

    expect(result).toEqual({
      success: false,
      errors: {
        idInstance: 'Введите idInstance',
        apiTokenInstance: 'Введите apiTokenInstance',
        apiUrl: 'Введите адрес API',
      },
    })
  })

  it.each([
    ['idInstance', { idInstance: '3100abc' }, 'idInstance состоит только из цифр'],
    [
      'apiTokenInstance',
      { apiTokenInstance: 'short' },
      'Проверьте apiTokenInstance: это строка из латинских букв и цифр',
    ],
    [
      'apiTokenInstance',
      { apiTokenInstance: 'abcdef0123456789abcd/ef' },
      'Проверьте apiTokenInstance: это строка из латинских букв и цифр',
    ],
    [
      'apiUrl',
      { apiUrl: 'https://evil.example.com' },
      'Адрес API должен быть вида https://1234.api.green-api.com',
    ],
    [
      'apiUrl',
      { apiUrl: 'http://3100.api.green-api.com' },
      'Адрес API должен быть вида https://1234.api.green-api.com',
    ],
  ] as const)('rejects invalid %s', (field, patch, message) => {
    const result = validateLoginForm({ ...validInput, ...patch })

    expect(result).toEqual({ success: false, errors: { [field]: message } })
  })
})
