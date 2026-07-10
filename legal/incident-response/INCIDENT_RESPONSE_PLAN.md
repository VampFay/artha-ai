# Incident Response Plan

**Version:** 2.0
**Last Updated:** January 1, 2025
**Owner:** Head of Engineering
**Approved By:** CTO

## 1. Purpose

This Incident Response Plan ("IRP") defines the process for detecting, responding to, and recovering from security incidents at Artha AI. It ensures:
- Rapid detection and containment
- Minimized business impact
- Regulatory compliance (RBI, DPDP Act, GDPR)
- Customer transparency
- Continuous improvement

## 2. Incident Classification

### 2.1 Severity Levels

| Severity | Description | Examples | Response |
|----------|-------------|----------|----------|
| **SEV-1 (P0)** | Critical: Service down or data breach confirmed | Production outage, confirmed PII exfiltration, ransomware | 24/7, exec notify, war room |
| **SEV-2 (P1)** | Major: Significant degradation or likely breach | API errors > 5%, suspected intrusion, audit chain break | 24/7, manager notify |
| **SEV-3 (P2)** | Moderate: Limited impact | Single feature broken, rate limit spike, suspicious activity | Business hours |
| **SEV-4 (P3)** | Low: Minor issue | Slow query, single customer report, false positive alert | Business hours |

### 2.2 Incident Categories
1. **Data Breach**: Unauthorized access to, or disclosure of, Personal Data
2. **Service Outage**: Service unavailable to customers
3. **Security Incident**: Suspected intrusion, malware, or unauthorized access
4. **Compliance Incident**: Failure to meet regulatory requirement
5. **Vendor Incident**: Sub-processor reports an incident affecting our data
6. **Insider Threat**: Misuse of access by employee or contractor

## 3. Roles and Responsibilities

### 3.1 Incident Commander (IC)
- **Role**: Drives the incident response, makes critical decisions
- **Default**: On-call engineering manager
- **Backup**: Head of Engineering, CTO
- **Authority**: Override normal procedures to contain the incident

### 3.2 Communications Lead
- **Role**: Manages internal and external communications
- **Default**: Head of Customer Success
- **Backup**: Marketing Director

### 3.3 Legal/Compliance Lead
- **Role**: Assesses legal and regulatory obligations
- **Default**: General Counsel
- **Backup**: External legal counsel
- **Responsibilities**: Determine notification requirements, liaise with regulators

### 3.4 Technical Lead
- **Role**: Executes technical response (containment, eradication, recovery)
- **Default**: Senior engineer on-call
- **Backup**: Engineering Manager

### 3.5 Executive Sponsor
- **Role**: Executive oversight, resource authorization
- **Default**: CTO (SEV-1/2), Head of Engineering (SEV-3/4)

### 3.6 Customer Liaison
- **Role**: Communicates with affected customers
- **Default**: Customer Success Manager
- **Backup**: Account Executive

## 4. Incident Response Phases

### Phase 1: Detection and Identification (≤ 15 min)

**Sources of detection:**
- Automated alerts (CloudWatch, Sentry, security events)
- Customer reports (support@artha.ai, status page)
- Employee reports
- Third-party notifications (AWS security, researchers)
- SIEM (Security Information and Event Management)

**Actions:**
1. Acknowledge alert within 5 min (PagerDuty)
2. Initial triage: classify severity
3. Create incident channel: `#incident-[YYYYMMDD]-[slug]`
4. Page Incident Commander if SEV-1/2
5. Begin timeline log (append to incident channel)

### Phase 2: Containment (≤ 30 min)

**Objective**: Stop the bleeding without destroying evidence.

**Actions for SEV-1 (Data Breach):**
1. Isolate affected systems (security groups, network policies)
2. Revoke compromised credentials (IAM keys, API tokens, sessions)
3. Preserve evidence: snapshot affected instances, copy logs
4. Block malicious IPs at WAF
5. Disable affected user accounts
6. Rotate encryption keys (if compromise suspected)

**Actions for SEV-1 (Service Outage):**
1. Identify failed component
2. Rollback recent deployments (if cause)
3. Scale up healthy resources
4. Switch to DR if primary unrecoverable (see DR_RUNBOOK.md)

### Phase 3: Eradication (≤ 2 hr)

**Objective**: Remove the root cause.

**Actions:**
1. Identify root cause (5 Whys)
2. Apply patches/fixes
3. Remove malware/unauthorized access
4. Validate fix with security team
5. Scan for persistence mechanisms
6. Verify audit chain integrity

### Phase 4: Recovery (≤ 4 hr)

**Objective**: Restore normal operations.

**Actions:**
1. Restore services from clean state
2. Verify data integrity (audit chain, DB checksums)
3. Monitor for recurrence
4. Gradually restore customer access
5. Confirm with smoke tests
6. Update status page

### Phase 5: Post-Incident Review (≤ 7 days)

**Objective**: Learn and prevent recurrence.

**Actions:**
1. Schedule PIR meeting within 5 business days
2. Document:
   - Timeline (minute-by-minute)
   - Root cause
   - What went well
   - What went poorly
   - Action items (with owners and deadlines)
3. Update runbooks and IRP based on lessons learned
4. Share sanitized version with team

## 5. Communication Plan

### 5.1 Internal Communications
- **SEV-1/2**: Slack `#incidents` + PagerDuty + email to execs
- **SEV-3**: Slack `#incidents` + email to engineering
- **SEV-4**: Slack `#engineering` only

### 5.2 Customer Communications

| Timing | SEV-1 | SEV-2 | SEV-3 | SEV-4 |
|--------|-------|-------|-------|-------|
| Initial (≤ 30 min) | Status page + email all | Status page | Status page | N/A |
| Updates (every 30 min) | Status page + Slack | Status page (every hr) | Status page (every 4 hr) | N/A |
| Resolution | Status page + email all | Status page + email affected | Status page | N/A |
| Post-mortem (5 days) | Email all with summary | Email affected | Status page | N/A |

### 5.3 Regulatory Notifications

#### DPDP Act (India)
- **Trigger**: Personal data breach affecting any Data Principal
- **Timeline**: Within **72 hours** of becoming aware
- **Notify**: Data Protection Board of India + affected individuals
- **Method**: Email to dpb-india@gov.in + individual notifications
- **Content**: Nature of breach, data affected, mitigation, contact

#### GDPR (EU customers)
- **Trigger**: Personal data breach (risk to Data Subjects)
- **Timeline**: Within **72 hours** of becoming aware
- **Notify**: Lead Supervisory Authority
- **Method**: Online form via authority's website
- **Content**: Nature, DPO contact, consequences, mitigation

#### RBI (Indian regulated entities)
- **Trigger**: Incident affecting customer data or service availability > 4 hr
- **Timeline**: Within **24 hours** of detection
- **Notify**: RBI Department of Banking Supervision
- **Method**: Email + phone to regional RBI office
- **Content**: Description, impact, mitigation, customer notification

#### SEBI (for capital markets entities)
- **Trigger**: Cyber incident affecting operations or investor data
- **Timeline**: Within **6 hours** of detection (SEBI circular dated Aug 2023)
- **Notify**: SEBI Cyber Security Cell
- **Method**: Email to cybercell@sebi.gov.in

## 6. Evidence Preservation

For any incident that may lead to legal/regulatory action:

1. **Snapshot affected EC2 instances** (do not terminate)
2. **Capture VPC flow logs** for the incident timeframe
3. **Export CloudTrail logs** for the past 90 days
4. **Freeze S3 access logs**
5. **Preserve audit chain entries** (do not modify)
6. **Document everything** in the incident channel (timestamps in UTC)
7. **Chain of custody**: track who accessed evidence and when

Evidence retention: 10 years (per SOC 2 + RBI requirements).

## 7. On-Call Schedule

### 7.1 Primary On-Call (24/7)
- **Primary**: Engineering Manager (1-week rotation)
- **Secondary**: Senior Engineer (1-week rotation)
- **Escalation**: Head of Engineering → CTO

### 7.2 PagerDuty Configuration
- **SEV-1**: Pages primary, then secondary after 5 min, then Head of Eng after 15 min
- **SEV-2**: Pages primary, then secondary after 15 min
- **SEV-3**: Email-only to on-call engineer
- **SEV-4**: Slack notification only

### 7.3 Override
IC may override on-call schedule and page any team member.

## 8. Tools and Resources

| Tool | Purpose | Access |
|------|---------|--------|
| PagerDuty | Alerting and on-call | https://artha.pagerduty.com |
| Slack #incidents | Real-time coordination | All engineers |
| Status page | Customer comms | https://status.artha.ai |
| AWS Console | Infrastructure | SSO via Okta |
| Incident report template | Documentation | Confluence |
| Forensic toolkit | Evidence collection | S3 bucket: artha-forensics |

## 9. Training and Testing

### 9.1 Training
- **New hire**: IRP overview within first 30 days
- **All engineers**: Annual IRP refresher
- **On-call engineers**: Quarterly tabletop exercise
- **Incident commanders**: Quarterly simulation

### 9.2 Testing
- **Tabletop exercise**: Quarterly (1 hour)
- **DR drill**: Semi-annual (4 hours, real failover)
- **Red team exercise**: Annual (external firm)
- **Chaos engineering**: Monthly (game days)

## 10. Incident Metrics

We track and report:
- **MTTD** (Mean Time to Detect): target < 15 min for SEV-1
- **MTTR** (Mean Time to Resolve): target < 4 hr for SEV-1
- **MTTC** (Mean Time to Communicate): target < 30 min for SEV-1
- **Recurrence rate**: target < 10% (incidents caused by same root cause)

## 11. Authority and Activation

This IRP may be activated by:
- Incident Commander
- Head of Engineering
- CTO
- Any engineer for SEV-1 incidents (page IC)

## 12. Plan Maintenance

- **Review**: Quarterly by Head of Engineering
- **Update**: After every SEV-1/2 incident (PIR action item)
- **Approval**: CTO signs off on all changes

## 13. Contact List

### Internal
| Role | Name | PagerDuty | Phone |
|------|------|-----------|-------|
| CTO | ___ | @cto-oncall | +91-___ |
| Head of Engineering | ___ | @head-eng-oncall | +91-___ |
| DPO | ___ | N/A | +91-___ |
| General Counsel | ___ | N/A | +91-___ |

### External
| Entity | Contact | Purpose |
|--------|---------|---------|
| AWS Support | enterprise-support | Infrastructure incidents |
| PagerDuty Support | support@pagerduty.com | Alerting issues |
| Forensics firm | [Engaged firm] | Incident investigation |
| Legal counsel | [Law firm] | Legal advice |
| Insurance broker | [Broker] | Cyber insurance claims |
| CERT-In | incident@cert-in.org.in | Indian cybersecurity incidents |
| Data Protection Board | N/A (new body) | DPDP Act notifications |

---

*IRP Version 2.0 — Effective January 1, 2025*
