// A classic PID controller with output clamping and integral anti-windup.
//
// The controller reads the error between the desired level (setpoint) and the
// measured level, then computes a pump command in [0, 1] where 0 = pump off and
// 1 = pump at full speed.
export class PIDController {
  constructor({ kp = 1, ki = 0, kd = 0, outMin = 0, outMax = 1 } = {}) {
    this.kp = kp
    this.ki = ki
    this.kd = kd
    this.outMin = outMin
    this.outMax = outMax
    this.reset()
  }

  reset() {
    this.integral = 0
    this.prevMeasurement = 0
    this.hasPrev = false
  }

  setGains({ kp, ki, kd }) {
    if (kp != null) this.kp = kp
    if (ki != null) this.ki = ki
    if (kd != null) this.kd = kd
  }

  // setpoint & measurement in the same units (metres); dt in seconds.
  update(setpoint, measurement, dt) {
    if (dt <= 0) return this.outMin

    const error = setpoint - measurement

    // Derivative on measurement, not on error. Differentiating the error makes
    // any setpoint change produce a spike of (Δsetpoint / dt) — a "derivative
    // kick" that slams the pump to a limit for one step every time the target
    // slider moves. With a constant setpoint the two forms are identical, since
    // d(error)/dt = -d(measurement)/dt there.
    //
    // On the first sample there is no history, so the derivative is zero to
    // avoid a startup kick.
    const derivative = this.hasPrev
      ? -(measurement - this.prevMeasurement) / dt
      : 0

    // Tentative integral update.
    const nextIntegral = this.integral + error * dt

    // Unclamped command.
    let output =
      this.kp * error + this.ki * nextIntegral + this.kd * derivative

    // Clamp to actuator limits and apply anti-windup: only commit the integral
    // growth if we are not pushing further into saturation.
    if (output > this.outMax) {
      output = this.outMax
      if (error <= 0) this.integral = nextIntegral
    } else if (output < this.outMin) {
      output = this.outMin
      if (error >= 0) this.integral = nextIntegral
    } else {
      this.integral = nextIntegral
    }

    this.prevMeasurement = measurement
    this.hasPrev = true

    return output
  }
}
