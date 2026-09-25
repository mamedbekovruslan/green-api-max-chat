import { useState } from 'react'
import styles from './Avatar.module.css'

const GRADIENTS = [
  ['#8e7cff', '#5a8bff'],
  ['#ff8a65', '#ff5c8a'],
  ['#4fc3f7', '#2d8cff'],
  ['#66d19e', '#23a6a0'],
  ['#ffc24b', '#ff8a3d'],
  ['#c77dff', '#8e5cff'],
] as const

function pickGradient(seed: string): string {
  let hash = 0
  for (const char of seed) hash = (hash * 31 + char.charCodeAt(0)) >>> 0
  const [from, to] = GRADIENTS[hash % GRADIENTS.length] ?? GRADIENTS[0]
  return `linear-gradient(135deg, ${from}, ${to})`
}

function initialOf(name: string): string {
  return name.match(/[\p{L}\p{N}]/u)?.[0]?.toUpperCase() ?? '?'
}

interface AvatarProps {
  name: string
  seed: string
  src?: string | null | undefined
  size?: number
}

export function Avatar({ name, seed, src, size = 56 }: AvatarProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null)
  const dimensions = { width: size, height: size }

  if (src && src !== failedSrc) {
    return (
      <img
        className={styles.avatar}
        style={dimensions}
        src={src}
        alt=""
        referrerPolicy="no-referrer"
        onError={() => setFailedSrc(src)}
      />
    )
  }

  return (
    <span
      className={styles.avatar}
      style={{ ...dimensions, background: pickGradient(seed), fontSize: size * 0.42 }}
      aria-hidden="true"
      data-testid="avatar-fallback"
    >
      {initialOf(name)}
    </span>
  )
}
