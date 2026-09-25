import type { InputHTMLAttributes } from 'react'
import { cn } from '@/shared/lib/cn'
import styles from './Checkbox.module.css'

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string
}

export function Checkbox({ label, className, ...rest }: CheckboxProps) {
  return (
    <label className={cn(styles.checkbox, className)}>
      <input type="checkbox" className={styles.input} {...rest} />
      <span>{label}</span>
    </label>
  )
}
