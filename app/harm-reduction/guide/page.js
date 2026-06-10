export default function HarmReductionGuide() {
  return (
    <main style={{ maxWidth: '720px', margin: '0 auto', padding: '2rem 1rem', fontFamily: 'sans-serif' }}>
      <a href="/harm-reduction" style={{ fontSize: '13px', color: '#6b7280', textDecoration: 'none' }}>← Harm reduction</a>
      <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#111827', margin: '1rem 0 4px' }}>How to read the graphs</h1>
      <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '2rem', lineHeight: '1.6' }}>
        The calculators on this site show pharmacokinetic curves — plasma drug concentrations over time. These are not the same as "how high you feel." Here is what they actually mean and why that difference matters.
      </p>

      {[
        {
          title: 'What is plasma concentration?',
          emoji: '🩸',
          content: `When you take a drug, it enters your bloodstream. Plasma concentration (measured in ng/mL — nanograms per millilitre) tells you how much drug is circulating in your blood at any given time. The curve on the graph shows this rising during absorption and falling during elimination.

This is a real, measurable number — not a feeling. Blood tests for drug driving use exactly these concentrations.`,
        },
        {
          title: 'Why the curve doesn\'t equal how you feel',
          emoji: '🧠',
          content: `The most important thing to understand: there is a delay between when drug enters your blood and when it reaches your brain. This is called the effect-site delay or ke0 lag.

For most drugs this is 15–60 minutes. You might feel effects intensifying while plasma concentration is already dropping. You might feel effects fading while significant drug is still in your system.

This is why the graph shows pharmacokinetics (what the body does to the drug) — not pharmacodynamics (what the drug does to you). The two are related but not identical.`,
        },
        {
          title: 'The redosing trap',
          emoji: '🔄',
          color: '#fef2f2',
          border: '#fecaca',
          content: `The most dangerous misreading of a drug experience is: "I don't feel it anymore, so it must be gone."

Look at any curve on the calculators — particularly for drugs with long half-lives like MDMA (t½ ~8.5h) or amphetamines (t½ ~11h). Subjective effects often wear off well before plasma concentration returns to baseline. The drug is still in your system — it has just saturated or downregulated the receptors it acts on.

Redosing at this point doesn't give you the same experience again. It adds to the drug still present, pushing plasma concentration higher — into zones associated with toxicity rather than recreation. This is the pharmacological explanation for why "one more" at 4am feels different and more dangerous than the first dose.`,
        },
        {
          title: 'What the coloured zones mean',
          emoji: '🎨',
          content: `The background colours on each graph represent effect or risk zones based on published data correlating plasma concentrations with observed effects.

These are population averages. They come from studies of people who had blood drawn while under the influence and reported or showed certain effects at certain concentrations.

Your individual experience may differ significantly based on:
- Tolerance — regular users have the same plasma concentration as occasional users but feel less
- Body composition — drugs distribute into fat tissue differently in different people
- Genetics — enzyme variants (like CYP2D6 for MDMA) change how fast you metabolise
- Set and setting — psychological context changes drug effects at identical concentrations
- Other substances — interactions shift both PK and PD

The zones are a guide, not a prediction.`,
        },
        {
          title: 'Multiple doses and accumulation',
          emoji: '📈',
          content: `When you take a second dose before the first is fully eliminated, the new dose adds on top of what remains. This is superposition — and it is why the calculators let you add multiple doses at different times.

Try it: add a second dose on any calculator 2 hours after the first. Notice that the second peak is higher than the first, even at the same dose. This is drug accumulation — and it is why experienced users taking the same dose they always take can still overdose after multiple doses.

The graph makes this visible. The feeling in your head does not.`,
        },
        {
          title: 'The long tail — still there, still affecting you',
          emoji: '⏳',
          content: `Most recreational drugs have half-lives of 1–12 hours. Half-life means: after one half-life, half the drug remains. After two half-lives, a quarter remains. After five half-lives, about 3% remains.

For amphetamines (t½ ~11h), 50% of your Saturday night dose is still present at 11am Sunday. 25% at 10pm Sunday. For MDMA (t½ ~8.5h), significant concentration is present the next morning.

This affects:
- Sleep quality (impossible to sleep properly while stimulated)
- Cognitive function next day (concentration, memory, reaction time)
- Driving — you may be over the legal limit hours after you feel sober
- Mental health — drugs acting on serotonin/dopamine at low concentrations for extended periods affect mood in the days that follow`,
        },
        {
          title: 'Why "I\'ve done this loads of times" isn\'t safety data',
          emoji: '📊',
          content: `Tolerance means you need more to get the same effect. It does not mean the drug is less harmful. For most drugs, tolerance to subjective effects develops faster than tolerance to cardiovascular effects, neurotoxicity, and organ stress.

This is why experienced users can be at greater risk than beginners for some harms — they take higher doses because effects feel diminished, but the dose-dependent risks (cardiac strain, neurotoxicity, hyperthermia) scale with dose regardless of how experienced you are.

The graph shows dose and time. It does not adjust for experience.`,
        },
        {
          title: 'Uncertainty in these models',
          emoji: '📏',
          content: `All the curves on this site are based on population-average pharmacokinetic parameters from published studies. These studies vary in quality, sample size, and methodology.

For established drugs like alcohol and MDMA, the data is fairly robust. For newer cathinones (3-MMC, 2-MMC, NEP), human data is almost nonexistent.

The models are educational tools to illustrate concepts — not precise predictors of your individual experience. Use them to understand pharmacokinetic principles, not to calculate safe doses.`,
        },
      ].map((section, i) => (
        <div key={i} style={{
          marginBottom: '1.5rem',
          background: section.color ?? 'white',
          border: `1px solid ${section.border ?? '#e5e7eb'}`,
          borderRadius: '12px',
          padding: '1.25rem',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
            <span style={{ fontSize: '24px' }}>{section.emoji}</span>
            <h2 style={{ fontSize: '16px', fontWeight: '600', color: '#111827', margin: 0 }}>{section.title}</h2>
          </div>
          {section.content.split('\n\n').map((para, j) => (
            <p key={j} style={{ fontSize: '13px', color: '#374151', margin: '0 0 10px', lineHeight: '1.7', whiteSpace: 'pre-line' }}>
              {para}
            </p>
          ))}
        </div>
      ))}

      <div style={{ padding: '1rem 1.25rem', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '12px', fontSize: '12px', color: '#6b7280', lineHeight: '1.6' }}>
        Questions about a specific graph or concept? The PK/PD exercise helper on the academic tools side of PharmLab can answer questions about pharmacokinetic principles in detail.
      </div>
    </main>
  )
}