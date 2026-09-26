import { cn } from '@/shared/lib/cn'
import styles from './Skeleton.module.css'

interface SkeletonProps {
  width: number | string
  height: number
  className?: string | undefined
}

export function Skeleton({ width, height, className }: SkeletonProps) {
  return (
    <span className={cn(styles.skeleton, className)} style={{ width, height }} aria-hidden="true" />
  )
}
