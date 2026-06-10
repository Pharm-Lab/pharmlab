// interactions.js — PharmLab Recreational Drug Interaction Database
// ALL severity ratings are hardcoded — never AI-generated.
// Sources: TripSit interaction chart, Erowid, published pharmacology literature.
// AI is only used for plain-language mechanism explanation.

// Severity levels
export const SEVERITY = {
  LETHAL:      { label: 'Lethal risk',       color: '#450a0a', bg: '#fef2f2', border: '#fecaca', textColor: '#991b1b' },
  DANGEROUS:   { label: 'Dangerous',         color: '#7f1d1d', bg: '#fef2f2', border: '#fca5a5', textColor: '#991b1b' },
  SEVERE:      { label: 'Severe',            color: '#dc2626', bg: '#fef2f2', border: '#fca5a5', textColor: '#b91c1c' },
  HIGH:        { label: 'High risk',         color: '#ef4444', bg: '#fff1f2', border: '#fecdd3', textColor: '#dc2626' },
  MODERATE:    { label: 'Moderate',          color: '#f97316', bg: '#fff7ed', border: '#fed7aa', textColor: '#c2410c' },
  LOW:         { label: 'Low risk',          color: '#f59e0b', bg: '#fefce8', border: '#fde68a', textColor: '#b45309' },
  CAUTION:     { label: 'Caution',           color: '#eab308', bg: '#fefce8', border: '#fef08a', textColor: '#a16207' },
  SAFE:        { label: 'Generally safe',    color: '#22c55e', bg: '#f0fdf4', border: '#bbf7d0', textColor: '#15803d' },
  UNKNOWN:     { label: 'Unknown',           color: '#6b7280', bg: '#f9fafb', border: '#e5e7eb', textColor: '#374151' },
  SEROTONIN:   { label: 'Serotonin syndrome',color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe', textColor: '#6d28d9' },
}

// Substance definitions
export const SUBSTANCES = [
  // Recreational
  { id: 'alcohol',       name: 'Alcohol',                    category: 'recreational', emoji: '🍺' },
  { id: 'mdma',          name: 'MDMA',                       category: 'recreational', emoji: '💊' },
  { id: 'cannabis',      name: 'Cannabis',                   category: 'recreational', emoji: '🌿' },
  { id: 'cocaine',       name: 'Cocaine',                    category: 'recreational', emoji: '🤧' },
  { id: 'amphetamine',   name: 'Amphetamine (speed)',        category: 'recreational', emoji: '⚡' },
  { id: 'meth',          name: 'Methamphetamine',            category: 'recreational', emoji: '🔴' },
  { id: 'ketamine',      name: 'Ketamine',                   category: 'recreational', emoji: '🔮' },
  { id: 'cathinones',    name: 'Cathinones (3-MMC etc.)',    category: 'recreational', emoji: '🧪' },
  { id: 'ghb',           name: 'GHB / GBL',                 category: 'recreational', emoji: '💧' },
  { id: 'psychedelics',  name: 'Psychedelics (LSD/psilocybin)', category: 'recreational', emoji: '🍄' },
  { id: 'opioids',       name: 'Opioids (heroin/codeine)',   category: 'recreational', emoji: '⚠️' },
  // Prescription
  { id: 'ssri',          name: 'SSRIs / SNRIs',              category: 'prescription', emoji: '💙', rx: true },
  { id: 'maoi',          name: 'MAOIs',                      category: 'prescription', emoji: '⛔', rx: true },
  { id: 'benzo',         name: 'Benzodiazepines / Z-drugs',  category: 'prescription', emoji: '💊', rx: true },
  { id: 'lithium',       name: 'Lithium',                    category: 'prescription', emoji: '🔋', rx: true },
  { id: 'tramadol',      name: 'Tramadol',                   category: 'prescription', emoji: '💊', rx: true },
  { id: 'adhd_stim',     name: 'ADHD stimulants (Ritalin/Adderall)', category: 'prescription', emoji: '🧠', rx: true },
]

// Interaction matrix
// Key format: 'substanceA_substanceB' (always alphabetical order)
// Each entry: { severity, mechanism, warning }

function key(a, b) {
  return [a, b].sort().join('_')
}

export const INTERACTIONS = {

  // ── Alcohol combinations ──────────────────────────────────────────

  [key('alcohol','mdma')]: {
    severity: 'HIGH',
    mechanism: 'Alcohol increases dehydration risk substantially. MDMA causes hyperthermia — alcohol worsens this. Alcohol masks MDMA intoxication leading to overconsumption of both. Increased neurotoxicity. Cocaethylene does not form (that is cocaine+alcohol) but combined liver stress is significant.',
    warning: null,
  },
  [key('alcohol','cannabis')]: {
    severity: 'MODERATE',
    mechanism: 'Highly synergistic impairment — much worse than additive. "Greening out" (nausea, spinning, vomiting) is common. Driving impairment is severely compounded. THC absorption may be increased by alcohol.',
    warning: 'Most common cause of cannabis-related emergency presentations.',
  },
  [key('alcohol','cocaine')]: {
    severity: 'DANGEROUS',
    mechanism: 'Liver produces cocaethylene — more cardiotoxic than cocaine alone, t½ ~5h (4× longer). Associated with sudden cardiac death. The combination feels more intense, driving further use of both. One of the most dangerous common recreational drug combinations.',
    warning: 'Cocaethylene is associated with sudden cardiac death.',
  },
  [key('alcohol','amphetamine')]: {
    severity: 'HIGH',
    mechanism: 'Amphetamine masks alcohol intoxication — people drink far more than they realise. The stimulant effect wears off before the alcohol, causing sudden severe intoxication. Combined cardiovascular strain.',
    warning: null,
  },
  [key('alcohol','meth')]: {
    severity: 'HIGH',
    mechanism: 'Same as amphetamine but more pronounced masking effect. Methamphetamine can mask severe alcohol intoxication, leading to dangerous overconsumption.',
    warning: null,
  },
  [key('alcohol','ketamine')]: {
    severity: 'SEVERE',
    mechanism: 'Both depress CNS and respiratory function. Ketamine normally maintains airway reflexes — alcohol reduces this protection. Vomiting while dissociated risks aspiration. Most common cause of ketamine-related hospital presentations.',
    warning: 'Risk of aspiration (choking on vomit while unable to protect airway).',
  },
  [key('alcohol','cathinones')]: {
    severity: 'HIGH',
    mechanism: 'Stimulant masks alcohol intoxication. Dehydration from both substances. Cardiovascular strain. Combined liver metabolism burden.',
    warning: null,
  },
  [key('alcohol','ghb')]: {
    severity: 'DANGEROUS',
    mechanism: 'GHB has an extremely narrow therapeutic window. Alcohol dramatically potentiates GHB — doses that would be recreational alone become potentially lethal in combination. Respiratory depression, loss of consciousness, coma. One of the most dangerous combinations on this list.',
    warning: 'GHB + alcohol has killed people at doses considered safe when taken separately.',
  },
  [key('alcohol','psychedelics')]: {
    severity: 'CAUTION',
    mechanism: 'Alcohol can increase anxiety and worsen psychedelic experiences. Generally reduces visual effects but increases nausea and disorientation. Not pharmacologically dangerous but experientially problematic.',
    warning: null,
  },
  [key('alcohol','opioids')]: {
    severity: 'DANGEROUS',
    mechanism: 'Additive CNS and respiratory depression. A leading cause of opioid-related overdose deaths. Even moderate amounts of alcohol substantially increase opioid respiratory depression risk.',
    warning: 'Leading cause of opioid overdose deaths.',
  },
  [key('alcohol','ssri')]: {
    severity: 'CAUTION',
    mechanism: 'Alcohol can worsen depression and anxiety that SSRIs treat. Some SSRIs increase alcohol intoxication. Generally manageable but regular heavy drinking undermines SSRI treatment.',
    warning: null,
  },
  [key('alcohol','maoi')]: {
    severity: 'SEVERE',
    mechanism: 'Many alcoholic beverages contain tyramine. MAOIs prevent tyramine breakdown — hypertensive crisis risk. Beer and wine particularly dangerous. Also additive CNS depression.',
    warning: 'Tyramine in alcohol can cause hypertensive crisis with MAOIs.',
  },
  [key('alcohol','benzo')]: {
    severity: 'SEVERE',
    mechanism: 'Both enhance GABA — additive CNS and respiratory depression. Combination is responsible for a significant proportion of overdose deaths. Even moderate amounts of each are dangerous together.',
    warning: 'Major cause of overdose deaths.',
  },
  [key('alcohol','tramadol')]: {
    severity: 'HIGH',
    mechanism: 'Tramadol has CNS depressant properties — combined with alcohol increases sedation, respiratory depression risk, and seizure risk.',
    warning: null,
  },
  [key('alcohol','adhd_stim')]: {
    severity: 'MODERATE',
    mechanism: 'Stimulant masks alcohol intoxication. May increase impulsive behaviour. Cardiovascular strain. Alcohol undermines the therapeutic benefit of ADHD medication.',
    warning: null,
  },

  // ── MDMA combinations ─────────────────────────────────────────────

  [key('mdma','cannabis')]: {
    severity: 'CAUTION',
    mechanism: 'Cannabis can intensify MDMA effects unpredictably. Often used to extend or modify the experience but can trigger severe anxiety and paranoia. Individual variation is large. Generally not pharmacologically dangerous but experientially risky.',
    warning: null,
  },
  [key('mdma','cocaine')]: {
    severity: 'SEVERE',
    mechanism: 'Extreme cardiovascular strain. Both elevate heart rate and blood pressure through different mechanisms — the combination is multiplicative rather than additive in cardiac load. Hyperthermia risk substantially increased.',
    warning: null,
  },
  [key('mdma','amphetamine')]: {
    severity: 'HIGH',
    mechanism: 'Combined serotonin and dopamine release. Cardiovascular strain additive. Comedown significantly worsened. Increases neurotoxicity risk compared to either alone.',
    warning: null,
  },
  [key('mdma','meth')]: {
    severity: 'SEVERE',
    mechanism: 'Methamphetamine combined with MDMA produces extreme monoamine release. Severe cardiovascular and hyperthermia risk. Substantially higher neurotoxicity than either alone. Prolonged cardiac strain.',
    warning: null,
  },
  [key('mdma','ketamine')]: {
    severity: 'HIGH',
    mechanism: 'Combined serotonergic and dissociative effects. Cardiovascular stimulation (MDMA) with CNS depression (ketamine). Disorientation and inability to assess own condition. Loss of situational awareness.',
    warning: null,
  },
  [key('mdma','cathinones')]: {
    severity: 'SEVERE',
    mechanism: 'Both release serotonin. Combined serotonergic load substantially increases serotonin syndrome risk. Cardiovascular strain is additive to multiplicative. Hyperthermia significantly increased.',
    warning: 'High serotonin syndrome risk.',
  },
  [key('mdma','ghb')]: {
    severity: 'HIGH',
    mechanism: 'Unpredictable interaction. MDMA stimulation can mask GHB sedation, leading to GHB overdose. GHB CNS depression combined with MDMA cardiovascular stimulation creates physiological conflict.',
    warning: 'MDMA can mask GHB overdose until it is too late.',
  },
  [key('mdma','psychedelics')]: {
    severity: 'CAUTION',
    mechanism: 'Combined effects are generally considered synergistic. Not pharmacologically dangerous for most people but can produce overwhelming experiences. Set and setting matter enormously.',
    warning: null,
  },
  [key('mdma','opioids')]: {
    severity: 'HIGH',
    mechanism: 'Both have serotonergic activity. Serotonin syndrome risk. MDMA cardiovascular stimulation combined with opioid respiratory depression is physiologically contradictory and risky.',
    warning: null,
  },
  [key('mdma','ssri')]: {
    severity: 'SEVERE',
    mechanism: 'SSRIs both reduce MDMA effects (competition at serotonin transporter) AND increase serotonin syndrome risk. The reduced effects lead people to take more MDMA, pushing into dangerous territory. A particularly dangerous combination because it makes safe dosing essentially impossible.',
    warning: 'SSRIs reduce MDMA effects causing dangerous redosing, while also raising serotonin syndrome risk.',
  },
  [key('mdma','maoi')]: {
    severity: 'LETHAL',
    mechanism: 'MDMA causes massive serotonin release. MAOIs prevent serotonin breakdown. The combination can cause fatal serotonin syndrome within minutes — hyperthermia, seizures, cardiovascular collapse. Absolutely never combine under any circumstances.',
    warning: 'Can be fatal within minutes.',
  },
  [key('mdma','benzo')]: {
    severity: 'LOW',
    mechanism: 'Benzodiazepines are sometimes used to manage MDMA-induced anxiety or comedown. Not pharmacologically dangerous but increases sedation. Risk of dependence on benzos as a comedown tool.',
    warning: null,
  },
  [key('mdma','lithium')]: {
    severity: 'SEVERE',
    mechanism: 'High risk of seizures. Lithium lowers seizure threshold — MDMA can trigger seizures in lithium-treated patients. Unpredictable interaction. Absolutely avoid.',
    warning: 'High seizure risk.',
  },
  [key('mdma','tramadol')]: {
    severity: 'HIGH',
    mechanism: 'Tramadol is a serotonin-norepinephrine reuptake inhibitor. Combined with MDMA creates significant serotonin syndrome risk. Tramadol also lowers seizure threshold.',
    warning: 'Serotonin syndrome risk.',
  },
  [key('mdma','adhd_stim')]: {
    severity: 'HIGH',
    mechanism: 'Combined monoamine release and cardiovascular strain. Both act on dopamine and norepinephrine systems. Significantly increased neurotoxicity and cardiac risk.',
    warning: null,
  },

  // ── Cannabis combinations ─────────────────────────────────────────

  [key('cannabis','cocaine')]: {
    severity: 'MODERATE',
    mechanism: 'Cannabis can mask cocaine-induced anxiety, leading to higher cocaine use. Additive cardiovascular effects (both increase heart rate). Combined impairment affects judgement.',
    warning: null,
  },
  [key('cannabis','amphetamine')]: {
    severity: 'MODERATE',
    mechanism: 'Increased anxiety and paranoia. Cannabis used to "take the edge off" can unpredictably amplify anxiety instead. Cardiovascular effects additive.',
    warning: null,
  },
  [key('cannabis','meth')]: {
    severity: 'MODERATE',
    mechanism: 'Same as amphetamine but more pronounced. Methamphetamine + cannabis combination significantly increases anxiety, paranoia, and cardiovascular strain.',
    warning: null,
  },
  [key('cannabis','ketamine')]: {
    severity: 'HIGH',
    mechanism: 'Cannabis dramatically intensifies ketamine dissociation. Many difficult ketamine experiences involve cannabis. Threshold for k-hole is substantially lowered. Very unpredictable.',
    warning: 'Cannabis significantly lowers the dose needed to enter a k-hole.',
  },
  [key('cannabis','cathinones')]: {
    severity: 'MODERATE',
    mechanism: 'Increased anxiety and paranoia. Cardiovascular effects additive. Cannabis can intensify stimulant-induced anxiety.',
    warning: null,
  },
  [key('cannabis','ghb')]: {
    severity: 'MODERATE',
    mechanism: 'Both are CNS depressants in their own way. Combined sedation. Cannabis can mask GHB sedation making dosing difficult.',
    warning: null,
  },
  [key('cannabis','psychedelics')]: {
    severity: 'MODERATE',
    mechanism: 'Cannabis strongly intensifies psychedelic effects. Many difficult psychedelic experiences are cannabis-triggered. Can cause overwhelming experiences, loss of control, paranoia at doses that seem manageable.',
    warning: 'Many bad psychedelic experiences are caused by adding cannabis.',
  },
  [key('cannabis','opioids')]: {
    severity: 'CAUTION',
    mechanism: 'Additive sedation. Cannabis may reduce opioid requirement (used clinically) but recreational combination increases sedation and impairment.',
    warning: null,
  },
  [key('cannabis','ssri')]: {
    severity: 'CAUTION',
    mechanism: 'Cannabis can worsen the underlying anxiety and depression that SSRIs treat. Generally not pharmacologically dangerous acutely but can undermine treatment.',
    warning: null,
  },
  [key('cannabis','maoi')]: {
    severity: 'CAUTION',
    mechanism: 'Limited interaction data. Cannabis has minor MAOI activity itself. Generally considered low risk pharmacologically but individual responses vary.',
    warning: null,
  },
  [key('cannabis','benzo')]: {
    severity: 'LOW',
    mechanism: 'Additive sedation. Not typically dangerous at recreational doses but combined CNS depression increases with dose.',
    warning: null,
  },
  [key('cannabis','lithium')]: {
    severity: 'MODERATE',
    mechanism: 'Cannabis can destabilise mood in lithium-treated patients. Risk of triggering manic or psychotic episodes in vulnerable individuals.',
    warning: null,
  },
  [key('cannabis','tramadol')]: {
    severity: 'CAUTION',
    mechanism: 'Additive sedation. Generally low pharmacological risk but reduces ability to assess own impairment.',
    warning: null,
  },
  [key('cannabis','adhd_stim')]: {
    severity: 'CAUTION',
    mechanism: 'Cannabis can counteract ADHD medication effects. Increased anxiety and cognitive impairment. May worsen ADHD symptoms.',
    warning: null,
  },

  // ── Cocaine combinations ──────────────────────────────────────────

  [key('cocaine','amphetamine')]: {
    severity: 'SEVERE',
    mechanism: 'Extreme cardiovascular strain. Both increase heart rate and blood pressure through different mechanisms. Very high risk of cardiac arrhythmia, hypertensive crisis, and stroke.',
    warning: null,
  },
  [key('cocaine','meth')]: {
    severity: 'SEVERE',
    mechanism: 'Extreme combined stimulant load. Cardiovascular emergency risk. Both cause massive dopamine and norepinephrine release through different pathways.',
    warning: null,
  },
  [key('cocaine','ketamine')]: {
    severity: 'MODERATE',
    mechanism: 'Opposing CNS effects — cocaine stimulates, ketamine dissociates. Combined cardiovascular strain. Stimulant can mask how dissociated you are, leading to additional dosing.',
    warning: null,
  },
  [key('cocaine','cathinones')]: {
    severity: 'SEVERE',
    mechanism: 'Combined stimulant cardiovascular load. Both increase heart rate and blood pressure. Hyperthermia risk substantially increased.',
    warning: null,
  },
  [key('cocaine','ghb')]: {
    severity: 'HIGH',
    mechanism: 'Stimulant can mask GHB sedation — dangerous redosing of GHB is likely. GHB has a very narrow window. Combined physiological stress is significant.',
    warning: 'Cocaine can mask GHB overdose.',
  },
  [key('cocaine','psychedelics')]: {
    severity: 'MODERATE',
    mechanism: 'Cardiovascular strain. Cocaine can increase anxiety and paranoia during psychedelic experiences. Unpredictable psychological effects.',
    warning: null,
  },
  [key('cocaine','opioids')]: {
    severity: 'DANGEROUS',
    mechanism: '"Speedball" combination. Stimulant masks opioid sedation leading to opioid overdose. When cocaine wears off, opioid effect dominates — respiratory depression. Responsible for many overdose deaths including high-profile cases.',
    warning: 'The "speedball" combination has killed many people.',
  },
  [key('cocaine','ssri')]: {
    severity: 'CAUTION',
    mechanism: 'SSRIs may reduce cocaine euphoria. Some interaction with serotonin system. Cardiovascular effects of cocaine are not significantly modified. Generally lower risk than other combinations.',
    warning: null,
  },
  [key('cocaine','maoi')]: {
    severity: 'SEVERE',
    mechanism: 'MAOIs prevent breakdown of monoamines released by cocaine. Hypertensive crisis risk. Serotonin syndrome risk. Cardiovascular emergency.',
    warning: null,
  },
  [key('cocaine','benzo')]: {
    severity: 'MODERATE',
    mechanism: 'Benzodiazepines sometimes used to manage cocaine-induced anxiety. Not highly dangerous but CNS depression combined with cardiovascular stimulation creates physiological conflict.',
    warning: null,
  },
  [key('cocaine','lithium')]: {
    severity: 'MODERATE',
    mechanism: 'Cocaine can destabilise lithium-treated patients, triggering manic episodes. Lithium does not significantly alter cocaine PK but the interaction worsens psychiatric outcomes.',
    warning: null,
  },
  [key('cocaine','tramadol')]: {
    severity: 'MODERATE',
    mechanism: 'Tramadol serotonergic activity combined with cocaine serotonin effects. Cardiovascular strain. Seizure risk from tramadol is increased.',
    warning: null,
  },
  [key('cocaine','adhd_stim')]: {
    severity: 'SEVERE',
    mechanism: 'Combined stimulant cardiovascular load. Both act on dopamine reuptake. Extremely high heart rate and blood pressure. Cardiac risk substantially elevated.',
    warning: null,
  },

  // ── Amphetamine / Meth combinations ──────────────────────────────

  [key('amphetamine','meth')]: {
    severity: 'SEVERE',
    mechanism: 'Extreme combined stimulant load. Cardiovascular strain is severely additive. No meaningful reason to combine these. Very high cardiac and neurotoxicity risk.',
    warning: null,
  },
  [key('amphetamine','ketamine')]: {
    severity: 'MODERATE',
    mechanism: 'Stimulant cardiovascular effects combined with dissociation. Amphetamine can mask ketamine sedation leading to additional dosing. Increased disorientation.',
    warning: null,
  },
  [key('amphetamine','cathinones')]: {
    severity: 'SEVERE',
    mechanism: 'Combined stimulant load. Both release dopamine and norepinephrine. Cardiovascular strain is additive to multiplicative. Hyperthermia risk high.',
    warning: null,
  },
  [key('amphetamine','ghb')]: {
    severity: 'HIGH',
    mechanism: 'Stimulant can mask GHB sedation leading to dangerous redosing. When stimulant wears off, GHB sedation dominates suddenly.',
    warning: 'Stimulant can mask GHB overdose.',
  },
  [key('amphetamine','psychedelics')]: {
    severity: 'MODERATE',
    mechanism: 'Amphetamine can intensify psychedelic effects and increase anxiety. Cardiovascular strain. Extended duration of experience. Individual responses vary widely.',
    warning: null,
  },
  [key('amphetamine','opioids')]: {
    severity: 'HIGH',
    mechanism: 'Stimulant masks opioid sedation leading to overdose when stimulant wears off. Cardiovascular strain from both directions.',
    warning: 'Stimulant masking opioid sedation leads to overdose.',
  },
  [key('amphetamine','ssri')]: {
    severity: 'MODERATE',
    mechanism: 'Combined serotonergic activity. Serotonin syndrome risk at higher doses. SSRIs may reduce amphetamine efficacy but interaction is complex and individual.',
    warning: null,
  },
  [key('amphetamine','maoi')]: {
    severity: 'LETHAL',
    mechanism: 'MAOIs prevent breakdown of monoamines massively released by amphetamines. Fatal hypertensive crisis and serotonin syndrome. Absolutely never combine.',
    warning: 'Can be immediately fatal.',
  },
  [key('amphetamine','benzo')]: {
    severity: 'CAUTION',
    mechanism: 'Benzodiazepines used to manage stimulant-induced anxiety or to sleep. Not highly dangerous pharmacologically but risk of dependence on both. Physiological conflict.',
    warning: null,
  },
  [key('amphetamine','lithium')]: {
    severity: 'SEVERE',
    mechanism: 'Amphetamines can trigger manic episodes in lithium-treated patients. Lithium may reduce stimulant effects leading to dose escalation. Unpredictable and potentially serious.',
    warning: null,
  },
  [key('amphetamine','tramadol')]: {
    severity: 'HIGH',
    mechanism: 'Combined serotonergic activity — serotonin syndrome risk. Tramadol seizure risk is increased. Cardiovascular strain.',
    warning: 'Serotonin syndrome risk.',
  },
  [key('amphetamine','adhd_stim')]: {
    severity: 'HIGH',
    mechanism: 'Combined stimulant load on the same neurotransmitter systems. Cardiovascular strain. These work via similar mechanisms — combining them is essentially taking a double dose with additive risks.',
    warning: null,
  },
  [key('meth','ketamine')]: {
    severity: 'MODERATE',
    mechanism: 'Same as amphetamine+ketamine but more pronounced due to higher potency of methamphetamine. Greater cardiovascular strain and disorientation.',
    warning: null,
  },
  [key('meth','cathinones')]: {
    severity: 'SEVERE',
    mechanism: 'Extreme combined stimulant load. Very high cardiovascular and neurotoxicity risk.',
    warning: null,
  },
  [key('meth','ghb')]: {
    severity: 'HIGH',
    mechanism: 'Stimulant masks GHB sedation. When meth wears off, GHB effect dominates suddenly. Risk of respiratory depression.',
    warning: null,
  },
  [key('meth','psychedelics')]: {
    severity: 'MODERATE',
    mechanism: 'Methamphetamine intensifies psychedelics more than amphetamine. High anxiety and paranoia risk. Extended cardiovascular strain.',
    warning: null,
  },
  [key('meth','opioids')]: {
    severity: 'HIGH',
    mechanism: 'Stimulant masks opioid sedation. Overdose risk when stimulant wears off.',
    warning: null,
  },
  [key('meth','ssri')]: {
    severity: 'MODERATE',
    mechanism: 'Combined serotonergic activity. SSRIs may reduce meth effects. Serotonin syndrome risk at higher doses.',
    warning: null,
  },
  [key('meth','maoi')]: {
    severity: 'LETHAL',
    mechanism: 'Fatal hypertensive crisis and serotonin syndrome. Absolutely never combine.',
    warning: 'Can be immediately fatal.',
  },
  [key('meth','benzo')]: {
    severity: 'CAUTION',
    mechanism: 'Benzodiazepines used to manage methamphetamine comedown. Risk of dependence on both. Physiological conflict between stimulation and sedation.',
    warning: null,
  },
  [key('meth','lithium')]: {
    severity: 'SEVERE',
    mechanism: 'Can trigger severe manic episodes. Lithium may reduce meth effects leading to dangerous dose escalation.',
    warning: null,
  },
  [key('meth','tramadol')]: {
    severity: 'HIGH',
    mechanism: 'Serotonin syndrome risk. Seizure risk increased. Cardiovascular strain.',
    warning: null,
  },
  [key('meth','adhd_stim')]: {
    severity: 'HIGH',
    mechanism: 'Combined stimulant load. Both act on dopamine/norepinephrine reuptake transporters.',
    warning: null,
  },

  // ── Ketamine combinations ─────────────────────────────────────────

  [key('ketamine','cathinones')]: {
    severity: 'HIGH',
    mechanism: 'CNS depression (ketamine) combined with stimulant cardiovascular effects (cathinones). Disorientation and inability to assess own condition. Given unreliable cathinone market content, additional uncertainty about what is actually interacting.',
    warning: null,
  },
  [key('ketamine','ghb')]: {
    severity: 'DANGEROUS',
    mechanism: 'Both depress CNS. Combined sedation is severe. Respiratory depression risk is high. GHB has a narrow window — ketamine further narrows it. Loss of consciousness and aspiration risk.',
    warning: 'High risk of respiratory depression and loss of protective reflexes.',
  },
  [key('ketamine','psychedelics')]: {
    severity: 'MODERATE',
    mechanism: 'Both dissociative and classical psychedelic effects combine. Can produce overwhelming experiences. Not typically dangerous pharmacologically but complete loss of ego and orientation is likely.',
    warning: null,
  },
  [key('ketamine','opioids')]: {
    severity: 'SEVERE',
    mechanism: 'Additive CNS and respiratory depression. Ketamine is used clinically as an opioid-sparing agent precisely because it works differently — recreational combination stacks these risks. Respiratory monitoring would be required clinically.',
    warning: null,
  },
  [key('ketamine','ssri')]: {
    severity: 'CAUTION',
    mechanism: 'Low interaction risk pharmacologically. SSRIs do not significantly alter ketamine PK. Some concern about combined serotonergic effects but generally considered lower risk. Ketamine is actually studied as an antidepressant in SSRI-resistant patients.',
    warning: null,
  },
  [key('ketamine','maoi')]: {
    severity: 'HIGH',
    mechanism: 'MAOIs inhibit CYP enzymes involved in ketamine metabolism, increasing plasma levels unpredictably. Some serotonergic interaction. Avoid combination.',
    warning: null,
  },
  [key('ketamine','benzo')]: {
    severity: 'HIGH',
    mechanism: 'Both depress CNS. Combined sedation and respiratory depression. Benzodiazepines are sometimes used clinically to manage difficult ketamine experiences but under medical supervision only.',
    warning: null,
  },
  [key('ketamine','lithium')]: {
    severity: 'MODERATE',
    mechanism: 'Lithium may increase ketamine-related psychotomimetic effects. Some interaction with glutamate system. Generally avoid in lithium-treated patients.',
    warning: null,
  },
  [key('ketamine','tramadol')]: {
    severity: 'MODERATE',
    mechanism: 'Both have serotonergic activity. Serotonin syndrome risk at higher doses. Tramadol lowers seizure threshold — ketamine has proconvulsant properties at high doses.',
    warning: null,
  },
  [key('ketamine','adhd_stim')]: {
    severity: 'MODERATE',
    mechanism: 'Stimulant cardiovascular effects combined with ketamine dissociation. Stimulant can mask how dissociated you are. Cardiovascular strain.',
    warning: null,
  },

  // ── GHB combinations ──────────────────────────────────────────────

  [key('ghb','psychedelics')]: {
    severity: 'HIGH',
    mechanism: 'GHB has a very narrow window. Psychedelics impair judgement making GHB dosing even more dangerous. GHB sedation can onset suddenly during a psychedelic experience.',
    warning: 'GHB narrow window makes dosing dangerous under any psychedelic.',
  },
  [key('ghb','opioids')]: {
    severity: 'DANGEROUS',
    mechanism: 'Both cause CNS and respiratory depression. Additive effect dramatically increases overdose risk. GHB + opioids is an extremely dangerous combination.',
    warning: 'Respiratory depression risk is very high.',
  },
  [key('ghb','ssri')]: {
    severity: 'CAUTION',
    mechanism: 'Some serotonergic interaction. GHB effects may be slightly enhanced. Generally not highly dangerous pharmacologically but GHB safety window is already narrow.',
    warning: null,
  },
  [key('ghb','maoi')]: {
    severity: 'HIGH',
    mechanism: 'MAOIs may increase GHB effects unpredictably. Combined CNS depression. Avoid.',
    warning: null,
  },
  [key('ghb','benzo')]: {
    severity: 'DANGEROUS',
    mechanism: 'Both enhance GABA. Dramatically additive CNS and respiratory depression. This combination has killed people at doses considered safe separately.',
    warning: 'Has caused deaths at individually recreational doses.',
  },
  [key('ghb','lithium')]: {
    severity: 'CAUTION',
    mechanism: 'Limited interaction data. GHB effects on lithium levels are not well studied. Use with caution.',
    warning: null,
  },
  [key('ghb','tramadol')]: {
    severity: 'HIGH',
    mechanism: 'Additive CNS depression. Tramadol + GHB increases sedation and respiratory depression risk substantially.',
    warning: null,
  },
  [key('ghb','adhd_stim')]: {
    severity: 'HIGH',
    mechanism: 'Stimulant can mask GHB sedation leading to dangerous redosing of GHB. When stimulant wears off, GHB effect dominates.',
    warning: 'Stimulant masking leads to GHB overdose.',
  },
  [key('ghb','cathinones')]: {
    severity: 'HIGH',
    mechanism: 'Cathinone stimulant effect masks GHB sedation. Dangerous GHB redosing risk. When cathinone wears off, GHB dominates suddenly.',
    warning: null,
  },

  // ── Psychedelic combinations ──────────────────────────────────────

  [key('psychedelics','opioids')]: {
    severity: 'MODERATE',
    mechanism: 'Opioids may reduce psychedelic intensity. Generally not highly dangerous pharmacologically but combined sedation and impaired judgement. Respiratory depression possible at high opioid doses.',
    warning: null,
  },
  [key('psychedelics','ssri')]: {
    severity: 'CAUTION',
    mechanism: 'SSRIs significantly reduce psychedelic effects — chronic SSRI use causes receptor downregulation. Not dangerous but frustrates intended effect, potentially leading to higher psychedelic doses.',
    warning: null,
  },
  [key('psychedelics','maoi')]: {
    severity: 'HIGH',
    mechanism: 'MAOIs dramatically potentiate psychedelics (especially psilocybin). Used intentionally in some traditional practices but extremely unpredictable recreationally. Overwhelming experiences at normal doses.',
    warning: 'MAOIs dramatically intensify psychedelic effects — normal doses become very high doses.',
  },
  [key('psychedelics','benzo')]: {
    severity: 'LOW',
    mechanism: 'Benzodiazepines reduce psychedelic effects — used as a "trip killer." Not pharmacologically dangerous but may not fully abort a difficult experience.',
    warning: null,
  },
  [key('psychedelics','lithium')]: {
    severity: 'SEVERE',
    mechanism: 'High seizure risk. Multiple case reports of seizures and cardiac arrhythmias from psychedelics in lithium-treated patients. Absolutely avoid.',
    warning: 'Multiple case reports of seizures.',
  },
  [key('psychedelics','tramadol')]: {
    severity: 'MODERATE',
    mechanism: 'Tramadol lowers seizure threshold. Psychedelics may increase this risk further. Serotonergic interaction.',
    warning: null,
  },
  [key('psychedelics','adhd_stim')]: {
    severity: 'MODERATE',
    mechanism: 'Stimulant can intensify psychedelic effects and increase anxiety. Extended cardiovascular strain. Individual responses vary widely.',
    warning: null,
  },
  [key('psychedelics','cathinones')]: {
    severity: 'MODERATE',
    mechanism: 'Combined stimulant and psychedelic effects. Increased anxiety and cardiovascular strain. Unpredictable psychological effects.',
    warning: null,
  },

  // ── Opioid combinations ───────────────────────────────────────────

  [key('opioids','ssri')]: {
    severity: 'MODERATE',
    mechanism: 'Some SSRIs inhibit opioid metabolism (tramadol in particular — see tramadol+ssri). Serotonergic interaction with tramadol-class opioids. Generally lower risk with pure opioids.',
    warning: null,
  },
  [key('opioids','maoi')]: {
    severity: 'LETHAL',
    mechanism: 'Fatal serotonin syndrome with some opioids (tramadol, pethidine, dextromethorphan). Respiratory depression potentiated. Specific combinations have killed patients in clinical settings. Absolutely never combine.',
    warning: 'Has killed patients in clinical settings.',
  },
  [key('opioids','benzo')]: {
    severity: 'DANGEROUS',
    mechanism: 'FDA black box warning combination. Additive CNS and respiratory depression. Major cause of overdose deaths. Even prescribed together at normal doses, monitoring is required.',
    warning: 'FDA black box warning. Major cause of overdose deaths.',
  },
  [key('opioids','lithium')]: {
    severity: 'CAUTION',
    mechanism: 'Some opioids may affect lithium levels. Generally low pharmacological risk but monitor lithium levels.',
    warning: null,
  },
  [key('opioids','tramadol')]: {
    severity: 'HIGH',
    mechanism: 'Tramadol is itself an opioid. Combined with other opioids — additive respiratory depression. Seizure risk substantially increased. Tramadol+opioid has a worse safety profile than either alone.',
    warning: null,
  },
  [key('opioids','adhd_stim')]: {
    severity: 'HIGH',
    mechanism: 'Stimulant masks opioid sedation. Respiratory depression risk when stimulant wears off. "Speedball"-type dynamic.',
    warning: null,
  },
  [key('opioids','cathinones')]: {
    severity: 'HIGH',
    mechanism: 'Cathinone stimulant masks opioid sedation. Overdose risk when cathinone wears off and opioid effect dominates.',
    warning: null,
  },

  // ── Prescription-prescription combinations ────────────────────────

  [key('ssri','maoi')]: {
    severity: 'LETHAL',
    mechanism: 'Serotonin syndrome. This is a well-documented, potentially fatal drug interaction in clinical medicine. MAOIs and SSRIs must never be combined and a washout period of weeks is required when switching. If you are on one and being prescribed the other, your doctor should know.',
    warning: 'Requires weeks of washout between switching. Well-documented cause of death.',
  },
  [key('ssri','benzo')]: {
    severity: 'CAUTION',
    mechanism: 'Sometimes prescribed together. Combined CNS sedation. Generally manageable but alcohol makes this combination more risky.',
    warning: null,
  },
  [key('ssri','lithium')]: {
    severity: 'CAUTION',
    mechanism: 'Sometimes prescribed together for treatment-resistant depression. Serotonin syndrome risk at higher doses. Requires monitoring.',
    warning: null,
  },
  [key('ssri','tramadol')]: {
    severity: 'HIGH',
    mechanism: 'Both inhibit serotonin reuptake. Serotonin syndrome risk is clinically significant — there are case reports of serotonin syndrome from this prescribed combination. Should only be combined under medical supervision.',
    warning: 'Clinical case reports of serotonin syndrome from this combination.',
  },
  [key('ssri','adhd_stim')]: {
    severity: 'LOW',
    mechanism: 'Sometimes prescribed together. Generally well-tolerated. Minor serotonergic interaction. Monitor for any serotonin syndrome symptoms.',
    warning: null,
  },
  [key('maoi','benzo')]: {
    severity: 'MODERATE',
    mechanism: 'MAOIs potentiate benzodiazepine effects. Increased sedation. Generally avoidable combination — consult prescriber.',
    warning: null,
  },
  [key('maoi','lithium')]: {
    severity: 'MODERATE',
    mechanism: 'Some interaction. Generally avoided in clinical practice. Consult prescriber.',
    warning: null,
  },
  [key('maoi','tramadol')]: {
    severity: 'LETHAL',
    mechanism: 'Tramadol is a serotonin-norepinephrine reuptake inhibitor. Combined with MAOIs — fatal serotonin syndrome. This combination has killed patients in clinical settings. Absolute contraindication.',
    warning: 'Absolute clinical contraindication. Has caused deaths.',
  },
  [key('maoi','adhd_stim')]: {
    severity: 'LETHAL',
    mechanism: 'ADHD stimulants cause massive monoamine release. MAOIs prevent their breakdown. Fatal hypertensive crisis and serotonin syndrome. Absolute contraindication.',
    warning: 'Absolute clinical contraindication.',
  },
  [key('benzo','lithium')]: {
    severity: 'CAUTION',
    mechanism: 'Sometimes prescribed together. Generally manageable. Some benzodiazepines may affect lithium levels.',
    warning: null,
  },
  [key('benzo','tramadol')]: {
    severity: 'HIGH',
    mechanism: 'Combined CNS depression. Seizure risk from tramadol — benzodiazepines can help or mask it. Respiratory depression risk.',
    warning: null,
  },
  [key('benzo','adhd_stim')]: {
    severity: 'CAUTION',
    mechanism: 'Physiologically opposing — stimulant and depressant. Sometimes prescribed together. Cardiovascular and CNS physiological conflict.',
    warning: null,
  },
  [key('lithium','tramadol')]: {
    severity: 'MODERATE',
    mechanism: 'Tramadol may affect lithium levels. Seizure risk from both. Monitor lithium levels if prescribed together.',
    warning: null,
  },
  [key('lithium','adhd_stim')]: {
    severity: 'MODERATE',
    mechanism: 'Stimulants can destabilise lithium-treated patients. May trigger manic episodes. Discuss with prescriber.',
    warning: null,
  },
  [key('tramadol','adhd_stim')]: {
    severity: 'HIGH',
    mechanism: 'Combined serotonergic and stimulant effects. Serotonin syndrome risk. Tramadol seizure threshold reduced further by stimulants.',
    warning: null,
  },
}

// Helper to get interaction between any two substances
export function getInteraction(a, b) {
  if (a === b) return null
  const k = key(a, b)
  return INTERACTIONS[k] ?? {
    severity: 'UNKNOWN',
    mechanism: 'No specific interaction data available for this combination. This does not mean it is safe — it means it has not been studied or documented. Treat as potentially risky.',
    warning: null,
  }
}

// Get all interactions for a list of substances
export function getInteractionMatrix(substanceIds) {
  const results = []
  for (let i = 0; i < substanceIds.length; i++) {
    for (let j = i + 1; j < substanceIds.length; j++) {
      const interaction = getInteraction(substanceIds[i], substanceIds[j])
      if (interaction) {
        results.push({
          a: substanceIds[i],
          b: substanceIds[j],
          ...interaction,
        })
      }
    }
  }
  // Sort by severity (most dangerous first)
  const severityOrder = ['LETHAL','DANGEROUS','SEVERE','HIGH','MODERATE','LOW','CAUTION','SAFE','SEROTONIN','UNKNOWN']
  return results.sort((x, y) => severityOrder.indexOf(x.severity) - severityOrder.indexOf(y.severity))
}