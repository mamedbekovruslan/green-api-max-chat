export function formatPhone(digits: string): string {
  const match = /^7(\d{3})(\d{3})(\d{2})(\d{2})$/.exec(digits)
  if (match) return `+7 ${match[1]} ${match[2]}-${match[3]}-${match[4]}`
  return `+${digits}`
}

export function phoneFromWid(wid: string): string {
  return formatPhone(wid.split('@')[0] ?? wid)
}
