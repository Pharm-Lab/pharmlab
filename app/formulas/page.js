'use client'
import { useState, useMemo } from 'react'

// ─── Data ─────────────────────────────────────────────────────────

const PK_FORMULAS = [
  // ── Core PK parameters ──
  {
    id: 'ke',
    category: 'Core parameters',
    name: 'Elimination rate constant',
    symbol: 'kₑ',
    formula: 'kₑ = CL / Vd',
    units: 'h⁻¹',
    variables: [
      { sym: 'CL', desc: 'Total clearance (L/h)' },
      { sym: 'Vd', desc: 'Volume of distribution (L)' },
    ],
    notes: 'First-order rate constant describing drug elimination. Larger kₑ = faster elimination.',
    tags: ['clearance', 'elimination', 'rate constant'],
  },
  {
    id: 'thalf',
    category: 'Core parameters',
    name: 'Half-life',
    symbol: 't½',
    formula: 't½ = ln(2) / kₑ = 0.693 / kₑ',
    units: 'h',
    variables: [
      { sym: 'kₑ', desc: 'Elimination rate constant (h⁻¹)' },
    ],
    notes: 'Time for plasma concentration to decrease by 50%. Independent of dose and initial concentration for first-order kinetics. ~5 × t½ to reach steady state.',
    tags: ['half-life', 'elimination', 'steady state'],
  },
  {
    id: 'cl_vd',
    category: 'Core parameters',
    name: 'Clearance from Vd and ke',
    symbol: 'CL',
    formula: 'CL = kₑ × Vd',
    units: 'L/h',
    variables: [
      { sym: 'kₑ', desc: 'Elimination rate constant (h⁻¹)' },
      { sym: 'Vd', desc: 'Volume of distribution (L)' },
    ],
    notes: 'CL is the volume of plasma cleared of drug per unit time. It determines steady-state concentration.',
    tags: ['clearance', 'volume of distribution'],
  },
  {
    id: 'vd',
    category: 'Core parameters',
    name: 'Volume of distribution',
    symbol: 'Vd',
    formula: 'Vd = Dose / C₀',
    units: 'L',
    variables: [
      { sym: 'Dose', desc: 'IV bolus dose (mg)' },
      { sym: 'C₀', desc: 'Initial plasma concentration at t=0 (mg/L)' },
    ],
    notes: 'Apparent volume relating dose to plasma concentration. Not a real anatomical volume. Vd > plasma volume indicates tissue distribution. High Vd = lipophilic drug.',
    tags: ['volume of distribution', 'distribution'],
  },

  // ── Concentration equations ──
  {
    id: 'iv_bolus',
    category: 'Concentration equations',
    name: 'IV bolus — 1 compartment',
    symbol: 'C(t)',
    formula: 'C(t) = (D / Vd) × e^(−kₑt)',
    units: 'mg/L',
    variables: [
      { sym: 'D', desc: 'Dose (mg)' },
      { sym: 'Vd', desc: 'Volume of distribution (L)' },
      { sym: 'kₑ', desc: 'Elimination rate constant (h⁻¹)' },
      { sym: 't', desc: 'Time (h)' },
    ],
    notes: 'Simple monoexponential decline. Linear on semi-log scale (log C vs t gives a straight line with slope −kₑ).',
    tags: ['IV bolus', '1-compartment', 'concentration', 'monoexponential'],
  },
  {
    id: 'oral_1comp',
    category: 'Concentration equations',
    name: 'Oral — 1 compartment',
    symbol: 'C(t)',
    formula: 'C(t) = (F·D·kₐ) / (Vd·(kₐ−kₑ)) × (e^(−kₑt) − e^(−kₐt))',
    units: 'mg/L',
    variables: [
      { sym: 'F', desc: 'Bioavailability (0–1)' },
      { sym: 'D', desc: 'Dose (mg)' },
      { sym: 'kₐ', desc: 'Absorption rate constant (h⁻¹)' },
      { sym: 'kₑ', desc: 'Elimination rate constant (h⁻¹)' },
      { sym: 'Vd', desc: 'Volume of distribution (L)' },
    ],
    notes: 'Bateman equation. Shows characteristic rise-and-fall. Requires kₐ ≠ kₑ. Flip-flop kinetics occur when kₑ > kₐ.',
    tags: ['oral', '1-compartment', 'Bateman equation', 'absorption'],
  },
  {
    id: 'iv_infusion',
    category: 'Concentration equations',
    name: 'IV infusion — during infusion',
    symbol: 'C(t)',
    formula: 'C(t) = (R₀/CL) × (1 − e^(−kₑt))',
    units: 'mg/L',
    variables: [
      { sym: 'R₀', desc: 'Infusion rate (mg/h)' },
      { sym: 'CL', desc: 'Clearance (L/h)' },
      { sym: 'kₑ', desc: 'Elimination rate constant (h⁻¹)' },
      { sym: 't', desc: 'Time from start of infusion (h)' },
    ],
    notes: 'Concentration rises toward Css = R₀/CL. At t = Tinf, infusion stops and drug declines monoexponentially.',
    tags: ['IV infusion', 'steady state', 'concentration'],
  },
  {
    id: '2comp_iv',
    category: 'Concentration equations',
    name: 'IV bolus — 2 compartment (biexponential)',
    symbol: 'C(t)',
    formula: 'C(t) = A·e^(−αt) + B·e^(−βt)',
    units: 'mg/L',
    variables: [
      { sym: 'A, B', desc: 'Coefficients (intercepts of each phase)' },
      { sym: 'α', desc: 'Distribution rate constant (h⁻¹) — fast phase' },
      { sym: 'β', desc: 'Elimination rate constant (h⁻¹) — slow phase' },
    ],
    notes: 'Two phases: rapid distribution (α) and slower elimination (β). t½α and t½β are the corresponding half-lives. β is the clinically relevant elimination half-life.',
    tags: ['2-compartment', 'biexponential', 'IV bolus', 'distribution'],
  },

  // ── Tmax and Cmax ──
  {
    id: 'tmax',
    category: 'Tmax and Cmax',
    name: 'Time to maximum concentration',
    symbol: 'Tmax',
    formula: 'Tmax = ln(kₐ/kₑ) / (kₐ − kₑ)',
    units: 'h',
    variables: [
      { sym: 'kₐ', desc: 'Absorption rate constant (h⁻¹)' },
      { sym: 'kₑ', desc: 'Elimination rate constant (h⁻¹)' },
    ],
    notes: 'Valid when kₐ ≠ kₑ. Tmax is independent of dose and F (for 1-compartment linear). Tmax increases as kₐ decreases (slower absorption).',
    tags: ['Tmax', 'oral', 'absorption'],
  },
  {
    id: 'cmax_oral',
    category: 'Tmax and Cmax',
    name: 'Maximum concentration — oral',
    symbol: 'Cmax',
    formula: 'Cmax = C(Tmax) = (F·D·kₐ)/(Vd·(kₐ−kₑ)) × (e^(−kₑ·Tmax) − e^(−kₐ·Tmax))',
    units: 'mg/L',
    variables: [
      { sym: 'Tmax', desc: 'Time of maximum concentration (h)' },
      { sym: 'F', desc: 'Bioavailability' },
      { sym: 'D', desc: 'Dose (mg)' },
    ],
    notes: 'Substitute Tmax into the oral 1-compartment equation. Proportional to dose (linear kinetics).',
    tags: ['Cmax', 'oral', 'maximum concentration'],
  },

  // ── AUC ──
  {
    id: 'auc_iv',
    category: 'AUC',
    name: 'AUC — IV bolus',
    symbol: 'AUC∞',
    formula: 'AUC∞ = D / CL = C₀ / kₑ',
    units: 'mg·h/L',
    variables: [
      { sym: 'D', desc: 'Dose (mg)' },
      { sym: 'CL', desc: 'Clearance (L/h)' },
      { sym: 'C₀', desc: 'Initial concentration (mg/L)' },
      { sym: 'kₑ', desc: 'Elimination rate constant (h⁻¹)' },
    ],
    notes: 'Total drug exposure from time 0 to infinity. The gold standard measure of bioavailability.',
    tags: ['AUC', 'IV bolus', 'exposure'],
  },
  {
    id: 'auc_oral',
    category: 'AUC',
    name: 'AUC — oral',
    symbol: 'AUC∞',
    formula: 'AUC∞ = (F × D) / CL',
    units: 'mg·h/L',
    variables: [
      { sym: 'F', desc: 'Bioavailability' },
      { sym: 'D', desc: 'Dose (mg)' },
      { sym: 'CL', desc: 'Clearance (L/h)' },
    ],
    notes: 'F = AUCoral / AUCIV. AUC is proportional to dose for linear kinetics. Non-linear kinetics: AUC increases disproportionately with dose.',
    tags: ['AUC', 'oral', 'bioavailability', 'exposure'],
  },
  {
    id: 'auc_trapezoid',
    category: 'AUC',
    name: 'AUC — trapezoidal rule (NCA)',
    symbol: 'AUC',
    formula: 'AUC(t₁→t₂) = (C₁ + C₂) / 2 × (t₂ − t₁)',
    units: 'mg·h/L',
    variables: [
      { sym: 'C₁, C₂', desc: 'Concentrations at t₁ and t₂' },
      { sym: 't₁, t₂', desc: 'Time points' },
    ],
    notes: 'Sum over all intervals for total AUC. Add terminal area: AUC(tlast→∞) = Clast / kₑ. Linear trapezoidal for rising phase, log-linear for falling phase (lin-log method).',
    tags: ['AUC', 'NCA', 'trapezoidal', 'non-compartmental'],
  },

  // ── Steady state ──
  {
    id: 'css',
    category: 'Steady state',
    name: 'Average steady-state concentration',
    symbol: 'Css,avg',
    formula: 'Css,avg = (F × D) / (CL × τ)',
    units: 'mg/L',
    variables: [
      { sym: 'F', desc: 'Bioavailability' },
      { sym: 'D', desc: 'Dose (mg)' },
      { sym: 'CL', desc: 'Clearance (L/h)' },
      { sym: 'τ', desc: 'Dosing interval (h)' },
    ],
    notes: 'Steady state reached after ~5 × t½. Css,avg = AUCss/τ. Doubling dose doubles Css. Halving interval doubles Css.',
    tags: ['steady state', 'Css', 'multiple dosing'],
  },
  {
    id: 'css_infusion',
    category: 'Steady state',
    name: 'Steady-state concentration — IV infusion',
    symbol: 'Css',
    formula: 'Css = R₀ / CL',
    units: 'mg/L',
    variables: [
      { sym: 'R₀', desc: 'Infusion rate (mg/h)' },
      { sym: 'CL', desc: 'Clearance (L/h)' },
    ],
    notes: 'Independent of Vd and kₑ. 90% Css reached at 3.3 × t½. Loading dose = Css × Vd.',
    tags: ['steady state', 'IV infusion', 'Css'],
  },
  {
    id: 'loading_dose',
    category: 'Steady state',
    name: 'Loading dose',
    symbol: 'DL',
    formula: 'DL = Css,target × Vd / F',
    units: 'mg',
    variables: [
      { sym: 'Css,target', desc: 'Target steady-state concentration (mg/L)' },
      { sym: 'Vd', desc: 'Volume of distribution (L)' },
      { sym: 'F', desc: 'Bioavailability' },
    ],
    notes: 'Achieves target concentration immediately, then maintenance doses sustain it. Critical for drugs with long t½ where waiting for SS is clinically unacceptable (e.g. digoxin).',
    tags: ['loading dose', 'steady state', 'Vd'],
  },
  {
    id: 'accumulation',
    category: 'Steady state',
    name: 'Accumulation factor',
    symbol: 'R',
    formula: 'R = 1 / (1 − e^(−kₑτ)) = Cmax,ss / Cmax,1',
    units: 'dimensionless',
    variables: [
      { sym: 'kₑ', desc: 'Elimination rate constant (h⁻¹)' },
      { sym: 'τ', desc: 'Dosing interval (h)' },
    ],
    notes: 'Ratio of Cmax at steady state to Cmax after first dose. If τ = t½, R ≈ 2 (drug accumulates 2-fold). If τ >> t½, R ≈ 1 (no accumulation).',
    tags: ['accumulation', 'multiple dosing', 'steady state'],
  },

  // ── Bioavailability ──
  {
    id: 'bioavailability',
    category: 'Bioavailability',
    name: 'Absolute bioavailability',
    symbol: 'F',
    formula: 'F = AUCoral / AUCIV × (DIV / Doral)',
    units: '(fraction 0–1)',
    variables: [
      { sym: 'AUCoral', desc: 'AUC after oral dose' },
      { sym: 'AUCIV', desc: 'AUC after IV dose' },
      { sym: 'DIV', desc: 'IV dose' },
      { sym: 'Doral', desc: 'Oral dose' },
    ],
    notes: 'Fraction of dose reaching systemic circulation. Reduced by: first-pass metabolism, poor absorption, efflux transporters. F = 1 for IV by definition.',
    tags: ['bioavailability', 'F', 'first-pass', 'AUC'],
  },
  {
    id: 'relative_ba',
    category: 'Bioavailability',
    name: 'Relative bioavailability',
    symbol: 'Frel',
    formula: 'Frel = (AUCtest × Dref) / (AUCref × Dtest)',
    units: '(fraction)',
    variables: [
      { sym: 'AUCtest', desc: 'AUC of test formulation' },
      { sym: 'AUCref', desc: 'AUC of reference formulation' },
    ],
    notes: 'Used in bioequivalence studies. Two formulations are bioequivalent if 90% CI of Frel falls within 80–125%.',
    tags: ['relative bioavailability', 'bioequivalence', 'AUC'],
  },
  {
    id: 'first_pass',
    category: 'Bioavailability',
    name: 'First-pass extraction',
    symbol: 'E',
    formula: 'E = (CA − CV) / CA',
    units: '(fraction 0–1)',
    variables: [
      { sym: 'CA', desc: 'Arterial (incoming) drug concentration' },
      { sym: 'CV', desc: 'Venous (outgoing) drug concentration' },
    ],
    notes: 'E = 1 − F for purely hepatically extracted drugs. High extraction ratio drugs (E > 0.7): CL ≈ Q (blood flow limited). Low extraction ratio (E < 0.3): CL sensitive to enzyme activity.',
    tags: ['first-pass', 'extraction ratio', 'hepatic clearance'],
  },

  // ── Clearance ──
  {
    id: 'hepatic_cl',
    category: 'Clearance',
    name: 'Hepatic clearance — well-stirred model',
    symbol: 'CLH',
    formula: 'CLH = QH × (fu × CLint) / (QH + fu × CLint)',
    units: 'L/h',
    variables: [
      { sym: 'QH', desc: 'Hepatic blood flow (~80 L/h)' },
      { sym: 'fu', desc: 'Unbound fraction in blood' },
      { sym: 'CLint', desc: 'Intrinsic clearance (L/h)' },
    ],
    notes: 'Also called the venous equilibrium model. For high-extraction drugs: CLH ≈ QH (flow-limited). For low-extraction: CLH ≈ fu × CLint (capacity-limited).',
    tags: ['hepatic clearance', 'well-stirred model', 'intrinsic clearance'],
  },
  {
    id: 'renal_cl',
    category: 'Clearance',
    name: 'Renal clearance',
    symbol: 'CLR',
    formula: 'CLR = (fu × GFR) + CLsec − CLreabs',
    units: 'L/h',
    variables: [
      { sym: 'fu', desc: 'Unbound fraction' },
      { sym: 'GFR', desc: 'Glomerular filtration rate (~120 mL/min)' },
      { sym: 'CLsec', desc: 'Tubular secretion clearance' },
      { sym: 'CLreabs', desc: 'Tubular reabsorption clearance' },
    ],
    notes: 'CLR > fu × GFR indicates active secretion. CLR < fu × GFR indicates reabsorption. pH affects reabsorption of weak acids/bases (Henderson-Hasselbalch).',
    tags: ['renal clearance', 'GFR', 'tubular secretion'],
  },
  {
    id: 'crcl',
    category: 'Clearance',
    name: 'Creatinine clearance — Cockcroft-Gault',
    symbol: 'CrCl',
    formula: 'CrCl = [(140−age) × weight] / [72 × SCr] × (0.85 if female)',
    units: 'mL/min',
    variables: [
      { sym: 'age', desc: 'Patient age (years)' },
      { sym: 'weight', desc: 'Body weight (kg)' },
      { sym: 'SCr', desc: 'Serum creatinine (mg/dL)' },
    ],
    notes: 'Standard clinical estimate of GFR for dose adjustment. Multiply by 0.85 for females. Overestimates GFR in obese patients; use ideal body weight.',
    tags: ['Cockcroft-Gault', 'creatinine clearance', 'renal impairment', 'dose adjustment'],
  },
  {
    id: 'protein_binding',
    category: 'Clearance',
    name: 'Protein binding — free fraction',
    symbol: 'fu',
    formula: 'fu = Cu / Ctotal = 1 / (1 + Ka × [P])',
    units: '(fraction)',
    variables: [
      { sym: 'Cu', desc: 'Unbound (free) concentration' },
      { sym: 'Ctotal', desc: 'Total plasma concentration' },
      { sym: 'Ka', desc: 'Association constant' },
      { sym: '[P]', desc: 'Protein concentration' },
    ],
    notes: 'Only unbound drug crosses membranes, is filtered by kidney, and exerts pharmacological effect. Highly protein-bound drugs (fu << 1) have small apparent Vd.',
    tags: ['protein binding', 'free fraction', 'unbound drug'],
  },

  // ── Pharmacodynamics ──
  {
    id: 'emax',
    category: 'Pharmacodynamics',
    name: 'Emax model',
    symbol: 'E',
    formula: 'E = (Emax × C) / (EC50 + C)',
    units: 'effect units',
    variables: [
      { sym: 'Emax', desc: 'Maximum possible effect' },
      { sym: 'EC50', desc: 'Concentration producing 50% of Emax' },
      { sym: 'C', desc: 'Drug concentration' },
    ],
    notes: 'Hyperbolic (Michaelis-Menten) concentration-effect relationship. At C = EC50, E = Emax/2. Saturable — doubling dose does not double effect at high concentrations.',
    tags: ['Emax', 'pharmacodynamics', 'EC50', 'concentration-effect'],
  },
  {
    id: 'hill',
    category: 'Pharmacodynamics',
    name: 'Hill equation (sigmoidal Emax)',
    symbol: 'E',
    formula: 'E = (Emax × Cⁿ) / (EC50ⁿ + Cⁿ)',
    units: 'effect units',
    variables: [
      { sym: 'Emax', desc: 'Maximum effect' },
      { sym: 'EC50', desc: 'Concentration at 50% effect' },
      { sym: 'n', desc: 'Hill coefficient (sigmoidicity factor)' },
      { sym: 'C', desc: 'Concentration' },
    ],
    notes: 'n > 1: steep sigmoidal curve (cooperative). n = 1: reduces to Emax model. n < 1: flatter curve. n determines the steepness of the concentration-effect relationship.',
    tags: ['Hill equation', 'sigmoidal', 'pharmacodynamics', 'Hill coefficient'],
  },
  {
    id: 'effect_baseline',
    category: 'Pharmacodynamics',
    name: 'Emax with baseline',
    symbol: 'E',
    formula: 'E = E₀ + (Emax × C) / (EC50 + C)',
    units: 'effect units',
    variables: [
      { sym: 'E₀', desc: 'Baseline effect (without drug)' },
      { sym: 'Emax', desc: 'Maximum drug-induced change' },
      { sym: 'EC50', desc: 'Concentration at 50% of Emax' },
    ],
    notes: 'Includes baseline (placebo) effect. For inhibitory models: E = E₀ − (Emax × C)/(IC50 + C), where IC50 is the concentration producing 50% inhibition.',
    tags: ['Emax', 'baseline', 'pharmacodynamics', 'inhibitory'],
  },
  {
    id: 'pkpd_link',
    category: 'Pharmacodynamics',
    name: 'Effect compartment (ke0)',
    symbol: 'Ce',
    formula: 'dCe/dt = ke0 × (C − Ce)',
    units: 'mg/L',
    variables: [
      { sym: 'ke0', desc: 'Effect-site equilibration rate constant (h⁻¹)' },
      { sym: 'C', desc: 'Plasma concentration' },
      { sym: 'Ce', desc: 'Effect-site concentration' },
    ],
    notes: 'Models hysteresis — the delay between plasma concentration and effect. te50 = ln2/ke0. Used when plasma concentration does not correlate directly with effect.',
    tags: ['effect compartment', 'ke0', 'hysteresis', 'PK-PD'],
  },

  // ── Non-compartmental analysis ──
  {
    id: 'mean_residence_time',
    category: 'Non-compartmental analysis',
    name: 'Mean residence time',
    symbol: 'MRT',
    formula: 'MRT = AUMC / AUC',
    units: 'h',
    variables: [
      { sym: 'AUMC', desc: 'Area under first moment curve (∫t·C dt)' },
      { sym: 'AUC', desc: 'Area under curve (∫C dt)' },
    ],
    notes: 'Average time a drug molecule spends in the body. MRT_IV = 1/kₑ = Vd/CL. MRT_oral = MRT_IV + MAT (mean absorption time). MAT = 1/kₐ.',
    tags: ['MRT', 'AUMC', 'non-compartmental', 'NCA'],
  },
  {
    id: 'aumc',
    category: 'Non-compartmental analysis',
    name: 'AUMC — trapezoidal',
    symbol: 'AUMC',
    formula: 'AUMC(t₁→t₂) = (t₁·C₁ + t₂·C₂) / 2 × (t₂ − t₁)',
    units: 'mg·h²/L',
    variables: [
      { sym: 't₁·C₁', desc: 'First moment at time t₁' },
      { sym: 't₂·C₂', desc: 'First moment at time t₂' },
    ],
    notes: 'Terminal: AUMC(tlast→∞) = Clast × tlast/kₑ + Clast/kₑ². Sum all intervals for total AUMC.',
    tags: ['AUMC', 'first moment', 'NCA'],
  },

  // ── Michaelis-Menten / Non-linear ──
  {
    id: 'mm_kinetics',
    category: 'Non-linear kinetics',
    name: 'Michaelis-Menten elimination rate',
    symbol: 'dC/dt',
    formula: 'dC/dt = −(Vmax × C) / (Km + C)',
    units: 'mg/L/h',
    variables: [
      { sym: 'Vmax', desc: 'Maximum elimination rate (mg/h)' },
      { sym: 'Km', desc: 'Concentration at half Vmax (mg/L)' },
      { sym: 'C', desc: 'Drug concentration (mg/L)' },
    ],
    notes: 'At C << Km: approaches first-order (−Vmax/Km × C). At C >> Km: approaches zero-order (−Vmax). Classic drugs: phenytoin, ethanol, salicylate at toxic doses.',
    tags: ['Michaelis-Menten', 'non-linear', 'zero-order', 'saturable'],
  },
  {
    id: 'mm_css',
    category: 'Non-linear kinetics',
    name: 'Steady state — Michaelis-Menten',
    symbol: 'Css',
    formula: 'Css = (Km × R₀) / (Vmax − R₀)',
    units: 'mg/L',
    variables: [
      { sym: 'Km', desc: 'Michaelis constant (mg/L)' },
      { sym: 'R₀', desc: 'Dosing rate (mg/h)' },
      { sym: 'Vmax', desc: 'Maximum elimination rate (mg/h)' },
    ],
    notes: 'When R₀ approaches Vmax, Css → ∞ (enzyme saturation). Small dose increases cause disproportionately large Css increases — the phenytoin problem.',
    tags: ['Michaelis-Menten', 'steady state', 'phenytoin', 'non-linear'],
  },

  // ── Renal / Dose adjustment ──
  {
    id: 'renal_adj',
    category: 'Dose adjustment',
    name: 'Renal clearance adjustment',
    symbol: 'CL_adj',
    formula: 'CL_adj = CL_normal × (1 − fe + fe × CrCl/100)',
    units: 'L/h',
    variables: [
      { sym: 'fe', desc: 'Fraction excreted unchanged renally (0–1)' },
      { sym: 'CrCl', desc: 'Patient CrCl (mL/min)' },
    ],
    notes: 'fe = 0: drug fully hepatically metabolised (renal impairment irrelevant). fe = 1: drug fully renally excreted (dose proportional to CrCl).',
    tags: ['renal', 'dose adjustment', 'fe', 'clearance'],
  },
  {
    id: 'child_pugh',
    category: 'Dose adjustment',
    name: 'Child-Pugh hepatic adjustment',
    symbol: 'CL_adj',
    formula: 'CL_adj = CL_normal × (1 − EH + EH × HF)',
    units: 'L/h',
    variables: [
      { sym: 'EH', desc: 'Hepatic extraction ratio (0–1)' },
      { sym: 'HF', desc: 'Hepatic function fraction (A=1.0, B=0.6, C=0.3)' },
    ],
    notes: 'Child-Pugh Class A (5-6): mild. Class B (7-9): moderate. Class C (10-15): severe. High-extraction drugs more sensitive to hepatic impairment.',
    tags: ['Child-Pugh', 'hepatic', 'dose adjustment', 'extraction ratio'],
  },
  {
    id: 'dose_reduction',
    category: 'Dose adjustment',
    name: 'Dose reduction method',
    symbol: 'D_adj',
    formula: 'D_adj = D_normal × (CL_adj / CL_normal)',
    units: 'mg',
    variables: [
      { sym: 'CL_adj', desc: 'Adjusted clearance' },
      { sym: 'CL_normal', desc: 'Normal clearance' },
    ],
    notes: 'Keeps same dosing interval, reduces dose. Maintains same Css,avg but lower Cmax and higher Cmin (reduced fluctuation). Preferred for time-dependent drugs.',
    tags: ['dose reduction', 'dose adjustment', 'impairment'],
  },
  {
    id: 'interval_extension',
    category: 'Dose adjustment',
    name: 'Interval extension method',
    symbol: 'τ_adj',
    formula: 'τ_adj = τ_normal × (CL_normal / CL_adj)',
    units: 'h',
    variables: [
      { sym: 'CL_adj', desc: 'Adjusted clearance' },
      { sym: 'CL_normal', desc: 'Normal clearance' },
    ],
    notes: 'Keeps same dose, extends interval. Maintains same Cmax but lower Cmin (more fluctuation). Preferred for concentration-dependent drugs (aminoglycosides).',
    tags: ['interval extension', 'dose adjustment', 'impairment'],
  },
]

const MATH_FORMULAS = [
  // ── Statistics ──
  {
    id: 'mean',
    category: 'Descriptive statistics',
    name: 'Arithmetic mean',
    symbol: 'x̄',
    formula: 'x̄ = (1/n) × Σxᵢ',
    units: 'same as data',
    variables: [
      { sym: 'n', desc: 'Number of observations' },
      { sym: 'xᵢ', desc: 'Individual observations' },
    ],
    notes: 'Sensitive to outliers. For skewed distributions, median is more representative.',
    tags: ['mean', 'average', 'descriptive statistics'],
  },
  {
    id: 'variance',
    category: 'Descriptive statistics',
    name: 'Sample variance',
    symbol: 's²',
    formula: 's² = Σ(xᵢ − x̄)² / (n − 1)',
    units: 'units²',
    variables: [
      { sym: 'xᵢ', desc: 'Individual observations' },
      { sym: 'x̄', desc: 'Sample mean' },
      { sym: 'n', desc: 'Sample size' },
    ],
    notes: 'Uses n−1 (Bessel\'s correction) for unbiased estimate of population variance. Population variance uses n.',
    tags: ['variance', 'spread', 'descriptive statistics'],
  },
  {
    id: 'sd',
    category: 'Descriptive statistics',
    name: 'Standard deviation',
    symbol: 's',
    formula: 's = √[Σ(xᵢ − x̄)² / (n − 1)]',
    units: 'same as data',
    variables: [
      { sym: 'xᵢ', desc: 'Individual observations' },
      { sym: 'x̄', desc: 'Sample mean' },
    ],
    notes: 'Square root of variance. In same units as the data. ~68% of normally distributed data falls within ±1 SD, ~95% within ±2 SD.',
    tags: ['standard deviation', 'SD', 'spread'],
  },
  {
    id: 'sem',
    category: 'Descriptive statistics',
    name: 'Standard error of the mean',
    symbol: 'SEM',
    formula: 'SEM = s / √n',
    units: 'same as data',
    variables: [
      { sym: 's', desc: 'Sample standard deviation' },
      { sym: 'n', desc: 'Sample size' },
    ],
    notes: 'Measures precision of the sample mean as an estimate of the population mean. Decreases with larger n. SEM < SD always (unless n = 1). Use SD for describing spread, SEM for confidence in mean.',
    tags: ['SEM', 'standard error', 'precision'],
  },
  {
    id: 'cv',
    category: 'Descriptive statistics',
    name: 'Coefficient of variation',
    symbol: 'CV%',
    formula: 'CV% = (s / x̄) × 100',
    units: '%',
    variables: [
      { sym: 's', desc: 'Standard deviation' },
      { sym: 'x̄', desc: 'Mean' },
    ],
    notes: 'Normalised measure of dispersion. Useful for comparing variability across datasets with different units or scales. Used extensively in population PK (IIV expressed as CV%).',
    tags: ['CV', 'coefficient of variation', 'variability', 'population PK'],
  },
  {
    id: 'z_score',
    category: 'Descriptive statistics',
    name: 'Z-score (standardisation)',
    symbol: 'z',
    formula: 'z = (x − μ) / σ',
    units: 'dimensionless',
    variables: [
      { sym: 'x', desc: 'Individual observation' },
      { sym: 'μ', desc: 'Population mean' },
      { sym: 'σ', desc: 'Population standard deviation' },
    ],
    notes: 'Number of standard deviations from the mean. z = 1.96 corresponds to 95th percentile. Used for normal distribution probability calculations.',
    tags: ['z-score', 'standardisation', 'normal distribution'],
  },
  {
    id: 'ci_mean',
    category: 'Confidence intervals',
    name: '95% Confidence interval for mean',
    symbol: 'CI',
    formula: 'CI = x̄ ± t(α/2, n−1) × (s / √n)',
    units: 'same as data',
    variables: [
      { sym: 'x̄', desc: 'Sample mean' },
      { sym: 't(α/2, n−1)', desc: 't-value (1.96 for large n at 95%)' },
      { sym: 's', desc: 'Sample standard deviation' },
      { sym: 'n', desc: 'Sample size' },
    ],
    notes: 'Interpretation: 95% of such intervals would contain the true population mean. NOT: 95% probability the true mean is in this interval. Use t-distribution for small n.',
    tags: ['confidence interval', 'CI', 'inference'],
  },
  {
    id: 'normal_pdf',
    category: 'Probability distributions',
    name: 'Normal distribution PDF',
    symbol: 'f(x)',
    formula: 'f(x) = (1/(σ√(2π))) × e^(−(x−μ)²/(2σ²))',
    units: 'probability density',
    variables: [
      { sym: 'μ', desc: 'Mean (location)' },
      { sym: 'σ', desc: 'Standard deviation (scale)' },
    ],
    notes: 'Bell-shaped, symmetric. Parameterised as N(μ, σ²). Standard normal: N(0,1). The 68-95-99.7 rule: ±1σ, ±2σ, ±3σ contain 68%, 95%, 99.7% of probability mass.',
    tags: ['normal distribution', 'Gaussian', 'PDF'],
  },
  {
    id: 'lognormal',
    category: 'Probability distributions',
    name: 'Log-normal distribution',
    symbol: 'X ~ LogNormal',
    formula: 'If ln(X) ~ N(μ, σ²), then X ~ LogNormal(μ, σ²)',
    units: '',
    variables: [
      { sym: 'μ', desc: 'Mean of ln(X)' },
      { sym: 'σ²', desc: 'Variance of ln(X) — also called ω² in population PK' },
    ],
    notes: 'Used extensively in population PK for inter-individual variability (IIV). Always positive, right-skewed. Median = e^μ. CV ≈ ω × 100% when ω² is small.',
    tags: ['log-normal', 'IIV', 'population PK', 'distribution'],
  },
  {
    id: 't_test',
    category: 'Hypothesis testing',
    name: 'One-sample t-test statistic',
    symbol: 't',
    formula: 't = (x̄ − μ₀) / (s / √n)',
    units: 'dimensionless',
    variables: [
      { sym: 'x̄', desc: 'Sample mean' },
      { sym: 'μ₀', desc: 'Hypothesised population mean' },
      { sym: 's', desc: 'Sample standard deviation' },
      { sym: 'n', desc: 'Sample size' },
    ],
    notes: 'Degrees of freedom = n − 1. Compare t to t-table or compute p-value. Two-sample t-test: denominator becomes √(s₁²/n₁ + s₂²/n₂).',
    tags: ['t-test', 'hypothesis testing', 'p-value'],
  },
  {
    id: 'p_value',
    category: 'Hypothesis testing',
    name: 'p-value interpretation',
    symbol: 'p',
    formula: 'p = P(data at least this extreme | H₀ true)',
    units: '(0–1)',
    variables: [
      { sym: 'H₀', desc: 'Null hypothesis' },
    ],
    notes: 'p < 0.05: reject H₀ at 5% significance level. p is NOT the probability that H₀ is true. Not the probability that results occurred by chance alone. A small p-value means the data are unlikely under H₀.',
    tags: ['p-value', 'significance', 'hypothesis testing'],
  },
  {
    id: 'linear_regression',
    category: 'Regression',
    name: 'Simple linear regression',
    symbol: 'ŷ',
    formula: 'ŷ = β₀ + β₁x',
    units: 'same as y',
    variables: [
      { sym: 'β₀', desc: 'Intercept — value of y when x = 0' },
      { sym: 'β₁', desc: 'Slope — change in y per unit x' },
      { sym: 'x', desc: 'Predictor variable' },
    ],
    notes: 'β₁ = Σ(xᵢ−x̄)(yᵢ−ȳ) / Σ(xᵢ−x̄)². β₀ = ȳ − β₁x̄. Used in PK for log-linear regression of terminal phase to estimate kₑ (slope = −kₑ/2.303 on log₁₀ scale).',
    tags: ['linear regression', 'slope', 'intercept', 'least squares'],
  },
  {
    id: 'r_squared',
    category: 'Regression',
    name: 'Coefficient of determination R²',
    symbol: 'R²',
    formula: 'R² = 1 − (SSres / SStot) = (SSreg / SStot)',
    units: '(0–1)',
    variables: [
      { sym: 'SSres', desc: 'Residual sum of squares' },
      { sym: 'SStot', desc: 'Total sum of squares' },
    ],
    notes: 'Fraction of variance in y explained by the model. R² = 0.95 means 95% of variability is explained. Not appropriate for comparing models with different numbers of parameters — use adjusted R² or AIC.',
    tags: ['R-squared', 'goodness of fit', 'regression'],
  },
  {
    id: 'pearson_r',
    category: 'Regression',
    name: 'Pearson correlation coefficient',
    symbol: 'r',
    formula: 'r = Σ(xᵢ−x̄)(yᵢ−ȳ) / √[Σ(xᵢ−x̄)² × Σ(yᵢ−ȳ)²]',
    units: '(−1 to +1)',
    variables: [
      { sym: 'x, y', desc: 'Paired observations' },
    ],
    notes: 'r = 1: perfect positive linear correlation. r = 0: no linear correlation. r = −1: perfect negative. r² = R² (simple regression). Measures linear association only.',
    tags: ['correlation', 'Pearson', 'r'],
  },

  // ── Calculus ──
  {
    id: 'derivative_def',
    category: 'Derivatives',
    name: 'Definition of derivative',
    symbol: 'f\'(x)',
    formula: 'f\'(x) = lim(h→0) [f(x+h) − f(x)] / h',
    units: 'units of f / units of x',
    variables: [
      { sym: 'h', desc: 'Small increment in x' },
    ],
    notes: 'The instantaneous rate of change of f with respect to x. In PK: dC/dt is the instantaneous rate of change of concentration — the foundation of compartmental modelling.',
    tags: ['derivative', 'rate of change', 'calculus'],
  },
  {
    id: 'power_rule',
    category: 'Derivatives',
    name: 'Power rule',
    symbol: 'd/dx',
    formula: 'd/dx [xⁿ] = n·xⁿ⁻¹',
    units: '',
    variables: [
      { sym: 'n', desc: 'Exponent (any real number)' },
    ],
    notes: 'Examples: d/dx[x³] = 3x². d/dx[x] = 1. d/dx[√x] = 1/(2√x).',
    tags: ['power rule', 'derivative', 'calculus'],
  },
  {
    id: 'exp_rule',
    category: 'Derivatives',
    name: 'Exponential and natural log derivatives',
    symbol: 'd/dx',
    formula: 'd/dx [eˣ] = eˣ       d/dx [ln x] = 1/x',
    units: '',
    variables: [],
    notes: 'Critical for PK: d/dt[e^(−kₑt)] = −kₑ·e^(−kₑt). This is why first-order elimination leads to exponential decay. Also: d/dx[aˣ] = aˣ·ln(a).',
    tags: ['exponential', 'logarithm', 'derivative'],
  },
  {
    id: 'chain_rule',
    category: 'Derivatives',
    name: 'Chain rule',
    symbol: 'd/dx',
    formula: 'd/dx [f(g(x))] = f\'(g(x)) × g\'(x)',
    units: '',
    variables: [],
    notes: 'For composite functions. Example: d/dt[e^(−kt)] = e^(−kt) × (−k) = −k·e^(−kt). Used when differentiating complex PK expressions.',
    tags: ['chain rule', 'composite function', 'derivative'],
  },
  {
    id: 'integral_def',
    category: 'Integrals',
    name: 'Definite integral',
    symbol: '∫',
    formula: '∫[a to b] f(x) dx = F(b) − F(a)   where F\'(x) = f(x)',
    units: 'units of f × units of x',
    variables: [
      { sym: 'F(x)', desc: 'Antiderivative of f(x)' },
      { sym: 'a, b', desc: 'Integration limits' },
    ],
    notes: 'Geometrically: area under f(x) between a and b. In PK: AUC = ∫C dt. The fundamental theorem of calculus: differentiation and integration are inverse operations.',
    tags: ['integral', 'definite integral', 'AUC', 'area'],
  },
  {
    id: 'exp_integral',
    category: 'Integrals',
    name: 'Integral of exponential',
    symbol: '∫',
    formula: '∫ eˣ dx = eˣ + C       ∫ e^(ax) dx = (1/a)e^(ax) + C',
    units: '',
    variables: [
      { sym: 'a', desc: 'Constant (non-zero)' },
      { sym: 'C', desc: 'Constant of integration' },
    ],
    notes: 'Fundamental for computing AUC in PK. ∫₀^∞ e^(−kₑt) dt = 1/kₑ. Therefore AUC_IV = C₀ × (1/kₑ) = C₀/kₑ = D/(Vd × kₑ) = D/CL.',
    tags: ['integral', 'exponential', 'AUC', 'calculus'],
  },
  {
    id: 'ode_first_order',
    category: 'Differential equations',
    name: 'First-order linear ODE — general solution',
    symbol: 'y(t)',
    formula: 'dy/dt = −k·y  →  y(t) = y₀·e^(−kt)',
    units: '',
    variables: [
      { sym: 'y₀', desc: 'Initial value at t = 0' },
      { sym: 'k', desc: 'Rate constant (positive = decay)' },
    ],
    notes: 'The single most important equation in pharmacokinetics. Every 1-compartment IV bolus model IS this ODE. The solution (monoexponential decay) is the basis of all first-order PK.',
    tags: ['ODE', 'first-order', 'exponential decay', 'PK basis'],
  },
  {
    id: 'ode_input',
    category: 'Differential equations',
    name: 'First-order ODE with constant input',
    symbol: 'C(t)',
    formula: 'dC/dt = R/Vd − kₑC  →  C(t) = (R/(kₑVd)) × (1 − e^(−kₑt))',
    units: '',
    variables: [
      { sym: 'R', desc: 'Constant input rate (e.g. infusion rate)' },
      { sym: 'Vd', desc: 'Volume of distribution' },
      { sym: 'kₑ', desc: 'Elimination rate constant' },
    ],
    notes: 'Solution to the IV infusion PK model. As t → ∞, C → R/(kₑVd) = Css = R/CL. The approach to steady state is governed by kₑ, not the infusion rate.',
    tags: ['ODE', 'IV infusion', 'steady state', 'differential equation'],
  },
  {
    id: 'taylor_series',
    category: 'Approximations',
    name: 'Taylor series (linear approximation)',
    symbol: 'f(x)',
    formula: 'f(x) ≈ f(a) + f\'(a)·(x−a)    (first-order)',
    units: '',
    variables: [
      { sym: 'a', desc: 'Point of expansion' },
      { sym: 'f\'(a)', desc: 'Derivative at point a' },
    ],
    notes: 'Linear approximation of any differentiable function near a point. Used in sensitivity analysis of PK models and error propagation. Full series: f(x) = Σ fⁿ(a)/n! × (x−a)ⁿ.',
    tags: ['Taylor series', 'approximation', 'linearisation'],
  },
  {
    id: 'ln_rules',
    category: 'Algebra',
    name: 'Natural logarithm rules',
    symbol: 'ln',
    formula: 'ln(ab) = ln a + ln b\nln(a/b) = ln a − ln b\nln(aⁿ) = n·ln a\nln(eˣ) = x\ne^(ln x) = x',
    units: '',
    variables: [],
    notes: 'Essential for PK calculations. ln(C₂/C₁) = −kₑ(t₂−t₁) allows calculating kₑ from two concentration points on the terminal phase. ln 2 ≈ 0.693.',
    tags: ['logarithm', 'ln', 'algebra', 'rules'],
  },
  {
    id: 'exp_rules',
    category: 'Algebra',
    name: 'Exponential rules',
    symbol: 'e',
    formula: 'eᵃ × eᵇ = e^(a+b)\n(eᵃ)ᵇ = e^(ab)\ne⁰ = 1\ne^(−∞) = 0',
    units: '',
    variables: [],
    notes: 'Used constantly in PK for combining exponentials, understanding long-time behaviour, and simplifying equations.',
    tags: ['exponential', 'algebra', 'rules'],
  },
  {
    id: 'geometric_series',
    category: 'Algebra',
    name: 'Geometric series (infinite sum)',
    symbol: 'S',
    formula: 'Σₙ₌₀^∞ rⁿ = 1/(1−r)    for |r| < 1',
    units: '',
    variables: [
      { sym: 'r', desc: 'Common ratio (|r| < 1 for convergence)' },
    ],
    notes: 'Used to derive the accumulation factor: the steady-state Cmax is the sum of contributions from infinitely many doses, which forms a geometric series with r = e^(−kₑτ).',
    tags: ['geometric series', 'algebra', 'accumulation', 'steady state'],
  },
]

// ─── Components ───────────────────────────────────────────────────

function FormulaCard({ formula, isExpanded, onToggle }) {
  return (
    <div
      style={{
        background: 'white',
        border: '1px solid #e5e7eb',
        borderRadius: '12px',
        overflow: 'hidden',
        marginBottom: '8px',
        transition: 'box-shadow 0.15s',
      }}
    >
      {/* Header — always visible */}
      <button
        onClick={onToggle}
        style={{
          width: '100%',
          padding: '12px 16px',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          textAlign: 'left',
        }}
      >
        {/* Symbol badge */}
        <div style={{
          background: '#f0f4ff',
          border: '1px solid #c7d2fe',
          borderRadius: '6px',
          padding: '4px 10px',
          fontSize: '13px',
          fontWeight: '700',
          color: '#3730a3',
          fontFamily: 'ui-monospace, monospace',
          whiteSpace: 'nowrap',
          flexShrink: 0,
          minWidth: '56px',
          textAlign: 'center',
        }}>
          {formula.symbol}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '14px', fontWeight: '600', color: '#111827', marginBottom: '2px' }}>
            {formula.name}
          </div>
          <div style={{
            fontSize: '13px',
            fontFamily: 'ui-monospace, monospace',
            color: '#4b5563',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            {formula.formula.split('\n')[0]}
          </div>
        </div>

        <div style={{
          fontSize: '18px',
          color: '#9ca3af',
          flexShrink: 0,
          transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
          transition: 'transform 0.2s',
        }}>›</div>
      </button>

      {/* Expanded detail */}
      {isExpanded && (
        <div style={{ padding: '0 16px 14px', borderTop: '1px solid #f3f4f6' }}>

          {/* Full formula — monospace block */}
          <div style={{
            background: '#0a0f1e',
            borderRadius: '8px',
            padding: '12px 16px',
            margin: '10px 0',
            fontFamily: 'ui-monospace, monospace',
            fontSize: '14px',
            color: '#93b4f7',
            whiteSpace: 'pre-wrap',
            lineHeight: '1.7',
          }}>
            {formula.formula}
          </div>

          {/* Variables */}
          {formula.variables?.length > 0 && (
            <div style={{ marginBottom: '10px' }}>
              <p style={{ fontSize: '11px', color: '#9ca3af', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 6px' }}>Variables</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                {formula.variables.map(v => (
                  <div key={v.sym} style={{ display: 'flex', gap: '10px', fontSize: '13px' }}>
                    <code style={{ background: '#f3f4f6', padding: '1px 7px', borderRadius: '4px', color: '#3730a3', fontWeight: '600', flexShrink: 0, fontFamily: 'ui-monospace, monospace' }}>
                      {v.sym}
                    </code>
                    <span style={{ color: '#6b7280' }}>{v.desc}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Units */}
          {formula.units && (
            <div style={{ marginBottom: '10px', fontSize: '12px' }}>
              <span style={{ color: '#9ca3af', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: '11px' }}>Units: </span>
              <code style={{ fontFamily: 'ui-monospace, monospace', color: '#374151' }}>{formula.units}</code>
            </div>
          )}

          {/* Notes */}
          {formula.notes && (
            <div style={{ background: '#f9fafb', borderRadius: '8px', padding: '10px 12px', fontSize: '13px', color: '#374151', lineHeight: '1.6' }}>
              {formula.notes}
            </div>
          )}

          {/* Tags */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '10px' }}>
            {formula.tags?.map(tag => (
              <span key={tag} style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '999px', background: '#f3f4f6', color: '#6b7280', border: '1px solid #e5e7eb' }}>
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────

export default function Formulas() {
  const [tab,      setTab]      = useState('pk')
  const [query,    setQuery]    = useState('')
  const [expanded, setExpanded] = useState(new Set())
  const [catFilter,setCatFilter]= useState('All')

  const formulas = tab === 'pk' ? PK_FORMULAS : MATH_FORMULAS

  const categories = useMemo(() => {
    const cats = ['All', ...new Set(formulas.map(f => f.category))]
    return cats
  }, [tab, formulas])

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim()
    return formulas.filter(f => {
      const matchesQuery = !q
        || f.name.toLowerCase().includes(q)
        || f.formula.toLowerCase().includes(q)
        || f.symbol.toLowerCase().includes(q)
        || f.tags?.some(t => t.toLowerCase().includes(q))
        || f.notes?.toLowerCase().includes(q)
        || f.variables?.some(v => v.sym.toLowerCase().includes(q) || v.desc.toLowerCase().includes(q))
      const matchesCat = catFilter === 'All' || f.category === catFilter
      return matchesQuery && matchesCat
    })
  }, [formulas, query, catFilter])

  const grouped = useMemo(() => {
    const groups = {}
    filtered.forEach(f => {
      if (!groups[f.category]) groups[f.category] = []
      groups[f.category].push(f)
    })
    return groups
  }, [filtered])

  function toggleExpanded(id) {
    setExpanded(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function expandAll()   { setExpanded(new Set(filtered.map(f => f.id))) }
  function collapseAll() { setExpanded(new Set()) }

  const tabBtn = active => ({
    padding: '8px 20px', cursor: 'pointer', fontSize: '14px',
    fontWeight: active ? '600' : '400',
    border: 'none',
    borderBottom: active ? '2px solid #2563eb' : '2px solid transparent',
    background: 'transparent',
    color: active ? '#1d4ed8' : '#6b7280',
    marginBottom: '-1px',
  })

  return (
    <main style={{ maxWidth: '860px', margin: '0 auto', padding: '2rem 1rem', fontFamily: 'system-ui, sans-serif' }}>
      <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#111827', margin: '0 0 4px' }}>Formula Reference</h1>
      <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '1.5rem', lineHeight: '1.6' }}>
        Searchable reference for pharmacokinetics, pharmacodynamics, statistics, and calculus. Click any formula to expand variables, units, and notes.
      </p>

      {/* Tabs */}
      <div style={{ borderBottom: '1px solid #e5e7eb', marginBottom: '1.25rem', display: 'flex', gap: '0' }}>
        <button onClick={() => { setTab('pk'); setCatFilter('All'); setQuery('') }} style={tabBtn(tab === 'pk')}>
          💊 PK / PD / Biopharmaceutics
        </button>
        <button onClick={() => { setTab('math'); setCatFilter('All'); setQuery('') }} style={tabBtn(tab === 'math')}>
          📐 Statistics, Algebra & Calculus
        </button>
      </div>

      {/* Search + filter row */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '1rem', flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="Search formulas, symbols, topics..."
          value={query}
          onChange={e => { setQuery(e.target.value); setCatFilter('All') }}
          style={{
            flex: 1, minWidth: '200px', padding: '9px 14px',
            borderRadius: '8px', border: '1px solid #d1d5db',
            fontSize: '14px', color: '#111827', background: 'white',
            outline: 'none',
          }}
        />
        <select
          value={catFilter}
          onChange={e => setCatFilter(e.target.value)}
          style={{
            padding: '9px 12px', borderRadius: '8px', border: '1px solid #d1d5db',
            fontSize: '13px', color: '#111827', background: 'white',
          }}
        >
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* Controls + count */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <span style={{ fontSize: '12px', color: '#9ca3af' }}>
          {filtered.length} formula{filtered.length !== 1 ? 's' : ''}
          {query && ` matching "${query}"`}
        </span>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={expandAll}   style={{ fontSize: '12px', color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 0' }}>Expand all</button>
          <span style={{ color: '#d1d5db' }}>·</span>
          <button onClick={collapseAll} style={{ fontSize: '12px', color: '#6b7280', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 0' }}>Collapse all</button>
        </div>
      </div>

      {/* Formula list */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#9ca3af', fontSize: '14px' }}>
          No formulas found for "{query}"
        </div>
      ) : (
        Object.entries(grouped).map(([category, items]) => (
          <div key={category} style={{ marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '12px', fontWeight: '700', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 8px', paddingLeft: '2px' }}>
              {category}
            </h2>
            {items.map(formula => (
              <FormulaCard
                key={formula.id}
                formula={formula}
                isExpanded={expanded.has(formula.id)}
                onToggle={() => toggleExpanded(formula.id)}
              />
            ))}
          </div>
        ))
      )}
    </main>
  )
}