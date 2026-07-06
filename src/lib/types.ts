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
  | "document-verify";

export interface User {
  id: string;
  name: string;
  email: string;
  role: "user" | "admin";
}
