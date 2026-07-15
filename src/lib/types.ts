export type ViewState =
  | "login"
  | "dashboard"
  | "portfolio"
  | "cashflow"
  | "liabilities"
  | "retirement"
  | "documents"
  | "estate"
  | "tax"
  | "finance"
  | "goals"
  | "assistant"
  | "reports"
  | "settings"
  | "document-verify"
  // Entity Portal
  | "entity-dashboard"
  | "entity-tax"
  | "entity-compliance"
  | "entity-documents"
  | "entity-team"
  | "entity-notices"
  | "entity-onboarding"
  | "entity-switcher"
  | "entity-gst-returns"
  | "entity-tds-returns"
  | "entity-advisor";

export interface User {
  id: string;
  name: string;
  email: string;
  role: "user" | "admin";
}
