import { anomalyEvents, componentHealth, degradationSeries, engineMeta, maintenanceRecommendations, predictionModel, telemetryMetrics } from '../data/engineData'

export const engineService = {
  getEngineMeta: () => engineMeta,
  getTelemetry: () => telemetryMetrics,
  getComponentHealth: () => componentHealth,
  getAnomalies: () => anomalyEvents,
  getDegradationSeries: () => degradationSeries,
  getPredictionModel: () => predictionModel,
  getMaintenanceRecommendations: () => maintenanceRecommendations,
}

export default engineService
