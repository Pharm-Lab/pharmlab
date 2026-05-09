// pkmath.js — PharmLab PK/PD Math Library
// All functions are pure and deterministic.
// No AI, no randomness, no side effects.
// Every equation is traceable to a standard PK textbook.

// ─── Core rate constants ───────────────────────────────────────────────────

export function calcKe(CL, Vd) {
  if (Vd === 0) throw new Error('Vd cannot be zero')
  return CL / Vd
}

export function calcHalfLife(ke) {
  if (ke === 0) throw new Error('ke cannot be zero')
  return Math.LN2 / ke
}

export function calcAUC_oral(F, D, CL) {
  if (CL === 0) throw new Error('CL cannot be zero')
  return (F * D) / CL
}

export function calcAUC_iv(D, CL) {
  if (CL === 0) throw new Error('CL cannot be zero')
  return D / CL
}

export function calcCss(R0, CL) {
  if (CL === 0) throw new Error('CL cannot be zero')
  return R0 / CL
}

export function calcTmax(ka, ke) {
  if (ka === ke) throw new Error('ka cannot equal ke (flip-flop condition)')
  if (ka <= 0 || ke <= 0) throw new Error('ka and ke must be positive')
  return Math.log(ka / ke) / (ka - ke)
}

export function calcCmax_oral(F, D, Vd, ka, ke) {
  const tmax = calcTmax(ka, ke)
  return concentration_oral(tmax, F, D, Vd, ka, ke)
}

// ─── Concentration equations ───────────────────────────────────────────────

// 1-compartment oral single dose
// C(t) = (F·D·ka) / (Vd·(ka−ke)) · (e^−ket − e^−kat)
export function concentration_oral(t, F, D, Vd, ka, ke) {
  if (t < 0) return 0
  if (Math.abs(ka - ke) < 1e-10) {
    // flip-flop edge case: use limiting form
    return (F * D * ke * t / Vd) * Math.exp(-ke * t)
  }
  const c = (F * D * ka) / (Vd * (ka - ke)) * (Math.exp(-ke * t) - Math.exp(-ka * t))
  return Math.max(0, c)
}

// 1-compartment IV bolus
// C(t) = (D / Vd) · e^−ket
export function concentration_iv_bolus(t, D, Vd, ke) {
  if (t < 0) return 0
  return Math.max(0, (D / Vd) * Math.exp(-ke * t))
}

// 1-compartment IV infusion (constant rate R0 = D/duration)
// During infusion: C(t) = (R0/CL) · (1 − e^−ket)
// After infusion:  C(t) = Css · (1 − e^−ke·Tinf) · e^−ke(t−Tinf)
export function concentration_iv_infusion(t, R0, CL, Vd, ke, Tinf) {
  if (t < 0) return 0
  const css = R0 / CL
  if (t <= Tinf) {
    return Math.max(0, css * (1 - Math.exp(-ke * t)))
  } else {
    const cEnd = css * (1 - Math.exp(-ke * Tinf))
    return Math.max(0, cEnd * Math.exp(-ke * (t - Tinf)))
  }
}

// Multiple oral doses by superposition
// Sums individual dose contributions at each dosing interval
export function concentration_multiple_oral(t, F, D, Vd, ka, ke, tau) {
  if (t < 0) return 0
  const nDoses = Math.floor(t / tau) + 1
  let total = 0
  for (let i = 0; i < nDoses; i++) {
    const ti = t - i * tau
    if (ti >= 0) {
      total += concentration_oral(ti, F, D, Vd, ka, ke)
    }
  }
  return Math.max(0, total)
}

// 2-compartment IV bolus (biexponential)
// C(t) = A·e^−αt + B·e^−βt
// α and β are hybrid rate constants derived from micro-constants
export function concentration_2comp_iv(t, D, Vc, k12, k21, k10) {
  if (t < 0) return 0
  const alpha = 0.5 * ((k12 + k21 + k10) + Math.sqrt(Math.pow(k12 + k21 + k10, 2) - 4 * k21 * k10))
  const beta  = 0.5 * ((k12 + k21 + k10) - Math.sqrt(Math.pow(k12 + k21 + k10, 2) - 4 * k21 * k10))
  const A = (D / Vc) * (alpha - k21) / (alpha - beta)
  const B = (D / Vc) * (k21 - beta)  / (alpha - beta)
  return Math.max(0, A * Math.exp(-alpha * t) + B * Math.exp(-beta * t))
}

// ─── Curve generators ──────────────────────────────────────────────────────
// These return arrays of {t, c} points for plotting.
// nPoints controls resolution — 300 is smooth for any zoom level.

export function generateCurve(modelType, params, nPoints = 300) {
  const { tEnd } = params
  const times = Array.from({ length: nPoints }, (_, i) => (i / (nPoints - 1)) * tEnd)

  let concentrations
  switch (modelType) {
    case 'oral':
      concentrations = times.map(t =>
        concentration_oral(t, params.F, params.D, params.Vd, params.ka, params.ke)
      )
      break
    case 'iv_bolus':
      concentrations = times.map(t =>
        concentration_iv_bolus(t, params.D, params.Vd, params.ke)
      )
      break
    case 'iv_infusion':
      concentrations = times.map(t =>
        concentration_iv_infusion(t, params.R0, params.CL, params.Vd, params.ke, params.Tinf)
      )
      break
    case 'multiple_oral':
      concentrations = times.map(t =>
        concentration_multiple_oral(t, params.F, params.D, params.Vd, params.ka, params.ke, params.tau)
      )
      break
    case '2comp_iv':
      concentrations = times.map(t =>
        concentration_2comp_iv(t, params.D, params.Vc, params.k12, params.k21, params.k10)
      )
      break
    default:
      throw new Error(`Unknown model type: ${modelType}`)
  }

  return times.map((t, i) => ({ t, c: concentrations[i] }))
}

// ─── Derived metrics ───────────────────────────────────────────────────────
// Closed-form where possible — never read off the curve.

export function calcMetrics(modelType, params) {
  const ke = params.ke ?? calcKe(params.CL, params.Vd)
  const thalf = calcHalfLife(ke)

  let cmax, tmax, auc, css

  switch (modelType) {
    case 'oral':
      tmax = calcTmax(params.ka, ke)
      cmax = concentration_oral(tmax, params.F, params.D, params.Vd, params.ka, ke)
      auc  = calcAUC_oral(params.F, params.D, params.CL)
      break
    case 'iv_bolus':
      tmax = 0
      cmax = params.D / params.Vd
      auc  = calcAUC_iv(params.D, params.CL)
      break
    case 'iv_infusion':
      css  = calcCss(params.R0, params.CL)
      auc  = css * params.Tinf + (css * (1 - Math.exp(-ke * params.Tinf)) / ke)
      cmax = css * (1 - Math.exp(-ke * params.Tinf))
      tmax = params.Tinf
      break
    case 'multiple_oral':
      tmax = calcTmax(params.ka, ke)
      cmax = concentration_multiple_oral(
        tmax + params.tau * 10, params.F, params.D, params.Vd, params.ka, ke, params.tau
      )
      auc  = calcAUC_oral(params.F, params.D, params.CL)
      css  = (params.F * params.D) / (params.CL * params.tau)
      break
    case '2comp_iv': {
      const { Vc, k12, k21, k10, D } = params
      const alpha = 0.5 * ((k12 + k21 + k10) + Math.sqrt(Math.pow(k12 + k21 + k10, 2) - 4 * k21 * k10))
      const beta  = 0.5 * ((k12 + k21 + k10) - Math.sqrt(Math.pow(k12 + k21 + k10, 2) - 4 * k21 * k10))
      const A = (D / Vc) * (alpha - k21) / (alpha - beta)
      const B = (D / Vc) * (k21 - beta)  / (alpha - beta)
      cmax = A + B
      tmax = 0
      auc  = A / alpha + B / beta
      break
    }
    default:
      throw new Error(`Unknown model type: ${modelType}`)
  }

  return {
    thalf:  +thalf.toFixed(3),
    cmax:   +cmax.toFixed(4),
    tmax:   +(tmax ?? 0).toFixed(3),
    auc:    +(auc ?? 0).toFixed(2),
    css:    css != null ? +css.toFixed(4) : null,
    ke:     +ke.toFixed(4),
  }
}