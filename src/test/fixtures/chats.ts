import type { Chat } from '@/entities/chat'
import { CONTACT_CHAT_ID, CONTACT_PHONE } from './greenApi'

export const contactChat: Chat = {
  chatId: CONTACT_CHAT_ID,
  phone: CONTACT_PHONE,
  name: 'Имя в контактах',
  avatarUrl: 'https://i.oneme.ru/i?r=avatar',
}

export const otherChat: Chat = {
  chatId: '5500001',
  phone: '79990000002',
  name: 'Другой контакт',
  avatarUrl: null,
}
