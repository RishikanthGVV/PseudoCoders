import { useEffect, useMemo, useRef, useState } from 'react'
import type { Group } from 'three'
import { AnimatePresence, motion } from 'framer-motion'
import { Area, AreaChart, CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Canvas, useFrame } from '@react-three/fiber'
import { ContactShadows, Html, OrbitControls } from '@react-three/drei'
import { engineService } from './services/engineService'
import type { ComponentHealth, ScreenName } from './data/engineData'
import './App.css'

type EngineMode = 'STANDARD' | 'WIREFRAME' | 'THERMAL' | 'AIRFLOW'

const screens: { id: ScreenName; label: string }[] = [
  { id: 'command', label: 'COMMAND CENTER' },
  { id: 'digitalTwin', label: 'DIGITAL TWIN' },
  { id: 'telemetry', label: 'TELEMETRY' },
  { id: 'prediction', label: 'PREDICTION' },
  { id: 'maintenance', label: 'MAINTENANCE' },
]

const statusTone = {
  NORMAL: 'good',
  WATCH: 'watch',
  CRITICAL: 'critical',
} as const

const componentLabels: Record<string, string> = {
  fan: 'FAN STAGE',
  compressor: 'COMPRESSOR',
  combustor: 'COMBUSTOR',
  'hp-turbine': 'HP TURBINE',
  'lp-turbine': 'LP TURBINE',
  exhaust: 'EXHAUST',
}

const componentSensorMap: Record<string, string> = {
  fan: 'fan-speed',
  compressor: 'pressure-ratio',
  combustor: 'core-temp',
  'hp-turbine': 'vibration',
  'lp-turbine': 'core-speed',
  exhaust: 'exhaust-temp',
}

function App() {
  const [activeScreen, setActiveScreen] = useState<ScreenName>('command')
  const [selectedComponent, setSelectedComponent] = useState('hp-turbine')
  const [selectedSensor, setSelectedSensor] = useState('vibration')
  const [engineMode, setEngineMode] = useState<EngineMode>('STANDARD')
  const [time, setTime] = useState(() => new Date())
  const selectComponent = (component: string) => {
    setSelectedComponent(component)
    setSelectedSensor(componentSensorMap[component] ?? 'vibration')
  }

  useEffect(() => {
    const timer = window.setInterval(() => setTime(new Date()), 1000)
    return () => window.clearInterval(timer)
  }, [])

  const telemetry = engineService.getTelemetry()
  const anomalies = engineService.getAnomalies()
  const maintenanceRecommendations = engineService.getMaintenanceRecommendations()
  const engine = engineService.getEngineMeta()
  const components = engineService.getComponentHealth()

  const currentComponent = useMemo(
    () => components.find((component) => component.name === selectedComponent) ?? components[0],
    [components, selectedComponent],
  )
  const selectedMetric = telemetry.find((metric) => metric.key === selectedSensor) ?? telemetry[0]
  const relatedAnomalies = anomalies.filter((event) => event.component === selectedComponent)

  const sectionLabel =
    activeScreen === 'command'
      ? 'PRIMARY SYSTEM STATUS'
      : activeScreen === 'digitalTwin'
        ? 'ENGINE DIGITAL TWIN'
        : activeScreen === 'telemetry'
          ? 'LIVE TELEMETRY WORKSTATION'
          : activeScreen === 'prediction'
            ? 'PREDICTION ANALYTICS'
            : 'MAINTENANCE PLANNING'

  return (
    <div className="app-shell">
      <HUDBackground />

      <header className="topbar">
        <div className="brand-lockup">
          <div className="status-blip" aria-hidden="true" />
          <div>
            <div className="brand-title">TURBOGUARD</div>
            <div className="brand-subtitle">AIRCRAFT ENGINE INTELLIGENCE</div>
          </div>
        </div>

        <nav className="top-nav" aria-label="Primary navigation">
          {screens.map((screen) => (
            <button
              key={screen.id}
              type="button"
              className={activeScreen === screen.id ? 'nav-button active' : 'nav-button'}
              onClick={() => setActiveScreen(screen.id)}
            >
              {screen.label}
            </button>
          ))}
        </nav>

        <div className="system-metrics">
          <div className="system-item">
            <span className="tiny-label">CONNECTION</span>
            <span className="system-status on">ONLINE</span>
          </div>
          <div className="system-item">
            <span className="tiny-label">MODEL</span>
            <span className="system-status on">ACTIVE</span>
          </div>
          <div className="system-item">
            <span className="tiny-label">AIRCRAFT</span>
            <span className="system-status neutral">{engine.aircraftId}</span>
          </div>
          <div className="system-item">
            <span className="tiny-label">ENGINE</span>
            <span className="system-status neutral">{engine.engineId}</span>
          </div>
          <div className="system-item time-item">
            <span className="tiny-label">SYSTEM TIME</span>
            <span className="system-status neutral">{time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
          </div>
        </div>
      </header>

      <main className="workspace-shell">
        <div className="section-header-row">
          <div className="tiny-label uppercase">{sectionLabel}</div>
          <div className="tiny-label uppercase">SYS / {engine.aircraftId} / {engine.engineId}</div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeScreen}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.28, ease: 'easeOut' }}
            className="screen-panels"
          >
            {activeScreen === 'command' && (
              <>
                <div className="command-layout">
                  <div className="engine-column">
                    <EngineCard selectedComponent={selectedComponent} setSelectedComponent={selectComponent} />
                  </div>

                  <div className="instrument-column">
                    <RULGauge />
                    <TelemetryList metrics={telemetry} />
                  </div>
                </div>

                <div className="lower-grid">
                  <div className="panel panel-graph">
                    <PanelHeader title="DEGRADATION ANALYTICS" tag="PREDICTION / TRACK" />
                    <DegradationChart />
                  </div>

                  <div className="panel panel-anomaly">
                    <PanelHeader title="ANOMALY MONITOR" tag="STREAM ACTIVE" />
                    <AnomalyStream events={anomalies} />
                  </div>

                  <div className="panel panel-forecast">
                    <PanelHeader title="MAINTENANCE FORECAST" tag="SERVICE WINDOW" />
                    <MaintenanceForecast />
                  </div>
                </div>
              </>
            )}

            {activeScreen === 'digitalTwin' && (
              <div className="digital-twin-screen">
                <div className="panel twin-panel">
                  <div className="twin-toolbar">
                    <div className="mode-pills">
                      {(['STANDARD', 'WIREFRAME', 'THERMAL', 'AIRFLOW'] as EngineMode[]).map((mode) => (
                        <button
                          key={mode}
                          type="button"
                          className={engineMode === mode ? 'mode-pill active' : 'mode-pill'}
                          onClick={() => setEngineMode(mode)}
                        >
                          {mode}
                        </button>
                      ))}
                    </div>
                    <div className="toolbar-actions">
                      <button type="button" className="ghost-button">RESET VIEW</button>
                      <button type="button" className="ghost-button">ROTATE</button>
                      <button type="button" className="ghost-button">ZOOM</button>
                    </div>
                  </div>
                  <div className="digital-twin-canvas">
                    <Canvas camera={{ position: [0, 0.8, 9.7], fov: 35 }}>
                      <color attach="background" args={['#070707']} />
                      <ambientLight intensity={0.8} />
                      <directionalLight position={[3, 3, 3]} intensity={1.5} color="#9fe8ff" />
                      <pointLight position={[-2, -1, 4]} intensity={1} color="#d8a45c" />
                      <EngineAssembly
                        selectedComponent={selectedComponent}
                        setSelectedComponent={selectComponent}
                        mode={engineMode}
                      />
                      <ContactShadows position={[0, -2.8, 0]} opacity={0.45} scale={12} blur={2.4} far={7} />
                      <OrbitControls enablePan={false} enableDamping minDistance={6} maxDistance={16} />
                    </Canvas>
                  </div>
                </div>

                <div className="inspection-panel">
                  <PanelHeader title="COMPONENT INSPECTION" tag={componentLabels[currentComponent.name] ?? 'COMPONENT'} />
                  <div className="inspection-grid">
                    {components.map((component) => (
                      <button
                        key={component.name}
                        type="button"
                        className={selectedComponent === component.name ? 'component-select active' : 'component-select'}
                        onClick={() => selectComponent(component.name)}
                      >
                        {component.label}
                      </button>
                    ))}
                  </div>

                  <div className="inspection-card">
                    <div className="inspection-row"><span>COMPONENT</span><strong>{currentComponent.label}</strong></div>
                    <div className="inspection-row"><span>HEALTH</span><strong>{currentComponent.health}%</strong></div>
                    <div className="inspection-row"><span>TEMPERATURE</span><strong>{currentComponent.temperature} K</strong></div>
                    <div className="inspection-row"><span>PRESSURE</span><strong>{currentComponent.pressure} bar</strong></div>
                    <div className="inspection-row"><span>EFFICIENCY</span><strong>{currentComponent.efficiency}%</strong></div>
                    <div className="inspection-row"><span>TREND</span><strong>{currentComponent.trend}</strong></div>
                  </div>

                  <div className="inspection-evidence">
                    <div className="tiny-label">AVAILABLE EVIDENCE</div>
                    {relatedAnomalies.length > 0 ? relatedAnomalies.map((event) => (
                      <div key={`${event.time}-${event.sensor}`} className="evidence-line">
                        <span className={`status-led ${event.level === 'normal' ? 'good' : event.level === 'watch' ? 'watch' : 'critical'}`} />
                        <span>{event.sensor} / {event.message}</span>
                      </div>
                    )) : <div className="evidence-line">NO LINKED EVENTS IN DEMO STREAM</div>}
                  </div>

                  <div className="mini-chart-wrap">
                    <TrendMiniChart component={currentComponent} />
                  </div>
                </div>
              </div>
            )}

            {activeScreen === 'telemetry' && (
              <div className="telemetry-screen">
                <div className="panel telemetry-matrix-panel">
                  <PanelHeader title="SENSOR MATRIX" tag="08 / 08 ONLINE" />
                  <div className="sensor-grid">
                    {telemetry.map((metric) => (
                      <button
                        key={metric.key}
                        type="button"
                        className={selectedSensor === metric.key ? 'sensor-card active' : 'sensor-card'}
                        onClick={() => setSelectedSensor(metric.key)}
                      >
                        <div className="sensor-header">
                          <span>{metric.name}</span>
                          <span className={`badge ${statusTone[metric.status]}`}>{metric.status}</span>
                        </div>
                        <div className="sensor-value">{metric.current.toLocaleString()} {metric.unit}</div>
                        <div className="tiny-negative">{metric.delta > 0 ? '+' : ''}{metric.delta}%</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="panel chart-panel">
                  <div className="chart-controls">
                    {['1H', '6H', '12H', '24H', '50 CYCLES', '100 CYCLES'].map((control) => (
                      <button key={control} type="button" className="time-button">
                        {control}
                      </button>
                    ))}
                  </div>
                  <TelemetryChart metric={selectedMetric} component={currentComponent} />
                </div>
              </div>
            )}

            {activeScreen === 'prediction' && (
              <div className="prediction-screen">
                <div className="prediction-stats">
                  <StatTile label="REMAINING USEFUL LIFE" value={`${engine.rul}`} suffix="CYCLES" />
                  <StatTile label="CURRENT CYCLE" value={`${engine.currentCycle}`} suffix="CYCLE" />
                  <StatTile label="ENGINE HEALTH" value={`${engine.health}`} suffix="%" />
                </div>

                <div className="panel prediction-panel">
                  <PanelHeader title="PREDICTED DEGRADATION" tag="MODEL INFERENCE" />
                  <div className="analysis-target">INVESTIGATION TARGET <strong>{currentComponent.label}</strong> <span>ENGINE-LEVEL MODEL OUTPUT</span></div>
                  <PredictionChart />
                </div>

                <div className="panel trace-panel">
                  <PanelHeader title="DATA TO DECISION" tag="TRACEABLE INFERENCE" />
                  <div className="model-trace">
                    <span>C-MAPSS SENSOR DATA</span><b>→</b><span>FEATURES</span><b>→</b><span>{engine.model}</span><b>→</b><span>RUL / HEALTH</span><b>→</b><span>MAINTENANCE INSIGHT</span>
                  </div>
                </div>

                <div className="model-grid">
                  <div className="panel model-panel">
                    <div className="tiny-label">MODEL</div>
                    <div className="panel-value">{engine.model}</div>
                    <div className="tiny-label">DATASET</div>
                    <div className="panel-value">{engine.dataset}</div>
                  </div>
                  <div className="panel model-panel">
                    <div className="tiny-label">TARGET</div>
                    <div className="panel-value">{engine.target}</div>
                    <div className="tiny-label">FAILURE WINDOW</div>
                    <div className="panel-value">305 CYCLES</div>
                  </div>
                  <div className="panel model-panel">
                    <div className="tiny-label">INFERENCE STATUS</div>
                    <div className="panel-value">DEMO OUTPUT</div>
                    <div className="tiny-label">COMPONENT MODEL</div>
                    <div className="panel-value">NOT AVAILABLE</div>
                  </div>
                </div>
              </div>
            )}

            {activeScreen === 'maintenance' && (
              <div className="maintenance-screen">
                <div className="prediction-stats">
                  <StatTile label="ENGINE CONDITION" value="NOMINAL" suffix="STATUS" />
                  <StatTile label="SERVICE WINDOW" value="40-50" suffix="CYCLES" />
                  <StatTile label="RISK LEVEL" value="LOW" suffix="RISK" />
                  <StatTile label="NEXT INSPECTION" value={`${engine.nextInspection}`} suffix="CYCLES" />
                </div>

                <div className="panel maintenance-panel">
                  <PanelHeader title="SERVICE TIMELINE" tag="PREDICTIVE PLAN" />
                  <div className="analysis-target maintenance-target">SELECTED COMPONENT <strong>{currentComponent.label}</strong><span>{relatedAnomalies.length ? `${relatedAnomalies.length} RELATED EVENTS` : 'NO RELATED EVENTS'}</span></div>
                  <div className="timeline">
                    <div className="timeline-node">
                      <span className="timeline-label">CURRENT CYCLE</span>
                      <strong>{engine.currentCycle}</strong>
                    </div>
                    <div className="timeline-arrow">↓</div>
                    <div className="timeline-node">
                      <span className="timeline-label">INSPECTION</span>
                      <strong>{engine.currentCycle + engine.nextInspection}</strong>
                    </div>
                    <div className="timeline-arrow">↓</div>
                    <div className="timeline-node">
                      <span className="timeline-label">RECOMMENDED SERVICE</span>
                      <strong>{engine.currentCycle + 48}</strong>
                    </div>
                    <div className="timeline-arrow">↓</div>
                    <div className="timeline-node critical">
                      <span className="timeline-label">CRITICAL THRESHOLD</span>
                      <strong>{engine.projectedCriticalThreshold}</strong>
                    </div>
                  </div>
                </div>

                <div className="panel recommendation-panel">
                  <PanelHeader title="MAINTENANCE RECOMMENDATIONS" tag="DIAGNOSTIC SUMMARY" />
                  <ul className="recommendation-list">
                    {maintenanceRecommendations.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  )
}

function HUDBackground() {
  return (
    <div className="hud-bg" aria-hidden="true">
      <div className="scanline" />
      <div className="radar-ring ring-one" />
      <div className="radar-ring ring-two" />
      <div className="corner-bracket top-left" />
      <div className="corner-bracket top-right" />
      <div className="corner-bracket bottom-left" />
      <div className="corner-bracket bottom-right" />
    </div>
  )
}

function EngineCard({ selectedComponent, setSelectedComponent }: { selectedComponent: string; setSelectedComponent: (value: string) => void }) {
  return (
    <div className="panel engine-panel">
      <PanelHeader title="ENGINE DIGITAL TWIN" tag="DATA LINK STABLE" />
      <div className="engine-stage">
        <Canvas camera={{ position: [0, 0.3, 9], fov: 34 }}>
          <color attach="background" args={['#030d17']} />
          <ambientLight intensity={0.8} />
          <directionalLight position={[2.5, 2, 3]} intensity={1.6} color="#f0f0eb" />
          <pointLight position={[0, 0.2, 2]} intensity={0.7} color="#d8a45c" />
          <EngineAssembly selectedComponent={selectedComponent} setSelectedComponent={setSelectedComponent} mode="STANDARD" />
          <ContactShadows position={[0, -3.4, 0]} opacity={0.45} scale={12} blur={2.6} far={8} />
          <OrbitControls enablePan={false} enableDamping minDistance={6} maxDistance={14} maxPolarAngle={Math.PI * 0.8} />
        </Canvas>
      </div>

      <div className="engine-readouts">
        <div className="tiny-readout">
          <span className="tiny-label">CYCLE</span>
          <strong>218</strong>
        </div>
        <div className="tiny-readout">
          <span className="tiny-label">STATUS</span>
          <strong>NOMINAL</strong>
        </div>
        <div className="tiny-readout">
          <span className="tiny-label">SCAN</span>
          <strong>ACTIVE</strong>
        </div>
      </div>
    </div>
  )
}

function EngineAssembly({
  selectedComponent,
  setSelectedComponent,
  mode = 'STANDARD',
}: {
  selectedComponent: string
  setSelectedComponent?: (value: string) => void
  mode?: EngineMode
}) {
  const groupRef = useRef<Group>(null)

  useFrame((state) => {
    if (!groupRef.current) return
    const t = state.clock.getElapsedTime()
    groupRef.current.rotation.y = state.pointer.x * 0.6 + t * 0.08
    groupRef.current.rotation.x = -state.pointer.y * 0.36
  })

  const getMaterial = (name: string, baseColor: string) => {
    const thermal = mode === 'THERMAL'
    const airflow = mode === 'AIRFLOW'

    return {
      color:
        selectedComponent === name
          ? thermal
            ? '#ff8d5c'
            : airflow
              ? '#8ef0d8'
              : '#ffffff'
          : thermal
            ? name === 'combustor' || name === 'hp-turbine'
              ? '#ff8d5c'
              : name === 'fan'
                ? '#b5c5d6'
                : '#6a7887'
            : airflow
              ? '#b8b8b0'
              : baseColor,
      emissive:
        selectedComponent === name
          ? thermal
            ? '#d15b2d'
            : '#ffffff'
          : thermal
            ? name === 'combustor' || name === 'hp-turbine'
              ? '#7f2f16'
              : '#0f2332'
            : airflow
              ? '#3a3a36'
              : '#20211f',
      emissiveIntensity: selectedComponent === name ? (thermal ? 1.8 : 1.2) : thermal ? 0.9 : 0.18,
      metalness: mode === 'STANDARD' ? 0.78 : mode === 'WIREFRAME' ? 0.28 : 0.6,
      roughness: mode === 'STANDARD' ? 0.28 : mode === 'WIREFRAME' ? 0.85 : 0.45,
      wireframe: mode === 'WIREFRAME',
    }
  }

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      <mesh position={[0, 0, -5.4]}>
        <cylinderGeometry args={[1.4, 1.6, 1.3, 48]} />
        <meshStandardMaterial color="#4c4e4b" metalness={0.82} roughness={0.24} emissive="#1a1b19" emissiveIntensity={0.4} />
      </mesh>

      <mesh position={[0, 0, -4.1]}>
        <cylinderGeometry args={[1.75, 1.95, 1.1, 48]} />
        <meshStandardMaterial {...getMaterial('fan', '#8d918e')} />
        <mesh onClick={() => setSelectedComponent?.('fan')}>
          <cylinderGeometry args={[1.98, 2.08, 1.18, 48]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>
      </mesh>

      {Array.from({ length: 8 }).map((_, index) => (
        <mesh key={`fan-blade-${index}`} position={[0, 0, -3.8]} rotation={[0, (Math.PI / 4) * index, Math.PI / 2]}>
          <boxGeometry args={[0.2, 0.76, 1.8]} />
          <meshStandardMaterial color={selectedComponent === 'fan' ? '#ffffff' : '#a7aaa5'} emissive={selectedComponent === 'fan' ? '#777873' : '#242522'} emissiveIntensity={selectedComponent === 'fan' ? 0.8 : 0.15} metalness={0.9} roughness={0.2} />
        </mesh>
      ))}

      <mesh position={[0, 0, -2.2]}> 
        <cylinderGeometry args={[1.95, 2.1, 1.1, 48]} />
        <meshStandardMaterial {...getMaterial('compressor', '#777b78')} />
        <mesh onClick={() => setSelectedComponent?.('compressor')}>
          <cylinderGeometry args={[2.12, 2.2, 1.18, 48]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>
      </mesh>

      {Array.from({ length: 7 }).map((_, index) => (
        <mesh key={`disc-${index}`} position={[0, 0, -1.2 + index * 0.75]}>
          <cylinderGeometry args={[1.05 + index * 0.12, 1.15 + index * 0.12, 0.22, 32]} />
          <meshStandardMaterial color="#afbad0" metalness={0.8} roughness={0.3} emissive="#0d1d2c" emissiveIntensity={0.22} />
        </mesh>
      ))}

      <mesh position={[0, 0, 0.6]}>
        <cylinderGeometry args={[2.1, 2.3, 1.7, 48]} />
        <meshStandardMaterial {...getMaterial('combustor', '#8c6b4c')} />
        <mesh onClick={() => setSelectedComponent?.('combustor')}>
          <cylinderGeometry args={[2.32, 2.42, 1.78, 48]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>
      </mesh>

      <mesh position={[0, 0, 2.2]}>
        <cylinderGeometry args={[1.75, 1.9, 1.5, 48]} />
        <meshStandardMaterial {...getMaterial('hp-turbine', '#8c765f')} />
        <mesh onClick={() => setSelectedComponent?.('hp-turbine')}>
          <cylinderGeometry args={[1.92, 2.02, 1.58, 48]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>
      </mesh>

      {Array.from({ length: 8 }).map((_, index) => (
        <mesh key={`turbine-${index}`} position={[0, 0, 3.1 + index * 0.55]} rotation={[0, (Math.PI / 4) * index, 0]}>
          <boxGeometry args={[0.16, 1.32, 0.92]} />
          <meshStandardMaterial color={selectedComponent === 'hp-turbine' ? '#ffffff' : '#b0aaa0'} emissive={selectedComponent === 'hp-turbine' ? '#777873' : '#242522'} emissiveIntensity={selectedComponent === 'hp-turbine' ? 0.8 : 0.12} metalness={0.9} roughness={0.22} />
        </mesh>
      ))}

      <mesh position={[0, 0, 4.8]}>
        <cylinderGeometry args={[1.5, 1.65, 1.2, 48]} />
        <meshStandardMaterial {...getMaterial('lp-turbine', '#8b8c87')} />
        <mesh onClick={() => setSelectedComponent?.('lp-turbine')}>
          <cylinderGeometry args={[1.67, 1.76, 1.28, 48]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>
      </mesh>

      <mesh position={[0, 0, 6.3]}>
        <cylinderGeometry args={[1.35, 1.4, 1.5, 48]} />
        <meshStandardMaterial {...getMaterial('exhaust', '#777975')} />
        <mesh onClick={() => setSelectedComponent?.('exhaust')}>
          <cylinderGeometry args={[1.42, 1.48, 1.58, 48]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>
      </mesh>

      <mesh position={[0, 0, 7.6]}>
        <coneGeometry args={[1.2, 1.4, 48]} />
        <meshStandardMaterial color="#8b8d88" metalness={0.8} roughness={0.25} emissive="#242522" emissiveIntensity={0.2} />
      </mesh>

      <mesh position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[2.45, 0.06, 16, 96]} />
        <meshStandardMaterial color="#d8a45c" emissive="#8d5e27" emissiveIntensity={0.35} />
      </mesh>

      <mesh position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.8, 0.04, 16, 64]} />
        <meshStandardMaterial color="#bfc0ba" emissive="#4c4d49" emissiveIntensity={0.15} />
      </mesh>

      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[0.26, 0.26, 13.6, 32]} />
        <meshStandardMaterial color="#d7d8d2" emissive="#5b5c57" emissiveIntensity={0.2} metalness={0.9} roughness={0.12} />
      </mesh>

      <Html position={[-3.3, 1.8, -4.2]} center>
        <div className={selectedComponent === 'fan' ? 'annotation active' : 'annotation'}>FAN STAGE</div>
      </Html>
      <Html position={[-3.2, -0.2, 0.8]} center>
        <div className={selectedComponent === 'combustor' ? 'annotation active' : 'annotation'}>COMBUSTOR</div>
      </Html>
      <Html position={[3.2, 1.3, 2.2]} center>
        <div className={selectedComponent === 'hp-turbine' ? 'annotation active' : 'annotation'}>HP TURBINE</div>
      </Html>
      <Html position={[3.2, -0.8, 6.2]} center>
        <div className={selectedComponent === 'exhaust' ? 'annotation active' : 'annotation'}>EXHAUST</div>
      </Html>

      {['fan', 'compressor', 'combustor', 'hp-turbine', 'lp-turbine', 'exhaust'].map((part) => (
        <mesh
          key={part}
          position={part === 'fan' ? [0, 0, -3.8] : part === 'compressor' ? [0, 0, -1.8] : part === 'combustor' ? [0, 0, 0.6] : part === 'hp-turbine' ? [0, 0, 2.9] : part === 'lp-turbine' ? [0, 0, 5.1] : [0, 0, 6.8]}
          onClick={() => setSelectedComponent?.(part)}
          onPointerOver={(event) => {
            event.stopPropagation()
            if (setSelectedComponent) setSelectedComponent(part)
          }}
          onPointerOut={(event) => {
            event.stopPropagation()
          }}
        >
          <sphereGeometry args={[0.2, 18, 18]} />
          <meshStandardMaterial
            color={selectedComponent === part ? (mode === 'THERMAL' ? '#ff6a3d' : '#ffffff') : mode === 'AIRFLOW' ? '#8e918b' : '#555854'}
            emissive={selectedComponent === part ? (mode === 'THERMAL' ? '#a83e22' : '#6e706a') : '#20211f'}
            emissiveIntensity={selectedComponent === part ? 1.3 : 0.35}
          />
        </mesh>
      ))}
    </group>
  )
}

function PanelHeader({ title, tag }: { title: string; tag: string }) {
  return (
    <div className="panel-header">
      <span className="tiny-label">{tag}</span>
      <h3>{title}</h3>
    </div>
  )
}

function RULGauge() {
  const engine = engineService.getEngineMeta()
  const gaugeProgress = 220
  return (
    <div className="panel gauge-panel">
      <div className="gauge-wrap">
        <div className="gauge-arc" style={{ ['--progress' as string]: `${gaugeProgress}deg` }}>
          <div className="gauge-core">
            <div className="gauge-label">RUL</div>
            <div className="gauge-value">{engine.rul}</div>
            <div className="gauge-unit">CYCLES</div>
          </div>
        </div>
      </div>

      <div className="gauge-meta">
        <div className="meta-block">
          <span className="tiny-label">ENGINE HEALTH</span>
          <strong>{engine.health}%</strong>
        </div>
        <div className="meta-block">
          <span className="tiny-label">STATUS</span>
          <strong>{engine.status}</strong>
        </div>
        <div className="meta-block">
          <span className="tiny-label">CURRENT FLIGHT CYCLE</span>
          <strong>{engine.currentCycle}</strong>
        </div>
      </div>
    </div>
  )
}

function TelemetryList({ metrics }: { metrics: ReturnType<typeof engineService.getTelemetry> }) {
  return (
    <div className="panel telemetry-panel">
      <PanelHeader title="LIVE TELEMETRY" tag="STREAM ACTIVE" />
      <div className="telemetry-list">
        {metrics.map((metric) => (
          <div key={metric.key} className="telemetry-row">
            <div className="telemetry-name-group">
              <span className={`status-led ${statusTone[metric.status]}`} />
              <span>{metric.name}</span>
            </div>
            <div className="telemetry-metric">
              <strong>{metric.current.toLocaleString()} {metric.unit}</strong>
              <span className="delta">{metric.delta > 0 ? '+' : ''}{metric.delta}%</span>
            </div>
            <div className="sparkline-wrap">
              <Sparkline values={metric.trend} tone={statusTone[metric.status]} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function Sparkline({ values, tone }: { values: number[]; tone: 'good' | 'watch' | 'critical' }) {
  const max = Math.max(...values)
  const min = Math.min(...values)
  const path = values
    .map((value, index) => {
      const x = (index / (values.length - 1)) * 100
      const y = 100 - ((value - min) / Math.max(max - min, 1)) * 100
      return `${index === 0 ? 'M' : 'L'} ${x} ${y}`
    })
    .join(' ')

  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className={`sparkline ${tone}`}>
      <path d={path} />
    </svg>
  )
}

function AnomalyStream({ events }: { events: Array<{ time: string; cycle: number; sensor: string; component: string; message: string; level: 'normal' | 'watch' | 'critical' }> }) {
  return (
    <div className="anomaly-list">
      {events.map((event, index) => (
        <motion.div
          key={`${event.time}-${index}`}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.06 }}
          className="anomaly-item"
        >
          <div className="anomaly-time">{event.time}</div>
          <div className="anomaly-message-row">
            <span className={`status-led ${event.level === 'normal' ? 'good' : event.level === 'watch' ? 'watch' : 'critical'}`} />
            <span>{event.message}</span>
          </div>
          <div className="anomaly-context">CYCLE {event.cycle} / {event.sensor} / {componentLabels[event.component] ?? event.component}</div>
        </motion.div>
      ))}
    </div>
  )
}

function MaintenanceForecast() {
  const engine = engineService.getEngineMeta()
  return (
    <div className="maintenance-summary">
      <div className="maintenance-stat-row">
        <span className="tiny-label">NEXT INSPECTION</span>
        <strong>{engine.nextInspection} CYCLES</strong>
      </div>
      <div className="maintenance-stat-row">
        <span className="tiny-label">SERVICE WINDOW</span>
        <strong>{engine.serviceWindow}</strong>
      </div>
      <div className="maintenance-stat-row">
        <span className="tiny-label">RISK</span>
        <strong className="risk-badge low">{engine.risk}</strong>
      </div>
      <div className="maintenance-stat-row">
        <span className="tiny-label">PROJECTED CRITICAL THRESHOLD</span>
        <strong>{engine.projectedCriticalThreshold} CYCLES</strong>
      </div>
    </div>
  )
}

function DegradationChart() {
  return (
    <div className="chart-box">
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={engineService.getDegradationSeries()}>
          <defs>
            <linearGradient id="observedGlow" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#aeb1ab" stopOpacity={0.55} />
              <stop offset="100%" stopColor="#aeb1ab" stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="rgba(183, 190, 194, 0.16)" strokeDasharray="3 6" />
          <XAxis dataKey="cycle" tick={{ fill: '#9ab3c8', fontSize: 11 }} tickLine={false} axisLine={false} />
          <YAxis domain={[70, 100]} tick={{ fill: '#9ab3c8', fontSize: 11 }} tickLine={false} axisLine={false} />
          <Tooltip
            contentStyle={{
              background: '#081924',
              border: '1px solid rgba(183,190,194,0.3)',
              borderRadius: '8px',
              color: '#eef0ed',
            }}
          />
          <ReferenceLine y={70} stroke="#ff6d77" strokeDasharray="5 5" label={{ value: 'THRESHOLD', position: 'insideTopRight', fill: '#ff9ca8' }} />
          <Area type="monotone" dataKey="observed" stroke="#d8d9d2" fill="url(#observedGlow)" strokeWidth={2.4} />
          <Line type="monotone" dataKey="predicted" stroke="#7ef5c0" strokeWidth={2} dot={false} strokeDasharray="6 6" />
          <Line type="monotone" dataKey="threshold" stroke="#ff5c78" strokeWidth={1.6} dot={false} hide />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

function TelemetryChart({ metric, component }: { metric: ReturnType<typeof engineService.getTelemetry>[number]; component: ComponentHealth }) {
  return (
    <div className="telemetry-chart-box">
      <div className="chart-header-inline">
        <div>
          <div className="tiny-label">PRIMARY SENSOR</div>
          <strong>{metric.name}</strong>
            <div className="chart-context">TARGET / {component.label}</div>
        </div>
        <div className="chart-value">
          <span>{metric.current.toLocaleString()} {metric.unit}</span>
          <span className="delta">{metric.delta > 0 ? '+' : ''}{metric.delta}%</span>
        </div>
      </div>
      <div className="signal-stats">
        <span>MIN <strong>{metric.min.toLocaleString()}</strong></span>
        <span>AVG <strong>{metric.avg.toLocaleString()}</strong></span>
        <span>MAX <strong>{metric.max.toLocaleString()}</strong></span>
        <span>TREND <strong>{metric.delta > 0 ? 'RISING' : 'FALLING'}</strong></span>
      </div>

      <ResponsiveContainer width="100%" height={270}>
        <LineChart data={metric.history}>
          <CartesianGrid stroke="rgba(183, 190, 194, 0.16)" strokeDasharray="3 6" />
          <XAxis dataKey="cycle" tick={{ fill: '#9ab3c8', fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: '#9ab3c8', fontSize: 11 }} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={{
              background: '#081924',
              border: '1px solid rgba(183,190,194,0.3)',
              borderRadius: '8px',
              color: '#eef0ed',
            }}
          />
          <Line type="monotone" dataKey="value" stroke="#d8d9d2" strokeWidth={2.2} dot={{ fill: '#d8d9d2', r: 2 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

function PredictionChart() {
  const predictionData = [
    { cycle: 120, observed: 96.4, predicted: 96.8 },
    { cycle: 150, observed: 95.2, predicted: 95.3 },
    { cycle: 180, observed: 94.6, predicted: 94.1 },
    { cycle: 200, observed: 94.1, predicted: 93.4 },
    { cycle: 218, observed: 94, predicted: 92.8 },
    { cycle: 240, observed: 92.9, predicted: 91.2 },
    { cycle: 270, observed: 91.8, predicted: 88.7 },
    { cycle: 300, observed: 90.5, predicted: 83.6 },
    { cycle: 320, observed: 88.4, predicted: 78.2 },
  ]

  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={predictionData}>
        <CartesianGrid stroke="rgba(183, 190, 194, 0.16)" strokeDasharray="3 6" />
        <XAxis dataKey="cycle" tick={{ fill: '#9ab3c8', fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis domain={[70, 100]} tick={{ fill: '#9ab3c8', fontSize: 11 }} axisLine={false} tickLine={false} />
        <Tooltip contentStyle={{ background: '#121313', border: '1px solid rgba(183,190,194,0.3)', borderRadius: '3px', color: '#eef0ed' }} />
        <ReferenceLine x={218} stroke="#ffbe52" strokeDasharray="4 4" label={{ value: 'CURRENT', position: 'insideTopRight', fill: '#ffbe52' }} />
        <Line type="monotone" dataKey="observed" stroke="#d8d9d2" strokeWidth={2.2} dot={false} />
        <Line type="monotone" dataKey="predicted" stroke="#7ef5c0" strokeWidth={2.2} dot={false} strokeDasharray="8 4" />
      </LineChart>
    </ResponsiveContainer>
  )
}

function StatTile({ label, value, suffix }: { label: string; value: string; suffix: string }) {
  return (
    <div className="stat-tile panel">
      <div className="tiny-label">{label}</div>
      <div className="stat-main">
        <span>{value}</span>
        <small>{suffix}</small>
      </div>
    </div>
  )
}

function TrendMiniChart({ component }: { component: ComponentHealth }) {
  const data = [
    { value: component.health - 5 },
    { value: component.health - 3 },
    { value: component.health - 2 },
    { value: component.health },
    { value: component.health - 1.6 },
    { value: component.health - 3.2 },
  ]

  return (
    <ResponsiveContainer width="100%" height={90}>
      <LineChart data={data}>
        <Line type="monotone" dataKey="value" stroke="#d8d9d2" strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  )
}

export default App
