export type MessageStatus = 'pending' | 'sent' | 'delivered' | 'read' | 'failed'

export type MessageDirection = 'incoming' | 'outgoing'

export interface Message {
  id: string
  chatId: string
  text: string
  timestamp: number
  direction: MessageDirection
  status: MessageStatus | null
  failureReason: string | null
}
