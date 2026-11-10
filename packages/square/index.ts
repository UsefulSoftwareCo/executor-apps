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
import { options } from "./openapi.js";

// The spec requires only `country` on Merchant, so that is the field decoded. Square does return
// `id` in practice (GET /v2/merchants/me), but it is not declared always-present.
const Me = object({ merchant: object({ country: string() }) });

// Spec default of the Square-Version header (components.securitySchemes.oauth2.x-additional-headers).
const SQUARE_VERSION = "2026-09-16";

const square = defineProvider({
  name: "Square",
  hosts: ["connect.squareup.com"],
  auth: {
    token: secrets({
      label: "Personal access token",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
    // Square has no dynamic client registration or published metadata; the connect page asks for
    // the client of an OAuth application created in the Square Developer Console.
    oauth: oauth2({
      authorizationUrl: "https://connect.squareup.com/oauth2/authorize",
      tokenUrl: "https://connect.squareup.com/oauth2/token",
      tokenEndpointAuthMethod: "client_secret_post",
      tokenRequestFormat: "json",
      scopes: [
        "APPOINTMENTS_READ",
        "APPOINTMENTS_WRITE",
        "APPOINTMENTS_ALL_READ",
        "APPOINTMENTS_ALL_WRITE",
        "APPOINTMENTS_BUSINESS_SETTINGS_READ",
        "BANK_ACCOUNTS_READ",
        "CASH_DRAWER_READ",
        "CHANNELS_READ",
        "CUSTOMERS_READ",
        "CUSTOMERS_WRITE",
        "DEVICES_READ",
        "DISCOUNT_CODES_READ",
        "DISPUTES_READ",
        "DISPUTES_WRITE",
        "EMPLOYEES_READ",
        "EMPLOYEES_WRITE",
        "GIFTCARDS_READ",
        "GIFTCARDS_WRITE",
        "INVENTORY_READ",
        "INVENTORY_WRITE",
        "INVOICES_READ",
        "INVOICES_WRITE",
        "ITEMS_READ",
        "ITEMS_WRITE",
        "LOYALTY_READ",
        "LOYALTY_WRITE",
        "MERCHANT_PROFILE_READ",
        "MERCHANT_PROFILE_WRITE",
        "ONLINE_STORE_SITE_READ",
        "ONLINE_STORE_SNIPPETS_READ",
        "ONLINE_STORE_SNIPPETS_WRITE",
        "ORDERS_READ",
        "ORDERS_WRITE",
        "PAYMENTS_READ",
        "PAYMENTS_WRITE",
        "PAYOUTS_READ",
        "SETTLEMENTS_READ",
        "SUBSCRIPTIONS_READ",
        "SUBSCRIPTIONS_WRITE",
        "TIMECARDS_READ",
        "TIMECARDS_WRITE",
        "TIMECARDS_SETTINGS_READ",
        "TIMECARDS_SETTINGS_WRITE",
        "VENDOR_READ",
        "VENDOR_WRITE",
      ],
    }),
  },
  async health({ account, fetch, signal }) {
    const token = account.method === "oauth" ? account.fields.access_token : account.fields.token;
    const response = await fetch("https://connect.squareup.com/v2/merchants/me", {
      signal,
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    });
    const raw: unknown = await response.clone().json().catch(() => undefined);
    const me = await decodeJson(response, Me);
    // Square returns merchant.id in practice; fall back to the country only if it is absent.
    const id = (raw as { merchant?: { id?: unknown } } | undefined)?.merchant?.id;
    return { accountInfo: { externalId: typeof id === "string" ? id : `merchant-${me.merchant.country}` } };
  },
});

// Pins the API version the tools were compiled against.
const versionedFetch =
  (base: typeof fetch): typeof fetch =>
  (input, init) => {
    const headers = new Headers(init?.headers ?? (input instanceof Request ? input.headers : undefined));
    if (!headers.has("Square-Version")) headers.set("Square-Version", SQUARE_VERSION);
    return base(input, { ...init, headers });
  };

export default defineApp(
  { user: { accounts: { square: square.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.square ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch: versionedFetch(fetch), signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Square",
        description:
          "Payments, orders, customers, catalog, inventory, invoices, subscriptions, loyalty, bookings, team and the rest of the Square Connect API.",
        icons,
      },
    ),
  }),
);
