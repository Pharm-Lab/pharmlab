'use client'
import { useState, useRef, useEffect } from 'react'

// ─── Chemistry helpers ────────────────────────────────────────────────────────

function parseFormula(formula) {
  const regex = /([A-Z][a-z]?)(\d*)/g
  const atoms = {}
  let match
  while ((match = regex.exec(formula)) !== null) {
    if (!match[1]) continue
    const el = match[1]
    const n = parseInt(match[2] || '1')
    atoms[el] = (atoms[el] || 0) + n
  }
  return atoms
}

// Monoisotopic masses
const MONO = { H:1.00783, C:12.0000, N:14.0031, O:15.9949, S:31.9721, P:30.9738, F:18.9984, Cl:34.9689, Br:78.9183, I:126.9045, Si:27.9769 }

function calcMonoisotopic(atoms) {
  return Object.entries(atoms).reduce((sum, [el, n]) => sum + (MONO[el] || 0) * n, 0)
}

function calcDegreesOfUnsaturation(atoms) {
  const C = atoms.C || 0, H = atoms.H || 0, N = atoms.N || 0
  const X = (atoms.F || 0) + (atoms.Cl || 0) + (atoms.Br || 0) + (atoms.I || 0)
  return (2 * C + 2 + N - H - X) / 2
}

// Neutral losses database
const NEUTRAL_LOSSES = [
  { loss: 1,    formula: 'H',     label: 'Hydrogen radical',       groups: ['general'] },
  { loss: 15,   formula: 'CH₃',   label: 'Methyl',                 groups: ['alkyl', 'methyl ester', 'N-methyl amine'] },
  { loss: 17,   formula: 'OH',    label: 'Hydroxyl radical',       groups: ['alcohol', 'carboxylic acid'] },
  { loss: 18,   formula: 'H₂O',   label: 'Water',                  groups: ['alcohol', 'carboxylic acid', 'aldehyde'] },
  { loss: 20,   formula: 'HF',    label: 'Hydrogen fluoride',      groups: ['organofluorine'] },
  { loss: 26,   formula: 'C₂H₂',  label: 'Acetylene',              groups: ['aromatic'] },
  { loss: 27,   formula: 'HCN',   label: 'Hydrogen cyanide',       groups: ['aromatic amine', 'nitrile'] },
  { loss: 28,   formula: 'CO/C₂H₄', label: 'Carbon monoxide / ethylene', groups: ['aldehyde', 'ketone', 'alkene'] },
  { loss: 29,   formula: 'CHO',   label: 'Formyl radical',         groups: ['aldehyde'] },
  { loss: 30,   formula: 'CH₂O',  label: 'Formaldehyde',           groups: ['N-methyl', 'methoxy'] },
  { loss: 31,   formula: 'CH₃O',  label: 'Methoxy radical',        groups: ['methyl ester', 'methoxy'] },
  { loss: 32,   formula: 'CH₃OH', label: 'Methanol',               groups: ['methyl ester'] },
  { loss: 34,   formula: 'H₂S',   label: 'Hydrogen sulfide',       groups: ['thiol'] },
  { loss: 35,   formula: 'Cl',    label: 'Chlorine radical',       groups: ['organochlorine'] },
  { loss: 36,   formula: 'HCl',   label: 'Hydrogen chloride',      groups: ['organochlorine'] },
  { loss: 42,   formula: 'C₂H₂O/C₃H₆', label: 'Ketene / propylene', groups: ['acetyl', 'acetamide'] },
  { loss: 43,   formula: 'C₂H₃O/C₃H₇', label: 'Acetyl / propyl', groups: ['methyl ketone', 'propyl'] },
  { loss: 44,   formula: 'CO₂',   label: 'Carbon dioxide',         groups: ['carboxylic acid', 'ester'] },
  { loss: 45,   formula: 'OEt/CO₂H', label: 'Ethoxy / carboxyl',  groups: ['ethyl ester', 'carboxylic acid'] },
  { loss: 46,   formula: 'C₂H₅OH', label: 'Ethanol',              groups: ['ethyl ester'] },
  { loss: 48,   formula: 'SO',    label: 'Sulfur monoxide',        groups: ['sulfoxide'] },
  { loss: 56,   formula: 'C₃H₄O', label: 'Methylketene',          groups: ['ethyl ketone'] },
  { loss: 58,   formula: 'C₃H₆O', label: 'Acetone',               groups: ['isopropyl ketone'] },
  { loss: 59,   formula: 'C₂H₅NO', label: 'Acetamide',            groups: ['acetamide'] },
  { loss: 60,   formula: 'C₂H₄O₂', label: 'Acetic acid',         groups: ['acetate'] },
  { loss: 64,   formula: 'SO₂',   label: 'Sulfur dioxide',        groups: ['sulfonate', 'sulfone'] },
  { loss: 77,   formula: 'C₆H₅',  label: 'Phenyl',                groups: ['benzene ring'] },
  { loss: 79,   formula: 'Br/PO₃', label: 'Bromine / metaphosphate', groups: ['organobromine', 'phosphate'] },
  { loss: 80,   formula: 'HBr',   label: 'Hydrogen bromide',      groups: ['organobromine'] },
  { loss: 81,   formula: 'C₅H₅O', label: 'Furfuryl',             groups: ['furan'] },
  { loss: 91,   formula: 'C₇H₇',  label: 'Tropylium',             groups: ['benzyl', 'toluene'] },
  { loss: 97,   formula: 'H₂PO₄', label: 'Phosphoric acid – H',  groups: ['phosphate'] },
  { loss: 98,   formula: 'H₃PO₄', label: 'Phosphoric acid',      groups: ['phosphate'] },
]

// M+2 isotope patterns
function getIsotopeNote(atoms) {
  const notes = []
  if ((atoms.Cl || 0) === 1) notes.push('1× Cl: M:M+2 ≈ 3:1 (characteristic isotope pattern)')
  if ((atoms.Cl || 0) === 2) notes.push('2× Cl: M:M+2:M+4 ≈ 9:6:1')
  if ((atoms.Br || 0) === 1) notes.push('1× Br: M:M+2 ≈ 1:1 (virtually equal, very diagnostic)')
  if ((atoms.Br || 0) === 2) notes.push('2× Br: M:M+2:M+4 ≈ 1:2:1')
  if ((atoms.S || 0) >= 1)  notes.push('Sulfur: small M+2 (~4.4% per S atom)')
  if (notes.length === 0) notes.push('No characteristic M+2 isotope pattern expected')
  return notes
}

function analyseSpectrum({ formula, peaks, mode }) {
  if (!formula || peaks.length === 0) return null

  const atoms = parseFormula(formula)
  const mw = calcMonoisotopic(atoms)
  const dbe = calcDegreesOfUnsaturation(atoms)
  const isotopeNotes = getIsotopeNote(atoms)

  // Expected M+ ions
  const adducts = [
    { label: '[M+H]⁺',   mz: +(mw + 1.00728).toFixed(4), note: 'Most common ESI positive' },
    { label: '[M+Na]⁺',  mz: +(mw + 22.9898).toFixed(4), note: 'Common ESI with Na adduct' },
    { label: '[M+K]⁺',   mz: +(mw + 38.9637).toFixed(4), note: 'Less common K adduct' },
    { label: '[M]⁺•',    mz: +(mw).toFixed(4),            note: 'EI radical cation' },
    { label: '[M-H]⁻',   mz: +(mw - 1.00728).toFixed(4), note: 'ESI negative mode' },
  ]

  // Find parent ion (largest m/z that could be molecular ion)
  const sortedPeaks = [...peaks].sort((a, b) => b.mz - a.mz)
  const parentCandidate = sortedPeaks[0]

  // Match neutral losses from the parent
  const matchedLosses = []
  for (const peak of peaks) {
    if (peak.mz >= parentCandidate.mz) continue
    const diff = Math.round(parentCandidate.mz - peak.mz)
    const nl = NEUTRAL_LOSSES.find(nl => nl.loss === diff)
    if (nl) {
      matchedLosses.push({
        fromMz: parentCandidate.mz,
        toMz: peak.mz,
        loss: diff,
        formula: nl.formula,
        label: nl.label,
        groups: nl.groups,
        intensity: peak.intensity,
      })
    }
  }

  // Also check losses between all pairs
  for (let i = 0; i < peaks.length; i++) {
    for (let j = 0; j < peaks.length; j++) {
      if (peaks[i].mz <= peaks[j].mz) continue
      const diff = Math.round(peaks[i].mz - peaks[j].mz)
      const nl = NEUTRAL_LOSSES.find(nl => nl.loss === diff)
      if (nl && !matchedLosses.find(m => m.fromMz === peaks[i].mz && m.toMz === peaks[j].mz)) {
        matchedLosses.push({
          fromMz: peaks[i].mz,
          toMz: peaks[j].mz,
          loss: diff,
          formula: nl.formula,
          label: nl.label,
          groups: nl.groups,
          intensity: peaks[j].intensity,
        })
      }
    }
  }

  // Base peak
  const basePeak = [...peaks].sort((a, b) => b.intensity - a.intensity)[0]

  return { atoms, mw, dbe, adducts, isotopeNotes, matchedLosses, basePeak, parentCandidate, sortedPeaks }
}

// ─── Fragmentation rules data ─────────────────────────────────────────────────

const FRAG_GROUPS = [
  {
    name: 'Carboxylic acid',
    color: '#ef4444',
    losses: [
      { mz: '–17 (OH•)', label: 'Loss of hydroxyl radical → [M–OH]⁺' },
      { mz: '–18 (H₂O)', label: 'Dehydration → [M–H₂O]⁺' },
      { mz: '–44 (CO₂)', label: 'Loss of CO₂ (decarboxylation)' },
      { mz: '–45 (CO₂H)', label: 'Loss of carboxyl group' },
    ],
    characteristic: 'm/z 45 (CO₂H⁺) or 29 (CHO⁺) in EI',
    example: 'Ibuprofen: M⁺ 206, loses 18 (H₂O) then 28 (CO)',
    examTip: 'Loss of 44 (CO₂) from M is diagnostic for carboxylic acids in EI. In ESI, [M–H]⁻ is typical in negative mode.',
  },
  {
    name: 'Ester',
    color: '#f97316',
    losses: [
      { mz: '–31 (OCH₃)', label: 'Loss of methoxy → [M–OCH₃]⁺ (methyl ester)' },
      { mz: '–32 (CH₃OH)', label: 'Loss of methanol (methyl ester)' },
      { mz: '–44 (CO₂)', label: 'Rearrangement loss of CO₂' },
      { mz: '–45 (OEt)', label: 'Loss of ethoxy (ethyl ester)' },
      { mz: '–46 (EtOH)', label: 'Loss of ethanol (ethyl ester)' },
      { mz: '–60 (AcOH)', label: 'McLafferty rearrangement → loss of acetic acid (acetate)' },
    ],
    characteristic: 'McLafferty rearrangement (–60 for acetates). Acylium ion RCO⁺.',
    example: 'Aspirin (methyl acetylsalicylate analogue): loss of 60 via McLafferty.',
    examTip: 'The McLafferty rearrangement requires a γ-hydrogen — check the structure. Base peak is often the acylium ion (RCO⁺).',
  },
  {
    name: 'Amine / N-methyl',
    color: '#8b5cf6',
    losses: [
      { mz: '–17 (NH₃)', label: 'Loss of ammonia (primary amine)' },
      { mz: '–28 (HCN)', label: 'Loss of HCN (aromatic amine, after ring opening)' },
      { mz: '–30 (CH₂=NH)', label: 'Loss of formaldimine (N-methyl amine)' },
      { mz: '–42 (CH₂=C=NH)', label: 'Loss from N-propyl or N-acetyl' },
      { mz: '–44 (CO+CH₂N)', label: 'Complex losses from secondary amides' },
    ],
    characteristic: 'Even molecular weight → odd m/z base peak. [M–NR₂]⁺ fragmentation typical.',
    example: 'Amphetamine: α-cleavage next to N → base peak at m/z 44 (CH₂=NHCH₃⁺)',
    examTip: 'Nitrogen rule: an odd molecular weight signals an odd number of nitrogen atoms. α-cleavage adjacent to N is the dominant fragmentation pathway for amines.',
  },
  {
    name: 'Alcohol',
    color: '#22c55e',
    losses: [
      { mz: '–17 (OH•)', label: 'Loss of OH radical' },
      { mz: '–18 (H₂O)', label: 'Dehydration (very common, often base peak)' },
      { mz: '–28 (H₂O+CO)', label: 'Sequential losses' },
      { mz: '–31 (CH₂OH)', label: 'Primary alcohol: loss of CH₂OH' },
    ],
    characteristic: 'Often no M⁺ in EI (too labile). Strong M–18 peak. Primary alcohols: m/z 31.',
    example: 'Ethanol EI: M⁺ 46 (weak), m/z 31 (CH₂OH⁺) base peak, m/z 45 (CHO⁺).',
    examTip: 'Tertiary alcohols frequently show no M⁺ at all in EI — the M–18 ion may appear to be the molecular ion. Always check for water loss.',
  },
  {
    name: 'Aromatic ring',
    color: '#2563eb',
    losses: [
      { mz: '77 (C₆H₅⁺)', label: 'Phenyl cation (from benzene substituted compounds)' },
      { mz: '91 (C₇H₇⁺)', label: 'Tropylium cation (from benzyl groups — very stable)' },
      { mz: '65 (C₅H₅⁺)', label: 'Cyclopentadienyl from tropylium → –26 (C₂H₂)' },
      { mz: '–77', label: 'Loss of phenyl group' },
    ],
    characteristic: 'Tropylium (m/z 91) is one of the most recognised ions in MS. Phenyl (m/z 77) shows loss of 26 (C₂H₂) to give m/z 51.',
    example: 'Toluene: M⁺ 92, loss of H → tropylium m/z 91 (base peak), then –C₂H₂ → m/z 65.',
    examTip: 'm/z 77:51 pair (77 loses C₂H₂ to give 51) is diagnostic for a monosubstituted benzene ring.',
  },
  {
    name: 'Halogen (Cl/Br)',
    color: '#64748b',
    losses: [
      { mz: '–35/37 (Cl)', label: 'Loss of Cl radical (M–35 and M–37 in ~3:1 ratio)' },
      { mz: '–36/38 (HCl)', label: 'Loss of HCl (M–36 and M–38 in ~3:1 ratio)' },
      { mz: '–79/81 (Br)', label: 'Loss of Br radical (M–79 and M–81 in ~1:1 ratio)' },
      { mz: '–80/82 (HBr)', label: 'Loss of HBr (M–80 and M–82 in ~1:1 ratio)' },
    ],
    characteristic: 'Cl: M and M+2 in 3:1 ratio. Br: M and M+2 in ~1:1 ratio. Highly diagnostic.',
    example: 'Chlorobenzene: M⁺ 112/114 (3:1). Bromobenzene: M⁺ 156/158 (1:1).',
    examTip: 'The isotope pattern is usually visible by inspection. Bromine gives an almost equal doublet — unmistakable. A compound with both Cl and Br gives a 3-peak pattern.',
  },
  {
    name: 'Ketone',
    color: '#f59e0b',
    losses: [
      { mz: '–28 (CO)', label: 'Loss of carbon monoxide (very common for ketones)' },
      { mz: '–43 (CH₃CO)', label: 'Loss of acetyl (methyl ketones → base peak)' },
      { mz: '–29 (CHO)', label: 'Loss of formyl (aldehyde)' },
      { mz: '–57 (C₃H₅O)', label: 'α-cleavage product' },
    ],
    characteristic: 'α-cleavage on both sides of C=O → two acylium ions. McLafferty if γ-H present.',
    example: 'Acetophenone: α-cleavage → m/z 77 (phenyl) and m/z 105 (benzoyl, base peak).',
    examTip: 'For methyl ketones (RCOCH₃), loss of 43 (CH₃CO⁺) is almost always the base peak. Identify the remaining fragment for the R group.',
  },
  {
    name: 'Sulfur compounds',
    color: '#84cc16',
    losses: [
      { mz: '–34 (H₂S)', label: 'Loss of H₂S (thiol)' },
      { mz: '–48 (SO)', label: 'Loss of SO (sulfoxide)' },
      { mz: '–64 (SO₂)', label: 'Loss of SO₂ (sulfonate, sulfone)' },
    ],
    characteristic: 'M+2 peak ~4.4% per S atom (³⁴S). Soft indicator — compare with Cl/Br patterns.',
    example: 'Dimethyl sulfoxide: M⁺ 78, loss of 48 (SO) → m/z 30.',
    examTip: 'The M+2 from sulfur is much weaker than from Cl or Br. Look for SO₂ loss (64) to confirm sulfone/sulfonate.',
  },
]

// ─── Practice compounds ───────────────────────────────────────────────────────

const PRACTICE_COMPOUNDS = [
  {
    name: 'Paracetamol (acetaminophen)',
    formula: 'C₈H₉NO₂',
    mw: 151,
    peaks: [
      { mz: 151, intensity: 100, label: 'M⁺' },
      { mz: 109, intensity: 85,  label: 'M–42 (loss of ketene, C₂H₂O)' },
      { mz: 80,  intensity: 30,  label: 'M–71 (loss of NHCOCH₃)' },
      { mz: 65,  intensity: 20,  label: 'Cyclopentadienyl' },
    ],
    hint: 'Look at the molecular weight and the key loss of 42 (ketene from an acetamide group). What common analgesic has MW 151 and an acetamide functional group?',
    explanation: 'The molecular ion at m/z 151 (MW 151 for C₈H₉NO₂). Loss of 42 (CH₂=C=O, ketene) from the acetamide group is highly diagnostic — gives m/z 109. The nitrogen rule: MW 151 is odd, consistent with one nitrogen. Paracetamol is the only common OTC analgesic with this MW and acetamide group.',
    groups: ['Acetamide', 'Phenol', 'Aromatic'],
  },
  {
    name: 'Ibuprofen',
    formula: 'C₁₃H₁₈O₂',
    mw: 206,
    peaks: [
      { mz: 206, intensity: 30,  label: 'M⁺ (weak — common for carboxylic acids)' },
      { mz: 161, intensity: 100, label: 'M–45: loss of CO₂H (base peak)' },
      { mz: 133, intensity: 60,  label: 'M–73: further fragmentation' },
      { mz: 105, intensity: 45,  label: 'Isobutylphenyl cation' },
    ],
    hint: 'Common NSAID. MW 206, no nitrogen (even MW). Very weak M⁺. Base peak from loss of 45 (CO₂H). Look for an isobutyl substituted benzene pattern.',
    explanation: 'MW 206, formula C₁₃H₁₈O₂ (no nitrogen). Carboxylic acids in EI show weak M⁺ and strong loss of CO₂H (–45) → base peak at m/z 161. The fragment at 105 is the isobutylphenyl cation. DBE = (2×13 + 2 – 18)/2 = 5, consistent with one benzene ring (DBE 4) plus no additional unsaturation.',
    groups: ['Carboxylic acid', 'Aromatic', 'Alkyl'],
  },
  {
    name: 'Chlorpromazine',
    formula: 'C₁₇H₁₉ClN₂S',
    mw: 318,
    peaks: [
      { mz: 318, intensity: 100, label: 'M⁺ (base peak)' },
      { mz: 320, intensity: 33,  label: 'M+2 (¹³Cl isotope — confirms 1×Cl)' },
      { mz: 272, intensity: 45,  label: 'M–46: loss of dimethylaminoethyl side chain fragment' },
      { mz: 58,  intensity: 70,  label: 'Dimethylaminoethyl cation' },
    ],
    hint: 'This compound has MW 318 with a very characteristic M:M+2 ratio. Count the nitrogen atoms from the nitrogen rule (odd M⁺ = odd N). What antipsychotic drug family has a phenothiazine core?',
    explanation: 'M⁺ at 318, M+2 at 320 in ~3:1 ratio — diagnostic for one chlorine atom. MW 318 is even, but contains 2 N — even+even nitrogen → even MW. The phenothiazine core (containing S) gives a stable M⁺ as base peak. Dimethylaminopropyl side chain loss gives m/z 58 (dimethylaminoethyl cation, a common fragment for this drug class).',
    groups: ['Aromatic', 'Halogen (Cl)', 'Amine', 'Sulfur'],
  },
  {
    name: 'Aspirin',
    formula: 'C₉H₈O₄',
    mw: 180,
    peaks: [
      { mz: 180, intensity: 30,  label: 'M⁺ (weak)' },
      { mz: 138, intensity: 100, label: 'M–42: McLafferty / loss of ketene (base peak)' },
      { mz: 120, intensity: 50,  label: 'M–60: loss of acetic acid (McLafferty)' },
      { mz: 92,  intensity: 35,  label: 'Loss of CO₂ from m/z 138' },
    ],
    hint: 'No nitrogen. MW 180. Very characteristic losses of 42 (ketene) and 60 (acetic acid via McLafferty rearrangement). What common analgesic is an acetylated salicylate?',
    explanation: 'MW 180 (even, no N). Loss of 42 (CH₂=C=O, ketene from the acetyl ester) → m/z 138. McLafferty rearrangement gives loss of 60 (acetic acid CH₃COOH) → m/z 120. These paired losses of 42 and 60 are extremely diagnostic for an acetate ester with a γ-hydrogen. DBE = (2×9 + 2 – 8)/2 = 6: benzene ring (4) + 2 C=O groups (2).',
    groups: ['Ester', 'Carboxylic acid', 'Aromatic'],
  },
  {
    name: 'Caffeine',
    formula: 'C₈H₁₀N₄O₂',
    mw: 194,
    peaks: [
      { mz: 194, intensity: 100, label: 'M⁺ (base peak — stable aromatic system)' },
      { mz: 109, intensity: 65,  label: 'Loss of 85 (C₃H₅N₂O or C₄H₅NO)' },
      { mz: 82,  intensity: 55,  label: 'Imidazolium fragment' },
      { mz: 55,  intensity: 40,  label: 'C₂HN₂⁺ fragment' },
    ],
    hint: 'MW 194 but even — count the nitrogens (4 N, all contributing +2 each to MW, net even). Stable M⁺ as base peak. This is a methylxanthine. Very strong M⁺ from the aromatic purine-like system.',
    explanation: 'Four nitrogens: N rule says 4 N = even contribution to MW → even MW despite 4 N. The purine/methylxanthine system is highly aromatic and gives a very stable M⁺ as base peak. DBE = (2×8 + 2 + 4 – 10)/2 = 6: the xanthine bicyclic ring system. Fragments at 109 and 82 are characteristic xanthine ring fragments seen consistently across methylxanthines.',
    groups: ['Aromatic', 'Amine', 'Ketone (xanthine C=O)'],
  },
  {
    name: 'Diazepam',
    formula: 'C₁₆H₁₃ClN₂O',
    mw: 284,
    peaks: [
      { mz: 284, intensity: 100, label: 'M⁺ (base peak)' },
      { mz: 286, intensity: 33,  label: 'M+2 (Cl isotope — 1×Cl confirmed)' },
      { mz: 256, intensity: 60,  label: 'M–28: loss of CO' },
      { mz: 221, intensity: 45,  label: 'M–63: loss of CO + Cl' },
    ],
    hint: 'MW 284. Even MW despite 2 N — even number of nitrogens. Strong M:M+2 ratio of 3:1 confirms one chlorine. What benzodiazepine has MW 284 and is the world\'s most famous anxiolytic?',
    explanation: 'MW 284 (even; 2 N, each +0 net to parity rules). M:M+2 = 3:1 confirms exactly 1 Cl. M⁺ is the base peak — the benzodiazepine ring system is stable enough to survive EI without significant fragmentation. Loss of CO (–28) from the lactam carbonyl gives m/z 256. DBE = (2×16 + 2 + 2 – 13)/2 = 12: aromatic + the 7-membered benzodiazepine ring.',
    groups: ['Aromatic', 'Halogen (Cl)', 'Amine', 'Ketone'],
  },
]

// ─── Spectrum canvas ──────────────────────────────────────────────────────────

function SpectrumCanvas({ peaks }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !peaks.length) return

    const dpr = window.devicePixelRatio || 1
    const W = canvas.offsetWidth
    const H = canvas.offsetHeight
    canvas.width = W * dpr
    canvas.height = H * dpr
    const ctx = canvas.getContext('2d')
    ctx.scale(dpr, dpr)

    const pad = { top: 20, right: 20, bottom: 40, left: 52 }
    const cW = W - pad.left - pad.right
    const cH = H - pad.top - pad.bottom

    const maxMz = Math.max(...peaks.map(p => p.mz)) * 1.08
    const minMz = Math.max(0, Math.min(...peaks.map(p => p.mz)) * 0.9)

    ctx.clearRect(0, 0, W, H)
    ctx.fillStyle = 'white'
    ctx.fillRect(0, 0, W, H)

    const xS = mz => pad.left + ((mz - minMz) / (maxMz - minMz)) * cW
    const yS = pct => pad.top + cH - (pct / 100) * cH

    // Grid
    ctx.strokeStyle = 'rgba(0,0,0,0.06)'
    ctx.lineWidth = 1
    for (let y = 0; y <= 100; y += 25) {
      ctx.beginPath()
      ctx.moveTo(pad.left, yS(y))
      ctx.lineTo(pad.left + cW, yS(y))
      ctx.stroke()
    }

    // Axes
    ctx.strokeStyle = '#d1d5db'
    ctx.lineWidth = 1
    ctx.strokeRect(pad.left, pad.top, cW, cH)

    // Y labels
    ctx.fillStyle = '#374151'
    ctx.font = '10px sans-serif'
    ctx.textAlign = 'right'
    for (let y = 0; y <= 100; y += 25) {
      ctx.fillText(y + '%', pad.left - 4, yS(y) + 3)
    }

    // Axis labels
    ctx.textAlign = 'center'
    ctx.fillText('m/z', pad.left + cW / 2, H - 5)
    ctx.save()
    ctx.translate(12, pad.top + cH / 2)
    ctx.rotate(-Math.PI / 2)
    ctx.fillText('Relative intensity', 0, 0)
    ctx.restore()

    // Bars
    const basePeak = [...peaks].sort((a, b) => b.intensity - a.intensity)[0]
    peaks.forEach(peak => {
      const x = xS(peak.mz)
      const isBase = peak.mz === basePeak.mz
      ctx.strokeStyle = isBase ? '#2563eb' : '#6b7280'
      ctx.lineWidth = isBase ? 2 : 1.5
      ctx.beginPath()
      ctx.moveTo(x, pad.top + cH)
      ctx.lineTo(x, yS(peak.intensity))
      ctx.stroke()

      // m/z label above bar
      ctx.fillStyle = isBase ? '#2563eb' : '#374151'
      ctx.font = isBase ? 'bold 10px sans-serif' : '10px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(peak.mz, x, yS(peak.intensity) - 4)
    })

    // X tick marks
    const xRange = maxMz - minMz
    const tickStep = xRange > 400 ? 100 : xRange > 200 ? 50 : xRange > 100 ? 20 : 10
    ctx.fillStyle = '#374151'
    ctx.font = '10px sans-serif'
    ctx.textAlign = 'center'
    for (let mz = Math.ceil(minMz / tickStep) * tickStep; mz <= maxMz; mz += tickStep) {
      const x = xS(mz)
      ctx.fillText(mz, x, pad.top + cH + 16)
    }
  }, [peaks])

  return (
    <canvas ref={canvasRef}
      style={{ width: '100%', height: '220px', borderRadius: '8px', border: '1px solid #e5e7eb', background: 'white' }} />
  )
}

// ─── Parse peaks from text input ─────────────────────────────────────────────

function parsePeaks(text) {
  const peaks = []
  const lines = text.split(/[\n,;]+/)
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) continue
    // "150 100" or "150:100" or "m/z 150 (100%)" formats
    const match = trimmed.match(/(\d+(?:\.\d+)?)\s*[:/\s]\s*(\d+(?:\.\d+)?)/)
    if (match) {
      peaks.push({ mz: parseFloat(match[1]), intensity: parseFloat(match[2]) })
    } else {
      const solo = trimmed.match(/^(\d+(?:\.\d+)?)$/)
      if (solo) peaks.push({ mz: parseFloat(solo[1]), intensity: 100 })
    }
  }
  return peaks.filter(p => p.mz > 0 && p.intensity > 0).sort((a, b) => a.mz - b.mz)
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function MassSpecPage() {
  const [tab, setTab] = useState('analyser')

  // Analyser state
  const [formula, setFormula] = useState('C₉H₈O₄')
  const [formulaInput, setFormulaInput] = useState('C9H8O4')
  const [peakText, setPeakText] = useState('180 30\n138 100\n120 50\n92 35')
  const [mode, setMode] = useState('EI')
  const [analysing, setAnalysing] = useState(false)
  const [result, setResult] = useState(null)
  const [peaks, setPeaks] = useState([])

  // Fragmentation rules state
  const [selectedGroup, setSelectedGroup] = useState(0)

  // Practice state
  const [practiceIdx, setPracticeIdx] = useState(0)
  const [showHint, setShowHint] = useState(false)
  const [showAnswer, setShowAnswer] = useState(false)
  const [practiceGuess, setPracticeGuess] = useState('')

  const compound = PRACTICE_COMPOUNDS[practiceIdx]

  function runAnalysis() {
    const cleanFormula = formulaInput.replace(/[₀₁₂₃₄₅₆₇₈₉]/g, d =>
      '₀₁₂₃₄₅₆₇₈₉'.indexOf(d)).replace(/\s/g, '')
    const normalFormula = formulaInput.replace(/[₀-₉]/g, c =>
      String.fromCharCode(c.charCodeAt(0) - 0x2080 + 48)).replace(/\s/g, '')

    const parsedPeaks = parsePeaks(peakText)
    if (parsedPeaks.length === 0) return

    setPeaks(parsedPeaks)
    const res = analyseSpectrum({ formula: normalFormula, peaks: parsedPeaks, mode })
    setResult(res)
    setAnalysing(false)
  }

  const btn = active => ({
    padding: '6px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: active ? '600' : '400',
    border: active ? '2px solid #2563eb' : '1px solid #d1d5db',
    background: active ? '#eff6ff' : 'white', color: active ? '#1d4ed8' : '#374151',
  })

  const tabBtn = active => ({
    padding: '8px 20px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: active ? '600' : '400',
    border: 'none', background: active ? '#111827' : 'transparent', color: active ? 'white' : '#6b7280',
  })

  return (
    <main style={{ maxWidth: '980px', margin: '0 auto', padding: '2rem 1rem', fontFamily: 'sans-serif' }}>
      <a href="/tools" style={{ fontSize: '13px', color: '#6b7280', textDecoration: 'none' }}>← Tools</a>
      <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#111827', margin: '1rem 0 4px' }}>Mass Spectrometry Interpreter</h1>
      <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '1.5rem', lineHeight: '1.6' }}>
        Enter a molecular formula and m/z peaks to identify neutral losses, characteristic ions, and isotope patterns. Designed for pharmaceutical and biopharmaceutical sciences students.
      </p>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', background: '#f3f4f6', borderRadius: '10px', padding: '4px', marginBottom: '1.5rem', width: 'fit-content' }}>
        {[['analyser', 'Spectrum Analyser'], ['rules', 'Fragmentation Rules'], ['practice', 'Practice Mode']].map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)} style={tabBtn(tab === key)}>{label}</button>
        ))}
      </div>

      {/* ─── TAB 1: ANALYSER ─── */}
      {tab === 'analyser' && (
        <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: '1.5rem' }}>

          {/* Left: Inputs */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

            <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '14px 16px' }}>
              <p style={{ fontSize: '11px', color: '#9ca3af', fontWeight: '600', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Compound</p>

              <div style={{ marginBottom: '10px' }}>
                <label style={{ fontSize: '12px', color: '#374151', display: 'block', marginBottom: '4px' }}>Molecular formula</label>
                <input
                  value={formulaInput}
                  onChange={e => setFormulaInput(e.target.value)}
                  placeholder="e.g. C9H8O4"
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '14px', fontWeight: '600', boxSizing: 'border-box', background: 'white' }}
                />
                <p style={{ fontSize: '11px', color: '#9ca3af', marginTop: '3px' }}>Use standard notation: C9H8O4, C17H19ClN2S, etc.</p>
              </div>

              <div>
                <label style={{ fontSize: '12px', color: '#374151', display: 'block', marginBottom: '4px' }}>Ionisation mode</label>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button onClick={() => setMode('EI')} style={btn(mode === 'EI')}>EI (electron ionisation)</button>
                  <button onClick={() => setMode('ESI')} style={btn(mode === 'ESI')}>ESI</button>
                </div>
              </div>
            </div>

            <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '14px 16px' }}>
              <p style={{ fontSize: '11px', color: '#9ca3af', fontWeight: '600', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Peaks</p>
              <label style={{ fontSize: '12px', color: '#374151', display: 'block', marginBottom: '4px' }}>m/z and relative intensity (one per line)</label>
              <textarea
                value={peakText}
                onChange={e => setPeakText(e.target.value)}
                placeholder={'180 30\n138 100\n120 50\n92 35'}
                rows={8}
                style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '13px', fontFamily: 'monospace', boxSizing: 'border-box', background: 'white', resize: 'vertical' }}
              />
              <p style={{ fontSize: '11px', color: '#9ca3af', marginTop: '3px' }}>Format: <code style={{ background: '#f3f4f6', padding: '1px 4px', borderRadius: '4px' }}>mz intensity</code> — intensity as 0–100 (relative). Base peak = 100.</p>
            </div>

            <button onClick={runAnalysis}
              style={{ padding: '10px', background: '#111827', color: 'white', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>
              Analyse spectrum →
            </button>

            {/* Quick-load examples */}
            <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '12px 14px' }}>
              <p style={{ fontSize: '11px', color: '#9ca3af', fontWeight: '600', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Quick-load examples</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {PRACTICE_COMPOUNDS.slice(0, 4).map(c => (
                  <button key={c.name} onClick={() => {
                    setFormulaInput(c.formula.replace(/[₀-₉]/g, ch => String.fromCharCode(ch.charCodeAt(0) - 0x2080 + 48)))
                    setPeakText(c.peaks.map(p => `${p.mz} ${p.intensity}`).join('\n'))
                  }}
                    style={{ padding: '6px 10px', background: 'white', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '12px', color: '#374151', cursor: 'pointer', textAlign: 'left' }}>
                    {c.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Results */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {result ? (
              <>
                {/* Spectrum visualisation */}
                <SpectrumCanvas peaks={peaks} />

                {/* Key metrics */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                  {[
                    { label: 'Monoisotopic MW', value: result.mw.toFixed(4) },
                    { label: 'Degrees of unsaturation', value: result.dbe % 1 === 0 ? result.dbe : result.dbe.toFixed(1) },
                    { label: 'Base peak', value: 'm/z ' + result.basePeak?.mz },
                  ].map(m => (
                    <div key={m.label} style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '10px 12px' }}>
                      <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '2px' }}>{m.label}</div>
                      <div style={{ fontSize: '17px', fontWeight: '700', color: '#111827' }}>{m.value}</div>
                    </div>
                  ))}
                </div>

                {/* Adduct ions */}
                <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '12px 14px' }}>
                  <p style={{ fontSize: '12px', fontWeight: '600', color: '#111827', margin: '0 0 8px' }}>Expected molecular ions ({mode})</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {result.adducts.filter(a => mode === 'EI' ? a.label === '[M]⁺•' : !a.label.includes('⁺•')).map(a => {
                      const found = peaks.find(p => Math.abs(p.mz - a.mz) < 0.5)
                      return (
                        <div key={a.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 8px', background: found ? '#f0fdf4' : 'white', border: `1px solid ${found ? '#bbf7d0' : '#e5e7eb'}`, borderRadius: '6px' }}>
                          <span style={{ fontSize: '13px', fontWeight: '600', color: '#111827' }}>{a.label}</span>
                          <span style={{ fontSize: '13px', color: '#6b7280' }}>{a.mz}</span>
                          <span style={{ fontSize: '11px', color: found ? '#16a34a' : '#9ca3af' }}>{found ? `✓ found (${found.intensity}%)` : a.note}</span>
                        </div>
                      )
                    })}
                    {mode === 'ESI' && result.adducts.map(a => {
                      const found = peaks.find(p => Math.abs(p.mz - a.mz) < 0.5)
                      if (!found || a.label === '[M]⁺•') return null
                      return (
                        <div key={a.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 8px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '6px' }}>
                          <span style={{ fontSize: '13px', fontWeight: '600', color: '#111827' }}>{a.label}</span>
                          <span style={{ fontSize: '13px', color: '#6b7280' }}>{a.mz}</span>
                          <span style={{ fontSize: '11px', color: '#16a34a' }}>✓ found ({found.intensity}%)</span>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Neutral losses */}
                {result.matchedLosses.length > 0 && (
                  <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '12px 14px' }}>
                    <p style={{ fontSize: '12px', fontWeight: '600', color: '#111827', margin: '0 0 8px' }}>Identified neutral losses</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                      {result.matchedLosses.slice(0, 8).map((m, i) => (
                        <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '8px', padding: '6px 8px', background: 'white', border: '1px solid #e5e7eb', borderRadius: '6px', alignItems: 'center' }}>
                          <div>
                            <div style={{ fontSize: '12px', fontWeight: '600', color: '#111827' }}>
                              {m.fromMz} → {m.toMz} <span style={{ color: '#ef4444' }}>−{m.loss}</span> ({m.formula})
                            </div>
                            <div style={{ fontSize: '11px', color: '#6b7280' }}>{m.label} · suggests: {m.groups.join(', ')}</div>
                          </div>
                          <div style={{ fontSize: '11px', color: '#9ca3af', textAlign: 'right' }}>{m.intensity}%</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Isotope notes */}
                <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '10px', padding: '10px 14px', fontSize: '12px', color: '#1e40af' }}>
                  <strong>Isotope pattern:</strong>
                  <ul style={{ margin: '4px 0 0 16px', padding: 0 }}>
                    {result.isotopeNotes.map((n, i) => <li key={i} style={{ marginBottom: '2px' }}>{n}</li>)}
                  </ul>
                </div>

              </>
            ) : (
              <div style={{ background: '#f9fafb', border: '1px dashed #d1d5db', borderRadius: '12px', padding: '3rem', textAlign: 'center', color: '#9ca3af' }}>
                <div style={{ fontSize: '32px', marginBottom: '12px' }}>⚗️</div>
                <p style={{ fontSize: '14px', margin: '0 0 4px', color: '#6b7280' }}>Enter a formula and peaks, then click Analyse</p>
                <p style={{ fontSize: '12px', margin: 0 }}>Try loading one of the examples on the left</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── TAB 2: FRAGMENTATION RULES ─── */}
      {tab === 'rules' && (
        <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: '1.5rem' }}>

          {/* Group list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <p style={{ fontSize: '11px', color: '#9ca3af', fontWeight: '600', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Functional group</p>
            {FRAG_GROUPS.map((g, i) => (
              <button key={g.name} onClick={() => setSelectedGroup(i)}
                style={{ padding: '8px 12px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', textAlign: 'left', fontWeight: selectedGroup === i ? '600' : '400',
                  border: selectedGroup === i ? `2px solid ${g.color}` : '1px solid #e5e7eb',
                  background: selectedGroup === i ? g.color + '15' : 'white',
                  color: selectedGroup === i ? g.color : '#374151' }}>
                {g.name}
              </button>
            ))}
          </div>

          {/* Group detail */}
          {(() => {
            const g = FRAG_GROUPS[selectedGroup]
            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ background: '#f9fafb', border: `2px solid ${g.color}`, borderRadius: '12px', padding: '16px 18px' }}>
                  <h2 style={{ fontSize: '18px', fontWeight: '700', color: g.color, margin: '0 0 6px' }}>{g.name}</h2>
                  <p style={{ fontSize: '13px', color: '#374151', margin: '0 0 12px', lineHeight: '1.6' }}><strong>Characteristic ions:</strong> {g.characteristic}</p>

                  <p style={{ fontSize: '12px', fontWeight: '600', color: '#374151', margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Common losses / fragments</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginBottom: '12px' }}>
                    {g.losses.map((l, i) => (
                      <div key={i} style={{ display: 'flex', gap: '10px', padding: '6px 10px', background: 'white', border: '1px solid #e5e7eb', borderRadius: '6px', alignItems: 'center' }}>
                        <span style={{ fontSize: '13px', fontWeight: '700', color: g.color, minWidth: '80px', fontFamily: 'monospace' }}>{l.mz}</span>
                        <span style={{ fontSize: '12px', color: '#374151' }}>{l.label}</span>
                      </div>
                    ))}
                  </div>

                  <div style={{ padding: '10px 12px', background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: '8px', marginBottom: '10px' }}>
                    <p style={{ fontSize: '12px', color: '#92400e', margin: '0 0 2px', fontWeight: '600' }}>Example</p>
                    <p style={{ fontSize: '12px', color: '#92400e', margin: 0 }}>{g.example}</p>
                  </div>

                  <div style={{ padding: '10px 12px', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px' }}>
                    <p style={{ fontSize: '12px', color: '#1e40af', margin: '0 0 2px', fontWeight: '600' }}>Exam tip</p>
                    <p style={{ fontSize: '12px', color: '#1e40af', margin: 0 }}>{g.examTip}</p>
                  </div>
                </div>

                {/* Nitrogen rule reminder */}
                <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '12px 14px', fontSize: '12px', color: '#374151' }}>
                  <p style={{ fontWeight: '600', margin: '0 0 6px', color: '#111827' }}>The nitrogen rule (always useful)</p>
                  <p style={{ margin: '0 0 4px' }}>An odd molecular weight in EI indicates an <strong>odd number of nitrogen atoms</strong>. An even MW indicates zero or an even number of N atoms.</p>
                  <p style={{ margin: '0 0 4px' }}>Examples: MW 151 (paracetamol, 1N = odd ✓) · MW 194 (caffeine, 4N = even ✓) · MW 284 (diazepam, 2N = even ✓)</p>
                  <p style={{ margin: 0, color: '#6b7280' }}>Caveat: only applies to EI where the molecular ion is a radical cation M⁺•. In ESI, [M+H]⁺ shifts the rule by 1.</p>
                </div>
              </div>
            )
          })()}
        </div>
      )}

      {/* ─── TAB 3: PRACTICE ─── */}
      {tab === 'practice' && (
        <div>
          {/* Compound selector */}
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
            {PRACTICE_COMPOUNDS.map((c, i) => (
              <button key={i} onClick={() => { setPracticeIdx(i); setShowHint(false); setShowAnswer(false); setPracticeGuess('') }}
                style={{ padding: '6px 14px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px',
                  fontWeight: practiceIdx === i ? '600' : '400',
                  border: practiceIdx === i ? '2px solid #2563eb' : '1px solid #d1d5db',
                  background: practiceIdx === i ? '#eff6ff' : 'white',
                  color: practiceIdx === i ? '#1d4ed8' : '#374151' }}>
                Compound {i + 1}
              </button>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>

            {/* Left: spectrum data */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '14px 16px' }}>
                <p style={{ fontSize: '11px', color: '#9ca3af', fontWeight: '600', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Spectrum data</p>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
                  <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '8px 10px' }}>
                    <div style={{ fontSize: '11px', color: '#6b7280' }}>Molecular formula</div>
                    <div style={{ fontSize: '15px', fontWeight: '700', color: '#111827' }}>{compound.formula}</div>
                  </div>
                  <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '8px 10px' }}>
                    <div style={{ fontSize: '11px', color: '#6b7280' }}>MW (nominal)</div>
                    <div style={{ fontSize: '15px', fontWeight: '700', color: '#111827' }}>{compound.mw}</div>
                  </div>
                </div>

                <SpectrumCanvas peaks={compound.peaks} />

                {/* Peak table */}
                <table style={{ width: '100%', fontSize: '12px', marginTop: '10px', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#f3f4f6' }}>
                      <th style={{ padding: '5px 8px', textAlign: 'left', fontWeight: '600', color: '#374151' }}>m/z</th>
                      <th style={{ padding: '5px 8px', textAlign: 'right', fontWeight: '600', color: '#374151' }}>Intensity</th>
                      <th style={{ padding: '5px 8px', textAlign: 'left', fontWeight: '600', color: '#374151', paddingLeft: '12px' }}>Note</th>
                    </tr>
                  </thead>
                  <tbody>
                    {compound.peaks.map((p, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid #f3f4f6' }}>
                        <td style={{ padding: '5px 8px', fontWeight: '600', fontFamily: 'monospace' }}>{p.mz}</td>
                        <td style={{ padding: '5px 8px', textAlign: 'right', color: p.intensity === 100 ? '#2563eb' : '#374151', fontWeight: p.intensity === 100 ? '600' : '400' }}>{p.intensity}%</td>
                        <td style={{ padding: '5px 8px', color: '#6b7280', paddingLeft: '12px' }}>{p.label}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div style={{ marginTop: '10px', padding: '7px 10px', background: '#f3f4f6', borderRadius: '6px', fontSize: '11px', color: '#6b7280' }}>
                  Functional groups present: {compound.groups.join(' · ')}
                </div>
              </div>

              {/* Hint */}
              <button onClick={() => setShowHint(!showHint)}
                style={{ padding: '8px 14px', background: 'white', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '12px', color: '#6b7280', cursor: 'pointer', textAlign: 'left' }}>
                {showHint ? '▲ Hide hint' : '▼ Show hint'}
              </button>
              {showHint && (
                <div style={{ padding: '10px 14px', background: '#fef9c3', border: '1px solid #fde047', borderRadius: '8px', fontSize: '12px', color: '#854d0e', lineHeight: '1.6' }}>
                  {compound.hint}
                </div>
              )}
            </div>

            {/* Right: guess + answer */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '14px 16px' }}>
                <p style={{ fontSize: '12px', fontWeight: '600', color: '#111827', margin: '0 0 10px' }}>Your interpretation</p>
                <p style={{ fontSize: '12px', color: '#6b7280', margin: '0 0 8px', lineHeight: '1.6' }}>
                  Based on the molecular formula, MW, and fragmentation pattern — what drug or compound do you think this is?
                </p>
                <textarea
                  value={practiceGuess}
                  onChange={e => setPracticeGuess(e.target.value)}
                  placeholder="Type your interpretation here. Consider: MW, nitrogen rule, key neutral losses, base peak, DBE..."
                  rows={5}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '13px', boxSizing: 'border-box', background: 'white', resize: 'vertical' }}
                />
                <button onClick={() => setShowAnswer(true)}
                  style={{ marginTop: '8px', width: '100%', padding: '8px', background: '#111827', color: 'white', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
                  Reveal answer →
                </button>
              </div>

              {showAnswer && (
                <div style={{ background: '#f0fdf4', border: '2px solid #bbf7d0', borderRadius: '12px', padding: '14px 16px' }}>
                  <p style={{ fontSize: '14px', fontWeight: '700', color: '#15803d', margin: '0 0 8px' }}>
                    ✓ {compound.name}
                  </p>
                  <p style={{ fontSize: '12px', color: '#374151', lineHeight: '1.65', margin: 0 }}>{compound.explanation}</p>
                </div>
              )}

              {/* Reference quick-access */}
              <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '10px 14px', fontSize: '12px', color: '#374151' }}>
                <p style={{ fontWeight: '600', margin: '0 0 6px', color: '#111827' }}>Quick reference while solving</p>
                <ul style={{ margin: 0, padding: '0 0 0 16px', color: '#6b7280', lineHeight: '1.8' }}>
                  <li>Odd MW → odd number of N atoms (nitrogen rule)</li>
                  <li>M:M+2 ≈ 3:1 → one Cl; ≈ 1:1 → one Br</li>
                  <li>m/z 91 → tropylium (benzyl); m/z 77 → phenyl</li>
                  <li>Loss of 15 → CH₃; loss of 28 → CO; loss of 44 → CO₂</li>
                  <li>Loss of 18 → H₂O (alcohol or acid); loss of 42 → ketene (acetamide/ester)</li>
                  <li>DBE = (2C + 2 + N − H − X) / 2 · benzene ring = 4</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}