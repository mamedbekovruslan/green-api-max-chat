import { useState, type ChangeEvent, type FormEvent } from 'react'
import { useSessionStore } from '@/entities/session'
import { defaultApiUrl } from '@/shared/api/green-api'
import { getErrorMessage } from '@/shared/lib/errors'
import { Button, Checkbox, InfoTooltip, TextField } from '@/shared/ui'
import { useLogin, type LoginCheckResult } from '../api/useLogin'
import { validateLoginForm, type LoginFormErrors, type LoginFormInput } from '../model/loginForm'
import styles from './LoginForm.module.css'

const initialValues: LoginFormInput = {
  idInstance: '',
  apiTokenInstance: '',
  apiUrl: '',
  remember: false,
}

type TextFieldName = Exclude<keyof LoginFormInput, 'remember'>

export function LoginForm() {
  const [values, setValues] = useState(initialValues)
  const [errors, setErrors] = useState<LoginFormErrors>({})
  const [apiUrlEdited, setApiUrlEdited] = useState(false)
  const [pending, setPending] = useState<LoginCheckResult | null>(null)
  const login = useSessionStore((state) => state.login)
  const mutation = useLogin()

  const completeLogin = (result: LoginCheckResult) => {
    login(result.session, { remember: result.remember })
  }

  const handleTextChange = (name: TextFieldName) => (event: ChangeEvent<HTMLInputElement>) => {
    const { value } = event.target
    setValues((current) => {
      const next = { ...current, [name]: value }
      if (name === 'idInstance' && !apiUrlEdited) next.apiUrl = defaultApiUrl(value) ?? ''
      return next
    })
    if (name === 'apiUrl') setApiUrlEdited(true)
    setErrors((current) => {
      const next = { ...current }
      delete next[name]
      return next
    })
    mutation.reset()
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const validation = validateLoginForm(values)
    if (!validation.success) {
      setErrors(validation.errors)
      return
    }
    mutation.mutate(validation.values, {
      onSuccess: (result) => {
        if (result.warnings.length > 0) setPending(result)
        else completeLogin(result)
      },
    })
  }

  if (pending) {
    return (
      <div className={styles.form}>
        <h2 className={styles.warningTitle}>Инстанс настроен не полностью</h2>
        <ul className={styles.warnings}>
          {pending.warnings.map((warning) => (
            <li key={warning}>{warning}</li>
          ))}
        </ul>
        <p className={styles.note}>
          Настройки меняются в личном кабинете GREEN-API в разделе «Уведомления».
        </p>
        <div className={styles.actions}>
          <Button fullWidth onClick={() => completeLogin(pending)}>
            Всё равно войти
          </Button>
          <Button variant="secondary" fullWidth onClick={() => setPending(null)}>
            Назад
          </Button>
        </div>
      </div>
    )
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      <TextField
        label="idInstance"
        name="idInstance"
        inputMode="numeric"
        autoComplete="off"
        placeholder="1101000001"
        value={values.idInstance}
        onChange={handleTextChange('idInstance')}
        error={errors.idInstance}
      />
      <TextField
        label="apiTokenInstance"
        name="apiTokenInstance"
        revealable
        autoComplete="off"
        spellCheck={false}
        value={values.apiTokenInstance}
        onChange={handleTextChange('apiTokenInstance')}
        error={errors.apiTokenInstance}
      />
      <TextField
        label="Адрес API"
        name="apiUrl"
        type="url"
        autoComplete="off"
        placeholder="https://1101.api.green-api.com"
        value={values.apiUrl}
        onChange={handleTextChange('apiUrl')}
        error={errors.apiUrl}
        hint="Подставляется по idInstance. Указан в личном кабинете как apiUrl"
      />
      <div className={styles.rememberRow}>
        <Checkbox
          label="Не выходить после закрытия вкладки"
          name="remember"
          checked={values.remember}
          onChange={(event) =>
            setValues((current) => ({ ...current, remember: event.target.checked }))
          }
        />
        <InfoTooltip
          label="Подробнее о сохранении входа"
          text="Данные сохранятся в браузере до нажатия «Выйти». Не включайте на чужом компьютере"
        />
      </div>
      {mutation.isError && (
        <p role="alert" className={styles.error}>
          {getErrorMessage(mutation.error)}
        </p>
      )}
      <Button type="submit" fullWidth loading={mutation.isPending}>
        Войти
      </Button>
    </form>
  )
}
