# Poof - One-Time Secret Sharing Service

## Product Requirements Document (PRD)

### 1. Product Overview

**Poof** is a secure, one-time secret sharing service that enables users to share sensitive information (passwords, API keys, tokens, etc.) using end-to-end encryption (E2EE). Secrets are encrypted client-side, shared via a unique link, and automatically deleted after being read once or upon expiry.

### 2. Problem Statement

Users need to share sensitive information securely:
- Passwords to team members
- API keys during onboarding
- Database credentials for setup
- SSH keys or tokens

Current options have flaws:
- **Email/Slack**: Not encrypted, persists in chat history
- **Password managers**: Require both parties to have accounts
- **Pastebin-like services**: No encryption, no auto-delete

### 3. Target Users

- Developers sharing credentials
- DevOps teams distributing secrets
- IT administrators provisioning access
- Anyone needing secure one-time communication

### 4. Core Features

| Feature | Priority | Description |
|---------|----------|-------------|
| Create Secret | P0 | User enters text, gets encrypted link |
| Read Secret | P0 | Recipient opens link, sees secret once |
| Auto-Delete | P0 | Secret deleted after first read |
| Expiry Timer | P0 | Secrets expire after configurable time |
| Client-Side Encryption | P0 | Server never sees plaintext |
| CLI Interface | P1 | Create/read secrets from terminal |
| Web Interface | P1 | Beautiful, intuitive UI |
| View Count Limit | P1 | Configurable max views (default: 1) |
| Password Protection | P2 | Optional passphrase for extra security |
| Metadata Display | P2 | Show creation time, remaining views |
| Dark Mode | P3 | Theme preference |

### 5. User Stories

#### As a Secret Creator:
1. I want to paste a secret and get a shareable link
2. I want the secret encrypted before leaving my device
3. I want to set an expiration time (5 min, 1 hour, 1 day, etc.)
4. I want to know when my secret was accessed
5. I want to use this from CLI or web browser

#### As a Secret Recipient:
1. I want to click a link and see the secret
2. I want to copy the secret with one click
3. I want to know if the secret has been viewed
4. I want clear messaging when secret is expired/deleted

### 6. Security Requirements

- **Zero-knowledge architecture**: Server never sees plaintext secrets
- **Client-side encryption**: All encryption/decryption happens in browser/CLI
- **One-time access**: Secrets deleted after first read
- **No logging of secrets**: Server logs metadata only
- **HTTPS only**: All communication encrypted in transit
- **Short-lived links**: UUID-based, unguessable URLs

### 7. Success Metrics

| Metric | Target |
|--------|--------|
| Time to share secret | < 10 seconds |
| Encryption/decryption speed | < 100ms |
| Service uptime | 99.9% |
| Zero security incidents | 0 breaches |
| User satisfaction | > 4.5/5 rating |

### 8. Constraints

- **Zero cost to run**: All infrastructure uses free tiers
- Free to use (no auth required)
- No database backups containing plaintext
- Maximum secret size: 1MB
- Link format: `https://poof.example.com/s/{uuid}`

### 9. Infrastructure (100% Free)

| Layer | Provider | Free Tier |
|-------|----------|-----------|
| Frontend | Vercel | 100 GB bandwidth, SSL |
| Backend | Render | 750 hrs/month, custom domains |
| Database | Neon PostgreSQL | 0.5 GB, 100 CU-hours |
| Cache | Upstash Redis | 256 MB, 500K commands |

**Total Monthly Cost: $0**

### 10. Out of Scope (v1)

- User accounts/authentication
- Team workspaces
- Secret rotation
- API integrations (webhooks, etc.)
- File attachments (text only)

---

*Version: 1.0 | Status: Draft | Last Updated: 2024*
