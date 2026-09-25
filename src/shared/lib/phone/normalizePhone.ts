/**
 * Приводит номер к виду, который принимает GREEN-API: только цифры, с кодом страны.
 * Российские номера в формате 8XXXXXXXXXX и 9XXXXXXXXX дополняются кодом 7.
 */
export function normalizePhone(input: string): string | null {
  if (/[^\d\s()+-]/.test(input)) return null

  let digits = input.replace(/\D/g, '')
  if (digits.length === 11 && digits.startsWith('8')) digits = `7${digits.slice(1)}`
  if (digits.length === 10 && digits.startsWith('9')) digits = `7${digits}`

  return /^\d{10,15}$/.test(digits) ? digits : null
}
