/**
 * Drives the OpenAI *Responses* API for the terminal's chat agent. Ported from
 * fitness-scpx's src/lib/openai.ts, stripped to what this site needs: no tools, no
 * reasoning block, no tool-call loop. The SSE frame parser and error mapping are
 * carried over almost verbatim — same wire format, same reasons a stream can fail.
 *
 * Event names, event order and payload shapes follow the recorded contract in
 * /root/projects/fitness-scpx/docs/reference/openai-responses-events.md.
 */

const ENDPOINT = 'https://api.openai.com/v1/responses'

export const OPENAI_TIMEOUT_MS = 60_000

export type ChatErrorCode = 'no_key' | 'auth' | 'quota' | 'upstream' | 'network' | 'error'

export class ChatError extends Error {
  constructor(
    readonly code: ChatErrorCode,
    message: string,
  ) {
    super(message)
    this.name = 'ChatError'
  }
}

export interface ResponsesInputItem {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export type ChatEvent = { type: 'token'; text: string }

export interface RunChatOptions {
  model: string
  instructions: string
  input: ResponsesInputItem[]
  maxOutputTokens?: number
}

// ---------------------------------------------------------------- SSE plumbing

interface SseFrame {
  /** The `type` field of the payload; the redundant `event:` line is only a fallback. */
  type: string
  data: Record<string, unknown>
}

const asObject = (v: unknown): Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v) ? (v as Record<string, unknown>) : {}
const asString = (v: unknown): string => (typeof v === 'string' ? v : '')

/** Never let an API key reach a log line or an error message. */
function withoutKey(text: string): string {
  return text.replace(/sk-[A-Za-z0-9_-]+/g, 'sk-***')
}

/**
 * Splits the byte stream into frames and identifies each one by the `type` field of
 * its `data:` payload — that field is present on every recorded event, the `event:`
 * line only repeats it. Comment lines and `[DONE]` are ignored.
 */
async function* sseFrames(body: ReadableStream<Uint8Array>): AsyncGenerator<SseFrame> {
  const reader = body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  for (;;) {
    const { value, done } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    let boundary = buffer.indexOf('\n\n')
    while (boundary !== -1) {
      const block = buffer.slice(0, boundary)
      buffer = buffer.slice(boundary + 2)
      let name = ''
      const dataLines: string[] = []
      for (const line of block.split('\n')) {
        if (line.startsWith('event:')) name = line.slice(6).trim()
        else if (line.startsWith('data:')) dataLines.push(line.slice(5).trim())
      }
      const raw = dataLines.join('\n')
      if (raw !== '' && raw !== '[DONE]') {
        let data: Record<string, unknown>
        try {
          data = asObject(JSON.parse(raw) as unknown)
        } catch {
          throw new ChatError('error', 'The terminal received an unreadable reply.')
        }
        yield { type: asString(data.type) || name, data }
      }
      boundary = buffer.indexOf('\n\n')
    }
  }
}

/**
 * The single model call this agent needs: no tools, no follow-up rounds. Streams
 * `token` events as text arrives and returns once the response is complete.
 */
export async function* runChat(o: RunChatOptions): AsyncGenerator<ChatEvent, void> {
  const key = process.env.OPENAI_API_KEY
  if (!key || key.trim() === '') {
    throw new ChatError('no_key', "The terminal isn't wired up right now.")
  }

  const body: Record<string, unknown> = {
    model: o.model,
    instructions: o.instructions,
    input: o.input,
    stream: true,
    // Nothing here is stored server-side; there is no conversation to retain.
    store: false,
  }
  if (o.maxOutputTokens !== undefined) body.max_output_tokens = o.maxOutputTokens

  let res: Response
  try {
    res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${key}`,
        accept: 'text/event-stream',
      },
      body: JSON.stringify(body),
      // One deadline for the whole call: connect, headers and the streamed body.
      signal: AbortSignal.timeout(OPENAI_TIMEOUT_MS),
    })
  } catch {
    throw new ChatError('network', "The terminal couldn't reach the model. Try again in a moment.")
  }

  if (!res.ok) {
    const raw = await res.text().catch(() => '')
    console.error('openai responses error', res.status, withoutKey(raw.slice(0, 500)))
    if (res.status === 401 || res.status === 403) {
      throw new ChatError('auth', "The terminal isn't wired up right now.")
    }
    if (res.status === 429) {
      throw new ChatError('quota', "The model is out of budget for the moment. Try again later.")
    }
    if (res.status >= 500) {
      throw new ChatError('upstream', 'The model is unavailable right now. Try again shortly.')
    }
    throw new ChatError('error', 'The terminal could not process that request.')
  }
  if (!res.body) {
    console.error('openai responses error: empty body')
    throw new ChatError('network', 'The model sent back nothing. Try again.')
  }

  let completed = false
  for await (const frame of sseFrames(res.body)) {
    const d = frame.data
    switch (frame.type) {
      case 'response.output_text.delta': {
        const text = asString(d.delta)
        if (text !== '') yield { type: 'token', text }
        break
      }
      case 'response.completed': {
        completed = true
        break
      }
      case 'response.incomplete':
      case 'response.failed':
      case 'error': {
        // Recorded shapes: `{type:"error", code, message}` for stream failures,
        // `{type:"response.failed", response:{error:{code,message}}}` for a run.
        const err = asObject(asObject(d.response).error ?? d.error ?? d)
        const message = asString(err.message) || 'unknown error'
        console.error('openai responses stream error', withoutKey(message))
        throw new ChatError('upstream', 'The model could not finish that answer. Try again.')
      }
      default:
        break
    }
  }
  if (!completed) {
    throw new ChatError('network', 'The connection to the model dropped mid-answer.')
  }
}
