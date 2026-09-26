import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from 'react'
import { MAX_MESSAGE_LENGTH } from '@/shared/api/green-api'
import { cn } from '@/shared/lib/cn'
import { IconButton, SendIcon, VisuallyHidden } from '@/shared/ui'
import styles from './MessageInput.module.css'

const COUNTER_THRESHOLD = MAX_MESSAGE_LENGTH - 500
const MAX_TEXTAREA_HEIGHT = 160

interface MessageInputProps {
  onSend: (text: string) => void
  disabled?: boolean
  autoFocus?: boolean
}

function limitAnnouncement(length: number): string {
  if (length >= MAX_MESSAGE_LENGTH) return `Достигнут лимит: ${MAX_MESSAGE_LENGTH} символов`
  if (length >= COUNTER_THRESHOLD) return 'Осталось меньше 500 символов'
  return ''
}

export function MessageInput({ onSend, disabled = false, autoFocus = false }: MessageInputProps) {
  const [text, setText] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const canSend = !disabled && text.trim() !== ''

  useEffect(() => {
    if (autoFocus && !disabled) textareaRef.current?.focus()
  }, [autoFocus, disabled])

  useLayoutEffect(() => {
    const textarea = textareaRef.current
    if (!textarea) return
    textarea.style.height = 'auto'
    textarea.style.height = `${Math.min(textarea.scrollHeight, MAX_TEXTAREA_HEIGHT)}px`
  }, [text])

  const submit = () => {
    if (!canSend) return
    onSend(text.trim())
    setText('')
    textareaRef.current?.focus()
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    submit()
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault()
      submit()
    }
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.panel}>
        <textarea
          ref={textareaRef}
          className={styles.textarea}
          rows={1}
          placeholder="Сообщение"
          aria-label="Сообщение"
          maxLength={MAX_MESSAGE_LENGTH}
          value={text}
          disabled={disabled}
          onChange={(event) => setText(event.target.value)}
          onKeyDown={handleKeyDown}
        />
        {text.length >= COUNTER_THRESHOLD && (
          <span
            className={cn(styles.counter, text.length >= MAX_MESSAGE_LENGTH && styles.counterLimit)}
          >
            {text.length}/{MAX_MESSAGE_LENGTH}
          </span>
        )}
        <IconButton
          type="submit"
          label="Отправить"
          icon={<SendIcon />}
          variant="accent"
          disabled={!canSend}
          className={styles.send}
        />
      </div>
      <VisuallyHidden aria-live="polite">{limitAnnouncement(text.length)}</VisuallyHidden>
    </form>
  )
}
