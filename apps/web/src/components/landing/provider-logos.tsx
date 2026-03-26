/** Grayscale provider logos for the landing page "Works with" strip */

export function ProviderLogos({ className }: { className?: string }) {
  return (
    <div className={className}>
      <span className="text-xs font-medium text-slate-400 uppercase tracking-wider mr-2">Works with</span>
      <div className="flex flex-wrap items-center gap-x-8 gap-y-4">
        <OpenAILogo />
        <AnthropicLogo />
        <GoogleLogo />
        <MistralLogo />
        <CohereLogo />
        <GroqLogo />
        <DeepSeekLogo />
      </div>
    </div>
  )
}

function OpenAILogo() {
  return (
    <svg className="h-5 w-auto text-slate-400" viewBox="0 0 120 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 17.5c-4.14 0-7.5-3.36-7.5-7.5S7.86 4.5 12 4.5s7.5 3.36 7.5 7.5-3.36 7.5-7.5 7.5z" fill="currentColor"/>
      <text x="28" y="17" className="text-[14px] font-semibold" fill="currentColor" fontFamily="system-ui">OpenAI</text>
    </svg>
  )
}

function AnthropicLogo() {
  return (
    <svg className="h-5 w-auto text-slate-400" viewBox="0 0 120 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M8 4h4l8 16h-4.5L14 17H6l-1.5 3H0L8 4zm-.5 10h5L10 8.5 7.5 14z" fill="currentColor"/>
      <text x="24" y="17" className="text-[14px] font-semibold" fill="currentColor" fontFamily="system-ui">Anthropic</text>
    </svg>
  )
}

function GoogleLogo() {
  return (
    <svg className="h-5 w-auto text-slate-400" viewBox="0 0 100 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 4.8c2.2 0 3.7.95 4.55 1.75L19.6 3.6C17.6 1.7 15.05.5 12 .5 7.3.5 3.3 3.55 1.55 7.85l3.85 2.95C6.35 7.6 8.9 4.8 12 4.8z" fill="currentColor" opacity="0.7"/>
      <path d="M23.5 12.25c0-.95-.08-1.65-.25-2.38H12v4.33h6.5c-.15 1.05-.88 2.63-2.53 3.68l3.85 2.95c2.35-2.15 3.68-5.33 3.68-8.58z" fill="currentColor" opacity="0.5"/>
      <text x="28" y="17" className="text-[14px] font-semibold" fill="currentColor" fontFamily="system-ui">Google</text>
    </svg>
  )
}

function MistralLogo() {
  return (
    <svg className="h-5 w-auto text-slate-400" viewBox="0 0 100 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="2" width="5" height="5" fill="currentColor"/>
      <rect x="9" y="2" width="5" height="5" fill="currentColor" opacity="0.6"/>
      <rect x="16" y="2" width="5" height="5" fill="currentColor"/>
      <rect x="2" y="9" width="5" height="5" fill="currentColor" opacity="0.6"/>
      <rect x="9" y="9" width="5" height="5" fill="currentColor"/>
      <rect x="16" y="9" width="5" height="5" fill="currentColor" opacity="0.6"/>
      <rect x="2" y="16" width="5" height="5" fill="currentColor"/>
      <rect x="9" y="16" width="5" height="5" fill="currentColor" opacity="0.6"/>
      <rect x="16" y="16" width="5" height="5" fill="currentColor"/>
      <text x="26" y="17" className="text-[14px] font-semibold" fill="currentColor" fontFamily="system-ui">Mistral</text>
    </svg>
  )
}

function CohereLogo() {
  return (
    <svg className="h-5 w-auto text-slate-400" viewBox="0 0 100 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="4" fill="currentColor"/>
      <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.5"/>
      <text x="24" y="17" className="text-[14px] font-semibold" fill="currentColor" fontFamily="system-ui">Cohere</text>
    </svg>
  )
}

function GroqLogo() {
  return (
    <svg className="h-5 w-auto text-slate-400" viewBox="0 0 80 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="4" width="16" height="16" rx="4" stroke="currentColor" strokeWidth="2" fill="none"/>
      <circle cx="10" cy="12" r="3" fill="currentColor"/>
      <text x="24" y="17" className="text-[14px] font-semibold" fill="currentColor" fontFamily="system-ui">Groq</text>
    </svg>
  )
}

function DeepSeekLogo() {
  return (
    <svg className="h-5 w-auto text-slate-400" viewBox="0 0 110 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M4 12c0-4.4 3.6-8 8-8s8 3.6 8 8" stroke="currentColor" strokeWidth="2" fill="none"/>
      <path d="M8 12c0-2.2 1.8-4 4-4s4 1.8 4 4" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.6"/>
      <circle cx="12" cy="12" r="1.5" fill="currentColor"/>
      <text x="24" y="17" className="text-[14px] font-semibold" fill="currentColor" fontFamily="system-ui">DeepSeek</text>
    </svg>
  )
}
