const instanceData = { idInstance: 1234567890, wid: '79990000001@c.us', typeInstance: 'v3' }

export const CONTACT_CHAT_ID = '5500000'
export const CONTACT_PHONE = '79990000000'

export const settingsResponse = {
  wid: '79990000001@c.us',
  typeInstance: 'v3',
  webhookUrl: '',
  webhookUrlToken: '',
  delaySendMessagesMilliseconds: 500,
  markIncomingMessagesReaded: 'no',
  outgoingWebhook: 'yes',
  outgoingMessageWebhook: 'no',
  outgoingAPIMessageWebhook: 'no',
  incomingWebhook: 'yes',
  stateWebhook: 'no',
}

export const contactInfoResponse = {
  avatar: 'https://i.oneme.ru/i?r=avatar',
  name: 'Имя в профиле',
  contactName: 'Имя в контактах',
  chatId: CONTACT_CHAT_ID,
  chatType: 'user',
  lastSeen: 1790342882,
  phoneNumber: Number(CONTACT_PHONE),
  phoneNumberTimestamp: 1790342846,
}

export const incomingTextBody = {
  typeWebhook: 'incomingMessageReceived',
  instanceData,
  timestamp: 1790342863,
  idMessage: '117331909909756411',
  senderData: {
    chatId: CONTACT_CHAT_ID,
    chatName: 'Имя в профиле',
    chatType: 'user',
    sender: CONTACT_CHAT_ID,
    senderName: 'Имя в профиле',
    senderType: 'user',
    senderContactName: 'Имя в контактах',
    senderPhoneNumber: Number(CONTACT_PHONE),
  },
  messageData: {
    typeMessage: 'textMessage',
    textMessageData: { textMessage: 'Текст ответа', forwardingScore: 0, isForwarded: false },
    quotedMessage: {
      participant: '32083332',
      stanzaId: '1790342846743',
      typeMessage: 'textMessage',
      textMessage: 'Исходное сообщение',
      isForwarded: false,
      forwardingScore: 0,
    },
  },
}

export const incomingExtendedTextBody = {
  ...incomingTextBody,
  idMessage: '117331909909756412',
  messageData: {
    typeMessage: 'extendedTextMessage',
    extendedTextMessageData: { text: 'Ссылка https://example.com', title: '', description: '' },
  },
}

export const incomingImageBody = {
  ...incomingTextBody,
  idMessage: '117331909909756413',
  messageData: {
    typeMessage: 'imageMessage',
    fileMessageData: { downloadUrl: 'https://example.com/image.jpg', caption: '' },
  },
}

export const outgoingStatusBody = {
  typeWebhook: 'outgoingMessageStatus',
  chatId: CONTACT_CHAT_ID,
  instanceData,
  timestamp: 1790342846,
  idMessage: '1790342846743',
  status: 'delivered',
}

export const quotaExceededBody = {
  typeWebhook: 'quotaExceeded',
  instanceData,
  quotaData: {
    method: 'correspondents',
    used: 3,
    total: 3,
    status: 'CORRESPONDENTS_QUOTA_EXCEEDED',
  },
}

export const stateChangedBody = {
  typeWebhook: 'stateInstanceChanged',
  instanceData,
  timestamp: 1790342900,
  stateInstance: 'authorized',
}
