import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  boolean,
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

// Every Simla.com account has its own host (the address used to open the CRM), such as demo.simla.com.
const hostPattern = /^[a-z0-9][a-z0-9-]*\.simla\.com$/;

function origin(account: { fields: { host: string } }) {
  const host = account.fields.host
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/\/.*$/, "");
  if (!hostPattern.test(host))
    throw new Error("Enter your Simla.com account host, for example mycompany.simla.com.");
  return `https://${host}`;
}

const simla = defineProvider({
  name: "Simla.com",
  hosts: ["*.simla.com"],
  auth: {
    // System administrative settings > API key management (Integration section).
    apiKey: secrets({
      label: "Account host and API key",
      fields: object({
        host: plain(string({ minLength: 1 })),
        token: string({ minLength: 1 }),
      }),
    }),
  },
  async health({ account, fetch, signal }) {
    const base = origin(account);
    const response = await fetch(`${base}/api/credentials`, {
      signal,
      headers: { "X-API-KEY": account.fields.token, Accept: "application/json" },
    });
    const body = await decodeJson(response, object({ success: boolean() }));
    if (!body.success) throw new Error("Simla.com rejected the API key.");
    const host = new URL(base).hostname;
    return { accountInfo: { externalId: host, displayName: host } };
  },
});

export default defineApp(
  { user: { accounts: { simla: simla.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.simla ?? [],
        (account) => {
          const base = origin(account);
          return withApprovals(
            liveOpenapiRouter({ ...options, allowedOrigin: base, baseUrl: base, cache, fetch, signal, account }),
            (tool) => (tool.kind === "mutation" ? always() : undefined),
          );
        },
        { signal },
      ),
      {
        title: "Simla.com",
        description:
          "Simla.com CRM: orders, customers, products, payments, delivery, tasks, telephony and the rest of the Simla.com REST API v5.",
        instructions:
          "If the API key covers several stores, many methods also need the store code in the site parameter. Methods that create or change data ask for approval.",
        icons,
      },
    ),
  }),
);
