import { z } from 'zod'
import { isAllowedApiUrl, normalizeApiUrl } from '@/shared/api/green-api'

export const loginFormSchema = z.object({
  idInstance: z
    .string()
    .trim()
    .min(1, 'Введите idInstance')
    .regex(/^\d{6,20}$/, 'idInstance состоит только из цифр'),
  apiTokenInstance: z
    .string()
    .trim()
    .min(1, 'Введите apiTokenInstance')
    .regex(/^[A-Za-z0-9]{20,}$/, 'Проверьте apiTokenInstance: это строка из латинских букв и цифр'),
  apiUrl: z
    .string()
    .trim()
    .min(1, 'Введите адрес API')
    .transform(normalizeApiUrl)
    .refine(isAllowedApiUrl, 'Адрес API должен быть вида https://1234.api.green-api.com'),
  remember: z.boolean(),
})

export type LoginFormInput = z.input<typeof loginFormSchema>
export type LoginFormValues = z.output<typeof loginFormSchema>
export type LoginFormErrors = Partial<Record<keyof LoginFormInput, string>>

export type ValidationResult =
  { success: true; values: LoginFormValues } | { success: false; errors: LoginFormErrors }

export function validateLoginForm(input: LoginFormInput): ValidationResult {
  const result = loginFormSchema.safeParse(input)
  if (result.success) return { success: true, values: result.data }

  const errors: LoginFormErrors = {}
  for (const issue of result.error.issues) {
    const field = issue.path[0]
    if (typeof field === 'string' && field in input && !(field in errors)) {
      errors[field as keyof LoginFormInput] = issue.message
    }
  }
  return { success: false, errors }
}
