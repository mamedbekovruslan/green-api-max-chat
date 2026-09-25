import { useId } from 'react'
import styles from './InfoTooltip.module.css'

interface InfoTooltipProps {
  label: string
  text: string
}

export function InfoTooltip({ label, text }: InfoTooltipProps) {
  const tooltipId = useId()

  return (
    <span className={styles.wrapper}>
      <button
        type="button"
        className={styles.trigger}
        aria-label={label}
        aria-describedby={tooltipId}
      >
        i
      </button>
      <span id={tooltipId} role="tooltip" className={styles.tooltip}>
        {text}
      </span>
    </span>
  )
}
