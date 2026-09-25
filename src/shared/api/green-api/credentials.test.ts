import { describe, expect, it } from 'vitest'
import { defaultApiUrl, isAllowedApiUrl, normalizeApiUrl } from './credentials'

describe('defaultApiUrl', () => {
  it('derives the host from the first 4 digits of idInstance', () => {
    expect(defaultApiUrl('3100000001')).toBe('https://3100.api.green-api.com')
    expect(defaultApiUrl(' 7103123456 ')).toBe('https://7103.api.green-api.com')
  })

  it.each(['', '123', 'abcd123456', '3100-0000'])('returns null for %j', (idInstance) => {
    expect(defaultApiUrl(idInstance)).toBeNull()
  })
})

describe('isAllowedApiUrl', () => {
  it.each([
    'https://3100.api.green-api.com',
    'https://3100.api.green-api.com/',
    'https://api.green-api.com',
    'https://7103.api.greenapi.com',
  ])('allows %s', (url) => {
    expect(isAllowedApiUrl(url)).toBe(true)
  })

  it.each([
    ['plain http', 'http://3100.api.green-api.com'],
    ['foreign host', 'https://evil.example.com'],
    ['look-alike host', 'https://green-api.com.evil.example.com'],
    ['suffix without dot', 'https://evilgreen-api.com'],
    ['credentials in URL', 'https://user:pass@3100.api.green-api.com'],
    ['custom port', 'https://3100.api.green-api.com:8443'],
    ['extra path', 'https://3100.api.green-api.com/proxy'],
    ['query string', 'https://3100.api.green-api.com?x=1'],
    ['not a URL', 'green-api.com'],
    ['empty', ''],
  ])('rejects %s', (_, url) => {
    expect(isAllowedApiUrl(url)).toBe(false)
  })
})

describe('normalizeApiUrl', () => {
  it('trims whitespace and trailing slashes', () => {
    expect(normalizeApiUrl('  https://3100.api.green-api.com//  ')).toBe(
      'https://3100.api.green-api.com',
    )
  })
})
