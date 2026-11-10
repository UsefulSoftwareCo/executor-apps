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

const neutrino = defineProvider({
  name: "Neutrino",
  hosts: ["neutrinoapi.net"],
  auth: {
    apiKey: secrets({
      label: "User ID and API key",
      fields: object({ userId: string({ minLength: 1 }), apiKey: string({ minLength: 1 }) }),
    }),
  },
  // Accepted exception: the official spec has no account, balance or usage endpoint, so this probes a read-only lookup (counts as one API request against the plan quota).
  async health({ account, fetch, signal }) {
    const response = await fetch("https://neutrinoapi.net/ip-info?ip=1.1.1.1", {
      signal,
      headers: { "user-id": account.fields.userId, "api-key": account.fields.apiKey },
    });
    await decodeJson(response, object({}));
  },
});

export default defineApp(
  { user: { accounts: { neutrino: neutrino.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.neutrino ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Neutrino",
        description:
          "General-purpose utility APIs: IP info and blocklists, email/phone/address validation, geocoding, bad-word filtering, URL and HTML processing, QR codes and imaging.",
        icons,
      },
    ),
  }),
);
