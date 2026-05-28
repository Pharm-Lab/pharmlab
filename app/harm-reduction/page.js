export default function HarmReduction() {
  return (
    <main style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem 1rem', fontFamily: 'sans-serif' }}>

      <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '14px', padding: '1.5rem', marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#111827', margin: '0 0 8px' }}>
          Harm Reduction Tools
        </h1>
        <p style={{ fontSize: '14px', color: '#6b7280', margin: '0 0 12px', lineHeight: '1.6' }}>
          These tools provide pharmacokinetic information about substances to support informed decision-making. We are honest: we frame this as educational, but we know people will use it to make real choices. That is exactly why accurate information matters more than abstinence-only messaging.
        </p>
        <div style={{ background: '#fef9c3', border: '1px solid #fde047', borderRadius: '8px', padding: '10px 14px', fontSize: '13px', color: '#854d0e' }}>
          <strong>This is not medical advice.</strong> These are pharmacokinetic models based on population averages. Individual responses vary significantly based on genetics, tolerance, medications, and health status. If you are struggling with substance use, resources are listed below.
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', marginBottom: '2rem' }}>

        <a href="/harm-reduction/alcohol" style={{ textDecoration: 'none' }}>
          <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '1.25rem', height: '100%', boxSizing: 'border-box' }}>
            <div style={{ fontSize: '28px', marginBottom: '10px' }}>🍺</div>
              <h2 style={{ fontSize: '15px', fontWeight: '600', color: '#111827', margin: '0 0 6px' }}>Alcohol</h2>
              <p style={{ fontSize: '13px', color: '#6b7280', margin: '0 0 10px', lineHeight: '1.5' }}>BAC curve, Widmark model, legal limits for NL/DE/BE/FR, food effects, steady state simulation.</p>
              <span style={{ fontSize: '12px', color: '#2563eb', fontWeight: '500' }}>Open calculator →</span>
            </div>
        </a>

        <a href="/harm-reduction/mdma" style={{ textDecoration: 'none' }}>
          <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '1.25rem', height: '100%', boxSizing: 'border-box' }}>
            <div style={{ fontSize: '28px', marginBottom: '10px' }}>💊</div>
            <h2 style={{ fontSize: '15px', fontWeight: '600', color: '#111827', margin: '0 0 6px' }}>MDMA</h2>
            <p style={{ fontSize: '13px', color: '#6b7280', margin: '0 0 10px', lineHeight: '1.5' }}>Plasma concentration, multi-dose simulation, CYP2D6 variation, dangerous combinations.</p>
            <span style={{ fontSize: '12px', color: '#7c3aed', fontWeight: '500' }}>Open calculator →</span>
          </div>
        </a>

        <a href="/harm-reduction/cannabis" style={{ textDecoration: 'none' }}>
          <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '1.25rem', height: '100%', boxSizing: 'border-box' }}>
            <div style={{ fontSize: '28px', marginBottom: '10px' }}>🌿</div>
            <h2 style={{ fontSize: '15px', fontWeight: '600', color: '#111827', margin: '0 0 6px' }}>Cannabis</h2>
            <p style={{ fontSize: '13px', color: '#6b7280', margin: '0 0 10px', lineHeight: '1.5' }}>Smoked vs oral THC, edible delay modelled, driving limits, food effects.</p>
            <span style={{ fontSize: '12px', color: '#16a34a', fontWeight: '500' }}>Open calculator →</span>
          </div>
        </a>

        <a href="/harm-reduction/cocaine" style={{ textDecoration: 'none' }}>
          <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '1.25rem', height: '100%', boxSizing: 'border-box' }}>
           <div style={{ fontSize: '28px', marginBottom: '10px' }}>🤧</div>
           <h2 style={{ fontSize: '15px', fontWeight: '600', color: '#111827', margin: '0 0 6px' }}>Cocaine</h2>
            <p style={{ fontSize: '13px', color: '#6b7280', margin: '0 0 10px', lineHeight: '1.5' }}>Intranasal PK, binge pattern visualised, cocaethylene warning, cardiovascular risk zones.</p>
            <span style={{ fontSize: '12px', color: '#dc2626', fontWeight: '500' }}>Open calculator →</span>
          </div>
        </a>

        <a href="/harm-reduction/amphetamines" style={{ textDecoration: 'none' }}>
          <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '1.25rem', height: '100%', boxSizing: 'border-box' }}>
            <div style={{ fontSize: '28px', marginBottom: '10px' }}>⚡</div>
            <h2 style={{ fontSize: '15px', fontWeight: '600', color: '#111827', margin: '0 0 6px' }}>Amphetamines</h2>
            <p style={{ fontSize: '13px', color: '#6b7280', margin: '0 0 10px', lineHeight: '1.5' }}>
              Speed and methamphetamine PK, long t½ visualised, sleep deprivation risk, vitamin C elimination effect.
            </p>
            <span style={{ fontSize: '12px', color: '#f97316', fontWeight: '500' }}>Open calculator →</span>
          </div>
        </a>

        <a href="/harm-reduction/cathinones" style={{ textDecoration: 'none' }}>
          <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '1.25rem', height: '100%', boxSizing: 'border-box' }}>
            <div style={{ fontSize: '28px', marginBottom: '10px' }}>🧪</div>
            <h2 style={{ fontSize: '15px', fontWeight: '600', color: '#111827', margin: '0 0 6px' }}>Cathinones</h2>
            <p style={{ fontSize: '13px', color: '#6b7280', margin: '0 0 10px', lineHeight: '1.5' }}>Variable compounds, high uncertainty, harm reduction focus.</p>
            <span style={{ fontSize: '12px', color: '#f97316', fontWeight: '500' }}>Open calculator →</span>
          </div>
        </a>

      </div>

      <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '1.25rem' }}>
        <h2 style={{ fontSize: '15px', fontWeight: '600', color: '#111827', margin: '0 0 10px' }}>Need support?</h2>
        <p style={{ fontSize: '13px', color: '#6b7280', margin: '0 0 12px' }}>
          If you or someone you know is struggling with substance use, these organisations offer confidential, non-judgmental support:
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '8px' }}>
          {[
            { name: 'Trimbos Instituut', desc: 'Dutch national expertise on mental health and addiction', url: 'https://www.trimbos.nl', flag: '🇳🇱' },
            { name: 'Jellinek',          desc: 'Addiction care and information (NL)',                    url: 'https://www.jellinek.nl', flag: '🇳🇱' },
            { name: 'Drugsinfo.nl',      desc: 'Anonymous drug information line',                       url: 'https://www.drugsinfo.nl', flag: '🇳🇱' },
            { name: 'DanceSafe',         desc: 'Harm reduction for nightlife and festivals',            url: 'https://dancesafe.org', flag: '🌍' },
          ].map(r => (
            <a key={r.name} href={r.url} target="_blank" rel="noopener noreferrer"
              style={{ textDecoration: 'none', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '10px 12px', display: 'block' }}>
              <div style={{ fontSize: '12px', fontWeight: '600', color: '#111827', marginBottom: '2px' }}>{r.flag} {r.name}</div>
              <div style={{ fontSize: '11px', color: '#6b7280' }}>{r.desc}</div>
            </a>
          ))}
        </div>
      </div>

    </main>
  )
}