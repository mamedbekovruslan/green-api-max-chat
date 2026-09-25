import { z } from 'zod'

export const chatSchema = z.object({
  chatId: z.string().min(1),
  phone: z.string().nullable(),
  name: z.string(),
  avatarUrl: z.string().nullable(),
})

export type Chat = z.infer<typeof chatSchema>
