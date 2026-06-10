'use client'
import { useState, useEffect } from 'react'

const DATA = [
  {
    id: 0, col: '#378ADD', bg: '#E6F1FB', dark: '#0C447C', border: '#B5D4F4',
    title: 'Oral administration',
    sub: 'Where the journey begins',
    plain: 'When you swallow a tablet, the drug first has to dissolve in your gut fluid before it can do anything. Think of it like dissolving a sugar cube in water — a crushed cube dissolves faster than a whole one. This is why manufacturers grind drugs into tiny particles, and why some drugs come as liquid formulations.',
    facts: [
      {
        h: 'Why particle size matters',
        body: 'Smaller particles = larger surface area = faster dissolution. This is the entire principle behind micronisation and nanomedicine. A BCS Class II drug (poorly soluble but well absorbed once dissolved) can go from 20% to 90% absorbed just by reducing particle size.',
        hi: false,
      },
      {
        h: 'Noyes-Whitney equation',
        mono: 'dC/dt = (D·A·Cs) / (h·V)',
        body: 'Dissolution rate increases with surface area (A) and saturation solubility (Cs). D is the diffusion coefficient, h the diffusion layer thickness, V the volume of fluid.',
        hi: true,
      },
      {
        h: 'BCS classification system',
        body: 'Class I (high solubility, high permeability): easily absorbed — most common drugs. Class II (low S, high P): dissolution-limited — micronise or use amorphous solid dispersions. Class III (high S, low P): permeability is the barrier. Class IV (low/low): poor oral candidate, often needs reformulation or a different route.',
        hi: false,
      },
    ]
  },
  {
    id: 1, col: '#1D9E75', bg: '#E1F5EE', dark: '#085041', border: '#9FE1CB',
    title: 'GI absorption',
    sub: 'Crossing the intestinal wall',
    plain: 'The dissolved drug now has to cross the lining of your intestine to get into the bloodstream. The intestine is basically a very selective bouncer — it lets some things through and blocks others. The key rule: only the uncharged (unionised) form of the drug can cross. This means the drug\'s behaviour changes depending on whether it\'s in the acidic stomach or the more neutral small intestine.',
    facts: [
      {
        h: 'The pH-partition hypothesis',
        mono: 'Fraction unionised (acid) = 1 / (1 + 10^(pH−pKa))',
        body: 'Only the unionised form crosses the lipid membrane. Weak acids (e.g. aspirin, pKa 3.5) are mostly unionised in the stomach (pH 2) — some gastric absorption. Weak bases (most drugs, pKa ~8–9) become unionised in the small intestine (pH 6–7.4) — primary absorption site. The small intestine also has a huge surface area (~200 m²) due to villi.',
        hi: true,
      },
      {
        h: 'The gut wall fights back — P-gp',
        body: 'P-glycoprotein (P-gp) is a molecular pump in the intestinal wall that actively pushes drug back into the gut lumen. Many drugs that look like good candidates are partially defeated by P-gp. Grapefruit juice inhibits both P-gp and CYP3A4 in the gut wall — this is why it causes such dramatic drug interactions.',
        hi: false,
      },
      {
        h: 'Bioavailability has three components',
        mono: 'F = Fabs × Fgut × Fliver',
        body: 'Fabs = fraction absorbed from gut lumen. Fgut = fraction surviving gut-wall metabolism. Fliver = fraction surviving hepatic first-pass. A drug can be well absorbed (Fabs = 0.9) but still have low overall bioavailability (F = 0.3) due to gut and liver losses combined.',
        hi: false,
      },
    ]
  },
  {
    id: 2, col: '#D85A30', bg: '#FAECE7', dark: '#712B13', border: '#F5C4B3',
    title: 'Hepatic first-pass',
    sub: 'The liver intercepts everything from the gut',
    plain: 'Here\'s something that surprises most people: blood from your intestines does NOT go directly to the rest of your body. It goes to your liver first, via the portal vein. The liver gets first look at everything you absorb — and for some drugs, it removes so much of the dose in that first pass that barely anything reaches the rest of the body. This is why some drugs that work brilliantly as injections are useless as tablets.',
    facts: [
      {
        h: 'Extraction ratio — the key concept',
        mono: 'EH = (CA − CV) / CA\nF = 1 − EH',
        body: 'EH is the fraction of drug removed by the liver in one pass. Morphine EH ≈ 0.75: the liver removes 75% → oral bioavailability only ~25%. This is why oral morphine doses are 3–5× higher than IV doses. Lidocaine EH ≈ 0.65: essentially useless orally — must be given IV.',
        hi: true,
      },
      {
        h: 'Two types of hepatic clearance',
        mono: 'CLH = QH × (fu·CLint) / (QH + fu·CLint)',
        body: 'High extraction drugs (EH > 0.7): clearance is limited by blood flow to the liver (~80 L/h). Enzyme inhibitors/inducers have little effect. Low extraction drugs (EH < 0.3): clearance depends on enzyme capacity and protein binding. These are the drugs where CYP interactions and pharmacogenomics matter most.',
        hi: false,
      },
    ]
  },
  {
    id: 3, col: '#7F77DD', bg: '#EEEDFE', dark: '#3C3489', border: '#CECBF6',
    title: 'Distribution',
    sub: 'Drug spreads from blood into tissues',
    plain: 'Once in the bloodstream, the drug gets carried everywhere — but it doesn\'t stay evenly in the blood. It seeps into tissues, fat, muscles, organs. The "volume of distribution" (Vd) is a number that tells you how widely a drug spreads. A very high Vd means the drug has left the blood and is hiding in tissues — this is why some drugs have a very long duration even after blood levels look low.',
    facts: [
      {
        h: 'Volume of distribution — what it actually means',
        mono: 'Vd = Vp + Vt × (fu / fut)',
        body: 'Vd is NOT a real anatomical volume — it\'s a mathematical concept. Vd 3L = stays in plasma. 15L = distributes to interstitial fluid. 42L = throughout total body water. >100L = extensively bound to tissues (e.g. chloroquine Vd > 200 L/kg — most of the drug is in tissues, almost none in blood).',
        hi: true,
      },
      {
        h: 'Protein binding',
        body: 'About 90–99% of some drugs are bound to plasma proteins (mainly albumin for acidic drugs, α1-acid glycoprotein for basic drugs). Only the unbound fraction can cross membranes, be metabolised, or be filtered by the kidney. Protein binding is a dynamic equilibrium — as free drug is removed, bound drug releases to replenish it. It acts as a buffer, not a permanent trap.',
        hi: false,
      },
    ]
  },
  {
    id: 4, col: '#534AB7', bg: '#EEEDFE', dark: '#26215C', border: '#AFA9EC',
    title: 'Blood-brain barrier',
    sub: 'The CNS is very picky about what gets in',
    plain: 'The brain protects itself from most molecules in the blood — it has a specialised barrier where the blood vessels are sealed tightly. This is great for protection but a major problem for CNS drugs. Many drugs that work well elsewhere in the body simply cannot get into the brain. Designing drugs that cross the BBB is one of the hardest problems in pharmaceutical sciences.',
    facts: [
      {
        h: 'What makes the BBB so selective',
        body: 'Brain capillary cells are sealed with tight junctions — unlike most blood vessels which have small gaps. On top of this, P-glycoprotein is expressed at very high levels in the BBB and actively pumps many drugs straight back out into the blood. So a drug might cross the membrane, then immediately get ejected.',
        hi: false,
      },
      {
        h: 'The CNS drug rules of thumb',
        body: 'MW < 450 Da. logP between 1 and 3 (lipophilic enough to cross, but not so lipophilic it gets stuck in the membrane). ≤3 H-bond donors. Not a P-gp substrate. These are guidelines, not guarantees — many drugs that fit the profile still fail in practice.',
        hi: true,
      },
      {
        h: 'Clever workarounds',
        body: 'Prodrugs: levodopa crosses the BBB, then gets converted to dopamine (which cannot cross) inside the brain — this is the entire basis of Parkinson\'s treatment. Intranasal delivery: drugs can travel along the olfactory nerve directly to the brain, bypassing the BBB entirely. Nanoparticle targeting of transferrin receptors tricks the brain into taking up the carrier.',
        hi: false,
      },
    ]
  },
  {
    id: 5, col: '#BA7517', bg: '#FAEEDA', dark: '#412402', border: '#FAC775',
    title: 'Hepatic metabolism',
    sub: 'The liver chemically transforms drugs',
    plain: 'Your body is constantly trying to eliminate foreign chemicals — drugs included. The liver is the main factory for this, using enzymes to chemically modify drugs into forms that are easier to excrete. This sounds simple but has huge clinical implications: the same enzyme that metabolises a drug can also be inhibited or induced by other drugs, foods, or genetic variation. This is the source of most clinically relevant drug interactions.',
    facts: [
      {
        h: 'Phase I — making the drug more reactive',
        body: 'Mainly CYP450 enzymes add or expose chemical groups (usually -OH via oxidation). CYP3A4 handles ~50% of all drugs. CYP2D6, CYP2C9, CYP2C19 handle most of the rest. Phase I metabolites are often still pharmacologically active — codeine is a prodrug converted to morphine by CYP2D6. ~7% of Europeans lack functional CYP2D6 (poor metabolisers): they get no analgesia from codeine but potentially toxicity from standard antidepressant doses.',
        hi: true,
      },
      {
        h: 'Phase II — making it water-soluble for excretion',
        body: 'Conjugation reactions attach large polar groups to the drug or its Phase I metabolite. Glucuronidation (UGT) is the most common. Products are large, charged, water-soluble, and biologically inactive — designed to be excreted in urine or bile. When Phase II is overwhelmed (paracetamol overdose), toxic Phase I metabolites (NAPQI) accumulate.',
        hi: false,
      },
      {
        h: 'Non-linear kinetics at high doses',
        mono: 'v = (Vmax × C) / (Km + C)',
        body: 'At normal doses (C << Km): first-order kinetics, constant clearance. At high doses (C >> Km): zero-order kinetics — clearance decreases as enzymes saturate. Phenytoin, ethanol, high-dose aspirin all show this. A 50% dose increase can cause a 200% plasma level increase.',
        hi: false,
      },
    ]
  },
  {
    id: 6, col: '#0F6E56', bg: '#E1F5EE', dark: '#04342C', border: '#9FE1CB',
    title: 'Renal excretion',
    sub: 'The kidneys filter drug into urine',
    plain: 'The kidneys are the main exit route for most drugs and their metabolites. They work by filtering blood continuously — the equivalent of cleaning your entire blood volume about 60 times per day. But the kidneys don\'t just passively filter; they also actively pump some drugs into the urine (secretion) and can reabsorb others back into the blood. This is why kidney disease affects drug dosing so profoundly.',
    facts: [
      {
        h: 'Three things happen simultaneously',
        mono: 'CLR = fu·GFR + CLsec − CLreabs',
        body: 'Glomerular filtration (~120 mL/min): only unbound drug is filtered — protein-bound drug passes through. Tubular secretion (OAT/OCT transporters): active pumps that can push drug into urine faster than filtration alone. Tubular reabsorption: lipophilic, unionised drug diffuses back into blood from the tubule. The net result of all three determines renal clearance.',
        hi: true,
      },
      {
        h: 'pH trapping — a clinical tool',
        body: 'If a drug is a weak base, making the urine acidic means more of it is ionised → it can\'t be reabsorbed → excreted faster. For weak acids, alkalinising the urine (giving sodium bicarbonate) does the same. This is used clinically to treat poisoning with salicylates (aspirin overdose) or phenobarbital — you can accelerate excretion by adjusting urine pH.',
        hi: false,
      },
      {
        h: 'Why kidney disease changes drug dosing',
        body: 'The fraction excreted unchanged (fe) tells you how much renal impairment matters for a drug. Metformin fe=1.0: entirely dependent on kidney filtration — causes dangerous lactic acidosis in CKD, must be stopped. Gentamicin fe=0.95: accumulates in kidney failure, toxic to kidneys themselves (nephrotoxic). The Cockcroft-Gault equation estimates remaining kidney function from age, weight, sex, and serum creatinine.',
        hi: false,
      },
    ]
  },
  {
    id: 7, col: '#185FA5', bg: '#E6F1FB', dark: '#042C53', border: '#B5D4F4',
    title: 'EHC and final excretion',
    sub: 'Sometimes the body recycles before excreting',
    plain: 'You might think once the liver has modified a drug, it\'s gone — but sometimes the liver secretes drug metabolites into bile, which empties into your intestine, where gut bacteria undo the modification, and the drug gets reabsorbed. This "recycling loop" (enterohepatic recirculation) can significantly extend how long a drug stays in your body. It also explains a surprising drug interaction you might not expect.',
    facts: [
      {
        h: 'The enterohepatic cycle',
        body: 'Step by step: liver conjugates drug with glucuronic acid → conjugate secreted into bile → bile empties into small intestine → gut bacteria have the enzyme β-glucuronidase which cleaves the conjugate → free drug is reabsorbed → goes back to liver via portal vein → cycle repeats. This creates a characteristic second peak on the plasma concentration-time curve, typically 4–8h after dosing. Examples: estradiol, morphine, some NSAIDs.',
        hi: true,
      },
      {
        h: 'The antibiotic-contraceptive interaction',
        body: 'Oral contraceptives undergo enterohepatic recirculation. If you take broad-spectrum antibiotics, they kill the gut bacteria responsible for deconjugation → the recycling loop is broken → less drug is reabsorbed → plasma levels fall → contraceptive efficacy may be reduced. This is the pharmacological mechanism behind the clinical advice to use additional contraception with antibiotics (though clinical significance is debated for most modern antibiotics).',
        hi: false,
      },
      {
        h: 'How drugs actually leave the body',
        body: 'Urine: the main route for hydrophilic drugs and Phase II metabolites. Faeces: biliary excretion plus unabsorbed drug. Exhaled air: volatile compounds (ethanol, some anaesthetic gases). Breast milk: clinically important — some drugs transfer and reach breastfed infants. Sweat and saliva: minor but relevant for drug testing.',
        hi: false,
      },
    ]
  },
]

function PathwaySVG({ active, onPick }) {
  useEffect(() => {
    const style = document.createElement('style')
    style.id = 'adme-anim'
    style.textContent = `
      @keyframes adme-dash { to { stroke-dashoffset: -32; } }
      @keyframes adme-dash2 { to { stroke-dashoffset: -24; } }
      .adme-fl  { stroke-dasharray: 7 5; animation: adme-dash 1.8s linear infinite; }
      .adme-fl2 { stroke-dasharray: 5 7; animation: adme-dash2 2.6s linear infinite; }
    `
    if (!document.getElementById('adme-anim')) document.head.appendChild(style)
    return () => document.getElementById('adme-anim')?.remove()
  }, [])

  const node = (id, cx, cy, r, l1, l2) => {
    const d = DATA[id]
    const isActive = active === id
    return (
      <g key={id} style={{ cursor: 'pointer' }} onClick={() => onPick(active === id ? null : id)}>
        <circle cx={cx} cy={cy} r={r + 8} fill={d.col} opacity={isActive ? 0.18 : 0.07} style={{ transition: 'opacity 0.2s' }} />
        <circle cx={cx} cy={cy} r={r} fill={d.bg} stroke={d.col} strokeWidth={isActive ? 2.5 : 1.5} style={{ transition: 'stroke-width 0.15s' }} />
        {l2
          ? <>
              <text x={cx} y={cy - 5} textAnchor="middle" fontSize="10" fontWeight="600" fill={d.dark} fontFamily="system-ui,sans-serif">{l1}</text>
              <text x={cx} y={cy + 8} textAnchor="middle" fontSize="10" fontWeight="600" fill={d.dark} fontFamily="system-ui,sans-serif">{l2}</text>
            </>
          : <text x={cx} y={cy + 4} textAnchor="middle" fontSize="10" fontWeight="600" fill={d.dark} fontFamily="system-ui,sans-serif">{l1}</text>
        }
      </g>
    )
  }

  return (
    <svg width="240" height="680" viewBox="0 0 240 680" style={{ display: 'block' }}>
      <defs>
        <marker id="adme-ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
          <path d="M1 2L8 5L1 8" fill="none" stroke="context-stroke" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </marker>
      </defs>

      {/* Main flow lines */}
      <line className="adme-fl" x1="120" y1="58"  x2="120" y2="108" stroke={DATA[1].col} strokeWidth="2" fill="none" markerEnd="url(#adme-ah)" />
      <line className="adme-fl" x1="120" y1="166" x2="120" y2="216" stroke={DATA[2].col} strokeWidth="2" fill="none" markerEnd="url(#adme-ah)" />
      <line className="adme-fl" x1="120" y1="274" x2="120" y2="324" stroke={DATA[3].col} strokeWidth="2" fill="none" markerEnd="url(#adme-ah)" />
      <line className="adme-fl" x1="120" y1="390" x2="120" y2="438" stroke={DATA[6].col} strokeWidth="2" fill="none" markerEnd="url(#adme-ah)" />
      <line className="adme-fl" x1="120" y1="500" x2="120" y2="548" stroke={DATA[7].col} strokeWidth="2" fill="none" markerEnd="url(#adme-ah)" />

      {/* Branch lines from distribution */}
      <path className="adme-fl2" d="M 104 358 C 44 358 28 428 28 458 C 28 488 46 508 68 512" stroke={DATA[4].col} strokeWidth="1.5" fill="none" markerEnd="url(#adme-ah)" />
      <path className="adme-fl2" d="M 136 358 C 196 358 212 428 212 458 C 212 488 194 508 172 512" stroke={DATA[5].col} strokeWidth="1.5" fill="none" markerEnd="url(#adme-ah)" />

      {/* EHC loop */}
      <path className="adme-fl2" d="M 138 564 C 230 564 234 420 234 358 C 234 290 214 256 188 244" stroke="#AFA9EC" strokeWidth="1.2" fill="none" strokeDasharray="4 8" opacity="0.7" markerEnd="url(#adme-ah)" />

      {/* Flow labels */}
      <text x="128" y="88"  fontSize="9.5" fill={DATA[1].col} fontFamily="system-ui,sans-serif" opacity="0.8">GI lumen</text>
      <text x="128" y="196" fontSize="9.5" fill={DATA[2].col} fontFamily="system-ui,sans-serif" opacity="0.8">portal vein</text>
      <text x="128" y="304" fontSize="9.5" fill={DATA[3].col} fontFamily="system-ui,sans-serif" opacity="0.8">→ systemic</text>
      <text x="128" y="468" fontSize="9.5" fill={DATA[6].col} fontFamily="system-ui,sans-serif" opacity="0.8">filtered</text>

      {/* Nodes — larger */}
      {node(0, 120,  34, 26, 'oral', 'dose')}
      {node(1, 120, 136, 26, 'GI', 'absorb.')}
      {node(2, 120, 244, 26, 'first-', 'pass')}
      {node(3, 120, 356, 28, 'distrib-', 'ution')}
      {node(4,  68, 524, 22, 'BBB', null)}
      {node(5, 172, 524, 22, 'metab.', null)}
      {node(6, 120, 462, 26, 'renal', 'excr.')}
      {node(7, 120, 568, 26, 'EHC /', 'excr.')}

      {/* Exit arrow */}
      <line x1="120" y1="596" x2="120" y2="636" stroke="#9ca3af" strokeWidth="1.5" markerEnd="url(#adme-ah)" />
      <text x="120" y="652" textAnchor="middle" fontSize="9" fill="#9ca3af" fontFamily="system-ui,sans-serif">urine · faeces</text>
    </svg>
  )
}

export default function ADMEPage() {
  const [active, setActive] = useState(null)
  const d = active !== null ? DATA[active] : null

  return (
    <main style={{ maxWidth: '1100px', margin: '0 auto', padding: '2rem 1rem', fontFamily: 'system-ui, sans-serif' }}>
      <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#111827', margin: '0 0 4px' }}>Interactive ADME</h1>
      <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '1.5rem', lineHeight: '1.6' }}>
        Click any stage to understand what happens to a drug at that point — plain English first, then the pharmacokinetics.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', border: '1px solid #e5e7eb', borderRadius: '16px', overflow: 'hidden', minHeight: '680px' }}>

        {/* Pathway */}
        <div style={{ background: '#f9fafb', borderRight: '1px solid #e5e7eb', padding: '24px 20px', display: 'flex', justifyContent: 'center' }}>
          <PathwaySVG active={active} onPick={setActive} />
        </div>

        {/* Content */}
        <div style={{ padding: '32px 28px', overflowY: 'auto', maxHeight: '680px', display: 'flex', flexDirection: 'column', justifyContent: active !== null ? 'flex-start' : 'center' }}>
          {d === null ? (
            <div style={{ textAlign: 'center', color: '#9ca3af' }}>
              <div style={{ fontSize: '40px', marginBottom: '12px', opacity: 0.35 }}>←</div>
              <p style={{ fontSize: '15px', fontWeight: '500', color: '#6b7280', marginBottom: '6px' }}>Select a stage</p>
              <p style={{ fontSize: '13px', color: '#9ca3af', maxWidth: '220px', margin: '0 auto', lineHeight: 1.6 }}>
                Each node explains what happens to the drug there — from plain English to the equations.
              </p>
            </div>
          ) : (
            <div key={active}>
              {/* Title */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: d.col, flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: '20px', fontWeight: '600', color: '#111827', lineHeight: 1.2 }}>{d.title}</div>
                  <div style={{ fontSize: '13px', color: '#6b7280', marginTop: '2px' }}>{d.sub}</div>
                </div>
              </div>

              {/* Plain English intro */}
              <div style={{ padding: '14px 16px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', marginBottom: '14px', fontSize: '14px', color: '#374151', lineHeight: '1.75' }}>
                {d.plain}
              </div>

              {/* Technical sections */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {d.facts.map((f, i) => (
                  <div key={i} style={{
                    borderRadius: '10px', padding: '12px 14px',
                    background: f.hi ? d.bg : '#f9fafb',
                    border: `1px solid ${f.hi ? d.border : '#e5e7eb'}`,
                  }}>
                    <p style={{ fontSize: '11px', fontWeight: '600', color: f.hi ? d.col : '#6b7280', textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 6px' }}>
                      {f.h}
                    </p>
                    {f.mono && (
                      <div style={{ padding: '8px 11px', borderRadius: '6px', background: '#0a0f1e', fontFamily: 'ui-monospace, monospace', fontSize: '12px', color: '#93b4f7', whiteSpace: 'pre-wrap', marginBottom: '7px', lineHeight: 1.6 }}>
                        {f.mono}
                      </div>
                    )}
                    <p style={{ fontSize: '13px', color: '#374151', margin: 0, lineHeight: '1.7' }}>{f.body}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div style={{ marginTop: '1rem', padding: '10px 14px', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '12px', color: '#6b7280' }}>
        ADME = <strong>A</strong>bsorption · <strong>D</strong>istribution · <strong>M</strong>etabolism · <strong>E</strong>xcretion — every pharmacokinetic parameter has a direct physiological basis at one of these stages.
      </div>
    </main>
  )
}