import styles from './DaySeparator.module.css'

export function DaySeparator({ label }: { label: string }) {
  return (
    <div className={styles.separator}>
      <span className={styles.label}>{label}</span>
    </div>
  )
}
