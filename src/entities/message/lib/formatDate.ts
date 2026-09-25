const timeFormatter = new Intl.DateTimeFormat('ru-RU', { hour: '2-digit', minute: '2-digit' })
const dayFormatter = new Intl.DateTimeFormat('ru-RU', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})

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
