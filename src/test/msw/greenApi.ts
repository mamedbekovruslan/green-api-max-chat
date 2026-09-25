import { TEST_API_URL } from '@/test/fixtures/credentials'

export function greenApiUrl(method: string): string {
  return `${TEST_API_URL}/waInstance:idInstance/${method}/:token`
}
