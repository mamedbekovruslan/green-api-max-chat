import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useCallback } from 'react'
import { useChatStore } from '@/entities/chat'
import { messagesQueryKey, patchMessage, upsertMessage, type Message } from '@/entities/message'
import { useGreenApiClient, useSessionStore } from '@/entities/session'
import { getErrorMessage } from '@/shared/lib/errors'

interface SendVariables {
  localId: string
  text: string
}

function createLocalId(): string {
  return `local-${crypto.randomUUID()}`
}

export function useSendMessage(chatId: string) {
  const client = useGreenApiClient()
  const queryClient = useQueryClient()
  const idInstance = useSessionStore((state) => state.session?.credentials.idInstance ?? '')
  const queryKey = messagesQueryKey(idInstance, chatId)

  const { mutate } = useMutation({
    mutationFn: ({ text }: SendVariables) => client.sendMessage(chatId, text),
    onMutate: ({ localId, text }) => {
      queryClient.setQueryData<Message[]>(queryKey, (messages) =>
        upsertMessage(messages, {
          id: localId,
          chatId,
          text,
          timestamp: Date.now(),
          direction: 'outgoing',
          status: 'pending',
          failureReason: null,
        }),
      )
      useChatStore.getState().bumpChat(chatId)
    },
    onSuccess: (idMessage, { localId }) => {
      queryClient.setQueryData<Message[]>(queryKey, (messages) =>
        patchMessage(messages, localId, { id: idMessage, status: 'sent' }),
      )
    },
    onError: (error, { localId }) => {
      queryClient.setQueryData<Message[]>(queryKey, (messages) =>
        patchMessage(messages, localId, {
          status: 'failed',
          failureReason: getErrorMessage(error),
        }),
      )
    },
  })

  const send = useCallback((text: string) => mutate({ localId: createLocalId(), text }), [mutate])

  const retry = useCallback(
    (message: Message) => mutate({ localId: message.id, text: message.text }),
    [mutate],
  )

  return { send, retry }
}
