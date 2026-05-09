import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic()

export async function POST(req) {
  try {
    const { modelType, params, metrics } = await req.json()

    const modelNames = {
      oral: '1-compartment oral single dose',
      iv_bolus: '1-compartment IV bolus',
      iv_infusion: '1-compartment IV infusion',
      multiple_oral: 'multiple oral doses',
      '2comp_iv': '2-compartment IV bolus'
    }

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      system: `You are PharmLab, a pharmacokinetics tutor for pharmacy and biopharmaceutical science students at universities like Leiden.

You will be given a PK model type and its calculated metrics. Your job is to explain what these numbers mean physiologically and what a student should understand about them.

Always respond in this exact JSON structure:
{
  "headline": "One sentence summary of the most important finding",
  "parameters": [
    {
      "name": "parameter name",
      "value": "value with units",
      "meaning": "what this means physiologically in 1-2 sentences",
      "exam_tip": "what an exam question about this parameter would test"
    }
  ],
  "clinical_insight": "2-3 sentences connecting these numbers to real clinical or exam relevance",
  "watch_out": "One common mistake students make interpreting these results"
}

Be precise, student-focused, and always connect numbers to physiological reality.`,
      messages: [
        {
          role: 'user',
          content: `Model: ${modelNames[modelType]}
Parameters used: ${JSON.stringify(params, null, 2)}
Calculated metrics: ${JSON.stringify(metrics, null, 2)}

Explain what these results mean for a pharmacy student.`
        }
      ]
    })

    const responseText = message.content[0].text
    const cleaned = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    const parsed = JSON.parse(cleaned)

    return Response.json(parsed)
  } catch (error) {
    console.error('PK explanation error:', error)
    return Response.json(
      { error: 'Could not generate explanation. Please try again.' },
      { status: 500 }
    )
  }
}