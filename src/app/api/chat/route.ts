import { NextRequest, NextResponse } from 'next/server'
import { ChatError, runChat, type ResponsesInputItem } from '@/lib/openai'
import { buildSystemPrompt } from '@/lib/system-prompt'
import { checkRateLimit, clientIp } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'

const MAX_MESSAGES = 6
const MAX_CONTENT_LENGTH = 1000
const MAX_OUTPUT_TOKENS = 700

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

interface ErrorPayload {
  code: string
  text: string
}

function isChatMessage(v: unknown): v is ChatMessage {
  if (typeof v !== 'object' || v === null) return false
  const m = v as Record<string, unknown>
  return (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string'
}

/**
 * Validates the request body with plain TypeScript, then applies the hardening the
 * brief requires before anything is sent to the model: keep only the last 6
 * messages, truncate each to 1000 characters, and require the conversation to end
 * on a user turn.
 */
function parseMessages(body: unknown): ChatMessage[] | ErrorPayload {
  if (typeof body !== 'object' || body === null) {
    return { code: 'validation', text: "That request wasn't shaped like a question." }
  }
  const raw = (body as Record<string, unknown>).messages
  if (!Array.isArray(raw) || raw.length === 0 || !raw.every(isChatMessage)) {
    return { code: 'validation', text: "That request wasn't shaped like a question." }
  }

  const trimmed = raw.slice(-MAX_MESSAGES).map((m) => ({
    role: m.role,
    content: m.content.slice(0, MAX_CONTENT_LENGTH),
  }))

  if (trimmed[trimmed.length - 1]?.role !== 'user') {
    return { code: 'validation', text: 'The conversation needs to end with your question.' }
  }

  return trimmed
}

/** One SSE frame. The event names are the contract with the terminal UI. */
const frame = (event: string, data: unknown): string => `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`

export async function POST(req: NextRequest) {
  const body: unknown = await req.json().catch(() => null)
  const parsed = parseMessages(body)
  if (!Array.isArray(parsed)) return NextResponse.json(parsed, { status: 422 })
  const messages = parsed

  const ip = clientIp(req.headers)
  const rejection = checkRateLimit(ip)
  if (rejection) return NextResponse.json(rejection, { status: 429 })

  const model = process.env.OPENAI_MODEL?.trim() || 'gpt-5.6-luna'
  const instructions = buildSystemPrompt()
  const input: ResponsesInputItem[] = messages.map((m) => ({ role: m.role, content: m.content }))

  const encoder = new TextEncoder()
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const ev of runChat({ model, instructions, input, maxOutputTokens: MAX_OUTPUT_TOKENS })) {
          controller.enqueue(encoder.encode(frame('token', { text: ev.text })))
        }
        controller.enqueue(encoder.encode(frame('done', {})))
      } catch (e) {
        if (e instanceof ChatError) {
          console.error('chat stream error', e.code, e.message)
          controller.enqueue(encoder.encode(frame('error', { code: e.code, text: e.message })))
        } else {
          console.error('chat stream error: unexpected', e)
          controller.enqueue(
            encoder.encode(frame('error', { code: 'error', text: 'Something went wrong answering that. Try again.' })),
          )
        }
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'content-type': 'text/event-stream; charset=utf-8',
      'cache-control': 'no-cache, no-transform',
      connection: 'keep-alive',
      // The reverse proxy must not buffer the stream, otherwise nothing shows until the end.
      'x-accel-buffering': 'no',
    },
  })
}
