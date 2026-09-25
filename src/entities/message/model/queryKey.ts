export function messagesQueryKey(idInstance: string, chatId: string) {
  return ['messages', idInstance, chatId] as const
}
