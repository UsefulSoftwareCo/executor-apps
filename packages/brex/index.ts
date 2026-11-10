import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  oauth2,
  object,
  router,
  secrets,
  string,
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { liveOpenapiRouter } from "apps/openapi";
import { icons } from "./icon.js";
import { sources } from "./openapi.js";

const Me = object({ id: string(), email: string(), first_name: string(), last_name: string() });

const brex = defineProvider({
  name: "Brex",
  hosts: ["api.brex.com", "accounts-api.brex.com"],
  auth: {
    token: secrets({
      label: "User token",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
    // Brex has no dynamic registration and OAuth is partner-only: Brex support issues the client.
    oauth: oauth2({
      discover: "https://accounts-api.brex.com/oauth2/default",
      scopes: [
        "openid",
        "offline_access",
        "users",
        "users.readonly",
        "locations",
        "locations.readonly",
        "departments",
        "departments.readonly",
        "titles",
        "titles.readonly",
        "cost_centers",
        "cost_centers.readonly",
        "cards",
        "cards.readonly",
        "cards.pan",
        "legal_entities",
        "legal_entities.readonly",
        "companies.readonly",
        "transactions.card.readonly",
        "transactions.cash.readonly",
        "statements.card.readonly",
        "statements.cash.readonly",
        "accounts.card.readonly",
        "accounts.cash.readonly",
        "vendors",
        "vendors.readonly",
        "transfers",
        "transfers.readonly",
        "incoming_transfers",
        "linked_accounts.readonly",
        "budgets",
        "budgets.readonly",
        "expenses.card",
        "expenses.card.readonly",
        "fields.write",
        "fields.read",
        "field_values.write",
        "field_values.read",
        "accounting.integration.write",
        "accounting.record.write",
        "accounting.record.read",
        "travel.trips",
      ],
      tokenEndpointAuthMethod: "client_secret_post",
    }),
  },
  async health({ account, fetch, signal }) {
    const token = account.method === "oauth" ? account.fields.access_token : account.fields.token;
    const response = await fetch("https://api.brex.com/v2/users/me", {
      signal,
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    });
    const me = await decodeJson(response, Me);
    return {
      accountInfo: { externalId: me.id, username: me.email, displayName: `${me.first_name} ${me.last_name}` },
    };
  },
});

export default defineApp(
  { user: { accounts: { brex: brex.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.brex ?? [],
        (account) =>
          router(
            Object.fromEntries(
              Object.entries(sources).map(([key, options]) => [
                key,
                withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
                  tool.kind === "mutation" ? always() : undefined,
                ),
              ]),
            ),
          ),
        { signal },
      ),
      {
        title: "Brex",
        description:
          "Brex users, cards, transactions, budgets, expenses, vendors, transfers, accounting, custom fields, travel and webhooks.",
        icons,
      },
    ),
  }),
);
