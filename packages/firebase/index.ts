import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  header,
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
  appcheckOptions,
  appdistributionOptions,
  authOptions,
  authconfigOptions,
  clientOptions,
  databaseOptions,
  hostingOptions,
  managementOptions,
  messagingOptions,
  rulesOptions,
} from "./openapi.js";

const firebase = defineProvider({
  name: "Firebase",
  hosts: [
    "firebase.googleapis.com",
    "firebasehosting.googleapis.com",
    "firebaserules.googleapis.com",
    "firebasedatabase.googleapis.com",
    "firebaseappdistribution.googleapis.com",
    "firebaseappcheck.googleapis.com",
    "fcm.googleapis.com",
    "identitytoolkit.googleapis.com",
    "openidconnect.googleapis.com",
  ],
  auth: {
    // Google has no dynamic client registration: the connect page asks for a Google Cloud OAuth client.
    oauth: oauth2({
      discover: "https://accounts.google.com",
      scopes: [
        "openid",
        "email",
        "profile",
        "https://www.googleapis.com/auth/firebase",
        "https://www.googleapis.com/auth/firebase.messaging",
        "https://www.googleapis.com/auth/cloud-platform",
      ],
      // Google issues refresh tokens only when asked for offline access.
      authorizationParams: { access_type: "offline", prompt: "consent" },
    }),
    // The Web API key of one Firebase project; it only unlocks the Authentication client endpoints.
    apiKey: secrets({
      label: "Web API key",
      fields: object({ apiKey: string({ minLength: 1 }) }),
      // Header placement keeps the key out of URLs and logs.
      request: ({ apiKey }) => header("x-goog-api-key", apiKey),
    }),
  },
  async health({ account, fetch, signal }) {
    if (account.method === "oauth") {
      const response = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
        signal,
        headers: { Authorization: `Bearer ${account.fields.access_token}` },
      });
      const me = await decodeJson(response, object({ sub: string() }));
      return { accountInfo: { externalId: me.sub } };
    }
    // No free read-only endpoint takes a bare key, so look up a bogus ID token: a valid key reaches
    // INVALID_ID_TOKEN, a bad key is rejected first.
    const response = await fetch("https://identitytoolkit.googleapis.com/v1/accounts:lookup", {
      signal,
      method: "POST",
      headers: { ...account.headers(), "Content-Type": "application/json" },
      body: JSON.stringify({ idToken: "executor-health-check" }),
    });
    const text = await response.text();
    if (text.includes("API_KEY_INVALID") || text.includes("API key not valid")) {
      throw new Error("Google rejected the Web API key. Check it is the Web API key of your Firebase project.");
    }
    if (response.status === 403) {
      throw new Error("Google rejected the Web API key (403). Enable the Identity Toolkit API for the project.");
    }
    if (response.status !== 400 && !response.ok) {
      throw new Error(`Firebase health check failed (${response.status}).`);
    }
  },
});

export default defineApp(
  { user: { accounts: { firebase: firebase.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.firebase ?? [],
        (account) => {
          const mount = (options: typeof managementOptions | typeof clientOptions) =>
            withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account } as never), (tool) =>
              tool.kind === "mutation" ? always() : undefined,
            );
          if (account.method === "apiKey") {
            return router({ client: mount(clientOptions) }, { title: "Firebase", description: "Firebase Authentication client API." });
          }
          return router(
            {
              management: mount(managementOptions),
              hosting: mount(hostingOptions),
              auth: mount(authOptions),
              authconfig: mount(authconfigOptions),
              messaging: mount(messagingOptions),
              appdistribution: mount(appdistributionOptions),
              appcheck: mount(appcheckOptions),
              database: mount(databaseOptions),
              rules: mount(rulesOptions),
            },
            { title: "Firebase", description: "Firebase project administration." },
          );
        },
        { signal },
      ),
      {
        title: "Firebase",
        description:
          "Firebase. OAuth account: management (projects, Android/iOS/web apps), hosting (sites, channels, versions, releases, domains), auth (users) and authconfig (providers, tenants), messaging (FCM send, topic subscriptions), appdistribution, appcheck, database (Realtime Database instances), rules (Security Rules). Web API key account: client (Authentication sign-up, sign-in, password reset, email codes).",
        icons,
      },
    ),
  }),
);
