import TankView from './components/TankView'
import ControlPanel from './components/ControlPanel'
import LevelChart from './components/LevelChart'
import Guide from './components/Guide'
import { useTankSimulation } from './simulation/useTankSimulation'
import './App.css'

function Stat({ label, value, unit, tone }) {
  return (
    <div className={`stat ${tone || ''}`}>
      <span className="stat-label">{label}</span>
      <span className="stat-value">
        {value}
        {unit && <span className="stat-unit"> {unit}</span>}
      </span>
    </div>
  )
}

export default function App() {
  const sim = useTankSimulation()
  const { state, readout, config, setpoint } = sim

  // The tank and chart read `state` (every frame); the numeric tiles read
  // `readout` (10 Hz) so the digits are legible instead of a blur.
  const error = setpoint - readout.level
  const pumpPct = Math.round(readout.pumpCommand * 100)
  const netFlow = readout.inflow - readout.outflow

  return (
    <div className="app">
      <header className="hero">
        <span
          className={`status-pill ${
            state.overflow ? 'bad' : sim.running ? 'ok' : ''
          }`}
        >
          {state.overflow ? 'Desborde' : sim.running ? 'En marcha' : 'En pausa'}
        </span>
        <h1>Controlador de Tanque de Agua</h1>
        <p className="subtitle">
          Una bomba controlada por PID contra un desagüe constante: fija un
          nivel objetivo y observa cómo el controlador lo mantiene, incluso
          frente a fugas y caídas de presión.
        </p>
      </header>

      <main className="layout">
        <div className="tank-col">
          <TankView state={state} config={config} setpoint={setpoint} />
        </div>

        <div className="center-col">
          <div className="stat-strip">
            <Stat label="Nivel" value={readout.level.toFixed(2)} unit="m" />
            <Stat label="Objetivo" value={setpoint.toFixed(2)} unit="m" tone="target" />
            <Stat
              label="Error"
              value={error.toFixed(2)}
              unit="m"
              tone={Math.abs(error) < 0.05 ? 'good' : 'warn'}
            />
            <Stat label="Bomba" value={pumpPct} unit="%" tone="pump" />
            <Stat
              label="Flujo neto"
              value={netFlow >= 0 ? `+${netFlow.toFixed(2)}` : netFlow.toFixed(2)}
              unit="m³/s"
            />
          </div>

          <div className="chart-card">
            <h2>Historial de nivel</h2>
            <LevelChart history={sim.history} config={config} />
          </div>

          <div className="flow-bars">
            <FlowBar label="Entrada (bomba)" value={readout.inflow} max={config.pumpMax} color="var(--accent)" />
            <FlowBar label="Salida (desagüe y fugas)" value={readout.outflow} max={config.pumpMax} color="var(--amber)" />
            <FlowBar label="Salud de la bomba" value={readout.pumpEfficiency} max={1} color="var(--green)" pct />
          </div>
        </div>

        <ControlPanel {...sim} />
      </main>

      <Guide />

      <footer className="app-footer">
        <span>Tanque {config.maxHeight} m de alto</span> ·{' '}
        <span>{config.area} m² de base</span> ·{' '}
        <span>bomba máx. {config.pumpMax} m³/s</span> ·{' '}
        <span>desagüe {config.baseDrain} m³/s</span>
      </footer>
    </div>
  )
}

function FlowBar({ label, value, max, color, pct }) {
  const w = Math.max(0, Math.min(1, value / max)) * 100
  return (
    <div className="flow-bar">
      <div className="flow-bar-head">
        <span>{label}</span>
        <b>{pct ? `${Math.round(value * 100)}%` : `${value.toFixed(2)} m³/s`}</b>
      </div>
      <div className="flow-track">
        <div className="flow-fill" style={{ width: `${w}%`, background: color }} />
      </div>
    </div>
  )
}
