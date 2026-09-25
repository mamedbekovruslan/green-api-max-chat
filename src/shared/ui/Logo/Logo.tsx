import { useId } from 'react'

interface LogoProps {
  size?: number
}

export function Logo({ size = 64 }: LogoProps) {
  const gradientId = useId()

  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#3d8bff" />
          <stop offset="1" stopColor="#7a4dff" />
        </linearGradient>
      </defs>
      <circle cx="16" cy="16" r="16" fill={`url(#${gradientId})`} />
      <path
        fill="#ffffff"
        d="M16 8c-4.97 0-9 3.36-9 7.5 0 2.2 1.14 4.18 2.96 5.55L9.5 25l4.1-2.2c.77.13 1.57.2 2.4.2 4.97 0 9-3.36 9-7.5S20.97 8 16 8z"
      />
    </svg>
  )
}
