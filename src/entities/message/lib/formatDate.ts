const timeFormatter = new Intl.DateTimeFormat('ru-RU', { hour: '2-digit', minute: '2-digit' })
const dayFormatter = new Intl.DateTimeFormat('ru-RU', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})
const shortDayFormatter = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'short' })

export function formatTime(timestamp: number): string {
  return timeFormatter.format(timestamp)
}

export function formatDay(timestamp: number): string {
  return dayFormatter.format(timestamp).replace(/\s*г\.$/, '')
}

export function dayKey(timestamp: number): string {
  const date = new Date(timestamp)
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
}

export function formatListTime(timestamp: number, now = Date.now()): string {
  return dayKey(timestamp) === dayKey(now)
    ? formatTime(timestamp)
    : shortDayFormatter.format(timestamp)
}
