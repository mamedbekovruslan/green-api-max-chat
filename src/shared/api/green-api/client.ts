import type { Credentials } from './credentials'
import { greenApiRequest, type RequestOptions } from './request'
import {
  chatHistorySchema,
  checkAccountSchema,
  contactInfoSchema,
  deleteNotificationSchema,
  notificationEnvelopeSchema,
  parseHistoryItem,
  parseNotificationBody,
  readChatSchema,
  sendMessageSchema,
  settingsSchema,
  stateInstanceSchema,
  type ContactInfo,
  type HistoryMessage,
  type InstanceSettings,
  type Notification,
} from './schemas'

export const MAX_MESSAGE_LENGTH = 4000
export const DEFAULT_HISTORY_COUNT = 100
export const DEFAULT_RECEIVE_TIMEOUT_S = 20
// Сервер держит long polling до receiveTimeout секунд — HTTP-таймаут должен быть больше.
const RECEIVE_TIMEOUT_MARGIN_MS = 10_000

interface CallOptions {
  signal?: AbortSignal | undefined
}

interface ReceiveOptions extends CallOptions {
  receiveTimeout?: number | undefined
}

interface HistoryOptions extends CallOptions {
  count?: number | undefined
}

export interface ReceivedNotification {
  receiptId: number
  notification: Notification
}

export interface GreenApiClient {
  getStateInstance(options?: CallOptions): Promise<string>
  getSettings(options?: CallOptions): Promise<InstanceSettings>
  checkAccount(phoneNumber: string, options?: CallOptions): Promise<string | null>
  getContactInfo(chatId: string, options?: CallOptions): Promise<ContactInfo>
  sendMessage(chatId: string, message: string, options?: CallOptions): Promise<string>
  getChatHistory(chatId: string, options?: HistoryOptions): Promise<HistoryMessage[]>
  readChat(chatId: string, options?: CallOptions): Promise<boolean>
  receiveNotification(options?: ReceiveOptions): Promise<ReceivedNotification | null>
  deleteNotification(receiptId: number, options?: CallOptions): Promise<boolean>
}

export function createGreenApiClient(credentials: Credentials): GreenApiClient {
  const request = <T>(options: RequestOptions<T>) => greenApiRequest(credentials, options)

  return {
    async getStateInstance(options = {}) {
      const data = await request({
        method: 'getStateInstance',
        schema: stateInstanceSchema,
        signal: options.signal,
      })
      return data.stateInstance
    },

    getSettings(options = {}) {
      return request({ method: 'getSettings', schema: settingsSchema, signal: options.signal })
    },

    async checkAccount(phoneNumber, options = {}) {
      if (!/^\d{10,15}$/.test(phoneNumber)) {
        throw new RangeError('phoneNumber must contain 10-15 digits')
      }
      const data = await request({
        method: 'checkAccount',
        // API ожидает phoneNumber числом, а не строкой.
        body: { phoneNumber: Number(phoneNumber) },
        schema: checkAccountSchema,
        signal: options.signal,
      })
      return data.exist && data.chatId !== '' ? data.chatId : null
    },

    getContactInfo(chatId, options = {}) {
      return request({
        method: 'getContactInfo',
        body: { chatId },
        schema: contactInfoSchema,
        signal: options.signal,
      })
    },

    async sendMessage(chatId, message, options = {}) {
      if (message.trim() === '') throw new RangeError('message must not be empty')
      if (message.length > MAX_MESSAGE_LENGTH) {
        throw new RangeError(`message must not exceed ${MAX_MESSAGE_LENGTH} characters`)
      }
      const data = await request({
        method: 'sendMessage',
        body: { chatId, message },
        schema: sendMessageSchema,
        signal: options.signal,
      })
      return data.idMessage
    },

    async getChatHistory(chatId, options = {}) {
      const items = await request({
        method: 'getChatHistory',
        body: { chatId, count: options.count ?? DEFAULT_HISTORY_COUNT },
        schema: chatHistorySchema,
        signal: options.signal,
      })
      return items.map(parseHistoryItem).filter((item) => item !== null)
    },

    async readChat(chatId, options = {}) {
      const data = await request({
        method: 'readChat',
        body: { chatId },
        schema: readChatSchema,
        signal: options.signal,
      })
      return data.setRead
    },

    async receiveNotification(options = {}) {
      const receiveTimeout = options.receiveTimeout ?? DEFAULT_RECEIVE_TIMEOUT_S
      const envelope = await request({
        method: 'receiveNotification',
        query: { receiveTimeout },
        schema: notificationEnvelopeSchema,
        timeoutMs: receiveTimeout * 1000 + RECEIVE_TIMEOUT_MARGIN_MS,
        signal: options.signal,
      })
      if (envelope === null) return null
      return {
        receiptId: envelope.receiptId,
        notification: parseNotificationBody(envelope.body),
      }
    },

    async deleteNotification(receiptId, options = {}) {
      const data = await request({
        method: 'deleteNotification',
        httpMethod: 'DELETE',
        pathParam: receiptId,
        schema: deleteNotificationSchema,
        signal: options.signal,
      })
      return data.result
    },
  }
}
