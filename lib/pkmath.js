// pkmath.js — PharmLab PK/PD Math Library
// Pure deterministic functions only.
// No AI, no randomness, no side effects.
// Every equation traceable to a standard PK textbook.

// ─── Core helpers ─────────────────────────────────────────────────

export function calcKe(CL, Vd) {
  if (!Vd || Vd === 0) throw new Error('Vd cannot be zero')
  return CL / Vd
}

export function calcHalfLife(ke) {
  if (!ke || ke === 0) throw new Error('ke cannot be zero')
  return Math.LN2 / ke
}

export function calcTmax(ka, ke) {
  if (Math.abs(ka - ke) < 1e-10) throw new Error('ka cannot equal ke')
  if (ka <= 0 || ke <= 0) throw new Error('ka and ke must be positive')
  return Math.log(ka / ke) / (ka - ke)
}

// ─── Numerical solvers ────────────────────────────────────────────

// RK4 for single ODE: dC/dt = f(t, C)
function rk4_1d(f, C0, tStart, tEnd, nSteps) {
  const dt  = (tEnd - tStart) / nSteps
  const pts = [{ t: tStart, c: Math.max(0, C0) }]
  let C = C0, t = tStart
  for (let i = 0; i < nSteps; i++) {
    const k1 = f(t,          C)
    const k2 = f(t + dt / 2, C + dt * k1 / 2)
    const k3 = f(t + dt / 2, C + dt * k2 / 2)
    const k4 = f(t + dt,     C + dt * k3)
    C = Math.max(0, C + (dt / 6) * (k1 + 2*k2 + 2*k3 + k4))
    t = tStart + (i + 1) * dt
    pts.push({ t, c: C })
  }
  return pts
}

// RK4 for 2-variable system: returns [{t, c1, c2}]
function rk4_2d(f, C1_0, C2_0, tStart, tEnd, nSteps) {
  const dt  = (tEnd - tStart) / nSteps
  const pts = [{ t: tStart, c1: Math.max(0, C1_0), c2: Math.max(0, C2_0) }]
  let C1 = C1_0, C2 = C2_0, t = tStart
  for (let i = 0; i < nSteps; i++) {
    const [k1a, k1b] = f(t,          C1,             C2)
    const [k2a, k2b] = f(t + dt / 2, C1 + dt*k1a/2, C2 + dt*k1b/2)
    const [k3a, k3b] = f(t + dt / 2, C1 + dt*k2a/2, C2 + dt*k2b/2)
    const [k4a, k4b] = f(t + dt,     C1 + dt*k3a,   C2 + dt*k3b)
    C1 = Math.max(0, C1 + (dt/6) * (k1a + 2*k2a + 2*k3a + k4a))
    C2 = Math.max(0, C2 + (dt/6) * (k1b + 2*k2b + 2*k3b + k4b))
    t  = tStart + (i + 1) * dt
    pts.push({ t, c1: C1, c2: C2 })
  }
  return pts
}

// RK4 for 3-variable system (absorption + 2 compartments): returns [{t, ca, c1, c2}]
function rk4_3d(f, Ca0, C1_0, C2_0, tStart, tEnd, nSteps) {
  const dt  = (tEnd - tStart) / nSteps
  const pts = [{ t: tStart, ca: Ca0, c1: Math.max(0, C1_0), c2: Math.max(0, C2_0) }]
  let Ca = Ca0, C1 = C1_0, C2 = C2_0, t = tStart
  for (let i = 0; i < nSteps; i++) {
    const [k1a, k1b, k1c] = f(t,          Ca,           C1,           C2)
    const [k2a, k2b, k2c] = f(t + dt / 2, Ca+dt*k1a/2, C1+dt*k1b/2, C2+dt*k1c/2)
    const [k3a, k3b, k3c] = f(t + dt / 2, Ca+dt*k2a/2, C1+dt*k2b/2, C2+dt*k2c/2)
    const [k4a, k4b, k4c] = f(t + dt,     Ca+dt*k3a,   C1+dt*k3b,   C2+dt*k3c)
    Ca = Math.max(0, Ca + (dt/6) * (k1a + 2*k2a + 2*k3a + k4a))
    C1 = Math.max(0, C1 + (dt/6) * (k1b + 2*k2b + 2*k3b + k4b))
    C2 = Math.max(0, C2 + (dt/6) * (k1c + 2*k2c + 2*k3c + k4c))
    t  = tStart + (i + 1) * dt
    pts.push({ t, ca: Ca, c1: C1, c2: C2 })
  }
  return pts
}

// Numerical AUC — trapezoidal rule
export function calcAUC_numerical(pts) {
  let auc = 0
  for (let i = 1; i < pts.length; i++) {
    auc += 0.5 * (pts[i-1].c + pts[i].c) * (pts[i].t - pts[i-1].t)
  }
  return auc
}

// Numerical t½ — find time C falls to 50% of Cmax in terminal phase
export function calcHalfLife_numerical(pts) {
  const cmax    = Math.max(...pts.map(p => p.c))
  const half    = cmax / 2
  const cmaxIdx = pts.findIndex(p => p.c === cmax)
  for (let i = cmaxIdx + 1; i < pts.length; i++) {
    if (pts[i].c <= half) {
      const p0   = pts[i - 1]
      const p1   = pts[i]
      const frac = (half - p0.c) / (p1.c - p0.c)
      return p0.t + frac * (p1.t - p0.t)
    }
  }
  return null
}

// ─── 1-compartment linear ─────────────────────────────────────────

export function concentration_oral(t, F, D, Vd, ka, ke) {
  if (t < 0) return 0
  if (Math.abs(ka - ke) < 1e-10)
    return Math.max(0, (F * D * ke * t / Vd) * Math.exp(-ke * t))
  return Math.max(0, (F * D * ka) / (Vd * (ka - ke)) * (Math.exp(-ke * t) - Math.exp(-ka * t)))
}

export function concentration_iv_bolus(t, D, Vd, ke) {
  if (t < 0) return 0
  return Math.max(0, (D / Vd) * Math.exp(-ke * t))
}

export function concentration_iv_infusion(t, R0, CL, Vd, ke, Tinf) {
  if (t < 0) return 0
  const css = R0 / CL
  if (t <= Tinf) return Math.max(0, css * (1 - Math.exp(-ke * t)))
  return Math.max(0, css * (1 - Math.exp(-ke * Tinf)) * Math.exp(-ke * (t - Tinf)))
}

export function concentration_multiple_oral(t, F, D, Vd, ka, ke, tau) {
  if (t < 0) return 0
  let total = 0
  const nDoses = Math.floor(t / tau) + 1
  for (let i = 0; i < nDoses; i++) {
    const ti = t - i * tau
    if (ti >= 0) total += concentration_oral(ti, F, D, Vd, ka, ke)
  }
  return Math.max(0, total)
}

// ─── 1-compartment MM curves ──────────────────────────────────────

function curve_1comp_mm_iv_bolus(D, Vd, Vmax, Km, tEnd) {
  const C0 = D / Vd
  return rk4_1d((t, C) => -(Vmax * C) / ((Km + C) * Vd), C0, 0, tEnd, 2000)
}

function curve_1comp_mm_oral(F, D, Vd, ka, Vmax, Km, tEnd) {
  const Ca0 = F * D
  const f   = (t, Ca, C1) => [
    -ka * Ca,
    (ka * Ca) / Vd - (Vmax * C1) / ((Km + C1) * Vd)
  ]
  return rk4_2d(f, Ca0, 0, 0, tEnd, 2000).map(p => ({ t: p.t, c: p.c1 }))
}

function curve_1comp_mm_infusion(D, Vd, Vmax, Km, Tinf, tEnd) {
  const R0 = D / Tinf
  return rk4_1d(
    (t, C) => t <= Tinf
      ? R0 / Vd - (Vmax * C) / ((Km + C) * Vd)
      : -(Vmax * C) / ((Km + C) * Vd),
    0, 0, tEnd, 2000
  )
}

function curve_1comp_mm_multiple_oral(F, D, Vd, ka, Vmax, Km, tau, tEnd) {
  const nDoses = Math.ceil(tEnd / tau) + 1
  const stepsPerDose = 400
  const f = (t, Ca, C1) => [
    -ka * Ca,
    (ka * Ca) / Vd - (Vmax * C1) / ((Km + C1) * Vd)
  ]
  let allPts = []
  let Ca = F * D, C1 = 0, tCurrent = 0
  for (let dose = 0; dose < nDoses; dose++) {
    const tDoseEnd = Math.min(tCurrent + tau, tEnd)
    if (tDoseEnd <= tCurrent) break
    const seg = rk4_2d(f, Ca, C1, tCurrent, tDoseEnd, stepsPerDose)
    allPts = [...allPts, ...seg.map(p => ({ t: p.t, c: p.c1 }))]
    const last = seg[seg.length - 1]
    Ca = last.c2 + F * D
    C1 = last.c1
    tCurrent = tDoseEnd
  }
  return allPts
}

// ─── 2-compartment linear (Vc/Vp/CL/Q) ──────────────────────────
// dC1/dt = -(CL/Vc)*C1 - (Q/Vc)*C1 + (Q/Vp)*C2
// dC2/dt =  (Q/Vc)*C1  - (Q/Vp)*C2

function make2compLinearODE(Vc, Vp, CL, Q) {
  return (t, C1, C2) => [
    -(CL/Vc)*C1 - (Q/Vc)*C1 + (Q/Vp)*C2,
     (Q/Vc)*C1  - (Q/Vp)*C2
  ]
}

function curve_2comp_linear_iv_bolus(D, Vc, Vp, CL, Q, tEnd) {
  return rk4_2d(make2compLinearODE(Vc, Vp, CL, Q), D/Vc, 0, 0, tEnd, 2000)
    .map(p => ({ t: p.t, c: p.c1 }))
}

function curve_2comp_linear_oral(F, D, Vc, Vp, CL, Q, ka, tEnd) {
  const f = (t, Ca, C1, C2) => [
    -ka * Ca,
    (ka * Ca) / Vc - (CL/Vc)*C1 - (Q/Vc)*C1 + (Q/Vp)*C2,
    (Q/Vc)*C1 - (Q/Vp)*C2
  ]
  return rk4_3d(f, F*D, 0, 0, 0, tEnd, 2000).map(p => ({ t: p.t, c: p.c1 }))
}

function curve_2comp_linear_infusion(D, Vc, Vp, CL, Q, Tinf, tEnd) {
  const R0 = D / Tinf
  const f  = (t, C1, C2) => [
    (t <= Tinf ? R0/Vc : 0) - (CL/Vc)*C1 - (Q/Vc)*C1 + (Q/Vp)*C2,
    (Q/Vc)*C1 - (Q/Vp)*C2
  ]
  return rk4_2d(f, 0, 0, 0, tEnd, 2000).map(p => ({ t: p.t, c: p.c1 }))
}

// ─── 2-compartment MM (Vc/Vp/Vmax/Km/Q) ─────────────────────────
// dC1/dt = -(Vmax*C1)/((Km+C1)*Vc) - (Q/Vc)*C1 + (Q/Vp)*C2
// dC2/dt =  (Q/Vc)*C1 - (Q/Vp)*C2

function make2compMMODE(Vc, Vp, Vmax, Km, Q) {
  return (t, C1, C2) => [
    -(Vmax*C1)/((Km+C1)*Vc) - (Q/Vc)*C1 + (Q/Vp)*C2,
     (Q/Vc)*C1 - (Q/Vp)*C2
  ]
}

function curve_2comp_mm_iv_bolus(D, Vc, Vp, Vmax, Km, Q, tEnd) {
  return rk4_2d(make2compMMODE(Vc, Vp, Vmax, Km, Q), D/Vc, 0, 0, tEnd, 2000)
    .map(p => ({ t: p.t, c: p.c1 }))
}

function curve_2comp_mm_oral(F, D, Vc, Vp, Vmax, Km, Q, ka, tEnd) {
  const f = (t, Ca, C1, C2) => [
    -ka * Ca,
    (ka*Ca)/Vc - (Vmax*C1)/((Km+C1)*Vc) - (Q/Vc)*C1 + (Q/Vp)*C2,
    (Q/Vc)*C1 - (Q/Vp)*C2
  ]
  return rk4_3d(f, F*D, 0, 0, 0, tEnd, 2000).map(p => ({ t: p.t, c: p.c1 }))
}

function curve_2comp_mm_infusion(D, Vc, Vp, Vmax, Km, Q, Tinf, tEnd) {
  const R0 = D / Tinf
  const f  = (t, C1, C2) => [
    (t <= Tinf ? R0/Vc : 0) - (Vmax*C1)/((Km+C1)*Vc) - (Q/Vc)*C1 + (Q/Vp)*C2,
    (Q/Vc)*C1 - (Q/Vp)*C2
  ]
  return rk4_2d(f, 0, 0, 0, tEnd, 2000).map(p => ({ t: p.t, c: p.c1 }))
}

// ─── Curve generator ──────────────────────────────────────────────

export function generateCurve(modelKey, params, nPoints = 400) {
  let rawPts

  switch (modelKey) {
    // 1-comp linear
    case 'oral_1comp_linear': {
      const ke = params.ke ?? calcKe(params.CL, params.Vd)
      const times = Array.from({ length: nPoints }, (_, i) => (i/(nPoints-1)) * params.tEnd)
      rawPts = times.map(t => ({ t, c: concentration_oral(t, params.F, params.D, params.Vd, params.ka, ke) }))
      break
    }
    case 'iv_bolus_1comp_linear': {
      const ke = params.ke ?? calcKe(params.CL, params.Vd)
      const times = Array.from({ length: nPoints }, (_, i) => (i/(nPoints-1)) * params.tEnd)
      rawPts = times.map(t => ({ t, c: concentration_iv_bolus(t, params.D, params.Vd, ke) }))
      break
    }
    case 'iv_inf_1comp_linear': {
      const ke = params.ke ?? calcKe(params.CL, params.Vd)
      const times = Array.from({ length: nPoints }, (_, i) => (i/(nPoints-1)) * params.tEnd)
      rawPts = times.map(t => ({ t, c: concentration_iv_infusion(t, params.R0, params.CL, params.Vd, ke, params.Tinf) }))
      break
    }
    case 'oral_multi_1comp_linear': {
      const ke = params.ke ?? calcKe(params.CL, params.Vd)
      const times = Array.from({ length: nPoints }, (_, i) => (i/(nPoints-1)) * params.tEnd)
      rawPts = times.map(t => ({ t, c: concentration_multiple_oral(t, params.F, params.D, params.Vd, params.ka, ke, params.tau) }))
      break
    }

    // 1-comp MM
    case 'oral_1comp_mm':
      rawPts = curve_1comp_mm_oral(params.F, params.D, params.Vd, params.ka, params.Vmax, params.Km, params.tEnd)
      break
    case 'iv_bolus_1comp_mm':
      rawPts = curve_1comp_mm_iv_bolus(params.D, params.Vd, params.Vmax, params.Km, params.tEnd)
      break
    case 'iv_inf_1comp_mm':
      rawPts = curve_1comp_mm_infusion(params.D, params.Vd, params.Vmax, params.Km, params.Tinf, params.tEnd)
      break
    case 'oral_multi_1comp_mm':
      rawPts = curve_1comp_mm_multiple_oral(params.F, params.D, params.Vd, params.ka, params.Vmax, params.Km, params.tau, params.tEnd)
      break

    // 2-comp linear
    case 'oral_2comp_linear':
      rawPts = curve_2comp_linear_oral(params.F, params.D, params.Vc, params.Vp, params.CL, params.Q, params.ka, params.tEnd)
      break
    case 'iv_bolus_2comp_linear':
      rawPts = curve_2comp_linear_iv_bolus(params.D, params.Vc, params.Vp, params.CL, params.Q, params.tEnd)
      break
    case 'iv_inf_2comp_linear':
      rawPts = curve_2comp_linear_infusion(params.D, params.Vc, params.Vp, params.CL, params.Q, params.Tinf, params.tEnd)
      break

    // 2-comp MM
    case 'oral_2comp_mm':
      rawPts = curve_2comp_mm_oral(params.F, params.D, params.Vc, params.Vp, params.Vmax, params.Km, params.Q, params.ka, params.tEnd)
      break
    case 'iv_bolus_2comp_mm':
      rawPts = curve_2comp_mm_iv_bolus(params.D, params.Vc, params.Vp, params.Vmax, params.Km, params.Q, params.tEnd)
      break
    case 'iv_inf_2comp_mm':
      rawPts = curve_2comp_mm_infusion(params.D, params.Vc, params.Vp, params.Vmax, params.Km, params.Q, params.Tinf, params.tEnd)
      break

    default:
      throw new Error(`Unknown model: ${modelKey}`)
  }

  // Downsample if RK4 returned more points than needed
  if (rawPts.length <= nPoints) return rawPts
  const step = Math.floor(rawPts.length / nPoints)
  return rawPts.filter((_, i) => i % step === 0)
}

// ─── Metrics ──────────────────────────────────────────────────────

export function calcMetrics(modelKey, params) {
  const isMM    = modelKey.endsWith('_mm')
  const is2comp = modelKey.includes('2comp')
  const isInf   = modelKey.includes('inf')
  const isMulti = modelKey.includes('multi')
  const isOral  = modelKey.startsWith('oral')

  // ── Linear 1-comp — closed form ──
  if (!isMM && !is2comp) {
    const ke    = params.ke ?? calcKe(params.CL, params.Vd)
    const thalf = calcHalfLife(ke)

    if (isInf) {
      const css  = params.R0 / params.CL
      const cmax = css * (1 - Math.exp(-ke * params.Tinf))
      const auc  = css * params.Tinf + cmax / ke
      return { thalf: +thalf.toFixed(3), cmax: +cmax.toFixed(4), tmax: +params.Tinf.toFixed(3), auc: +auc.toFixed(2), css: +css.toFixed(4), ke: +ke.toFixed(4), numerical: false }
    }
    if (isOral && !isMulti) {
      const tmax     = calcTmax(params.ka, ke)
      const cmax     = concentration_oral(tmax, params.F, params.D, params.Vd, params.ka, ke)
      const auc      = (params.F * params.D) / params.CL
      const flipFlop = ke > params.ka
      return { thalf: +thalf.toFixed(3), cmax: +cmax.toFixed(4), tmax: +tmax.toFixed(3), auc: +auc.toFixed(2), css: null, ke: +ke.toFixed(4), flipFlop, numerical: false }
    }
    if (isMulti) {
      const tmax = calcTmax(params.ka, ke)
      const cmax = concentration_multiple_oral(tmax + params.tau * 12, params.F, params.D, params.Vd, params.ka, ke, params.tau)
      const auc  = (params.F * params.D) / params.CL
      const css  = (params.F * params.D) / (params.CL * params.tau)
      const flipFlop = ke > params.ka
      return { thalf: +thalf.toFixed(3), cmax: +cmax.toFixed(4), tmax: +tmax.toFixed(3), auc: +auc.toFixed(2), css: +css.toFixed(4), ke: +ke.toFixed(4), flipFlop, numerical: false }
    }
    // IV bolus 1-comp
    return {
      thalf: +thalf.toFixed(3),
      cmax:  +(params.D / params.Vd).toFixed(4),
      tmax:  0,
      auc:   +(params.D / params.CL).toFixed(2),
      css:   null,
      ke:    +ke.toFixed(4),
      numerical: false
    }
  }

  // ── Linear 2-comp — derive α/β analytically, curve numerically ──
  if (!isMM && is2comp) {
    const { Vc, Vp, CL, Q } = params
    const k10   = CL / Vc
    const k12   = Q  / Vc
    const k21   = Q  / Vp
    const sum   = k10 + k12 + k21
    const disc  = Math.sqrt(Math.max(0, sum*sum - 4*k10*k21))
    const alpha = 0.5 * (sum + disc)
    const beta  = 0.5 * (sum - disc)

    const pts    = generateCurve(modelKey, params)
    const cmax   = Math.max(...pts.map(p => p.c))
    const cmaxPt = pts.find(p => p.c === cmax)
    const auc    = calcAUC_numerical(pts)

    // Css for infusion
    let css = null
    if (isInf) css = (params.D / params.Tinf) / CL

    return {
      thalf:       +(Math.LN2 / beta).toFixed(3),
      thalf_alpha: +(Math.LN2 / alpha).toFixed(3),
      thalf_beta:  +(Math.LN2 / beta).toFixed(3),
      alpha:       +alpha.toFixed(4),
      beta:        +beta.toFixed(4),
      cmax:        +cmax.toFixed(4),
      tmax:        +(cmaxPt?.t ?? 0).toFixed(3),
      auc:         +auc.toFixed(2),
      css:         css != null ? +css.toFixed(4) : null,
      ke:          +beta.toFixed(4),
      numerical:   true,
    }
  }

  // ── All MM models — fully numerical ──
  if (isMM) {
    const pts    = generateCurve(modelKey, params)
    const cmax   = Math.max(...pts.map(p => p.c))
    const cmaxPt = pts.find(p => p.c === cmax)
    const auc    = calcAUC_numerical(pts)
    const thalf  = calcHalfLife_numerical(pts)

    return {
      thalf:     thalf != null ? +thalf.toFixed(3) : null,
      cmax:      +cmax.toFixed(4),
      tmax:      +(cmaxPt?.t ?? 0).toFixed(3),
      auc:       +auc.toFixed(2),
      css:       null,
      ke:        null,
      numerical: true,
      mmNote:    true,
    }
  }

  throw new Error(`calcMetrics: unknown modelKey ${modelKey}`)
}