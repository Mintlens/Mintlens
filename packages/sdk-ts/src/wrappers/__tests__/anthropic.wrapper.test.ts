/**
 * Unit tests — wrapAnthropic
 *
 * Uses fake async generators to simulate the Anthropic streaming SSE events.
 * No real API keys or network calls needed.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { wrapAnthropic } from '../anthropic.wrapper.js'
import type { MintlensClient } from '../../client/mintlens-client.js'

// ── Fake MintlensClient ───────────────────────────────────────────────────────

function makeFakeMintlens() {
  const track = vi.fn()
  return { track } as unknown as MintlensClient
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeFakeAnthropic(createImpl: (...args: unknown[]) => unknown) {
  return {
    messages: {
      create: createImpl,
    },
  }
}

/** Fake non-streaming Anthropic message response */
function fakeMessageResponse(inputTokens: number, outputTokens: number) {
  return {
    id: 'msg_fake',
    type: 'message',
    role: 'assistant',
    content: [{ type: 'text', text: 'Hello' }],
    model: 'claude-sonnet-4-6',
    stop_reason: 'end_turn',
    usage: { input_tokens: inputTokens, output_tokens: outputTokens },
  }
}

/**
 * Fake Anthropic streaming generator.
 *
 * Emits the SSE events that the Anthropic API sends for a streaming message:
 * - message_start  → carries input_tokens
 * - content_block_start / content_block_delta / content_block_stop (content)
 * - message_delta  → carries output_tokens
 * - message_stop
 */
async function* fakeAnthropicStream(
  inputTokens: number,
  outputTokens: number,
): AsyncIterable<Record<string, unknown>> {
  yield {
    type: 'message_start',
    message: {
      id: 'msg_fake',
      type: 'message',
      role: 'assistant',
      content: [],
      model: 'claude-sonnet-4-6',
      stop_reason: null,
      usage: { input_tokens: inputTokens, output_tokens: 0 },
    },
  }
  yield { type: 'content_block_start', index: 0, content_block: { type: 'text', text: '' } }
  yield { type: 'content_block_delta', index: 0, delta: { type: 'text_delta', text: 'Hello' } }
  yield { type: 'content_block_stop', index: 0 }
  yield {
    type: 'message_delta',
    delta: { stop_reason: 'end_turn', stop_sequence: null },
    usage: { output_tokens: outputTokens },
  }
  yield { type: 'message_stop' }
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('wrapAnthropic — non-streaming', () => {
  let mintlens: MintlensClient

  beforeEach(() => {
    mintlens = makeFakeMintlens()
  })

  it('calls track() with correct token counts after a successful response', async () => {
    const fakeClient = makeFakeAnthropic(() => Promise.resolve(fakeMessageResponse(15, 35)))
    const wrapped = wrapAnthropic(fakeClient as never, mintlens)

    await wrapped.messages.create({ model: 'claude-sonnet-4-6', max_tokens: 1024, messages: [] })

    expect(mintlens.track).toHaveBeenCalledOnce()
    expect(mintlens.track).toHaveBeenCalledWith(
      expect.objectContaining({
        provider: 'anthropic',
        model: 'claude-sonnet-4-6',
        tokensInput: 15,
        tokensOutput: 35,
      }),
    )
  })

  it('merges defaultContext into the tracked event', async () => {
    const fakeClient = makeFakeAnthropic(() => Promise.resolve(fakeMessageResponse(1, 1)))
    const wrapped = wrapAnthropic(fakeClient as never, mintlens, { featureKey: 'chat', tenantId: 'corp' })

    await wrapped.messages.create({ model: 'claude-sonnet-4-6', max_tokens: 100, messages: [] })

    expect(mintlens.track).toHaveBeenCalledWith(
      expect.objectContaining({ featureKey: 'chat', tenantId: 'corp' }),
    )
  })

  it('allows call-level context to override defaultContext', async () => {
    const fakeClient = makeFakeAnthropic(() => Promise.resolve(fakeMessageResponse(1, 1)))
    const wrapped = wrapAnthropic(fakeClient as never, mintlens, { tenantId: 'default' })

    await wrapped.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 100,
      messages: [],
      mintlens: { tenantId: 'override' },
    } as never)

    expect(mintlens.track).toHaveBeenCalledWith(
      expect.objectContaining({ tenantId: 'override' }),
    )
  })

  it('does not call track() when the response has no usage field', async () => {
    const fakeClient = makeFakeAnthropic(() => Promise.resolve({ id: 'msg_fake', content: [] }))
    const wrapped = wrapAnthropic(fakeClient as never, mintlens)

    await wrapped.messages.create({ model: 'claude-sonnet-4-6', max_tokens: 100, messages: [] })

    expect(mintlens.track).not.toHaveBeenCalled()
  })

  it('records a latencyMs >= 0', async () => {
    const fakeClient = makeFakeAnthropic(() => Promise.resolve(fakeMessageResponse(1, 1)))
    const wrapped = wrapAnthropic(fakeClient as never, mintlens)

    await wrapped.messages.create({ model: 'claude-sonnet-4-6', max_tokens: 100, messages: [] })

    const call = (mintlens.track as ReturnType<typeof vi.fn>).mock.calls[0][0]
    expect(typeof call.latencyMs).toBe('number')
    expect(call.latencyMs).toBeGreaterThanOrEqual(0)
  })
})

describe('wrapAnthropic — streaming', () => {
  let mintlens: MintlensClient

  beforeEach(() => {
    mintlens = makeFakeMintlens()
  })

  it('calls track() with correct token counts after stream exhaustion', async () => {
    const fakeClient = makeFakeAnthropic(() => Promise.resolve(fakeAnthropicStream(25, 80)))
    const wrapped = wrapAnthropic(fakeClient as never, mintlens)

    const stream = await wrapped.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      messages: [],
      stream: true,
    } as never)

    // track() must NOT be called before the stream is consumed
    expect(mintlens.track).not.toHaveBeenCalled()

    for await (const _ of stream as AsyncIterable<unknown>) { /* noop */ }

    expect(mintlens.track).toHaveBeenCalledOnce()
    expect(mintlens.track).toHaveBeenCalledWith(
      expect.objectContaining({
        provider: 'anthropic',
        model: 'claude-sonnet-4-6',
        tokensInput: 25,
        tokensOutput: 80,
      }),
    )
  })

  it('yields all SSE events transparently', async () => {
    const fakeClient = makeFakeAnthropic(() => Promise.resolve(fakeAnthropicStream(1, 1)))
    const wrapped = wrapAnthropic(fakeClient as never, mintlens)

    const stream = await wrapped.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 100,
      messages: [],
      stream: true,
    } as never)

    const events: unknown[] = []
    for await (const event of stream as AsyncIterable<unknown>) {
      events.push(event)
    }

    // 6 events: message_start, content_block_start, content_block_delta,
    //           content_block_stop, message_delta, message_stop
    expect(events).toHaveLength(6)
  })

  it('does not call track() when stream has no usage events', async () => {
    async function* emptyStream() {
      yield { type: 'message_stop' }
    }

    const fakeClient = makeFakeAnthropic(() => Promise.resolve(emptyStream()))
    const wrapped = wrapAnthropic(fakeClient as never, mintlens)

    const stream = await wrapped.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 100,
      messages: [],
      stream: true,
    } as never)

    for await (const _ of stream as AsyncIterable<unknown>) { /* noop */ }

    expect(mintlens.track).not.toHaveBeenCalled()
  })

  it('correctly reads input tokens from message_start and output tokens from message_delta', async () => {
    async function* preciseStream() {
      yield { type: 'message_start', message: { usage: { input_tokens: 42 } } }
      yield { type: 'message_delta', usage: { output_tokens: 99 } }
      yield { type: 'message_stop' }
    }

    const fakeClient = makeFakeAnthropic(() => Promise.resolve(preciseStream()))
    const wrapped = wrapAnthropic(fakeClient as never, mintlens)

    const stream = await wrapped.messages.create({
      model: 'claude-3-5-haiku-latest',
      max_tokens: 200,
      messages: [],
      stream: true,
    } as never)

    for await (const _ of stream as AsyncIterable<unknown>) { /* noop */ }

    expect(mintlens.track).toHaveBeenCalledWith(
      expect.objectContaining({ tokensInput: 42, tokensOutput: 99 }),
    )
  })
})
