import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic()

export async function POST(req) {
  try {
    const { exerciseText } = await req.json()

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: `You are a pharmacokinetics expert helping students extract parameters from PK/PD text exercises.

Read the exercise text carefully and extract all numerical parameters and identify the correct PK model.

Respond in this exact JSON structure — no other text:
{
  "model_type": "oral|iv_bolus|iv_infusion|multiple_oral|2comp_iv",
  "model_reasoning": "Why you chose this model in one sentence",
  "params": {
    "D": null,
    "F": null,
    "Vd": null,
    "CL": null,
    "ka": null,
    "ke": null,
    "Tinf": null,
    "tau": null,
    "Vc": null,
    "k12": null,
    "k21": null,
    "k10": null
  },
  "units_used": "Brief note on units found in the exercise",
  "missing_params": ["list any parameters needed for the model that were not found in the text"],
  "what_is_asked": "What the exercise is asking the student to calculate or determine"
}

Rules:
- Only include params actually stated in the exercise — leave others as null
- If ke is not given but CL and Vd are, leave ke as null (it will be calculated)
- Convert all units to: mg for dose, L for volume, h for time, L/h for clearance
- If F is not mentioned and route is IV, set F to 1`,
      messages: [
        {
          role: 'user',
          content: `Extract PK parameters from this exercise:\n\n${exerciseText}`
        }
      ]
    })

    const responseText = message.content[0].text
    const cleaned = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()

    // Extract just the JSON object in case Claude adds any text around it
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('No valid JSON found in response')
    const parsed = JSON.parse(jsonMatch[0])

    return Response.json(parsed)
  } catch (error) {
    console.error('Exercise interpretation error:', error)
    return Response.json(
      { error: 'Could not interpret exercise. Please try again.' },
      { status: 500 }
    )
  }
}