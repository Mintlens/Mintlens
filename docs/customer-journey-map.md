# MintLens — Customer Journey Map & Action Plan

> **Purpose:** Strategic analysis of the end-to-end user journey for MintLens (LLM FinOps cost tracker). Documents the current state, identifies gaps, and provides a prioritized action plan for an orchestrating agent to execute.
>
> **Date:** 2026-03-18
> **Persona:** Engineering Lead
> **Product stage:** In development (pre-launch)

---

## Table of Contents

1. [Persona](#1-persona)
2. [Journey Map](#2-journey-map)
3. [Gap Analysis](#3-gap-analysis)
4. [Action Plan](#4-action-plan)
5. [Execution Order](#5-execution-order)
6. [Architecture Reference](#6-architecture-reference)

---

## 1. Persona

### Engineering Lead "Elena"

| Attribute | Detail |
|---|---|
| **Age** | 32–40 |
| **Role** | Engineering Manager or VP Engineering |
| **Company** | Series A–C startup using LLMs in production (support chat, doc summarization, semantic search) |
| **Team size** | 5–15 engineers |
| **Reports to** | CTO |
| **Trigger event** | CEO asked "why did our OpenAI bill triple last month?" — she had no answer |

**Jobs to be done:**
- Track LLM spend per feature and per team
- Set guardrails before costs spiral out of control
- Justify AI investment to leadership with hard data
- Compare model cost/performance tradeoffs across providers

**Current pain:**
- Checking provider dashboards (OpenAI, Anthropic, Google) manually
- No per-feature or per-tenant cost breakdown
- No alerts before budget overruns — discovers overspend after the fact

---

## 2. Journey Map

### 2.1 Awareness

| Dimension | Detail |
|---|---|
| **Customer Actions** | Googles "LLM cost tracking tool", sees HN/Reddit thread, hears from peer at meetup, sees Twitter/X post |
| **Touchpoints** | Google search, Hacker News, Reddit, Twitter/X, dev conferences, word-of-mouth |
| **Customer Experience** | *"Finally, someone built this"* — Relieved but skeptical it actually works for multi-provider setups |
| **KPIs** | Organic search traffic, GitHub stars, social mentions, referral signups |
| **Business Goals** | Build awareness in the LLM/FinOps niche, establish credibility |
| **Teams Involved** | Marketing, DevRel, Content |

### 2.2 Consideration

| Dimension | Detail |
|---|---|
| **Customer Actions** | Visits mintlens.dev, reads docs, looks for a live demo, compares to Helicone/LangSmith/Langfuse |
| **Touchpoints** | Landing page, docs site, GitHub repo, demo/sandbox, comparison articles |
| **Customer Experience** | *"Looks clean, but can I try it before committing?"* — Wants proof, not promises |
| **KPIs** | Landing page → signup conversion rate, time spent on docs, demo engagement, bounce rate |
| **Business Goals** | Convert visitors to signups, differentiate from observability tools (MintLens = FinOps, not tracing) |
| **Teams Involved** | Marketing, Product, Design |

### 2.3 Decision (Signup → First Value)

| Dimension | Detail |
|---|---|
| **Customer Actions** | Signs up, creates org, creates first project, gets API key, sends first test events from staging |
| **Touchpoints** | Signup page, onboarding flow, SDK docs, first dashboard view |
| **Customer Experience** | *"Signup was fast but... now what?"* — Needs a clear next step, not a blank dashboard |
| **KPIs** | Signup completion rate, time-to-first-event (target: < 10 min), activation rate |
| **Business Goals** | Reduce friction to first value, minimize signup abandonment, ensure activation |
| **Teams Involved** | Product, Engineering, Design |

### 2.4 Onboarding (Integration → Activation)

| Dimension | Detail |
|---|---|
| **Customer Actions** | Integrates SDK in production code, sets first budget with alert thresholds, invites a teammate, configures Slack alerts |
| **Touchpoints** | SDK integration, API key management, budget setup wizard, team invite flow, Slack configuration |
| **Customer Experience** | *"OK it's tracking, but setting budgets is confusing"* — Wants guardrails fast, unclear what "scope" means |
| **KPIs** | SDK integration completion rate, first budget created, team invite sent, D7 retention |
| **Business Goals** | Ensure activation (event sent + budget set), reduce early churn risk |
| **Teams Involved** | Product, Engineering, DX |

### 2.5 Daily Use & Loyalty

| Dimension | Detail |
|---|---|
| **Customer Actions** | Checks dashboard daily, reviews cost trends, gets budget alert, exports report for CTO, recommends to peers |
| **Touchpoints** | Dashboard (Overview, Cost Explorer, Budgets, Tenants), email alerts, Slack notifications, CSV/PDF export, community |
| **Customer Experience** | *"This saved my ass in the budget meeting"* — Confident, wants to share with CTO and recommend to peers |
| **KPIs** | DAU, D7/D30 retention, NPS, expansion (projects added), referral rate |
| **Business Goals** | Increase stickiness, drive word-of-mouth, upsell Pro tier, reduce churn |
| **Teams Involved** | Product, Customer Success, Engineering |

---

## 3. Gap Analysis

### Current State Summary

**What exists and works:**
- Login and Signup pages (auth flow complete)
- Overview dashboard (4 KPI cards, cost sparkline, top models/features)
- Cost Explorer (time series chart, breakdowns by model/feature/provider, filters)
- Budgets page (create, list with progress bars, delete, kill-switch)
- Full backend API (analytics, budgets, ingestion, projects, auth)
- Background workers (event processing, budget checking, model pricing sync)
- Design system (mint color palette, Radix UI components, Recharts)

### 3.1 Stage: Awareness

| Gap | Current Status | Impact |
|---|---|---|
| No landing/marketing page | **Missing** | **Critical** — no way to discover or understand the product |
| No docs site | **Missing** | **High** — engineers won't trust an undocumented tool |
| No GitHub README with value prop | **Missing** | **Medium** — missed organic discovery channel |

### 3.2 Stage: Consideration

| Gap | Current Status | Impact |
|---|---|---|
| No public demo/sandbox | **Missing** | **High** — "let me try before I sign up" is table-stakes for dev tools |
| No feature comparison page | **Missing** | **Medium** — no differentiation vs Helicone/LangSmith |
| No pricing page | **Missing** | **Medium** — unclear what free vs Pro includes |

### 3.3 Stage: Decision (Signup → First Value)

| Gap | Current Status | Impact |
|---|---|---|
| Signup page | **Done** | — |
| Login page | **Done** | — |
| No onboarding wizard after signup | **Missing** | **Critical** — user lands on empty dashboard with no guidance |
| No "getting started" guide in-app | **Missing** | **High** — no path to send first event |
| No empty states on dashboard pages | **Missing** | **High** — blank charts with no data are confusing and feel broken |
| Create Project UI not wired | **Partial** | **Medium** — hook `useCreateProject()` exists but no UI trigger |

### 3.4 Stage: Onboarding (Integration → Activation)

| Gap | Current Status | Impact |
|---|---|---|
| No API key management page | **Missing** | **Critical** — cannot generate, view, copy, or revoke API keys from the UI |
| No SDK integration guide in-app | **Missing** | **High** — user must leave the app to figure out integration |
| No "first event received" feedback | **Missing** | **Medium** — no activation celebration or confirmation |
| No team/member invite flow | **Missing** | **High** — cannot add teammates (backend has roles but no invite endpoint) |
| No settings/profile page | **Missing** | **Medium** — cannot manage account, change password, view org details |
| Budget creation | **Done** | — |
| Kill-switch | **Done** | — |

### 3.5 Stage: Daily Use & Loyalty

| Gap | Current Status | Impact |
|---|---|---|
| Overview dashboard | **Done** | — |
| Cost Explorer | **Done** | — |
| Budgets page | **Done** | — |
| No Tenants/Customers page | **Missing** | **High** — API endpoint `GET /v1/analytics/tenants` exists with per-tenant cost, revenue, margin — no UI |
| No Features management page | **Missing** | **Medium** — API endpoint `GET /projects/:id/features` exists — no UI |
| Search not functional | **Partial** | **Low** — search button exists in top bar, not wired |
| Notifications not functional | **Partial** | **Medium** — bell icon exists in top bar, not wired |
| No export/download (CSV/PDF) | **Missing** | **High** — CTO wants a report, user can't export data |
| No Slack alert integration UI | **Missing** | **Medium** — backend budget_alerts table has `channel: slack` but no Slack webhook sending |
| No user settings page | **Missing** | **Medium** — can't change password, update profile, manage org |
| Budget alert emails sent to wrong recipient | **Bug** | **High** — `budget-alert.service.ts` sends to `project.name` instead of user email |

---

## 4. Action Plan

### Phase 1: Critical Path (Signup → First Value)

*Without these, no user can successfully activate. This is the minimum to unblock the core loop.*

| Task ID | Task | Location | New/Edit | Effort | Details |
|---|---|---|---|---|---|
| **1.1** | Empty states for all dashboard pages | `overview/page.tsx`, `cost-explorer/page.tsx`, `budgets/page.tsx` | Edit | **S** | When no data: show illustration + message + CTA button "Send your first event →". Check if `summary.totalCost === 0` or data arrays are empty. |
| **1.2** | Onboarding wizard | New: `apps/web/src/app/(dashboard)/onboarding/page.tsx` + components | New | **M** | 3-step stepper shown on first login (when 0 projects exist): Step 1 — Create project (name + environment). Step 2 — Copy API key (auto-generated). Step 3 — Code snippet (curl + Node.js + Python) to send a test event. Redirect to `/overview` on completion. |
| **1.3** | API Keys management page | New: `apps/web/src/app/(dashboard)/settings/api-keys/page.tsx` | New | **M** | Table listing keys (prefix `sk_live_***`, name, created, last used, scopes). Generate button → dialog showing raw key once. Revoke button with confirmation. Uses `POST /v1/auth/api-keys` (exists) + new `GET /v1/auth/api-keys` and `DELETE /v1/auth/api-keys/:id` endpoints needed. |
| **1.4** | Create Project dialog | `apps/web/src/components/layout/sidebar.tsx` or new component | Edit | **S** | Add "New Project" button in the project selector dropdown. Dialog with name + environment fields. Wire to existing `useCreateProject()` hook. Invalidate projects query on success. |
| **1.5** | Settings page (profile + org) | New: `apps/web/src/app/(dashboard)/settings/page.tsx` | New | **M** | Sections: Profile (first name, last name, email — read-only for now), Organization (name, plan tier badge), Danger zone (placeholder). Add "Settings" link to sidebar navigation. Backend: new `GET /v1/auth/me` endpoint returning current user + org. |

### Phase 2: Activation & Retention

*Features that make users stick after successful integration.*

| Task ID | Task | Location | New/Edit | Effort | Details |
|---|---|---|---|---|---|
| **2.1** | Tenants page | New: `apps/web/src/app/(dashboard)/tenants/page.tsx` + components | New | **M** | Table with columns: tenant name, total cost, requests, tokens, gross margin %, last activity. Pagination. Click row → filtered Cost Explorer view. Uses existing `GET /v1/analytics/tenants` endpoint. Add "Tenants" nav link to sidebar. |
| **2.2** | Features page | New: `apps/web/src/app/(dashboard)/features/page.tsx` + components | New | **S** | Table with columns: feature key, name, total cost, requests, tokens. Uses existing `GET /v1/projects/:id/features` endpoint. Add "Features" nav link to sidebar. |
| **2.3** | Notifications center | `apps/web/src/components/layout/top-bar.tsx` + new dropdown component | Edit | **M** | Click bell icon → dropdown panel showing recent budget alerts (threshold crossed, kill-switch activated). Badge with unread count. Backend: new `GET /v1/budgets/alerts?projectId=` endpoint reading from `budget_alerts` table. |
| **2.4** | CSV export | `apps/web/src/components/cost-explorer/` + `tenants/` | Edit | **S** | "Export CSV" button on Cost Explorer (time series data + breakdowns) and Tenants page. Client-side CSV generation from existing query data. Download as `mintlens-cost-explorer-YYYY-MM-DD.csv`. |
| **2.5** | Team members page | New: `apps/web/src/app/(dashboard)/settings/team/page.tsx` | New | **L** | List current org members (email, role, joined date). Invite form (email + role). Backend: new `POST /v1/auth/invite`, `GET /v1/auth/members`, `DELETE /v1/auth/members/:id` endpoints. Email invite via Resend. |
| **2.6** | Fix budget alert recipient | `apps/api/src/modules/budgets/application/budget-alert.service.ts` | Edit | **S** | Change email recipient from `project.name` to actual user email. Query org owner's email from users table. |

### Phase 3: Polish & Growth

*Features that drive word-of-mouth and product-led growth.*

| Task ID | Task | Location | New/Edit | Effort | Details |
|---|---|---|---|---|---|
| **3.1** | Global search (Cmd+K) | New: `apps/web/src/components/layout/command-palette.tsx` | New | **M** | Command palette (Cmd+K / Ctrl+K) searching across: models, features, tenants, pages. Uses fuzzy matching on client-cached data. Navigation on select. |
| **3.2** | Slack integration setup | New: `apps/web/src/app/(dashboard)/settings/integrations/page.tsx` | New | **L** | OAuth flow to connect Slack workspace. Channel picker for budget alerts. Backend: Slack webhook sending in `budget-alert.service.ts` (currently placeholder). Store webhook URL per org. |
| **3.3** | PDF report generation | Backend + UI trigger button | New | **L** | Weekly/monthly cost summary PDF. Triggered manually ("Download Report") or scheduled. Includes: KPI summary, top models, top features, budget status, cost trend chart. |
| **3.4** | Landing page | New: `apps/web/src/app/(public)/page.tsx` or separate marketing site | New | **L** | Hero with value prop, feature highlights (real-time tracking, budgets, kill-switch, multi-provider), pricing table (free vs Pro), CTA to signup. |
| **3.5** | Documentation site | External or `apps/docs/` | New | **L** | Getting Started guide, SDK reference (Node.js, Python, curl), API reference (auto-generated from Swagger), concepts (budgets, kill-switch, tenants, features). |

### Effort Legend

| Size | Estimate | Scope |
|---|---|---|
| **S** | < 2 hours | Small component, wiring existing hook, minor edit |
| **M** | 2–6 hours | New page with API integration, moderate complexity |
| **L** | 6+ hours | Complex multi-part feature, new backend endpoints + frontend |

---

## 5. Execution Order

```
Phase 1: Critical Path              Phase 2: Retention              Phase 3: Growth
(Must complete before user testing)  (Build stickiness)              (Drive adoption)
─────────────────────────────────    ────────────────────            ──────────────────

1.1  Empty states (S)                2.6  Fix alert recipient (S)    3.1  Cmd+K search (M)
1.4  Create Project dialog (S)      2.2  Features page (S)          3.4  Landing page (L)
1.2  Onboarding wizard (M)          2.4  CSV export (S)             3.5  Docs site (L)
1.3  API Keys page (M)              2.1  Tenants page (M)           3.2  Slack integration (L)
1.5  Settings page (M)              2.3  Notifications center (M)   3.3  PDF reports (L)
                                    2.5  Team members page (L)
```

### Dependencies

```
1.4 (Create Project) → 1.2 (Onboarding wizard uses project creation)
1.2 (Onboarding)     → 1.3 (Onboarding references API keys page)
1.5 (Settings)       → 2.5 (Team members is a settings subpage)
2.6 (Fix alerts)     → 2.3 (Notifications center shows alerts)
```

### Parallel Opportunities

These tasks have no dependencies and can be built simultaneously:
- `1.1` (Empty states) + `1.4` (Create Project dialog) + `1.5` (Settings page)
- `2.1` (Tenants) + `2.2` (Features) + `2.4` (CSV export)
- `3.1` (Search) + `3.4` (Landing page)

---

## 6. Architecture Reference

### Existing Backend Endpoints (ready for frontend consumption)

| Endpoint | Method | Used by UI? | Notes |
|---|---|---|---|
| `POST /v1/auth/signup` | POST | Yes | Signup page |
| `POST /v1/auth/login` | POST | Yes | Login page |
| `POST /v1/auth/logout` | POST | Yes | Logout button |
| `GET /v1/auth/csrf-token` | GET | Yes | All mutations |
| `POST /v1/auth/api-keys` | POST | **No** | Needs API Keys page (Task 1.3) |
| `GET /v1/projects` | GET | Yes | Project selector |
| `POST /v1/projects` | POST | **No** | Needs Create Project dialog (Task 1.4) |
| `GET /v1/projects/:id` | GET | **No** | Available for settings/detail view |
| `GET /v1/projects/:id/features` | GET | **No** | Needs Features page (Task 2.2) |
| `GET /v1/analytics/summary` | GET | Yes | Overview page |
| `GET /v1/analytics/cost-explorer` | GET | Yes | Cost Explorer page |
| `GET /v1/analytics/tenants` | GET | **No** | Needs Tenants page (Task 2.1) |
| `POST /v1/budgets` | POST | Yes | Create budget dialog |
| `GET /v1/budgets` | GET | Yes | Budgets page |
| `DELETE /v1/budgets/:id` | DELETE | Yes | Budget delete |

### New Backend Endpoints Needed

| Endpoint | Method | For Task | Purpose |
|---|---|---|---|
| `GET /v1/auth/me` | GET | 1.5 | Return current user profile + org |
| `GET /v1/auth/api-keys` | GET | 1.3 | List API keys for project (prefix only, not raw key) |
| `DELETE /v1/auth/api-keys/:id` | DELETE | 1.3 | Revoke an API key |
| `GET /v1/budgets/alerts` | GET | 2.3 | List recent budget alerts for notification center |
| `GET /v1/auth/members` | GET | 2.5 | List org members |
| `POST /v1/auth/invite` | POST | 2.5 | Invite member by email |
| `DELETE /v1/auth/members/:id` | DELETE | 2.5 | Remove member from org |

### Frontend Route Map (Current + Planned)

```
apps/web/src/app/
├── (auth)/
│   ├── login/page.tsx            ✅ Exists
│   └── signup/page.tsx           ✅ Exists
├── (dashboard)/
│   ├── layout.tsx                ✅ Exists
│   ├── overview/page.tsx         ✅ Exists (needs empty state)
│   ├── cost-explorer/page.tsx    ✅ Exists (needs empty state + CSV export)
│   ├── budgets/page.tsx          ✅ Exists (needs empty state)
│   ├── tenants/page.tsx          🔲 Task 2.1
│   ├── features/page.tsx         🔲 Task 2.2
│   ├── onboarding/page.tsx       🔲 Task 1.2
│   └── settings/
│       ├── page.tsx              🔲 Task 1.5
│       ├── api-keys/page.tsx     🔲 Task 1.3
│       ├── team/page.tsx         🔲 Task 2.5
│       └── integrations/page.tsx 🔲 Task 3.2
└── (public)/
    └── page.tsx                  🔲 Task 3.4 (landing page)
```

### Sidebar Navigation (Target State)

```
MAIN
  Overview          ✅
  Cost Explorer     ✅
  Tenants           🔲 Task 2.1
  Features          🔲 Task 2.2
  Budgets           ✅

SETTINGS
  General           🔲 Task 1.5
  API Keys          🔲 Task 1.3
  Team              🔲 Task 2.5
  Integrations      🔲 Task 3.2
```

### Design System Reference

| Token | Value | Usage |
|---|---|---|
| Primary (mint) | `#4ecba6` | Buttons, active states, progress bars |
| Surface | `#ffffff` | Cards, modals |
| Surface Sunken | `#f4f5f7` | Page backgrounds |
| Ink Default | `#1a1d23` | Primary text |
| Ink Muted | `#6b7280` | Secondary text |
| Success | emerald | Positive metrics, under-budget |
| Warning | amber | Alert thresholds approached |
| Danger | red | Over budget, errors |
| Border radius | `0.75rem` | Default, `1rem` for cards |
| Font | Inter | All text |
| Body size | `0.875rem` | Default text |
