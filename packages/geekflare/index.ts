import {
  accountRouter,
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

const geekflare = defineProvider({
  name: "Geekflare",
  hosts: ["api.geekflare.com"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // Geekflare has no read-only endpoint and every operation is a billed POST. The probe sends an
  // empty body, which is expected to be rejected by validation (400/422) before credits are
  // charged. Anything other than 401 (bad key) or 400/422 (healthy) is treated as a failure.
  async health({ account, fetch, signal }) {
    const response = await fetch("https://api.geekflare.com/up", {
      method: "POST",
      signal,
      headers: { "x-api-key": account.fields.token, "content-type": "application/json" },
      body: "{}",
    });
    if (response.status === 401) throw new Error("Geekflare rejected the API key (401)");
    if (response.status !== 400 && response.status !== 422) {
      throw new Error(`Geekflare health probe returned unexpected status ${response.status}`);
    }
  },
});

export default defineApp(
  { user: { accounts: { geekflare: geekflare.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.geekflare ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Geekflare",
        description:
          "Geekflare web utility APIs: scrape pages, search, screenshots, PDFs, DNS records, TLS, ping, MTR, ports, Lighthouse, load time and link checks.",
        icons,
      },
    ),
  }),
);
