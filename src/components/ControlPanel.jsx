function Slider({ label, value, min, max, step, onChange, unit, format }) {
  const fill = ((value - min) / (max - min)) * 100

  return (
    <label className="slider">
      <div className="slider-row">
        <span>{label}</span>
        <span className="slider-val">
          {format ? format(value) : value}
          {unit ? ` ${unit}` : ''}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        style={{ '--fill': `${fill}%` }}
        onChange={(e) => onChange(parseFloat(e.target.value))}
      />
    </label>
  )
}

export default function ControlPanel({
  config,
  setpoint,
  setSetpoint,
  gains,
  setGains,
  running,
  setRunning,
  simSpeed,
  setSimSpeed,
  reset,
  triggerLeak,
  triggerPressureDrop,
}) {
  const setGain = (key) => (v) => setGains((g) => ({ ...g, [key]: v }))

  return (
    <div className="panel">
      <section>
        <h2>Nivel deseado</h2>
        <Slider
          label="Nivel objetivo"
          value={setpoint}
          min={0}
          max={config.maxHeight}
          step={0.05}
          unit="m"
          format={(v) => v.toFixed(2)}
          onChange={setSetpoint}
        />
      </section>

      <section>
        <h2>Ganancias PID</h2>
        <p className="hint">
          Las ganancias solo actúan cuando hay error. Con el nivel ya estable no
          verás ningún cambio: mueve el nivel objetivo o lanza una perturbación
          para comparar ajustes.
        </p>
        <Slider label="Proporcional (Kp)" value={gains.kp} min={0} max={8} step={0.1}
          format={(v) => v.toFixed(1)} onChange={setGain('kp')} />
        <Slider label="Integral (Ki)" value={gains.ki} min={0} max={3} step={0.05}
          format={(v) => v.toFixed(2)} onChange={setGain('ki')} />
        <Slider label="Derivativo (Kd)" value={gains.kd} min={0} max={4} step={0.05}
          format={(v) => v.toFixed(2)} onChange={setGain('kd')} />
      </section>

      <section>
        <h2>Perturbaciones</h2>
        <p className="hint">Inyecta ruido para poner a prueba el controlador.</p>
        <div className="btn-row">
          <button className="btn btn-tinted" onClick={triggerLeak}>
            Fuga aleatoria
          </button>
          <button className="btn btn-tinted" onClick={triggerPressureDrop}>
            Caída de presión
          </button>
        </div>
      </section>

      <section>
        <h2>Simulación</h2>
        <Slider label="Velocidad" value={simSpeed} min={0.25} max={4} step={0.25}
          unit="×" format={(v) => v.toFixed(2)} onChange={setSimSpeed} />
        <div className="btn-row">
          <button className="btn btn-primary" onClick={() => setRunning((r) => !r)}>
            {running ? 'Pausar' : 'Iniciar'}
          </button>
          <button className="btn btn-ghost" onClick={reset}>
            Reiniciar
          </button>
        </div>
      </section>
    </div>
  )
}
