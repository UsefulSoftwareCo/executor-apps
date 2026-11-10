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
import {
  balancePlatformOptions,
  checkoutOptions,
  dataProtectionOptions,
  legalEntityOptions,
  managementOptions,
  transfersOptions,
} from "./openapi.js";

type Fields = { environment: string; livePrefix: string; apiKey: string };

const prefixPattern = /^[A-Za-z0-9]{1,40}-[A-Za-z0-9]{1,40}$|^[A-Za-z0-9]{1,80}$/;

function live(account: { fields: Fields }) {
  const environment = account.fields.environment.trim().toLowerCase();
  if (environment !== "test" && environment !== "live") throw new Error("Environment must be test or live.");
  return environment === "live";
}

// Live Checkout calls go to a host built from the company's own URL prefix; every other API has a fixed host.
function checkoutOrigin(account: { fields: Fields }) {
  if (!live(account)) return "https://checkout-test.adyen.com/v72";
  const prefix = account.fields.livePrefix.trim();
  if (!prefixPattern.test(prefix)) {
    throw new Error("Enter the live URL prefix from Developers > API URLs, for example 1797a841fbb37ca7-AdyenDemo.");
  }
  return `https://${prefix}-checkout-live.adyenpayments.com/checkout/v72`;
}

const env = (account: { fields: Fields }) => (live(account) ? "live" : "test");

const origins = {
  checkout: checkoutOrigin,
  management: (account: { fields: Fields }) => `https://management-${env(account)}.adyen.com/v3`,
  balancePlatform: (account: { fields: Fields }) => `https://balanceplatform-api-${env(account)}.adyen.com/bcl/v2`,
  legalEntity: (account: { fields: Fields }) => `https://kyc-${env(account)}.adyen.com/lem/v4`,
  transfers: (account: { fields: Fields }) => `https://balanceplatform-api-${env(account)}.adyen.com/btl/v4`,
  dataProtection: (account: { fields: Fields }) =>
    `https://ca-${env(account)}.adyen.com/ca/services/DataProtectionService/v1`,
};

const adyen = defineProvider({
  name: "Adyen",
  hosts: ["*.adyen.com", "*.adyenpayments.com"],
  auth: {
    apiKey: secrets({
      label: "Environment, live URL prefix and API key",
      fields: object({
        environment: plain(string({ minLength: 1 })),
        livePrefix: plain(string()),
        apiKey: string({ minLength: 1 }),
      }),
    }),
  },
  // Any Management API role can read the credential it is called with.
  async health({ account, fetch, signal }) {
    const response = await fetch(`${origins.management(account)}/me`, {
      signal,
      headers: { "X-API-Key": account.fields.apiKey },
    });
    const me = await decodeJson(response, object({ id: string(), username: string() }));
    return { accountInfo: { externalId: me.id, username: me.username, displayName: me.username } };
  },
});

export default defineApp(
  { user: { accounts: { adyen: adyen.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.adyen ?? [],
        (account) => {
          const approve = <T extends Parameters<typeof withApprovals>[0]>(r: T) =>
            withApprovals(r, (tool) => (tool.kind === "mutation" ? always() : undefined));
          const mount = <K extends keyof typeof origins>(
            key: K,
            options: Omit<Parameters<typeof liveOpenapiRouter>[0], "cache" | "fetch" | "signal" | "account">,
          ) => {
            const base = origins[key](account);
            return approve(
              liveOpenapiRouter({ ...options, allowedOrigin: new URL(base).origin, baseUrl: base, cache, fetch, signal, account }),
            );
          };
          return router(
            {
              checkout: mount("checkout", checkoutOptions),
              management: mount("management", managementOptions),
              balancePlatform: mount("balancePlatform", balancePlatformOptions),
              legalEntity: mount("legalEntity", legalEntityOptions),
              transfers: mount("transfers", transfersOptions),
              dataProtection: mount("dataProtection", dataProtectionOptions),
            },
            { title: "Adyen", description: "Adyen account." },
          );
        },
        { signal },
      ),
      {
        title: "Adyen",
        description:
          "Adyen. checkout: payments, sessions, payment links, captures, refunds, stored payment methods. management: companies, merchants, stores, terminals, payment methods, webhooks, API credentials. balancePlatform: account holders, balance accounts, cards, payment instruments, grants. legalEntity: legal entities, onboarding, documents. transfers: transfers and transactions. dataProtection: GDPR subject erasure.",
        icons,
      },
    ),
  }),
);
