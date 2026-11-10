import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  oauth2,
  object,
  router,
  string,
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { liveOpenapiRouter } from "apps/openapi";
import { icons } from "./icon.js";
import { options } from "./openapi.js";

// The Business schema marks only two other fields as required, but the Developer API reference and its
// example response for GET /developer/v1/business always carry id (uuid) and business_name_legal; the
// shared schema just does not list them. Not verified against a live response (no credentials used).
const Business = object({ id: string(), business_name_legal: string() });

// Scopes the generated tools need. Deliberately excluded: cards:read_vault (PAN/CVV) and other vault, SCIM,
// provisioning, incorporation and embedded card scopes. offline_access is not requested: Ramp issues refresh
// tokens when the Refresh Token grant is enabled on the app.
const scopes = [
  "accounting:read",
  "accounting:write",
  "ai_spend:read",
  "applications:read",
  "approval_chains:write",
  "approvals:read",
  "approvals:write",
  "attendee_types:read",
  "audit_logs:read",
  "bank_accounts:read",
  "bank_accounts:write",
  "bank_feeds:read",
  "blank_canvas:write",
  "bills:read",
  "bills:write",
  "budgets:read",
  "business:read",
  "cards:read",
  "cards:write",
  "cashbacks:read",
  "comments:write",
  "custom_forms:read",
  "custom_records:read",
  "custom_records:write",
  "departments:read",
  "departments:write",
  "entities:read",
  "external_attendees:read",
  "external_attendees:write",
  "funds:read",
  "funds:write",
  "item_receipts:read",
  "item_receipts:write",
  "limits:read",
  "limits:write",
  "locations:read",
  "locations:write",
  "memos:read",
  "memos:write",
  "merchants:read",
  "purchase_orders:read",
  "purchase_orders:write",
  "receipt_integrations:read",
  "receipt_integrations:write",
  "receipts:read",
  "receipts:write",
  "reimbursements:read",
  "reimbursements:write",
  "repayments:read",
  "sourcing:read",
  "sourcing:write",
  "spend_programs:read",
  "spend_programs:write",
  "spend_requests:read",
  "spend_requests:write",
  "statements:read",
  "tasks:read",
  "transactions:read",
  "transactions:write",
  "transfers:read",
  "treasury:read",
  "trips:read",
  "unified_requests:read",
  "unified_requests:write",
  "users:read",
  "users:write",
  "vendors:read",
  "vendors:write",
  "workflows:read",
];

const ramp = defineProvider({
  name: "Ramp",
  hosts: ["api.ramp.com"],
  auth: {
    // A developer app in your own Ramp business with the Client Credentials grant enabled.
    clientCredentials: oauth2({
      grant: "client_credentials",
      tokenUrl: "https://api.ramp.com/developer/v1/token",
      tokenEndpointAuthMethod: "client_secret_basic",
      scopes,
    }),
    // A developer app that other Ramp businesses authorize with the Authorization Code grant.
    oauth: oauth2({
      authorizationUrl: "https://app.ramp.com/v1/authorize",
      tokenUrl: "https://api.ramp.com/developer/v1/token",
      tokenEndpointAuthMethod: "client_secret_basic",
      scopes,
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch("https://api.ramp.com/developer/v1/business", {
      signal,
      headers: { Authorization: `Bearer ${account.fields.access_token}`, Accept: "application/json" },
    });
    const business = await decodeJson(response, Business);
    return { accountInfo: { externalId: business.id, username: business.business_name_legal } };
  },
});

export default defineApp(
  { user: { accounts: { ramp: ramp.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.ramp ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Ramp",
        description:
          "Ramp cards, transactions, bills, reimbursements, users, vendors, spend limits, purchase orders, accounting and the rest of the Ramp Developer API.",
        icons,
      },
    ),
  }),
);
