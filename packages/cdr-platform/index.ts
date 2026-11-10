import {
  accountRouter,
  array,
  decodeJson,
  defineApp,
  defineProvider,
  json,
  jsonSchema,
  mutation,
  number,
  object,
  query,
  router,
  secrets,
  string,
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const base = "https://api.cdrplatform.com/v1";

const cdrPlatform = defineProvider({
  name: "CDR Platform",
  hosts: ["api.cdrplatform.com"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // A price quote creates nothing and is the cheapest authenticated read the API has.
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/cdr/price/`, {
      method: "POST",
      signal,
      headers: { ...headers(account), "content-type": "application/json" },
      body: JSON.stringify({ currency: "usd", weight_unit: "kg", items: [{ method_type: "forestation", cdr_amount: 1 }] }),
    });
    await decodeJson(response, object({ cost: object({ total: number() }) }));
  },
});

type Account = { fields: { token: string } };

// CDR Platform authenticates with `Authorization: Api-Key <key>`, not Bearer.
function headers(account: Account) {
  return { Authorization: `Api-Key ${account.fields.token}`, Accept: "application/json" };
}

const currency = jsonSchema({ type: "string", enum: ["usd", "eur", "gbp", "chf"] });
const weightUnit = jsonSchema({ type: "string", enum: ["g", "kg", "t"] });
const items = array(
  object({ method_type: string({ minLength: 1 }), cdr_amount: jsonSchema({ type: "integer", minimum: 1 }) }),
);
const certificateId = jsonSchema({ type: "string", pattern: "^[a-zA-Z]{3}-[a-zA-Z]{3}-[a-zA-Z]{3}$" });

const cdrPlatformTools = (account: Account, signal: AbortSignal) =>
  router({
    price: query(
      {
        description:
          "Quote the cost of a carbon dioxide removal order without buying it. currency is usd, eur, gbp or chf; weight_unit is g, kg or t. items lists removal methods (method_type, for example forestation or bio-oil) with cdr_amount, a whole number in weight_unit; each method_type may appear once. Returns per-item cost, removal, variable_fees and total, in the currency's minor unit.",
        input: object({ currency, weight_unit: weightUnit, items }),
      },
      async ({ fetch }, input) =>
        decodeJson(
          await fetch(`${base}/cdr/price/`, {
            method: "POST",
            signal,
            headers: { ...headers(account), "content-type": "application/json" },
            body: JSON.stringify(input),
          }),
          json(),
        ),
    ),
    purchase: mutation(
      {
        description:
          "Place a carbon dioxide removal order, which is billed to the account. Takes the same currency, weight_unit and items as price, plus optional client_reference_id and certificate_display_name (each up to 128 characters). Returns the transaction_uuid. Quote with price first.",
        input: object({
          currency: string(),
          weight_unit: string(),
          items,
          client_reference_id: string().optional(),
          certificate_display_name: string().optional(),
        }),
        approval: always(),
      },
      async ({ fetch }, input) =>
        decodeJson(
          await fetch(`${base}/cdr/`, {
            method: "POST",
            signal,
            headers: { ...headers(account), "content-type": "application/json" },
            body: JSON.stringify(input),
          }),
          json(),
        ),
    ),
    getCertificate: query(
      {
        description:
          "Retrieve a removal certificate by its id, which has the form abc-def-ghi (three groups of three letters). Returns certificate_id, display_name, issued_date and removal_amount_kg.",
        input: object({ id: certificateId }),
      },
      async ({ fetch }, { id }) =>
        decodeJson(
          await fetch(`${base}/certificate/${encodeURIComponent(String(id))}/`, { signal, headers: headers(account) }),
          json(),
        ),
    ),
  });

export default defineApp({ user: { accounts: { cdrPlatform: cdrPlatform.many() } }, icons }, async ({ user, signal }) => ({
  tools: router(await accountRouter(user?.accounts.cdrPlatform ?? [], (account) => cdrPlatformTools(account, signal), { signal }), {
    title: "CDR Platform",
    description: "Quote and purchase carbon dioxide removal, and retrieve removal certificates.",
    icons,
  }),
}));
