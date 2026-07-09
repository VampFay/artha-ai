# Service Level Agreement (SLA)

**Effective Date:** January 1, 2025
**Version:** 2.0

## 1. Service Uptime Commitment

### 1.1 Production Tier
Artha AI commits to **99.95% monthly uptime** for the Production tier.

### 1.2 Uptime Calculation
Uptime = (Total Minutes in Month - Unplanned Downtime Minutes) / Total Minutes in Month × 100

### 1.3 Exclusions
Unplanned Downtime does not include:
- Scheduled maintenance (announced ≥ 7 days in advance)
- Force majeure events (Section 7)
- Customer-caused issues
- Issues with third-party services not controlled by Artha AI
- AWS region outages declared by AWS

## 2. Response Times

| Severity | Definition | Initial Response | Resolution Target |
|----------|------------|------------------|-------------------|
| **P0** | Service unavailable or data loss | 15 min (24/7) | 4 hr |
| **P1** | Major functionality broken, no workaround | 1 hr (business) | 8 hr |
| **P2** | Significant issue with workaround | 4 hr (business) | 24 hr |
| **P3** | Minor issue, feature request | 1 business day | 5 business days |
| **P4** | Cosmetic, documentation | 2 business days | Next release |

**Business hours**: Monday-Friday 9:00 AM - 6:00 PM IST (excluding Indian public holidays)

## 3. Escalation Matrix

### Level 1: Support Engineer
- All P0/P1/P2/P3/P4 cases start here
- Email: support@artha.ai
- Response per SLA above

### Level 2: Senior Engineer
- Auto-escalated if response SLA breached
- P0/P1 cases auto-escalated after 30 min

### Level 3: Engineering Manager
- P0/P1 cases auto-escalated after 1 hr if unresolved
- Customer may request escalation

### Level 4: CTO
- All P0 cases
- Customer may request via account manager

### Level 5: CEO
- P0 cases lasting > 4 hr
- Regulatory impact cases

## 4. Service Credits

### 4.1 Uptime Credits
If monthly uptime falls below 99.95%, Customer is eligible for service credits:

| Monthly Uptime | Credit |
|----------------|--------|
| 99.00% - 99.94% | 10% of monthly fees |
| 95.00% - 98.99% | 25% of monthly fees |
| Below 95.00% | 50% of monthly fees |

### 4.2 Response Time Credits
If response time SLA is breached:
- Per occurrence: 5% of monthly fees
- Maximum: 25% of monthly fees

### 4.3 Claim Process
Customer must request credits within 30 days of the incident. Credits are applied to the next invoice.

### 4.4 Maximum Credits
Total credits in any month cannot exceed 50% of monthly fees.

## 5. Maintenance Windows

### 5.1 Scheduled Maintenance
- **Window**: Sunday 2:00 AM - 6:00 AM IST
- **Notice**: At least 7 days in advance
- **Channels**: Email + in-app banner + status page

### 5.2 Emergency Maintenance
- **Notice**: As much as practical, minimum 1 hour
- **Approval**: CTO or designate

### 5.3 Zero-Downtime Deployments
All routine deployments use blue-green or canary strategy to maintain availability.

## 6. Support Channels

### 6.1 Production Tier
- 24/7 P0 support via phone: +91-[PHONE]
- Email: support@artha.ai
- Customer portal: https://support.artha.ai
- Status page: https://status.artha.ai

### 6.2 Enterprise Tier
- Dedicated Slack Connect channel
- Named Technical Account Manager
- Quarterly business reviews

## 7. Force Majeure

Neither party is liable for delays or failures due to:
- Natural disasters (earthquakes, floods, hurricanes)
- War, terrorism, civil unrest
- Government actions, sanctions
- Pandemics, epidemics
- Labor disputes (not involving the party's own employees)
- Internet backbone failures
- AWS region-wide outages

## 8. Performance Monitoring

### 8.1 Metrics
We monitor and report:
- API response time (p50, p95, p99)
- Error rate (HTTP 5xx)
- Uptime
- Queue depth
- Database connections

### 8.2 Customer Visibility
- Real-time status: https://status.artha.ai
- Monthly report: emailed by 5th of each month
- API for programmatic monitoring: GET /api/v1/health

## 9. Backup and Recovery

### 9.1 Backup Schedule
- **RDS**: Automated daily snapshots, 30-day retention
- **Documents**: S3 versioning + cross-region replication
- **Audit logs**: S3 with Object Lock (WORM), 10-year retention
- **Config**: Stored in Git + Secrets Manager

### 9.2 Recovery Objectives
- **RPO** (Recovery Point Objective): < 15 minutes
- **RTO** (Recovery Time Objective): < 4 hours
- **DR Strategy**: Active-passive, cross-region (ap-south-1 → ap-south-2)

### 9.3 Backup Testing
- Daily: Automated integrity check
- Monthly: Restore test on a snapshot
- Quarterly: Full DR drill

## 10. Security Incident Response

### 10.1 Notification
We notify Customer of security incidents within **72 hours** of confirmation, including:
- Nature of the incident
- Data affected (if any)
- Mitigation steps
- Estimated resolution time

### 10.2 Cooperation
We cooperate with Customer's investigation and provide:
- Forensic reports
- Audit trail extracts
- Root cause analysis
- Remediation plan

### 10.3 Regulatory Notification
If the incident triggers regulatory notification requirements:
- **Customer** notifies regulators (Customer is the Controller)
- **Artha AI** provides necessary documentation

## 11. Change Management

### 11.1 Notification of Changes
We notify Customer of:
- Material feature changes: 30 days
- API breaking changes: 90 days
- Deprecation: 6 months
- Security patching: as needed (may be no-notice for critical)

### 11.2 Backward Compatibility
APIs maintain backward compatibility for at least 12 months after deprecation notice.

## 12. Customer Responsibilities

To receive SLA benefits, Customer must:
- Use the Service in compliance with the Terms of Service
- Maintain current contact information
- Provide timely access for troubleshooting
- Use supported configurations
- Report issues promptly with sufficient detail

## 13. Limitation of Liability

SLA remedies (service credits) are Customer's sole and exclusive remedy for SLA breaches, subject to the Terms of Service liability cap.

## 14. SLA Review

This SLA is reviewed annually with each Enterprise customer during the QBR.

## 15. Contact

**Artha AI Support**
- Email: support@artha.ai
- Phone (24/7 P0): +91-[PHONE]
- Status page: https://status.artha.ai

---

*SLA Version 2.0 — Effective January 1, 2025*
