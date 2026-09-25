import type { QueryClient } from '@tanstack/react-query'
import { useChatStore } from '@/entities/chat'
import {
  messagesQueryKey,
  upsertMessage,
  type Message,
  type MessageStatus,
} from '@/entities/message'
import type { Notification, OutgoingStatus } from '@/shared/api/green-api'
import { formatPhone } from '@/shared/lib/phone'

export interface NotificationContext {
  queryClient: QueryClient
  idInstance: string
  seenMessageIds: Set<string>
  onQuotaExceeded: () => void
}

type IncomingText = Extract<Notification, { type: 'incomingText' }>
type StatusUpdate = Extract<Notification, { type: 'outgoingStatus' }>

const STATUS_RANK: Record<MessageStatus, number> = {
  pending: 0,
  failed: 1,
  sent: 2,
  delivered: 3,
  read: 4,
}

export function advanceStatus(current: MessageStatus | null, next: OutgoingStatus): MessageStatus {
  if (current === null) return next
  if (next === 'failed') return current === 'pending' || current === 'sent' ? 'failed' : current
  return STATUS_RANK[next] > STATUS_RANK[current] ? next : current
}

function applyIncomingText(notification: IncomingText, context: NotificationContext): void {
  const { queryClient, idInstance, seenMessageIds } = context
  if (seenMessageIds.has(notification.idMessage)) return
  seenMessageIds.add(notification.idMessage)

  const chats = useChatStore.getState()
  const { chatId } = notification
  if (!chats.chats.some((chat) => chat.chatId === chatId)) {
    const phone = notification.senderPhone ?? null
    chats.upsertChat({
      chatId,
      phone,
      name: notification.senderName ?? (phone ? formatPhone(phone) : chatId),
      avatarUrl: null,
    })
  }

  const timestamp = notification.timestamp * 1000
  const message: Message = {
    id: notification.idMessage,
    chatId,
    text: notification.text,
    timestamp,
    direction: 'incoming',
    status: null,
    failureReason: null,
  }
  const queryKey = messagesQueryKey(idInstance, chatId)
  if (queryClient.getQueryData(queryKey)) {
    queryClient.setQueryData<Message[]>(queryKey, (messages) => upsertMessage(messages, message))
  }

  chats.setPreview(chatId, { text: notification.text, timestamp })
  chats.bumpChat(chatId)
  if (useChatStore.getState().activeChatId !== chatId) chats.incrementUnread(chatId)
}

function applyStatus(notification: StatusUpdate, context: NotificationContext): void {
  context.queryClient.setQueryData<Message[]>(
    messagesQueryKey(context.idInstance, notification.chatId),
    (messages) =>
      messages?.map((message) =>
        message.id === notification.idMessage && message.direction === 'outgoing'
          ? { ...message, status: advanceStatus(message.status, notification.status) }
          : message,
      ),
  )
}

export function applyNotification(notification: Notification, context: NotificationContext): void {
  switch (notification.type) {
    case 'incomingText':
      applyIncomingText(notification, context)
      break
    case 'outgoingStatus':
      applyStatus(notification, context)
      break
    case 'quotaExceeded':
      context.onQuotaExceeded()
      break
    case 'unknown':
      break
  }
}
