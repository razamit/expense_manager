# Security Policy

## Scope

FinanceChecker is a **local-first personal finance tool**. It runs entirely on your own machine and stores data in a local SQLite database. No data is transmitted to external servers by this application.

The primary security surface is:

- **Credential encryption** — scraping credentials encrypted at rest with AES-256-GCM and a PBKDF2-derived key from your master password.
- **Master password handling** — verified locally via a stored PBKDF2 hash; never transmitted.
- **Browser automation** — Puppeteer scrapes your bank accounts in a sandboxed browser process.

## Reporting a Vulnerability

**Do not open a public GitHub issue for security vulnerabilities.**

If you find a security issue, please report it privately:

1. Email **razamit23@gmail.com** with the subject line `[FinanceChecker Security]`.
2. Describe the vulnerability, steps to reproduce, and potential impact.
3. Allow reasonable time for a response before any public disclosure.

## Important Reminders for Self-Hosters

- Keep your master password strong and unique.
- Do not expose the app on a public network — it has no multi-user auth layer.
- Do not commit `config/credentials.enc`, `.env`, or `prisma/dev.db` to any repository.
- Treat the `config/` directory as sensitive, even though credentials are encrypted.

## Supported Versions

Only the latest commit on `main` is supported. No security patches are backported to older versions.
