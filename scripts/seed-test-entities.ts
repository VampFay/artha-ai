/**
 * Seed diverse test entity cases for the Entities Portal.
 * Creates 12 entities across all categories with realistic data + tax computation.
 *
 * Usage: bun run scripts/seed-test-entities.ts
 *
 * Entities created:
 *   1. Pvt Ltd — Acme Software Solutions Pvt Ltd (IT/ITES)
 *   2. Manufacturing — Bharat Steel Works Ltd (§115BAB)
 *   3. Bank — HDFC Bank Ltd (RBI-regulated)
 *   4. NBFC — Bajaj Finance Ltd
 *   5. Insurance — LIC of India
 *   6. University (Govt) — IIT Bombay
 *   7. University (Private) — BITS Pilani
 *   8. School — Delhi Public School
 *   9. Trust/NGO — Tata Trust
 *  10. LLP — Khaitan & Co LLP (law firm)
 *  11. Government Dept — Ministry of Finance
 *  12. MSME Medium — Artha Tech Solutions
 *  13. E-commerce — Flipkart
 *  14. Real Estate — Lodha Developers
 *  15. Fintech PA — Razorpay
 */

import { db } from "../src/lib/db";
import { hashPassword } from "../src/lib/auth";
import type { EntityType } from "../src/lib/entity/types";
import type { EntityTaxInput } from "../src/lib/entity/tax-engine";

const TEST_EMAIL = "admin@finsight.ai";

interface TestCase {
  name: string;
  legalName: string;
  entityType: EntityType;
  pan: string;
  gstin: string;
  cin?: string;
  tan?: string;
  city: string;
  state: string;
  industry: string;
  turnover: number;
  contactEmail: string;
  contactPhone: string;
  taxInput: Partial<EntityTaxInput> & { grossIncome: number };
  metadata?: Record<string, any>;
}

const testCases: TestCase[] = [
  {
    name: "Acme Software Solutions Pvt Ltd",
    legalName: "Acme Software Solutions Private Limited",
    entityType: "it_ites_company",
    pan: "ABCAZ1234F",
    gstin: "27ABCAZ1234F1Z5",
    cin: "U72200MH2020PTC345678",
    tan: "MUMA12345B",
    city: "Pune",
    state: "Maharashtra",
    industry: "IT services, SaaS",
    turnover: 250000000,
    contactEmail: "finance@acmesoft.com",
    contactPhone: "+91 20 1234 5678",
    taxInput: {
      grossIncome: 250000000,
      gst: { outputTax: 45000000, inputTaxCredit: 12000000, rcmLiability: 500000 },
      tdsDeducted: 5000000,
      advanceTaxPaid: 30000000,
      avgNetProfit3yr: 80000000,
      stampDutyPaid: 200000,
    },
    metadata: { stpiRegistered: true, sezUnit: false, exportTurnover: 50000000 },
  },
  {
    name: "Bharat Steel Works Ltd",
    legalName: "Bharat Steel Works Limited",
    entityType: "manufacturing_unit",
    pan: "AAFCB5678G",
    gstin: "27AAFCB5678G1Z2",
    cin: "U27100MH2019PTC321098",
    tan: "MUMA67890C",
    city: "Nagpur",
    state: "Maharashtra",
    industry: "Steel manufacturing",
    turnover: 500000000,
    contactEmail: "tax@bharatsteel.in",
    contactPhone: "+91 712 234 5678",
    taxInput: {
      grossIncome: 500000000,
      gst: { outputTax: 90000000, inputTaxCredit: 70000000, rcmLiability: 0 },
      tdsDeducted: 8000000,
      advanceTaxPaid: 60000000,
      avgNetProfit3yr: 150000000,
      customsDutyPaid: 5000000,
      stampDutyPaid: 1000000,
    },
    metadata: { incorporatedAfter: "2019-10-01", babElected: true, plantLocation: "Nagpur MIDC" },
  },
  {
    name: "HDFC Bank Ltd",
    legalName: "HDFC Bank Limited",
    entityType: "bank",
    pan: "AAACH2702H",
    gstin: "27AAACH2702H1Z6",
    cin: "L65120MH1994PLC080647",
    tan: "MUMH01234D",
    city: "Mumbai",
    state: "Maharashtra",
    industry: "Banking",
    turnover: 200000000000,
    contactEmail: "investor.relations@hdfcbank.com",
    contactPhone: "+91 22 6666 3333",
    taxInput: {
      grossIncome: 200000000000,
      gst: { outputTax: 5000000000, inputTaxCredit: 2000000000, rcmLiability: 0 },
      tdsDeducted: 5000000000,
      advanceTaxPaid: 40000000000,
      avgNetProfit3yr: 60000000000,
      stampDutyPaid: 50000000,
    },
    metadata: { rbiLicenseNo: "DB098", listed: "NSE/BSE", slrCompliance: 18, crrCompliance: 4.5, pslTarget: 40 },
  },
  {
    name: "Bajaj Finance Ltd",
    legalName: "Bajaj Finance Limited",
    entityType: "nbfc",
    pan: "AAACB8362K",
    gstin: "27AAACB8362K1Z9",
    cin: "L65929MH1987PLC042937",
    tan: "MUMB56789E",
    city: "Pune",
    state: "Maharashtra",
    industry: "NBFC — consumer lending",
    turnover: 50000000000,
    contactEmail: "compliance@bajajfinserv.in",
    contactPhone: "+91 20 3975 2000",
    taxInput: {
      grossIncome: 50000000000,
      gst: { outputTax: 800000000, inputTaxCredit: 300000000, rcmLiability: 0 },
      tdsDeducted: 1000000000,
      advanceTaxPaid: 8000000000,
      avgNetProfit3yr: 15000000000,
      stampDutyPaid: 10000000,
    },
    metadata: { rbiRegistrationNo: "N-05.00738", assetClass: "A", bnplPortfolio: true },
  },
  {
    name: "LIC of India",
    legalName: "Life Insurance Corporation of India",
    entityType: "insurance_company",
    pan: "AAACL8989L",
    gstin: "27AAACL8989L1Z3",
    cin: "U66010MH1956PLC008425",
    tan: "MUMC98765F",
    city: "Mumbai",
    state: "Maharashtra",
    industry: "Life insurance",
    turnover: 800000000000,
    contactEmail: "tax@licindia.com",
    contactPhone: "+91 22 6789 0000",
    taxInput: {
      grossIncome: 800000000000,
      gst: { outputTax: 0, inputTaxCredit: 0, rcmLiability: 500000000 }, // individual life GST-exempt post Sep 2025
      tdsDeducted: 5000000000,
      advanceTaxPaid: 150000000000,
      avgNetProfit3yr: 40000000000,
      stampDutyPaid: 200000000,
    },
    metadata: { irdaiRegNo: "LIC-001", solvencyRatio: 1.52, policyCount: 290000000 },
  },
  {
    name: "IIT Bombay",
    legalName: "Indian Institute of Technology Bombay",
    entityType: "university_govt",
    pan: "AAATI1234M",
    gstin: "27AAATI1234M1Z7",
    city: "Mumbai",
    state: "Maharashtra",
    industry: "Higher education — engineering",
    turnover: 10000000000,
    contactEmail: "accounts@iitb.ac.in",
    contactPhone: "+91 22 2572 2545",
    taxInput: {
      grossIncome: 10000000000,
      tdsDeducted: 50000000,
      advanceTaxPaid: 0,
      stampDutyPaid: 500000,
    },
    metadata: { ugcApproved: true, instituteOfNationalImportance: true, nirfRank: 3, studentCount: 12000 },
  },
  {
    name: "BITS Pilani",
    legalName: "Birla Institute of Technology and Science, Pilani",
    entityType: "university_private",
    pan: "AAABT5678N",
    gstin: "33AAABT5678N1Z4",
    cin: "U80300RJ1964NPL001278",
    city: "Pilani",
    state: "Rajasthan",
    industry: "Higher education — deemed university",
    turnover: 5000000000,
    contactEmail: "finance@bits-pilani.ac.in",
    contactPhone: "+91 1596 515 221",
    taxInput: {
      grossIncome: 5000000000,
      gst: { outputTax: 0, inputTaxCredit: 0, rcmLiability: 200000 }, // core education exempt
      tdsDeducted: 20000000,
      advanceTaxPaid: 5000000,
      stampDutyPaid: 300000,
    },
    metadata: { ugcApproved: true, deemedUniversity: true, campuses: ["Pilani", "Goa", "Hyderabad", "Dubai"] },
  },
  {
    name: "Delhi Public School RK Puram",
    legalName: "Delhi Public School, R.K. Puram",
    entityType: "school",
    pan: "AAATD9012P",
    gstin: "07AAATD9012P1Z8",
    city: "New Delhi",
    state: "Delhi",
    industry: "K-12 education",
    turnover: 200000000,
    contactEmail: "accounts@dpsrkpuram.net",
    contactPhone: "+91 11 2610 1234",
    taxInput: {
      grossIncome: 200000000,
      tdsDeducted: 5000000,
      advanceTaxPaid: 0,
      stampDutyPaid: 100000,
    },
    metadata: { cbse: true, trustRun: true, studentCount: 8000, classes: "Nursery-XII" },
  },
  {
    name: "Tata Trusts",
    legalName: "Sir Ratan Tata Trust & Allied Trusts",
    entityType: "trust_ngo",
    pan: "AAATT3456Q",
    city: "Mumbai",
    state: "Maharashtra",
    industry: "Charitable trust",
    turnover: 1000000000,
    contactEmail: "accounts@tatatrusts.org",
    contactPhone: "+91 22 6665 8282",
    taxInput: {
      grossIncome: 1000000000,
      tdsDeducted: 5000000,
      advanceTaxPaid: 0,
      stampDutyPaid: 500000,
    },
    metadata: { reg12ab: true, reg80g: true, applied85pct: true, csrEligible: true },
  },
  {
    name: "Khaitan & Co LLP",
    legalName: "Khaitan & Co LLP",
    entityType: "llp",
    pan: "AAAFK7890R",
    gstin: "27AAAFK7890R1Z1",
    city: "Mumbai",
    state: "Maharashtra",
    industry: "Legal services",
    turnover: 800000000,
    contactEmail: "tax@khaitanco.com",
    contactPhone: "+91 22 6636 1000",
    taxInput: {
      grossIncome: 800000000,
      gst: { outputTax: 144000000, inputTaxCredit: 30000000, rcmLiability: 0 },
      tdsDeducted: 10000000,
      advanceTaxPaid: 150000000,
      stampDutyPaid: 2000000,
    },
    metadata: { llpRegNo: "AAB-1234", partners: 50, offices: ["Mumbai", "Delhi", "Bangalore", "Kolkata"] },
  },
  {
    name: "Ministry of Finance",
    legalName: "Ministry of Finance, Government of India",
    entityType: "government_dept",
    pan: "AAAGM1234S",
    city: "New Delhi",
    state: "Delhi",
    industry: "Government — finance",
    turnover: 0,
    contactEmail: "accounts@finmin.nic.in",
    contactPhone: "+91 11 2309 3456",
    taxInput: {
      grossIncome: 0,
      tdsDeducted: 100000000, // TDS on vendor payments
      advanceTaxPaid: 0,
    },
    metadata: { ministry: true, deptCode: "FIN", exemptSection: "10" },
  },
  {
    name: "Flipkart Internet Pvt Ltd",
    legalName: "Flipkart Internet Private Limited",
    entityType: "ecommerce_operator",
    pan: "AADCZ3456T",
    gstin: "29AADCZ3456T1Z2",
    cin: "U51109KA2012PTC066107",
    tan: "BLRZ78901G",
    city: "Bengaluru",
    state: "Karnataka",
    industry: "E-commerce marketplace",
    turnover: 50000000000,
    contactEmail: "seller-gst@flipkart.com",
    contactPhone: "+91 80 6150 3000",
    taxInput: {
      grossIncome: 50000000000,
      gst: { outputTax: 0, inputTaxCredit: 50000000, rcmLiability: 0 }, // e-com TCS, not output tax
      tdsDeducted: 200000000,
      advanceTaxPaid: 8000000000,
      avgNetProfit3yr: 5000000000,
      stampDutyPaid: 10000000,
    },
    metadata: { ecommerceOperator: true, tcsRate: 0.005, marketplaceModel: true, sellerCount: 500000 },
  },
  {
    name: "Lodha Developers Ltd",
    legalName: "Macrotech Developers Limited (Lodha)",
    entityType: "real_estate_developer",
    pan: "AACCL9012U",
    gstin: "27AACCL9012U1Z9",
    cin: "L70100MH2009PLC190535",
    tan: "MUMA90123H",
    city: "Mumbai",
    state: "Maharashtra",
    industry: "Real estate development",
    turnover: 30000000000,
    contactEmail: "tax@lodhagroup.com",
    contactPhone: "+91 22 6753 1000",
    taxInput: {
      grossIncome: 30000000000,
      gst: { outputTax: 300000000, inputTaxCredit: 0, rcmLiability: 0 }, // 1%/5% without ITC
      tdsDeducted: 500000000,
      advanceTaxPaid: 5000000000,
      avgNetProfit3yr: 5000000000,
      stampDutyPaid: 200000000,
    },
    metadata: { reraRegistered: true, reraNo: "P51700000001", projectsActive: 25, gstrRate: "1%_5%" },
  },
  {
    name: "Razorpay Software Pvt Ltd",
    legalName: "Razorpay Software Private Limited",
    entityType: "fintech_pa",
    pan: "AACCR5678V",
    gstin: "29AACCR5678V1Z3",
    cin: "U72200KA2014PTC075918",
    tan: "BLRR56789I",
    city: "Bengaluru",
    state: "Karnataka",
    industry: "Payment aggregator / fintech",
    turnover: 5000000000,
    contactEmail: "finance@razorpay.com",
    contactPhone: "+91 80 6852 2000",
    taxInput: {
      grossIncome: 5000000000,
      gst: { outputTax: 200000000, inputTaxCredit: 80000000, rcmLiability: 0 },
      tdsDeducted: 50000000,
      advanceTaxPaid: 800000000,
      avgNetProfit3yr: 500000000,
      stampDutyPaid: 5000000,
    },
    metadata: { rbiPALicense: true, paLicenseNo: "PA-03", upiPSP: true, zeroMdrUPI: true },
  },
  {
    name: "Artha Tech Solutions",
    legalName: "Artha Tech Solutions",
    entityType: "msme_medium",
    pan: "AAETA9012W",
    gstin: "27AAETA9012W1Z5",
    udyam: "UDYAM-MH-12-0123456",
    city: "Pune",
    state: "Maharashtra",
    industry: "Technology services — MSME",
    turnover: 150000000,
    contactEmail: "founder@arthatech.in",
    contactPhone: "+91 20 4321 8765",
    taxInput: {
      grossIncome: 150000000,
      gst: { outputTax: 27000000, inputTaxCredit: 8000000, rcmLiability: 0 },
      tdsDeducted: 2000000,
      advanceTaxPaid: 15000000,
      stampDutyPaid: 100000,
    },
    metadata: { udyamNo: "UDYAM-MH-12-0123456", msmeClass: "Medium", collateralFreeLoan: true },
  },
];

async function main() {
  console.log("Seeding test entity cases...\n");

  // Find the test user
  const user = await db.user.findUnique({ where: { email: TEST_EMAIL } });
  if (!user) {
    console.error(`✗ User ${TEST_EMAIL} not found. Run scripts/seed-demo-users.ts first.`);
    process.exit(1);
  }
  console.log(`✓ Using user: ${user.email} (role: ${user.role})`);

  // Determine tenant ID (user's tenant or create one)
  let tenantId = user.tenantId;
  if (!tenantId) {
    tenantId = `solo_${user.id}`;
    const existingTenant = await db.tenant.findUnique({ where: { id: tenantId } });
    if (!existingTenant) {
      await db.tenant.create({
        data: {
          id: tenantId,
          name: "Test Entities Tenant",
          slug: tenantId,
          plan: "enterprise",
          dataResidency: "ap-south-1",
          currency: "INR",
        },
      });
      await db.user.update({ where: { id: user.id }, data: { tenantId } });
      console.log(`✓ Created tenant: ${tenantId}`);
    }
  }

  // Clear existing entities for this tenant
  const existing = await db.entity.count({ where: { tenantId } });
  if (existing > 0) {
    console.log(`⚠ Found ${existing} existing entities. Clearing...`);
    await db.entity.deleteMany({ where: { tenantId } });
    console.log(`✓ Cleared ${existing} existing entities`);
  }

  // Create each test entity
  console.log(`\nCreating ${testCases.length} test entities...\n`);

  for (let i = 0; i < testCases.length; i++) {
    const tc = testCases[i];
    try {
      // Create entity
      const entity = await db.entity.create({
        data: {
          tenantId,
          name: tc.name,
          legalName: tc.legalName,
          entityType: tc.entityType,
          industrySector: tc.industry,
          pan: tc.pan,
          gstin: tc.gstin,
          cin: tc.cin || null,
          tan: tc.tan || null,
          city: tc.city,
          registeredState: tc.state,
          contactEmail: tc.contactEmail,
          contactPhone: tc.contactPhone,
          turnoverLastYear: tc.turnover,
          metadataJson: tc.metadata ? JSON.stringify(tc.metadata) : null,
        },
      });

      // Add user as team member (tenant_admin)
      await db.entityTeamMember.create({
        data: {
          entityId: entity.id,
          userId: user.id,
          role: "tenant_admin",
          invitedBy: user.id,
          acceptedAt: new Date(),
        },
      });

      // Compute + store tax profile
      const fullTaxInput: EntityTaxInput = {
        entityType: tc.entityType,
        financialYear: "2024-25",
        grossIncome: tc.taxInput.grossIncome,
        deductions: tc.taxInput.deductions || {},
        gst: tc.taxInput.gst,
        tdsDeducted: tc.taxInput.tdsDeducted,
        tcsCollected: tc.taxInput.tcsCollected,
        advanceTaxPaid: tc.taxInput.advanceTaxPaid,
        matCreditAvailable: tc.taxInput.matCreditAvailable,
        avgNetProfit3yr: tc.taxInput.avgNetProfit3yr,
        customsDutyPaid: tc.taxInput.customsDutyPaid,
        stampDutyPaid: tc.taxInput.stampDutyPaid,
        sttPaid: tc.taxInput.sttPaid,
        cttPaid: tc.taxInput.cttPaid,
        equalisationLevyReceived: tc.taxInput.equalisationLevyReceived,
      };

      // Use the tax engine directly
      const { computeEntityTax } = await import("../src/lib/entity/tax-engine");
      const breakdown = computeEntityTax(fullTaxInput);

      await db.entityTaxProfile.create({
        data: {
          entityId: entity.id,
          financialYear: "2024-25",
          regime: breakdown.regime,
          grossIncome: breakdown.grossIncome,
          totalDeductions: breakdown.totalDeductions,
          taxableIncome: breakdown.taxableIncome,
          incomeTax: breakdown.finalIncomeTax,
          gstPayable: breakdown.gstNetPayable,
          tdsDeducted: breakdown.tdsCredit,
          advanceTaxPaid: breakdown.advanceTaxPaid,
          netTaxPayable: breakdown.netTaxPayable,
          totalTaxBurden: breakdown.totalTaxBurden,
          effectiveTaxRate: breakdown.effectiveTaxRate,
          breakdownJson: JSON.stringify(breakdown),
        },
      });

      console.log(`  ${i + 1}. ✓ ${tc.entityType} — ${tc.name}`);
      console.log(`     PAN: ${tc.pan} | GSTIN: ${tc.gstin || "N/A"}`);
      console.log(`     Turnover: ₹${tc.turnover.toLocaleString("en-IN")}`);
      console.log(`     Tax burden: ₹${Math.round(breakdown.totalTaxBurden).toLocaleString("en-IN")} (${(breakdown.effectiveTaxRate * 100).toFixed(2)}% effective)`);
      console.log(`     Regime: ${breakdown.regime}`);
      console.log();
    } catch (err: any) {
      console.error(`  ${i + 1}. ✗ ${tc.entityType} — ${tc.name}: ${err.message}`);
    }
  }

  // Summary
  const finalCount = await db.entity.count({ where: { tenantId } });
  console.log("=".repeat(60));
  console.log(`✓ Seeded ${finalCount} test entities`);
  console.log(`✓ All have tax profiles computed for FY 2024-25`);
  console.log(`✓ All have team member (admin@finsight.ai as tenant_admin)`);
  console.log("=".repeat(60));
  console.log("\nTo view: Login as admin@finsight.ai / admin1234, switch to Entities portal");
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
