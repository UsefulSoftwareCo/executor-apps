import {
  accountRouter,
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

const corrently = defineProvider({
  name: "Corrently",
  hosts: ["api.corrently.io"],
  auth: {
    apiKey: secrets({
      label: "Access token",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // Corrently ignores token validity (a bogus token gets the same 200), so this only proves reachability.
  async health({ account, fetch, signal }) {
    const response = await fetch("https://api.corrently.io/v2.0/gsi/prediction?zip=69256", {
      signal,
      headers: { Authorization: `Bearer ${account.fields.token}` },
    });
    await decodeJson(response, object({}));
  },
});

export default defineApp(
  { user: { accounts: { corrently: corrently.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.corrently ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Corrently",
        description: "German green power index (GrünstromIndex), CO2 and price forecasts, tariff data, metering, receipts and Stromkonto from STROMDAO Corrently.",
        icons,
      },
    ),
  }),
);
