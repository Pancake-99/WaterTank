import { useEffect, useRef } from 'react'

// Animated SVG cross-section of the tank. Water level, target marker, inflow
// stream and drain outflow are all drawn to scale from the sim state.
export default function TankView({ state, config, setpoint }) {
  const W = 260
  const H = 360
  const pad = { top: 30, bottom: 40, left: 40, right: 40 }
  const innerH = H - pad.top - pad.bottom
  const innerW = W - pad.left - pad.right

  const toY = (level) => pad.top + innerH * (1 - level / config.maxHeight)

  const waterY = toY(state.level)
  const targetY = toY(setpoint)
  const fillPct = Math.round((state.level / config.maxHeight) * 100)

  // Animate the wavy top surface of the water.
  const phaseRef = useRef(0)
  const pathRef = useRef(null)
  useEffect(() => {
    let raf
    const animate = () => {
      phaseRef.current += 0.03
      const p = phaseRef.current
      const amp = 1 + state.inflow * 1
      const y = toY(state.level)
      let d = `M ${pad.left} ${y}`
      const steps = 12
      for (let i = 0; i <= steps; i++) {
        const x = pad.left + (innerW * i) / steps
        const yy = y + Math.sin(p + i * 0.9) * amp
        d += ` L ${x.toFixed(1)} ${yy.toFixed(1)}`
      }
      d += ` L ${pad.left + innerW} ${H - pad.bottom} L ${pad.left} ${
        H - pad.bottom
      } Z`
      if (pathRef.current) pathRef.current.setAttribute('d', d)
      raf = requestAnimationFrame(animate)
    }
    raf = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(raf)
  }, [state.level, state.inflow])

  const pumpOn = state.pumpCommand > 0.02
  const near = Math.abs(state.level - setpoint) < 0.05

  return (
    <svg className="tank-svg" viewBox={`0 0 ${W} ${H}`} width="100%">
      <defs>
        <linearGradient id="water" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--water-top)" />
          <stop offset="100%" stopColor="var(--water-bottom)" />
        </linearGradient>
        <linearGradient id="glass" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.22" />
          <stop offset="24%" stopColor="#ffffff" stopOpacity="0.04" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0.12" />
        </linearGradient>
        <clipPath id="tank-clip">
          <rect
            x={pad.left}
            y={pad.top}
            width={innerW}
            height={innerH}
            rx="12"
          />
        </clipPath>
      </defs>

      {/* Inflow pipe + stream */}
      <rect
        x={pad.left + innerW / 2 - 7}
        y={0}
        width="14"
        height={pad.top}
        fill="var(--pipe)"
        rx="4"
      />
      {pumpOn && (
        <rect
          className="inflow-stream"
          x={pad.left + innerW / 2 - 2.5}
          y={pad.top}
          width="5"
          height={Math.max(0, waterY - pad.top)}
          fill="var(--water-top)"
          rx="2.5"
          opacity={0.45 + state.pumpCommand * 0.5}
        />
      )}

      {/* Tank body */}
      <rect
        x={pad.left}
        y={pad.top}
        width={innerW}
        height={innerH}
        fill="var(--tank-bg)"
        rx="12"
      />

      {/* Water body (wavy path animated in effect) */}
      <g clipPath="url(#tank-clip)">
        <path ref={pathRef} fill="url(#water)" />
        <rect
          x={pad.left}
          y={pad.top}
          width={innerW}
          height={innerH}
          fill="url(#glass)"
          pointerEvents="none"
        />
      </g>

      {/* Tank wall on top of the water */}
      <rect
        x={pad.left}
        y={pad.top}
        width={innerW}
        height={innerH}
        fill="none"
        stroke="var(--tank-wall)"
        strokeWidth="1.5"
        rx="12"
      />

      {/* Target level marker */}
      <line
        x1={pad.left - 5}
        y1={targetY}
        x2={pad.left + innerW + 5}
        y2={targetY}
        stroke="var(--amber)"
        strokeWidth="1.5"
        strokeDasharray="5 4"
        strokeLinecap="round"
      />
      <text x={pad.left + innerW + 8} y={targetY + 3.5} className="tank-label" fill="var(--amber)">
        objetivo
      </text>

      {/* Drain outflow */}
      <rect
        x={pad.left + innerW / 2 - 7}
        y={H - pad.bottom}
        width="14"
        height={pad.bottom}
        fill="var(--pipe)"
        rx="4"
      />
      <rect
        x={pad.left + innerW / 2 - 2}
        y={H - pad.bottom}
        width="4"
        height={pad.bottom}
        fill="var(--water-top)"
        rx="2"
        opacity="0.75"
      />

      {/* Fill % readout */}
      <text x={W / 2} y={H - 6} textAnchor="middle" className="tank-fill">
        {fillPct}% lleno
      </text>

      {near && !state.overflow && (
        <>
          <circle cx={W / 2 - 34} cy={pad.top - 15} r="3" fill="var(--green)" />
          <text x={W / 2 - 26} y={pad.top - 11} className="tank-locked">
            en el objetivo
          </text>
        </>
      )}
      {state.overflow && (
        <text x={W / 2} y={pad.top - 11} textAnchor="middle" className="tank-overflow">
          DESBORDE
        </text>
      )}
    </svg>
  )
}
