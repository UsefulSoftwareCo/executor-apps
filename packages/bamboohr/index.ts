import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  json,
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

// Every BambooHR account lives on its own host: https://<companyDomain>.bamboohr.com.
function normalizeDomain(raw: string): string {
  const match = /^(?:https?:\/\/)?([a-z0-9][a-z0-9-]*[a-z0-9]|[a-z0-9])(?:\.bamboohr\.com)?\/?$/.exec(
    raw.trim().toLowerCase(),
  );
  if (match === null)
    throw new Error("Enter the <companyDomain> of <companyDomain>.bamboohr.com (letters, digits, hyphens).");
  return match[1]!;
}

const bamboohr = defineProvider({
  name: "BambooHR",
  hosts: ["*.bamboohr.com"],
  auth: {
    // BambooHR API keys are created per user (profile menu > API Keys) and sent as the Basic
    // username with any random password (BambooHR's docs use "x"). OAuth is not offered: the
    // framework's oauth2 authorizationUrl/tokenUrl are static strings, so per-company URLs
    // (<companyDomain>.bamboohr.com/authorize.php) cannot be declared.
    apiKey: secrets({
      label: "API key",
      fields: object({
        companyDomain: plain(string({ minLength: 1 })),
        apiKey: string({ minLength: 1 }),
      }),
    }),
  },
  async health({ account, fetch, signal }) {
    const domain = normalizeDomain(account.fields.companyDomain);
    const response = await fetch(`https://${domain}.bamboohr.com/api/v1/meta/fields`, {
      signal,
      headers: {
        Authorization: `Basic ${btoa(`${account.fields.apiKey}:x`)}`,
        Accept: "application/json",
      },
    });
    await decodeJson(response, json());
    return { accountInfo: { externalId: domain, displayName: `${domain}.bamboohr.com` } };
  },
});

export default defineApp(
  { user: { accounts: { bamboohr: bamboohr.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.bamboohr ?? [],
        (account) => {
          const origin = `https://${normalizeDomain(account.fields.companyDomain)}.bamboohr.com`;
          return withApprovals(
            liveOpenapiRouter({
              ...options,
              allowedOrigin: origin,
              baseUrl: origin,
              cache,
              fetch,
              signal,
              // The key is the Basic username; the password is the non-secret constant "x".
              account: { ...account, fields: { ...account.fields, basicPassword: "x" } },
            }),
            (tool) => (tool.kind === "mutation" ? always() : undefined),
          );
        },
        { signal },
      ),
      {
        title: "BambooHR",
        description:
          "Employees, time off, time tracking, benefits, training, applicant tracking, files, goals and company settings in BambooHR.",
        instructions:
          "Results depend on the permissions of the user who owns the API key. Use employee id 0 for the key owner where the API allows it.",
        icons,
      },
    ),
  }),
);
