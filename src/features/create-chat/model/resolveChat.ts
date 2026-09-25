import type { Chat } from '@/entities/chat'
import type { ContactInfo, GreenApiClient } from '@/shared/api/green-api'
import { UserFacingError } from '@/shared/lib/errors'
import { formatPhone, normalizePhone } from '@/shared/lib/phone'

export const INVALID_PHONE_MESSAGE =
  'Введите номер в международном формате, например +7 999 123-45-67'

export class ChatNotFoundError extends UserFacingError {
  override readonly name = 'ChatNotFoundError'

  constructor() {
    super('Этот номер не зарегистрирован в MAX')
  }
}

export function validatePhone(input: string): { phone: string } | { error: string } {
  const phone = normalizePhone(input)
  return phone ? { phone } : { error: INVALID_PHONE_MESSAGE }
}

async function getContactInfoOrNull(
  client: GreenApiClient,
  chatId: string,
): Promise<ContactInfo | null> {
  try {
    return await client.getContactInfo(chatId)
  } catch {
    return null
  }
}

export async function resolveChat(client: GreenApiClient, phone: string): Promise<Chat> {
  const chatId = await client.checkAccount(phone)
  if (!chatId) throw new ChatNotFoundError()

  const contact = await getContactInfoOrNull(client, chatId)
  return {
    chatId,
    phone,
    name: contact?.contactName || contact?.name || formatPhone(phone),
    avatarUrl: contact?.avatar || null,
  }
}
