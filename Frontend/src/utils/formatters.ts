export const formatNumber = (value: number, digits = 0) =>
  new Intl.NumberFormat('en-US', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value)

export const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max)

export const percentValue = (value: number) => `${Math.round(value)}%`
