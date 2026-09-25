import type { GreenApiClient, InstanceSettings } from '@/shared/api/green-api'
import { UserFacingError } from '@/shared/lib/errors'

const INSTANCE_STATE_MESSAGES: Record<string, string> = {
  notAuthorized: 'Инстанс не привязан к аккаунту MAX. Авторизуйте его в личном кабинете GREEN-API',
  blocked: 'Аккаунт MAX заблокирован',
  sleepMode: 'Инстанс в спящем режиме. Проверьте его состояние в личном кабинете GREEN-API',
  starting: 'Инстанс запускается. Попробуйте через минуту',
  yellowCard: 'Мессенджер временно ограничил отправку сообщений с этого аккаунта',
}

export class InstanceStateError extends UserFacingError {
  override readonly name = 'InstanceStateError'
  readonly state: string

  constructor(state: string) {
    super(INSTANCE_STATE_MESSAGES[state] ?? `Инстанс недоступен (состояние: ${state})`)
    this.state = state
  }
}

export function getSettingsWarnings(settings: InstanceSettings): string[] {
  const warnings: string[] = []
  if (settings.webhookUrl !== '') {
    warnings.push(
      'Задан «Адрес отправки уведомлений (URL)» — уведомления уходят туда, и входящие сообщения не появятся в чате. Очистите это поле.',
    )
  }
  if (settings.incomingWebhook !== 'yes') {
    warnings.push(
      'Выключено «Получать уведомления о входящих сообщениях и файлах» — ответы собеседников не появятся в чате.',
    )
  }
  if (settings.outgoingWebhook !== 'yes') {
    warnings.push(
      'Выключено «Получать уведомления о статусах отправленных сообщений» — не будет отметок о доставке и прочтении.',
    )
  }
  return warnings
}

export interface InstanceCheck {
  wid: string | undefined
  warnings: string[]
}

export async function verifyInstance(
  client: GreenApiClient,
  signal?: AbortSignal,
): Promise<InstanceCheck> {
  const state = await client.getStateInstance({ signal })
  if (state !== 'authorized') throw new InstanceStateError(state)

  const settings = await client.getSettings({ signal })
  return { wid: settings.wid, warnings: getSettingsWarnings(settings) }
}
