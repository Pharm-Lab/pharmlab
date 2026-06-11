'use client'
import { useState, useEffect, useRef, useMemo } from 'react'

// ─── Data ─────────────────────────────────────────────────────────

const FUNCTIONAL_GROUPS = [
  {
    id: 'carboxylic_acid',
    name: 'Carboxylic acid',
    formula: 'R-COOH',
    pKa: 4.8,
    pKaRange: '3.5 – 5.0',
    type: 'acid',
    category: 'Oxygen acids',
    color: '#fca5a5',
    bg: '#fef2f2',
    border: '#fecaca',
    dark: '#991b1b',
    plain: 'Carboxylic acids are moderately strong organic acids — much stronger than alcohols or water.',
    reason: 'Resonance stabilisation of the conjugate base (carboxylate). The negative charge is delocalised equally over two oxygen atoms, lowering the energy of the conjugate base dramatically. This is the main reason carboxylic acids are ~10¹¹ times more acidic than alcohols.',
    effects: [
      { group: 'Electron-withdrawing (e.g. Cl, CF₃, NO₂)', effect: 'decreases', why: 'Inductive withdrawal stabilises the negative charge on the conjugate base → lower pKa (stronger acid). e.g. trifluoroacetic acid pKa 0.5 vs acetic acid pKa 4.75.' },
      { group: 'Electron-donating (e.g. CH₃, alkyl)', effect: 'increases', why: 'Alkyl groups donate electron density, destabilising the negative charge → higher pKa (weaker acid). Benzoic acid (pKa 4.2) vs acetic acid (pKa 4.75) — aryl ring slightly withdrawing.' },
    ],
    pharmaLink: 'NSAIDs (ibuprofen pKa 4.4, aspirin pKa 3.5) are carboxylic acids. At stomach pH 1–2, they are largely unionised → absorbed in stomach. At intestinal pH 6–7, more ionised but still absorbed due to huge surface area.',
    examples: [
      { name: 'Acetic acid',          pKa: 4.75 },
      { name: 'Aspirin',              pKa: 3.5  },
      { name: 'Ibuprofen',            pKa: 4.4  },
      { name: 'Benzoic acid',         pKa: 4.2  },
      { name: 'Trifluoroacetic acid', pKa: 0.5  },
      { name: 'Formic acid',          pKa: 3.75 },
    ],
  },
  {
    id: 'phenol',
    name: 'Phenol',
    formula: 'Ar-OH',
    pKa: 10.0,
    pKaRange: '8.0 – 11.0',
    type: 'acid',
    category: 'Oxygen acids',
    color: '#d97706',
    bg: '#fffbeb',
    border: '#fde68a',
    dark: '#92400e',
    plain: 'Phenols are much more acidic than aliphatic alcohols but much less acidic than carboxylic acids.',
    reason: 'Partial resonance stabilisation of the phenoxide conjugate base. The lone pair on the oxygen conjugates with the aromatic ring, delocalising the negative charge onto the ortho and para positions of the ring. Less effective than carboxylate (charge only partially on oxygen) but much more than alkoxide (no resonance at all).',
    effects: [
      { group: 'Electron-withdrawing at ortho/para (NO₂, Cl)', effect: 'decreases', why: 'Withdrawing groups at ortho/para stabilise the phenoxide by withdrawing electron density from positions bearing the negative charge. p-Nitrophenol pKa 7.15 vs phenol pKa 10.0 — massive effect.' },
      { group: 'Electron-donating at ortho/para (CH₃, OH)', effect: 'increases', why: 'Donating groups destabilise the phenoxide. p-Methoxyphenol pKa 10.2 vs phenol pKa 10.0.' },
    ],
    pharmaLink: 'Paracetamol contains a phenol (pKa 9.4) — largely unionised at physiological pH 7.4. Morphine has a phenol (pKa 9.9) contributing to its ionisation profile. Propofol (pKa 11) is a hindered phenol used as IV anaesthetic.',
    examples: [
      { name: 'Phenol',            pKa: 10.0 },
      { name: 'Paracetamol',       pKa: 9.4  },
      { name: 'p-Nitrophenol',     pKa: 7.15 },
      { name: 'p-Methoxyphenol',   pKa: 10.2 },
      { name: 'Morphine (OH)',      pKa: 9.9  },
      { name: '2,4-Dinitrophenol', pKa: 4.0  },
    ],
  },
  {
    id: 'alcohol',
    name: 'Alcohol',
    formula: 'R-OH',
    pKa: 16.0,
    pKaRange: '15 – 18',
    type: 'acid',
    category: 'Oxygen acids',
    color: '#16a34a',
    bg: '#f0fdf4',
    border: '#bbf7d0',
    dark: '#14532d',
    plain: 'Alcohols are very weak acids — not significantly ionised under physiological conditions.',
    reason: 'The alkoxide conjugate base carries a full negative charge localised entirely on one oxygen atom. No resonance delocalisation. Alkyl groups are mildly electron-donating, which further destabilises the negative charge. Result: extremely unfavourable deprotonation.',
    effects: [
      { group: 'Electron-withdrawing α to OH (F, Cl, CF₃)', effect: 'decreases', why: 'Even small inductive effects matter when there is no resonance. CF₃CH₂OH (pKa 12.4) significantly more acidic than CH₃CH₂OH (pKa 16). Inductive effect diminishes rapidly with distance.' },
      { group: 'Electron-donating (alkyl groups)', effect: 'increases', why: 'More substituted alcohols are slightly weaker acids. tert-Butanol pKa 19 > ethanol pKa 16 > methanol pKa 15.5.' },
    ],
    pharmaLink: 'Most alcohols in drug molecules are not significantly ionised at physiological pH. However, the alcohol OH is an important H-bond donor affecting protein binding, solubility, and membrane permeability.',
    examples: [
      { name: 'Methanol',          pKa: 15.5 },
      { name: 'Ethanol',           pKa: 16.0 },
      { name: 'tert-Butanol',      pKa: 19.0 },
      { name: 'Trifluoroethanol',  pKa: 12.4 },
      { name: 'Water',             pKa: 15.7 },
    ],
  },
  {
    id: 'amine',
    name: 'Amine (conjugate acid)',
    formula: 'R-NH₃⁺',
    pKa: 10.5,
    pKaRange: '8 – 11 (aliphatic), 3–6 (aromatic)',
    type: 'base',
    category: 'Nitrogen bases',
    color: '#2563eb',
    bg: '#eff6ff',
    border: '#bfdbfe',
    dark: '#1e40af',
    plain: 'Amines are the most common basic functional group in drugs. The pKa quoted is for the conjugate acid (ammonium ion R-NH₃⁺). A pKa of 10 means the free base form (R-NH₂) is the predominant species above pH 10.',
    reason: 'Lone pair on nitrogen accepts a proton. Aliphatic amines are more basic than aromatic amines because alkyl groups donate electron density to nitrogen, increasing its electron availability. Aromatic amines: the lone pair conjugates with the aromatic ring → less available for protonation → much weaker base (lower pKa of conjugate acid).',
    effects: [
      { group: 'Alkyl substituents on N', effect: 'increases pKa (stronger base)', why: 'Electron donation increases nitrogen electron density. But tertiary > secondary > primary is not linear — steric and solvation effects complicate the trend in solution.' },
      { group: 'Aryl ring directly on N (aniline)', effect: 'decreases pKa dramatically', why: 'Lone pair conjugation with ring — no longer fully available for protonation. Aniline pKa 4.6 vs cyclohexylamine pKa 10.6. This 10⁶ difference is entirely due to resonance.' },
      { group: 'Electron-withdrawing groups on aryl', effect: 'decreases pKa further', why: 'EWG withdraw more electron density from already-depleted nitrogen. p-Nitroaniline pKa 1.0.' },
    ],
    pharmaLink: 'Most drugs are amines (basic drugs). At physiological pH 7.4, drugs with pKa > 7.4 are predominantly protonated (ionised, positively charged). Morphine pKa 9.9 → ~97% ionised at pH 7.4. Diazepam pKa 3.3 → essentially un-ionised at pH 7.4 → highly lipophilic, high CNS penetration.',
    examples: [
      { name: 'Methylamine',       pKa: 10.6 },
      { name: 'Aniline',           pKa: 4.6  },
      { name: 'Morphine',          pKa: 9.9  },
      { name: 'Diazepam',          pKa: 3.3  },
      { name: 'Metformin',         pKa: 11.5 },
      { name: 'p-Nitroaniline',    pKa: 1.0  },
      { name: 'Amphetamine',       pKa: 9.9  },
      { name: 'Chloroquine',       pKa: 8.4  },
    ],
  },
  {
    id: 'imidazole',
    name: 'Imidazole / histidine',
    formula: 'imidazolium',
    pKa: 6.0,
    pKaRange: '5.5 – 7.0',
    type: 'base',
    category: 'Nitrogen bases',
    color: '#7c3aed',
    bg: '#f5f3ff',
    border: '#ddd6fe',
    dark: '#5b21b6',
    plain: 'Imidazole has a pKa close to physiological pH — which is why histidine is the key proton shuttle in enzyme active sites.',
    reason: 'One nitrogen (pyridine-like) is protonated; the other (pyrrole-like) has its lone pair in the aromatic π system. The protonated form (imidazolium) is stabilised by resonance — the positive charge is equally shared over both nitrogens. pKa ~6-7 means imidazole is ~50% protonated at physiological pH, making it an ideal pH-sensitive switch.',
    effects: [
      { group: 'pKa near physiological pH', effect: 'unique biological relevance', why: 'Histidine (pKa 6.0) switches between protonated and deprotonated over the physiological pH range (6.5–7.5). This is why serine proteases (chymotrypsin), carbonic anhydrase, and haemoglobin all use histidine as the catalytic base.' },
    ],
    pharmaLink: 'Imidazole-containing drugs: histamine (H1/H2 receptor agonist), cimetidine (H2 blocker for ulcers), metronidazole (antibiotic). The imidazole ring contributes to metal chelation in antifungals (ketoconazole, fluconazole) — coordinates to the iron in fungal CYP51.',
    examples: [
      { name: 'Imidazole',         pKa: 6.95 },
      { name: 'Histidine',         pKa: 6.0  },
      { name: 'Histamine',         pKa: 5.9  },
      { name: 'Cimetidine',        pKa: 6.8  },
    ],
  },
  {
    id: 'thiol',
    name: 'Thiol',
    formula: 'R-SH',
    pKa: 10.5,
    pKaRange: '8 – 12',
    type: 'acid',
    category: 'Sulfur compounds',
    color: '#0891b2',
    bg: '#ecfeff',
    border: '#a5f3fc',
    dark: '#164e63',
    plain: 'Thiols are significantly more acidic than the corresponding alcohols despite sulfur being less electronegative than oxygen.',
    reason: 'Sulfur is larger than oxygen (3rd row vs 2nd row). Larger atoms hold their electrons in larger, more diffuse orbitals — the negative charge on the sulfide anion (RS⁻) is better stabilised by being spread over a larger volume. Also, the S-H bond is weaker than O-H. Both factors make deprotonation easier despite lower electronegativity of S.',
    effects: [
      { group: 'Compare to alcohol', effect: 'thiol ~6 pKa units more acidic', why: 'Cysteine thiol pKa ~8.3 vs serine alcohol pKa ~13. At physiological pH, cysteine thiol is partially deprotonated — the thiolate (RS⁻) is the nucleophile in Michael additions and disulfide bridges.' },
    ],
    pharmaLink: 'Cysteine residues in proteins: thiolate (pKa 8.3) is a powerful nucleophile — active site of cysteine proteases (papain, caspases). Captopril contains a thiol that chelates zinc in ACE active site. N-acetylcysteine (NAC) used in paracetamol overdose — donates free thiol to conjugate NAPQI.',
    examples: [
      { name: 'Ethanethiol',    pKa: 10.6 },
      { name: 'Cysteine',       pKa: 8.3  },
      { name: 'Hydrogen sulfide', pKa: 7.0 },
      { name: 'Captopril (SH)', pKa: 3.7  },
    ],
  },
  {
    id: 'amide',
    name: 'Amide',
    formula: 'R-CO-NH₂',
    pKa: 17.0,
    pKaRange: '15 – 20 (acid), ~0 (base)',
    type: 'both',
    category: 'Nitrogen bases',
    color: '#0f766e',
    bg: '#f0fdfa',
    border: '#99f6e4',
    dark: '#134e4a',
    plain: 'Amides are extremely weak acids AND extremely weak bases — essentially neutral under all physiological conditions.',
    reason: 'As an acid (N-H deprotonation): the amide anion is destabilised — the negative charge on nitrogen is adjacent to the electron-withdrawing carbonyl but resonance donation of the nitrogen lone pair INTO the carbonyl actually makes the N-H more difficult to remove. As a base (O protonation is more common): the carbonyl oxygen is the preferred site of protonation, but this requires very strong acid. The partial double bond character of C-N (resonance) distributes electron density across the whole amide, making neither N nor O a good proton acceptor.',
    effects: [
      { group: 'Lone pair donation into carbonyl', effect: 'dramatically reduces basicity of N', why: 'Acetamide pKa (conj. acid) ~0 vs acetylamine pKa ~10. The ester of the lone pair into C=O reduces availability for protonation by ~10¹⁰.' },
    ],
    pharmaLink: 'The amide bond is the fundamental linkage in proteins (peptide bond). Its lack of reactivity under physiological conditions is what allows proteins to be stable. In drugs: amide groups improve metabolic stability (less CYP oxidation) and provide H-bond donors/acceptors for protein binding. Paracetamol is an amide (para-aminophenol derivative).',
    examples: [
      { name: 'Acetamide',       pKa: 17.0 },
      { name: 'Benzamide',       pKa: 13.0 },
      { name: 'Paracetamol (NH)', pKa: '~15' },
    ],
  },
  {
    id: 'phosphoric',
    name: 'Phosphate / phosphoric acid',
    formula: 'H₃PO₄',
    pKa: 2.1,
    pKaRange: 'pKa1 2.1 / pKa2 7.2 / pKa3 12.4',
    type: 'acid',
    category: 'Polyprotic acids',
    color: '#be185d',
    bg: '#fdf2f8',
    border: '#fbcfe8',
    dark: '#831843',
    plain: 'Phosphoric acid has three ionisable protons — each with a very different pKa. The second ionisation (pKa 7.2) is critical for biological buffering.',
    reason: 'First ionisation (pKa 2.1): loss of first proton from neutral acid — inductive stabilisation from remaining OH groups and P. Second (pKa 7.2): loss from monoanion — now must overcome repulsion of the existing negative charge. Third (pKa 12.4): loss from dianion — very difficult, strong repulsion from two existing negative charges. The ~5 unit spacing is typical for polyprotic acids.',
    effects: [
      { group: 'pKa₂ = 7.2', effect: 'ideal physiological buffer', why: 'The Henderson-Hasselbalch equation shows maximum buffering capacity at pH = pKa. Phosphate buffer is optimal at pH 7.2 — close to physiological 7.4. Used extensively in cell culture, pharmaceutical formulations, and explains intracellular buffering.' },
    ],
    pharmaLink: 'Phosphate groups on DNA, RNA, ATP, phospholipids — all carry negative charges at physiological pH (pKa₂ 7.2, so mostly dianionic at pH 7.4). Phosphate prodrugs (fosamprenavir, fosphenytoin) improve water solubility dramatically — negatively charged phosphate is very hydrophilic, enzymatically cleaved in vivo to release the active drug.',
    examples: [
      { name: 'H₃PO₄ (pKa₁)',  pKa: 2.1  },
      { name: 'H₂PO₄⁻ (pKa₂)', pKa: 7.2  },
      { name: 'HPO₄²⁻ (pKa₃)', pKa: 12.4 },
    ],
  },
]

const DRUG_TYPES = [
  { id: 'weak_acid', label: 'Weak acid', color: '#fca5a5', example: 'aspirin, ibuprofen, warfarin' },
  { id: 'weak_base', label: 'Weak base', color: '#2563eb', example: 'morphine, amphetamine, chloroquine' },
  { id: 'zwitterion', label: 'Zwitterion (amino acid-like)', color: '#7c3aed', example: 'amino acids, some antibiotics' },
]

// ─── Henderson-Hasselbalch ─────────────────────────────────────────

function fractionUnionised(pH, pKa, type) {
  if (type === 'weak_acid') {
    return 1 / (1 + Math.pow(10, pKa - pH))
  } else {
    // weak base: fraction of free base (unionised) = 1 / (1 + 10^(pKa - pH))
    return 1 / (1 + Math.pow(10, pKa - pH))
  }
}

function fractionProtonated(pH, pKa, type) {
  if (type === 'weak_acid') {
    // protonated = unionised form (HA)
    return 1 / (1 + Math.pow(10, pH - pKa))
  } else {
    // protonated = ionised form (BH+)
    return 1 / (1 + Math.pow(10, pH - pKa))
  }
}

// ─── Canvas for ionisation curve ──────────────────────────────────

function IonisationCanvas({ pKa, drugType, highlightPHs }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const dpr = window.devicePixelRatio || 1
    const W   = canvas.offsetWidth
    const H   = canvas.offsetHeight
    if (!W || !H) return
    canvas.width  = W * dpr
    canvas.height = H * dpr
    const ctx = canvas.getContext('2d')
    ctx.scale(dpr, dpr)

    const pad  = { top: 20, right: 20, bottom: 44, left: 56 }
    const cW   = W - pad.left - pad.right
    const cH   = H - pad.top  - pad.bottom

    const xS = ph => pad.left + ((ph - 0) / 14) * cW
    const yS = f  => pad.top  + (1 - f) * cH

    ctx.clearRect(0, 0, W, H)
    ctx.fillStyle = '#0a0f1e'
    ctx.fillRect(0, 0, W, H)

    // Coloured background zones
    const zones = [
      { x0: 0,   x1: 2,   label: 'Stomach (fasted)', color: '#fef2f2', textColor: '#dc2626' },
      { x0: 5.5, x1: 7.5, label: 'Small intestine', color: '#f0fdf4', textColor: '#16a34a' },
      { x0: 7.0, x1: 7.8, label: 'Blood pH 7.4',   color: '#eff6ff', textColor: '#2563eb' },
    ]
    zones.forEach(z => {
      ctx.fillStyle = z.color; ctx.globalAlpha = 0.5
      ctx.fillRect(xS(z.x0), pad.top, xS(z.x1) - xS(z.x0), cH)
      ctx.globalAlpha = 1
      ctx.fillStyle = z.textColor; ctx.font = '8px sans-serif'; ctx.textAlign = 'center'
      ctx.fillText(z.label, xS((z.x0 + z.x1) / 2), pad.top + 10)
    })

    // Grid
    ctx.strokeStyle = 'rgba(255,255,255,0.07)'; ctx.lineWidth = 1
    for (let i = 0; i <= 7; i++) {
      const ph = i * 2
      ctx.beginPath(); ctx.moveTo(xS(ph), pad.top); ctx.lineTo(xS(ph), pad.top + cH); ctx.stroke()
    }
    for (let i = 0; i <= 4; i++) {
      const y = pad.top + (i / 4) * cH
      ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(pad.left + cW, y); ctx.stroke()
    }

    // Axis labels
    ctx.fillStyle = 'rgba(240,244,255,0.5)'; ctx.font = '10px sans-serif'; ctx.textAlign = 'right'
    for (let i = 0; i <= 4; i++) {
      ctx.fillText((100 - i * 25) + '%', pad.left - 3, pad.top + (i / 4) * cH + 3)
    }
    ctx.textAlign = 'center'
    for (let i = 0; i <= 7; i++) {
      ctx.fillText(i * 2, xS(i * 2), pad.top + cH + 14)
    }

    // Axis titles
    ctx.save()
    ctx.translate(10, pad.top + cH / 2)
    ctx.rotate(-Math.PI / 2)
    ctx.textAlign = 'center'; ctx.font = '9px sans-serif'; ctx.fillStyle = 'rgba(240,244,255,0.3)'
    ctx.fillText('% unionised form', 0, 0)
    ctx.restore()
    ctx.textAlign = 'center'; ctx.font = '9px sans-serif'; ctx.fillStyle = 'rgba(240,244,255,0.3)'
    ctx.fillText('pH', pad.left + cW / 2, H - 6)

    ctx.strokeStyle = 'rgba(255,255,255,0.1)'; ctx.lineWidth = 1
    ctx.strokeRect(pad.left, pad.top, cW, cH)

    // pKa vertical line
    if (pKa >= 0 && pKa <= 14) {
      ctx.strokeStyle = '#f59e0b'; ctx.lineWidth = 1.5; ctx.setLineDash([4, 3])
      ctx.beginPath(); ctx.moveTo(xS(pKa), pad.top); ctx.lineTo(xS(pKa), pad.top + cH); ctx.stroke()
      ctx.setLineDash([])
      ctx.fillStyle = '#f59e0b'; ctx.font = 'bold 9px sans-serif'; ctx.textAlign = 'center'
      ctx.fillText('pKa ' + pKa, xS(pKa), pad.top - 6)
    }

    // Ionisation curve
    // For weak acid: unionised = HA (blue), ionised = A- (red)
    // For weak base: unionised = B (blue), ionised = BH+ (red)
    const nPts = 280
    ctx.lineWidth = 2.5; ctx.lineJoin = 'round'

    // Unionised fraction (blue)
    ctx.strokeStyle = '#2563eb'
    ctx.beginPath()
    for (let i = 0; i <= nPts; i++) {
      const ph = (i / nPts) * 14
      const f  = drugType === 'weak_acid'
        ? 1 / (1 + Math.pow(10, ph - pKa))
        : 1 / (1 + Math.pow(10, pKa - ph))
      const x  = xS(ph)
      const y  = yS(f)
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
    }
    ctx.stroke()

    // Ionised fraction (red dashed)
    ctx.strokeStyle = '#dc2626'; ctx.setLineDash([5, 3])
    ctx.beginPath()
    for (let i = 0; i <= nPts; i++) {
      const ph = (i / nPts) * 14
      const f  = drugType === 'weak_acid'
        ? 1 / (1 + Math.pow(10, pKa - ph))
        : 1 / (1 + Math.pow(10, ph - pKa))
      i === 0 ? ctx.moveTo(xS(ph), yS(f)) : ctx.lineTo(xS(ph), yS(f))
    }
    ctx.stroke()
    ctx.setLineDash([])

    // Highlight pH markers
    const markers = [
      { ph: 1.5,  label: 'Stomach',   color: '#fca5a5' },
      { ph: 6.5,  label: 'Intestine', color: '#16a34a' },
      { ph: 7.4,  label: 'Blood',     color: '#2563eb' },
    ]
    markers.forEach(m => {
      const fu = drugType === 'weak_acid'
        ? 1 / (1 + Math.pow(10, m.ph - pKa))
        : 1 / (1 + Math.pow(10, pKa - m.ph))
      const x  = xS(m.ph)
      const y  = yS(fu)
      ctx.fillStyle = m.color
      ctx.beginPath(); ctx.arc(x, y, 4, 0, Math.PI * 2); ctx.fill()
    })

    // Legend
    const ly = pad.top + cH - 4
    ctx.font = '9px sans-serif'
    ctx.strokeStyle = '#2563eb'; ctx.lineWidth = 2; ctx.setLineDash([])
    ctx.beginPath(); ctx.moveTo(pad.left + 4, ly); ctx.lineTo(pad.left + 16, ly); ctx.stroke()
    ctx.fillStyle = '#2563eb'; ctx.textAlign = 'left'
    ctx.fillText(drugType === 'weak_acid' ? 'Unionised (HA)' : 'Unionised (B)', pad.left + 18, ly + 3)

    ctx.strokeStyle = '#dc2626'; ctx.setLineDash([4, 2])
    ctx.beginPath(); ctx.moveTo(pad.left + 4, ly - 14); ctx.lineTo(pad.left + 16, ly - 14); ctx.stroke()
    ctx.setLineDash([])
    ctx.fillStyle = '#dc2626'
    ctx.fillText(drugType === 'weak_acid' ? 'Ionised (A⁻)' : 'Ionised (BH⁺)', pad.left + 18, ly - 11)

  }, [pKa, drugType])

  return (
    <canvas ref={canvasRef}
      style={{ width: '100%', height: '260px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.07)', background: '#0a0f1e' }} />
  )
}

// ─── Main page ─────────────────────────────────────────────────────

export default function PKAPage() {
  const [tab, setTab] = useState('explorer')

  // Explorer state
  const [selected, setSelected] = useState('carboxylic_acid')
  const fg = FUNCTIONAL_GROUPS.find(f => f.id === selected)

  // Calculator state
  const [pKa,     setPKa]     = useState(4.4)
  const [rawPKa,  setRawPKa]  = useState('4.4')
  const [drugType, setDrugType] = useState('weak_acid')

  const keyPHs = [
    { ph: 1.5, label: 'Stomach (fasted)', color: '#fca5a5' },
    { ph: 3.5, label: 'Stomach (fed)',    color: '#f97316' },
    { ph: 6.5, label: 'Small intestine', color: '#16a34a' },
    { ph: 7.4, label: 'Blood / plasma',  color: '#2563eb' },
    { ph: 5.0, label: 'Urine (acidic)',  color: '#7c3aed' },
    { ph: 8.0, label: 'Urine (alkaline)', color: '#0891b2' },
  ]

  const calcFractions = (ph) => {
    if (drugType === 'weak_acid') {
      const unionised  = 1 / (1 + Math.pow(10, ph - pKa))
      const ionised    = 1 - unionised
      return { unionised, ionised, label_u: 'HA (unionised)', label_i: 'A⁻ (ionised)' }
    } else {
      const protonated  = 1 / (1 + Math.pow(10, ph - pKa))
      const freebase    = 1 - protonated
      return { unionised: freebase, ionised: protonated, label_u: 'B (free base)', label_i: 'BH⁺ (protonated)' }
    }
  }

  const tabBtn = active => ({
    padding: '8px 20px', cursor: 'pointer', fontSize: '13px',
    fontWeight: tab === active ? '600' : '400',
    border: 'none',
    borderBottom: tab === active ? '2px solid #2a6fdb' : '2px solid transparent',
    background: 'transparent',
    color: tab === active ? '#93b4f7' : 'rgba(240,244,255,0.4)',
    marginBottom: '-1px',
  })

  const btn = (isActive, color = '#2563eb') => ({
    padding: '6px 14px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px',
    fontWeight: isActive ? '600' : '400',
    border: isActive ? `2px solid ${color}` : '1px solid rgba(255,255,255,0.1)',
    background: isActive ? color + '18' : 'rgba(255,255,255,0.04)',
    color: isActive ? color : 'rgba(240,244,255,0.75)',
    transition: 'all 0.12s',
  })

  return (
    <main style={{ maxWidth: '1060px', margin: '0 auto', padding: '2rem 1rem', fontFamily: "'Inter',system-ui,sans-serif", background: '#0a0f1e', minHeight: '100vh', color: '#f0f4ff' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap'); * { box-sizing:border-box; } input[type=range]{ accent-color:#2a6fdb; } input::placeholder,textarea::placeholder{ color:rgba(240,244,255,0.25); }`}</style>
      <a href="/tools" style={{ fontSize: '13px', color: 'rgba(240,244,255,0.4)', textDecoration: 'none', display: 'inline-block', marginBottom: '1rem' }}>← Tools</a>
      <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#f0f4ff', margin: '0 0 4px', letterSpacing: '-0.02em' }}>pKa, Ionisation & Membrane Permeability</h1>
      <p style={{ fontSize: '13px', color: 'rgba(240,244,255,0.5)', marginBottom: '1.5rem', lineHeight: '1.6' }}>
        Understand why functional groups have the pKa values they do, and how ionisation at different pH values determines drug absorption and distribution.
      </p>

      <div style={{ borderBottom: '1px solid rgba(255,255,255,0.07)', marginBottom: '1.5rem', display: 'flex', gap: 0 }}>
        <button onClick={() => setTab('explorer')} style={tabBtn('explorer')}>pKa explorer</button>
        <button onClick={() => setTab('calculator')} style={tabBtn('calculator')}>Ionisation calculator</button>
      </div>

      {/* ── Tab 1: pKa Explorer ── */}
      {tab === 'explorer' && (
        <div>
          {/* Selector */}
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
            {FUNCTIONAL_GROUPS.map(f => (
              <button key={f.id} onClick={() => setSelected(f.id)}
                style={{
                  padding: '6px 14px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px',
                  fontWeight: selected === f.id ? '600' : '400',
                  border: selected === f.id ? `2px solid ${f.color}` : '1px solid rgba(255,255,255,0.1)',
                  background: selected === f.id ? `${f.color}18` : 'rgba(255,255,255,0.04)',
                  color: selected === f.id ? f.color : 'rgba(240,244,255,0.75)',
                  transition: 'all 0.12s',
                }}>
                {f.name}
              </button>
            ))}
          </div>

          {fg && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', alignItems: 'start' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>

                {/* Header */}
                <div style={{ background: `${fg.color}10`, border: `1px solid ${fg.color}33`, borderRadius: '12px', padding: '14px 16px' }}>
                    <div style={{ marginBottom: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', flexWrap: 'wrap', marginBottom: '3px' }}>
                            <span style={{ fontSize: '20px', fontWeight: '700', fontFamily: 'ui-monospace, monospace', color: fg.color }}>{fg.formula}</span>
                            <span style={{ fontSize: '13px', color: fg.color, opacity: 0.7 }}>{fg.name}</span>
                        </div>
                        <span style={{ fontSize: '18px', fontWeight: '700', color: fg.color }}>pKa {fg.pKaRange}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '999px', background: fg.color, color: 'white', fontWeight: '600' }}>
                            {fg.type === 'acid' ? 'Acid' : fg.type === 'base' ? 'Base (pKa of BH⁺)' : 'Acid + Base'}
                        </span>
                        <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '999px', background: 'rgba(255,255,255,0.06)', color: 'rgba(240,244,255,0.45)', border: '1px solid rgba(255,255,255,0.07)' }}>
                            {fg.category}
                        </span>
                    </div>
                    <p style={{ fontSize: '13px', color: 'rgba(240,244,255,0.7)', margin: 0, lineHeight: 1.65 }}>{fg.plain}</p>
                </div>

                {/* Why */}
                <div style={{ background: '#0f1629', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '10px', padding: '12px 14px' }}>
                  <p style={{ fontSize: '11px', fontWeight: '600', color: fg.color, textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 6px' }}>Why this pKa — the reasoning</p>
                  <p style={{ fontSize: '13px', color: 'rgba(240,244,255,0.75)', margin: 0, lineHeight: 1.7 }}>{fg.reason}</p>
                </div>

                {/* Substituent effects */}
                {fg.effects.length > 0 && (
                  <div style={{ background: '#0f1629', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '10px', padding: '12px 14px' }}>
                    <p style={{ fontSize: '11px', fontWeight: '600', color: 'rgba(240,244,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 8px' }}>Substituent effects</p>
                    {fg.effects.map((e, i) => (
                      <div key={i} style={{ marginBottom: i < fg.effects.length - 1 ? '10px' : 0, paddingBottom: i < fg.effects.length - 1 ? '10px' : 0, borderBottom: i < fg.effects.length - 1 ? '1px solid #f3f4f6' : 'none' }}>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '3px' }}>
                          <span style={{ fontSize: '12px', fontWeight: '500', color: 'rgba(240,244,255,0.75)' }}>{e.group}</span>
                          <span style={{ fontSize: '11px', padding: '1px 8px', borderRadius: '999px', background: e.effect.includes('decreases') ? '#fef2f2' : '#f0fdf4', color: e.effect.includes('decreases') ? '#dc2626' : '#16a34a', border: `1px solid ${e.effect.includes('decreases') ? '#fecaca' : '#bbf7d0'}` }}>
                            pKa {e.effect.includes('decreases') ? '↓' : '↑'}
                          </span>
                        </div>
                        <p style={{ fontSize: '12px', color: 'rgba(240,244,255,0.45)', margin: 0, lineHeight: 1.5 }}>{e.why}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {/* Examples */}
                <div style={{ background: '#0f1629', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '10px', padding: '12px 14px' }}>
                  <p style={{ fontSize: '11px', fontWeight: '600', color: 'rgba(240,244,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 10px' }}>pKa values — {fg.name}</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {fg.examples.map(ex => {
                      const maxPKa  = Math.max(...fg.examples.map(e => parseFloat(e.pKa) || 0))
                      const pkaVal  = parseFloat(ex.pKa)
                      const pct     = isNaN(pkaVal) ? 50 : Math.min(pkaVal / Math.max(maxPKa, 1) * 100, 100)
                      return (
                        <div key={ex.name} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ fontSize: '12px', color: 'rgba(240,244,255,0.75)', width: '160px', flexShrink: 0 }}>{ex.name}</span>
                          <div style={{ flex: 1, background: 'rgba(255,255,255,0.1)', borderRadius: '4px', height: '18px', overflow: 'hidden' }}>
                            <div style={{ width: pct + '%', height: '100%', background: fg.color, borderRadius: '4px', minWidth: '24px', display: 'flex', alignItems: 'center', paddingLeft: '6px' }}>
                              <span style={{ fontSize: '10px', color: 'white', fontWeight: '600', whiteSpace: 'nowrap' }}>{ex.pKa}</span>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Pharma relevance */}
                <div style={{ background: `${fg.color}10`, border: `1px solid ${fg.color}33`, borderRadius: '10px', padding: '12px 14px' }}>
                  <p style={{ fontSize: '11px', fontWeight: '600', color: fg.color, textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 6px' }}>Pharmaceutical relevance</p>
                  <p style={{ fontSize: '13px', color: 'rgba(240,244,255,0.75)', margin: 0, lineHeight: 1.7 }}>{fg.pharmaLink}</p>
                </div>

                {/* pKa comparison strip */}
                <div style={{ background: '#0f1629', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '10px', padding: '12px 14px' }}>
                    <p style={{ fontSize: '11px', fontWeight: '600', color: 'rgba(240,244,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 10px' }}>
                        pKa in context — sorted weakest to strongest acid
                    </p>
                    {[
                        { label: 'Alcohols',         pKa: 16,   color: '#16a34a' },
                        { label: 'Amides',           pKa: 17,   color: '#0f766e' },
                        { label: 'Thiols',           pKa: 10.5, color: '#0891b2' },
                        { label: 'Phenols',          pKa: 10,   color: '#d97706' },
                        { label: 'Ammonium ions',    pKa: 10,   color: '#2563eb' },
                        { label: 'Imidazolium',      pKa: 6.5,  color: '#7c3aed' },
                        { label: 'Carboxylic acids', pKa: 4.8,  color: '#f97316' },
                        { label: 'Strong acids',     pKa: 0,    color: '#fca5a5' },
                    ].sort((a, b) => b.pKa - a.pKa).map(item => {
                        const groupMap = {
                            'Alcohols':         ['alcohol'],
                            'Amides':           ['amide'],
                            'Thiols':           ['thiol'],
                            'Phenols':          ['phenol'],
                            'Ammonium ions':    ['amine'],
                            'Imidazolium':      ['imidazole'],
                            'Carboxylic acids': ['carboxylic_acid'],
                            'Strong acids':     [],
                        }
                        const isCurrent = (groupMap[item.label] ?? []).includes(fg.id)
                        const barWidth = Math.min(100, Math.max(4, (item.pKa / 18) * 100))
                        return (
                        <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '5px' }}>
                            <span style={{ fontSize: '11px', color: isCurrent ? item.color : 'rgba(240,244,255,0.75)', fontWeight: isCurrent ? '600' : '400', width: '120px', flexShrink: 0 }}>
                                {item.label}
                            </span>
                            <div style={{ flex: 1, background: 'rgba(255,255,255,0.1)', borderRadius: '3px', height: '8px' }}>
                                <div style={{ width: barWidth + '%', height: '100%', background: item.color, borderRadius: '3px', opacity: isCurrent ? 1 : 0.5 }} />
                            </div>
                            <span style={{ fontSize: '11px', fontFamily: 'ui-monospace, monospace', color: isCurrent ? item.color : 'rgba(240,244,255,0.3)', fontWeight: isCurrent ? '700' : '400', minWidth: '52px', textAlign: 'right' }}>
                                {item.pKa === 0 ? '< 0' : '~' + item.pKa}
                            </span>
                        </div>
                        )
                    })}
                    <p style={{ fontSize: '10px', color: 'rgba(240,244,255,0.3)', margin: '8px 0 0', lineHeight: 1.4 }}>
                        Higher pKa = weaker acid (harder to lose a proton). Bar length proportional to pKa value.
                    </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Tab 2: Ionisation calculator ── */}
      {tab === 'calculator' && (
        <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '1.5rem', alignItems: 'start' }}>

          {/* Inputs */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

            <div style={{ background: '#0f1629', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', padding: '14px 16px' }}>
              <p style={{ fontSize: '11px', fontWeight: '600', color: 'rgba(240,244,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 10px' }}>Drug type</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {DRUG_TYPES.map(dt => (
                  <button key={dt.id} onClick={() => setDrugType(dt.id === 'zwitterion' ? 'weak_acid' : dt.id)}
                    style={{ ...btn(drugType === dt.id, dt.color), textAlign: 'left', display: 'block' }}>
                    <span style={{ fontWeight: '600' }}>{dt.label}</span>
                    <span style={{ fontSize: '10px', color: 'rgba(240,244,255,0.3)', display: 'block', marginTop: '1px' }}>{dt.example}</span>
                  </button>
                ))}
              </div>
            </div>

            <div style={{ background: '#0f1629', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', padding: '14px 16px' }}>
              <p style={{ fontSize: '11px', fontWeight: '600', color: 'rgba(240,244,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 10px' }}>Drug pKa</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <input type="number" value={rawPKa} min={0} max={14} step={0.1}
                  onChange={e => { setRawPKa(e.target.value); const n = parseFloat(e.target.value); if (!isNaN(n) && n >= 0 && n <= 14) setPKa(n) }}
                  onBlur={() => { const n = parseFloat(rawPKa); if (isNaN(n) || n < 0 || n > 14) { setPKa(4.4); setRawPKa('4.4') } }}
                  style={{ width: '70px', padding: '5px 8px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)', fontSize: '16px', fontWeight: '700', color: '#f0f4ff', textAlign: 'right', background: '#0f1629' }} />
                <input type="range" min={0} max={14} step={0.1} value={pKa}
                  onChange={e => { const n = parseFloat(e.target.value); setPKa(n); setRawPKa(n.toFixed(1)) }}
                  style={{ flex: 1, accentColor: '#2563eb' }} />
              </div>
              <p style={{ fontSize: '11px', color: 'rgba(240,244,255,0.3)', margin: 0 }}>
                {drugType === 'weak_acid'
                  ? 'pKa of the drug (HA ⇌ H⁺ + A⁻)'
                  : 'pKa of conjugate acid (BH⁺ ⇌ H⁺ + B)'}
              </p>

              {/* Quick-load common drugs */}
              <div style={{ marginTop: '10px' }}>
                <p style={{ fontSize: '10px', color: 'rgba(240,244,255,0.3)', margin: '0 0 5px' }}>Quick load:</p>
                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                  {[
                    { name: 'Aspirin', pKa: 3.5, type: 'weak_acid' },
                    { name: 'Ibuprofen', pKa: 4.4, type: 'weak_acid' },
                    { name: 'Morphine', pKa: 9.9, type: 'weak_base' },
                    { name: 'Diazepam', pKa: 3.3, type: 'weak_base' },
                    { name: 'Metformin', pKa: 11.5, type: 'weak_base' },
                    { name: 'Warfarin', pKa: 5.1, type: 'weak_acid' },
                  ].map(d => (
                    <button key={d.name} onClick={() => { setPKa(d.pKa); setRawPKa(String(d.pKa)); setDrugType(d.type) }}
                      style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '5px', cursor: 'pointer', border: '1px solid rgba(255,255,255,0.07)', background: '#0f1629', color: 'rgba(240,244,255,0.75)' }}>
                      {d.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* pH breakdown table */}
            <div style={{ background: '#0f1629', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', padding: '14px 16px' }}>
              <p style={{ fontSize: '11px', fontWeight: '600', color: 'rgba(240,244,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 10px' }}>Ionisation at key pH values</p>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                <thead>
                  <tr style={{ background: 'rgba(255,255,255,0.06)' }}>
                    <th style={{ padding: '5px 8px', textAlign: 'left', color: 'rgba(240,244,255,0.45)', fontWeight: '600', borderRadius: '4px 0 0 4px' }}>Site</th>
                    <th style={{ padding: '5px 8px', textAlign: 'center', color: 'rgba(240,244,255,0.45)', fontWeight: '600' }}>pH</th>
                    <th style={{ padding: '5px 8px', textAlign: 'right', color: '#2563eb', fontWeight: '600' }}>Unionised</th>
                    <th style={{ padding: '5px 8px', textAlign: 'right', color: '#fca5a5', fontWeight: '600', borderRadius: '0 4px 4px 0' }}>Ionised</th>
                  </tr>
                </thead>
                <tbody>
                  {keyPHs.map(item => {
                    const { unionised, ionised } = calcFractions(item.ph)
                    const pct_u = (unionised * 100).toFixed(1)
                    const pct_i = (ionised   * 100).toFixed(1)
                    const dominant = unionised > 0.5 ? 'unionised' : 'ionised'
                    return (
                      <tr key={item.ph} style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                        <td style={{ padding: '5px 8px', color: item.color, fontWeight: '500' }}>
                          <span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', background: item.color, marginRight: '5px', verticalAlign: 'middle' }} />
                          {item.label}
                        </td>
                        <td style={{ padding: '5px 8px', textAlign: 'center', fontFamily: 'ui-monospace, monospace', color: 'rgba(240,244,255,0.6)' }}>{item.ph}</td>
                        <td style={{ padding: '5px 8px', textAlign: 'right', fontWeight: dominant === 'unionised' ? '700' : '400', color: dominant === 'unionised' ? '#93b4f7' : 'rgba(240,244,255,0.55)' }}>{pct_u}%</td>
                        <td style={{ padding: '5px 8px', textAlign: 'right', fontWeight: dominant === 'ionised' ? '700' : '400', color: dominant === 'ionised' ? '#dc2626' : 'rgba(240,244,255,0.75)' }}>{pct_i}%</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Right: curve + interpretation */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <IonisationCanvas pKa={pKa} drugType={drugType} />

            {/* Henderson-Hasselbalch formula */}
            <div style={{ background: '#0a0f1e', borderRadius: '10px', padding: '12px 16px' }}>
              <p style={{ fontSize: '10px', fontWeight: '600', color: '#93b4f7', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 4px' }}>Henderson-Hasselbalch</p>
              <p style={{ fontSize: '13px', fontFamily: 'ui-monospace, monospace', color: '#93b4f7', margin: 0 }}>
                {drugType === 'weak_acid'
                  ? 'pH = pKa + log([A⁻] / [HA])'
                  : 'pH = pKa + log([B] / [BH⁺])'}
              </p>
              <p style={{ fontSize: '12px', fontFamily: 'ui-monospace, monospace', color: '#60a5fa', margin: '4px 0 0' }}>
                {drugType === 'weak_acid'
                  ? '% unionised (HA) = 100 / (1 + 10^(pH − pKa))'
                  : '% unionised (B) = 100 / (1 + 10^(pKa − pH))'}
              </p>
            </div>

            {/* Absorption interpretation */}
            <div style={{ background: '#0f1629', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '10px', padding: '12px 14px' }}>
              <p style={{ fontSize: '11px', fontWeight: '600', color: 'rgba(240,244,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 8px' }}>Absorption interpretation</p>
              {(() => {
                const stomach    = calcFractions(1.5)
                const intestine  = calcFractions(6.5)
                const blood      = calcFractions(7.4)
                const items = [
                  { label: 'Stomach',       ...stomach,   ph: 1.5, color: '#fca5a5' },
                  { label: 'Sm. intestine', ...intestine, ph: 6.5, color: '#16a34a' },
                  { label: 'Blood',         ...blood,     ph: 7.4, color: '#2563eb' },
                ]
                return items.map(item => (
                  <div key={item.label} style={{ marginBottom: '8px', padding: '8px 10px', background: 'rgba(255,255,255,0.04)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <span style={{ fontSize: '12px', fontWeight: '500', color: item.color }}>
                        {item.label} (pH {item.ph})
                      </span>
                      <span style={{ fontSize: '12px', fontWeight: '700', color: item.unionised > 0.5 ? '#93b4f7' : '#fca5a5' }}>
                        {(item.unionised * 100).toFixed(1)}% unionised
                      </span>
                    </div>
                    <div style={{ height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ width: (item.unionised * 100) + '%', height: '100%', background: '#2563eb', borderRadius: '3px' }} />
                    </div>
                    <p style={{ fontSize: '11px', color: 'rgba(240,244,255,0.4)', margin: '4px 0 0' }}>
                      {item.unionised > 0.9
                        ? 'Predominantly unionised → can cross membranes readily'
                        : item.unionised > 0.5
                        ? 'Majority unionised → reasonable membrane permeability'
                        : item.unionised > 0.1
                        ? 'Minority unionised → limited membrane crossing'
                        : 'Predominantly ionised → very poor membrane permeability'}
                    </p>
                  </div>
                ))
              })()}
            </div>

            {/* Urine pH trapping */}
            <div style={{ background: 'rgba(42,111,219,0.1)', border: '1px solid rgba(42,111,219,0.3)', borderRadius: '10px', padding: '12px 14px' }}>
              <p style={{ fontSize: '11px', fontWeight: '600', color: '#93b4f7', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 6px' }}>Urine pH trapping</p>
              {(() => {
                const acidicUrine   = calcFractions(5.0)
                const alkalineUrine = calcFractions(8.0)
                const fasterExcretion = drugType === 'weak_acid'
                  ? (alkalineUrine.ionised > acidicUrine.ionised ? 'alkaline' : 'acidic')
                  : (acidicUrine.ionised > alkalineUrine.ionised ? 'acidic' : 'alkaline')
                return (
                  <p style={{ fontSize: '13px', color: 'rgba(240,244,255,0.7)', margin: 0, lineHeight: 1.65 }}>
                    {drugType === 'weak_acid'
                      ? `In acidic urine (pH 5): ${(acidicUrine.ionised * 100).toFixed(1)}% ionised. In alkaline urine (pH 8): ${(alkalineUrine.ionised * 100).toFixed(1)}% ionised.`
                      : `In acidic urine (pH 5): ${(acidicUrine.ionised * 100).toFixed(1)}% ionised. In alkaline urine (pH 8): ${(alkalineUrine.ionised * 100).toFixed(1)}% ionised.`}
                    {' '}
                    Alkalinising urine with NaHCO₃ {fasterExcretion === 'alkaline' ? 'increases' : 'decreases'} ionised fraction of this {drugType === 'weak_acid' ? 'weak acid' : 'weak base'} → {fasterExcretion === 'alkaline' ? 'faster' : 'slower'} renal excretion. Used clinically in overdose management.
                  </p>
                )
              })()}
            </div>
          </div>
        </div>
      )}
    </main>
  )
}