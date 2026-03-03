# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 0.x.x   | ✅ Active development |

## Reporting a Vulnerability

**Please do not report security vulnerabilities through public GitHub issues.**

If you discover a security vulnerability, please email us at **security@mintlens.io**. You should receive a response within 48 hours. If for some reason you do not, please follow up via email to ensure we received your original message.

Please include as much of the following information as possible:

- Type of issue (e.g. SQL injection, XSS, authentication bypass)
- Full paths of source file(s) related to the issue
- Location of the affected source code (tag/branch/commit or direct URL)
- Any special configuration required to reproduce the issue
- Step-by-step instructions to reproduce the issue
- Proof-of-concept or exploit code (if possible)
- Impact of the issue, including how an attacker might exploit it

We will acknowledge your email within 48 hours, and will send a more detailed response within 72 hours indicating the next steps in handling your report.

## Privacy Guarantee

Mintlens is built **privacy-first**:
- We never store LLM prompt content or response text
- Only usage metadata (token counts, latency, cost) is tracked
- All data is tenant-isolated with PostgreSQL Row-Level Security
- API keys are stored as SHA-256 hashes — never in plaintext
