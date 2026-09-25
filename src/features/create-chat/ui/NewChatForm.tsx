import { useState, type FormEvent } from 'react'
import { getErrorMessage } from '@/shared/lib/errors'
import { ArrowLeftIcon, Button, IconButton, TextField } from '@/shared/ui'
import { useCreateChat } from '../api/useCreateChat'
import { validatePhone } from '../model/resolveChat'
import styles from './NewChatForm.module.css'

interface NewChatFormProps {
  onClose: () => void
}

export function NewChatForm({ onClose }: NewChatFormProps) {
  const [phone, setPhone] = useState('')
  const [phoneError, setPhoneError] = useState<string>()
  const mutation = useCreateChat()

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const validation = validatePhone(phone)
    if ('error' in validation) {
      setPhoneError(validation.error)
      return
    }
    mutation.mutate(validation.phone, { onSuccess: onClose })
  }

  return (
    <section className={styles.panel} aria-labelledby="new-chat-title">
      <header className={styles.header}>
        <IconButton label="Назад" icon={<ArrowLeftIcon />} onClick={onClose} />
        <h2 id="new-chat-title" className={styles.title}>
          Новый чат
        </h2>
      </header>
      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        <TextField
          label="Номер телефона"
          name="phone"
          type="tel"
          inputMode="tel"
          autoComplete="off"
          autoFocus
          placeholder="+7 999 123-45-67"
          value={phone}
          onChange={(event) => {
            setPhone(event.target.value)
            setPhoneError(undefined)
            mutation.reset()
          }}
          error={phoneError}
          hint="Номер собеседника, зарегистрированного в MAX"
        />
        {mutation.isError && (
          <p role="alert" className={styles.error}>
            {getErrorMessage(mutation.error)}
          </p>
        )}
        <Button type="submit" fullWidth loading={mutation.isPending}>
          Создать чат
        </Button>
      </form>
    </section>
  )
}
