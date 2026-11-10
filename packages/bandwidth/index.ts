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
import {
  accountsOptions,
  applicationsOptions,
  callIntelligenceOptions,
  endUsersOptions,
  insightsOptions,
  lookupOptions,
  messagingOptions,
  mfaOptions,
  tenDlcOptions,
  tollFreeOptions,
  voiceDebugLogsOptions,
  voiceOptions,
} from "./openapi.js";

const bandwidth = defineProvider({
  name: "Bandwidth",
  hosts: [
    "api.bandwidth.com",
    "messaging.bandwidth.com",
    "voice.bandwidth.com",
    "mfa.bandwidth.com",
    "insights.bandwidth.com",
  ],
  auth: {
    // Bandwidth App > Account > API Credentials: the username and password of an API credential.
    basic: secrets({
      label: "API credential username and password",
      fields: object({ accountId: string({ minLength: 1 }), username: string({ minLength: 1 }), password: string({ minLength: 1 }) }),
    }),
    // The Client ID (CLI-...) and Client Secret of an API credential, exchanged for a bearer token.
    oauth: oauth2({
      grant: "client_credentials",
      tokenUrl: "https://api.bandwidth.com/api/v1/oauth2/token",
      tokenEndpointAuthMethod: "client_secret_basic",
      scopes: [],
    }),
  },
  async health({ account, fetch, signal }) {
    // OAuth accounts already exchanged their client credentials for a token, which proves them.
    if (account.method === "oauth") return { accountInfo: { externalId: "bandwidth", displayName: "Bandwidth (client credentials)" } };
    const response = await fetch(
      `https://api.bandwidth.com/api/v2/accounts/${encodeURIComponent(account.fields.accountId)}/applications`,
      {
        signal,
        headers: {
          Authorization: `Basic ${btoa(`${account.fields.username}:${account.fields.password}`)}`,
          Accept: "application/xml",
        },
      },
    );
    if (!response.ok) throw new Error(`Bandwidth rejected the credentials (HTTP ${response.status})`);
    return { accountInfo: { externalId: account.fields.accountId, displayName: `Bandwidth ${account.fields.accountId}` } };
  },
});

export default defineApp(
  { user: { accounts: { bandwidth: bandwidth.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.bandwidth ?? [],
        (account) => {
          const mount = (options: Parameters<typeof liveOpenapiRouter>[0] extends infer O ? Omit<O & object, "cache" | "fetch" | "signal" | "account"> : never) =>
            withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
              tool.kind === "mutation" ? always() : undefined,
            );
          return router(
            {
              messaging: mount(messagingOptions),
              voice: mount(voiceOptions),
              mfa: mount(mfaOptions),
              lookup: mount(lookupOptions),
              tollFree: mount(tollFreeOptions),
              tenDlc: mount(tenDlcOptions),
              accounts: mount(accountsOptions),
              applications: mount(applicationsOptions),
              endUsers: mount(endUsersOptions),
              voiceDebugLogs: mount(voiceDebugLogsOptions),
              callIntelligence: mount(callIntelligenceOptions),
              insights: mount(insightsOptions),
            },
            { title: "Bandwidth", description: "Messaging, voice, MFA, number lookup, toll-free verification, 10DLC, accounts and applications." },
          );
        },
        { signal },
      ),
      {
        title: "Bandwidth",
        description:
          "Bandwidth messaging, voice, multi-factor authentication, number lookup, toll-free verification, 10DLC campaigns, accounts and applications.",
        icons,
      },
    ),
  }),
);
