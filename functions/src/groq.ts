// Thin wrapper for Groq's OpenAI-compatible Chat Completions API.
// Used by generatePlan (text plans) and detectEquipment (vision).

type TextContent = { type: 'text'; text: string }
type ImageContent = { type: 'image_url'; image_url: { url: string } }
export type Content = TextContent | ImageContent

export interface Message {
  role: 'system' | 'user' | 'assistant'
  content: string | Content[]
}

export interface GroqArgs {
  apiKey: string
  model: string
  messages: Message[]
  max_tokens?: number
  temperature?: number
  json_object?: boolean
}

export async function callGroq(args: GroqArgs): Promise<string> {
  const body: Record<string, unknown> = {
    model: args.model,
    max_tokens: args.max_tokens ?? 2048,
    temperature: args.temperature ?? 0.4,
    messages: args.messages,
  }
  if (args.json_object) {
    body.response_format = { type: 'json_object' }
  }

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${args.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Groq ${res.status}: ${text.slice(0, 500)}`)
  }
  const data = (await res.json()) as {
    choices: Array<{ message: { content: string } }>
  }
  return data.choices[0]?.message?.content ?? ''
}
