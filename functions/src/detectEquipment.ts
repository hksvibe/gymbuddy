import { onCall, HttpsError } from 'firebase-functions/v2/https'
import { defineSecret } from 'firebase-functions/params'
import { logger } from 'firebase-functions'
import { callGroq, type Content } from './groq.js'

const groqKey = defineSecret('GROQ_API_KEY')

// Verbatim from REQ 1 of the spec.
const DETECT_PROMPT =
  'List all distinct gym equipment visible in this image as a JSON array of standard equipment names ' +
  '(dumbbells, barbell, bench, lat pulldown, leg press, treadmill, cable machine, kettlebell, ' +
  'resistance bands, chest press machine, pull up bar, etc.). Only list what you can actually see. ' +
  'Respond with ONLY a JSON array of strings, no prose.'

interface DetectInput { imageUrls: string[] }
interface DetectOutput { equipment: string[] }

function parseStringArray(raw: string): string[] {
  let cleaned = raw.trim()
  const fence = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/i)
  if (fence) cleaned = fence[1].trim()
  const first = cleaned.indexOf('[')
  const last = cleaned.lastIndexOf(']')
  if (first === -1 || last === -1) return []
  try {
    const arr = JSON.parse(cleaned.slice(first, last + 1))
    return Array.isArray(arr) ? arr.filter((s) => typeof s === 'string') : []
  } catch {
    return []
  }
}

export const detectEquipment = onCall(
  { secrets: [groqKey], region: 'asia-south1', cors: true },
  async (req): Promise<DetectOutput> => {
    const input = req.data as DetectInput
    if (!input || !Array.isArray(input.imageUrls) || input.imageUrls.length === 0) {
      throw new HttpsError('invalid-argument', 'imageUrls required')
    }
    if (input.imageUrls.length > 6) {
      throw new HttpsError('invalid-argument', 'max 6 images per call')
    }

    const apiKey = groqKey.value()
    if (!apiKey) throw new HttpsError('failed-precondition', 'GROQ_API_KEY not configured')

    const allFound = new Set<string>()
    for (const url of input.imageUrls) {
      try {
        const content: Content[] = [
          { type: 'text', text: DETECT_PROMPT },
          { type: 'image_url', image_url: { url } },
        ]
        const raw = await callGroq({
          apiKey,
          // Llama 4 Scout — Groq's multimodal (text + vision) MoE model.
          model: 'meta-llama/llama-4-scout-17b-16e-instruct',
          messages: [{ role: 'user', content }],
          max_tokens: 512,
          temperature: 0.1,
        })
        for (const name of parseStringArray(raw)) {
          allFound.add(name.toLowerCase().trim())
        }
      } catch (e) {
        logger.warn('detectEquipment: skipped one image', { url: url.slice(0, 80), error: String(e) })
      }
    }
    return { equipment: Array.from(allFound) }
  },
)
