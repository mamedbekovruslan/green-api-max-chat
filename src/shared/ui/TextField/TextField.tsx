import { useId, useState, type InputHTMLAttributes } from 'react'
import { cn } from '@/shared/lib/cn'
import styles from './TextField.module.css'

interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> {
  label: string
  error?: string | undefined
  hint?: string | undefined
  revealable?: boolean
}

export function TextField({
  label,
  error,
  hint,
  revealable = false,
  type = 'text',
  className,
  ...rest
}: TextFieldProps) {
  const id = useId()
  const [revealed, setRevealed] = useState(false)
  const messageId = `${id}-message`
  const message = error ?? hint

  return (
    <div className={cn(styles.field, className)}>
      <label htmlFor={id} className={styles.label}>
        {label}
      </label>
      <div className={cn(styles.control, error && styles.invalid)}>
        <input
          id={id}
          type={revealable && !revealed ? 'password' : type}
          className={styles.input}
          aria-invalid={error ? true : undefined}
          aria-describedby={message ? messageId : undefined}
          {...rest}
        />
        {revealable && (
          <button
            type="button"
            className={styles.reveal}
            onClick={() => setRevealed((value) => !value)}
            aria-label={revealed ? `Скрыть ${label}` : `Показать ${label}`}
            aria-pressed={revealed}
          >
            {revealed ? 'Скрыть' : 'Показать'}
          </button>
        )}
      </div>
      {message && (
        <p id={messageId} className={cn(styles.message, error && styles.errorMessage)}>
          {message}
        </p>
      )}
    </div>
  )
}
