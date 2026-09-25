import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from '@/shared/lib/cn'
import styles from './IconButton.module.css'

interface IconButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'aria-label'> {
  label: string
  icon: ReactNode
  variant?: 'accent' | 'ghost'
}

export function IconButton({
  label,
  icon,
  variant = 'ghost',
  className,
  type = 'button',
  ...rest
}: IconButtonProps) {
  return (
    <button
      type={type}
      className={cn(styles.button, styles[variant], className)}
      aria-label={label}
      title={label}
      {...rest}
    >
      {icon}
    </button>
  )
}
