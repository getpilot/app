# ROADMAP

This file tracks planned product work. For strategy context, see [competitive-analysis.md](./competitive-analysis.md).

## Positioning anchor

Pilot is built as a sales system, not a bot.

That means roadmap priority favors:

- Reliable AI conversation handling over brittle flow trees
- Built-in CRM workflow depth over broadcast-style automation
- Safety and HRN guardrails over maximum send volume

## 2026 phased priorities

### Phase 1: High-impact acquisition (Immediate)

Priority: Critical

- Knowledge base ingestion (URL and PDF scraping) for 5-minute setup
- 1-click Comment-to-DM templates for lead magnet and affiliate flows
- Smart send throttling and risk-aware pausing to protect account health
- Natural-language trigger intent matching instead of exact keyword matching

### Phase 2: Retention and lock-in (3-6 months)

Priority: High

- Visual CRM pipeline and AI lead scoring dashboard
- Revenue attribution analytics (post -> DM -> lead -> pipeline value)
- Conversation memory visibility and quality scoring
- Self-healing automation diagnostics and alerting

### Phase 3: Expansion and enterprise capture (6-12 months)

Priority: High

- WhatsApp Business API integration
- Advanced agency sub-account management and white-label reports
- Multi-workspace permissions and team collaboration controls
- Broader channel and integration ecosystem expansion

## Major features

### 1) Multi-step automation sequences (drip campaigns)

Priority: Critical

- Day-based delayed follow-up steps
- Conditional branching inside sequence steps
- Scheduler execution via Inngest
- Sequence builder UI

### 2) Deal/pipeline management (Kanban)

Priority: Critical

- Deal records linked to contacts
- Stage movement UI with drag-and-drop
- Stage value rollups
- Sidekick stage recommendations

### 3) Analytics dashboard

Priority: High

- Leads generated trend
- Trigger/response/conversion funnel
- Lead score trend and pipeline value
- HRN resolution and response timing
- Top trigger and post-level attribution

### 4) Multi-trigger and conditional automations

Priority: High

- Multiple trigger terms per automation
- Pattern/intent matching
- Condition branches by lead score/stage/tags
- Audience filters

## Medium features

### 5) Automated follow-up scheduling

Priority: Medium-high

- No-reply timers (for example, 48h follow-up)
- Tag-based inactivity nudges
- Scheduled action management

### 6) Template library

Priority: Medium

- Lead magnet delivery
- Appointment booking
- FAQ auto-replies
- Welcome and follow-up templates

### 7) Instagram stories and reels triggers

Priority: Medium

- Story mention/reply triggers
- Reel comment triggers
- Poll/quiz response handling

### 8) Billing and usage metering

Priority: Medium

- Plan limits by contacts/automations/AI usage
- Usage dashboard and upgrade prompts
- Free tier enforcement path

## Minor features

### 9) Bulk actions on contacts

Status: Shipped on February 24, 2026

- Bulk tag
- Bulk stage change
- Bulk delete
- Bulk export (CSV/Excel)

### 10) Quick replies / saved responses

Status: Planned

- Saved snippets with variables like `{{first_name}}`
- Insert shortcuts in compose UI

## Reddit-driven opportunities

These directly map to observed ManyChat pain points:

1. Smart send throttling and risk-aware pausing
2. Visible conversation memory summaries
3. Natural-language trigger intent matching
4. Auto cleanup for stale contacts
5. Non-engagement-bait comment-to-DM patterns
6. AI objection handling
7. One-click lead magnet delivery
8. Conversation quality scoring
9. Self-healing automations with diagnostics
10. Simple mode vs power mode UX
11. Instagram engagement attribution analytics
12. DM warmup sequences for newer accounts
