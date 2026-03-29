import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = { title: 'Quickstart — MintLens Docs' }

export default function QuickstartPage() {
  return (
    <article className="prose prose-slate max-w-none prose-headings:tracking-tight prose-h1:text-3xl prose-h2:text-xl prose-pre:bg-[#0F172A] prose-pre:text-slate-300 prose-a:text-mint-500 prose-code:text-mint-600 prose-code:before:content-[''] prose-code:after:content-['']">
      <h1>Quickstart</h1>
      <p>Track your first LLM cost in under 5 minutes.</p>

      <h2>1. Create an account</h2>
      <p>Sign up at <Link href="/signup">mintlens.io/signup</Link>. Create your first project and copy your API key.</p>

      <h2>2. Install the SDK</h2>
      <pre><code>{`npm install @mintlens/sdk`}</code></pre>
      <p>Provider SDKs are peer dependencies — install whichever you use:</p>
      <pre><code>{`npm install openai              # for OpenAI / Groq / DeepSeek
npm install @anthropic-ai/sdk   # for Anthropic`}</code></pre>

      <h2>3. Initialize the client</h2>
      <pre><code>{`import { MintlensClient } from '@mintlens/sdk'

const mintlens = new MintlensClient({
  apiKey: process.env.MINTLENS_API_KEY!,
})`}</code></pre>

      <h2>4. Wrap your LLM client</h2>
      <pre><code>{`import OpenAI from 'openai'
import { MintlensClient, wrapOpenAI } from '@mintlens/sdk'

const mintlens = new MintlensClient({ apiKey: process.env.MINTLENS_API_KEY! })
const openai = wrapOpenAI(new OpenAI(), mintlens)

// Use openai as normal — costs tracked automatically
const res = await openai.chat.completions.create({
  model: 'gpt-4o',
  messages: [{ role: 'user', content: 'Hello' }],
})`}</code></pre>

      <h2>5. Add context (optional)</h2>
      <p>Attribute costs to features, tenants, or users:</p>
      <pre><code>{`const openai = wrapOpenAI(new OpenAI(), mintlens, {
  featureKey: 'support_chat',
  tenantId: 'customer-123',
  environment: 'production',
})`}</code></pre>

      <h2>6. Check your dashboard</h2>
      <p>Log in to MintLens. Your costs will appear within 30 seconds on the <Link href="/login">Overview dashboard</Link>.</p>

      <h2>7. Graceful shutdown</h2>
      <p>Flush pending events before your process exits:</p>
      <pre><code>{`process.on('SIGTERM', async () => {
  await mintlens.shutdown()
  process.exit(0)
})`}</code></pre>

      <h2>Next steps</h2>
      <ul>
        <li><Link href="/docs/sdk">SDK Reference</Link> — all configuration options and providers</li>
        <li><Link href="/docs/api">API Reference</Link> — REST endpoints for direct integration</li>
        <li><Link href="/settings?tab=subscription">Set up budgets</Link> — spend limits with kill-switch</li>
      </ul>
    </article>
  )
}
