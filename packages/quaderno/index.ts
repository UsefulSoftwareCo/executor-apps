import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  object,
  plain,
  router,
  secrets,
  string,
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { liveOpenapiRouter } from "apps/openapi";
import { icons } from "./icon.js";
import { options } from "./openapi.js";

// An account is its subdomain; sandbox accounts live on sandbox-quadernoapp.com.
const hostPattern = /^([a-z0-9][a-z0-9-]*)\.(quadernoapp\.com|sandbox-quadernoapp\.com)$/;

function origin(raw: string): string {
  const value = raw
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/\/.*$/, "");
  const full = value.includes(".") ? value : `${value}.quadernoapp.com`;
  if (!hostPattern.test(full))
    throw new Error(
      "Enter your Quaderno account name (the ACCOUNT_NAME in ACCOUNT_NAME.quadernoapp.com). For a sandbox account enter ACCOUNT_NAME.sandbox-quadernoapp.com.",
    );
  return `https://${full}`;
}

const quaderno = defineProvider({
  name: "Quaderno",
  hosts: ["*.quadernoapp.com", "*.sandbox-quadernoapp.com"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({
        account: plain(string({ minLength: 1 })),
        token: string({ minLength: 1 }),
      }),
    }),
  },
  async health({ account, fetch, signal }) {
    const base = origin(account.fields.account);
    const response = await fetch(`${base}/api/ping`, {
      signal,
      headers: { Authorization: `Basic ${btoa(`${account.fields.token}:`)}`, Accept: "application/json" },
    });
    await decodeJson(response, object({ status: string() }));
    return { accountInfo: { externalId: new URL(base).hostname, displayName: new URL(base).hostname } };
  },
});

export default defineApp(
  { user: { accounts: { quaderno: quaderno.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.quaderno ?? [],
        (account) => {
          const base = origin(account.fields.account);
          return withApprovals(
            liveOpenapiRouter({
              ...options,
              allowedOrigin: base,
              baseUrl: `${base}/api`,
              cache,
              fetch,
              signal,
              account: { ...account, fields: { ...account.fields, basicPassword: "" } },
            }),
            (tool) => (tool.kind === "mutation" ? always() : undefined),
          );
        },
        { signal },
      ),
      {
        title: "Quaderno",
        description:
          "Quaderno tax compliance: tax calculation, invoices, credit notes, expenses, contacts, transactions, reports and tax jurisdictions.",
        instructions:
          "Each account is one Quaderno account (production or sandbox). Operations that need a Quaderno Connect OAuth token are not available with an API key.",
        icons,
      },
    ),
  }),
);
