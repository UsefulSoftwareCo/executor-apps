import {
  accountRouter,
  boolean,
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
import {
  accountingOptions,
  attributeTaggingOptions,
  fiscalDocumentOptions,
  groupProfileOptions,
  guestProfilesOptions,
  insightsOptions,
  options,
  payByLinkOptions,
  paymentElementOptions,
  pmsV2Options,
} from "./openapi.js";

const cloudbeds = defineProvider({
  name: "Cloudbeds",
  hosts: ["api.cloudbeds.com"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
    // Cloudbeds fixes scopes on the credentials (App Details page), and its authorize request takes only
    // client_id, redirect_uri and state, so none are requested here.
    OAuth2: oauth2({
      authorizationUrl: "https://api.cloudbeds.com/api/v1.3/oauth",
      tokenUrl: "https://api.cloudbeds.com/api/v1.3/access_token",
      tokenEndpointAuthMethod: "client_secret_post",
      scopes: [],
    }),
  },
  async health({ account, fetch, signal }) {
    const headers: Record<string, string> =
      account.method === "OAuth2"
        ? { Authorization: `Bearer ${account.fields.access_token}` }
        : { "x-api-key": `${account.fields.token}` };
    const response = await fetch("https://api.cloudbeds.com/api/v1.3/userinfo", { signal, headers });
    await decodeJson(response, object({ success: boolean() }));
  },
});

export default defineApp(
  { user: { accounts: { cloudbeds: cloudbeds.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.cloudbeds ?? [],
        (account) => {
          const mount = (o: Omit<Parameters<typeof liveOpenapiRouter>[0], "cache" | "fetch" | "signal" | "account">) =>
            withApprovals(liveOpenapiRouter({ ...o, cache, fetch, signal, account }), (tool) =>
              tool.kind === "mutation" ? always() : undefined,
            );
          return router(
            {
              pms: mount(options),
              pmsV2: mount(pmsV2Options),
              insights: mount(insightsOptions),
              accounting: mount(accountingOptions),
              guestProfiles: mount(guestProfilesOptions),
              groupProfile: mount(groupProfileOptions),
              payByLink: mount(payByLinkOptions),
              paymentElement: mount(paymentElementOptions),
              fiscalDocument: mount(fiscalDocumentOptions),
              attributeTagging: mount(attributeTaggingOptions),
            },
            { title: "Cloudbeds", description: "Cloudbeds account." },
          );
        },
        { signal },
      ),
      {
        title: "Cloudbeds",
        description:
          "Cloudbeds. pms: PMS v1.3 reservations, guests, rooms, rates, availability, payments, housekeeping, groups. pmsV2: PMS v2.0 add-ons, hotels, door locks, imports and more. insights: reporting datasets and charts. accounting: ledger and payments. guestProfiles, groupProfile: profile records. payByLink: payment links. paymentElement: payment SDK keys. fiscalDocument: fiscal documents. attributeTagging: attributes and tags.",
        icons,
      },
    ),
  }),
);
