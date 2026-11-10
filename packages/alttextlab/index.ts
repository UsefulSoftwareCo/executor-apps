import {
  ProviderError,
  accountRouter,
  array,
  decodeJson,
  defineApp,
  defineProvider,
  json,
  mutation,
  object,
  record,
  router,
  secrets,
  string,
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const base = "https://app.alttextlab.com/api/v1";

const alttextlab = defineProvider({
  name: "AltTextLab",
  hosts: ["app.alttextlab.com"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // AltTextLab documents no read-only endpoint, so this is a documented exception: it POSTs an
  // empty body to the generate endpoint. imageUrl is required, so {} cannot generate (credits are
  // only charged on status "generated"). 401 is the documented bad-key response. The 400/422
  // "key accepted, body rejected" pass is undocumented and not verified against a live key.
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/alt-text/generate`, {
      method: "POST",
      signal,
      headers: { "x-api-key": account.fields.token, "Content-Type": "application/json" },
      body: "{}",
    });
    const status = response.status;
    if (response.ok || status === 400 || status === 422) return;
    if (status === 401) throw new ProviderError({ reason: "unauthorized", status });
    if (status === 429) throw new ProviderError({ reason: "rate_limited", status });
    if (status >= 500) throw new ProviderError({ reason: "unavailable", status });
    if (status === 403) throw new ProviderError({ reason: "rejected", status });
    throw new Error(`AltTextLab health check failed with HTTP ${status}`);
  },
});

type Fetch = typeof fetch;

function build(token: string, fetcher: Fetch, signal: AbortSignal | undefined) {
  return router({
    generateAltText: mutation(
      {
        description:
          "Generate alt text for a publicly reachable image URL (no login, no redirects). Optional lang is a language code such as en, pl or de (130+ supported; defaults to the account setting). style is descriptive, neutral, matter-of-fact or minimal. keywords are woven in only when they fit the image. Any ecommerce field (product, brand, color, material) switches on product-focused output. context fields (personName, pageTitle, sectionHeading, description, surroundingText) disambiguate the image. customFields (max 30 string pairs) are echoed back unchanged. Consumes one credit when status is generated; failed results are free. Rate limits: 5 requests a second, 120 a minute, 100,000 a day.",
        input: object({
          imageUrl: string({ minLength: 1 }),
          lang: string().optional(),
          style: string().optional(),
          keywords: array(string()).optional(),
          ecommerce: record(string()).optional(),
          context: record(string()).optional(),
          customFields: record(string()).optional(),
        }),
      },
      async (_ctx, input) => {
        const response = await fetcher(`${base}/alt-text/generate`, {
          method: "POST",
          signal,
          headers: { "x-api-key": token, "Content-Type": "application/json" },
          body: JSON.stringify(input),
        });
        return decodeJson(response, json());
      },
    ),
  });
}

export default defineApp(
  { user: { accounts: { alttextlab: alttextlab.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.alttextlab ?? [],
        (account) =>
          withApprovals(build(account.fields.token, fetch, signal), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "AltTextLab",
        description: "Generate accessible, SEO-aware alt text for images in 130+ languages, with writing styles, keywords, e-commerce metadata and context.",
        icons,
      },
    ),
  }),
);
