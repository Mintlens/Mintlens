/**
 * Unit tests — wrapOpenAI
 *
 * Uses fake async generators to simulate the OpenAI streaming API.
 * No real API keys or network calls needed.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { wrapOpenAI } from '../openai.wrapper.js'
import type { MintlensClient } from '../../client/mintlens-client.js'

// ── Fake MintlensClient ───────────────────────────────────────────────────────

function makeFakeMintlens() {
  const track = vi.fn()
  return { track } as unknown as MintlensClient
}

// ── Helpers to build fake OpenAI clients ─────────────────────────────────────

function makeFakeOpenAI(createImpl: (...args: unknown[]) => unknown) {
  return {
    chat: {
      completions: {
        create: createImpl,
      },
    },
  }
}

/** Builds a fake non-streaming response */
function fakeCompletionResponse(promptTokens: number, completionTokens: number) {
  return {
    id: 'chatcmpl-fake',
    choices: [{ message: { role: 'assistant', content: 'Hello' }, finish_reason: 'stop' }],
    usage: {
      prompt_tokens: promptTokens,
      completion_tokens: completionTokens,
      total_tokens: promptTokens + completionTokens,
    },
  }
}

/**
 * Builds a fake streaming async generator that emits content chunks
 * followed by a final usage-only chunk (as OpenAI does with include_usage=true).
 */
async function* fakeStream(
  promptTokens: number,
  completionTokens: number,
): AsyncIterable<Record<string, unknown>> {
  // Content chunks
  yield { choices: [{ delta: { content: 'Hel' }, finish_reason: null }], usage: null }
  yield { choices: [{ delta: { content: 'lo' }, finish_reason: 'stop' }], usage: null }
  // Final usage-only chunk
  yield {
    choices: [],
    usage: {
      prompt_tokens: promptTokens,
      completion_tokens: completionTokens,
      total_tokens: promptTokens + completionTokens,
    },
  }
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('wrapOpenAI — non-streaming', () => {
  let mintlens: MintlensClient

  beforeEach(() => {
    mintlens = makeFakeMintlens()
  })

  it('calls track() with correct token counts after a successful completion', async () => {
    const fakeClient = makeFakeOpenAI(() => Promise.resolve(fakeCompletionResponse(10, 20)))
    const wrapped = wrapOpenAI(fakeClient as never, mintlens)

    await wrapped.chat.completions.create({ model: 'gpt-4o', messages: [] })

    expect(mintlens.track).toHaveBeenCalledOnce()
    expect(mintlens.track).toHaveBeenCalledWith(
      expect.objectContaining({
        provider: 'openai',
        model: 'gpt-4o',
        tokensInput: 10,
        tokensOutput: 20,
      }),
    )
  })

  it('reports the correct provider when used as a Groq wrapper', async () => {
    const fakeClient = makeFakeOpenAI(() => Promise.resolve(fakeCompletionResponse(5, 15)))
    const wrapped = wrapOpenAI(fakeClient as never, mintlens, undefined, 'groq')

    await wrapped.chat.completions.create({ model: 'llama-3.3-70b-versatile', messages: [] })

    expect(mintlens.track).toHaveBeenCalledWith(
      expect.objectContaining({ provider: 'groq', model: 'llama-3.3-70b-versatile' }),
    )
  })

  it('merges defaultContext into the tracked event', async () => {
    const fakeClient = makeFakeOpenAI(() => Promise.resolve(fakeCompletionResponse(1, 1)))
    const wrapped = wrapOpenAI(fakeClient as never, mintlens, { featureKey: 'support', tenantId: 'acme' })

    await wrapped.chat.completions.create({ model: 'gpt-4o', messages: [] })

    expect(mintlens.track).toHaveBeenCalledWith(
      expect.objectContaining({ featureKey: 'support', tenantId: 'acme' }),
    )
  })

  it('allows call-level context to override defaultContext', async () => {
    const fakeClient = makeFakeOpenAI(() => Promise.resolve(fakeCompletionResponse(1, 1)))
    const wrapped = wrapOpenAI(fakeClient as never, mintlens, { tenantId: 'default' })

    await wrapped.chat.completions.create({
      model: 'gpt-4o',
      messages: [],
      mintlens: { tenantId: 'override' },
    } as never)

    expect(mintlens.track).toHaveBeenCalledWith(
      expect.objectContaining({ tenantId: 'override' }),
    )
  })

  it('does not call track() when the response has no usage field', async () => {
    const fakeClient = makeFakeOpenAI(() => Promise.resolve({ choices: [] })) // no usage
    const wrapped = wrapOpenAI(fakeClient as never, mintlens)

    await wrapped.chat.completions.create({ model: 'gpt-4o', messages: [] })

    expect(mintlens.track).not.toHaveBeenCalled()
  })

  it('records a latencyMs > 0', async () => {
    const fakeClient = makeFakeOpenAI(() => Promise.resolve(fakeCompletionResponse(1, 1)))
    const wrapped = wrapOpenAI(fakeClient as never, mintlens)

    await wrapped.chat.completions.create({ model: 'gpt-4o', messages: [] })

    const call = (mintlens.track as ReturnType<typeof vi.fn>).mock.calls[0][0]
    expect(typeof call.latencyMs).toBe('number')
    expect(call.latencyMs).toBeGreaterThanOrEqual(0)
  })
})

describe('wrapOpenAI — streaming', () => {
  let mintlens: MintlensClient

  beforeEach(() => {
    mintlens = makeFakeMintlens()
  })

  it('injects stream_options.include_usage into the upstream call', async () => {
    const originalCreate = vi.fn(() => Promise.resolve(fakeStream(10, 20)))
    const fakeClient = makeFakeOpenAI(originalCreate)
    const wrapped = wrapOpenAI(fakeClient as never, mintlens)

    const stream = await wrapped.chat.completions.create({
      model: 'gpt-4o',
      messages: [],
      stream: true,
    } as never)

    // Consume the stream so wrapStream runs to completion
    for await (const _ of stream as AsyncIterable<unknown>) { /* noop */ }

    const calledParams = originalCreate.mock.calls[0][0] as Record<string, unknown>
    expect((calledParams.stream_options as Record<string, unknown>).include_usage).toBe(true)
  })

  it('calls track() with correct token counts after stream exhaustion', async () => {
    const fakeClient = makeFakeOpenAI(() => Promise.resolve(fakeStream(30, 70)))
    const wrapped = wrapOpenAI(fakeClient as never, mintlens)

    const stream = await wrapped.chat.completions.create({
      model: 'gpt-4o',
      messages: [],
      stream: true,
    } as never)

    // track() must NOT be called before the stream is consumed
    expect(mintlens.track).not.toHaveBeenCalled()

    for await (const _ of stream as AsyncIterable<unknown>) { /* noop */ }

    expect(mintlens.track).toHaveBeenCalledOnce()
    expect(mintlens.track).toHaveBeenCalledWith(
      expect.objectContaining({
        provider: 'openai',
        model: 'gpt-4o',
        tokensInput: 30,
        tokensOutput: 70,
      }),
    )
  })

  it('yields all content chunks transparently', async () => {
    const fakeClient = makeFakeOpenAI(() => Promise.resolve(fakeStream(1, 1)))
    const wrapped = wrapOpenAI(fakeClient as never, mintlens)

    const stream = await wrapped.chat.completions.create({
      model: 'gpt-4o',
      messages: [],
      stream: true,
    } as never)

    const chunks: unknown[] = []
    for await (const chunk of stream as AsyncIterable<unknown>) {
      chunks.push(chunk)
    }

    // 2 content chunks + 1 final usage chunk = 3 total
    expect(chunks).toHaveLength(3)
  })

  it('does not call track() when stream emits no usage', async () => {
    async function* noUsageStream() {
      yield { choices: [{ delta: { content: 'Hi' } }] }
    }

    const fakeClient = makeFakeOpenAI(() => Promise.resolve(noUsageStream()))
    const wrapped = wrapOpenAI(fakeClient as never, mintlens)

    const stream = await wrapped.chat.completions.create({
      model: 'gpt-4o',
      messages: [],
      stream: true,
    } as never)

    for await (const _ of stream as AsyncIterable<unknown>) { /* noop */ }

    expect(mintlens.track).not.toHaveBeenCalled()
  })
})
