// Lightweight SVG time-series chart of measured level vs. target.
// No chart library — just maps the history buffer to two polylines.
export default function LevelChart({ history, config }) {
  const W = 560
  const H = 220
  const pad = { top: 22, right: 12, bottom: 26, left: 32 }
  const innerW = W - pad.left - pad.right
  const innerH = H - pad.top - pad.bottom

  const maxY = config.maxHeight
  const tEnd = history.length ? history[history.length - 1].t : 0
  const tStart = tEnd - 30

  const x = (t) => pad.left + (innerW * (t - tStart)) / 30
  const y = (v) => pad.top + innerH * (1 - v / maxY)

  const toPath = (key) =>
    history
      .map((p, i) => `${i === 0 ? 'M' : 'L'} ${x(p.t).toFixed(1)} ${y(p[key]).toFixed(1)}`)
      .join(' ')

  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((f) => f * maxY)

  return (
    <svg className="chart-svg" viewBox={`0 0 ${W} ${H}`} width="100%">
      <defs>
        <linearGradient id="level-fade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.18" />
          <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
        </linearGradient>
        <clipPath id="plot-clip">
          <rect x={pad.left} y={pad.top - 6} width={innerW} height={innerH + 6} />
        </clipPath>
      </defs>

      {yTicks.map((v) => (
        <g key={v}>
          <line
            x1={pad.left}
            y1={y(v)}
            x2={W - pad.right}
            y2={y(v)}
            stroke="var(--grid)"
            strokeWidth="1"
          />
          <text x={pad.left - 8} y={y(v) + 3} textAnchor="end" className="chart-tick">
            {v.toFixed(1)}
          </text>
        </g>
      ))}

      {history.length > 1 && (
        <g clipPath="url(#plot-clip)">
          <path
            d={`${toPath('level')} L ${x(tEnd).toFixed(1)} ${y(0).toFixed(1)} L ${x(
              history[0].t
            ).toFixed(1)} ${y(0).toFixed(1)} Z`}
            fill="url(#level-fade)"
          />
          <path
            d={toPath('setpoint')}
            fill="none"
            stroke="var(--amber)"
            strokeWidth="1.5"
            strokeDasharray="5 4"
            strokeLinecap="round"
          />
          <path
            d={toPath('level')}
            fill="none"
            stroke="var(--accent)"
            strokeWidth="2.25"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
      )}

      <text x={W - pad.right} y={H - 6} textAnchor="end" className="chart-tick">
        tiempo (s)
      </text>

      <g className="chart-legend">
        <rect x={pad.left} y={pad.top - 20} width="14" height="2.5" rx="1.25" fill="var(--accent)" />
        <text x={pad.left + 20} y={pad.top - 15} className="chart-tick">nivel</text>
        <rect x={pad.left + 62} y={pad.top - 20} width="14" height="2.5" rx="1.25" fill="var(--amber)" />
        <text x={pad.left + 82} y={pad.top - 15} className="chart-tick">objetivo</text>
      </g>
    </svg>
  )
}
