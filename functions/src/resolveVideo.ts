import { onCall, HttpsError } from 'firebase-functions/v2/https'
import { defineSecret } from 'firebase-functions/params'
import { logger } from 'firebase-functions'

const youtubeKey = defineSecret('YOUTUBE_API_KEY')

interface Input { query: string }
interface Output { video_id: string | null }

export const resolveVideo = onCall(
  { secrets: [youtubeKey], region: 'asia-south1', cors: true },
  async (req): Promise<Output> => {
    const input = req.data as Input
    if (!input || typeof input.query !== 'string' || input.query.trim().length === 0) {
      throw new HttpsError('invalid-argument', 'query required')
    }

    const apiKey = youtubeKey.value()
    if (!apiKey) {
      // Surface as null so the client can fall back to a search link.
      logger.info('resolveVideo: YOUTUBE_API_KEY missing; returning null')
      return { video_id: null }
    }

    const url = new URL('https://www.googleapis.com/youtube/v3/search')
    url.searchParams.set('key', apiKey)
    url.searchParams.set('part', 'snippet')
    url.searchParams.set('q', input.query)
    url.searchParams.set('type', 'video')
    url.searchParams.set('videoEmbeddable', 'true')
    url.searchParams.set('maxResults', '1')
    url.searchParams.set('safeSearch', 'moderate')

    try {
      const res = await fetch(url.toString())
      if (!res.ok) {
        const text = await res.text()
        logger.warn('YouTube API error', { status: res.status, body: text.slice(0, 200) })
        return { video_id: null }
      }
      const data = (await res.json()) as {
        items?: Array<{ id?: { videoId?: string } }>
      }
      const video_id = data.items?.[0]?.id?.videoId ?? null
      return { video_id }
    } catch (e) {
      logger.warn('YouTube fetch failed', { error: String(e) })
      return { video_id: null }
    }
  },
)
