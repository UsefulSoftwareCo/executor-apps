import {
  accountRouter,
  array,
  decodeJson,
  defineApp,
  defineProvider,
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

// Every API key is locked to a date version; the tools are generated from this one, so pin it.
const API_VERSION = "2025-05-05";
const pinnedFetch =
  (base: typeof fetch): typeof fetch =>
  (input, init) => {
    const headers = new Headers(init?.headers ?? (input instanceof Request ? input.headers : undefined));
    headers.set("X-Api-Version", API_VERSION);
    return base(input, { ...init, headers });
  };

const fleetio = defineProvider({
  name: "Fleetio",
  hosts: ["secure.fleetio.com"],
  auth: {
    apiKey: secrets({
      label: "API key and account token",
      fields: object({
        token: string({ minLength: 1 }),
        accountToken: string({ minLength: 1 }),
      }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch("https://secure.fleetio.com/api/accounts", {
      signal,
      headers: {
        Authorization: `Token ${account.fields.token}`,
        "Account-Token": account.fields.accountToken,
        "X-Api-Version": API_VERSION,
      },
    });
    await decodeJson(response, object({ records: array(object({})) }));
  },
});

export default defineApp(
  { user: { accounts: { fleetio: fleetio.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.fleetio ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch: pinnedFetch(fetch), signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Fleetio",
        description: "Fleet management with Fleetio: vehicles, equipment, work orders, inspections, fuel and meter entries, parts, vendors, contacts and webhooks.",
        icons,
      },
    ),
  }),
);
