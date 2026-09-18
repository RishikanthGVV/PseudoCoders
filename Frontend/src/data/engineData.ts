export type ScreenName = 'command' | 'digitalTwin' | 'telemetry' | 'prediction' | 'maintenance'

export type TelemetryPoint = {
  cycle: number
  value: number
}

export type TelemetryMetric = {
  key: string
  name: string
  unit: string
  current: number
  status: 'NORMAL' | 'WATCH' | 'CRITICAL'
  delta: number
  trend: number[]
  min: number
  max: number
  avg: number
  history: TelemetryPoint[]
}

export type ComponentHealth = {
  name: string
  label: string
  health: number
  temperature: number
  pressure: number
  efficiency: number
  trend: 'STABLE' | 'DECLINING' | 'RECOVERING'
}

export type AnomalyLevel = 'normal' | 'watch' | 'critical'

export type AnomalyEvent = {
  time: string
  cycle: number
  sensor: string
  component: string
  message: string
  level: AnomalyLevel
}

export const engineMeta = {
  aircraftId: 'TG-047',
  engineId: 'CFM-01',
  currentCycle: 218,
  rul: 87,
  health: 94,
  status: 'NOMINAL',
  nextInspection: 42,
  serviceWindow: 'WITHIN 40–50 CYCLES',
  risk: 'LOW',
  projectedCriticalThreshold: 305,
  model: 'Random Forest Regressor',
  dataset: 'NASA C-MAPSS / FD001',
  target: 'Remaining Useful Life',
}

export const telemetryMetrics: TelemetryMetric[] = [
  {
    key: 'fan-speed',
    name: 'FAN SPEED',
    unit: 'RPM',
    current: 6812,
    status: 'NORMAL',
    delta: 1.8,
    trend: [6500, 6610, 6715, 6800, 6794, 6812],
    min: 6420,
    max: 6895,
    avg: 6725,
    history: [
      { cycle: 170, value: 6384 },
      { cycle: 180, value: 6460 },
      { cycle: 190, value: 6552 },
      { cycle: 200, value: 6648 },
      { cycle: 210, value: 6724 },
      { cycle: 218, value: 6812 },
    ],
  },
  {
    key: 'core-speed',
    name: 'CORE SPEED',
    unit: 'RPM',
    current: 9184,
    status: 'NORMAL',
    delta: 1.4,
    trend: [8700, 8830, 9005, 9088, 9150, 9184],
    min: 8600,
    max: 9255,
    avg: 9010,
    history: [
      { cycle: 170, value: 8671 },
      { cycle: 180, value: 8762 },
      { cycle: 190, value: 8901 },
      { cycle: 200, value: 9035 },
      { cycle: 210, value: 9108 },
      { cycle: 218, value: 9184 },
    ],
  },
  {
    key: 'core-temp',
    name: 'CORE TEMP',
    unit: 'K',
    current: 742,
    status: 'NORMAL',
    delta: 1.9,
    trend: [695, 705, 715, 728, 736, 742],
    min: 688,
    max: 750,
    avg: 721,
    history: [
      { cycle: 170, value: 694 },
      { cycle: 180, value: 706 },
      { cycle: 190, value: 714 },
      { cycle: 200, value: 728 },
      { cycle: 210, value: 734 },
      { cycle: 218, value: 742 },
    ],
  },
  {
    key: 'exhaust-temp',
    name: 'EXHAUST TEMP',
    unit: 'K',
    current: 803,
    status: 'WATCH',
    delta: 2.4,
    trend: [760, 771, 780, 790, 798, 803],
    min: 756,
    max: 816,
    avg: 784,
    history: [
      { cycle: 170, value: 760 },
      { cycle: 180, value: 771 },
      { cycle: 190, value: 782 },
      { cycle: 200, value: 791 },
      { cycle: 210, value: 798 },
      { cycle: 218, value: 803 },
    ],
  },
  {
    key: 'pressure-ratio',
    name: 'PRESSURE RATIO',
    unit: 'PR',
    current: 17.6,
    status: 'NORMAL',
    delta: 1.1,
    trend: [16.1, 16.5, 16.9, 17.2, 17.5, 17.6],
    min: 15.8,
    max: 18.1,
    avg: 16.9,
    history: [
      { cycle: 170, value: 15.9 },
      { cycle: 180, value: 16.3 },
      { cycle: 190, value: 16.7 },
      { cycle: 200, value: 17.1 },
      { cycle: 210, value: 17.4 },
      { cycle: 218, value: 17.6 },
    ],
  },
  {
    key: 'fuel-flow',
    name: 'FUEL FLOW',
    unit: 'kg/s',
    current: 3.42,
    status: 'NORMAL',
    delta: 0.9,
    trend: [3.08, 3.14, 3.22, 3.31, 3.38, 3.42],
    min: 3.01,
    max: 3.52,
    avg: 3.26,
    history: [
      { cycle: 170, value: 3.06 },
      { cycle: 180, value: 3.12 },
      { cycle: 190, value: 3.19 },
      { cycle: 200, value: 3.28 },
      { cycle: 210, value: 3.34 },
      { cycle: 218, value: 3.42 },
    ],
  },
  {
    key: 'oil-pressure',
    name: 'OIL PRESSURE',
    unit: 'PSI',
    current: 62,
    status: 'NORMAL',
    delta: 1.2,
    trend: [56, 57, 59, 60, 61, 62],
    min: 54,
    max: 64,
    avg: 59,
    history: [
      { cycle: 170, value: 55 },
      { cycle: 180, value: 56 },
      { cycle: 190, value: 58 },
      { cycle: 200, value: 59 },
      { cycle: 210, value: 60 },
      { cycle: 218, value: 62 },
    ],
  },
  {
    key: 'vibration',
    name: 'VIBRATION',
    unit: 'mm/s',
    current: 2.41,
    status: 'WATCH',
    delta: 3.1,
    trend: [1.88, 1.97, 2.08, 2.21, 2.31, 2.41],
    min: 1.8,
    max: 2.62,
    avg: 2.17,
    history: [
      { cycle: 170, value: 1.9 },
      { cycle: 180, value: 1.98 },
      { cycle: 190, value: 2.1 },
      { cycle: 200, value: 2.24 },
      { cycle: 210, value: 2.32 },
      { cycle: 218, value: 2.41 },
    ],
  },
]

export const degradationSeries = [
  { cycle: 120, observed: 96, predicted: 96, threshold: 70 },
  { cycle: 142, observed: 95.5, predicted: 95.4, threshold: 70 },
  { cycle: 160, observed: 95.1, predicted: 95, threshold: 70 },
  { cycle: 180, observed: 94.8, predicted: 94.5, threshold: 70 },
  { cycle: 200, observed: 94.2, predicted: 93.7, threshold: 70 },
  { cycle: 218, observed: 94, predicted: 92.8, threshold: 70 },
  { cycle: 235, observed: 93.6, predicted: 91.4, threshold: 70 },
  { cycle: 255, observed: 93.1, predicted: 89.6, threshold: 70 },
  { cycle: 275, observed: 92.2, predicted: 87.5, threshold: 70 },
  { cycle: 295, observed: 91.1, predicted: 84.7, threshold: 70 },
  { cycle: 305, observed: 90.1, predicted: 82.1, threshold: 70 },
]

export const anomalyEvents: AnomalyEvent[] = [
  { time: '09:41:22', cycle: 218, sensor: 'CORE TEMP', component: 'combustor', message: 'TEMPERATURE TREND NORMAL', level: 'normal' },
  { time: '09:41:18', cycle: 218, sensor: 'VIBRATION', component: 'hp-turbine', message: 'VIBRATION WITHIN LIMIT', level: 'watch' },
  { time: '09:41:11', cycle: 217, sensor: 'PRESSURE RATIO', component: 'compressor', message: 'COMPRESSOR EFFICIENCY DECLINING', level: 'watch' },
  { time: '09:40:58', cycle: 217, sensor: 'EXHAUST TEMP', component: 'exhaust', message: 'NO CRITICAL ANOMALY DETECTED', level: 'normal' },
  { time: '09:40:46', cycle: 216, sensor: 'FUEL FLOW', component: 'combustor', message: 'FUEL FLOW STABLE', level: 'normal' },
]

export const componentHealth: ComponentHealth[] = [
  {
    name: 'fan',
    label: 'FAN',
    health: 97,
    temperature: 642,
    pressure: 1.8,
    efficiency: 96.6,
    trend: 'STABLE',
  },
  {
    name: 'compressor',
    label: 'COMPRESSOR',
    health: 94,
    temperature: 728,
    pressure: 3.7,
    efficiency: 94.9,
    trend: 'DECLINING',
  },
  {
    name: 'combustor',
    label: 'COMBUSTOR',
    health: 92,
    temperature: 982,
    pressure: 6.1,
    efficiency: 92.8,
    trend: 'DECLINING',
  },
  {
    name: 'hp-turbine',
    label: 'HP TURBINE',
    health: 91,
    temperature: 1032,
    pressure: 5.6,
    efficiency: 94.2,
    trend: 'DECLINING',
  },
  {
    name: 'lp-turbine',
    label: 'LP TURBINE',
    health: 95,
    temperature: 887,
    pressure: 4.3,
    efficiency: 95.1,
    trend: 'STABLE',
  },
  {
    name: 'exhaust',
    label: 'EXHAUST',
    health: 96,
    temperature: 812,
    pressure: 2.4,
    efficiency: 96.3,
    trend: 'STABLE',
  },
]

export const predictionModel = {
  model: 'Random Forest Regressor',
  dataset: 'NASA C-MAPSS / FD001',
  target: 'Remaining Useful Life',
}

export const maintenanceRecommendations = [
  'Inspect HP turbine blade tip clearance and thermal distortion.',
  'Validate compressor efficiency trend against expected operating envelope.',
  'Conduct vibration spectrum review before next long-haul duty cycle.',
  'Schedule next inspection within the 40–50 cycle service window.',
]
