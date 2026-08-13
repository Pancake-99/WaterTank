// Physical model of the water tank.
//
// The tank is a vertical cylinder with a constant cross-sectional area. The pump
// adds water at the top; a constant drain removes water at the bottom.
// Disturbances add a transient extra leak or temporarily weaken the pump.
//
// All quantities are SI: metres, seconds, cubic-metres-per-second.

export const DEFAULT_CONFIG = {
  area: 1.5, // m^2 — tank cross-section
  maxHeight: 5, // m — tank height (overflow threshold)
  pumpMax: 0.9, // m^3/s — flow at 100% pump command
  baseDrain: 0.35, // m^3/s — constant outflow at the drain
}

export function createInitialState(config = DEFAULT_CONFIG, level = 1.0) {
  return {
    time: 0,
    level, // m
    pumpCommand: 0, // 0..1
    inflow: 0, // m^3/s (actual, after efficiency loss)
    outflow: config.baseDrain, // m^3/s (drain + active leaks)
    leakRate: 0, // m^3/s extra outflow from a leak disturbance
    pumpEfficiency: 1, // 0..1 multiplier on pump output (pressure drop)
    overflow: false,
  }
}

// Advance the physics by dt seconds given a pump command in [0, 1].
// Returns a new state object (does not mutate the input).
export function stepTank(state, config, pumpCommand, dt) {
  // Disturbances relax back to nominal over time.
  const LEAK_DECAY = 0.25 // per second — how fast a leak seals itself
  const PUMP_RECOVERY = 0.4 // per second — how fast pressure recovers

  const leakRate = Math.max(0, state.leakRate * (1 - LEAK_DECAY * dt))
  const pumpEfficiency = Math.min(
    1,
    state.pumpEfficiency + PUMP_RECOVERY * dt * (1 - state.pumpEfficiency),
  )

  const cmd = Math.max(0, Math.min(1, pumpCommand))
  const inflow = cmd * config.pumpMax * pumpEfficiency
  const outflow = config.baseDrain + leakRate

  // Integrate the level: dV = (Qin - Qout) dt, dLevel = dV / area.
  let level = state.level + ((inflow - outflow) * dt) / config.area

  let overflow = false
  if (level >= config.maxHeight) {
    level = config.maxHeight
    overflow = true
  }
  if (level < 0) level = 0

  return {
    time: state.time + dt,
    level,
    pumpCommand: cmd,
    inflow,
    outflow,
    leakRate,
    pumpEfficiency,
    overflow,
  }
}

// Disturbance helpers — return a partial state patch to merge in.
export function applyLeak(state, config) {
  // A sudden leak roughly the size of the base drain, with some randomness.
  const extra = config.baseDrain * (0.6 + Math.random() * 0.8)
  return { leakRate: state.leakRate + extra }
}

export function applyPressureDrop() {
  // Pump loses 40–75% of its effectiveness momentarily.
  const drop = 0.4 + Math.random() * 0.35
  return { pumpEfficiency: Math.max(0.15, 1 - drop) }
}
