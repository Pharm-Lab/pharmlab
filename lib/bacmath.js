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


// ─── Cannabis Pharmacokinetics ────────────────────────────────────
// Sources: Huestis et al (1992, 2007), Grotenhermen (2003),
//          Newmeyer et al (2016), Spindle et al (2020)
// Note: Cannabis PK is among the most variable of any drug due to
// lipophilicity, tolerance, inhalation technique, and formulation.
// All values are population means with wide individual ranges.

export const CANNABIS_PK = {
  smoked: {
    ka:           30.0,   // very fast absorption (h⁻¹) — peak in minutes
    F:            0.25,   // mean bioavailability 10-35%, use 25%
    Vd:           350,    // L — highly lipophilic, large Vd
    ke:           0.08,   // h⁻¹ — terminal elimination (t½ ~8-9h for plasma THC)
    tmax:         0.15,   // ~10 min
    thalf:        8.7,
  },
  oral: {
    ka:           0.7,    // slow absorption through GI tract (h⁻¹)
    F:            0.10,   // mean bioavailability 4-20%, use 10% (extensive first-pass)
    Vd:           350,    // L
    ke:           0.025,  // h⁻¹ — much slower elimination (t½ ~28h for oral)
    tmax:         2.0,    // 1-3h typical
    thalf:        27.7,   // longer due to 11-OH-THC active metabolite
    // Food increases bioavailability ~2-3x for oral
    F_with_food:  0.25,
  },
}

// THC effect zones (ng/mL plasma)
export const CANNABIS_ZONES = [
  { min: 0,   max: 1,   label: 'Sub-threshold',          color: '#22c55e', alpha: 0.06 },
  { min: 1,   max: 5,   label: 'Mild effects',            color: '#84cc16', alpha: 0.08 },
  { min: 5,   max: 15,  label: 'Moderate effects',        color: '#f59e0b', alpha: 0.10 },
  { min: 15,  max: 30,  label: 'Strong effects',          color: '#f97316', alpha: 0.12 },
  { min: 30,  max: 50,  label: 'Very strong',             color: '#ef4444', alpha: 0.15 },
  { min: 50,  max: 9999,label: '⚠ Overwhelming — high anxiety/paranoia risk', color: '#7f1d1d', alpha: 0.20 },
]

// Legal driving limits for THC (blood ng/mL)
// Note: these are blood limits; plasma THC ~2x blood THC
export const CANNABIS_DRIVING_LIMITS = {
  NL: { limit: 3.0,  note: '3 ng/mL blood THC. Raised from 0 in 2017. Regular users may exceed this without acute impairment — tolerance is not a legal defence.' },
  DE: { limit: 1.0,  note: '1 ng/mL blood THC (raised from 0 in 2024 under cannabis legalisation). Zero tolerance for under-21s.' },
  BE: { limit: 1.0,  note: '1 ng/mL blood THC.' },
  FR: { limit: 0,    note: 'Zero tolerance — any detectable THC is an offence. Criminal penalties apply.' },
}

// Dangerous combinations
export const CANNABIS_INTERACTIONS = [
  {
    substance: 'Alcohol',
    severity:  'HIGH',
    color:     '#ef4444',
    mechanism: 'The most common dangerous combination. Alcohol increases THC absorption and the combination produces multiplicative — not additive — impairment. Driving ability is severely compromised at doses of each that seem manageable alone. Strong nausea and vomiting risk ("greening out").',
  },
  {
    substance: 'Other CNS depressants (opioids, GHB)',
    severity:  'HIGH',
    color:     '#ef4444',
    mechanism: 'Additive CNS and respiratory depression. GHB combination is particularly unpredictable with a narrow therapeutic window. Opioid combination increases sedation and respiratory risk.',
  },
  {
    substance: 'Benzodiazepines / Z-drugs',
    severity:  'MODERATE–HIGH',
    color:     '#f97316',
    mechanism: 'Both are CNS depressants. Combined sedation can be excessive. Respiratory depression risk increases, particularly at high doses of either. Benzodiazepines are sometimes used to treat cannabis-induced anxiety — but recreational combination is risky.',
  },
  {
    substance: 'Psychedelics (LSD, psilocybin)',
    severity:  'MODERATE',
    color:     '#f59e0b',
    mechanism: 'Cannabis strongly intensifies psychedelic effects. Can cause overwhelming experiences, loss of control, and paranoia in people who thought they knew their psychedelic dose. Many difficult psychedelic experiences are cannabis-triggered.',
  },
  {
    substance: 'Stimulants (cocaine, amphetamines, MDMA)',
    severity:  'MODERATE',
    color:     '#f59e0b',
    mechanism: 'Cardiovascular strain from stimulant combined with cannabis-induced tachycardia. Anxiety and paranoia significantly amplified. Heart rate elevation can be concerning in people with underlying conditions.',
  },
  {
    substance: 'Antipsychotics',
    severity:  'MODERATE',
    color:     '#f59e0b',
    mechanism: 'Cannabis is strongly contraindicated if you have or are at risk of psychosis. For people taking antipsychotics, cannabis can destabilise symptom control. Cannabis use is associated with triggering first psychotic episodes in genetically vulnerable individuals.',
  },
]

// Simulate THC plasma concentration
export function simulateCannabis({
  doses,        // [{timeh, thcMg, route}] route: 'smoked' | 'oral'
  weightKg,
  withFood = false,  // affects oral bioavailability
  tEnd = 24,
  nSteps = 2000,
}) {
  const sortedDoses = [...doses].sort((a, b) => a.timeh - b.timeh)
  const n = sortedDoses.length

  // Build per-dose PK params
  const dosePK = sortedDoses.map(d => {
    const pk = CANNABIS_PK[d.route]
    const F  = d.route === 'oral' && withFood ? pk.F_with_food : pk.F
    const Vd = (weightKg / 70) * pk.Vd
    return { ...pk, F, Vd, ke: pk.ke }
  })

  let absorptionAmounts = new Array(n).fill(0)
  let C = 0

  const dt  = tEnd / nSteps
  const pts = [{ t: 0, c: 0 }]

  for (let step = 0; step < nSteps; step++) {
    const t     = step * dt
    const tNext = t + dt

    for (let i = 0; i < n; i++) {
      if (sortedDoses[i].timeh >= t && sortedDoses[i].timeh < tNext) {
        absorptionAmounts[i] += sortedDoses[i].thcMg * dosePK[i].F * 1000
        // Convert mg THC → ng using Vd in L: C = amount_ng / Vd_L
        // Store as ng in absorption compartment
      }
    }

    const f = (c, amounts) => {
      let absRate = 0
      for (let i = 0; i < n; i++) {
        // Rate: ka * amount_ng / Vd_L = ng/mL/h
        absRate += (dosePK[i].ka * amounts[i]) / dosePK[i].Vd
      }
      const elimRate = dosePK[0].ke * c  // use mean ke
      return {
        dC:       absRate - elimRate,
        dAmounts: amounts.map((a, i) => -dosePK[i].ka * a),
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

    pts.push({ t: tNext, c: +C.toFixed(3) })
  }

  return pts
}

export function calcCannabisMetrics(pts, drivingLimitBlood) {
  if (!pts.length) return null
  const cmax    = Math.max(...pts.map(p => p.c))
  const cmaxPt  = pts.find(p => p.c === cmax)
  const cmaxIdx = pts.indexOf(cmaxPt)

  // Convert plasma limit to blood (plasma ~2x blood)
  const plasmaLimit = drivingLimitBlood != null ? drivingLimitBlood * 2 : null

  let safeToDriveTime = null
  if (plasmaLimit != null && plasmaLimit >= 0) {
    if (cmax <= plasmaLimit) {
      safeToDriveTime = 0
    } else {
      let lastAboveIdx = -1
      for (let i = pts.length - 1; i >= cmaxIdx; i--) {
        if (pts[i].c > plasmaLimit) { lastAboveIdx = i; break }
      }
      if (lastAboveIdx >= 0 && lastAboveIdx < pts.length - 1) {
        const p0   = pts[lastAboveIdx]
        const p1   = pts[lastAboveIdx + 1]
        if (p1.c < p0.c) {
          const frac = (p0.c - plasmaLimit) / (p0.c - p1.c)
          safeToDriveTime = p0.t + frac * (p1.t - p0.t)
        } else {
          safeToDriveTime = p1.t
        }
      }
    }
  }

  let subThresholdTime = null
  for (let i = cmaxIdx; i < pts.length; i++) {
    if (pts[i].c < 1) { subThresholdTime = pts[i].t; break }
  }

  const peakZone = CANNABIS_ZONES.slice().reverse().find(z => cmax >= z.min)

  return {
    cmax:             +cmax.toFixed(2),
    tmax:             +(cmaxPt?.t ?? 0).toFixed(2),
    safeToDriveTime:  safeToDriveTime  != null ? +safeToDriveTime.toFixed(2)  : null,
    subThresholdTime: subThresholdTime != null ? +subThresholdTime.toFixed(2) : null,
    peakZone,
  }
}


// ─── Cocaine Pharmacokinetics ─────────────────────────────────────
// Sources: Wilkinson et al (1980), Jeffcoat et al (1989),
//          Cone (1995), Kolbrich et al (2006),
//          Jufer et al (2000) — intranasal route
// Note: Cocaine PK is highly variable depending on dose, route,
// tolerance, cutting agents, and individual metabolism.

export const COCAINE_PK = {
  intranasal: {
    ka:    2.5,    // h⁻¹ — absorption through nasal mucosa, Tmax ~20-30 min
    F:     0.60,   // ~60% bioavailability intranasal
    Vd:    2.0,    // L/kg — moderate distribution
    ke:    0.55,   // h⁻¹ — t½ ~1.25h
    thalf: 1.26,
    tmax:  0.42,   // ~25 min
  },
}

// Cardiovascular risk zones (ng/mL plasma cocaine)
export const COCAINE_ZONES = [
  { min: 0,   max: 100,  label: 'Low acute CV risk',        color: '#22c55e', alpha: 0.06 },
  { min: 100, max: 300,  label: 'Moderate — HR/BP elevated', color: '#f59e0b', alpha: 0.10 },
  { min: 300, max: 600,  label: 'High cardiac strain',       color: '#ef4444', alpha: 0.14 },
  { min: 600, max: 99999,label: '⚠ Severe — arrhythmia/MI risk', color: '#7f1d1d', alpha: 0.20 },
]

export const COCAINE_INTERACTIONS = [
  {
    substance: 'Alcohol → Cocaethylene',
    severity:  'LETHAL RISK',
    color:     '#7f1d1d',
    mechanism: 'When cocaine and alcohol are present simultaneously, the liver produces cocaethylene — an active metabolite that is more cardiotoxic than cocaine itself, has a half-life of ~5 hours (4× longer than cocaine), and is associated with sudden death. This is the most dangerous common drug combination by sudden cardiac death statistics. The combination feels more intense, which drives further use.',
  },
  {
    substance: 'MDMA / amphetamines',
    severity:  'SEVERE',
    color:     '#dc2626',
    mechanism: 'Extreme combined cardiovascular strain. Both drugs elevate heart rate and blood pressure through different mechanisms — the combination is not additive but multiplicative in cardiac load. Hyperthermia risk is substantially increased.',
  },
  {
    substance: 'Other stimulants (caffeine at high dose, pseudo/ephedrine)',
    severity:  'MODERATE',
    color:     '#f97316',
    mechanism: 'Additive cardiovascular stimulation. Caffeine is the most common cutting agent in cocaine — meaning the combination is unavoidable unless you test your substance.',
  },
  {
    substance: 'Cannabis',
    severity:  'LOW–MODERATE',
    color:     '#f59e0b',
    mechanism: 'Cannabis can mask cocaine-induced anxiety, leading to higher cocaine use than intended. Cardiovascular effects are additive. Combined impairment affects judgement about further use.',
  },
  {
    substance: 'Levamisole (common adulterant)',
    severity:  'CHRONIC RISK',
    color:     '#f97316',
    mechanism: 'Levamisole is a veterinary antiparasitic found in the majority of European cocaine samples. With repeated exposure it causes agranulocytosis — dangerous immune suppression. Acute use carries low risk but chronic use with contaminated cocaine is associated with serious infections. Always test your substance.',
  },
]

export function simulateCocaine({
  doses,      // [{timeh, doseMg}]
  weightKg,
  tEnd = 12,
  nSteps = 2000,
}) {
  const { ka, F, Vd: VdPerKg, ke } = COCAINE_PK.intranasal
  const VdL = VdPerKg * weightKg

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
        // Store absorbed amount in ng
        absorptionAmounts[i] += sortedDoses[i].doseMg * F * 1000
      }
    }

    const f = (c, amounts) => {
      let absRate = 0
      for (let i = 0; i < n; i++) {
        absRate += (ka * amounts[i]) / VdL
      }
      return {
        dC:       absRate - ke * c,
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

export function calcCocaineMetrics(pts) {
  if (!pts.length) return null
  const cmax    = Math.max(...pts.map(p => p.c))
  const cmaxPt  = pts.find(p => p.c === cmax)
  const cmaxIdx = pts.indexOf(cmaxPt)

  let clearTime = null
  for (let i = cmaxIdx; i < pts.length; i++) {
    if (pts[i].c < 10) { clearTime = pts[i].t; break }
  }

  const peakZone = COCAINE_ZONES.slice().reverse().find(z => cmax >= z.min)

  // Estimate number of doses that would maintain >100ng/mL continuously
  // (illustrates binge pattern)
  const timeAbove100 = pts.filter(p => p.c > 100).length / pts.length * pts[pts.length-1].t

  return {
    cmax,
    tmax:         +(cmaxPt?.t ?? 0).toFixed(2),
    clearTime:    clearTime != null ? +clearTime.toFixed(2) : null,
    peakZone,
    timeAbove100: +timeAbove100.toFixed(1),
  }
}


// ─── Amphetamine / Methamphetamine Pharmacokinetics ───────────────
// Sources: Cruickshank & Dyer (2009), Schepers et al (2003),
//          Shappell et al (1996), Harris et al (2003),
//          de la Torre et al (2004)

export const AMPHETAMINE_PK = {
  amphetamine: {
    name:  'Amphetamine (speed)',
    ka:    0.9,    // h⁻¹ — Tmax ~2h oral
    F:     0.75,
    Vd:    3.5,    // L/kg
    ke:    0.063,  // h⁻¹ — t½ ~11h
    thalf: 11.0,
    color: '#f97316',
  },
  methamphetamine: {
    name:  'Methamphetamine',
    ka:    0.8,    // h⁻¹ — Tmax ~2.5h
    F:     0.67,
    Vd:    3.7,    // L/kg
    ke:    0.070,  // h⁻¹ — t½ ~10h
    thalf: 9.9,
    color: '#dc2626',
  },
}

// Effect / risk zones (ng/mL plasma)
// Scaled separately per compound due to potency difference
export const AMPHETAMINE_ZONES = {
  amphetamine: [
    { min: 0,    max: 20,   label: 'Sub-threshold',               color: '#22c55e', alpha: 0.06 },
    { min: 20,   max: 60,   label: 'Mild stimulant effects',       color: '#84cc16', alpha: 0.08 },
    { min: 60,   max: 150,  label: 'Active effects',               color: '#f59e0b', alpha: 0.10 },
    { min: 150,  max: 300,  label: 'Strong — CV strain begins',    color: '#f97316', alpha: 0.13 },
    { min: 300,  max: 600,  label: 'High CV risk / hyperthermia',  color: '#ef4444', alpha: 0.16 },
    { min: 600,  max: 99999,label: '⚠ Severe toxicity risk',       color: '#7f1d1d', alpha: 0.20 },
  ],
  methamphetamine: [
    { min: 0,    max: 10,   label: 'Sub-threshold',               color: '#22c55e', alpha: 0.06 },
    { min: 10,   max: 30,   label: 'Mild effects',                 color: '#84cc16', alpha: 0.08 },
    { min: 30,   max: 80,   label: 'Active effects',               color: '#f59e0b', alpha: 0.10 },
    { min: 80,   max: 200,  label: 'Strong — significant CV risk', color: '#f97316', alpha: 0.13 },
    { min: 200,  max: 400,  label: 'High toxicity risk',           color: '#ef4444', alpha: 0.16 },
    { min: 400,  max: 99999,label: '⚠ Severe — medical emergency', color: '#7f1d1d', alpha: 0.20 },
  ],
}

export const AMPHETAMINE_INTERACTIONS = [
  {
    substance: 'MAOIs',
    severity:  'LETHAL',
    color:     '#7f1d1d',
    mechanism: 'Hypertensive crisis and serotonin syndrome. Amphetamines cause massive monoamine release — MAOIs prevent their breakdown. Can be fatal within minutes. Never combine under any circumstances. Includes some antidepressants and linezolid.',
  },
  {
    substance: 'Other stimulants (cocaine, MDMA, caffeine at high dose)',
    severity:  'SEVERE',
    color:     '#dc2626',
    mechanism: 'Additive and potentially synergistic cardiovascular strain. Combined tachycardia, hypertension, and hyperthermia. Substantially increases risk of cardiac events and stroke.',
  },
  {
    substance: 'Lithium',
    severity:  'SEVERE',
    color:     '#dc2626',
    mechanism: 'Unpredictable interaction. Lithium can reduce stimulant effects (leading to dose escalation) but also increases serotonergic effects. Serious toxicity risk.',
  },
  {
    substance: 'Alcohol',
    severity:  'MODERATE–HIGH',
    color:     '#f97316',
    mechanism: 'Amphetamine masks alcohol intoxication — people drink far more than they realise. The stimulant effect wears off before the alcohol does, causing sudden severe intoxication. Cardiovascular strain from both substances.',
  },
  {
    substance: 'Cannabis',
    severity:  'MODERATE',
    color:     '#f59e0b',
    mechanism: 'Increased anxiety and paranoia. Cannabis used to "take the edge off" stimulant effects can unpredictably amplify anxiety instead. Cardiovascular effects additive.',
  },
  {
    substance: 'Acidifying agents (vitamin C / ascorbic acid)',
    severity:  'INTERACTION — USEFUL',
    color:     '#3b82f6',
    mechanism: 'Acidic urine significantly speeds amphetamine elimination. Vitamin C supplementation is used as a harm reduction strategy to reduce duration and help comedown. Toggle the "Vitamin C" option to see the effect modelled.',
  },
]

export function simulateAmphetamine({
  doses,        // [{timeh, doseMg}]
  weightKg,
  compound = 'amphetamine',
  acidicUrine = false,
  tEnd = 48,
  nSteps = 2000,
}) {
  const pk  = AMPHETAMINE_PK[compound]
  const VdL = pk.Vd * weightKg

  // Acidic urine increases elimination rate by ~50% for amphetamine
  // Effect is less pronounced for methamphetamine (~20%)
  const keAdj = acidicUrine
    ? pk.ke * (compound === 'amphetamine' ? 1.5 : 1.2)
    : pk.ke

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
        absorptionAmounts[i] += sortedDoses[i].doseMg * pk.F * 1000
      }
    }

    const f = (c, amounts) => {
      let absRate = 0
      for (let i = 0; i < n; i++) {
        absRate += (pk.ka * amounts[i]) / VdL
      }
      return {
        dC:       absRate - keAdj * c,
        dAmounts: amounts.map(a => -pk.ka * a),
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

export function calcAmphetamineMetrics(pts, compound) {
  if (!pts.length) return null
  const zones   = AMPHETAMINE_ZONES[compound]
  const cmax    = Math.max(...pts.map(p => p.c))
  const cmaxPt  = pts.find(p => p.c === cmax)
  const cmaxIdx = pts.indexOf(cmaxPt)

  let clearTime = null
  for (let i = cmaxIdx; i < pts.length; i++) {
    if (pts[i].c < zones[0].max) { clearTime = pts[i].t; break }
  }

  // Time above active effects threshold
  const activeThreshold = zones[2].min
  const timeActive = pts.filter(p => p.c >= activeThreshold).length
    / pts.length * pts[pts.length-1].t

  const peakZone = zones.slice().reverse().find(z => cmax >= z.min)

  return {
    cmax:       +cmax.toFixed(1),
    tmax:       +(cmaxPt?.t ?? 0).toFixed(2),
    clearTime:  clearTime != null ? +clearTime.toFixed(2) : null,
    timeActive: +timeActive.toFixed(1),
    peakZone,
  }
}


// ─── Cathinone / Mephedrone Pharmacokinetics ──────────────────────
// Sources: Archer et al (2014), Dargan et al (2011),
//          Schifano et al (2011), EMCDDA (2010)
// WARNING: Human PK data for cathinones is extremely limited.
// Mephedrone has the most data but studies are small.
// 2-MMC, 3-MMC, NEP have essentially no published human PK data.
// All values should be treated as rough estimates only.

export const MEPHEDRONE_PK = {
  ka:    1.5,    // h⁻¹ — Tmax ~45 min oral, estimated
  F:     0.70,   // oral bioavailability, estimated
  Vd:    2.5,    // L/kg — estimated from limited data
  ke:    0.28,   // h⁻¹ — t½ ~2.5h (range 2–3h)
  thalf: 2.5,
  // Uncertainty bounds — wide due to limited data
  ke_low:  0.19, // t½ ~3.6h (upper bound of duration)
  ke_high: 0.46, // t½ ~1.5h (lower bound)
}

export const CATHINONE_MARKET_DATA = {
  percentage3MMC: 3,        // % of samples sold as 3-MMC that actually contain it (Trimbos 2025)
  percentage2MMC: 76,       // % of "3-MMC" samples containing 2-MMC (Trimbos 2025)
  percentageNEP:  5,        // % containing NEP (Trimbos 2025)
  year: 2025,
  source: 'Trimbos DIMS Jaarbericht 2025',
}

export const CATHINONE_COMPOUNDS = [
  {
    id:       'mephedrone',
    name:     '4-MMC (Mephedrone)',
    aka:      'meow meow, 4-methylmethcathinone',
    status:   'historical',
    pkQuality:'moderate',
    note:     'The original cathinone. Now rarely found in NL/DE market — mostly replaced by 2-MMC and 3-MMC (which themselves are rarely what they claim to be). Has the most human PK data of any cathinone.',
    halflife: '~2–3h',
    effects:  'Empathogenic (MDMA-like) + stimulant. Strong compulsion to redose.',
    risks:    'Cardiovascular strain, hyperthermia, neurotoxicity with repeated use, strong psychological dependence.',
  },
  {
    id:       '3mmc',
    name:     '3-MMC (3-methylmethcathinone)',
    aka:      'poes, miauw, 3M',
    status:   'common_label',
    pkQuality:'none',
    note:     'Almost never what it claims to be. Per Trimbos DIMS 2025, only 3% of samples sold as 3-MMC actually contain 3-MMC. You are almost certainly buying 2-MMC or NEP.',
    halflife: 'Unknown — no human PK data',
    effects:  'Similar to mephedrone — stimulant + mild empathogenic. Shorter duration than mephedrone claimed by users.',
    risks:    'Unknown long-term profile. Extremely high mislabelling rate. NEP contamination is a serious overdose risk.',
  },
  {
    id:       '2mmc',
    name:     '2-MMC (2-methylmethcathinone)',
    aka:      'the actual content of most "3-MMC"',
    status:   'common_actual',
    pkQuality:'none',
    note:     'Currently the most common substance found in samples sold as 3-MMC in the Netherlands (76% of "3-MMC" samples per Trimbos 2025). No published human PK data. Effects described as similar to 3-MMC but possibly more stimulant-dominant.',
    halflife: 'Unknown',
    effects:  'Stimulant, less empathogenic than 3-MMC per user reports. Strong redosing compulsion.',
    risks:    'Essentially unknown toxicology profile. Long-term effects unstudied. Cardiovascular and psychiatric risk assumed similar to other cathinones.',
  },
  {
    id:       'nep',
    name:     'NEP (N-Ethylpentedrone / N-Ethylnorpentedron)',
    aka:      'N-ethylnorpentedrone, α-PEP',
    status:   'dangerous_adulterant',
    pkQuality:'minimal',
    note:     'Increasingly found in samples sold as 3-MMC — 5% of "3-MMC" samples in NL (Trimbos 2025), actively warned about in Berlin (Sidekicks). Significantly more potent than 2-MMC or 3-MMC. Dosing based on 3-MMC experience leads to overdose.',
    halflife: '~3–4h (estimated, very limited data)',
    effects:  'Strong stimulant, longer duration than 3-MMC. More pronounced cardiovascular effects. Higher anxiety and paranoia risk.',
    risks:    'Overdose risk when mistaken for 3-MMC. Heart palpitations, severe anxiety, insomnia, psychotic symptoms at higher doses. High dependence potential.',
    warning:  true,
  },
]

export const CATHINONE_INTERACTIONS = [
  {
    substance: 'MAOIs',
    severity:  'LETHAL',
    color:     '#7f1d1d',
    mechanism: 'Same as amphetamines and MDMA — massive monoamine release combined with MAOI is potentially fatal. Never combine.',
  },
  {
    substance: 'MDMA',
    severity:  'SEVERE',
    color:     '#dc2626',
    mechanism: 'Both release serotonin. Combined serotonergic load substantially increases serotonin syndrome risk and neurotoxicity. Cardiovascular strain is additive to multiplicative.',
  },
  {
    substance: 'Other stimulants (cocaine, amphetamines)',
    severity:  'SEVERE',
    color:     '#dc2626',
    mechanism: 'Additive cardiovascular strain. Combined heart rate and blood pressure elevation. Hyperthermia risk substantially increased.',
  },
  {
    substance: 'Alcohol',
    severity:  'MODERATE–HIGH',
    color:     '#f97316',
    mechanism: 'Stimulant masks intoxication, leading to alcohol overconsumption. Dehydration risk. Cardiovascular strain from both substances.',
  },
  {
    substance: 'Benzodiazepines (to "come down")',
    severity:  'MODERATE',
    color:     '#f59e0b',
    mechanism: 'Commonly used to manage cathinone comedown. Risk of dependence on both substances. Respiratory depression if combined with alcohol or opioids. Not recommended but if used, avoid combining with other CNS depressants.',
  },
  {
    substance: 'Unknown cathinone (high risk given market)',
    severity:  'UNPREDICTABLE',
    color:     '#6b7280',
    mechanism: 'Given that 97% of "3-MMC" is not 3-MMC, any interaction calculation is meaningless without knowing your actual substance. Drug checking is not optional — it is the only way to have any idea what you are taking.',
  },
]

export function simulateMephedrone({
  doses,
  weightKg,
  tEnd = 24,
  nSteps = 2000,
}) {
  const { ka, F, Vd: VdPerKg, ke, ke_low, ke_high } = MEPHEDRONE_PK
  const VdL = VdPerKg * weightKg

  function runSim(keVal) {
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
          absorptionAmounts[i] += sortedDoses[i].doseMg * F * 1000
        }
      }

      const f = (c, amounts) => {
        let absRate = 0
        for (let i = 0; i < n; i++) {
          absRate += (ka * amounts[i]) / VdL
        }
        return {
          dC:       absRate - keVal * c,
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

  return {
    mean: runSim(ke),
    low:  runSim(ke_low),   // longer duration (slow eliminator)
    high: runSim(ke_high),  // shorter duration (fast eliminator)
  }
}

export function calcMephedroneMetrics(pts) {
  if (!pts.length) return null
  const cmax    = Math.max(...pts.map(p => p.c))
  const cmaxPt  = pts.find(p => p.c === cmax)
  const cmaxIdx = pts.indexOf(cmaxPt)

  let clearTime = null
  for (let i = cmaxIdx; i < pts.length; i++) {
    if (pts[i].c < 20) { clearTime = pts[i].t; break }
  }

  return {
    cmax:      +cmax.toFixed(1),
    tmax:      +(cmaxPt?.t ?? 0).toFixed(2),
    clearTime: clearTime != null ? +clearTime.toFixed(2) : null,
  }
}