'use client'
import { useState } from 'react'

const RULES = [
  {
    id: 'mw',
    name: 'Molecular weight',
    param: 'MW',
    unit: 'Da',
    threshold: 500,
    direction: 'max',
    min: 50, max: 1000, step: 10,
    default: 300,
    why: 'Large molecules cannot passively diffuse through lipid membranes. MW < 500 Da is required for oral bioavailability by passive diffusion. Each 100 Da above 500 roughly halves membrane permeability.',
    exceptions: 'Macrolide antibiotics (azithromycin MW 749 — absorbed via active transport). Cyclosporin (MW 1203 — oral bioavailability via P-gp modulation and lipid solubility in formulation). Rule does not apply to biopharmaceuticals (proteins, mAbs).',
    color: '#2563eb',
  },
  {
    id: 'logp',
    name: 'Lipophilicity (log P)',
    param: 'log P',
    unit: '',
    threshold: 5,
    direction: 'max',
    min: -4, max: 10, step: 0.1,
    default: 2.5,
    why: 'Log P too high → drug gets trapped in lipid bilayer, poor aqueous solubility, extracted by P-gp. Log P too low → cannot cross lipid membrane, poor absorption. Sweet spot: log P 0–3 for most orally absorbed drugs. The Rule of Five sets the upper limit at 5.',
    exceptions: 'Some highly lipophilic drugs are formulated as lipid-based systems (ciclosporin in Cremophor). Log D (at pH 7.4) is more biologically relevant than log P for ionisable drugs.',
    color: '#f97316',
  },
  {
    id: 'hbd',
    name: 'H-bond donors',
    param: 'HBD',
    unit: '',
    threshold: 5,
    direction: 'max',
    min: 0, max: 15, step: 1,
    default: 2,
    why: 'H-bond donors (OH and NH groups) form hydrogen bonds with water. Each H-bond donor costs energy to desolvate when crossing a lipid membrane — this cost reduces permeability. More than 5 donors = usually too polar for good oral absorption.',
    exceptions: 'Rosuvastatin (4 HBD, still orally absorbed via OATP transporters). Some peptide drugs use N-methylation to eliminate NH donors (cyclosporin, semaglutide backbone). Prodrugs mask donors temporarily.',
    color: '#16a34a',
  },
  {
    id: 'hba',
    name: 'H-bond acceptors',
    param: 'HBA',
    unit: '',
    threshold: 10,
    direction: 'max',
    min: 0, max: 20, step: 1,
    default: 5,
    why: 'H-bond acceptors (N and O atoms) also require desolvation for membrane crossing but have less penalty per group than donors. The Rule of Five sets the limit at 10 (counting all N and O).',
    exceptions: 'Macrolides and glycopeptide antibiotics exceed this rule but are absorbed via specific mechanisms. The limit of 10 is a guideline — distribution of approved drugs extends well beyond.',
    color: '#7c3aed',
  },
  {
    id: 'rotbonds',
    name: 'Rotatable bonds',
    param: 'RotBonds',
    unit: '',
    threshold: 10,
    direction: 'max',
    min: 0, max: 20, step: 1,
    default: 4,
    why: 'Flexible molecules lose more conformational entropy upon membrane crossing or protein binding. More rotatable bonds = greater flexibility = greater entropy penalty. Rule of Five does not originally include this, but Veber\'s rules add ≤10 rotatable bonds for good oral bioavailability.',
    exceptions: 'Extended-release formulations, prodrugs. Some highly flexible drugs are still absorbed — this is a weaker predictor than MW, log P, and HBD.',
    color: '#0891b2',
  },
]

const DRUG_EXAMPLES = [
  { name: 'Aspirin',        MW: 180,  logP: 1.2,  HBD: 2, HBA: 4,  RotB: 3,  note: 'Classic NSAID — excellent Rule of 5' },
  { name: 'Ibuprofen',      MW: 206,  logP: 3.5,  HBD: 1, HBA: 2,  RotB: 4,  note: 'Highly compliant — one of the most absorbed drugs' },
  { name: 'Atorvastatin',   MW: 559,  logP: 4.5,  HBD: 4, HBA: 7,  RotB: 12, note: 'Slightly above MW threshold; absorbed via OATP' },
  { name: 'Paclitaxel',     MW: 854,  logP: 3.0,  HBD: 4, HBA: 14, RotB: 15, note: 'Violates multiple rules — IV only (Cremophor formulation)' },
  { name: 'Metformin',      MW: 129,  logP: -1.4, HBD: 4, HBA: 5,  RotB: 2,  note: 'Low logP but absorbed by OCT transporters' },
  { name: 'Cyclosporin',    MW: 1203, logP: 2.9,  HBD: 5, HBA: 23, RotB: 44, note: 'Violates all rules — oral via unique lipophilic mechanism' },
  { name: 'Oseltamivir',    MW: 312,  logP: 0.36, HBD: 2, HBA: 5,  RotB: 7,  note: 'Good Rule of 5; prodrug of active oseltamivir carboxylate' },
  { name: 'Ritonavir',      MW: 721,  logP: 2.5,  HBD: 3, HBA: 11, RotB: 16, note: 'HIV protease inhibitor — poor absorption, used to boost other drugs (pharmacoenhancer)' },
]

function RuleBar({ rule, value }) {
  const passes = rule.direction === 'max' ? value <= rule.threshold : value >= rule.threshold
  const pct    = rule.direction === 'max'
    ? Math.min(100, (value / rule.threshold) * 70)
    : Math.min(100, (rule.threshold / value) * 70)
  return (
    <div style={{ background: passes ? '#f0fdf4' : '#fef2f2', border: `1px solid ${passes ? '#bbf7d0' : '#fecaca'}`, borderRadius: '10px', padding: '10px 12px', marginBottom: '8px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
        <span style={{ fontSize: '12px', fontWeight: '600', color: rule.color }}>{rule.name}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: '14px', fontWeight: '700', color: passes ? '#15803d' : '#dc2626' }}>
            {rule.param} = {typeof value === 'number' && !Number.isInteger(value) ? value.toFixed(1) : value}
          </span>
          <span style={{ fontSize: '11px', padding: '1px 8px', borderRadius: '999px', background: passes ? '#16a34a' : '#dc2626', color: 'white', fontWeight: '600' }}>
            {passes ? '✓ Pass' : '✗ Fail'}
          </span>
        </div>
      </div>
      <div style={{ height: '6px', background: '#e5e7eb', borderRadius: '3px', overflow: 'hidden', marginBottom: '4px' }}>
        <div style={{ width: pct + '%', height: '100%', background: passes ? '#16a34a' : '#dc2626', borderRadius: '3px', transition: 'width 0.2s' }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#9ca3af' }}>
        <span>{rule.direction === 'max' ? 'Target: ≤' : 'Target: ≥'}{rule.threshold} {rule.unit}</span>
        <span>{passes ? 'Within limit' : `Exceeds limit by ${rule.direction === 'max' ? (value - rule.threshold).toFixed(1) : (rule.threshold - value).toFixed(1)} ${rule.unit}`}</span>
      </div>
    </div>
  )
}

export default function LipinskiPage() {
  const [MW,       setMW]       = useState(300)
  const [logP,     setLogP]     = useState(2.5)
  const [HBD,      setHBD]      = useState(2)
  const [HBA,      setHBA]      = useState(5)
  const [rotBonds, setRotBonds] = useState(4)
  const [tab,      setTab]      = useState('calculator')

  const values = { mw: MW, logp: logP, hbd: HBD, hba: HBA, rotbonds: rotBonds }
  const passes = RULES.filter(r => r.direction === 'max' ? values[r.id] <= r.threshold : values[r.id] >= r.threshold)
  const fails  = RULES.filter(r => !(r.direction === 'max' ? values[r.id] <= r.threshold : values[r.id] >= r.threshold))
  const lipinskiPasses = fails.filter(f => ['mw','logp','hbd','hba'].includes(f.id)).length <= 1

  // BCS prediction (simplified heuristic)
  const predictBCS = () => {
  // More accurate heuristic:
  // Solubility: high if logP < 2 (likely water soluble) OR HBD >= 2 (H-bonding aids solubility)
  // Permeability: high if logP > 0 AND MW < 500 AND HBD <= 3
    const highSolubility   = logP < 2 || HBD >= 2
    const highPermeability = logP > 0 && MW < 500 && HBD <= 3
    if (highSolubility  && highPermeability)  return 'I'
    if (!highSolubility && highPermeability)  return 'II'
    if (highSolubility  && !highPermeability) return 'III'
    return 'IV'
  }
  const bcsClass = predictBCS()
  const bcsColors = { I: '#16a34a', II: '#f97316', III: '#2563eb', IV: '#dc2626' }

  function loadExample(ex) {
    setMW(ex.MW); setLogP(ex.logP); setHBD(ex.HBD); setHBA(ex.HBA); setRotBonds(ex.RotB)
  }

  const tabBtn = active => ({
    padding: '8px 20px', cursor: 'pointer', fontSize: '13px',
    fontWeight: tab === active ? '600' : '400',
    border: 'none', borderBottom: tab === active ? '2px solid #2563eb' : '2px solid transparent',
    background: 'transparent', color: tab === active ? '#1d4ed8' : '#6b7280', marginBottom: '-1px',
  })

  const sliderRow = (label, value, setValue, min, max, step) => (
    <div style={{ marginBottom: '10px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
        <label style={{ fontSize: '12px', color: '#374151', fontWeight: '500' }}>{label}</label>
        <span style={{ fontSize: '12px', fontFamily: 'ui-monospace, monospace', color: '#2563eb', fontWeight: '700' }}>
          {typeof value === 'number' && !Number.isInteger(value) ? value.toFixed(1) : value}
        </span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e => setValue(parseFloat(e.target.value))}
        style={{ width: '100%', accentColor: '#2563eb' }} />
    </div>
  )

  return (
    <main style={{ maxWidth: '1060px', margin: '0 auto', padding: '2rem 1rem', fontFamily: 'system-ui, sans-serif' }}>
      <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#111827', margin: '0 0 4px' }}>Lipinski & Drug-likeness</h1>
      <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '1.5rem', lineHeight: '1.6' }}>
        Lipinski's Rule of Five predicts oral bioavailability from molecular properties. Enter descriptors to see which rules pass or fail — and why each one matters.
      </p>

      <div style={{ borderBottom: '1px solid #e5e7eb', marginBottom: '1.5rem', display: 'flex' }}>
        <button onClick={() => setTab('calculator')} style={tabBtn('calculator')}>Rule of Five calculator</button>
        <button onClick={() => setTab('rules')}      style={tabBtn('rules')}>Why each rule matters</button>
        <button onClick={() => setTab('examples')}   style={tabBtn('examples')}>Drug examples</button>
      </div>

      {/* ── Tab 1: Calculator ── */}
      {tab === 'calculator' && (
        <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '1.5rem', alignItems: 'start' }}>
          <div>
            <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '14px 16px', marginBottom: '12px' }}>
              <p style={{ fontSize: '11px', fontWeight: '600', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 12px' }}>Molecular descriptors</p>
              {sliderRow('Molecular weight (Da)', MW, setMW, 50, 1000, 10)}
              {sliderRow('log P', logP, setLogP, -4, 10, 0.1)}
              {sliderRow('H-bond donors', HBD, setHBD, 0, 15, 1)}
              {sliderRow('H-bond acceptors', HBA, setHBA, 0, 20, 1)}
              {sliderRow('Rotatable bonds', rotBonds, setRotBonds, 0, 20, 1)}
            </div>

            <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '12px 14px' }}>
              <p style={{ fontSize: '11px', fontWeight: '600', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 8px' }}>Load drug example</p>
              <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                {DRUG_EXAMPLES.slice(0, 6).map(ex => (
                  <button key={ex.name} onClick={() => loadExample(ex)}
                    style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '5px', cursor: 'pointer', border: '1px solid #e5e7eb', background: 'white', color: '#374151' }}>
                    {ex.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {/* Overall verdict */}
            <div style={{ padding: '14px 16px', borderRadius: '12px', background: lipinskiPasses ? '#f0fdf4' : '#fef2f2', border: `2px solid ${lipinskiPasses ? '#16a34a' : '#dc2626'}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <p style={{ fontSize: '16px', fontWeight: '700', color: lipinskiPasses ? '#15803d' : '#dc2626', margin: '0 0 3px' }}>
                    {lipinskiPasses ? '✓ Lipinski compliant' : '✗ Violates Rule of Five'}
                  </p>
                  <p style={{ fontSize: '12px', color: '#6b7280', margin: 0 }}>
                    {fails.length === 0 ? 'All rules pass — good oral bioavailability predicted' :
                     fails.length === 1 ? '1 violation — borderline (rule allows one exception)' :
                     `${fails.length} violations — poor oral bioavailability predicted`}
                  </p>
                </div>
                <div style={{ textAlign: 'center', padding: '8px 16px', background: bcsColors[bcsClass] + '20', border: `1px solid ${bcsColors[bcsClass]}44`, borderRadius: '10px' }}>
                  <p style={{ fontSize: '10px', color: '#9ca3af', margin: '0 0 2px' }}>Predicted BCS</p>
                  <p style={{ fontSize: '22px', fontWeight: '700', color: bcsColors[bcsClass], margin: 0 }}>Class {bcsClass}</p>
                </div>
              </div>
            </div>

            {/* Rule bars */}
            {RULES.map(rule => <RuleBar key={rule.id} rule={rule} value={values[rule.id]} />)}

            {/* Formulation suggestions */}
            {fails.length > 0 && (
              <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: '10px', padding: '12px 14px' }}>
                <p style={{ fontSize: '11px', fontWeight: '600', color: '#c2410c', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 6px' }}>Formulation strategies to address violations</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {fails.filter(f => ['mw','logp','hbd','hba'].includes(f.id)).map(f => {
                    const suggestions = {
                      mw:    'Consider prodrug strategy to reduce MW; or formulate as nanoparticles for improved absorption.',
                      logp:  logP > 5 ? 'Too lipophilic: lipid-based formulation (SEDDS), cyclodextrin complexation, amorphous solid dispersion.' : 'Too hydrophilic: consider prodrug to increase logP transiently.',
                      hbd:   'Reduce H-bond donors: N-methylation, ester formation (prodrug), bioisostere replacement of OH/NH groups.',
                      hba:   'Reduce H-bond acceptors: replace O/N with C; bioisostere swaps; consider alternative scaffold.',
                    }
                    return (
                      <p key={f.id} style={{ fontSize: '12px', color: '#374151', margin: 0, lineHeight: 1.55 }}>
                        <strong style={{ color: f.color }}>{f.name}:</strong> {suggestions[f.id]}
                      </p>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Tab 2: Why each rule matters ── */}
      {tab === 'rules' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '14px 16px', fontSize: '13px', color: '#374151', lineHeight: 1.7 }}>
            Lipinski's Rule of Five (1997) emerged from analysis of ~2000 drugs in phase II clinical trials. It describes the physicochemical properties of molecules that are likely to be orally bioavailable by passive diffusion. It is a filter, not a guarantee — many drugs violate one rule and are still absorbed via active transport or special formulation.
          </div>
          {RULES.map(rule => (
            <div key={rule.id} style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '14px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <span style={{ fontSize: '14px', fontWeight: '700', padding: '3px 12px', borderRadius: '999px', background: rule.color, color: 'white' }}>{rule.param} {rule.direction === 'max' ? '≤' : '≥'} {rule.threshold}</span>
                <span style={{ fontSize: '14px', fontWeight: '600', color: '#111827' }}>{rule.name}</span>
              </div>
              <p style={{ fontSize: '13px', color: '#374151', margin: '0 0 8px', lineHeight: 1.7 }}>{rule.why}</p>
              <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '8px 12px' }}>
                <p style={{ fontSize: '11px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 3px' }}>Notable exceptions</p>
                <p style={{ fontSize: '12px', color: '#6b7280', margin: 0, lineHeight: 1.55 }}>{rule.exceptions}</p>
              </div>
            </div>
          ))}
          <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '10px', padding: '12px 14px', fontSize: '12px', color: '#1e40af', lineHeight: 1.65 }}>
            <strong>Beyond Lipinski:</strong> The Rule of Five applies to passive oral absorption only. Active transport (OAT, OCT, OATP, PepT1) allows drugs that violate the rules to be absorbed. Modern drug discovery also uses Veber's rules (≤10 rotatable bonds, TPSA ≤140 Å²), the "Rule of 3" for fragments, and extended rules for CNS penetration (MW ≤450, log P 1–3, TPSA ≤90 Å²).
          </div>
        </div>
      )}

      {/* ── Tab 3: Examples ── */}
      {tab === 'examples' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {DRUG_EXAMPLES.map(ex => {
            const exValues  = { mw: ex.MW, logp: ex.logP, hbd: ex.HBD, hba: ex.HBA, rotbonds: ex.RotB }
            const exFails   = RULES.filter(r => r.direction === 'max' ? exValues[r.id] > r.threshold : exValues[r.id] < r.threshold)
            const exPasses  = exFails.filter(f => ['mw','logp','hbd','hba'].includes(f.id)).length <= 1
            return (
              <div key={ex.name}
                onClick={() => { loadExample(ex); setTab('calculator') }}
                style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '12px 16px', cursor: 'pointer', display: 'grid', gridTemplateColumns: '180px 1fr auto', gap: '12px', alignItems: 'center' }}>
                <div>
                  <p style={{ fontSize: '14px', fontWeight: '600', color: '#111827', margin: '0 0 2px' }}>{ex.name}</p>
                  <p style={{ fontSize: '11px', color: '#9ca3af', margin: 0 }}>{ex.note}</p>
                </div>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {[
                    { label: 'MW', value: ex.MW, rule: RULES[0] },
                    { label: 'logP', value: ex.logP, rule: RULES[1] },
                    { label: 'HBD', value: ex.HBD, rule: RULES[2] },
                    { label: 'HBA', value: ex.HBA, rule: RULES[3] },
                    { label: 'RotB', value: ex.RotB, rule: RULES[4] },
                  ].map(d => {
                    const p = d.rule.direction === 'max' ? d.value <= d.rule.threshold : d.value >= d.rule.threshold
                    return (
                      <div key={d.label} style={{ padding: '2px 8px', borderRadius: '6px', background: p ? '#f0fdf4' : '#fef2f2', border: `1px solid ${p ? '#bbf7d0' : '#fecaca'}` }}>
                        <span style={{ fontSize: '10px', color: '#9ca3af' }}>{d.label} </span>
                        <span style={{ fontSize: '11px', fontWeight: '600', color: p ? '#15803d' : '#dc2626' }}>{d.value}</span>
                      </div>
                    )
                  })}
                </div>
                <span style={{ fontSize: '11px', padding: '3px 10px', borderRadius: '999px', background: exPasses ? '#16a34a' : '#dc2626', color: 'white', fontWeight: '600', whiteSpace: 'nowrap' }}>
                  {exFails.length === 0 ? 'All pass' : `${exFails.length} fail${exFails.length > 1 ? 's' : ''}`}
                </span>
              </div>
            )
          })}
          <p style={{ fontSize: '12px', color: '#9ca3af', textAlign: 'center', marginTop: '4px' }}>Click any drug to load its values into the calculator</p>
        </div>
      )}
    </main>
  )
}