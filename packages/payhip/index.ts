import {
  accountRouter,
  array,
  header,
  decodeJson,
  defineApp,
  defineProvider,
  json,
  mutation,
  number,
  object,
  query,
  router,
  secrets,
  string,
  t,
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const base = "https://payhip.com/api/v2";

const payhip = defineProvider({
  name: "Payhip",
  hosts: ["payhip.com"],
  auth: {
    apiKey: secrets({
      label: "API key (Settings > Developer)",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/coupons?limit=1`, {
      signal,
      headers: { "payhip-api-key": account.fields.token, Accept: "application/json" },
    });
    await decodeJson(response, object({ data: object({ coupons: array(object({ id: number() })) }) }));
  },
});

// Each product has its own license secret. It is stored as a secret field of its own account,
// placed only in the product-secret-key header, so it never passes through tool arguments.
const payhipProduct = defineProvider({
  name: "Payhip product license",
  hosts: ["payhip.com"],
  auth: {
    productSecret: secrets({
      label: "Product secret key (product edit page, license keys section)",
      fields: object({ secretKey: string({ minLength: 1 }) }),
      request: ({ secretKey }) => header("product-secret-key", secretKey),
    }),
  },
});

type Account = { fields: { token: string } };
type ProductAccount = { headers(): Record<string, string> };

const search = (params: Record<string, string | number | undefined>) => {
  const out = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) if (value !== undefined) out.set(key, String(value));
  return out.toString();
};

const payhipTools = (account: Account, signal: AbortSignal) => {
  const apiHeaders = { "payhip-api-key": account.fields.token, Accept: "application/json" };
  return router({
    listCoupons: query(
      {
        description:
          "List coupons, newest first. limit is 1-100 (default 10); offset defaults to 0. Returns data.coupons with id, coupon_type, percent_off, amount_off (cents), code, start_date, end_date, product_key, collection_id, minimum_purchase_amount, usage_limit and notes.",
        input: object({ limit: number().optional(), offset: number().optional() }),
      },
      async ({ fetch }, input) =>
        decodeJson(await fetch(`${base}/coupons?${search(input)}`, { signal, headers: apiHeaders }), json()),
    ),
    getCoupon: query(
      { description: "Retrieve one coupon by its numeric id.", input: object({ id: string() }) },
      async ({ fetch }, { id }) =>
        decodeJson(await fetch(`${base}/coupons/${encodeURIComponent(id)}`, { signal, headers: apiHeaders }), json()),
    ),
    createCoupon: mutation(
      {
        description:
          "Create a coupon. Give percentOff (above 0, up to 100) or amountOff (integer cents). couponType is single (needs productKey), multi, or collection (needs collectionId). usageLimit caps redemptions. Coupons for recurring subscription products are not supported by the API.",
        input: object({
          percentOff: number().optional(),
          amountOff: number().optional(),
          couponType: string().optional(),
          code: string().optional(),
          productKey: string().optional(),
          collectionId: string().optional(),
          notes: string().optional(),
          usageLimit: number().optional(),
        }),
        approval: always(),
      },
      async ({ fetch }, input) => {
        if ((input.percentOff === undefined) === (input.amountOff === undefined))
          throw new Error("Give exactly one of percentOff or amountOff.");
        if (input.percentOff !== undefined && !(input.percentOff > 0 && input.percentOff <= 100))
          throw new Error("percentOff must be greater than 0 and at most 100.");
        if (input.amountOff !== undefined && !(Number.isInteger(input.amountOff) && input.amountOff > 0))
          throw new Error("amountOff must be a positive integer number of cents.");
        if (input.couponType !== undefined && !["single", "multi", "collection"].includes(input.couponType))
          throw new Error("couponType must be single, multi or collection.");
        if (input.couponType === "single" && !input.productKey) throw new Error("couponType single needs productKey.");
        if (input.couponType === "collection" && !input.collectionId)
          throw new Error("couponType collection needs collectionId.");
        return decodeJson(
          await fetch(`${base}/coupons`, {
            method: "POST",
            signal,
            headers: { ...apiHeaders, "content-type": "application/x-www-form-urlencoded" },
            body: search({
              percent_off: input.percentOff,
              amount_off: input.amountOff,
              coupon_type: input.couponType,
              code: input.code,
              product_key: input.productKey,
              collection_id: input.collectionId,
              notes: input.notes,
              usage_limit: input.usageLimit,
            }),
          }),
          json(),
        );
      },
    ),
  });
};

const productTools = (account: ProductAccount, signal: AbortSignal) => {
  const headers = () => ({ ...account.headers(), Accept: "application/json" });
  const licenseWrite = (path: string) => async ({ fetch }: { fetch: typeof globalThis.fetch }, input: { licenseKey: string }) =>
    decodeJson(
      await fetch(`${base}/license/${path}`, {
        method: "PUT",
        signal,
        headers: { ...headers(), "content-type": "application/x-www-form-urlencoded" },
        body: search({ license_key: input.licenseKey }),
      }),
      json(),
    );
  const licenseInput = object({ licenseKey: string() });
  return router({
    verifyLicense: query(
      {
        description:
          "Verify a license key for the product of the selected account and return its enabled flag, product, buyer email, uses, variant and date.",
        input: licenseInput,
      },
      async ({ fetch }, { licenseKey }) =>
        decodeJson(await fetch(`${base}/license/verify?${search({ license_key: licenseKey })}`, { signal, headers: headers() }), json()),
    ),
    enableLicense: mutation(
      { description: "Re-enable a disabled license key.", input: licenseInput, approval: always() },
      licenseWrite("enable"),
    ),
    disableLicense: mutation(
      { description: "Disable a license key.", input: licenseInput, approval: always() },
      licenseWrite("disable"),
    ),
    increaseLicenseUsage: mutation(
      { description: "Increase a license key's usage count by one.", input: licenseInput, approval: always() },
      licenseWrite("usage"),
    ),
    decreaseLicenseUsage: mutation(
      { description: "Decrease a license key's usage count by one.", input: licenseInput, approval: always() },
      licenseWrite("decrease"),
    ),
  });
};

export default defineApp(
  { user: { accounts: { payhip: payhip.many(), product: payhipProduct.many() } }, icons },
  async ({ user, signal }) => ({
    tools: router(
      {
        account: await accountRouter(user?.accounts.payhip ?? [], (account) => payhipTools(account, signal), { signal }),
        license: await accountRouter(user?.accounts.product ?? [], (account) => productTools(account, signal), { signal }),
      },
      {
        title: "Payhip",
        description:
          "Create and list Payhip discount coupons (account API key), and verify, enable, disable and meter software license keys (one connected account per product secret key).",
        icons,
      },
    ),
  }),
);
