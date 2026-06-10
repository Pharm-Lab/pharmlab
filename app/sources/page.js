'use client'
import { useState } from 'react'

const SOURCES = {
  'Alcohol Calculator': {
    description: 'BAC simulation using the Widmark model with first-order absorption and zero-order elimination.',
    sources: [
      { citation: 'Widmark, E.M.P. (1932). Die theoretischen Grundlagen und die praktische Verwendbarkeit der gerichtlich-medizinischen Alkoholbestimmung. Urban & Schwarzenberg.', note: 'Original Widmark model and r-factor values (male 0.68, female 0.55).' },
      { citation: 'Norberg, Å., Jones, A.W., Hahn, R.G., & Gabrielsson, J.L. (2003). Role of variability in explaining ethanol pharmacokinetics. Clinical Pharmacokinetics, 42(1).', note: 'Population r-factor distribution, elimination rate variability (β = 0.10–0.20 g/L/h).' },
      { citation: 'Jones, A.W., & Andersson, L. (1996). Influence of age, gender and blood-alcohol concentration on the disappearance rate of alcohol from blood in drinking drivers. Journal of Forensic Sciences, 41(6).', note: 'Mean elimination rate β = 0.15 g/L/h, population range.' },
      { citation: 'Dubowski, K.M. (1985). Absorption, distribution and elimination of alcohol: Highway safety aspects. Journal of Studies on Alcohol, Supplement 10.', note: 'Absorption rate constants and first-order absorption model.' },
      { citation: 'European Transport Safety Council (ETSC). Drink Driving Limits across Europe. etsc.eu', note: 'Legal BAC limits for NL, DE, BE, FR.' },
    ]
  },
  'MDMA Calculator': {
    description: 'Plasma concentration simulation using 1-compartment oral PK model with first-order absorption and elimination.',
    sources: [
      { citation: 'de la Torre, R., Farré, M., Ortuño, J., et al. (2000). Non-linear pharmacokinetics of MDMA in humans. British Journal of Clinical Pharmacology, 49(2).', note: 'CYP2D6 autoinhibition, non-linear kinetics, mean t½ ~8h, Vd ~500L.' },
      { citation: 'Kolbrich, E.A., Goodwin, R.S., Gorelick, D.A., et al. (2008). Plasma pharmacokinetics of 3,4-methylenedioxymethamphetamine after controlled oral administration to young adults. Therapeutic Drug Monitoring, 30(3).', note: 'ka, Tmax ~2h, Cmax values, F ~75%.' },
      { citation: 'Pizarro, N., Farré, M., Pujadas, M., et al. (2004). Stereochemical analysis of 3,4-methylenedioxymethamphetamine and its main metabolites in human samples. Therapeutic Drug Monitoring, 26(3).', note: 'Metabolite profiles, elimination kinetics.' },
      { citation: 'Hysek, C.M., Simmler, L.D., Nicola, V.G., et al. (2012). Duloxetine inhibits effects of MDMA ("ecstasy") in vitro and in humans. Clinical Pharmacology & Therapeutics, 92(3).', note: 'Serotonin syndrome risk with combined serotonergic drugs.' },
      { citation: 'European Union Drugs Agency (EUDA). (2024). MDMA — drug profile and situation in Europe. euda.europa.eu', note: 'MDMA tablet strength distribution, adulteration rates, European market data.' },
    ]
  },
  'Cannabis Calculator': {
    description: 'THC plasma concentration model for smoked and oral routes using 1-compartment PK with route-specific parameters.',
    sources: [
      { citation: 'Huestis, M.A., Henningfield, J.E., & Cone, E.J. (1992). Blood cannabinoids. I. Absorption of THC and formation of 11-OH-THC and THCCOOH during and after smoking marijuana. Journal of Analytical Toxicology, 16(5).', note: 'Smoked THC absorption kinetics, Tmax ~10 min, bioavailability 10–35%.' },
      { citation: 'Huestis, M.A. (2007). Human cannabinoid pharmacokinetics. Chemistry & Biodiversity, 4(8).', note: 'Comprehensive review: Vd ~350L, t½ distribution, oral vs smoked comparison, 11-OH-THC active metabolite.' },
      { citation: 'Grotenhermen, F. (2003). Pharmacokinetics and pharmacodynamics of cannabinoids. Clinical Pharmacokinetics, 42(4).', note: 'Oral bioavailability 4–20%, food effect on absorption, ke values.' },
      { citation: 'Newmeyer, M.N., Swortwood, M.J., Barnes, A.J., et al. (2016). Free and glucuronide whole blood cannabinoids pharmacokinetics after controlled smoked, vaporized, and oral cannabis administration. Clinical Chemistry, 62(12).', note: 'Route comparison, plasma vs blood THC concentrations, driving-relevant concentrations.' },
      { citation: 'European Union Drugs Agency (EUDA). (2024). Cannabis drug profile. euda.europa.eu', note: 'European legal limits, prevalence data, potency trends.' },
    ]
  },
  'Cocaine Calculator': {
    description: 'Plasma concentration model for intranasal cocaine using 1-compartment PK with first-order absorption and elimination.',
    sources: [
      { citation: 'Wilkinson, P., Van Dyke, C., Jatlow, P., et al. (1980). Intranasal and oral cocaine kinetics. Clinical Pharmacology & Therapeutics, 27(3).', note: 'Intranasal bioavailability ~60%, Tmax 15–30 min, t½ ~1h.' },
      { citation: 'Jeffcoat, A.R., Perez-Reyes, M., Hill, J.M., et al. (1989). Cocaine disposition in humans after intravenous injection, nasal insufflation (snorting), or smoking. Drug Metabolism and Disposition, 17(2).', note: 'Route comparison, intranasal PK parameters, ka estimation.' },
      { citation: 'Jufer, R.A., Wstadik, A., Walsh, S.L., et al. (2000). Elimination of cocaine and metabolites in plasma, saliva, and urine following repeated oral administration to human volunteers. Journal of Analytical Toxicology, 24(7).', note: 'Elimination kinetics, ke ~0.55 h⁻¹, Vd ~2 L/kg.' },
      { citation: 'Harris, D.S., Everhart, E.T., Mendelson, J., & Jones, R.T. (2003). The pharmacology of cocaethylene in humans following cocaine and ethanol administration. Drug and Alcohol Dependence, 72(2).', note: 'Cocaethylene formation kinetics, t½ ~5h, cardiovascular toxicity data.' },
      { citation: 'Larocque, A., & Hoffman, R.S. (2012). Levamisole in cocaine: unexpected news from an old acquaintance. Clinical Toxicology, 50(4).', note: 'Levamisole as cocaine adulterant, agranulocytosis risk, European prevalence.' },
      { citation: 'Correlation–European Harm Reduction Network. (2024). Drug Checking in Europe: trends and data. correlation-net.org', note: 'Most common adulterants in European cocaine samples.' },
    ]
  },
  'Amphetamine Calculator': {
    description: 'Plasma concentration model for oral amphetamine and methamphetamine with pH-dependent elimination and vitamin C comparison.',
    sources: [
      { citation: 'Cruickshank, C.C., & Dyer, K.R. (2009). A review of the clinical pharmacology of methamphetamine. Addiction, 104(7).', note: 'Methamphetamine PK parameters: t½ ~10h, Vd ~3.7 L/kg, F ~67%, CNS potency vs amphetamine.' },
      { citation: 'Schepers, R.J., Oyler, J.M., Joseph, R.E., et al. (2003). Methamphetamine and amphetamine pharmacokinetics in oral fluid and plasma after controlled oral methamphetamine administration. Clinical Chemistry, 49(1).', note: 'Comparative oral PK, Tmax values, plasma concentration-time profiles.' },
      { citation: 'Beckett, A.H., & Rowland, M. (1965). Urinary excretion kinetics of amphetamine in man. Journal of Pharmacy and Pharmacology, 17(10).', note: 'pH-dependent elimination — acidic urine increases elimination rate ~50%. Basis for vitamin C harm reduction strategy.' },
      { citation: 'Poklis, A. (1995). Amphetamine/methamphetamine: a review of their actions, toxicology, and disposition. Therapeutic Drug Monitoring, 17(5).', note: 'Elimination pH-dependence, clinical toxicology, urinary pH effect on t½.' },
    ]
  },
  'Ketamine Calculator': {
    description: 'Plasma concentration model for intranasal ketamine using 2-compartment PK with dissociation threshold zones.',
    sources: [
      { citation: 'Yanagihara, Y., Ohtani, M., Kariya, S., et al. (2003). Plasma concentration profiles of ketamine and norketamine after administration of various ketamine preparations to healthy Japanese volunteers. Biopharmaceutics & Drug Disposition, 24(1).', note: 'Intranasal PK parameters, Tmax, t½, Vd for intranasal ketamine.' },
      { citation: 'Clements, J.A., Nimmo, W.S., & Grant, I.S. (1982). Bioavailability, pharmacokinetics, and analgesic activity of ketamine in humans. Journal of Pharmaceutical Sciences, 71(5).', note: 'Bioavailability estimates, 2-compartment model parameters, clearance.' },
      { citation: 'Mion, G., & Villevieille, T. (2013). Ketamine pharmacology: an update (pharmacodynamics and molecular aspects, recent findings). CNS Neuroscience & Therapeutics, 19(6).', note: 'Dissociation threshold concentrations, S-ketamine vs racemic, NMDA receptor mechanism.' },
      { citation: 'Morgan, C.J.A., & Curran, H.V. (2012). Ketamine use: a review. Addiction, 107(1).', note: 'Bladder toxicity with chronic use, recreational use patterns, harm reduction context.' },
      { citation: 'Malinovsky, J.M., Servin, F., Cozian, A., et al. (1996). Ketamine and norketamine plasma concentrations after i.v., nasal and rectal administration in children. British Journal of Anaesthesia, 77(2).', note: 'Intranasal bioavailability and absorption rate data.' },
    ]
  },
  'Cathinones Calculator': {
    description: 'Mephedrone plasma concentration model with wide uncertainty band; information cards for other cathinones.',
    sources: [
      { citation: 'Archer, J.R.H., Dargan, P.I., Hudson, S., & Wood, D.M. (2014). Analysis of anonymous pooled urine from portable urinals in central London confirms the significant use of novel psychoactive substances. QJM: An International Journal of Medicine, 107(3).', note: 'Mephedrone prevalence and use patterns in recreational settings.' },
      { citation: 'European Union Drugs Agency (EUDA). (2024). New psychoactive substances — cathinones overview. euda.europa.eu', note: 'European cathinone market data, prevalence, recorded harms.' },
      { citation: 'Trimbos Instituut. (2025). Nationale Drug Monitor — Jaarbericht. trimbos.nl', note: 'Dutch drug market data; 3-MMC purity and prevalence in the Netherlands; note on market labelling accuracy.' },
      { citation: 'Correlation–European Harm Reduction Network. (2024). Drug Checking in Europe: trends and data. correlation-net.org', note: 'Cathinone mislabelling rates, compound identification from drug checking services.' },
    ]
  },
  'Harm Reduction Interaction Checker': {
    description: 'Hardcoded severity matrix for recreational and prescription drug combinations. No AI involved.',
    sources: [
      { citation: 'TripSit Drug Combinations Chart. (2024). tripsit.me', note: 'Primary reference for recreational drug combination severity classifications.' },
      { citation: 'Boyer, E.W., & Shannon, M. (2005). The serotonin syndrome. New England Journal of Medicine, 352(11).', note: 'Serotonin syndrome criteria used for MDMA + SSRI and MAOI interaction severity.' },
      { citation: 'Dinis-Oliveira, R.J. (2017). Metabolism and metabolomics of opiates: a long way of forensic implications to unravel. Journal of Forensic and Legal Medicine, 44.', note: 'Opioid–benzodiazepine combination respiratory depression mechanism.' },
    ]
  },
  'Graph Guide (Harm Reduction)': {
    description: 'Plain-English explanation of pharmacokinetic curves for non-scientists.',
    sources: [
      { citation: 'Rowland, M., & Tozer, T.N. (2011). Clinical Pharmacokinetics and Pharmacodynamics: Concepts and Applications (4th ed.). Lippincott Williams & Wilkins.', note: 'Foundation for all PK concepts explained in the guide: Cmax, Tmax, t½, AUC, first-pass, steady state.' },
      { citation: 'Shargel, L., Wu-Pong, S., & Yu, A.B.C. (2012). Applied Biopharmaceutics & Pharmacokinetics (6th ed.). McGraw-Hill.', note: 'Bioavailability definitions and absorption concepts referenced in the guide.' },
    ]
  },
  'Interactive ADME': {
    description: 'Clickable pathway diagram covering oral absorption, first-pass, distribution, BBB, metabolism, renal excretion, and enterohepatic recirculation.',
    sources: [
      { citation: 'Rowland, M., & Tozer, T.N. (2011). Clinical Pharmacokinetics and Pharmacodynamics: Concepts and Applications (4th ed.). Lippincott Williams & Wilkins.', note: 'All ADME equations: hepatic extraction ratio, well-stirred model CLH formula, Vd equation, CLR formula.' },
      { citation: 'Brunton, L.L., Knollmann, B.C., & Hilal-Dandan, R. (Eds.). (2022). Goodman & Gilman\'s The Pharmacological Basis of Therapeutics (14th ed.). McGraw-Hill.', note: 'P-glycoprotein efflux, gut-wall CYP3A4, BBB structure and CNS penetration criteria, EHC mechanism.' },
      { citation: 'Shargel, L., Wu-Pong, S., & Yu, A.B.C. (2012). Applied Biopharmaceutics & Pharmacokinetics (6th ed.). McGraw-Hill.', note: 'pH-partition hypothesis, BCS classification, Noyes-Whitney dissolution, oral bioavailability components F = Fabs × Fgut × Fliver.' },
      { citation: 'Hitchcock, S.A., & Pennington, L.D. (2006). Structure-brain exposure relationships. Journal of Medicinal Chemistry, 49(26).', note: 'BBB CNS drug rules of thumb: MW, logP, H-bond donor criteria.' },
      { citation: 'Roberts, M.S., Magnusson, B.M., Burczynski, F.J., & Weiss, M. (2002). Enterohepatic circulation: physiological, pharmacokinetic and clinical implications. Clinical Pharmacokinetics, 41(10).', note: 'EHC mechanism, second plasma peaks, antibiotic interruption of EHC cycle, clinical examples.' },
    ]
  },
  'Analytical Technique Trainer': {
    description: 'Decision trainer, technique explorer, and quiz covering RP-HPLC, NP-HPLC, GC, IEX, SEC, CE, SPE, and LLE.',
    sources: [
      { citation: 'Hansen, S.H., Pedersen-Bjergaard, S., & Rasmussen, K.E. (2012). Introduction to Pharmaceutical Chemical Analysis. Wiley-Blackwell.', note: 'Primary course textbook at Leiden BFW. All technique parameters, applications, and pharma examples.' },
      { citation: 'Snyder, L.R., Kirkland, J.J., & Glajch, J.L. (2012). Practical HPLC Method Development (2nd ed.). Wiley-Interscience.', note: 'RP-HPLC mobile phase selection, column choice, gradient design, ion-pair reagents for charged drugs.' },
      { citation: 'Skoog, D.A., Holler, F.J., & Crouch, S.R. (2018). Principles of Instrumental Analysis (7th ed.). Cengage Learning.', note: 'GC detector characteristics (FID, ECD, MS), CE separation principles, SEC theory and calibration.' },
      { citation: 'U.S. Food and Drug Administration. (2017). Guidance for Industry: Waiver of In Vivo Bioavailability and Bioequivalence Studies for Immediate-Release Solid Oral Dosage Forms Based on a Biopharmaceutics Classification System.', note: 'BCS biowaiver criteria: ≥85% dissolution in 30 minutes.' },
    ]
  },
  'pKa & Ionisation': {
    description: 'Functional group pKa explorer with substituent effects and Henderson-Hasselbalch ionisation calculator.',
    sources: [
      { citation: 'Clayden, J., Greeves, N., & Warren, S. (2012). Organic Chemistry (2nd ed.). Oxford University Press.', note: 'pKa values and reasoning for all functional groups: resonance and inductive effect explanations. Primary course textbook at Leiden BFW.' },
      { citation: 'Shargel, L., Wu-Pong, S., & Yu, A.B.C. (2012). Applied Biopharmaceutics & Pharmacokinetics (6th ed.). McGraw-Hill.', note: 'Henderson-Hasselbalch equation, pH-partition hypothesis, urine trapping clinical applications.' },
      { citation: 'Manallack, D.T. (2007). The pKa distribution of drugs: application to drug discovery. Perspectives in Medicinal Chemistry, 1.', note: 'pKa distribution of marketed drugs, ionisation at physiological pH, logD vs logP context.' },
    ]
  },
  'Dissolution & Drug Release': {
    description: 'Noyes-Whitney dissolution simulator with particle size comparison, release profile modelling, and BCS classification.',
    sources: [
      { citation: 'Noyes, A.A., & Whitney, W.R. (1897). The rate of solution of solid substances in their own solutions. Journal of the American Chemical Society, 19(12).', note: 'Original Noyes-Whitney equation: dC/dt = (D·A·Cs)/(h·V). Foundation of dissolution modelling.' },
      { citation: 'Amidon, G.L., Lennernäs, H., Shah, V.P., & Crison, J.R. (1995). A theoretical basis for a biopharmaceutic drug classification: the correlation of in vitro drug product dissolution and in vivo bioavailability. Pharmaceutical Research, 12(3).', note: 'Original BCS classification paper establishing Classes I–IV.' },
      { citation: 'Costa, P., & Sousa Lobo, J.M. (2001). Modeling and comparison of dissolution profiles. European Journal of Pharmaceutical Sciences, 13(2).', note: 'Weibull, zero-order, and first-order release model equations and comparison.' },
      { citation: 'Shargel, L., Wu-Pong, S., & Yu, A.B.C. (2012). Applied Biopharmaceutics & Pharmacokinetics (6th ed.). McGraw-Hill.', note: 'Noyes-Whitney derivation, particle size effects, BCS and formulation strategy.' },
      { citation: 'U.S. Food and Drug Administration. (2017). Guidance for Industry: Waiver of In Vivo Bioavailability and Bioequivalence Studies for Immediate-Release Solid Oral Dosage Forms Based on a Biopharmaceutics Classification System.', note: 'BCS biowaiver 85%/30 min criterion, pH media requirements for testing.' },
    ]
  },
  'Lipinski & Drug-likeness': {
    description: 'Rule of Five calculator with BCS class prediction, formulation strategy suggestions, and drug examples.',
    sources: [
      { citation: 'Lipinski, C.A., Lombardo, F., Dominy, B.W., & Feeney, P.J. (1997). Experimental and computational approaches to estimate solubility and permeability in drug discovery and development settings. Advanced Drug Delivery Reviews, 23(1–3).', note: 'Original Rule of Five paper: MW ≤500, logP ≤5, HBD ≤5, HBA ≤10.' },
      { citation: 'Veber, D.F., Johnson, S.R., Cheng, H.Y., et al. (2002). Molecular properties that influence the oral bioavailability of drug candidates. Journal of Medicinal Chemistry, 45(12).', note: 'Veber rules: ≤10 rotatable bonds, TPSA ≤140 Å² for oral bioavailability.' },
      { citation: 'Leeson, P.D., & Springthorpe, B. (2007). The influence of drug-like concepts on decision-making in medicinal chemistry. Nature Reviews Drug Discovery, 6(11).', note: 'Drug-likeness evolution beyond Rule of Five; active transport exceptions; formulation strategies.' },
    ]
  },
  'Dosage Adjustment': {
    description: 'Renal dose adjustment using Cockcroft-Gault eGFR and hepatic adjustment using Child-Pugh score.',
    sources: [
      { citation: 'Cockcroft, D.W., & Gault, M.H. (1976). Prediction of creatinine clearance from serum creatinine. Nephron, 16(1).', note: 'Original Cockcroft-Gault equation for creatinine clearance estimation used for renal adjustment.' },
      { citation: 'Pugh, R.N.H., Murray-Lyon, I.M., Dawson, J.L., et al. (1973). Transection of the oesophagus for bleeding oesophageal varices. British Journal of Surgery, 60(8).', note: 'Original Child-Pugh score; scoring system for hepatic impairment used for hepatic adjustment.' },
      { citation: 'Rowland, M., & Tozer, T.N. (2011). Clinical Pharmacokinetics and Pharmacodynamics: Concepts and Applications (4th ed.). Lippincott Williams & Wilkins.', note: 'Dose adjustment equations for renal and hepatic impairment; CLH, extraction ratio concepts.' },
      { citation: 'U.S. Food and Drug Administration. (2010). Guidance for Industry: Pharmacokinetics in Patients with Impaired Renal Function — Study Design, Data Analysis, and Impact on Dosing and Labeling.', note: 'FDA guidance on renal dose adjustment methodology; fe-based recommendations.' },
    ]
  },
  'NCA Tool': {
    description: 'Non-compartmental analysis: trapezoidal AUC, λz terminal slope regression, and NCA-derived PK parameters.',
    sources: [
      { citation: 'Gabrielsson, J., & Weiner, D. (2016). Pharmacokinetic and Pharmacodynamic Data Analysis: Concepts and Applications (5th ed.). Swedish Pharmaceutical Press.', note: 'NCA methodology: linear-log trapezoidal AUC, λz regression, Cmax/Tmax, CL/F, Vz/F.' },
      { citation: 'Rowland, M., & Tozer, T.N. (2011). Clinical Pharmacokinetics and Pharmacodynamics: Concepts and Applications (4th ed.). Lippincott Williams & Wilkins.', note: 'AUC trapezoidal rule, terminal half-life determination, NCA parameter definitions.' },
      { citation: 'Gibaldi, M., & Perrier, D. (1982). Pharmacokinetics (2nd ed.). Marcel Dekker.', note: 'Statistical moment theory, MRT, AUMCinf calculation.' },
      { citation: 'U.S. Food and Drug Administration. (2003). Guidance for Industry: Bioavailability and Bioequivalence Studies for Orally Administered Drug Products — General Considerations.', note: 'NCA parameters required for bioequivalence submission: AUC0–t, AUC0–∞, Cmax, Tmax.' },
    ]
  },
  'Bioequivalence Analyser': {
    description: 'TOST procedure with 90% confidence interval calculation and FDA/EMA acceptance criteria.',
    sources: [
      { citation: 'Schuirmann, D.J. (1987). A comparison of the Two One-Sided Tests Procedure and the Power Approach for assessing the equivalence of average bioavailability. Journal of Pharmacokinetics and Biopharmaceutics, 15(6).', note: 'Original TOST paper: two one-sided t-tests for bioequivalence, α = 0.05, 90% CI.' },
      { citation: 'U.S. Food and Drug Administration. (2003). Guidance for Industry: Bioavailability and Bioequivalence Studies for Orally Administered Drug Products — General Considerations.', note: '80–125% acceptance criterion for Cmax and AUC, log-transformed analysis.' },
      { citation: 'European Medicines Agency (EMA). (2010). Guideline on the Investigation of Bioequivalence. EMA/CPMP/EWP/QWP/1401/98 Rev. 1.', note: 'EMA acceptance criteria, 90% CI methodology, BCS biowaiver conditions.' },
    ]
  },
  'PK/PD Calculator': {
    description: 'Multi-model PK calculator with closed-form solutions and RK4 numerical integration for 12 PK/PD models.',
    sources: [
      { citation: 'Rowland, M., & Tozer, T.N. (2011). Clinical Pharmacokinetics and Pharmacodynamics: Concepts and Applications (4th ed.). Lippincott Williams & Wilkins.', note: 'All 1-compartment linear equations, Vd/CL/ke relationships, oral dosing with first-pass.' },
      { citation: 'Gabrielsson, J., & Weiner, D. (2016). Pharmacokinetic and Pharmacodynamic Data Analysis: Concepts and Applications (5th ed.). Swedish Pharmaceutical Press.', note: '2-compartment model parameterisation (Vc/Vp/CL/Q), RK4 ODE approach, population PK.' },
      { citation: 'Michaelis, L., & Menten, M.L. (1913). Die Kinetik der Invertinwirkung. Biochemische Zeitschrift, 49.', note: 'Original Michaelis-Menten equation used for non-linear clearance (Vmax/Km model).' },
      { citation: 'Sheiner, L.B., & Ludden, T.M. (1992). Population pharmacokinetics/dynamics. Annual Review of Pharmacology and Toxicology, 32.', note: 'Log-normal IIV distribution, CV% parameterisation for population PK simulation.' },
    ]
  },
  'Colony Counter': {
    description: 'Browser-based colony counting tool with manual click-to-mark mode and auto-detection using Otsu thresholding and connected component analysis.',
    sources: [
      { citation: 'Otsu, N. (1979). A threshold selection method from gray-level histograms. IEEE Transactions on Systems, Man, and Cybernetics, 9(1).', note: 'Otsu\'s method for automatic optimal threshold selection — used in auto-detect mode.' },
      { citation: 'Rosenfeld, A., & Pfaltz, J.L. (1966). Sequential operations in digital picture processing. Journal of the ACM, 13(4).', note: 'Connected component labelling algorithm used to identify and count individual colony blobs.' },
    ]
  },
  'TLC Analyser': {
    description: 'Interactive TLC plate analyser: click baseline, solvent front, and spots to calculate Rf values instantly.',
    sources: [
      { citation: 'Stahl, E. (Ed.). (1969). Thin Layer Chromatography: A Laboratory Handbook (2nd ed.). Springer-Verlag.', note: 'Rf definition, baseline and solvent front measurement methodology, plate documentation standards.' },
      { citation: 'Reich, E., & Schibli, A. (2006). High-Performance Thin-Layer Chromatography for the Analysis of Medicinal Plants. Thieme.', note: 'TLC documentation and Rf calculation for pharmaceutical applications.' },
    ]
  },
  'Drug Interaction Checker': {
    description: 'AI-powered interaction analysis using Claude (Anthropic). Pharmacological mechanisms verified against standard references.',
    sources: [
      { citation: 'Stockley, I.H. (Ed.). (2023). Stockley\'s Drug Interactions (13th ed.). Pharmaceutical Press.', note: 'Primary reference for interaction mechanisms, severity classifications, and CYP enzyme pathways.' },
      { citation: 'Flockhart, D.A. (2007). Drug Interactions: Cytochrome P450 Drug Interaction Table. Indiana University School of Medicine.', note: 'CYP450 enzyme inhibitor/inducer interaction data.' },
    ]
  },
  'Exercise Helper': {
    description: 'AI-powered PK/PD exercise solver. Mathematical solutions verified against standard pharmacokinetics textbooks.',
    sources: [
      { citation: 'Rowland, M., & Tozer, T.N. (2011). Clinical Pharmacokinetics and Pharmacodynamics: Concepts and Applications (4th ed.). Lippincott Williams & Wilkins.', note: 'Primary textbook for all PK/PD formulas and worked examples.' },
      { citation: 'Shargel, L., Wu-Pong, S., & Yu, A.B.C. (2012). Applied Biopharmaceutics & Pharmacokinetics (6th ed.). McGraw-Hill.', note: 'Bioavailability, NCA methods, clinical PK calculations.' },
      { citation: 'Gibaldi, M., & Perrier, D. (1982). Pharmacokinetics (2nd ed.). Marcel Dekker.', note: 'Multi-compartment model mathematics, moment analysis.' },
    ]
  },
  'Gel Image Analyser': {
    description: 'Molecular weight estimation from SDS-PAGE and agarose gel images using log(MW) vs Rf linear regression against a ladder standard curve.',
    sources: [
      { citation: 'Laemmli, U.K. (1970). Cleavage of structural proteins during the assembly of the head of bacteriophage T4. Nature, 227(5259), 680–685.', note: 'SDS-PAGE methodology establishing the linear log(MW) vs migration distance relationship that underpins all gel MW estimation.' },
      { citation: 'Sambrook, J., & Russell, D.W. (2001). Molecular Cloning: A Laboratory Manual (3rd ed.). Cold Spring Harbor Laboratory Press.', note: 'Practical gel electrophoresis protocols, Rf calculation method, ladder selection, and MW estimation from standard curves.' },
      { citation: 'Thermo Fisher Scientific. (2024). PageRuler Prestained Protein Ladder — Product Manual. thermofisher.com', note: 'Band sizes and migration characteristics for PageRuler 10–200 kDa and 3.5–500 kDa ladders used as presets.' },
      { citation: 'New England Biolabs. (2024). Quick-Load DNA Ladder — Product Information. neb.com', note: 'Band sizes for GeneRuler 1kb and 100bp DNA ladders used as presets.' },
    ]
  },
  'Protein Tools': {
    description: 'Bradford/BCA/Lowry protein quantification with standard curve fitting, plus isoelectric point and extinction coefficient calculation from amino acid sequence.',
    sources: [
      { citation: 'Bradford, M.M. (1976). A rapid and sensitive method for the quantitation of microgram quantities of protein utilizing the principle of protein-dye binding. Analytical Biochemistry, 72(1–2), 248–254.', note: 'Original Bradford assay paper. Coomassie Brilliant Blue G-250 binding to protein, A595, BSA standard curve linear range ~0.1–1.4 mg/mL.' },
      { citation: 'Smith, P.K., Krohn, R.I., Hermanson, G.T., et al. (1985). Measurement of protein using bicinchoninic acid. Analytical Biochemistry, 150(1), 76–85.', note: 'Original BCA assay paper. Cu²⁺ reduction and bicinchoninic acid reaction, A562, linear range 20–2000 μg/mL.' },
      { citation: 'Pace, C.N., Vajdos, F., Fee, L., Grimsley, G., & Gray, T. (1995). How to measure and predict the molar absorption coefficient of a protein. Protein Science, 4(11), 2411–2423.', note: 'Pace method for ε₂₈₀ calculation: ε = 5500×nTrp + 1490×nTyr + 125×nCys(SS). The standard reference for extinction coefficient prediction from sequence.' },
      { citation: 'Bjellqvist, B., Hughes, G.J., Pasquali, C., et al. (1993). The focusing positions of polypeptides in immobilised pH gradients can be predicted from their amino acid sequences. Electrophoresis, 14(1), 1023–1031.', note: 'pKa values and method for pI calculation used in the sequence analyser. Henderson-Hasselbalch bisection approach.' },
      { citation: 'Gasteiger, E., Hoogland, C., Gattiker, A., et al. (2005). Protein identification and analysis tools on the ExPASy server. In J.M. Walker (Ed.), The Proteomics Protocols Handbook. Humana Press.', note: 'ExPASy ProtParam tool methodology — validation reference for MW, pI, and ε₂₈₀ computations implemented here.' },
    ]
  },
  'Spectrophotometry': {
    description: 'Beer-Lambert calculator, nucleic acid quantification (A260/A280/A230 purity), batch sample mode, and dilution back-calculator.',
    sources: [
      { citation: 'Beer, A. (1852). Bestimmung der Absorption des rothen Lichts in farbigen Flüssigkeiten. Annalen der Physik und Chemie, 162(5), 78–88.', note: 'Original Beer-Lambert law: A = ε × c × l. The foundation of all absorbance-based quantification.' },
      { citation: 'Sambrook, J., & Russell, D.W. (2001). Molecular Cloning: A Laboratory Manual (3rd ed.). Cold Spring Harbor Laboratory Press.', note: 'A260/A280 purity ratios for nucleic acids: 1.8 for pure dsDNA, 2.0 for pure RNA. Contamination interpretation guidelines.' },
      { citation: 'Wilfinger, W.W., Mackey, K., & Chomczynski, P. (1997). Effect of pH and ionic strength on the spectrophotometric assessment of nucleic acid purity. BioTechniques, 22(3), 474–481.', note: 'A260/A230 ratio for assessing phenol/guanidinium contamination after TRIzol and column extractions. Pure samples: A260/A230 ≥ 2.0.' },
      { citation: 'Thermo Fisher Scientific. (2020). NanoDrop Spectrophotometer Technical Guide. thermofisher.com', note: 'Nucleic acid concentration factors: 50 μg/mL per A260 for dsDNA, 40 μg/mL for RNA, 33 μg/mL for ssDNA. Standard reference for the conversion factors used here.' },
    ]
  },
}

export default function Sources() {
  const [selected, setSelected] = useState(null)
  const [showAll,  setShowAll]  = useState(false)

  const topics = Object.keys(SOURCES)

  return (
    <main style={{ maxWidth: '860px', margin: '0 auto', padding: '2rem 1rem', fontFamily: 'sans-serif' }}>

      <div style={{ textAlign: 'center', padding: '3rem 1rem 2rem' }}>
        <div style={{ fontSize: '48px', marginBottom: '12px' }}>📚</div>
        <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#111827', margin: '0 0 8px' }}>Sources</h1>
        <p style={{ fontSize: '16px', color: '#6b7280', margin: '0 0 2rem' }}>
          Source: trust me bro
        </p>
        <button
          onClick={() => setShowAll(!showAll)}
          style={{ padding: '10px 24px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: '500', cursor: 'pointer' }}>
          {showAll ? 'Hide sources ↑' : 'Actually show me the sources ↓'}
        </button>
      </div>

      {showAll && (
        <div>
          <div style={{ marginBottom: '1.5rem' }}>
            <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '8px' }}>Filter by tool:</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              <button
                onClick={() => setSelected(null)}
                style={{ padding: '6px 14px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px',
                  fontWeight: selected === null ? '600' : '400',
                  border: selected === null ? '2px solid #2563eb' : '1px solid #d1d5db',
                  background: selected === null ? '#eff6ff' : 'white',
                  color: selected === null ? '#1d4ed8' : '#374151' }}>
                All tools
              </button>
              {topics.map(t => (
                <button key={t} onClick={() => setSelected(t)}
                  style={{ padding: '6px 14px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px',
                    fontWeight: selected === t ? '600' : '400',
                    border: selected === t ? '2px solid #2563eb' : '1px solid #d1d5db',
                    background: selected === t ? '#eff6ff' : 'white',
                    color: selected === t ? '#1d4ed8' : '#374151' }}>
                  {t}
                </button>
              ))}
            </div>
          </div>

          {(selected ? [selected] : topics).map(topic => (
            <div key={topic} style={{ marginBottom: '1.5rem', border: '1px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden' }}>
              <div style={{ background: '#f9fafb', padding: '12px 16px', borderBottom: '1px solid #e5e7eb' }}>
                <h2 style={{ fontSize: '15px', fontWeight: '600', color: '#111827', margin: '0 0 3px' }}>{topic}</h2>
                <p style={{ fontSize: '12px', color: '#6b7280', margin: 0 }}>{SOURCES[topic].description}</p>
              </div>
              <div style={{ padding: '12px 16px' }}>
                {SOURCES[topic].sources.map((s, i) => (
                  <div key={i} style={{ marginBottom: '10px', paddingBottom: '10px', borderBottom: i < SOURCES[topic].sources.length - 1 ? '1px solid #f3f4f6' : 'none' }}>
                    <p style={{ fontSize: '13px', color: '#374151', margin: '0 0 3px', lineHeight: '1.55' }}>{s.citation}</p>
                    <p style={{ fontSize: '11px', color: '#9ca3af', margin: 0 }}>Used for: {s.note}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}

          <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '1rem', fontSize: '12px', color: '#6b7280', marginTop: '1rem', lineHeight: '1.65' }}>
            <strong>On accessing sources:</strong> Journal articles are accessible through Universiteit Leiden library (LUCRIS). The core textbooks — Rowland & Tozer, Shargel, Clayden, Hansen/Pedersen-Bjergaard/Rasmussen — are all available via UB Leiden.
            <br /><br />
            <strong>On AI-generated content:</strong> The drug interaction checker and exercise helper use Claude (Anthropic). AI output should be cross-checked against primary sources for clinical or academic use. PharmLab is an educational tool — not a clinical decision support system.
          </div>
        </div>
      )}
    </main>
  )
}