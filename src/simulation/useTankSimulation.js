import { useCallback, useEffect, useRef, useState } from 'react'
import { PIDController } from './pid'
import {
  DEFAULT_CONFIG,
  createInitialState,
  stepTank,
  applyLeak,
  applyPressureDrop,
} from './tankModel'

const FIXED_DT = 0.02 // s — physics substep
const MAX_FRAME = 0.1 // s — clamp huge gaps (tab was backgrounded)
const HISTORY_SECONDS = 30
const HISTORY_SAMPLE = 0.1 // s between chart samples
const READOUT_INTERVAL = 0.1 // s of REAL time between numeric readout updates

// simSpeed scales how much simulated time elapses per real second.
export function useTankSimulation() {
  const [config] = useState(DEFAULT_CONFIG)
  const [state, setState] = useState(() => createInitialState(config))
  // Same data as `state`, but refreshed on a slow cadence. The tank and chart
  // want every frame; the numeric tiles are unreadable at 60 Hz.
  const [readout, setReadout] = useState(state)
  const [setpoint, setSetpoint] = useState(3.0)
  const [gains, setGains] = useState({ kp: 2.5, ki: 0.6, kd: 0.8 })
  const [running, setRunning] = useState(true)
  const [simSpeed, setSimSpeed] = useState(1)
  const [history, setHistory] = useState([])

  // Mutable refs for the loop so it always reads fresh values without
  // re-subscribing the animation frame.
  const pidRef = useRef(new PIDController({ ...gains }))
  const stateRef = useRef(state)
  const setpointRef = useRef(setpoint)
  const runningRef = useRef(running)
  const speedRef = useRef(simSpeed)
  const accRef = useRef(0)
  const sampleAccRef = useRef(0)
  const readoutAccRef = useRef(0)
  const rafRef = useRef(0)
  const lastTsRef = useRef(0)

  useEffect(() => {
    pidRef.current.setGains(gains)
  }, [gains])
  useEffect(() => {
    setpointRef.current = setpoint
  }, [setpoint])
  useEffect(() => {
    runningRef.current = running
  }, [running])
  useEffect(() => {
    speedRef.current = simSpeed
  }, [simSpeed])

  useEffect(() => {
    const loop = (ts) => {
      rafRef.current = requestAnimationFrame(loop)
      if (!lastTsRef.current) lastTsRef.current = ts
      const realFrame = (ts - lastTsRef.current) / 1000
      lastTsRef.current = ts
      if (!runningRef.current) return

      accRef.current += Math.min(realFrame, MAX_FRAME) * speedRef.current

      let next = stateRef.current
      while (accRef.current >= FIXED_DT) {
        const cmd = pidRef.current.update(
          setpointRef.current,
          next.level,
          FIXED_DT,
        )
        next = stepTank(next, config, cmd, FIXED_DT)
        accRef.current -= FIXED_DT

        // Sample into history at a coarser rate. The point is built here rather
        // than inside the updater: the updater runs after the loop has finished,
        // so closing over `next` would stamp every sample taken this frame with
        // the frame's final state (visible as flat spots at high sim speeds).
        sampleAccRef.current += FIXED_DT
        if (sampleAccRef.current >= HISTORY_SAMPLE) {
          sampleAccRef.current = 0
          const point = {
            t: next.time,
            level: next.level,
            setpoint: setpointRef.current,
          }
          setHistory((h) => {
            const cutoff = point.t - HISTORY_SECONDS
            const arr = [...h, point]
            let i = 0
            while (i < arr.length && arr[i].t < cutoff) i++
            return i > 0 ? arr.slice(i) : arr
          })
        }
      }

      stateRef.current = next
      setState(next)

      // Numeric tiles refresh on real time, independent of sim speed.
      readoutAccRef.current += realFrame
      if (readoutAccRef.current >= READOUT_INTERVAL) {
        readoutAccRef.current = 0
        setReadout(next)
      }
    }

    rafRef.current = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(rafRef.current)
  }, [config])

  const reset = useCallback(() => {
    const fresh = createInitialState(config)
    pidRef.current.reset()
    stateRef.current = fresh
    accRef.current = 0
    sampleAccRef.current = 0
    readoutAccRef.current = 0
    setState(fresh)
    setReadout(fresh)
    setHistory([])
  }, [config])

  const triggerLeak = useCallback(() => {
    const patch = applyLeak(stateRef.current, config)
    stateRef.current = { ...stateRef.current, ...patch }
    setState(stateRef.current)
    setReadout(stateRef.current)
  }, [config])

  const triggerPressureDrop = useCallback(() => {
    const patch = applyPressureDrop()
    stateRef.current = { ...stateRef.current, ...patch }
    setState(stateRef.current)
    setReadout(stateRef.current)
  }, [])

  return {
    config,
    state,
    readout,
    setpoint,
    setSetpoint,
    gains,
    setGains,
    running,
    setRunning,
    simSpeed,
    setSimSpeed,
    history,
    reset,
    triggerLeak,
    triggerPressureDrop,
  }
}
