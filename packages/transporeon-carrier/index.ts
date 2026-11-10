import {
  accountRouter,
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
import { environments, options } from "./openapi.js";

const basicFields = () =>
  secrets({
    label: "Carrier Interface username and password",
    fields: object({ username: string({ minLength: 1 }), password: string({ minLength: 1 }) }),
  });

const transporeon = defineProvider({
  name: "Transporeon Carrier Interface",
  hosts: ["xp.transporeon.com", "api.transporeon.com", "xp.test.transporeon.com", "api.test.transporeon.com"],
  auth: {
    // Production: username (user@companyId) and password issued for the carrier account.
    basic: basicFields(),
    // Production OAuth 2.0 client credentials: client ID in the form username@companyId plus the password as secret.
    oauth: oauth2({
      grant: "client_credentials",
      tokenUrl: environments.production.tokenUrl,
      scopes: ["carrierintegration"],
      tokenEndpointAuthMethod: "client_secret_basic",
    }),
    // Test environment (sandbox login demo@123 / demo).
    basicTest: basicFields(),
    oauthTest: oauth2({
      grant: "client_credentials",
      tokenUrl: environments.test.tokenUrl,
      scopes: ["carrierintegration"],
      tokenEndpointAuthMethod: "client_secret_basic",
    }),
  },
  // GET /v1/transport is the read-only call Transporeon's own docs use to verify credentials. OAuth accounts
  // already exchanged their client credentials for a token, which proves them.
  async health({ account, fetch, signal }) {
    if (account.method === "oauth" || account.method === "oauthTest") return;
    const env = account.method === "basicTest" ? environments.test : environments.production;
    const response = await fetch(`${env.origin}${env.api}/v1/transport`, {
      signal,
      headers: {
        Authorization: `Basic ${btoa(`${account.fields.username}:${account.fields.password}`)}`,
        Accept: "application/json",
      },
    });
    if (!response.ok) throw new Error(`Transporeon rejected the credentials (HTTP ${response.status})`);
  },
});

const target = (method: string) => {
  const env = method === "basicTest" || method === "oauthTest" ? environments.test : environments.production;
  return { allowedOrigin: env.origin, baseUrl: `${env.origin}${env.api}` };
};

export default defineApp(
  { user: { accounts: { transporeon: transporeon.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.transporeon ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, ...target(account.method), cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Transporeon Carrier Interface",
        description:
          "Carrier-side Transporeon API: transports, offers, bookings, deliveries, status updates, attachments and settlements.",
        icons,
      },
    ),
  }),
);
