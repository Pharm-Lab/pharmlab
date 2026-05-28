// bacmath.js — PharmLab BAC Math Library
// Widmark model with first-order absorption and zero-order elimination
// All functions pure and deterministic — no AI, no randomness
// Sources: Widmark (1932), Jones & Andersson (1996), Norberg et al (2003)

// ─── Widmark parameters ───────────────────────────────────────────

export const WIDMARK_R = { male: 0.68, female: 0.55 }

export const BETA_MEAN = 0.15
export const BETA_LOW  = 0.10
export const BETA_HIGH = 0.20

export const KA_FASTING = 6.0
export const KA_FED     = 1.5

export const FOOD_PEAK_FACTOR = 0.72

// ─── Unit conversions ─────────────────────────────────────────────

export function mlToGrams(ml) { return ml * 0.789 }

export function calcEthanolGrams(volumeMl, abvFraction) {
  return volumeMl * abvFraction * 0.789
}

// ─── Legal limits ─────────────────────────────────────────────────

export const COUNTRIES = {
  NL: {
    name:         '🇳🇱 Netherlands',
    standard:     0.5,
    novice:       0.2,
    professional: 0.2,
    noviceLabel:  'Novice (<5yr licence / <24 on moped)',
    proLabel:     'Professional / commercial',
    note:         null,
  },
  DE: {
    name:         '🇩🇪 Germany',
    standard:     0.5,
    novice:       0.0,
    professional: 0.0,
    noviceLabel:  'Novice (zero tolerance)',
    proLabel:     'Professional (zero tolerance)',
    note:         'In Germany, a BAC ≥ 0.3‰ during an accident or traffic offence is a criminal offence — regardless of the standard 0.5‰ limit.',
  },
  BE: {
    name:         '🇧🇪 Belgium',
    standard:     0.5,
    novice:       0.2,
    professional: 0.2,
    noviceLabel:  'Novice driver',
    proLabel:     'Professional / commercial',
    note:         null,
  },
  FR: {
    name:         '🇫🇷 France',
    standard:     0.5,
    novice:       0.2,
    professional: 0.2,
    noviceLabel:  'Novice driver',
    proLabel:     'Professional / commercial',
    note:         null,
  },
}

// ─── BAC effect zones ─────────────────────────────────────────────

export const BAC_ZONES = [
  { min: 0,   max: 0.2, label: 'Sober',                   color: '#22c55e', alpha: 0.06 },
  { min: 0.2, max: 0.5, label: 'Mild effects',             color: '#84cc16', alpha: 0.08 },
  { min: 0.5, max: 1.0, label: 'Impaired',                 color: '#f59e0b', alpha: 0.10 },
  { min: 1.0, max: 1.5, label: 'Clearly drunk',            color: '#f97316', alpha: 0.12 },
  { min: 1.5, max: 2.0, label: 'Severely impaired',        color: '#ef4444', alpha: 0.14 },
  { min: 2.0, max: 3.0, label: 'Risk of unconsciousness',  color: '#dc2626', alpha: 0.18 },
  { min: 3.0, max: 10,  label: '⚠ Potentially fatal',      color: '#7f1d1d', alpha: 0.22 },
]

// ─── Drinks database ──────────────────────────────────────────────

export const DRINK_TYPES = [
  { id: 'lager',       name: 'Lager / Pils',          category: 'Beer',    defaultAbv: 5.0  },
  { id: 'wheat_beer',  name: 'Wheat beer',             category: 'Beer',    defaultAbv: 5.0  },
  { id: 'ipa',         name: 'IPA',                    category: 'Beer',    defaultAbv: 6.5  },
  { id: 'strong_beer', name: 'Strong beer / Trappist', category: 'Beer',    defaultAbv: 8.5  },
  { id: 'radler',      name: 'Radler / Shandy',        category: 'Beer',    defaultAbv: 2.5  },
  { id: 'white_wine',  name: 'White wine',             category: 'Wine',    defaultAbv: 12.0 },
  { id: 'red_wine',    name: 'Red wine',               category: 'Wine',    defaultAbv: 13.5 },
  { id: 'rose',        name: 'Rosé',                   category: 'Wine',    defaultAbv: 12.0 },
  { id: 'prosecco',    name: 'Prosecco / Cava',        category: 'Wine',    defaultAbv: 11.0 },
  { id: 'champagne',   name: 'Champagne',              category: 'Wine',    defaultAbv: 12.0 },
  { id: 'jenever',     name: 'Jenever / Genever',      category: 'Spirits', defaultAbv: 35.0 },
  { id: 'vodka',       name: 'Vodka',                  category: 'Spirits', defaultAbv: 40.0 },
  { id: 'rum',         name: 'Rum',                    category: 'Spirits', defaultAbv: 40.0 },
  { id: 'whisky',      name: 'Whisky / Bourbon',       category: 'Spirits', defaultAbv: 40.0 },
  { id: 'gin',         name: 'Gin',                    category: 'Spirits', defaultAbv: 40.0 },
  { id: 'tequila',     name: 'Tequila / Mezcal',       category: 'Spirits', defaultAbv: 38.0 },
  { id: 'brandy',      name: 'Brandy / Cognac',        category: 'Spirits', defaultAbv: 40.0 },
  { id: 'cocktail',    name: 'Cocktail (average)',     category: 'Mixed',   defaultAbv: 10.0 },
  { id: 'long_drink',  name: 'Long drink',             category: 'Mixed',   defaultAbv: 7.0  },
  { id: 'rtd',         name: 'RTD / Alcopop',          category: 'Mixed',   defaultAbv: 5.0  },
  { id: 'hard_seltzer',name: 'Hard seltzer',           category: 'Mixed',   defaultAbv: 5.0  },
  { id: 'cider',       name: 'Cider',                  category: 'Mixed',   defaultAbv: 4.5  },
  { id: 'custom',      name: '✏ Custom drink',         category: 'Custom',  defaultAbv: 5.0  },
]

export const DRINK_VOLUMES = {
  Beer: [
    { label: 'Small glass (200ml)', ml: 200 },
    { label: 'Can / bottle (330ml)',ml: 330 },
    { label: 'Pint (500ml)',        ml: 500 },
    { label: 'Large can (500ml)',   ml: 500 },
    { label: 'Bottle (750ml)',      ml: 750 },
  ],
  Wine: [
    { label: 'Small glass (100ml)', ml: 100 },
    { label: 'Standard (150ml)',    ml: 150 },
    { label: 'Large glass (250ml)', ml: 250 },
    { label: 'Half bottle (375ml)', ml: 375 },
    { label: 'Full bottle (750ml)', ml: 750 },
  ],
  Spirits: [
    { label: 'Single (25ml)',       ml: 25  },
    { label: 'Standard (35ml)',     ml: 35  },
    { label: 'Double (50ml)',       ml: 50  },
    { label: 'Large (70ml)',        ml: 70  },
  ],
  Mixed: [
    { label: 'Small (150ml)',       ml: 150 },
    { label: 'Standard (200ml)',    ml: 200 },
    { label: 'Can (250ml)',         ml: 250 },
    { label: 'Can (330ml)',         ml: 330 },
    { label: 'Bottle (275ml)',      ml: 275 },
    { label: 'Large (500ml)',       ml: 500 },
  ],
  Custom: [
    { label: 'Custom',              ml: 250 },
  ],
}

// ─── Core BAC simulation ──────────────────────────────────────────

const ZERO_ORDER_THRESHOLD = 0.01

export function simulateBAC({
  drinks,
  weightKg,
  sex,
  betaRate = BETA_MEAN,
  tEnd     = 24,
  nSteps   = 2000,
}) {
  const r  = WIDMARK_R[sex]
  const Vd = weightKg * r

  const sortedDrinks = [...drinks].sort((a, b) => a.timeh - b.timeh)
  const n            = sortedDrinks.length

  let BAC              = 0
  let absorptionAmounts = new Array(n).fill(0)

  const dt  = tEnd / nSteps
  const pts = [{ t: 0, bac: 0 }]

  for (let step = 0; step < nSteps; step++) {
    const t     = step * dt
    const tNext = t + dt

    for (let i = 0; i < n; i++) {
      if (sortedDrinks[i].timeh >= t && sortedDrinks[i].timeh < tNext) {
        absorptionAmounts[i] += sortedDrinks[i].ethanolG
      }
    }

    const f = (bac, amounts) => {
      let absorptionRate = 0
      for (let i = 0; i < n; i++) {
        absorptionRate += sortedDrinks[i].ka * amounts[i] / Vd
      }
      const eliminationRate = bac > ZERO_ORDER_THRESHOLD
        ? betaRate
        : betaRate * (bac / ZERO_ORDER_THRESHOLD)
      const dBAC    = absorptionRate - eliminationRate
      const dAmounts = amounts.map((a, i) => -sortedDrinks[i].ka * a)
      return { dBAC, dAmounts }
    }

    const { dBAC: k1BAC, dAmounts: k1A } = f(BAC, absorptionAmounts)
    const { dBAC: k2BAC, dAmounts: k2A } = f(
      BAC + dt/2 * k1BAC,
      absorptionAmounts.map((a, i) => Math.max(0, a + dt/2 * k1A[i]))
    )
    const { dBAC: k3BAC, dAmounts: k3A } = f(
      BAC + dt/2 * k2BAC,
      absorptionAmounts.map((a, i) => Math.max(0, a + dt/2 * k2A[i]))
    )
    const { dBAC: k4BAC, dAmounts: k4A } = f(
      BAC + dt * k3BAC,
      absorptionAmounts.map((a, i) => Math.max(0, a + dt * k3A[i]))
    )

    BAC = Math.max(0, BAC + dt/6 * (k1BAC + 2*k2BAC + 2*k3BAC + k4BAC))
    absorptionAmounts = absorptionAmounts.map((a, i) =>
      Math.max(0, a + dt/6 * (k1A[i] + 2*k2A[i] + 2*k3A[i] + k4A[i]))
    )

    pts.push({ t: tNext, bac: +BAC.toFixed(4) })
  }

  return pts
}

// ─── Metrics ──────────────────────────────────────────────────────

export function calcBACMetrics(pts, drivingLimit) {
  if (!pts.length) return null

  const maxBac  = Math.max(...pts.map(p => p.bac))
  const peakPt  = pts.find(p => p.bac === maxBac)
  const peakIdx = pts.indexOf(peakPt)

  // Sober time — first point after peak where BAC stays at 0
  let soberTime = null
  for (let i = peakIdx; i < pts.length; i++) {
    if (pts[i].bac <= 0.001) {
      soberTime = pts[i].t
      break
    }
  }

  // Safe to drive — find the LAST time BAC crosses above the limit
  // then find when it finally drops below and stays below
  let safeToDriveTime = null
  if (drivingLimit != null && drivingLimit >= 0) {
    // If peak never reaches the limit, safe immediately
    if (maxBac <= drivingLimit) {
      safeToDriveTime = 0
    } else {
      // Find the last index where BAC is above the limit in terminal phase
      // Search backwards from end to find last crossing
      let lastAboveIdx = -1
      for (let i = pts.length - 1; i >= peakIdx; i--) {
        if (pts[i].bac > drivingLimit) {
          lastAboveIdx = i
          break
        }
      }
      if (lastAboveIdx >= 0 && lastAboveIdx < pts.length - 1) {
        // Interpolate between lastAboveIdx and lastAboveIdx+1
        const p0   = pts[lastAboveIdx]
        const p1   = pts[lastAboveIdx + 1]
        if (p1.bac < p0.bac) {
          // Normal declining case
          const frac = (p0.bac - drivingLimit) / (p0.bac - p1.bac)
          safeToDriveTime = p0.t + frac * (p1.t - p0.t)
        } else {
          safeToDriveTime = p1.t
        }
      }
    }
  }

  const last20pct   = pts.slice(Math.floor(pts.length * 0.8))
  const bacRange    = Math.max(...last20pct.map(p => p.bac)) - Math.min(...last20pct.map(p => p.bac))
  const steadyState = bacRange < 0.05 && maxBac > 0.1

  return {
    peakBAC:         +maxBac.toFixed(3),
    peakTime:        +(peakPt?.t ?? 0).toFixed(2),
    soberTime:       soberTime        != null ? +soberTime.toFixed(2)        : null,
    safeToDriveTime: safeToDriveTime  != null ? +safeToDriveTime.toFixed(2)  : null,
    steadyState,
  }
}

export function formatHours(h) {
  if (h == null) return '—'
  const hours = Math.floor(h)
  const mins  = Math.round((h - hours) * 60)
  return `${hours}h ${mins.toString().padStart(2, '0')}m`
}

export function calcWidmarkPeak(ethanolGrams, weightKg, sex) {
  const r = WIDMARK_R[sex]
  return ethanolGrams / (weightKg * r)
}


// ─── MDMA Pharmacokinetics ────────────────────────────────────────
// Sources: de la Torre et al (2000), Kolbrich et al (2008),
//          Frye et al (2011), Pizarro et al (2004)
// All parameters are population means — individual variation is large

export const MDMA_PK = {
  ka:   0.8,    // absorption rate constant (h⁻¹)
  F:    0.75,   // oral bioavailability
  Vd:   500,    // volume of distribution (L) — ~7 L/kg for 70kg person
  CL:   40,     // clearance (L/h)
  thalf: 8.5,   // mean elimination half-life (h)
  tmax:  2.0,   // typical Tmax (h)
}

// Plasma concentration zones (ng/mL)
export const MDMA_ZONES = [
  { min: 0,   max: 50,  label: 'Sub-threshold',         color: '#22c55e', alpha: 0.06 },
  { min: 50,  max: 100, label: 'Threshold / mild',       color: '#84cc16', alpha: 0.08 },
  { min: 100, max: 200, label: 'Active effects',         color: '#f59e0b', alpha: 0.10 },
  { min: 200, max: 350, label: 'Strong effects',         color: '#f97316', alpha: 0.12 },
  { min: 350, max: 500, label: 'Very strong — caution',  color: '#ef4444', alpha: 0.15 },
  { min: 500, max: 800, label: 'Dangerous territory',    color: '#dc2626', alpha: 0.18 },
  { min: 800, max: 99999, label: '⚠ Potentially fatal', color: '#7f1d1d', alpha: 0.22 },
]

// Dangerous combinations
export const MDMA_INTERACTIONS = [
  {
    substance: 'MAOIs (moclobemide, phenelzine, etc.)',
    severity:  'LETHAL',
    color:     '#7f1d1d',
    mechanism: 'Prevents serotonin breakdown — can cause fatal serotonin syndrome within minutes. Never combine under any circumstances.',
  },
  {
    substance: 'SSRIs / SNRIs (fluoxetine, venlafaxine, etc.)',
    severity:  'SEVERE',
    color:     '#dc2626',
    mechanism: 'Serotonin syndrome risk. SSRIs also reduce MDMA effects by competing at the serotonin transporter — leading people to dangerously redose.',
  },
  {
    substance: 'Lithium',
    severity:  'SEVERE',
    color:     '#dc2626',
    mechanism: 'High risk of seizures. Absolutely avoid.',
  },
  {
    substance: 'Tramadol',
    severity:  'SEVERE',
    color:     '#dc2626',
    mechanism: 'Tramadol inhibits serotonin and norepinephrine reuptake and significantly lowers seizure threshold. Combined with MDMA this creates serotonin syndrome risk and seizure risk. Sometimes prescribed for pain — if you or someone around you takes tramadol, do not combine with MDMA.',
  },
  {
    substance: 'Cocaine / Amphetamines',
    severity:  'HIGH',
    color:     '#ef4444',
    mechanism: 'Combined cardiovascular strain. Dangerous hyperthermia and heart rate elevation. Risk of cardiac events.',
  },
  {
    substance: 'Alcohol',
    severity:  'MODERATE',
    color:     '#f97316',
    mechanism: 'Both cause dehydration. Alcohol masks MDMA effects and vice versa, leading to overconsumption of both. Increased neurotoxicity risk.',
  },
  {
    substance: 'Cannabis',
    severity:  'LOW–MODERATE',
    color:     '#f59e0b',
    mechanism: 'Can intensify anxiety and paranoia significantly. May worsen comedown. Individual variation is large.',
  },
]

// Simulate MDMA plasma concentration curve
// Uses 1-compartment oral model with optional redose
export function simulateMDMA({
  doses,          // array of { timeh, doseMg } — first dose always at timeh=0
  weightKg,
  tEnd = 48,
  nSteps = 2000,
}) {
  const { ka, F, Vd, CL } = MDMA_PK
  const ke      = CL / Vd
  const VdScaled = (weightKg / 70) * Vd
  const VdL     = VdScaled

  const sortedDoses = [...doses].sort((a, b) => a.timeh - b.timeh)
  const n = sortedDoses.length

  let absorptionAmounts = new Array(n).fill(0)
  let C = 0

  const dt  = tEnd / nSteps
  const pts = [{ t: 0, c: 0 }]

  for (let step = 0; step < nSteps; step++) {
    const t     = step * dt
    const tNext = t + dt

    for (let i = 0; i < n; i++) {
      if (sortedDoses[i].timeh >= t && sortedDoses[i].timeh < tNext) {
        absorptionAmounts[i] += sortedDoses[i].doseMg * F
      }
    }

    const f = (c, amounts) => {
      let absRate = 0
      for (let i = 0; i < n; i++) {
        absRate += (ka * amounts[i] * 1000) / VdL
      }
      const elimRate = ke * c
      return {
        dC:       absRate - elimRate,
        dAmounts: amounts.map(a => -ka * a),
      }
    }

    const { dC: k1C, dAmounts: k1A } = f(C, absorptionAmounts)
    const { dC: k2C, dAmounts: k2A } = f(
      C + dt/2 * k1C,
      absorptionAmounts.map((a, i) => Math.max(0, a + dt/2 * k1A[i]))
    )
    const { dC: k3C, dAmounts: k3A } = f(
      C + dt/2 * k2C,
      absorptionAmounts.map((a, i) => Math.max(0, a + dt/2 * k2A[i]))
    )
    const { dC: k4C, dAmounts: k4A } = f(
      C + dt * k3C,
      absorptionAmounts.map((a, i) => Math.max(0, a + dt * k3A[i]))
    )

    C = Math.max(0, C + dt/6 * (k1C + 2*k2C + 2*k3C + k4C))
    absorptionAmounts = absorptionAmounts.map((a, i) =>
      Math.max(0, a + dt/6 * (k1A[i] + 2*k2A[i] + 2*k3A[i] + k4A[i]))
    )

    pts.push({ t: tNext, c: +C.toFixed(2) })
  }

  return pts
}

export function calcMDMAMetrics(pts) {
  if (!pts.length) return null
  const cmax    = Math.max(...pts.map(p => p.c))
  const cmaxPt  = pts.find(p => p.c === cmax)
  const cmaxIdx = pts.indexOf(cmaxPt)

  // Time to drop below 50 ng/mL (sub-threshold)
  let clearTime = null
  for (let i = cmaxIdx; i < pts.length; i++) {
    if (pts[i].c < 50) { clearTime = pts[i].t; break }
  }

  // Time to drop below 10 ng/mL (essentially clear)
  let fullClearTime = null
  for (let i = cmaxIdx; i < pts.length; i++) {
    if (pts[i].c < 10) { fullClearTime = pts[i].t; break }
  }

  const peakZone = MDMA_ZONES.slice().reverse().find(z => cmax >= z.min)

  return {
    cmax:          +cmax.toFixed(1),
    tmax:          +(cmaxPt?.t ?? 0).toFixed(2),
    clearTime:     clearTime     != null ? +clearTime.toFixed(2)     : null,
    fullClearTime: fullClearTime != null ? +fullClearTime.toFixed(2) : null,
    peakZone,
  }
}