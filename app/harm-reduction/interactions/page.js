'use client'
import { useState } from 'react'
import { SUBSTANCES, SEVERITY, getInteractionMatrix } from '../../../lib/interactions.js'

export default function InteractionChecker() {
  const [selected, setSelected] = useState([])

  const recreational  = SUBSTANCES.filter(s => s.category === 'recreational')
  const prescription  = SUBSTANCES.filter(s => s.category === 'prescription')
  const interactions  = selected.length >= 2 ? getInteractionMatrix(selected) : []
  const worstSeverity = interactions.length > 0 ? interactions[0].severity : null

  function toggle(id) {
    setSelected(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  function getSub(id) { return SUBSTANCES.find(s => s.id === id) }

  const chipStyle = (id, isRx) => {
    const active = selected.includes(id)
    return {
      padding: '6px 12px', borderRadius: '999px', cursor: 'pointer',
      fontSize: '13px', fontWeight: active ? '600' : '400',
      border: active
        ? isRx ? '2px solid #7c3aed' : '2px solid #2a6fdb'
        : '1px solid rgba(255,255,255,0.1)',
      background: active
        ? isRx ? 'rgba(124,58,237,0.18)' : 'rgba(42,111,219,0.18)'
        : 'rgba(255,255,255,0.04)',
      color: active
        ? isRx ? '#c4b5fd' : '#93b4f7'
        : 'rgba(240,244,255,0.65)',
      transition: 'all 0.12s',
      userSelect: 'none',
    }
  }

  return (
    <main style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem 1rem', fontFamily: "'Inter',system-ui,sans-serif", background: '#0a0f1e', minHeight: '100vh', color: '#f0f4ff' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap'); * { box-sizing:border-box; }`}</style>
      <a href="/harm-reduction" style={{ fontSize: '13px', color: 'rgba(240,244,255,0.4)', textDecoration: 'none' }}>← Harm reduction</a>
      <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#f0f4ff', margin: '1rem 0 4px', letterSpacing: '-0.02em' }}>Drug Interaction Checker</h1>
      <p style={{ fontSize: '13px', color: 'rgba(240,244,255,0.5)', marginBottom: '1.25rem', lineHeight: '1.6' }}>
        Select two or more substances to see all interactions. Severity ratings are hardcoded from pharmacological literature — not AI-generated.
      </p>

      {/* Critical note */}
      <div style={{ background: 'rgba(185,28,28,0.2)', border: '1px solid rgba(239,68,68,0.5)', borderRadius: '10px', padding: '10px 14px', marginBottom: '1.5rem', fontSize: '12px', color: '#fca5a5' }}>
        <strong>This tool shows pharmacological interactions only.</strong> Real-world risk depends on dose, individual health, tolerance, and setting. Unknown combinations (no data available) are not necessarily safe. If you are on prescription medication, discuss any substance use with your doctor or pharmacist.
      </div>

      {/* Substance selector */}
      <div style={{ background: '#0f1629', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', padding: '14px 16px', marginBottom: '1.5rem' }}>
        <div style={{ marginBottom: '14px' }}>
          <p style={{ fontSize: '11px', color: 'rgba(240,244,255,0.3)', fontWeight: '600', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Recreational substances</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {recreational.map(s => (
              <button key={s.id} onClick={() => toggle(s.id)} style={chipStyle(s.id, false)}>
                {s.emoji} {s.name}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p style={{ fontSize: '11px', color: 'rgba(240,244,255,0.3)', fontWeight: '600', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Prescription / medication</p>
          <p style={{ fontSize: '11px', color: 'rgba(240,244,255,0.3)', marginBottom: '8px' }}>
            Include if you take these regularly or have taken them recently.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {prescription.map(s => (
              <button key={s.id} onClick={() => toggle(s.id)} style={chipStyle(s.id, true)}>
                {s.emoji} {s.name}
              </button>
            ))}
          </div>
        </div>

        {selected.length > 0 && (
          <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: '12px', color: 'rgba(240,244,255,0.6)' }}>
              <strong>{selected.length}</strong> substance{selected.length > 1 ? 's' : ''} selected
            </div>
            <button onClick={() => setSelected([])}
              style={{ fontSize: '12px', color: 'rgba(240,244,255,0.4)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
              Clear all
            </button>
          </div>
        )}
      </div>

      {/* Empty state */}
      {selected.length < 2 && (
        <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'rgba(240,244,255,0.25)', fontSize: '14px' }}>
          Select at least 2 substances to see interactions
        </div>
      )}

      {interactions.length > 0 && (
        <div>
          {/* Summary banner */}
          {worstSeverity && (
            <div style={{
              padding: '12px 16px', borderRadius: '10px', marginBottom: '1rem',
              background: { LETHAL:'rgba(88,0,0,0.4)', DANGEROUS:'rgba(120,20,20,0.35)', SEVERE:'rgba(185,28,28,0.22)', HIGH:'rgba(120,53,15,0.28)', MODERATE:'rgba(113,63,18,0.22)', CAUTION:'rgba(113,63,18,0.18)', LOW:'rgba(22,78,30,0.2)', LOW_RISK:'rgba(22,78,30,0.18)', UNKNOWN:'rgba(255,255,255,0.04)' }[worstSeverity] ?? SEVERITY[worstSeverity].bg,
              border: `2px solid ${{ LETHAL:'rgba(239,68,68,0.75)', DANGEROUS:'rgba(239,68,68,0.65)', SEVERE:'rgba(239,68,68,0.55)', HIGH:'rgba(249,115,22,0.55)', MODERATE:'rgba(234,179,8,0.5)', CAUTION:'rgba(234,179,8,0.4)', LOW:'rgba(34,197,94,0.45)', LOW_RISK:'rgba(34,197,94,0.35)', UNKNOWN:'rgba(255,255,255,0.12)' }[worstSeverity] ?? SEVERITY[worstSeverity].border}`,
              display: 'flex', alignItems: 'center', gap: '12px',
            }}>
              <span style={{ fontSize: '20px' }}>
                {worstSeverity === 'LETHAL' ? '☠️' : worstSeverity === 'DANGEROUS' ? '⛔' : worstSeverity === 'SEVERE' ? '🚨' : worstSeverity === 'HIGH' ? '⚠️' : 'ℹ️'}
              </span>
              <div>
                <div style={{ fontSize: '14px', fontWeight: '600', color: SEVERITY[worstSeverity].textColor }}>
                  Most severe: {SEVERITY[worstSeverity].label}
                </div>
                <div style={{ fontSize: '12px', color: SEVERITY[worstSeverity].textColor, opacity: 0.8 }}>
                  {interactions.length} interaction{interactions.length > 1 ? 's' : ''} found for {selected.length} substances
                </div>
              </div>
            </div>
          )}

          {/* Interaction cards */}
          {interactions.map((inter, i) => {
            const sev  = SEVERITY[inter.severity]
            const subA = getSub(inter.a)
            const subB = getSub(inter.b)
            const darkBg = {
              LETHAL:    'rgba(88,0,0,0.4)',
              DANGEROUS: 'rgba(120,20,20,0.35)',
              SEVERE:    'rgba(185,28,28,0.22)',
              HIGH:      'rgba(120,53,15,0.28)',
              MODERATE:  'rgba(113,63,18,0.22)',
              CAUTION:   'rgba(113,63,18,0.18)',
              LOW:       'rgba(22,78,30,0.2)',
              LOW_RISK:  'rgba(22,78,30,0.18)',
              UNKNOWN:   'rgba(255,255,255,0.04)',
            }
            const darkBorder = {
              LETHAL:    'rgba(239,68,68,0.75)',
              DANGEROUS: 'rgba(239,68,68,0.65)',
              SEVERE:    'rgba(239,68,68,0.55)',
              HIGH:      'rgba(249,115,22,0.55)',
              MODERATE:  'rgba(234,179,8,0.5)',
              CAUTION:   'rgba(234,179,8,0.4)',
              LOW:       'rgba(34,197,94,0.45)',
              LOW_RISK:  'rgba(34,197,94,0.35)',
              UNKNOWN:   'rgba(255,255,255,0.12)',
            }
            return (
              <div key={i} style={{
                marginBottom: '10px',
                border: `1px solid ${darkBorder[inter.severity] ?? sev.border}`,
                borderRadius: '12px',
                overflow: 'hidden',
                background: darkBg[inter.severity] ?? sev.bg,
              }}>
                <div style={{ padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '15px' }}>{subA?.emoji}</span>
                    <span style={{ fontSize: '14px', fontWeight: '600', color: '#f0f4ff' }}>{subA?.name}</span>
                    <span style={{ fontSize: '13px', color: 'rgba(240,244,255,0.3)' }}>+</span>
                    <span style={{ fontSize: '15px' }}>{subB?.emoji}</span>
                    <span style={{ fontSize: '14px', fontWeight: '600', color: '#f0f4ff' }}>{subB?.name}</span>
                    {(subA?.rx || subB?.rx) && (
                      <span style={{ fontSize: '10px', padding: '1px 6px', borderRadius: '4px', background: 'rgba(124,58,237,0.2)', color: '#c4b5fd', border: '1px solid rgba(124,58,237,0.4)', fontWeight: '500' }}>Rx</span>
                    )}
                  </div>
                  <span style={{
                    fontSize: '11px', fontWeight: '700', padding: '3px 10px',
                    borderRadius: '999px', background: sev.color, color: 'white', whiteSpace: 'nowrap',
                  }}>
                    {sev.label}
                  </span>
                </div>

                <div style={{ padding: '0 14px 12px' }}>
                  <p style={{ fontSize: '13px', color: 'rgba(240,244,255,0.8)', opacity: 1, margin: '0 0 6px', lineHeight: '1.6' }}>
                    {inter.mechanism}
                  </p>
                  {inter.warning && (
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'flex-start', marginTop: '6px', padding: '6px 10px', background: 'rgba(0,0,0,0.3)', borderRadius: '6px' }}>
                      <span style={{ fontSize: '13px', flexShrink: 0 }}>⚠️</span>
                      <p style={{ fontSize: '12px', fontWeight: '600', color: '#f0f4ff', margin: 0, lineHeight: '1.5' }}>
                        {inter.warning}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )
          })}

          {/* Footer */}
          <div style={{ marginTop: '1rem', padding: '10px 14px', background: '#0f1629', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '10px', fontSize: '11px', color: 'rgba(240,244,255,0.35)', lineHeight: '1.6' }}>
            Interactions sourced from TripSit interaction database, published pharmacology literature, and clinical case reports. Severity ratings are hardcoded — not AI-generated. For prescription drug interactions, always consult a pharmacist or physician.
          </div>
        </div>
      )}
    </main>
  )
}