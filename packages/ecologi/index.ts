import {
  accountRouter,
  boolean,
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
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const base = "https://public.ecologi.com";

const ecologi = defineProvider({
  name: "Ecologi",
  hosts: ["public.ecologi.com"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // Ecologi has no read-only authenticated endpoint. A purchase with test: true validates the
  // key and the request without buying anything.
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/impact/trees`, {
      method: "POST",
      signal,
      headers: { Authorization: `Bearer ${account.fields.token}`, "content-type": "application/json" },
      body: JSON.stringify({ number: 1, test: true }),
    });
    await decodeJson(response, object({}));
  },
});

type Account = { fields: { token: string } };

const purchase = (account: Account, signal: AbortSignal, path: string, body: Record<string, unknown>, idempotencyKey?: string) =>
  ({ fetch }: { fetch: typeof globalThis.fetch }) =>
    fetch(`${base}/impact/${path}`, {
      method: "POST",
      signal,
      headers: {
        Authorization: `Bearer ${account.fields.token}`,
        "content-type": "application/json",
        ...(idempotencyKey === undefined ? {} : { "Idempotency-Key": idempotencyKey }),
      },
      body: JSON.stringify(body),
    });

const common = {
  name: string().optional(),
  test: boolean().optional(),
  recipientEmail: string().optional(),
  idempotencyKey: string().optional(),
};
const commonNote =
  " Optional: name (purchase label shown on the Ecologi profile), recipientEmail (gift recipient), test (true validates without buying), idempotencyKey (safe retries). This spends real money unless test is true.";

const ecologiTools = (account: Account, signal: AbortSignal) => {
  const buy = (path: string, body: Record<string, unknown>, idempotencyKey?: string) => async (ctx: { fetch: typeof globalThis.fetch }) =>
    decodeJson(await purchase(account, signal, path, body, idempotencyKey)(ctx), json());
  const report = (username: string, path: string) => async ({ fetch }: { fetch: typeof globalThis.fetch }) =>
    decodeJson(await fetch(`${base}/users/${encodeURIComponent(username)}/${path}`, { signal }), json());
  return router({
    impact: router(
      {
        buyTrees: mutation(
          {
            description: `Fund tree planting. number is 1 to 250,000 trees.${commonNote}`,
            input: object({ number: number(), ...common }),
            approval: always(),
          },
          (ctx, { idempotencyKey, ...body }) => buy("trees", body, idempotencyKey)(ctx),
        ),
        buyLocalTrees: mutation(
          {
            description: `Fund tree planting in a specific country. number is an integer of at least 1; country is UK, US, AU or BR.${commonNote}`,
            input: object({ number: number(), country: string(), ...common }),
            approval: always(),
          },
          (ctx, { idempotencyKey, ...body }) => buy("local-trees", body, idempotencyKey)(ctx),
        ),
        buyCarbonAvoidance: mutation(
          {
            description: `Fund carbon avoidance (offsets). number is the amount (minimum 1 kg); units is KG or Tonnes.${commonNote}`,
            input: object({ number: number(), units: string(), ...common }),
            approval: always(),
          },
          (ctx, { idempotencyKey, ...body }) => buy("carbon", body, idempotencyKey)(ctx),
        ),
        buyCarbonRemoval: mutation(
          {
            description: `Fund carbon removal. number is kilograms of CO2e, at least 1.${commonNote}`,
            input: object({ number: number(), ...common }),
            approval: always(),
          },
          (ctx, { idempotencyKey, ...body }) => buy("carbon-removal", body, idempotencyKey)(ctx),
        ),
        buyHabitatRestoration: mutation(
          {
            description: `Fund habitat restoration. number is square metres, at least 0.1 with one decimal place.${commonNote}`,
            input: object({ number: number(), ...common }),
            approval: always(),
          },
          (ctx, { idempotencyKey, ...body }) => buy("habitat-restoration", body, idempotencyKey)(ctx),
        ),
      },
      { title: "Impact", description: "Purchase climate impact through the Ecologi Impact API." },
    ),
    reporting: router(
      {
        trees: query(
          { description: "Total and pending trees funded by an Ecologi user, by profile username. Public data, refreshed every 10 minutes.", input: object({ username: string() }) },
          (ctx, { username }) => report(username, "trees")(ctx),
        ),
        carbonOffset: query(
          { description: "Tonnes of CO2e avoided (total and pending) by an Ecologi user. Public data.", input: object({ username: string() }) },
          (ctx, { username }) => report(username, "carbon-offset")(ctx),
        ),
        carbonRemoval: query(
          { description: "Tonnes of CO2e removed (total and pending) by an Ecologi user. Public data.", input: object({ username: string() }) },
          (ctx, { username }) => report(username, "carbon-removal")(ctx),
        ),
        habitatRestoration: query(
          { description: "Square metres of habitat restored (total and pending) by an Ecologi user. Public data.", input: object({ username: string() }) },
          (ctx, { username }) => report(username, "habitat-restoration")(ctx),
        ),
        impact: query(
          { description: "All impact totals for an Ecologi user in one call: trees, carbon offset, carbon removal and habitat restoration, plus a pending object. Public data.", input: object({ username: string() }) },
          (ctx, { username }) => report(username, "impact")(ctx),
        ),
      },
      { title: "Reporting", description: "Read public impact totals for any Ecologi username." },
    ),
  });
};

export default defineApp({ user: { accounts: { ecologi: ecologi.many() } }, icons }, async ({ user, signal }) => ({
  tools: router(await accountRouter(user?.accounts.ecologi ?? [], (account) => ecologiTools(account, signal), { signal }), {
    title: "Ecologi",
    description: "Fund tree planting, carbon avoidance, carbon removal and habitat restoration, and read public impact totals.",
    icons,
  }),
}));
