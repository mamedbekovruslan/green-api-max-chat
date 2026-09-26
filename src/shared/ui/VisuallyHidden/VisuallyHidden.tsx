import type { ComponentProps } from 'react'
import styles from './VisuallyHidden.module.css'

export function VisuallyHidden(props: ComponentProps<'span'>) {
  return <span className={styles.hidden} {...props} />
}
