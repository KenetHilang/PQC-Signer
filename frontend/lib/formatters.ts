export function formatBytes(value: number | undefined | null): string {
  if (!Number.isFinite(value)) {
    return '-'
  }
  if ((value as number) < 1024) {
    return `${value} B`
  }
  const units = ['KB', 'MB', 'GB']
  let current = (value as number) / 1024
  let unit = units[0]
  for (let index = 1; index < units.length && current >= 1024; index += 1) {
    current /= 1024
    unit = units[index]
  }
  return `${current.toFixed(current >= 10 ? 0 : 1)} ${unit}`
}

export function formatTimestamp(value: string | undefined | null): string {
  if (!value) {
    return '-'
  }
  const parsed = new Date(value)
  return Number.isNaN(parsed.valueOf()) ? value : parsed.toLocaleString()
}

export function truncateMiddle(value: string | undefined | null, start = 10, end = 8): string {
  if (!value || value.length <= start + end + 3) {
    return value || '-'
  }
  return `${value.slice(0, start)}...${value.slice(-end)}`
}

export function parseJsonInput<T>(value: string): T {
  return JSON.parse(value) as T
}
