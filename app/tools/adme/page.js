'use client'
import { useState } from 'react'
import Image from 'next/image'

// ─── Zone definitions ─────────────────────────────────────────────────────────
// Positions are % of the 1024×1024 image (used for hotspot placement)

const ZONES = {
  oral: {
    id: 'oral',
    label: 'Oral dose',
    color: '#2563eb',
    x: 50.0, y: 22.2,  // mouth (measured)
    content: {
      title: 'Oral Administration',
      subtitle: 'The starting point for most drugs',
      sections: [
        {
          heading: 'What happens here',
          text: 'After swallowing, the drug must dissolve in GI fluid before it can be absorbed. Solid dosage forms (tablets, capsules) must first disintegrate, then the drug must dissolve — this is the rate-limiting step for poorly soluble drugs.',
        },
        {
          heading: 'Dissolution — Noyes-Whitney equation',
          formula: 'dC/dt = (D × A × Cs) / (h × V)',
          formulaVars: [
            { sym: 'D', desc: 'Diffusion coefficient' },
            { sym: 'A', desc: 'Surface area of particles' },
            { sym: 'Cs', desc: 'Saturation solubility' },
            { sym: 'h', desc: 'Diffusion layer thickness' },
          ],
          text: 'Smaller particle size → larger surface area → faster dissolution. This is why micronisation and nanoformulations improve poorly soluble drug absorption.',
        },
        {
          heading: 'BCS classification',
          table: [
            ['Class', 'Solubility', 'Permeability', 'Rate-limiting step'],
            ['I',   'High', 'High', 'Gastric emptying'],
            ['II',  'Low',  'High', 'Dissolution'],
            ['III', 'High', 'Low',  'Permeability'],
            ['IV',  'Low',  'Low',  'Both — poor candidate'],
          ],
        },
        {
          heading: 'PK connection',
          text: 'Dissolution rate limits the absorption rate constant ka, and therefore Tmax and Cmax. Extended-release formulations deliberately slow dissolution — this is why ER tablets show a lower, later Cmax than immediate-release.',
          highlight: true,
        },
      ],
    },
  },

  absorption: {
    id: 'absorption',
    label: 'GI absorption',
    color: '#16a34a',
    x: 53.5, y: 66.5,  // GI absorption: nudged down
    content: {
      title: 'Intestinal Absorption',
      subtitle: 'The intestinal wall — first major barrier',
      sections: [
        {
          heading: 'Mechanisms of absorption',
          text: 'Most drugs are absorbed by passive transcellular diffusion — the drug dissolves through the lipid bilayer of enterocytes. This requires the drug to be unionised (neutral) and lipophilic enough to cross the membrane.',
        },
        {
          heading: 'The pH-partition hypothesis',
          formula: 'Fraction unionised (acid) = 1 / (1 + 10^(pH − pKa))',
          text: 'Only the unionised form crosses membranes. Weak acids (e.g. aspirin, pKa 3.5) are predominantly unionised in the acidic stomach → absorbed in stomach. Weak bases (most drugs, pKa ~8–9) are unionised in the alkaline small intestine (pH 6–7.4) → absorbed there. The small intestine\'s vast surface area (~200 m²) makes it the primary absorption site.',
          highlight: true,
        },
        {
          heading: 'Transporters — not just passive diffusion',
          text: 'Influx transporters (OATP, PepT1) actively bring some drugs into enterocytes. Efflux transporters — especially P-glycoprotein (P-gp, MDR1) — actively pump drugs back into the gut lumen, reducing net absorption. P-gp is a major source of drug interactions and variable bioavailability.',
        },
        {
          heading: 'Gut-wall metabolism (CYP3A4)',
          text: 'CYP3A4 is expressed at high levels in enterocytes. Some drugs are significantly metabolised before even reaching the portal vein. Ciclosporin, for example, is metabolised by both intestinal and hepatic CYP3A4 — both contribute to its low and variable bioavailability (~30%).',
        },
        {
          heading: 'Bioavailability F',
          formula: 'F = Fabs × Fgut × Fliver',
          formulaVars: [
            { sym: 'Fabs', desc: 'Fraction absorbed from gut lumen' },
            { sym: 'Fgut', desc: 'Fraction surviving gut-wall metabolism' },
            { sym: 'Fliver', desc: 'Fraction surviving first-pass hepatic extraction' },
          ],
          text: 'A drug might be well absorbed (Fabs = 0.9) but still have low bioavailability (F = 0.3) due to combined gut and hepatic first-pass effects.',
          highlight: true,
        },
      ],
    },
  },

  first_pass: {
    id: 'first_pass',
    label: 'First-pass liver',
    color: '#dc2626',
    x: 44.0, y: 54.5,  // first-pass: centre-left of liver
    content: {
      title: 'Hepatic First-Pass Effect',
      subtitle: 'The liver removes drug before it reaches systemic circulation',
      sections: [
        {
          heading: 'Why this matters',
          text: 'All blood from the GI tract drains into the portal vein, which goes directly to the liver before reaching the heart. For highly extracted drugs, most of the dose is removed in this single passage — dramatically reducing bioavailability.',
        },
        {
          heading: 'Hepatic extraction ratio (EH)',
          formula: 'EH = (CA − CV) / CA',
          formulaVars: [
            { sym: 'CA', desc: 'Concentration entering liver (portal vein)' },
            { sym: 'CV', desc: 'Concentration leaving liver (hepatic vein)' },
          ],
          text: 'EH ranges from 0 to 1. High extraction drugs (EH > 0.7): morphine, lidocaine, propranolol — oral bioavailability often < 30%. Low extraction drugs (EH < 0.3): warfarin, diazepam — oral and IV bioavailability similar.',
        },
        {
          heading: 'Well-stirred model',
          formula: 'CLH = QH × (fu × CLint) / (QH + fu × CLint)',
          formulaVars: [
            { sym: 'QH', desc: 'Hepatic blood flow (~80 L/h)' },
            { sym: 'fu', desc: 'Unbound fraction in blood' },
            { sym: 'CLint', desc: 'Intrinsic metabolic clearance' },
          ],
          text: 'High-extraction drugs: CLH ≈ QH (blood flow limited — enzyme activity changes matter little). Low-extraction drugs: CLH ≈ fu × CLint (capacity limited — enzyme induction/inhibition has large effects).',
        },
        {
          heading: 'Bioavailability consequence',
          formula: 'F = 1 − EH',
          text: 'Morphine: EH ≈ 0.75, so oral F ≈ 25% — oral doses are 3–5× higher than IV doses. Lidocaine: EH ≈ 0.65, essentially inactive orally — must be given IV.',
          highlight: true,
        },
        {
          heading: 'Clinical drug interactions',
          text: 'CYP3A4 inhibitors (grapefruit juice, ketoconazole) reduce first-pass metabolism → dramatically increase bioavailability of CYP3A4 substrates. Inducers (rifampicin, St. John\'s Wort) increase first-pass → dramatically reduce bioavailability.',
        },
      ],
    },
  },

  distribution: {
    id: 'distribution',
    label: 'Distribution',
    color: '#7c3aed',
    x: 51.8, y: 37.2,  // heart centre (measured)
    content: {
      title: 'Distribution',
      subtitle: 'How drug spreads from blood to tissues',
      sections: [
        {
          heading: 'Volume of distribution (Vd)',
          formula: 'Vd = Vplasma + Vtissue × (fu / fut)',
          formulaVars: [
            { sym: 'Vplasma', desc: 'Plasma volume (~3 L)' },
            { sym: 'fu', desc: 'Unbound fraction in plasma' },
            { sym: 'fut', desc: 'Unbound fraction in tissue' },
          ],
          text: 'Vd is not a real anatomical volume. Vd = 3 L → confined to plasma. Vd = 15 L → distributes to interstitial fluid. Vd = 42 L → total body water. Vd > 100 L → extensive tissue binding.',
          highlight: true,
        },
        {
          heading: 'Plasma protein binding',
          text: 'Only unbound drug distributes into tissues, is metabolised, is renally filtered, and exerts pharmacological effect. Albumin binds acidic drugs; α1-acid glycoprotein binds basic drugs. Highly bound drugs may have smaller Vd if tissue binding is also low.',
        },
        {
          heading: 'Blood-brain barrier',
          text: 'Tight junctions between brain endothelial cells, no fenestrations. Lipophilic, small, uncharged drugs cross readily (diazepam). Large, polar, or ionised drugs are excluded. P-gp is highly expressed at the BBB and actively effluxes many drugs back into blood.',
        },
        {
          heading: 'Factors affecting distribution',
          text: '• Lipophilicity (log P): higher → more tissue distribution, higher Vd\n• Ionisation (pKa + pH): ionised drugs distribute poorly into cells\n• Protein binding: high plasma binding → lower free tissue concentration\n• Tissue binding: drugs binding to phospholipids have very high Vd\n• Perfusion rate: highly perfused tissues (brain, heart, kidney) equilibrate fast',
        },
      ],
    },
  },

  metabolism: {
    id: 'metabolism',
    label: 'Metabolism',
    color: '#f97316',
    x: 52.7, y: 53.3,  // metabolism: split between 52.2 and 54.5
    content: {
      title: 'Hepatic Metabolism',
      subtitle: 'Biotransformation — making drugs more excretable',
      sections: [
        {
          heading: 'Why metabolism happens',
          text: 'Lipophilic drugs would persist indefinitely in the body — they are reabsorbed from the kidney tubule back into blood. Metabolism converts them to more polar, hydrophilic metabolites that can be renally excreted. The liver is the primary site (CYP450 enzymes), but gut wall, lung, kidney, and plasma also contribute.',
        },
        {
          heading: 'Phase I — functionalisation',
          text: '• Oxidation (most common): CYP450 adds –OH group. CYP3A4 metabolises ~50% of all drugs; CYP2D6, CYP2C9, CYP2C19 cover most of the rest.\n• Reduction: azo/nitro groups\n• Hydrolysis: ester bonds (aspirin → salicylate)\n\nPhase I metabolites are often pharmacologically active — codeine → morphine (CYP2D6), prodrugs like enalapril → enalaprilat.',
          highlight: true,
        },
        {
          heading: 'Phase II — conjugation',
          text: '• Glucuronidation (UGT): most common Phase II, adds glucuronic acid → large, polar, ionised metabolite\n• Sulfation (SULT): fast but saturable\n• Acetylation (NAT): fast vs slow acetylator phenotype — isoniazid toxicity\n• Glutathione conjugation: detoxification of reactive metabolites — paracetamol toxicity\n\nPhase II metabolites are almost always inactive and readily excreted.',
        },
        {
          heading: 'CYP450 polymorphisms',
          text: 'CYP2D6: ~7% Europeans are poor metabolisers. PMs on standard codeine doses cannot convert it to morphine → no analgesia. PMs on standard antidepressants → much higher plasma levels → toxicity. Same dose, completely different effects.',
        },
        {
          heading: 'Michaelis-Menten kinetics',
          formula: 'v = (Vmax × C) / (Km + C)',
          formulaVars: [
            { sym: 'Vmax', desc: 'Maximum metabolic rate' },
            { sym: 'Km', desc: 'Concentration at half Vmax' },
            { sym: 'C', desc: 'Drug concentration' },
          ],
          text: 'At C << Km: first-order kinetics — CL constant. At C >> Km: zero-order — CL decreases, small dose increases cause disproportionate concentration rises. Phenytoin, ethanol, salicylate at high doses show this.',
          highlight: true,
        },
      ],
    },
  },

  renal: {
    id: 'renal',
    label: 'Renal excretion',
    color: '#0891b2',
    x: 39.5, y: 68.0,  // renal: nudged down + slight right
    content: {
      title: 'Renal Excretion',
      subtitle: 'The primary route for hydrophilic drugs and metabolites',
      sections: [
        {
          heading: 'Three processes',
          formula: 'CLR = (fu × GFR) + CLsec − CLreabs',
          formulaVars: [
            { sym: 'fu × GFR', desc: 'Glomerular filtration of unbound drug (~120 mL/min)' },
            { sym: 'CLsec', desc: 'Active tubular secretion (OAT, OCT transporters)' },
            { sym: 'CLreabs', desc: 'Passive tubular reabsorption' },
          ],
          text: '1. Glomerular filtration: passive, protein-bound drug NOT filtered — only free drug.\n2. Active tubular secretion: OAT and OCT transporters actively secrete drugs; can exceed GFR. Penicillins, methotrexate.\n3. Tubular reabsorption: lipophilic, unionised drugs reabsorbed back into blood. This is why hydrophilic Phase II metabolites are well excreted.',
          highlight: true,
        },
        {
          heading: 'pH and ionisation',
          text: 'Reabsorption depends on unionised fraction → depends on urinary pH. Acidic urine → weak bases more ionised → less reabsorption → faster excretion. Alkaline urine → weak acids ionised → faster excretion. Clinical use: sodium bicarbonate alkalinises urine to treat salicylate or phenobarbital poisoning.',
        },
        {
          heading: 'Renal impairment',
          text: 'GFR reduction → reduced filtration of drug AND metabolites (some active/toxic). High renal excretion drugs accumulate: gentamicin (fe=0.95), digoxin (fe=0.7), metformin (fe=1.0 — MUST reduce dose or avoid in CKD). Use Cockcroft-Gault to estimate CrCl for dose adjustment.',
        },
      ],
    },
  },

  enterohepatic: {
    id: 'enterohepatic',
    label: 'Enterohepatic recirculation',
    color: '#8b5cf6',
    x: 48.5, y: 61.0,  // EHC: nudged left + down
    content: {
      title: 'Enterohepatic Recirculation',
      subtitle: 'A recycling loop that extends drug exposure',
      sections: [
        {
          heading: 'The cycle',
          text: '1. Drug is conjugated (Phase II glucuronidation) in the liver\n2. Conjugate excreted into bile via MRP2 transporter\n3. Bile empties into small intestine\n4. Gut bacteria express β-glucuronidase → cleave glucuronide\n5. Free drug reabsorbed → portal vein → liver\n\nThis recycling loop significantly extends half-life and total exposure.',
          highlight: true,
        },
        {
          heading: 'PK signature',
          text: 'EHC produces a characteristic double-peak or shoulder on the concentration-time curve — first peak from direct absorption, second (typically 4–8h later) from biliary recycling. Seen with estradiol, morphine, indocyanine green, and many NSAIDs.',
        },
        {
          heading: 'Clinical consequence',
          text: 'Antibiotics that reach the gut (rifampicin, broad-spectrum) kill the bacteria responsible for deconjugation → interrupt the cycle → reduce drug exposure. This is one mechanism behind oral contraceptive failure with antibiotic use — though clinical significance is debated for most modern antibiotics.',
        },
      ],
    },
  },

  bbb: {
    id: 'bbb',
    label: 'Blood-brain barrier',
    color: '#6366f1',
    x: 50.0, y: 8.3,   // brain centre (measured)
    content: {
      title: 'Blood-Brain Barrier',
      subtitle: 'The CNS has uniquely restrictive drug access',
      sections: [
        {
          heading: 'Structure',
          text: 'Brain capillary endothelial cells have tight junctions (no gaps), no fenestrations, and high expression of efflux transporters (especially P-gp/MDR1). Astrocyte foot processes wrap around capillaries. The result: only drugs with the right properties can enter the CNS passively.',
        },
        {
          heading: 'What gets through',
          text: '• Low molecular weight (< 400–500 Da)\n• Lipophilic (log P 1–3 optimal — too high means stuck in membranes)\n• Unionised at physiological pH\n• Not a P-gp substrate\n• Low hydrogen bond donor/acceptor count\n\nCNS drugs typically: MW < 450, log P 1–3, ≤ 3 H-bond donors.',
          highlight: true,
        },
        {
          heading: 'P-glycoprotein at the BBB',
          text: 'P-gp actively effluxes many drugs that appear lipophilic enough to cross. Many HIV antiretrovirals, anticancer drugs, and antibiotics fail to reach therapeutic CNS concentrations even at high doses because of P-gp. P-gp inhibitors can increase CNS exposure — used in some CNS drug delivery strategies.',
        },
        {
          heading: 'CNS drug delivery strategies',
          text: '• Prodrugs that cross BBB then convert to active form inside CNS (levodopa → dopamine)\n• Nanoparticle encapsulation\n• Receptor-mediated transcytosis (transferrin receptor targeting)\n• Intranasal delivery (bypasses BBB via olfactory nerve)\n• Transient BBB disruption (focused ultrasound)',
        },
      ],
    },
  },
}

// ─── Flow paths (SVG paths between hotspots) ─────────────────────────────────
// These are drawn on the SVG overlay as animated dashed lines

const FLOW_PATHS = [
  // Oral → GI absorption: straight down the oesophagus, slight right arc
  { from: 'oral', to: 'absorption', color: '#16a34a',
    cp: [+30, +0.3, +20, -0.3] },
  // GI absorption → First-pass: portal vein arcs left up to liver
  { from: 'absorption', to: 'first_pass', color: '#dc2626',
    cp: [-40, +0.3, -30, -0.3] },
  // First-pass → Distribution: from liver left up and right to heart
  { from: 'first_pass', to: 'distribution', color: '#7c3aed',
    cp: [-25, +0.4, -20, -0.4] },
  // Distribution → BBB: straight up the spine to brain, left offset
  { from: 'distribution', to: 'bbb', color: '#6366f1',
    cp: [-35, +0.4, -30, -0.4] },
  // Distribution → Metabolism: heart arcs right then down to liver right
  { from: 'distribution', to: 'metabolism', color: '#f97316',
    cp: [+40, +0.3, +30, -0.3] },
  // Metabolism → Renal: liver right arcs left down to left kidney
  { from: 'metabolism', to: 'renal', color: '#0891b2',
    cp: [-50, +0.4, -40, -0.4] },
  // First-pass → EHC: short drop down the portal vein, left arc
  { from: 'first_pass', to: 'enterohepatic', color: '#8b5cf6',
    cp: [-20, +0.5, -15, -0.5] },
  // EHC → GI absorption: arcs back right to stomach
  { from: 'enterohepatic', to: 'absorption', color: '#8b5cf6',
    cp: [+25, +0.4, +20, -0.4] },
]

// ─── Content renderer ─────────────────────────────────────────────────────────

function ContentPanel({ zone, onClose }) {
  if (!zone) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'rgba(240,244,255,0.4)', textAlign: 'center', padding: '2rem', gap: '16px' }}>
      <div style={{ fontSize: '48px', opacity: 0.4 }}>←</div>
      <p style={{ fontSize: '14px', lineHeight: '1.7', margin: 0 }}>
        Click any hotspot on the diagram to explore that stage of the ADME pathway.
      </p>
      <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '6px', width: '100%' }}>
        {Object.values(ZONES).map(z => (
          <div key={z.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'rgba(240,244,255,0.35)' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: z.color, flexShrink: 0 }} />
            {z.label}
          </div>
        ))}
      </div>
    </div>
  )

  const { content, color } = zone

  return (
    <div style={{ height: '100%', overflowY: 'auto', padding: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: color, flexShrink: 0 }} />
            <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#f9fafb', margin: 0 }}>{content.title}</h2>
          </div>
          <p style={{ fontSize: '12px', color: 'rgba(240,244,255,0.35)', margin: 0 }}>{content.subtitle}</p>
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#6b7280', fontSize: '20px', cursor: 'pointer', padding: '0 0 0 12px', lineHeight: 1 }}>×</button>
      </div>

      {content.sections.map((s, i) => (
        <div key={i} style={{
          marginBottom: '1rem',
          padding: '12px 14px',
          borderRadius: '10px',
          background: s.highlight ? `${color}18` : '#1f2937',
          border: s.highlight ? `1px solid ${color}44` : '1px solid #374151',
        }}>
          <h3 style={{ fontSize: '12px', fontWeight: '700', color: s.highlight ? color : '#9ca3af', margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.heading}</h3>

          {s.formula && (
            <div style={{ fontFamily: 'monospace', fontSize: '13px', color: color, background: '#111827', padding: '8px 12px', borderRadius: '6px', marginBottom: '8px', letterSpacing: '0.02em' }}>
              {s.formula}
            </div>
          )}

          {s.formulaVars && (
            <div style={{ marginBottom: '8px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
              {s.formulaVars.map(v => (
                <div key={v.sym} style={{ display: 'flex', gap: '8px', fontSize: '11px' }}>
                  <span style={{ fontFamily: 'monospace', color: color, minWidth: '50px', fontWeight: '600' }}>{v.sym}</span>
                  <span style={{ color: 'rgba(240,244,255,0.35)' }}>{v.desc}</span>
                </div>
              ))}
            </div>
          )}

          {s.table && (
            <div style={{ overflowX: 'auto', marginBottom: s.text ? '8px' : 0 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                {s.table.map((row, ri) => (
                  <tr key={ri} style={{ background: ri === 0 ? '#111827' : ri % 2 === 0 ? '#1a2332' : 'transparent' }}>
                    {row.map((cell, ci) => (
                      <td key={ci} style={{ padding: '5px 8px', color: ri === 0 ? '#9ca3af' : '#d1d5db', fontWeight: ri === 0 ? '600' : '400', borderBottom: '1px solid #374151' }}>
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </table>
            </div>
          )}

          {s.text && (
            <p style={{ fontSize: '12px', color: 'rgba(240,244,255,0.6)', margin: 0, lineHeight: '1.7', whiteSpace: 'pre-line' }}>{s.text}</p>
          )}
        </div>
      ))}
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function ADMEPage() {
  const [activeZone, setActiveZone] = useState(null)

  const IMG_W = 520   // rendered width of the image
  const IMG_H = 492   // rendered height (1024×968 aspect ratio)

  // Convert % position to px for SVG overlay
  const px = (pct, dim) => (pct / 100) * dim

  // Build a smooth SVG path — uses per-path cp offsets to separate overlapping lines
  // cp = [xOff1, yFrac1, xOff2, yFrac2]:
  //   cx1 = x1 + xOff1,  cy1 = y1 + (y2-y1)*yFrac1
  //   cx2 = x2 - xOff2,  cy2 = y2 - (y2-y1)*yFrac2  (negative yFrac = above endpoint)
  function buildPath(fromZone, toZone, cp) {
    const x1 = px(fromZone.x, IMG_W)
    const y1 = px(fromZone.y, IMG_H)
    const x2 = px(toZone.x, IMG_W)
    const y2 = px(toZone.y, IMG_H)
    const dy = y2 - y1
    const [xo1, yf1, xo2, yf2] = cp || [0, 0.4, 0, 0.4]
    const cx1 = x1 + xo1
    const cy1 = y1 + dy * yf1
    const cx2 = x2 - xo2
    const cy2 = y2 - dy * yf2
    return `M ${x1} ${y1} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${x2} ${y2}`
  }

  return (
    <main style={{ maxWidth: '1100px', margin: '0 auto', padding: '2rem 1rem', fontFamily: "'Inter',system-ui,sans-serif", background: '#0a0f1e', minHeight: '100vh', color: '#f0f4ff' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap'); * { box-sizing:border-box; }`}</style>
      <a href="/tools" style={{ fontSize: '13px', color: 'rgba(240,244,255,0.4)', textDecoration: 'none' }}>← Tools</a>
      <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#f0f4ff', margin: '1rem 0 4px', letterSpacing: '-0.02em' }}>Interactive ADME</h1>
      <p style={{ fontSize: '13px', color: 'rgba(240,244,255,0.5)', marginBottom: '1.5rem', lineHeight: '1.6' }}>
        Click any labelled stage on the diagram to explore absorption, distribution, metabolism, and excretion in depth.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: `${IMG_W}px 1fr`, gap: '1.5rem', alignItems: 'start' }}>

        {/* ── Left: body image + SVG overlay ── */}
        <div style={{ position: 'relative', width: IMG_W, height: IMG_H, borderRadius: '16px', overflow: 'hidden', background: 'transparent', flexShrink: 0 }}>

          {/* Body image */}
          <Image
            src="/adme-body.png"
            alt="Human body anatomy for ADME"
            width={IMG_W}
            height={IMG_H}
            style={{ display: 'block', width: IMG_W, height: IMG_H, objectFit: 'fill' }}
            priority
          />

          {/* SVG overlay — flow paths + hotspots */}
          <svg
            width={IMG_W}
            height={IMG_H}
            viewBox={`0 0 ${IMG_W} ${IMG_H}`}
            style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}
          >
            <defs>
              <style>{`
                @keyframes dash {
                  to { stroke-dashoffset: -24; }
                }
                .flow-path {
                  stroke-dasharray: 5 7;
                  animation: dash 2s linear infinite;
                  opacity: 0.18;
                  transition: opacity 0.2s, stroke-width 0.2s;
                }
                .flow-path.active {
                  opacity: 1;
                  animation-duration: 0.7s;
                }
              `}</style>
            </defs>

            {/* Flow paths */}
            {FLOW_PATHS.map((fp, i) => {
              const fromZone = ZONES[fp.from]
              const toZone = ZONES[fp.to]
              if (!fromZone || !toZone) return null
              const isActive = activeZone && (activeZone.id === fp.from || activeZone.id === fp.to)
              return (
                <path
                  key={i}
                  d={buildPath(fromZone, toZone, fp.cp)}
                  fill="none"
                  stroke={fp.color}
                  strokeWidth={isActive ? 3.5 : 1.5}
                  className={`flow-path${isActive ? ' active' : ''}`}
                />
              )
            })}
          </svg>

          {/* Hotspot buttons — positioned absolutely over image */}
          {Object.values(ZONES).map(zone => {
            const left = `${zone.x}%`
            const top = `${zone.y}%`
            const isActive = activeZone?.id === zone.id

            return (
              <button
                key={zone.id}
                onClick={() => setActiveZone(isActive ? null : zone)}
                style={{
                  position: 'absolute',
                  left,
                  top,
                  transform: 'translate(-50%, -50%)',
                  width: isActive ? '20px' : '14px',
                  height: isActive ? '20px' : '14px',
                  borderRadius: '50%',
                  background: isActive ? zone.color : `${zone.color}cc`,
                  border: `2px solid ${zone.color}`,
                  cursor: 'pointer',
                  boxShadow: isActive
                    ? `0 0 0 4px ${zone.color}44, 0 0 12px ${zone.color}88`
                    : `0 0 0 2px ${zone.color}33`,
                  transition: 'all 0.15s ease',
                  zIndex: 10,
                  padding: 0,
                }}
                title={zone.label}
              />
            )
          })}

          {/* Labels next to hotspots */}
          {Object.values(ZONES).map(zone => {
            const isActive = activeZone?.id === zone.id
            // Explicit side per zone to avoid collisions
            const labelLeft = {
              oral: false,        // left of mouth dot
              absorption: true,   // right of stomach
              first_pass: false,  // left of liver
              distribution: true, // right of heart
              metabolism: true,   // right of liver
              renal: false,       // left of kidney
              enterohepatic: false, // left (long label)
              bbb: false,         // left of brain
            }
            const onRight = labelLeft[zone.id]
            return (
              <div
                key={`label-${zone.id}`}
                onClick={() => setActiveZone(activeZone?.id === zone.id ? null : zone)}
                style={{
                  position: 'absolute',
                  top: `${zone.y}%`,
                  left: onRight ? `${zone.x + 2}%` : undefined,
                  right: onRight ? undefined : `${100 - zone.x + 2}%`,
                  transform: 'translateY(-50%)',
                  fontSize: '10px',
                  fontWeight: isActive ? '700' : '500',
                  color: isActive ? zone.color : '#e5e7eb',
                  background: isActive ? `${zone.color}22` : 'rgba(10,15,30,0.75)',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  whiteSpace: 'nowrap',
                  cursor: 'pointer',
                  border: isActive ? `1px solid ${zone.color}66` : '1px solid transparent',
                  transition: 'all 0.15s ease',
                  zIndex: 10,
                  pointerEvents: 'auto',
                }}
              >
                {zone.label}
              </div>
            )
          })}
        </div>

        {/* ── Right: info panel ── */}
        <div style={{
          background: '#0f1629',
          borderRadius: '16px',
          border: '1px solid rgba(255,255,255,0.07)',
          minHeight: `${IMG_H}px`,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}>
          <ContentPanel zone={activeZone} onClose={() => setActiveZone(null)} />
        </div>
      </div>

      {/* Image attribution */}
      <p style={{ fontSize: '11px', color: 'rgba(240,244,255,0.2)', marginTop: '0.5rem', marginBottom: '0.25rem' }}>
        Anatomical illustration generated with ChatGPT (OpenAI)
      </p>

      {/* Stage navigation pills below diagram */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '1rem' }}>
        {Object.values(ZONES).map(zone => (
          <button
            key={zone.id}
            onClick={() => setActiveZone(activeZone?.id === zone.id ? null : zone)}
            style={{
              padding: '6px 14px',
              borderRadius: '20px',
              fontSize: '12px',
              fontWeight: activeZone?.id === zone.id ? '600' : '400',
              border: `1px solid ${activeZone?.id === zone.id ? zone.color : 'rgba(255,255,255,0.1)'}`,
              background: activeZone?.id === zone.id ? `${zone.color}18` : 'rgba(255,255,255,0.04)',
              color: activeZone?.id === zone.id ? zone.color : 'rgba(240,244,255,0.55)',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            {zone.label}
          </button>
        ))}
      </div>
    </main>
  )
}