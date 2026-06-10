export default function Tools() {
  return (
    <main style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem 1rem', fontFamily: 'sans-serif' }}>
      <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#111827', margin: '0 0 8px' }}>Academic Tools</h1>
      <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '1.5rem', lineHeight: '1.6' }}>
        Pharmacokinetic and pharmaceutical science tools for students. All calculations are deterministic — no AI in the maths.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>

        <a href="/calculator" style={{ textDecoration: 'none' }}>
          <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '1.25rem', height: '100%', boxSizing: 'border-box' }}>
            <div style={{ fontSize: '28px', marginBottom: '10px' }}>📈</div>
            <h2 style={{ fontSize: '15px', fontWeight: '600', color: '#111827', margin: '0 0 6px' }}>PK/PD Calculator</h2>
            <p style={{ fontSize: '13px', color: '#6b7280', margin: '0 0 10px', lineHeight: '1.5' }}>1 and 2-compartment models, linear and MM clearance, population PK simulation, export.</p>
            <span style={{ fontSize: '12px', color: '#2563eb', fontWeight: '500' }}>Open →</span>
          </div>
        </a>

        <a href="/tools/dosage-adjustment" style={{ textDecoration: 'none' }}>
          <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '1.25rem', height: '100%', boxSizing: 'border-box' }}>
            <div style={{ fontSize: '28px', marginBottom: '10px' }}>🫘</div>
            <h2 style={{ fontSize: '15px', fontWeight: '600', color: '#111827', margin: '0 0 6px' }}>Dosage Adjustment</h2>
            <p style={{ fontSize: '13px', color: '#6b7280', margin: '0 0 10px', lineHeight: '1.5' }}>Renal (Cockcroft-Gault) and hepatic (Child-Pugh) dose adjustment with curve comparison.</p>
            <span style={{ fontSize: '12px', color: '#2563eb', fontWeight: '500' }}>Open →</span>
          </div>
        </a>

        <a href="/tools/nca" style={{ textDecoration: 'none' }}>
            <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '1.25rem', height: '100%', boxSizing: 'border-box' }}>
                <div style={{ fontSize: '28px', marginBottom: '10px' }}>📊</div>
                <h2 style={{ fontSize: '15px', fontWeight: '600', color: '#111827', margin: '0 0 6px' }}>NCA Tool</h2>
                <p style={{ fontSize: '13px', color: '#6b7280', margin: '0 0 10px', lineHeight: '1.5' }}>Paste raw C-time data → trapezoidal AUC, log-linear λz regression, t½, CL/F, Vd/F, MRT.</p>
                <span style={{ fontSize: '12px', color: '#2563eb', fontWeight: '500' }}>Open →</span>
            </div>
        </a>

        <a href="/tools/bioequivalence" style={{ textDecoration: 'none' }}>
            <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '1.25rem', height: '100%', boxSizing: 'border-box' }}>
                <div style={{ fontSize: '28px', marginBottom: '10px' }}>⚖️</div>
                <h2 style={{ fontSize: '15px', fontWeight: '600', color: '#111827', margin: '0 0 6px' }}>Bioequivalence Analyser</h2>
                <p style={{ fontSize: '13px', color: '#6b7280', margin: '0 0 10px', lineHeight: '1.5' }}>TOST procedure on log-transformed AUC and Cmax. 90% CI plot, GMR, FDA/EMA acceptance criterion.</p>
                <span style={{ fontSize: '12px', color: '#2563eb', fontWeight: '500' }}>Open →</span>
            </div>
        </a>

        <a href="/interactions" style={{ textDecoration: 'none' }}>
          <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '1.25rem', height: '100%', boxSizing: 'border-box' }}>
            <div style={{ fontSize: '28px', marginBottom: '10px' }}>⚗️</div>
            <h2 style={{ fontSize: '15px', fontWeight: '600', color: '#111827', margin: '0 0 6px' }}>Drug Interaction Checker</h2>
            <p style={{ fontSize: '13px', color: '#6b7280', margin: '0 0 10px', lineHeight: '1.5' }}>AI-powered interaction analysis with enzyme pathway, severity, and exam angles.</p>
            <span style={{ fontSize: '12px', color: '#2563eb', fontWeight: '500' }}>Open →</span>
          </div>
        </a>

        <a href="/exercises" style={{ textDecoration: 'none' }}>
          <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '1.25rem', height: '100%', boxSizing: 'border-box' }}>
            <div style={{ fontSize: '28px', marginBottom: '10px' }}>✏️</div>
            <h2 style={{ fontSize: '15px', fontWeight: '600', color: '#111827', margin: '0 0 6px' }}>Exercise Helper</h2>
            <p style={{ fontSize: '13px', color: '#6b7280', margin: '0 0 10px', lineHeight: '1.5' }}>Step-by-step PK/PD exercise solutions with exam tips and follow-up questions.</p>
            <span style={{ fontSize: '12px', color: '#2563eb', fontWeight: '500' }}>Open →</span>
          </div>
        </a>

      </div>
    </main>
  )
}