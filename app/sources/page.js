'use client'
import { useState } from 'react'

const SOURCES = {
  'Alcohol Calculator': {
    description: 'BAC simulation using the Widmark model with first-order absorption and zero-order (Michaelis-Menten) elimination.',
    sources: [
      { citation: 'Widmark, E.M.P. (1932). Die theoretischen Grundlagen und die praktische Verwendbarkeit der gerichtlich-medizinischen Alkoholbestimmung. Urban & Schwarzenberg, Berlin.', note: 'Original Widmark model and r-factor values (male 0.68, female 0.55).' },
      { citation: 'Norberg, Å., Jones, A.W., Hahn, R.G., & Gabrielsson, J.L. (2003). Role of variability in explaining ethanol pharmacokinetics. Clinical Pharmacokinetics, 42(1), 1–31.', note: 'Population r-factor distribution, elimination rate variability (β = 0.10–0.20 g/L/h).' },
      { citation: 'Jones, A.W., & Andersson, L. (1996). Influence of age, gender and blood-alcohol concentration on the disappearance rate of alcohol from blood in drinking drivers. Journal of Forensic Sciences, 41(6), 922–926.', note: 'Mean elimination rate β = 0.15 g/L/h, population range.' },
      { citation: 'Dubowski, K.M. (1985). Absorption, distribution and elimination of alcohol: Highway safety aspects. Journal of Studies on Alcohol, Supplement 10, 98–108.', note: 'Absorption rate constants and first-order absorption model.' },
      { citation: 'European Transport Safety Council (ETSC). (2026). Blood Alcohol Content (BAC) Drink Driving Limits across Europe. etsc.eu', note: 'Legal BAC limits for NL (0.5‰, novice 0.2‰), DE (0.5‰, novice 0.0‰), BE (0.5‰, novice 0.2‰), FR (0.5‰, novice 0.2‰).' },
      { citation: 'Government of the Netherlands. (2021). Alcohol, drugs and driving. government.nl/topics/mobility-public-transport-and-road-safety', note: 'Dutch legal limits confirmed: 0.5‰ standard, 0.2‰ for <5yr licence holders.' },
    ]
  },
  'MDMA Calculator': {
    description: 'Plasma concentration simulation using 1-compartment oral PK model with first-order absorption and elimination.',
    sources: [
      { citation: 'de la Torre, R., Farré, M., Ortuño, J., et al. (2000). Non-linear pharmacokinetics of MDMA in humans. British Journal of Clinical Pharmacology, 49(2), 104–109.', note: 'CYP2D6 autoinhibition, non-linear kinetics, mean t½ ~8h, Vd ~500L.' },
      { citation: 'Kolbrich, E.A., Goodwin, R.S., Gorelick, D.A., et al. (2008). Plasma pharmacokinetics of 3,4-methylenedioxymethamphetamine after controlled oral administration to young adults. Therapeutic Drug Monitoring, 30(3), 320–332.', note: 'ka, Tmax ~2h, Cmax values, F ~75%, dose-concentration relationships.' },
      { citation: 'Frye, R.F., Matzke, G.R., Adedoyin, A., et al. (2011). Validation of the five-drug "Pittsburgh cocktail" approach for assessment of selective regulation of drug-metabolizing enzymes. Clinical Pharmacology & Therapeutics, 70(5), 455–463.', note: 'CYP2D6 metaboliser status and MDMA clearance.' },
      { citation: 'Pizarro, N., Farré, M., Pujadas, M., et al. (2004). Stereochemical analysis of 3,4-methylenedioxymethamphetamine and its main metabolites in human samples. Therapeutic Drug Monitoring, 26(3), 294–303.', note: 'Metabolite profiles, elimination kinetics.' },
      { citation: 'Hysek, C.M., Simmler, L.D., Nicola, V.G., et al. (2012). Duloxetine inhibits effects of MDMA ("ecstasy") in vitro and in humans. Clinical Pharmacology & Therapeutics, 92(3), 355–362.', note: 'Serotonin syndrome risk with combined serotonergic drugs.' },
      { citation: 'European Union Drugs Agency (EUDA). (2024). MDMA — the current situation in Europe. European Drug Report 2024. euda.europa.eu', note: 'MDMA tablet strength distribution, adulteration rates, European market data.' },
    ]
  },
  'Cannabis Calculator': {
    description: 'THC plasma concentration model for smoked and oral routes using 1-compartment oral PK with route-specific parameters.',
    sources: [
      { citation: 'Huestis, M.A., Henningfield, J.E., & Cone, E.J. (1992). Blood cannabinoids. I. Absorption of THC and formation of 11-OH-THC and THCCOOH during and after smoking marijuana. Journal of Analytical Toxicology, 16(5), 276–282.', note: 'Smoked THC absorption kinetics, Tmax ~10 min, bioavailability 10–35%.' },
      { citation: 'Huestis, M.A. (2007). Human cannabinoid pharmacokinetics. Chemistry & Biodiversity, 4(8), 1770–1804.', note: 'Comprehensive review: Vd ~350L, t½ distribution, oral vs smoked comparison, 11-OH-THC.' },
      { citation: 'Grotenhermen, F. (2003). Pharmacokinetics and pharmacodynamics of cannabinoids. Clinical Pharmacokinetics, 42(4), 327–360.', note: 'Oral bioavailability 4–20%, food effect on absorption, ke values.' },
      { citation: 'Newmeyer, M.N., Swortwood, M.J., Barnes, A.J., et al. (2016). Free and glucuronide whole blood cannabinoids\' pharmacokinetics after controlled smoked, vaporized, and oral cannabis administration in frequent and occasional cannabis users. Clinical Chemistry, 62(12), 1579–1592.', note: 'Route comparison, plasma vs blood THC concentrations, driving-relevant concentrations.' },
      { citation: 'Spindle, T.R., Cone, E.J., Schlienz, N.J., et al. (2020). Acute pharmacokinetic profile of smoked and vaporized cannabis in human blood and oral fluid. Journal of Analytical Toxicology, 43(4), 233–258.', note: 'Vaporized vs smoked PK, concentration-time profiles.' },
      { citation: 'European Union Drugs Agency (EUDA). (2024). Cannabis drug profile. euda.europa.eu', note: 'European legal limits, prevalence data, potency trends.' },
      { citation: 'Correlation-European Harm Reduction Network / TEDI. (2025). European Drug Checking Trends 2018–2024. correlation-net.org', note: 'Cannabis potency trends, adulteration data.' },
    ]
  },
  'Cocaine Calculator': {
    description: 'Plasma concentration model for intranasal cocaine using 1-compartment PK with first-order absorption and elimination.',
    sources: [
      { citation: 'Wilkinson, P., Van Dyke, C., Jatlow, P., et al. (1980). Intranasal and oral cocaine kinetics. Clinical Pharmacology & Therapeutics, 27(3), 386–394.', note: 'Intranasal bioavailability ~60%, Tmax 15–30 min, t½ ~1h.' },
      { citation: 'Jeffcoat, A.R., Perez-Reyes, M., Hill, J.M., et al. (1989). Cocaine disposition in humans after intravenous injection, nasal insufflation (snorting), or smoking. Drug Metabolism and Disposition, 17(2), 153–159.', note: 'Route comparison, intranasal PK parameters, ka estimation.' },
      { citation: 'Jufer, R.A., Wstadik, A., Walsh, S.L., et al. (2000). Elimination of cocaine and metabolites in plasma, saliva, and urine following repeated oral administration to human volunteers. Journal of Analytical Toxicology, 24(7), 467–477.', note: 'Elimination kinetics, ke ~0.55 h⁻¹, Vd ~2 L/kg.' },
      { citation: 'Harris, D.S., Everhart, E.T., Mendelson, J., & Jones, R.T. (2003). The pharmacology of cocaethylene in humans following cocaine and ethanol administration. Drug and Alcohol Dependence, 72(2), 169–182.', note: 'Cocaethylene formation kinetics, t½ ~5h, cardiovascular toxicity data.' },
      { citation: 'Bolla, K.I., Cadet, J.L., & London, E.D. (1998). The neuropsychiatry of chronic cocaine abuse. Journal of Neuropsychiatry and Clinical Neurosciences, 10(3), 280–289.', note: 'Dopamine crash mechanism and compulsive redosing pattern.' },
      { citation: 'Larocque, A., & Hoffman, R.S. (2012). Levamisole in cocaine: unexpected news from an old acquaintance. Clinical Toxicology, 50(4), 231–241.', note: 'Levamisole as cocaine adulterant, agranulocytosis risk, European prevalence.' },
      { citation: 'Correlation-European Harm Reduction Network / TEDI. (2025). European Drug Checking Trends 2018–2024. correlation-net.org', note: 'Most common adulterants in European cocaine samples.' },
    ]
  },
  'Amphetamine Calculator': {
    description: 'Plasma concentration model for oral amphetamine and methamphetamine with pH-dependent elimination.',
     sources: [
        { citation: 'Cruickshank, C.C., & Dyer, K.R. (2009). A review of the clinical pharmacology of methamphetamine. Addiction, 104(7), 1085–1099.', note: 'Methamphetamine PK parameters: t½ ~10h, Vd ~3.7 L/kg, F ~67%, CNS potency vs amphetamine.' },
        { citation: 'Schepers, R.J., Oyler, J.M., Joseph, R.E., et al. (2003). Methamphetamine and amphetamine pharmacokinetics in oral fluid and plasma after controlled oral methamphetamine administration. Clinical Chemistry, 49(1), 121–132.', note: 'Comparative oral PK, Tmax values, plasma concentration-time profiles.' },
        { citation: 'Shappell, S.A., Kearns, G.L., Valentine, J.L., et al. (1996). Chromatographic-mass spectrometric analysis and pharmacokinetic modeling of amphetamine after intravenous administration. Journal of Chromatography B, 678(2), 309–318.', note: 'Amphetamine PK parameters: ke, Vd ~3.5 L/kg, t½ ~11h.' },
        { citation: 'Beckett, A.H., & Rowland, M. (1965). Urinary excretion kinetics of amphetamine in man. Journal of Pharmacy and Pharmacology, 17(10), 628–639.', note: 'pH-dependent elimination — acidic urine increases elimination rate ~50%. Basis for vitamin C harm reduction strategy.' },
        { citation: 'Poklis, A. (1995). Amphetamine/methamphetamine: a review of their actions, toxicology, and disposition. Therapeutic Drug Monitoring, 17(5), 461–467.', note: 'Elimination pH-dependence, clinical toxicology, urinary pH effect on t½.' },
        { citation: 'European Union Drugs Agency (EUDA). (2024). Amphetamines — the current situation in Europe. European Drug Report 2024. euda.europa.eu', note: 'Prevalence of amphetamine vs methamphetamine in Europe, trends in use.' },
        { citation: 'Correlation-European Harm Reduction Network / TEDI. (2025). European Drug Checking Trends 2018–2024. correlation-net.org', note: 'Adulteration trends in European amphetamine samples.' },
    ]
 },
 'Cathinone Calculator': {
    description: 'Mephedrone PK model with wide uncertainty band. Market data from Trimbos DIMS 2025.',
     sources: [
            { citation: 'Trimbos-instituut. (2025). 3-MMC bevat vrijwel nooit échte 3-MMC. trimbos.nl/actueel/3-mmc-bevat-vrijwel-nooit-echte-3-mmc/', note: '3% of "3-MMC" samples contain actual 3-MMC (2025), 76% contain 2-MMC, 5% contain NEP.' },
            { citation: 'Trimbos-instituut / DIMS. (2024). DIMS Jaarbericht 2024. trimbos.nl', note: 'Recordaantal 3-MMC samples; 13% actual 3-MMC in 2024; NEP found in 4% of samples.' },
            { citation: 'Archer, R.P., et al. (2014). Mephedrone: an emerging drug of abuse. Annals of Clinical Biochemistry, 51(2), 132–136.', note: 'Mephedrone PK: t½ ~2–3h, oral bioavailability ~70%, estimated Vd.' },
            { citation: 'Sidekicks Berlin. (2025). NEP instead of "3-MMC". sidekicks.berlin/en/nep/', note: 'NEP warnings in Berlin party scene, overdose risk when dosed like 3-MMC.' },
            { citation: 'Lisbonaddictions.eu / DIMS. (2024). Effects of legislative measures on 3-MMC in Netherlands. lisbonaddictions.eu', note: 'DIMS data 2021–2023: 85% → 35% → 15% actual 3-MMC; other cathinones found.' },
            { citation: 'Papaseit, E., et al. (2025). Acute pharmacological effects of NEP and NEH in humans. PMC12115307.', note: 'Human observational data on NEP: cardiovascular effects, BP +21mmHg, HR +22bpm, onset within 20 min.' },
            { citation: 'Correlation-European Harm Reduction Network / TEDI. (2025). European Drug Checking Trends 2018–2024. correlation-net.org', note: 'Cathinone market trends, adulteration patterns.' },
    ]
    },
  'PK/PD Calculator': {
    description: 'Pharmacokinetic models using closed-form equations (linear 1-compartment) and RK4 numerical integration (2-compartment, Michaelis-Menten).',
    sources: [
      { citation: 'Rowland, M., & Tozer, T.N. (2011). Clinical Pharmacokinetics and Pharmacodynamics: Concepts and Applications (4th ed.). Lippincott Williams & Wilkins.', note: 'All 1-compartment linear equations, Widmark model, Vd/CL/ke relationships.' },
      { citation: 'Gabrielsson, J., & Weiner, D. (2016). Pharmacokinetic and Pharmacodynamic Data Analysis: Concepts and Applications (5th ed.). Swedish Pharmaceutical Press.', note: '2-compartment model parameterisation (Vc/Vp/CL/Q), RK4 ODE approach.' },
      { citation: 'Michaelis, L., & Menten, M.L. (1913). Die Kinetik der Invertinwirkung. Biochemische Zeitschrift, 49, 333–369.', note: 'Original Michaelis-Menten equation used for non-linear clearance.' },
      { citation: 'Press, W.H., Teukolsky, S.A., Vetterling, W.T., & Flannery, B.P. (2007). Numerical Recipes: The Art of Scientific Computing (3rd ed.). Cambridge University Press.', note: 'RK4 implementation for ODE systems.' },
      { citation: 'Sheiner, L.B., & Ludden, T.M. (1992). Population pharmacokinetics/dynamics. Annual Review of Pharmacology and Toxicology, 32(1), 185–209.', note: 'Log-normal IIV distribution, CV% parameterisation for population simulation.' },
    ]
  },
  'Drug Interaction Checker': {
    description: 'AI-powered interaction analysis using Claude (Anthropic). Pharmacological mechanisms verified against standard references.',
    sources: [
      { citation: 'Stockley, I.H. (Ed.). (2023). Stockley\'s Drug Interactions (13th ed.). Pharmaceutical Press.', note: 'Primary reference for interaction mechanisms, severity classifications, and enzyme pathways.' },
      { citation: 'Flockhart, D.A. (2007). Drug Interactions: Cytochrome P450 Drug Interaction Table. Indiana University School of Medicine. medicine.iupui.edu/clinpharm/ddis/', note: 'CYP450 enzyme interaction data.' },
      { citation: 'Lexicomp Drug Interactions. (2024). Wolters Kluwer.', note: 'Severity classifications and clinical significance ratings.' },
    ]
  },
  'Exercise Helper': {
    description: 'AI-powered PK/PD exercise solver. Mathematical solutions verified against standard pharmacokinetics textbooks.',
    sources: [
      { citation: 'Rowland, M., & Tozer, T.N. (2011). Clinical Pharmacokinetics and Pharmacodynamics (4th ed.). Lippincott Williams & Wilkins.', note: 'Primary textbook for all PK/PD formulas and worked examples.' },
      { citation: 'Shargel, L., Wu-Pong, S., & Yu, A.B.C. (2012). Applied Biopharmaceutics & Pharmacokinetics (6th ed.). McGraw-Hill.', note: 'Bioavailability, NCA methods, clinical PK calculations.' },
      { citation: 'Gibaldi, M., & Perrier, D. (1982). Pharmacokinetics (2nd ed.). Marcel Dekker.', note: 'Multi-compartment model mathematics, moment analysis.' },
    ]
  },
}

export default function Sources() {
  const [selected, setSelected] = useState(null)
  const [showAll,  setShowAll]  = useState(false)

  const topics = Object.keys(SOURCES)

  return (
    <main style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem 1rem', fontFamily: 'sans-serif' }}>

      {/* Hero */}
      <div style={{ textAlign: 'center', padding: '3rem 1rem 2rem' }}>
        <div style={{ fontSize: '48px', marginBottom: '12px' }}>📚</div>
        <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#111827', margin: '0 0 8px' }}>Sources</h1>
        <p style={{ fontSize: '16px', color: '#6b7280', margin: '0 0 2rem' }}>
          Source: trust me bro
        </p>

        {/* Dropdown trigger */}
        <button
          onClick={() => setShowAll(!showAll)}
          style={{ padding: '10px 24px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: '500', cursor: 'pointer' }}>
          {showAll ? 'Hide sources ↑' : 'Actually show me the sources ↓'}
        </button>
      </div>

      {showAll && (
        <div>
          {/* Topic selector */}
          <div style={{ marginBottom: '1.5rem' }}>
            <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '8px' }}>Select a tool to see its sources:</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              <button
                onClick={() => setSelected(null)}
                style={{ padding: '6px 14px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: selected === null ? '600' : '400', border: selected === null ? '2px solid #2563eb' : '1px solid #d1d5db', background: selected === null ? '#eff6ff' : 'white', color: selected === null ? '#1d4ed8' : '#374151' }}>
                All sources
              </button>
              {topics.map(t => (
                <button key={t}
                  onClick={() => setSelected(t)}
                  style={{ padding: '6px 14px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: selected === t ? '600' : '400', border: selected === t ? '2px solid #2563eb' : '1px solid #d1d5db', background: selected === t ? '#eff6ff' : 'white', color: selected === t ? '#1d4ed8' : '#374151' }}>
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Source list */}
          {(selected ? [selected] : topics).map(topic => (
            <div key={topic} style={{ marginBottom: '1.5rem', border: '1px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden' }}>
              <div style={{ background: '#f9fafb', padding: '12px 16px', borderBottom: '1px solid #e5e7eb' }}>
                <h2 style={{ fontSize: '15px', fontWeight: '600', color: '#111827', margin: '0 0 4px' }}>{topic}</h2>
                <p style={{ fontSize: '12px', color: '#6b7280', margin: 0 }}>{SOURCES[topic].description}</p>
              </div>
              <div style={{ padding: '12px 16px' }}>
                {SOURCES[topic].sources.map((s, i) => (
                  <div key={i} style={{ marginBottom: '10px', paddingBottom: '10px', borderBottom: i < SOURCES[topic].sources.length - 1 ? '1px solid #f3f4f6' : 'none' }}>
                    <p style={{ fontSize: '13px', color: '#374151', margin: '0 0 3px', lineHeight: '1.5' }}>{s.citation}</p>
                    <p style={{ fontSize: '11px', color: '#9ca3af', margin: 0 }}>Used for: {s.note}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}

          <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '1rem', fontSize: '12px', color: '#6b7280', marginTop: '1rem' }}>
            <strong>A note on AI-generated content:</strong> The drug interaction checker and exercise helper use Claude (Anthropic) to generate explanations and solutions. While the underlying pharmacological mechanisms are verified against standard references, AI-generated content should always be cross-checked against primary sources for clinical or academic use. PharmLab is an educational tool — not a clinical decision support system.
          </div>
        </div>
      )}
    </main>
  )
}