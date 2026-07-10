# Bug Bounty Program

**Version:** 1.0
**Effective Date:** January 1, 2025

## 1. Program Overview

Artha AI operates a coordinated vulnerability disclosure program to encourage responsible reporting of security vulnerabilities. We are committed to working with security researchers to protect our customers' data.

## 2. Scope

### 2.1 In Scope

| Target | URL |
|--------|-----|
| Web application | https://app.artha.ai |
| API v1 | https://api.artha.ai/api/v1/* |
| SSO endpoints | https://api.artha.ai/api/sso/* |
| SCIM endpoints | https://api.artha.ai/api/scim/* |
| Mobile API (if any) | https://api.artha.ai/api/mobile/* |

### 2.2 Out of Scope

- Third-party services (AWS, Stripe, Twilio)
- Marketing website (https://artha.ai) — report via separate form
- Social engineering of Artha AI employees or customers
- Physical attacks against Artha AI facilities
- Denial of Service (DoS/DDoS) attacks — report theoretical concerns only
- Automated scanner output without manual verification
- Vulnerabilities in outdated browsers/clients
- Spam or social engineering of Artha AI users

## 3. Reward Structure

| Severity | Criteria | Reward (USD) |
|----------|----------|--------------|
| **Critical** | RCE, SQLi with data access, auth bypass, IDOR exposing all users' data | $5,000 - $15,000 |
| **High** | Stored XSS with admin impact, SSRF, privilege escalation, SSO bypass | $1,500 - $5,000 |
| **Medium** | Reflected XSS, CSRF on state-changing actions, information disclosure | $500 - $1,500 |
| **Low** | Security misconfiguration, missing rate limits, verbose error messages | $100 - $500 |
| **Note** | Best practices issues, theoretical issues without PoC | Recognition only |

### 3.1 Bonuses
- **First to report**: +20% if first valid report of a unique issue
- **Excellent writeup**: +20% for exceptional documentation
- **Bank-grade finding**: +50% if vulnerability specifically affects financial data isolation

## 4. Rules of Engagement

### 4.1 You MUST:
- Test only on accounts you own or have explicit permission to test
- Stop testing immediately upon finding a vulnerability and report it
- Provide detailed reproduction steps and PoC
- Allow reasonable time for remediation (90 days standard)
- Respect customer data — do not access, modify, or exfiltrate other users' data
- Report within 24 hours of discovery

### 4.2 You MUST NOT:
- Access data that does not belong to you
- Modify or destroy any data
- Use automated scanning tools that generate excessive traffic
- Disclose vulnerability details publicly before we fix it
- Demand payment as a condition of reporting
- Test on production customer data (use test accounts only)
- Attempt to attack our employees, customers, or infrastructure beyond the scope
- Use social engineering techniques

## 5. Reporting a Vulnerability

### 5.1 How to Report
Submit reports to: **security@artha.ai**

Include:
1. **Vulnerability description** — what and where
2. **Reproduction steps** — step-by-step
3. **Proof of Concept** — minimal PoC
4. **Impact assessment** — what an attacker could do
5. **Suggested remediation** (optional but appreciated)
6. **Your name/handle** for recognition
7. **Payment details** (if you want the reward)

### 5.2 What We Do
1. **Acknowledge** within 24 hours
2. **Triage** within 72 hours (assign severity)
3. **Communicate** progress throughout remediation
4. **Fix** within timelines:
   - Critical: 7 days
   - High: 30 days
   - Medium: 60 days
   - Low: 90 days
5. **Notify you** when fixed
6. **Pay reward** within 30 days of fix
7. **Recognize** on our Hall of Fame (with your permission)

## 6. Safe Harbor

We will not pursue legal action against researchers who:
- Make a good faith effort to comply with this policy
- Avoid privacy violations, destruction of data, and interruption of services
- Report vulnerabilities promptly
- Do not access data beyond what's necessary to demonstrate the issue
- Do not publicly disclose the issue before we fix it

## 7. Public Disclosure

### 7.1 Coordinated Disclosure
We support coordinated disclosure. After we fix the vulnerability:
- You may publish technical details 90 days after initial report
- We will publish a security advisory on our blog
- We will credit you (with your permission)

### 7.2 Restriction
You may NOT publish details that could enable attacks on unpatched systems.

## 8. Hall of Fame

We maintain a Hall of Fame at https://artha.ai/security/hall-of-fame recognizing researchers who have helped improve our security.

## 9. Exclusions

The following are NOT eligible for rewards:
- Vulnerabilities already known to us (we'll tell you)
- Vulnerabilities reported by another researcher first
- Issues in third-party software (report to vendor)
- Vulnerabilities requiring physical access to a victim's device
- Clickjacking on pages with no sensitive actions
- Missing security headers with no demonstrable impact
- Self-XSS
- Logout CSRF
- Path disclosure without sensitive data
- Issues requiring outdated browsers

## 10. Legal

This program is voluntary. We reserve the right to:
- Modify the program at any time
- Decline reports that don't meet our criteria
- Terminate engagement with researchers who violate the rules

The program does NOT create an employment relationship.

## 11. Contact

- **Email**: security@artha.ai
- **PGP Key**: [fingerprint] (available at https://artha.ai/pgp-key.asc)
- **Status page**: https://status.artha.ai

---

*Bug Bounty Program Version 1.0 — Effective January 1, 2025*
