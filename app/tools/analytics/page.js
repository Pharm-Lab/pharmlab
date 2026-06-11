'use client'
import { useState } from 'react'

// ─── Data ─────────────────────────────────────────────────────────

const TECHNIQUES = {
  rp_hplc: {
    id: 'rp_hplc',
    name: 'Reversed-phase HPLC',
    abbr: 'RP-HPLC',
    color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe', dark: '#1e40af',
    tagline: 'The workhorse of pharmaceutical analysis',
    plain: 'In reversed-phase HPLC, the stationary phase is nonpolar (hydrophobic) and the mobile phase is polar (water + organic solvent). Nonpolar compounds stick to the column longer and elute later. This is "reversed" from the original normal-phase setup where the stationary phase was polar. RP-HPLC handles ~80% of pharmaceutical compounds.',
    stationary: 'C18 (octadecylsilane) most common — 18-carbon chains bonded to silica. C8 for less retention. Phenyl for aromatic selectivity. C4 for proteins (less interaction).',
    mobile: 'Water + organic modifier: acetonitrile (MeCN, sharper peaks) or methanol (MeOH, cheaper). Buffer for ionisable compounds — phosphate (pH 2–8), acetate (pH 3.6–5.6), formate (MS-compatible). Gradient: start polar, increase organic to elute more retained compounds.',
    detectors: ['UV/DAD (most common — needs chromophore)', 'MS / MS-MS (gold standard — confirmation + quantification)', 'Fluorescence (high sensitivity if fluorophore present)', 'ELSD (no chromophore needed — evaporative)'],
    goodFor: ['Small molecules with chromophore (most drugs)', 'Lipophilic compounds (log P > 0)', 'Ionisable drugs at controlled pH', 'Pharmaceutical impurity profiling', 'Dissolution testing'],
    notFor: ['Very polar/hydrophilic compounds (poor retention)', 'Very large biomolecules (use SEC or RP-C4)', 'Volatile compounds (use GC)', 'Inorganic ions (use IEX)'],
    pharmaExample: 'Aspirin (salicylic acid impurity testing): C18 column, mobile phase water/MeCN/acetic acid, UV detection at 280nm. The acetyl group and aromatic ring provide UV absorption; C18 retains both aspirin and salicylate with good resolution.',
    keyParam: 'logP / logD at mobile phase pH — drives retention. More lipophilic → longer retention time.',
  },
  np_hplc: {
    id: 'np_hplc',
    name: 'Normal-phase HPLC',
    abbr: 'NP-HPLC',
    color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe', dark: '#5b21b6',
    tagline: 'Polar stationary phase — separates by polarity differences',
    plain: 'Normal-phase is the "original" HPLC — polar stationary phase, nonpolar mobile phase. Polar compounds stick to the column; nonpolar compounds elute first. Largely replaced by RP-HPLC for most applications, but still used for lipids, fat-soluble vitamins, and chiral separations.',
    stationary: 'Bare silica (most polar). Amino (-NH2) modified silica. Cyano (-CN) modified silica. Diol phases. Chiral stationary phases (Chiralpak, Chiralcel) for enantiomer separation.',
    mobile: 'Nonpolar organic solvents: hexane or heptane as base, with polar modifier (IPA, ethanol, DCM). Water must be avoided or kept very low — disrupts the polar stationary phase. Gradient: start nonpolar, increase polar modifier.',
    detectors: ['UV/DAD', 'ELSD (excellent for lipids — no chromophore)', 'MS (if MS-compatible solvents used)', 'RI (refractive index — universal but low sensitivity)'],
    goodFor: ['Lipids, fatty acids, triglycerides', 'Fat-soluble vitamins (A, D, E, K)', 'Chiral separations (enantiomers)', 'Compounds that are too polar for RP', 'Isomers with similar polarity differences'],
    notFor: ['Ionic compounds (use IEX)', 'Water-soluble compounds (unstable in NP mobile phase)', 'Large biomolecules', 'Most small-molecule drugs (RP is better)'],
    pharmaExample: 'Vitamin E isomers (α, β, γ, δ-tocopherol): silica column, hexane/IPA mobile phase, fluorescence detection (excitation 295nm, emission 330nm). Normal phase separates the four isomers which differ only in methyl group positions on the ring.',
    keyParam: 'Compound polarity — more polar compounds elute later. Eluotropic strength of mobile phase determines elution order.',
  },
  gc: {
    id: 'gc',
    name: 'Gas chromatography',
    abbr: 'GC',
    color: '#dc2626', bg: '#fef2f2', border: '#fecaca', dark: '#991b1b',
    tagline: 'For volatile, thermally stable compounds',
    plain: 'In GC, the mobile phase is an inert carrier gas (helium or nitrogen), not a liquid. The sample must be vaporised before entering the column. This means GC only works for volatile compounds that can withstand the high temperatures involved. The column is a long narrow capillary coated with a liquid stationary phase. GC gives extremely high resolution — thousands of theoretical plates — and the flame ionisation detector responds to virtually every organic compound.',
    stationary: 'Nonpolar: polydimethylsiloxane (DB-1, HP-1) — universal, low bleed. Slightly polar: phenyl/methyl siloxane (DB-5, most common) — good for most organics. Polar: polyethylene glycol (DB-WAX) — alcohols, acids, essential oils. Chiral phases: cyclodextrin-based — enantiomers.',
    mobile: 'Carrier gas only — no composition gradient. Helium (most common, good efficiency), hydrogen (fastest, slightly flammable), nitrogen (slowest, cheapest). Temperature programming replaces mobile phase gradient — increasing oven temperature drives elution of more retained compounds.',
    detectors: ['FID (flame ionisation) — universal for organics, excellent sensitivity, destroys sample', 'MS (definitive identification — GC-MS is gold standard for volatile organics)', 'ECD (electron capture) — highly selective for halogenated/electronegative compounds, pesticides', 'NPD (nitrogen-phosphorus) — selective for N and P compounds', 'TCD (thermal conductivity) — universal but lower sensitivity'],
    goodFor: ['Volatile organic compounds (bp < ~300°C)', 'Residual solvents in pharmaceuticals (ICH Q3C)', 'Essential oils, flavours, fragrances', 'Environmental samples (pesticides, VOCs)', 'Alcohol and drug testing in forensics/clinical'],
    notFor: ['Thermolabile compounds (degrade at high temperature)', 'Ionic compounds (cannot vaporise)', 'Large biomolecules (proteins, oligonucleotides)', 'Most pharmaceutical actives (non-volatile)'],
    pharmaExample: 'Residual solvent testing (ICH Q3C): acetonitrile, methanol, ethanol, DCM in a drug substance. DB-5 column (30m × 0.25mm), headspace injection, FID detection. Temperature programme 40→200°C at 10°C/min. Each solvent has a characteristic retention time and the FID gives near-universal response.',
    keyParam: 'Boiling point and vapour pressure — determines whether GC is feasible. Polarity of stationary phase must match sample for good selectivity.',
  },
  iex: {
    id: 'iex',
    name: 'Ion-exchange chromatography',
    abbr: 'IEX',
    color: '#0891b2', bg: '#ecfeff', border: '#a5f3fc', dark: '#164e63',
    tagline: 'Separates by charge — for ions and ionisable compounds',
    plain: 'Ion-exchange chromatography uses a charged stationary phase to retain oppositely charged compounds. Cation exchangers (negative charge on column) retain positively charged analytes; anion exchangers (positive charge) retain negatively charged analytes. Elution is by increasing salt concentration or changing pH. Widely used for proteins, amino acids, inorganic ions, and drugs that carry permanent charges.',
    stationary: 'Strong cation exchanger (SCX): sulfonate groups (-SO3⁻) — retains cations at any pH. Weak cation exchanger (WCX): carboxylate groups (-COO⁻) — pH dependent. Strong anion exchanger (SAX): quaternary ammonium (-NR4⁺) — retains anions at any pH. Weak anion exchanger (WAX): tertiary amine — pH dependent.',
    mobile: 'Aqueous buffers. Gradient: increasing ionic strength (salt concentration — NaCl, KCl, ammonium acetate) to compete with analyte for binding sites. Or pH gradient to change ionisation state. No organic solvents usually needed.',
    detectors: ['UV/DAD (if chromophore present)', 'Conductivity detector (inorganic ions — ion chromatography)', 'MS (after desalting step or volatile buffer)', 'Pulsed amperometric detection (PAD — sugars, carbohydrates)'],
    goodFor: ['Proteins and peptides (charged at physiological pH)', 'Amino acids', 'Inorganic anions/cations (Cl⁻, NO3⁻, Na⁺, K⁺)', 'Permanently charged drugs', 'Nucleotides, nucleic acids'],
    notFor: ['Nonpolar compounds (no charge, no retention)', 'Volatile compounds (use GC)', 'Very hydrophobic compounds (use RP-HPLC)', 'Compounds that denature in aqueous buffer'],
    pharmaExample: 'Protein charge variant analysis (monoclonal antibodies): SCX column (cation exchanger), sodium phosphate buffer gradient pH 6–7, UV detection at 280nm. Different glycoforms and deamidation variants of the mAb have slightly different charge → resolved by IEX. Critical quality attribute in biopharmaceutical manufacturing.',
    keyParam: 'Net charge of analyte (pI for proteins, pKa for small molecules). pH of buffer determines ionisation state and therefore retention.',
  },
  sec: {
    id: 'sec',
    name: 'Size-exclusion chromatography',
    abbr: 'SEC / GPC',
    color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0', dark: '#14532d',
    tagline: 'Separates by size — no chemical interaction',
    plain: 'SEC is completely different from all other chromatography techniques. There is NO chemical interaction between analyte and stationary phase. The column is packed with porous beads. Small molecules enter the pores, travel further, and elute last. Large molecules cannot enter the pores, travel a shorter path, and elute first. Size = elution order (largest first). Used to determine molecular weight of polymers and proteins, and to detect protein aggregates.',
    stationary: 'Porous silica or polymer beads with controlled pore size. The pore size determines the separation range (MW range the column can resolve). Aqueous SEC: for proteins and water-soluble polymers. GPC (gel permeation chromatography): organic solvent version, for synthetic polymers.',
    mobile: 'Aqueous buffer for proteins (same ionic strength as sample — prevents non-specific interactions). Organic solvents (THF, DMF) for GPC/polymer analysis. Isocratic only — no gradient. Flow rate affects resolution.',
    detectors: ['UV at 280nm (proteins — tryptophan/tyrosine absorption)', 'RI (refractive index) — universal, responds to all polymers', 'Multi-angle light scattering (MALS) — absolute MW determination', 'Viscometer — intrinsic viscosity', 'MS (rare — SEC not easily MS-compatible)'],
    goodFor: ['Protein molecular weight determination', 'Protein aggregation detection (critical in biologics)', 'Polymer MW distribution (PDI/dispersity)', 'Buffer exchange / desalting (preparative SEC)', 'Liposome / nanoparticle size characterisation'],
    notFor: ['Small molecules (poor resolution below ~1000 Da)', 'Separating compounds of similar size', 'Charged compounds without proper buffer (stick to column)'],
    pharmaExample: 'Aggregate detection in a monoclonal antibody formulation: TSKgel G3000SW column, PBS pH 7.4, UV 280nm. The monomer peak (~150 kDa) must be resolved from high-molecular-weight species (aggregates) and low-molecular-weight species (fragments). ICH Q6B requires this as a release test for biopharmaceuticals.',
    keyParam: 'Hydrodynamic volume (size in solution, not just MW). Calibration with molecular weight standards establishes the size/elution time relationship.',
  },
  ce: {
    id: 'ce',
    name: 'Capillary electrophoresis',
    abbr: 'CE',
    color: '#f97316', bg: '#fff7ed', border: '#fed7aa', dark: '#7c2d12',
    tagline: 'Separates by charge-to-size ratio in an electric field',
    plain: 'CE separates analytes by applying a high voltage across a narrow capillary filled with a buffer. Charged species migrate at different speeds depending on their charge-to-size ratio. Positive ions migrate toward the cathode; negative ions toward the anode. A key feature is electroosmotic flow (EOF) — the bulk buffer itself flows toward the cathode, carrying all species including neutral ones. CE uses tiny sample volumes, gives very high efficiency, but is less robust than HPLC.',
    stationary: 'No stationary phase in standard CE (CZE — capillary zone electrophoresis). The capillary wall can be coated to modify EOF. Variants: MEKC (micellar — adds surfactant to separate neutral compounds), CGE (gel-filled — separates DNA/proteins by size like gel electrophoresis), cIEF (isoelectric focusing — separates by pI).',
    mobile: 'Background electrolyte (BGE): aqueous buffer chosen for pH control and EOF. Phosphate, borate, acetate common. Ionic strength affects EOF and selectivity. No organic gradient — but organic modifiers can be added to improve solubility.',
    detectors: ['UV/DAD (on-column detection — path length is tiny, lower sensitivity than HPLC)', 'LIF (laser-induced fluorescence — extremely sensitive, needs fluorescent label)', 'MS (CE-MS — challenging interface but powerful)', 'Conductivity (for inorganic ions)'],
    goodFor: ['Chiral separations (cyclodextrin-modified CE)', 'Inorganic and organic ions', 'DNA fragments (CGE)', 'Protein charge variants (cIEF)', 'Very small sample volumes', 'High-efficiency separations of small polar molecules'],
    notFor: ['Hydrophobic/neutral compounds (poor separation in CZE — use MEKC)', 'Preparative separations (tiny capillary volumes)', 'Robust routine QC (less reproducible than HPLC)'],
    pharmaExample: 'Chiral purity testing of amino acids and drug enantiomers: CZE with cyclodextrin (β-CD or γ-CD) added to the BGE. The cyclodextrin forms different-strength inclusion complexes with each enantiomer → differential migration → separation. FDA accepts CE for chiral purity as alternative to chiral HPLC.',
    keyParam: 'Electrophoretic mobility = charge / (6πηr). Larger charge → faster migration. Larger size → slower migration. pH of BGE controls ionisation and therefore charge.',
  },
  spe: {
    id: 'spe',
    name: 'Solid-phase extraction',
    abbr: 'SPE',
    color: '#8b5cf6', bg: '#f5f3ff', border: '#ddd6fe', dark: '#5b21b6',
    tagline: 'Sample preparation — extract and concentrate before analysis',
    plain: 'SPE is not a separation technique per se — it is sample preparation before chromatography. You pass a complex sample (plasma, urine, tissue homogenate) through a small cartridge to extract your analyte and remove matrix interferences. The principle is the same as chromatography (analyte interacts with sorbent) but the goal is clean-up and concentration, not peak resolution. SPE dramatically improves sensitivity and protects the analytical column from dirty samples.',
    stationary: 'RP SPE (C18, C8): extract nonpolar drugs from aqueous biological matrices. Mixed-mode (RP + IEX, e.g. Oasis MCX): excellent for basic drugs in plasma. Protein precipitation: acetonitrile or methanol — crashes proteins, simple but less clean. Phospholipid removal plates: remove phospholipids specifically for LC-MS.',
    mobile: 'Loading: aqueous sample (plasma diluted, pH adjusted). Wash: weak solvent to remove interferences while retaining analyte. Elution: strong solvent to release analyte in clean form. The three-step cycle (condition → load → wash → elute) is the heart of SPE.',
    detectors: ['SPE has no detector — it is used before the analytical technique', 'Eluate then goes to LC-MS, LC-UV, GC-MS etc.'],
    goodFor: ['Extracting drugs from plasma/urine/tissue for bioanalysis', 'Removing proteins and phospholipids (matrix effects in LC-MS)', 'Concentrating trace analytes', 'Cleaning up complex environmental samples', 'Water analysis (trace pharmaceuticals, pesticides)'],
    notFor: ['Direct analysis (always a preparatory step)', 'Volatile compounds (use headspace for GC instead)', 'Compounds with no affinity for SPE sorbent'],
    pharmaExample: 'Plasma sample preparation for LC-MS/MS pharmacokinetic study: dilute plasma 1:1 with water, load onto Oasis HLB cartridge, wash with 5% MeOH/water, elute with MeCN. Recoveries >80% for most small molecules. Removes proteins and salts that would suppress MS signal and contaminate the column.',
    keyParam: 'Recovery (%) and matrix effect (% signal suppression in LC-MS). Good SPE achieves >70% recovery with <20% matrix effect.',
  },
  lle: {
    id: 'lle',
    name: 'Liquid-liquid extraction',
    abbr: 'LLE',
    color: '#0f766e', bg: '#f0fdfa', border: '#99f6e4', dark: '#134e4a',
    tagline: 'Partition between two immiscible solvents',
    plain: 'LLE exploits the different solubility of a compound in two immiscible solvents (usually water and an organic solvent). The drug partitions between the aqueous phase and organic phase according to its partition coefficient (log P). At the right pH, the drug is unionised and partitions into the organic layer — the interfering matrix components (proteins, salts) stay in the aqueous layer. Simple, cheap, no special equipment needed.',
    stationary: 'No stationary phase — liquid phases only. Common organic solvents: ethyl acetate, MTBE (methyl tert-butyl ether), diethyl ether, hexane, DCM. Choice depends on analyte polarity and selectivity needed.',
    mobile: 'Aqueous phase pH is critical. For weak acids: acidify to suppress ionisation → drug goes to organic phase. For weak bases: alkalinise to suppress ionisation → drug goes to organic phase. The pH-partition hypothesis directly determines extraction efficiency.',
    detectors: ['No direct detection — organic extract evaporated and reconstituted for LC-MS or GC'],
    goodFor: ['Small lipophilic drugs with log P > 1', 'Simple, cheap sample preparation', 'Extracting drugs from urine and plasma when protein content is low', 'When back-extraction is needed for very selective clean-up'],
    notFor: ['Very polar drugs (log P < 0 — stay in aqueous phase)', 'Surfactants (form emulsions)', 'When automation is needed (SPE more automatable)', 'Permanently charged compounds'],
    pharmaExample: 'Extraction of diazepam from plasma: adjust plasma pH to 7.4 (diazepam pKa ~3.4, so neutral at physiological pH), add MTBE, vortex, centrifuge, take organic layer, evaporate, reconstitute in mobile phase for LC-MS. Proteins stay in aqueous layer. Recovery ~85%.',
    keyParam: 'Distribution ratio D = [drug]organic / [drug]aqueous. D depends on log P and fraction unionised at sample pH. Log D = log P + log(fraction unionised).',
  },
}

const DECISION_TREE = {
  q: 'Is the compound volatile and thermally stable?',
  hint: 'Volatile = boiling point < ~300°C, can be vaporised without decomposition. Most drugs are NOT volatile.',
  yes: {
    result: 'gc',
    reason: 'Volatile + thermally stable = GC candidate. Mobile phase is carrier gas; separation happens in heated column.',
  },
  no: {
    q: 'What is the primary purpose — sample preparation or separation/analysis?',
    hint: 'Sample prep = cleaning up a biological matrix before analysis. Separation = resolving analytes from each other.',
    a_prep: {
      q: 'Is the sample a biological matrix (plasma, urine, tissue)?',
      hint: 'Biological matrices contain proteins, salts, phospholipids that interfere with analysis.',
      yes: { result: 'spe', reason: 'SPE (or LLE) to remove matrix interferences and concentrate analyte before LC-MS.' },
      no:  { result: 'lle', reason: 'LLE is simple and effective for lipophilic analytes when matrix is less complex.' },
    },
    a_sep: {
      q: 'Is the compound ionic or permanently charged?',
      hint: 'Permanently ionic: quaternary ammonium salts, sulfates. Ionisable at certain pH: carboxylic acids, amines (most drugs).',
      yes: {
        q: 'Is it a large biomolecule (protein, peptide, nucleic acid)?',
        hint: 'Large = MW > ~5000 Da',
        yes: { result: 'iex', reason: 'IEX separates proteins by net charge. Works in native conditions, preserves activity.' },
        no:  {
          q: 'Primary goal: charge variant analysis or routine quantification?',
          hint: 'Charge variant = characterising variants with slightly different charge (e.g. mAb quality). Quantification = measuring concentration.',
          a_charge: { result: 'iex', reason: 'IEX or CE for charge-based separation of ionic small molecules and charge variants.' },
          a_quant:  { result: 'rp_hplc', reason: 'RP-HPLC with pH-controlled mobile phase to control ionisation state of ionisable drug.' },
        },
      },
      no: {
        q: 'Is the primary goal molecular weight determination or aggregate detection?',
        hint: 'MW determination = finding out how big a polymer or protein is. Aggregate = detecting clumps of protein.',
        yes: { result: 'sec', reason: 'SEC separates exclusively by size — no chemical interaction. Perfect for MW and aggregate analysis.' },
        no: {
          q: 'Is the compound polar or nonpolar?',
          hint: 'Rough guide: log P > 1 = nonpolar (lipophilic). log P < 0 = polar (hydrophilic). Most drugs: log P 0–5.',
          a_polar: {
            q: 'Is it a very small polar molecule or requires chiral separation?',
            hint: 'Very polar: amino acids, sugars, nucleotides. Chiral = enantiomers need to be separated.',
            yes_chiral: { result: 'ce', reason: 'CE with cyclodextrin modifier is excellent for chiral separations and very polar compounds.' },
            yes_polar: { result: 'np_hplc', reason: 'HILIC or normal-phase HPLC for very polar compounds with poor RP retention.' },
            no: { result: 'rp_hplc', reason: 'RP-HPLC handles most polar ionisable drugs well with appropriate buffer pH.' },
          },
          a_nonpolar: { result: 'rp_hplc', reason: 'RP-HPLC is ideal — nonpolar compounds retained well on C18. Adjust organic modifier content for elution.' },
        },
      },
    },
  },
}

const QUIZ_CASES = [
  {
    id: 0,
    compound: 'Ibuprofen',
    properties: { volatile: false, MW: 206, logP: 3.5, pKa: '4.4 (carboxylic acid)', charge: 'Ionisable weak acid', chromophore: 'UV active (aromatic ring, 220–265nm)' },
    correct: 'rp_hplc',
    column: 'C18',
    mobile: 'Water / acetonitrile + phosphate buffer pH 2.5 (suppresses ionisation, improves peak shape)',
    detector: 'UV at 254nm',
    explanation: 'Ibuprofen is a small lipophilic drug (log P 3.5) with a UV-active aromatic ring — a perfect RP-HPLC candidate. The low pH mobile phase keeps it unionised (pKa 4.4) for better retention and sharper peaks. C18 gives good retention without being too long.',
  },
  {
    id: 1,
    compound: 'Ethanol (in pharmaceutical product)',
    properties: { volatile: true, MW: 46, logP: -0.3, pKa: '15.9', charge: 'Neutral', chromophore: 'No UV chromophore' },
    correct: 'gc',
    column: 'DB-WAX (polyethylene glycol — polar, good for alcohols)',
    mobile: 'Helium carrier gas, temperature programme 40→180°C',
    detector: 'FID (universal organic detector)',
    explanation: 'Ethanol is volatile, thermally stable, has no UV chromophore, and is a residual solvent — a classic GC application. DB-WAX column is polar, ideal for alcohols. FID gives excellent sensitivity for all organic compounds regardless of functional group.',
  },
  {
    id: 2,
    compound: 'Insulin (MW ~5808 Da)',
    properties: { volatile: false, MW: 5808, logP: 'N/A (protein)', pKa: 'pI 5.3', charge: 'Protein — charged', chromophore: 'UV 280nm (tyrosine/tryptophan)' },
    correct: 'sec',
    column: 'TSKgel G2000SW or Superdex 75 — appropriate MW range 1–100 kDa',
    mobile: 'PBS pH 7.4 isocratic — matched to protein formulation',
    detector: 'UV at 280nm',
    explanation: 'For a protein like insulin, aggregate detection and MW confirmation are primary goals — this is SEC territory. The MW (5808 Da) is well within the range of a G2000SW column. UV 280nm detects the tyrosine/phenylalanine aromatic residues. IEX would also be relevant but SEC is the first choice for aggregate profiling.',
  },
  {
    id: 3,
    compound: 'Vitamin D3 (cholecalciferol)',
    properties: { volatile: false, MW: 385, logP: 7.5, pKa: 'N/A (neutral)', charge: 'Neutral, nonpolar', chromophore: 'UV 264nm (conjugated diene)' },
    correct: 'np_hplc',
    column: 'Silica or cyano (CN) — normal phase',
    mobile: 'Hexane / isopropanol (e.g. 99.5:0.5)',
    detector: 'UV at 264nm',
    explanation: 'Vitamin D3 is highly lipophilic (log P 7.5) and neutral. While RP-HPLC is possible, normal-phase HPLC with silica or CN column in hexane/IPA is the traditional and often preferred approach for fat-soluble vitamins. It also separates D2 from D3 and resolves related compounds. The conjugated diene gives UV absorption at 264nm.',
  },
  {
    id: 4,
    compound: 'Plasma sample containing paracetamol (bioanalysis)',
    properties: { volatile: false, MW: 151, logP: 0.46, pKa: '9.4 (phenol)', charge: 'Neutral at physiological pH', chromophore: 'UV 243nm', matrix: 'Human plasma — contains proteins, phospholipids, salts' },
    correct: 'spe',
    column: 'Oasis HLB cartridge (RP SPE — mixed-mode hydrophilic-lipophilic balance)',
    mobile: 'Load: diluted plasma. Wash: 5% MeOH/water. Elute: MeOH or MeCN.',
    detector: 'SPE is sample prep only — eluate then analysed by LC-MS/MS',
    explanation: 'This is a sample preparation question. Plasma cannot be injected directly onto an HPLC column — proteins would precipitate and destroy the column, phospholipids would cause matrix effects in MS. SPE on an HLB cartridge removes proteins and salts, concentrates paracetamol, and provides a clean extract for LC-MS/MS quantification in a PK study.',
  },
  {
    id: 5,
    compound: 'Metformin',
    properties: { volatile: false, MW: 129, logP: -1.4, pKa: '2.8 and 11.5 (biguanide — permanently cationic at physiological pH)', charge: 'Permanently positively charged', chromophore: 'Weak UV at 218nm' },
    correct: 'iex',
    column: 'SCX (strong cation exchanger) or RP-HPLC with ion-pair reagent',
    mobile: 'Ammonium formate buffer, ionic strength gradient OR RP with sodium heptanesulfonate as ion-pair reagent',
    detector: 'UV 218nm or MS',
    explanation: 'Metformin is permanently positively charged (biguanide, pKa values mean it carries two positive charges at physiological pH and log P -1.4). It has essentially zero retention on a C18 column. SCX (cation exchanger) retains it by ionic interaction. Alternatively, RP-HPLC with an anionic ion-pair reagent (heptanesulfonate) creates a charged pair with metformin, giving it RP retention.',
  },
]

// ─── Components ───────────────────────────────────────────────────

const TABS = ['Decision trainer', 'Technique explorer', 'Quiz mode']

function TechCard({ tech, compact = false }) {
  const t = TECHNIQUES[tech]
  if (!t) return null
  return (
    <div style={{ background: `${t.color}15`, border: `1.5px solid ${t.color}44`, borderRadius: '12px', padding: compact ? '10px 14px' : '16px 18px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: compact ? '4px' : '8px' }}>
        <span style={{ fontSize: '13px', fontWeight: '700', padding: '2px 10px', borderRadius: '999px', background: t.color, color: 'white' }}>{t.abbr}</span>
        {!compact && <span style={{ fontSize: '12px', color: t.color }}>{t.tagline}</span>}
      </div>
      {compact && <p style={{ fontSize: '12px', color: t.color, margin: 0 }}>{t.tagline}</p>}
    </div>
  )
}

function DecisionTrainer() {
  const [props, setProps] = useState({
    volatile: null,
    purpose: null,
    biomatrix: null,
    ionic: null,
    large: null,
    goal_charge: null,
    mw_goal: null,
    polarity: null,
    chiral: null,
  })
  const [result, setResult] = useState(null)
  const [path, setPath] = useState([])

  function reset() {
    setProps({ volatile:null, purpose:null, biomatrix:null, ionic:null, large:null, goal_charge:null, mw_goal:null, polarity:null, chiral:null })
    setResult(null)
    setPath([])
  }

  function answer(key, value) {
    const newProps = { ...props, [key]: value }
    setProps(newProps)
    const newPath = [...path, { q: key, a: value }]
    setPath(newPath)

    // Walk the decision tree
    if (key === 'volatile') {
      if (value === true)  setResult({ tech: 'gc', reason: DECISION_TREE.yes.reason })
    }
    if (key === 'purpose') {
      // no result yet
    }
    if (key === 'biomatrix') {
      if (value === true)  setResult({ tech: 'spe',  reason: DECISION_TREE.no.a_prep.yes.reason })
      if (value === false) setResult({ tech: 'lle',  reason: DECISION_TREE.no.a_prep.no.reason })
    }
    if (key === 'ionic') {
      // no result yet
    }
    if (key === 'large') {
      if (value === false && newProps.ionic === true) {
        // ionic + small → depends on goal_charge
      }
      if (value === true && newProps.ionic === true) {
        setResult({ tech: 'iex', reason: DECISION_TREE.no.a_sep.yes.yes.reason })
      }
    }
    if (key === 'goal_charge') {
      if (value === 'charge') setResult({ tech: 'iex',     reason: 'IEX or CE for charge-based separation of ionic compounds and charge variants.' })
      if (value === 'quant')  setResult({ tech: 'rp_hplc', reason: 'RP-HPLC with pH-controlled mobile phase to manage ionisation of the drug.' })
    }
    if (key === 'mw_goal') {
      if (value === true)  setResult({ tech: 'sec',     reason: DECISION_TREE.no.a_sep.no.yes.reason })
    }
    if (key === 'polarity') {
      if (value === 'nonpolar') setResult({ tech: 'rp_hplc', reason: 'RP-HPLC is ideal — nonpolar compounds retained well on C18.' })
    }
    if (key === 'chiral') {
      if (value === 'chiral')      setResult({ tech: 'ce',      reason: 'CE with cyclodextrin modifier excels at chiral separations.' })
      if (value === 'very_polar')  setResult({ tech: 'np_hplc', reason: 'HILIC or NP-HPLC for very polar compounds with poor RP retention.' })
      if (value === 'neither')     setResult({ tech: 'rp_hplc', reason: 'RP-HPLC with appropriate buffer handles polar ionisable drugs well.' })
    }
  }

  const Q = ({ children, hint }) => (
    <div style={{ background: '#0f1629', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '10px', padding: '12px 14px', marginBottom: '8px' }}>
      <p style={{ fontSize: '14px', fontWeight: '500', color: '#f0f4ff', margin: '0 0 4px' }}>{children}</p>
      {hint && <p style={{ fontSize: '12px', color: 'rgba(240,244,255,0.35)', margin: 0, lineHeight: 1.5 }}>{hint}</p>}
    </div>
  )

  const Btn = ({ onClick, active, color = '#2563eb', children }) => (
    <button onClick={onClick} style={{
      padding: '7px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: active ? '600' : '400',
      border: active ? `2px solid ${color}` : '1px solid rgba(255,255,255,0.1)',
      background: active ? color + '18' : 'rgba(255,255,255,0.04)', color: active ? color : 'rgba(240,244,255,0.6)',
      transition: 'all 0.12s',
    }}>{children}</button>
  )

  const showVolatile  = true
  const showPurpose   = props.volatile === false
  const showBiomatrix = showPurpose && props.purpose === 'prep'
  const showIonic     = showPurpose && props.purpose === 'sep'
  const showLarge     = showIonic && props.ionic === true
  const showGoalCharge = showLarge && props.large === false
  const showMWGoal    = showIonic && props.ionic === false
  const showPolarity  = showMWGoal && props.mw_goal === false
  const showChiral    = showPolarity && props.polarity === 'polar'

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', alignItems: 'start' }}>
      {/* Questions */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <p style={{ fontSize: '12px', fontWeight: '600', color: 'rgba(240,244,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0 }}>Compound properties</p>
          {path.length > 0 && <button onClick={reset} style={{ fontSize: '12px', color: 'rgba(240,244,255,0.4)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>Reset</button>}
        </div>

        {showVolatile && (
          <div style={{ marginBottom: '14px' }}>
            <Q hint="Volatile = bp < ~300°C, can be vaporised without decomposition. Most drugs are NOT volatile.">
              Is the compound volatile and thermally stable?
            </Q>
            <div style={{ display: 'flex', gap: '8px' }}>
              <Btn onClick={() => answer('volatile', true)}  active={props.volatile === true}>Yes — volatile</Btn>
              <Btn onClick={() => answer('volatile', false)} active={props.volatile === false}>No — non-volatile</Btn>
            </div>
          </div>
        )}

        {showPurpose && (
          <div style={{ marginBottom: '14px' }}>
            <Q hint="Sample prep = cleaning up a biological matrix (plasma, urine) before the analytical step. Separation = resolving analytes from each other in a mixture.">
              What is the primary analytical goal?
            </Q>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <Btn onClick={() => answer('purpose', 'prep')} active={props.purpose === 'prep'}>Sample preparation</Btn>
              <Btn onClick={() => answer('purpose', 'sep')}  active={props.purpose === 'sep'}>Separation / quantification</Btn>
            </div>
          </div>
        )}

        {showBiomatrix && (
          <div style={{ marginBottom: '14px' }}>
            <Q hint="Biological matrix = plasma, urine, tissue — contains proteins and phospholipids that interfere with analysis.">
              Is the sample a biological matrix?
            </Q>
            <div style={{ display: 'flex', gap: '8px' }}>
              <Btn onClick={() => answer('biomatrix', true)}  active={props.biomatrix === true}>Yes — plasma/urine/tissue</Btn>
              <Btn onClick={() => answer('biomatrix', false)} active={props.biomatrix === false}>No — simpler matrix</Btn>
            </div>
          </div>
        )}

        {showIonic && (
          <div style={{ marginBottom: '14px' }}>
            <Q hint="Permanently ionic: quaternary ammonium, sulfates — always charged. Ionisable: carboxylic acids, amines — charge depends on pH.">
              Is the compound ionic or permanently charged?
            </Q>
            <div style={{ display: 'flex', gap: '8px' }}>
              <Btn onClick={() => answer('ionic', true)}  active={props.ionic === true}  color="#0891b2">Yes — ionic/charged</Btn>
              <Btn onClick={() => answer('ionic', false)} active={props.ionic === false} color="#2563eb">No — neutral or ionisable</Btn>
            </div>
          </div>
        )}

        {showLarge && (
          <div style={{ marginBottom: '14px' }}>
            <Q hint="Large = MW > ~5000 Da. Proteins, peptides, nucleic acids, polysaccharides.">
              Is it a large biomolecule (protein, peptide, nucleic acid)?
            </Q>
            <div style={{ display: 'flex', gap: '8px' }}>
              <Btn onClick={() => answer('large', true)}  active={props.large === true}  color="#0891b2">Yes — large biomolecule</Btn>
              <Btn onClick={() => answer('large', false)} active={props.large === false} color="#0891b2">No — small molecule</Btn>
            </div>
          </div>
        )}

        {showGoalCharge && (
          <div style={{ marginBottom: '14px' }}>
            <Q hint="Charge variant analysis = characterising subtle charge differences (e.g. mAb quality control). Quantification = measuring how much drug is present.">
              Goal: charge variant analysis or quantification?
            </Q>
            <div style={{ display: 'flex', gap: '8px' }}>
              <Btn onClick={() => answer('goal_charge', 'charge')} active={props.goal_charge === 'charge'} color="#0891b2">Charge variant analysis</Btn>
              <Btn onClick={() => answer('goal_charge', 'quant')}  active={props.goal_charge === 'quant'}  color="#2563eb">Quantification</Btn>
            </div>
          </div>
        )}

        {showMWGoal && (
          <div style={{ marginBottom: '14px' }}>
            <Q hint="MW determination = finding the molecular weight of a polymer or protein. Aggregate detection = finding clumps of protein in a biopharmaceutical.">
              Goal: molecular weight determination or aggregate detection?
            </Q>
            <div style={{ display: 'flex', gap: '8px' }}>
              <Btn onClick={() => answer('mw_goal', true)}  active={props.mw_goal === true}  color="#16a34a">Yes — MW / aggregates</Btn>
              <Btn onClick={() => answer('mw_goal', false)} active={props.mw_goal === false} color="#2563eb">No — quantification / purity</Btn>
            </div>
          </div>
        )}

        {showPolarity && (
          <div style={{ marginBottom: '14px' }}>
            <Q hint="logP > 1 = nonpolar (lipophilic). logP < 0 = polar. Most drugs: logP 0–5.">
              Is the compound polar or nonpolar?
            </Q>
            <div style={{ display: 'flex', gap: '8px' }}>
              <Btn onClick={() => answer('polarity', 'polar')}    active={props.polarity === 'polar'}    color="#7c3aed">Polar (logP &lt; 1)</Btn>
              <Btn onClick={() => answer('polarity', 'nonpolar')} active={props.polarity === 'nonpolar'} color="#2563eb">Nonpolar (logP &gt; 1)</Btn>
            </div>
          </div>
        )}

        {showChiral && (
          <div style={{ marginBottom: '14px' }}>
            <Q hint="Chiral separation = you need to distinguish enantiomers. Very polar = amino acids, sugars, nucleotides — essentially no RP retention.">
              More specific requirement?
            </Q>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <Btn onClick={() => answer('chiral', 'chiral')}     active={props.chiral === 'chiral'}     color="#f97316">Chiral separation needed</Btn>
              <Btn onClick={() => answer('chiral', 'very_polar')} active={props.chiral === 'very_polar'} color="#7c3aed">Very polar (no RP retention)</Btn>
              <Btn onClick={() => answer('chiral', 'neither')}    active={props.chiral === 'neither'}    color="#2563eb">Neither — just polar</Btn>
            </div>
          </div>
        )}
      </div>

      {/* Result */}
      <div>
        <p style={{ fontSize: '12px', fontWeight: '600', color: 'rgba(240,244,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '12px' }}>Recommendation</p>
        {!result ? (
          <div style={{ background: '#0f1629', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', padding: '2rem', textAlign: 'center', color: 'rgba(240,244,255,0.35)' }}>
            <p style={{ fontSize: '13px' }}>Answer the questions on the left to get a technique recommendation with reasoning.</p>
          </div>
        ) : (
          <div>
            <TechCard tech={result.tech} />
            <div style={{ background: '#0f1629', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '10px', padding: '12px 14px', marginTop: '10px' }}>
              <p style={{ fontSize: '11px', fontWeight: '600', color: 'rgba(240,244,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 6px' }}>Why this technique</p>
              <p style={{ fontSize: '13px', color: 'rgba(240,244,255,0.75)', margin: '0 0 10px', lineHeight: 1.65 }}>{result.reason}</p>
            </div>
            {result && <TechDetails tech={result.tech} collapsed />}
          </div>
        )}
      </div>
    </div>
  )
}

function TechDetails({ tech, collapsed = false }) {
  const [open, setOpen] = useState(!collapsed)
  const t = TECHNIQUES[tech]
  if (!t) return null
  return (
    <div style={{ marginTop: '10px', border: `1px solid ${t.border}`, borderRadius: '10px', overflow: 'hidden' }}>
      <button onClick={() => setOpen(!open)}
        style={{ width: '100%', padding: '10px 14px', background: 'rgba(255,255,255,0.04)', border: 'none', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', fontWeight: '500', color: 'rgba(240,244,255,0.7)' }}>
        <span>Full technique details</span>
        <span style={{ fontSize: '16px', transform: open ? 'rotate(90deg)' : 'rotate(0)', transition: 'transform 0.15s' }}>›</span>
      </button>
      {open && (
        <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {[
            { label: 'Stationary phase', content: t.stationary },
            { label: 'Mobile phase / eluent', content: t.mobile },
            { label: 'Detectors', content: t.detectors.join(' · ') },
            { label: 'Good for', content: t.goodFor.join(' · ') },
            { label: 'Not suitable for', content: t.notFor.join(' · ') },
            { label: 'Pharma example', content: t.pharmaExample },
            { label: 'Key parameter', content: t.keyParam },
          ].map(item => (
            <div key={item.label}>
              <p style={{ fontSize: '11px', fontWeight: '600', color: t.col ?? t.color, textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 3px' }}>{item.label}</p>
              <p style={{ fontSize: '12px', color: 'rgba(240,244,255,0.75)', margin: 0, lineHeight: 1.65 }}>{item.content}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function TechniqueExplorer() {
  const [selected, setSelected] = useState('rp_hplc')
  const t = TECHNIQUES[selected]

  return (
    <div>
      {/* Technique selector */}
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
        {Object.values(TECHNIQUES).map(tech => (
          <button key={tech.id} onClick={() => setSelected(tech.id)}
            style={{
              padding: '6px 14px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px',
              fontWeight: selected === tech.id ? '600' : '400',
              border: selected === tech.id ? `2px solid ${tech.color}` : '1px solid rgba(255,255,255,0.1)',
              background: selected === tech.id ? `${tech.color}18` : 'rgba(255,255,255,0.04)',
              color: selected === tech.id ? tech.color : 'rgba(240,244,255,0.6)',
              transition: 'all 0.12s',
            }}>
            {tech.abbr}
          </button>
        ))}
      </div>

      {/* Technique detail */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {/* Header */}
          <div style={{ background: '#0f1629', border: `1px solid rgba(255,255,255,0.07)`, borderRadius: '12px', padding: '14px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span style={{ fontSize: '14px', fontWeight: '700', padding: '3px 12px', borderRadius: '999px', background: t.color, color: 'white' }}>{t.abbr}</span>
            </div>
            <p style={{ fontSize: '15px', fontWeight: '600', color: t.dark, margin: '0 0 4px' }}>{t.name}</p>
            <p style={{ fontSize: '13px', color: t.dark, margin: '0 0 8px', opacity: 0.75 }}>{t.tagline}</p>
            <p style={{ fontSize: '13px', color: 'rgba(240,244,255,0.75)', margin: 0, lineHeight: 1.7 }}>{t.plain}</p>
          </div>

          {[
            { label: 'Stationary phase', content: t.stationary },
            { label: 'Mobile phase / eluent', content: t.mobile },
          ].map(item => (
            <div key={item.label} style={{ background: '#0f1629', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '10px', padding: '12px 14px' }}>
              <p style={{ fontSize: '11px', fontWeight: '600', color: t.color, textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 5px' }}>{item.label}</p>
              <p style={{ fontSize: '13px', color: 'rgba(240,244,255,0.7)', margin: 0, lineHeight: 1.65 }}>{item.content}</p>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {/* Detectors */}
          <div style={{ background: '#0f1629', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '10px', padding: '12px 14px' }}>
            <p style={{ fontSize: '11px', fontWeight: '600', color: t.color, textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 8px' }}>Detectors</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {t.detectors.map((d, i) => (
                <div key={i} style={{ fontSize: '12px', color: 'rgba(240,244,255,0.7)', padding: '4px 8px', background: 'rgba(255,255,255,0.05)', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.07)' }}>
                  {d}
                </div>
              ))}
            </div>
          </div>

          {/* Good for / not for */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <div style={{ background: 'rgba(22,163,74,0.1)', border: '1px solid rgba(22,163,74,0.3)', borderRadius: '10px', padding: '10px 12px' }}>
              <p style={{ fontSize: '11px', fontWeight: '600', color: '#15803d', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 6px' }}>Good for</p>
              {t.goodFor.map((g, i) => (
                <p key={i} style={{ fontSize: '11px', color: '#166534', margin: '0 0 3px', lineHeight: 1.4 }}>✓ {g}</p>
              ))}
            </div>
            <div style={{ background: 'rgba(220,38,38,0.1)', border: '1px solid rgba(220,38,38,0.3)', borderRadius: '10px', padding: '10px 12px' }}>
              <p style={{ fontSize: '11px', fontWeight: '600', color: '#dc2626', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 6px' }}>Not for</p>
              {t.notFor.map((g, i) => (
                <p key={i} style={{ fontSize: '11px', color: '#991b1b', margin: '0 0 3px', lineHeight: 1.4 }}>✗ {g}</p>
              ))}
            </div>
          </div>

          {/* Pharma example */}
          <div style={{ background: '#0f1629', border: 'rgba(255,255,255,0.07)', borderRadius: '10px', padding: '12px 14px' }}>
            <p style={{ fontSize: '11px', fontWeight: '600', color: t.dark, textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 5px' }}>Pharmaceutical example</p>
            <p style={{ fontSize: '12px', color: 'rgba(240,244,255,0.75)', margin: '0 0 6px', lineHeight: 1.65 }}>{t.pharmaExample}</p>
            <p style={{ fontSize: '11px', color: t.color, margin: 0 }}><strong>Key parameter:</strong> {t.keyParam}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

function QuizMode() {
  const [idx,       setIdx]       = useState(0)
  const [selected,  setSelected]  = useState(null)
  const [submitted, setSubmitted] = useState(false)
  const [score,     setScore]     = useState(0)
  const [done,      setDone]      = useState(false)

  const c = QUIZ_CASES[idx]
  const isCorrect = selected === c.correct

  function submit() {
    if (!selected) return
    setSubmitted(true)
    if (isCorrect) setScore(s => s + 1)
  }

  function next() {
    if (idx + 1 >= QUIZ_CASES.length) { setDone(true); return }
    setIdx(i => i + 1)
    setSelected(null)
    setSubmitted(false)
  }

  function restart() {
    setIdx(0); setSelected(null); setSubmitted(false); setScore(0); setDone(false)
  }

  if (done) return (
    <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
      <div style={{ fontSize: '48px', marginBottom: '12px' }}>
        {score >= 5 ? '🎉' : score >= 3 ? '👍' : '📚'}
      </div>
      <h2 style={{ fontSize: '22px', fontWeight: '700', color: '#f0f4ff', marginBottom: '8px' }}>
        {score} / {QUIZ_CASES.length} correct
      </h2>
      <p style={{ fontSize: '14px', color: 'rgba(240,244,255,0.4)', marginBottom: '1.5rem' }}>
        {score >= 5 ? 'Excellent — solid command of analytical technique selection.' : score >= 3 ? 'Good foundation. Review the techniques you missed.' : 'Keep practising — use the Technique Explorer to review.'}
      </p>
      <button onClick={restart} style={{ padding: '10px 24px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>
        Try again
      </button>
    </div>
  )

  return (
    <div>
      {/* Progress */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', gap: '4px' }}>
          {QUIZ_CASES.map((_, i) => (
            <div key={i} style={{ width: '24px', height: '4px', borderRadius: '2px', background: i < idx ? '#22c55e' : i === idx ? '#2a6fdb' : 'rgba(255,255,255,0.12)' }} />
          ))}
        </div>
        <span style={{ fontSize: '12px', color: 'rgba(240,244,255,0.4)' }}>Score: {score} / {idx}</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', alignItems: 'start' }}>
        {/* Compound */}
        <div>
          <div style={{ background: '#0f1629', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', padding: '14px 16px', marginBottom: '12px' }}>
            <p style={{ fontSize: '11px', fontWeight: '600', color: 'rgba(240,244,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 6px' }}>Compound to analyse</p>
            <p style={{ fontSize: '18px', fontWeight: '700', color: '#f0f4ff', margin: '0 0 10px' }}>{c.compound}</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {Object.entries(c.properties).map(([k, v]) => (
                <div key={k} style={{ display: 'flex', gap: '8px', fontSize: '12px' }}>
                  <span style={{ color: 'rgba(240,244,255,0.35)', textTransform: 'capitalize', minWidth: '90px', flexShrink: 0 }}>{k.replace('_', ' ')}</span>
                  <span style={{ color: 'rgba(240,244,255,0.75)', fontWeight: '500' }}>{v}</span>
                </div>
              ))}
            </div>
          </div>

          <p style={{ fontSize: '13px', fontWeight: '500', color: 'rgba(240,244,255,0.55)', marginBottom: '8px' }}>Select the most appropriate technique:</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {Object.values(TECHNIQUES).map(tech => {
              const isSelected = selected === tech.id
              const isRight    = submitted && tech.id === c.correct
              const isWrong    = submitted && isSelected && !isCorrect
              return (
                <button key={tech.id} onClick={() => !submitted && setSelected(tech.id)}
                  style={{
                    padding: '9px 14px', borderRadius: '8px', cursor: submitted ? 'default' : 'pointer',
                    textAlign: 'left', fontSize: '13px', fontWeight: isSelected ? '600' : '400',
                    border: isRight ? '2px solid #16a34a' : isWrong ? '2px solid #dc2626' : isSelected ? `2px solid ${tech.color}` : '1px solid rgba(255,255,255,0.1)',
                    background: isRight ? 'rgba(22,163,74,0.15)' : isWrong ? 'rgba(239,68,68,0.15)' : isSelected ? `${tech.color}18` : 'rgba(255,255,255,0.04)',
                    color: isRight ? '#86efac' : isWrong ? '#fca5a5' : isSelected ? tech.color : 'rgba(240,244,255,0.65)',
                    transition: 'all 0.12s',
                  }}>
                  <span style={{ fontWeight: '600' }}>{tech.abbr}</span>
                  <span style={{ color: 'rgba(240,244,255,0.3)', marginLeft: '8px', fontWeight: '400', fontSize: '11px' }}>{tech.name}</span>
                  {isRight && <span style={{ float: 'right' }}>✓</span>}
                  {isWrong && <span style={{ float: 'right' }}>✗</span>}
                </button>
              )
            })}
          </div>

          {!submitted
            ? <button onClick={submit} disabled={!selected}
                style={{ marginTop: '12px', width: '100%', padding: '10px', background: selected ? '#2563eb' : '#e5e7eb', color: selected ? 'white' : '#9ca3af', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: selected ? 'pointer' : 'default' }}>
                Submit answer
              </button>
            : <button onClick={next}
                style={{ marginTop: '12px', width: '100%', padding: '10px', background: '#2a6fdb', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>
                {idx + 1 >= QUIZ_CASES.length ? 'See results' : 'Next question →'}
              </button>
          }
        </div>

        {/* Feedback */}
        <div>
          {!submitted ? (
            <div style={{ background: '#0f1629', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', padding: '2rem', textAlign: 'center', color: 'rgba(240,244,255,0.35)' }}>
              <p style={{ fontSize: '13px' }}>Submit your answer to see the explanation.</p>
            </div>
          ) : (
            <div>
              <div style={{ padding: '12px 14px', borderRadius: '10px', marginBottom: '10px', background: isCorrect ? 'rgba(22,163,74,0.12)' : 'rgba(239,68,68,0.12)', border: `1px solid ${isCorrect ? 'rgba(22,163,74,0.35)' : 'rgba(239,68,68,0.35)'}` }}>
                <p style={{ fontSize: '14px', fontWeight: '600', color: isCorrect ? '#86efac' : '#fca5a5', margin: '0 0 4px' }}>
                  {isCorrect ? '✓ Correct' : `✗ Incorrect — correct answer is ${TECHNIQUES[c.correct].abbr}`}
                </p>
              </div>
              <div style={{ background: '#0f1629', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '10px', padding: '12px 14px', marginBottom: '10px' }}>
                <p style={{ fontSize: '11px', fontWeight: '600', color: 'rgba(240,244,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 5px' }}>Why</p>
                <p style={{ fontSize: '13px', color: 'rgba(240,244,255,0.7)', margin: 0, lineHeight: 1.65 }}>{c.explanation}</p>
              </div>
              <div style={{ background: '#0f1629', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '10px', padding: '12px 14px', marginBottom: '10px' }}>
                <p style={{ fontSize: '11px', fontWeight: '600', color: 'rgba(240,244,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 8px' }}>Full method</p>
                {[
                  { label: 'Column / sorbent', value: c.column },
                  { label: 'Mobile phase',     value: c.mobile },
                  { label: 'Detector',         value: c.detector },
                ].map(row => (
                  <div key={row.label} style={{ display: 'flex', gap: '8px', marginBottom: '4px', fontSize: '12px' }}>
                    <span style={{ color: 'rgba(240,244,255,0.35)', minWidth: '110px', flexShrink: 0 }}>{row.label}</span>
                    <span style={{ color: 'rgba(240,244,255,0.7)' }}>{row.value}</span>
                  </div>
                ))}
              </div>
              <TechCard tech={c.correct} compact />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Main page ─────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const [tab, setTab] = useState(0)

  return (
    <main style={{ maxWidth: '1060px', margin: '0 auto', padding: '2rem 1rem', fontFamily: "'Inter',system-ui,sans-serif", background: '#0a0f1e', minHeight: '100vh', color: '#f0f4ff' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap'); * { box-sizing:border-box; }`}</style>
      <a href="/tools" style={{ fontSize: '13px', color: 'rgba(240,244,255,0.4)', textDecoration: 'none', display: 'inline-block', marginBottom: '1rem' }}>← Tools</a>
      <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#f0f4ff', margin: '0 0 4px', letterSpacing: '-0.02em' }}>Analytical Technique Trainer</h1>
      <p style={{ fontSize: '13px', color: 'rgba(240,244,255,0.5)', marginBottom: '1.5rem', lineHeight: '1.6' }}>
        Build intuition for selecting the right analytical technique — chromatography, sample preparation, detectors. Decision trainer, full reference, and quiz mode.
      </p>

      {/* Tabs */}
      <div style={{ borderBottom: '1px solid rgba(255,255,255,0.07)', marginBottom: '1.5rem', display: 'flex', gap: 0 }}>
        {TABS.map((t, i) => (
          <button key={i} onClick={() => setTab(i)}
            style={{
              padding: '8px 20px', cursor: 'pointer', fontSize: '13px',
              fontWeight: tab === i ? '600' : '400',
              border: 'none', borderBottom: tab === i ? '2px solid #2a6fdb' : '2px solid transparent',
              background: 'transparent', color: tab === i ? '#93b4f7' : 'rgba(240,244,255,0.4)',
              marginBottom: '-1px', transition: 'all 0.1s',
            }}>
            {t}
          </button>
        ))}
      </div>

      {tab === 0 && <DecisionTrainer />}
      {tab === 1 && <TechniqueExplorer />}
      {tab === 2 && <QuizMode />}
    </main>
  )
}