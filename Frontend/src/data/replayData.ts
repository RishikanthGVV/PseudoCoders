import type { TelemetryMetric, TelemetryPoint } from './engineData'

export type ReplayHealth = 'HEALTHY' | 'WARNING' | 'CRITICAL'
export type ReplayComponentState = 'NORMAL' | 'DEGRADING' | 'WARNING' | 'CRITICAL'

export type ReplayFrame = {
  cycle: number
  rul: number
  health: number
  status: ReplayHealth
  telemetry: TelemetryMetric[]
}

export const getReplayComponentState = (component: string, cycle: number): ReplayComponentState => {
  const stateCycle = Math.max(0, Math.min(218, cycle))
  const thresholds: Record<string, [number, number, number]> = {
    fan: [150, 190, 210],
    compressor: [62, 125, 185],
    combustor: [84, 145, 190],
    'hp-turbine': [52, 112, 176],
    'lp-turbine': [132, 176, 205],
    exhaust: [70, 145, 190],
  }
  const [degrading, warning, critical] = thresholds[component] ?? [100, 160, 200]
  if (stateCycle >= critical) return 'CRITICAL'
  if (stateCycle >= warning) return 'WARNING'
  if (stateCycle >= degrading) return 'DEGRADING'
  return 'NORMAL'
}

export const replayRuns = [
  {
    id: 'FD001-001',
    label: 'FD001-001 / DEMO REPLAY',
    totalCycles: 218,
    source: 'NASA C-MAPSS FD001 shape / deterministic frontend adapter',
  },
]

export const replayEvents = [
  { time: 'DERIVED', cycle: 72, sensor: 'VIBRATION', component: 'hp-turbine', message: 'DEMO EVENT / VIBRATION TREND ENTERS WATCH BAND', level: 'watch' as const },
  { time: 'DERIVED', cycle: 145, sensor: 'EXHAUST TEMP', component: 'exhaust', message: 'DERIVED CONDITION / THERMAL MARGIN REDUCING', level: 'watch' as const },
  { time: 'DERIVED', cycle: 190, sensor: 'CORE TEMP', component: 'combustor', message: 'DEMO EVENT / ENGINE CONDITION CRITICAL', level: 'critical' as const },
]

const signalProfiles = [
  { key: 'fan-speed', name: 'FAN SPEED', unit: 'RPM', start: 6120, end: 6812, min: 5960, max: 6895 },
  { key: 'core-speed', name: 'CORE SPEED', unit: 'RPM', start: 8250, end: 9184, min: 8060, max: 9255 },
  { key: 'core-temp', name: 'CORE TEMP', unit: 'K', start: 662, end: 742, min: 650, max: 750 },
  { key: 'exhaust-temp', name: 'EXHAUST TEMP', unit: 'K', start: 718, end: 803, min: 704, max: 816 },
  { key: 'pressure-ratio', name: 'PRESSURE RATIO', unit: 'PR', start: 14.4, end: 17.6, min: 14, max: 18.1 },
  { key: 'fuel-flow', name: 'FUEL FLOW', unit: 'kg/s', start: 2.72, end: 3.42, min: 2.6, max: 3.52 },
  { key: 'oil-pressure', name: 'OIL PRESSURE', unit: 'PSI', start: 48, end: 62, min: 45, max: 64 },
  { key: 'vibration', name: 'VIBRATION', unit: 'mm/s', start: 1.12, end: 2.41, min: 1, max: 2.62 },
]

const roundValue = (value: number, key: string) => key === 'pressure-ratio' || key === 'fuel-flow' || key === 'vibration' ? Number(value.toFixed(2)) : Math.round(value)

const valueAt = (profile: (typeof signalProfiles)[number], cycle: number) => {
  const progress = cycle / 218
  const degradation = progress * progress * 0.08
  return roundValue(profile.start + (profile.end - profile.start) * progress + degradation * (profile.end - profile.start), profile.key)
}

const statusAt = (health: number): ReplayHealth => health <= 35 ? 'CRITICAL' : health <= 65 ? 'WARNING' : 'HEALTHY'

export const getReplayFrame = (cycle: number): ReplayFrame => {
  const boundedCycle = Math.max(0, Math.min(218, Math.round(cycle)))
  const progress = boundedCycle / 218
  const health = Math.max(8, Math.round(100 - progress * 48 - Math.max(0, progress - 0.72) * 85))
  const rul = Math.max(0, Math.round(218 - boundedCycle))
  const status = statusAt(health)

  const telemetry = signalProfiles.map((profile) => {
    const current = valueAt(profile, boundedCycle)
    const history: TelemetryPoint[] = Array.from({ length: Math.floor(boundedCycle / 10) + 1 }, (_, index) => {
      const historyCycle = Math.min(boundedCycle, index * 10)
      return { cycle: historyCycle, value: valueAt(profile, historyCycle) }
    })
    const previous = valueAt(profile, Math.max(0, boundedCycle - 10))
    const delta = Number((((current - previous) / Math.max(Math.abs(previous), 1)) * 100).toFixed(1))
    const values = history.map((point) => point.value)

    return {
      key: profile.key,
      name: profile.name,
      unit: profile.unit,
      current,
      status: status === 'CRITICAL' ? 'CRITICAL' : status === 'WARNING' ? 'WATCH' : 'NORMAL',
      delta,
      trend: values.slice(-6),
      min: Math.min(profile.min, ...values),
      max: Math.max(profile.max, ...values),
      avg: Number((values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(profile.key === 'pressure-ratio' || profile.key === 'fuel-flow' || profile.key === 'vibration' ? 2 : 0)),
      history,
    } satisfies TelemetryMetric
  })

  return { cycle: boundedCycle, rul, health, status, telemetry }
}

export const getReplayDegradationSeries = (cycle: number) => {
  const boundedCycle = Math.max(0, Math.min(218, Math.round(cycle)))
  return Array.from({ length: Math.floor(boundedCycle / 10) + 1 }, (_, index) => {
    const pointCycle = Math.min(boundedCycle, index * 10)
    const progress = pointCycle / 218
    return {
      cycle: pointCycle,
      observed: Math.round(100 - progress * 48),
      predicted: Math.round(100 - progress * 56),
      threshold: 35,
    }
  })
}
