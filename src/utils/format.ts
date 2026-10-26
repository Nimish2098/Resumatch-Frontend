export const formatDate = (value: string | number) => {
  const num = Number(value)
  // Under 1e11 means Unix seconds; otherwise milliseconds. Non-numeric values are parsed as ISO strings.
  const ms = Number.isFinite(num) ? (num < 1e11 ? num * 1000 : num) : new Date(value).getTime()
  const date = new Date(ms)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}