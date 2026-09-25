import type { Credentials } from '@/shared/api/green-api'

export const TEST_API_URL = 'https://1234.api.green-api.com'
export const TEST_TOKEN = 'test-token-0123456789abcdef'

export const testCredentials: Credentials = {
  apiUrl: TEST_API_URL,
  idInstance: '1234567890',
  apiTokenInstance: TEST_TOKEN,
}
