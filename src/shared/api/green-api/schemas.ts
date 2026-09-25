import { z } from 'zod'

export const stateInstanceSchema = z.object({
  stateInstance: z.string(),
})

export const settingsSchema = z.object({
  wid: z.string().optional(),
  webhookUrl: z.string(),
  incomingWebhook: z.string(),
  outgoingWebhook: z.string(),
})
export type InstanceSettings = z.infer<typeof settingsSchema>

export const checkAccountSchema = z.object({
  exist: z.boolean(),
  chatId: z.string(),
})

export const contactInfoSchema = z.object({
  chatId: z.string(),
  name: z.string().nullish(),
  contactName: z.string().nullish(),
  avatar: z.string().nullish(),
  phoneNumber: z.number().nullish(),
})
export type ContactInfo = z.infer<typeof contactInfoSchema>

export const sendMessageSchema = z.object({
  idMessage: z.string(),
})

export const deleteNotificationSchema = z.object({
  result: z.boolean(),
})

export const notificationEnvelopeSchema = z
  .object({
    receiptId: z.number(),
    body: z.unknown(),
  })
  .nullable()

const incomingMessageSchema = z.object({
  typeWebhook: z.literal('incomingMessageReceived'),
  idMessage: z.string(),
  timestamp: z.number(),
  senderData: z.object({
    chatId: z.string(),
    senderName: z.string().nullish(),
    senderContactName: z.string().nullish(),
    senderPhoneNumber: z.number().nullish(),
  }),
  messageData: z.object({
    typeMessage: z.string(),
    textMessageData: z.object({ textMessage: z.string() }).optional(),
    extendedTextMessageData: z.object({ text: z.string() }).optional(),
  }),
})

const outgoingStatusSchema = z.object({
  typeWebhook: z.literal('outgoingMessageStatus'),
  idMessage: z.string(),
  chatId: z.string(),
  timestamp: z.number(),
  status: z.string(),
})

const quotaExceededSchema = z.object({
  typeWebhook: z.literal('quotaExceeded'),
})

export type OutgoingStatus = 'sent' | 'delivered' | 'read' | 'failed'

export type Notification =
  | {
      type: 'incomingText'
      idMessage: string
      chatId: string
      timestamp: number
      text: string
      senderName: string | undefined
      senderPhone: string | undefined
    }
  | {
      type: 'outgoingStatus'
      idMessage: string
      chatId: string
      timestamp: number
      status: OutgoingStatus
    }
  | { type: 'quotaExceeded' }
  | { type: 'unknown'; typeWebhook: string | undefined }

export function parseNotificationBody(body: unknown): Notification {
  const incoming = incomingMessageSchema.safeParse(body)
  if (incoming.success) {
    const text = extractText(incoming.data.messageData)
    if (text !== undefined) {
      const { senderData } = incoming.data
      return {
        type: 'incomingText',
        idMessage: incoming.data.idMessage,
        chatId: senderData.chatId,
        timestamp: incoming.data.timestamp,
        text,
        senderName: senderData.senderContactName || senderData.senderName || undefined,
        senderPhone: senderData.senderPhoneNumber?.toString(),
      }
    }
  }

  const status = outgoingStatusSchema.safeParse(body)
  if (status.success) {
    return {
      type: 'outgoingStatus',
      idMessage: status.data.idMessage,
      chatId: status.data.chatId,
      timestamp: status.data.timestamp,
      status: toOutgoingStatus(status.data.status),
    }
  }

  if (quotaExceededSchema.safeParse(body).success) {
    return { type: 'quotaExceeded' }
  }

  return { type: 'unknown', typeWebhook: readTypeWebhook(body) }
}

function extractText(
  messageData: z.infer<typeof incomingMessageSchema>['messageData'],
): string | undefined {
  switch (messageData.typeMessage) {
    case 'textMessage':
      return messageData.textMessageData?.textMessage
    case 'extendedTextMessage':
      return messageData.extendedTextMessageData?.text
    default:
      return undefined
  }
}

// noAccount, notInGroup, yellowCard и другие статусы для интерфейса означают одно — не доставлено.
function toOutgoingStatus(status: string): OutgoingStatus {
  if (status === 'sent' || status === 'delivered' || status === 'read') return status
  return 'failed'
}

function readTypeWebhook(body: unknown): string | undefined {
  if (typeof body === 'object' && body !== null && 'typeWebhook' in body) {
    const { typeWebhook } = body
    return typeof typeWebhook === 'string' ? typeWebhook : undefined
  }
  return undefined
}

export const chatHistorySchema = z.array(z.unknown())

const historyItemSchema = z.object({
  type: z.enum(['incoming', 'outgoing']),
  idMessage: z.string(),
  timestamp: z.number(),
  typeMessage: z.string(),
  textMessage: z.string().optional(),
  extendedTextMessage: z.object({ text: z.string() }).optional(),
  statusMessage: z.string().optional(),
  isDeleted: z.boolean().optional(),
})

export interface HistoryMessage {
  idMessage: string
  timestamp: number
  direction: 'incoming' | 'outgoing'
  text: string
  status: OutgoingStatus | undefined
}

export function parseHistoryItem(item: unknown): HistoryMessage | null {
  const result = historyItemSchema.safeParse(item)
  if (!result.success || result.data.isDeleted) return null

  const { data } = result
  const text =
    data.typeMessage === 'textMessage'
      ? data.textMessage
      : data.typeMessage === 'extendedTextMessage'
        ? (data.extendedTextMessage?.text ?? data.textMessage)
        : undefined
  if (text === undefined) return null

  return {
    idMessage: data.idMessage,
    timestamp: data.timestamp,
    direction: data.type,
    text,
    status: data.type === 'outgoing' ? toOutgoingStatus(data.statusMessage ?? 'sent') : undefined,
  }
}
