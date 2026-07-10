# Disaster Recovery Runbook

## Overview

| Metric | Target | Notes |
|--------|--------|-------|
| **RPO** (Recovery Point Objective) | < 15 min | Cross-region async replication |
| **RTO** (Recovery Time Objective) | < 4 hr | From declaration to full service |
| **DR Region** | ap-south-2 (Hyderabad) | Active-passive |
| **DR Strategy** | Warm standby | RDS read replica + S3 CRR |
| **Test Cadence** | Quarterly | Mandated by RBI |

## Architecture

```
Primary Region (ap-south-1 Mumbai)
├── EKS Cluster (3 nodes, 3 AZs)
├── RDS PostgreSQL Multi-AZ
├── ElastiCache Redis Multi-AZ
├── S3 Documents Bucket
├── MSK Kafka (3 brokers)
└── CloudFront + WAF
        │
        │ (async replication)
        ▼
DR Region (ap-south-2 Hyderabad)
├── EKS Cluster (1 node, standby)
├── RDS PostgreSQL Read Replica ← promoted on failover
├── ElastiCache Redis (single node)
├── S3 Documents Bucket ← CRR
└── CloudFront (secondary origin)
```

## Declaration Criteria

Declare DR if **any** of:
- Primary region unavailable for > 30 min
- Primary RDS unreachable for > 15 min
- Data corruption confirmed in primary
- AWS posts a regional outage with no ETA

## Decision Authority
- **P0 (severe)**: CTO + Head of Engineering (joint decision)
- **P1**: Head of Engineering
- Notify: Board, regulators (RBI within 24 hr if customer data affected)

## Failover Procedure

### Step 1: Declare DR (5 min)
```bash
# Set environment flag
export DR_MODE=active

# Update Route53 health check to fail DR region
aws route53 change-resource-record-sets \
  --hosted-zone-id Z1234567890 \
  --change-batch '{
    "Changes": [{
      "Action": "UPSERT",
      "ResourceRecordSet": {
        "Name": "api.artha.ai",
        "Type": "A",
        "AliasTarget": {
          "DNSName": "d1234567890.cloudfront.net",
          "EvaluateTargetHealth": true
        }
      }
    }]
  }'
```

### Step 2: Promote RDS Read Replica (10 min)
```bash
# Promote the DR replica to primary
aws rds promote-read-replica \
  --db-instance-identifier artha-ai-production-postgres-dr \
  --region ap-south-2

# Wait for promotion to complete
aws rds wait db-instance-available \
  --db-instance-identifier artha-ai-production-postgres-dr \
  --region ap-south-2

# Update connection string in Secrets Manager (DR region)
aws secretsmanager update-secret \
  --secret-id artha-ai-production/db/credentials \
  --secret-string '{"username":"artha_admin","password":"...","host":"artha-ai-production-postgres-dr.xxx.ap-south-2.rds.amazonaws.com","port":5432,"dbname":"artha"}' \
  --region ap-south-2
```

### Step 3: Scale Up DR EKS Cluster (15 min)
```bash
# Update kubeconfig for DR region
aws eks update-kubeconfig \
  --name artha-ai-production-cluster-dr \
  --region ap-south-2

# Scale up deployment
kubectl scale deployment artha-app -n artha --replicas=3

# Wait for pods to be ready
kubectl rollout status deployment/artha-app -n artha --timeout=600s
```

### Step 4: Verify Service Health (10 min)
```bash
# Check health endpoint
curl -f https://api.artha.ai/api/v1/health
# Expected: {"status":"healthy"}

# Check audit chain integrity
curl -f -H "Authorization: Bearer $TOKEN" \
  https://api.artha.ai/api/v1/audit?verify_chain=true

# Run smoke tests
./scripts/smoke-tests.sh
```

### Step 5: Notify Stakeholders
- [ ] Engineering team (Slack #incidents)
- [ ] Customer success team (email customers)
- [ ] Compliance team (if PII involved)
- [ ] Legal team (if regulator notification needed)
- [ ] AWS support (if AWS-caused)

## Failback Procedure

When primary region is restored:

1. **Re-establish replication**: Create new read replica in DR region from promoted DR primary
2. **Test primary**: Deploy to primary, run smoke tests
3. **Migrate back**: Stop writes to DR, capture delta, replay to primary
4. **Switch DNS**: Route53 back to primary CloudFront
5. **Verify**: Run full test suite
6. **Decommission DR**: Scale down DR cluster

## Testing Schedule

| Test | Frequency | Owner | Notes |
|------|-----------|-------|-------|
| Tabletop exercise | Quarterly | CTO | Walk-through only |
| DR drill | Semi-annually | Head of Eng | Real failover to DR |
| Backup restore test | Monthly | DBA | Restore snapshot to temp instance |
| Audit chain verification | Daily (automated) | Platform | Hash chain integrity check |

## Contact List

| Role | Name | Phone | Email |
|------|------|-------|-------|
| CTO | ___ | ___ | ___ |
| Head of Engineering | ___ | ___ | ___ |
| DBA | ___ | ___ | ___ |
| AWS TAM | ___ | ___ | ___ |
| Legal Counsel | ___ | ___ | ___ |
| Compliance Officer | ___ | ___ | ___ |

## Regulatory Notification

### RBI (India)
- **Trigger**: Any incident affecting customer data or service availability > 4 hr
- **Timeline**: Within 24 hr of detection
- **Method**: Email to RBI Department of Banking Supervision
- **Required info**: Incident description, data affected, mitigation, customer notification plan

### DPDP Act (India)
- **Trigger**: Personal data breach affecting any Data Principal
- **Timeline**: Within 72 hr of becoming aware
- **Method**: Notification to Data Protection Board of India + affected individuals
- **Required info**: Nature of breach, data categories affected, number of individuals affected, mitigation

### GDPR (EU customers only)
- **Trigger**: Personal data breach
- **Timeline**: Within 72 hr of becoming aware
- **Method**: Notification to supervisory authority + affected individuals (if high risk)
- **Required info**: Nature of breach, DPO contact, likely consequences, mitigation

## Post-Incident Review

Within 7 days of DR event:
1. **Root cause analysis** document (5 Whys)
2. **Timeline** of detection, declaration, recovery
3. **What went well / poorly**
4. **Action items** with owners and deadlines
5. **Update runbook** with lessons learned
6. **Customer communication** review

## Audit Trail

All DR activities are recorded in the audit chain:
- DR declaration (who, when, why)
- Failover steps (each step logged)
- Verification results
- Customer notifications sent
- Regulatory notifications sent

These records are retained for 10 years per RBI requirement.
