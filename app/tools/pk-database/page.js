'use client'
import { useState, useMemo } from 'react'
import Link from 'next/link'
import { PK_DRUGS, ROUTES } from '../../../lib/pk-database'

const C = {
  bg: '#0a0f1e', card: '#0f1629', border: 'rgba(255,255,255,0.07)',
  blue: '#2a6fdb', blueLight: '#93b4f7', purple: '#7c3aed',
  text: '#f0f4ff', textMid: 'rgba(240,244,255,0.65)', textDim: 'rgba(240,244,255,0.35)',
}

// Broader category groups for the filter dropdown
const CLASS_GROUPS = [
  { label: 'NSAIDs & Analgesics',      test: d => d.class.includes('NSAID') || d.class === 'Analgesic' },
  { label: 'Opioids',                   test: d => d.class.includes('Opioid') },
  { label: 'Antibiotics',               test: d => ['antibiotic','Aminoglycoside','Glycopeptide','Fluoroquinolone','Macrolide','Aminopenicillin','Tetracycline','Lincosamide','Nitroimidazole','Nitrofuran'].some(k => d.class.includes(k)) },
  { label: 'Cardiovascular',            test: d => ['blocker','ACE inhibitor','Calcium channel','diuretic','Statin','anticoagulant','Antiplatelet','Vitamin K','Cardiac glycoside'].some(k => d.class.includes(k)) },
  { label: 'CNS / Psychiatry',          test: d => ['SSRI','SNRI','Tricyclic','Antipsychotic','Benzodiazepine','Mood stabiliser','Anticonvulsant'].some(k => d.class.includes(k)) },
  { label: 'Endocrinology',             test: d => ['Biguanide','Sulfonylurea','Thyroid','Corticosteroid','oestrogen','SERM'].some(k => d.class.includes(k)) },
  { label: 'Immunosuppressants / Rheum',test: d => ['Calcineurin','DMARD','Antimalarial'].some(k => d.class.includes(k)) },
  { label: 'Oncology',                  test: d => ['kinase','Antimetabolite'].some(k => d.class.includes(k)) },
  { label: 'Antivirals',               test: d => ['NRTI','NNRTI','Neuraminidase'].some(k => d.class.includes(k)) },
  { label: 'Pulmonology',               test: d => ['β₂','Leukotriene','Xanthine broncho'].some(k => d.class.includes(k)) },
  { label: 'GI / Antiemetics',          test: d => ['Proton pump','5-HT₃','Antidiarrhoeal'].some(k => d.class.includes(k)) },
  { label: 'Anaesthesia',               test: d => ['anaesthetic','Dissociative'].some(k => d.class.includes(k)) },
  { label: 'Antihistamines',            test: d => d.class.includes('Antihistamine') },
  { label: 'Other',                     test: d => ['PDE5','Opioid antagonist','Alcohol','Methylxanthine','nAChR','Pineal','Alkaloid'].some(k => d.class.includes(k)) },
]

const PARAMS = [
  { key: 't_half', label: 't½', unit: 'h',      desc: 'Elimination half-life' },
  { key: 'vd',     label: 'Vd', unit: 'L/kg',   desc: 'Volume of distribution' },
  { key: 'cl',     label: 'CL', unit: 'L/h/kg', desc: 'Clearance' },
  { key: 'f',      label: 'F',  unit: '%',       desc: 'Oral bioavailability', format: v => `${Math.round(v * 100)}%` },
  { key: 'tmax',   label: 'Tmax', unit: 'h',    desc: 'Time to peak concentration' },
  { key: 'ppb',    label: 'PPB', unit: '%',      desc: 'Plasma protein binding', format: v => `${v}%` },
  { key: 'mw',     label: 'MW', unit: 'g/mol',  desc: 'Molecular weight' },
]

function fmt(val, param) {
  if (param.format) return param.format(val)
  if (val >= 1000) return val.toLocaleString()
  if (val >= 100) return val.toFixed(0)
  if (val >= 10) return val.toFixed(1)
  return val.toFixed(2)
}

function DrugModal({ drug, onClose }) {
  if (!drug) return null
  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 998, background: 'rgba(10,15,30,0.8)', backdropFilter: 'blur(6px)' }} />
      <div style={{ position: 'fixed', zIndex: 999, top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 'min(560px, calc(100vw - 2rem))', background: C.card, border: `1px solid ${C.border}`, borderRadius: '16px', overflow: 'hidden', boxShadow: '0 32px 80px rgba(0,0,0,0.6)', fontFamily: "'Inter',system-ui,sans-serif", maxHeight: '90vh', overflowY: 'auto' }}>
        {/* Header */}
        <div style={{ padding: '20px 22px 16px', borderBottom: `1px solid ${C.border}`, position: 'sticky', top: 0, background: C.card, zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: '800', color: C.text, margin: '0 0 4px', letterSpacing: '-0.02em' }}>{drug.name}</h2>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '11px', color: C.blueLight, background: `${C.blue}18`, border: `1px solid ${C.blue}33`, borderRadius: '999px', padding: '2px 8px', fontWeight: '600' }}>{drug.class}</span>
                <span style={{ fontSize: '11px', color: C.textDim, background: 'rgba(255,255,255,0.05)', border: `1px solid ${C.border}`, borderRadius: '999px', padding: '2px 8px' }}>{drug.route}</span>
              </div>
            </div>
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: C.textDim, fontSize: '22px', cursor: 'pointer', lineHeight: 1, padding: '0 4px', flexShrink: 0 }}>×</button>
          </div>
        </div>

        {/* Parameters grid */}
        <div style={{ padding: '18px 22px' }}>
          <p style={{ fontSize: '11px', fontWeight: '700', color: C.textDim, textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 12px' }}>PK parameters (typical adult)</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '20px' }}>
            {PARAMS.map(p => (
              <div key={p.key} style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${C.border}`, borderRadius: '10px', padding: '12px 14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '2px' }}>
                  <span style={{ fontSize: '12px', color: C.textDim, fontWeight: '600' }}>{p.label}</span>
                  <span style={{ fontSize: '10px', color: C.textDim }}>{p.unit}</span>
                </div>
                <div style={{ fontSize: '22px', fontWeight: '800', color: C.blueLight, fontFamily: 'ui-monospace, monospace', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
                  {fmt(drug[p.key], p)}
                </div>
                <div style={{ fontSize: '11px', color: C.textDim, marginTop: '3px' }}>{p.desc}</div>
              </div>
            ))}
          </div>

          {/* Source */}
          <div style={{ background: 'rgba(42,111,219,0.08)', border: `1px solid ${C.blue}28`, borderRadius: '10px', padding: '12px 14px', marginBottom: '10px' }}>
            <p style={{ fontSize: '11px', fontWeight: '700', color: C.blueLight, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 4px' }}>Source</p>
            <p style={{ fontSize: '12px', color: C.textMid, margin: '0 0 6px', lineHeight: '1.5' }}>{drug.source}</p>
            {drug.source_url && (
              <a href={drug.source_url} target="_blank" rel="noopener noreferrer"
                style={{ fontSize: '11px', color: C.blueLight, textDecoration: 'none' }}>
                View label / primary source ↗
              </a>
            )}
          </div>

          {/* Notes */}
          {drug.notes && (
            <div style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${C.border}`, borderRadius: '10px', padding: '12px 14px' }}>
              <p style={{ fontSize: '11px', fontWeight: '700', color: C.textDim, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 4px' }}>Clinical notes</p>
              <p style={{ fontSize: '12px', color: C.textMid, margin: 0, lineHeight: '1.5' }}>{drug.notes}</p>
            </div>
          )}

          {/* Notes */}
          <p style={{ fontSize: '11px', color: C.textDim, margin: '12px 0 0', lineHeight: '1.6' }}>
            All values are population averages for healthy adults. Individual variation applies. F = 0.0 indicates IV route (bioavailability not applicable).
          </p>
        </div>
      </div>
    </>
  )
}

export default function PKDatabasePage() {
  const [query, setQuery]         = useState('')
  const [classFilter, setClass]   = useState('')
  const [routeFilter, setRoute]   = useState('')
  const [sortBy, setSortBy]       = useState('name')
  const [sortDir, setSortDir]     = useState(1)
  const [selected, setSelected]   = useState(null)

  const filtered = useMemo(() => {
    let drugs = PK_DRUGS
    if (query.trim()) {
      const q = query.toLowerCase()
      drugs = drugs.filter(d => d.name.toLowerCase().includes(q) || d.class.toLowerCase().includes(q))
    }
    if (classFilter) {
      const group = CLASS_GROUPS.find(g => g.label === classFilter)
      if (group) drugs = drugs.filter(group.test)
    }
    if (routeFilter) drugs = drugs.filter(d => d.route === routeFilter)
    return [...drugs].sort((a, b) => {
      const av = a[sortBy], bv = b[sortBy]
      if (typeof av === 'string') return sortDir * av.localeCompare(bv)
      return sortDir * (av - bv)
    })
  }, [query, classFilter, routeFilter, sortBy, sortDir])

  function toggleSort(key) {
    if (sortBy === key) setSortDir(d => -d)
    else { setSortBy(key); setSortDir(1) }
  }

  const cols = [
    { key: 'name',   label: 'Drug',  width: '160px' },
    { key: 'class',  label: 'Class', width: '140px' },
    { key: 't_half', label: 't½ (h)', width: '70px' },
    { key: 'vd',     label: 'Vd (L/kg)', width: '80px' },
    { key: 'f',      label: 'F (%)', width: '60px', format: v => `${Math.round(v*100)}` },
    { key: 'ppb',    label: 'PPB (%)', width: '70px' },
    { key: 'mw',     label: 'MW', width: '70px' },
  ]

  return (
    <main style={{ background: C.bg, minHeight: '100vh', fontFamily: "'Inter',system-ui,sans-serif", color: C.text }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap'); * { box-sizing:border-box; } input::placeholder,select option { color:rgba(240,244,255,0.25); background:#0f1629; } tr:hover td { background: rgba(255,255,255,0.03) !important; cursor:pointer; }`}</style>

      {/* Header */}
      <div style={{ borderBottom: `1px solid ${C.border}`, background: C.card }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '2rem 2rem 1.5rem' }}>
          <Link href="/tools" style={{ fontSize: '13px', color: C.textDim, textDecoration: 'none', display: 'inline-block', marginBottom: '1rem' }}>← Tools</Link>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h1 style={{ fontSize: '22px', fontWeight: '800', color: C.text, margin: '0 0 4px', letterSpacing: '-0.02em' }}>PK Parameter Database</h1>
              <p style={{ fontSize: '13px', color: C.textMid, margin: 0 }}>{PK_DRUGS.length} drugs — t½, Vd, CL, F, PPB, MW. Click any row for full detail and source.</p>
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '1.5rem 2rem' }}>

        {/* Filters */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
            <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search drug or class…"
              style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: `1px solid ${C.border}`, background: C.card, color: C.text, fontSize: '14px', fontFamily: "'Inter',system-ui,sans-serif", outline: 'none' }} />
          </div>
          <select value={classFilter} onChange={e => setClass(e.target.value)}
            style={{ padding: '9px 12px', borderRadius: '8px', border: `1px solid ${C.border}`, background: C.card, color: classFilter ? C.text : C.textDim, fontSize: '13px', fontFamily: "'Inter',system-ui,sans-serif", outline: 'none', minWidth: '200px' }}>
            <option value="">All classes</option>
            {CLASS_GROUPS.map(g => (
              <option key={g.label} value={g.label}>{g.label} ({PK_DRUGS.filter(g.test).length})</option>
            ))}
          </select>
          <select value={routeFilter} onChange={e => setRoute(e.target.value)}
            style={{ padding: '9px 12px', borderRadius: '8px', border: `1px solid ${C.border}`, background: C.card, color: routeFilter ? C.text : C.textDim, fontSize: '13px', fontFamily: "'Inter',system-ui,sans-serif", outline: 'none' }}>
            <option value="">All routes</option>
            {ROUTES.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          {(query || classFilter || routeFilter) && (
            <button onClick={() => { setQuery(''); setClass(''); setRoute('') }}
              style={{ padding: '9px 14px', borderRadius: '8px', border: `1px solid ${C.border}`, background: 'transparent', color: C.textDim, fontSize: '13px', cursor: 'pointer', fontFamily: "'Inter',system-ui,sans-serif" }}>
              Clear
            </button>
          )}
          <span style={{ padding: '9px 0', fontSize: '13px', color: C.textDim, marginLeft: 'auto', alignSelf: 'center' }}>{filtered.length} drug{filtered.length !== 1 ? 's' : ''}</span>
        </div>

        {/* Table */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '12px', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${C.border}`, background: 'rgba(255,255,255,0.03)' }}>
                  {cols.map(c => (
                    <th key={c.key} onClick={() => toggleSort(c.key)}
                      style={{ padding: '10px 14px', textAlign: 'left', fontWeight: '600', color: sortBy === c.key ? C.blueLight : C.textDim, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', cursor: 'pointer', whiteSpace: 'nowrap', width: c.width }}>
                      {c.label} {sortBy === c.key ? (sortDir === 1 ? '↑' : '↓') : ''}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((d, i) => (
                  <tr key={d.id} onClick={() => setSelected(d)}
                    style={{ borderBottom: i < filtered.length - 1 ? `1px solid ${C.border}` : 'none' }}>
                    {cols.map(c => (
                      <td key={c.key} style={{ padding: '11px 14px', color: c.key === 'name' ? C.text : C.textMid, fontWeight: c.key === 'name' ? '600' : '400', fontFamily: ['t_half','vd','f','ppb','mw'].includes(c.key) ? 'ui-monospace, monospace' : 'inherit', whiteSpace: c.key === 'class' ? 'nowrap' : 'normal' }}>
                        {c.format ? c.format(d[c.key]) : typeof d[c.key] === 'number' ? fmt(d[c.key], { key: c.key }) : d[c.key]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <p style={{ fontSize: '11px', color: C.textDim, marginTop: '12px', lineHeight: '1.6' }}>
          Values are typical population averages for healthy adults from Rowland & Tozer <em>Clinical Pharmacokinetics</em> (5th ed.), Brunton et al. <em>Goodman & Gilman's</em> (13th ed.), and Bauer <em>Clinical Pharmacokinetics Handbook</em> (2nd ed.). Click any row for individual source citation and full parameter detail.
        </p>
      </div>

      <DrugModal drug={selected} onClose={() => setSelected(null)} />
    </main>
  )
}