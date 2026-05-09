import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic()

export async function POST(req) {
  try {
    const { drugs } = await req.json()

    if (!drugs || drugs.length < 2) {
      return Response.json(
        { error: 'Please enter at least 2 drugs' },
        { status: 400 }
      )
    }

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      system: `You are PharmLab, a drug interaction assistant built specifically for pharmacy and biopharmaceutical science students. 

Your job is to analyse drug interactions in a way that helps students understand and remember them for exams — not just look them up.

Always respond with a valid JSON object in exactly this structure:
{
  "pairs": [
    {
      "drug_a": "Drug name",
      "drug_b": "Drug name", 
      "severity": "major|moderate|minor|none",
      "mechanism": "Clear explanation of the pharmacological mechanism",
      "enzyme": "CYP3A4 or other enzyme if relevant, null if not",
      "clinical_note": "What this means in practice — symptoms, monitoring, alternatives",
      "memory_hook": "A memorable way to remember this interaction",
      "exam_angle": "What an exam question about this would likely test"
    }
  ],
  "summary": "One sentence overview of the most important finding"
}

Be precise and student-focused. Always include the exam angle — this is what makes PharmLab different from other tools.`,
      messages: [
        {
          role: 'user',
          content: `Check all interactions between these drugs: ${drugs.join(', ')}`
        }
      ]
    })

    const responseText = message.content[0].text
    const cleaned = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    const parsed = JSON.parse(cleaned)

    return Response.json(parsed)
  } catch (error) {
    console.error('Interaction check error:', error)
    return Response.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }
}