export function toError(error: unknown): Error {
  return error instanceof Error ? error : new Error(String(error))
}

export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}

const pad = (value: number) => String(value).padStart(2, '0')

/** 75 -> "01:15", 3725 -> "1:02:05" */
export function formatDuration(seconds: number | undefined): string {
  const total = Math.max(0, Math.floor(Number(seconds) || 0))
  const hours = Math.floor(total / 3600)
  const minutes = Math.floor((total % 3600) / 60)
  const secs = total % 60
  return hours > 0 ? `${hours}:${pad(minutes)}:${pad(secs)}` : `${pad(minutes)}:${pad(secs)}`
}

/** `createdTime` is a Unix timestamp in seconds, as returned by the Dailymotion API. */
export function formatDate(createdTime: number | undefined, locale?: string): string {
  const date = new Date(Number(createdTime) * 1000)
  if (!createdTime || Number.isNaN(date.getTime())) return ''
  const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' }
  try {
    return new Intl.DateTimeFormat(locale, options).format(date)
  } catch {
    return new Intl.DateTimeFormat(undefined, options).format(date)
  }
}
