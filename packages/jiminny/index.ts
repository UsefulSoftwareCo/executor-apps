import {
  accountRouter,
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
import { options } from "./openapi.js";

const regions = ["com", "eu"];

function originFor(raw: string): string {
  const region = raw.trim().toLowerCase();
  if (!regions.includes(region)) throw new Error("Region must be one of: com, eu.");
  return `https://app.jiminny.${region}`;
}

const jiminny = defineProvider({
  name: "Jiminny",
  hosts: ["app.jiminny.com", "app.jiminny.eu"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({
        region: plain(string({ minLength: 1 })),
        token: string({ minLength: 1 }),
      }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch(`${originFor(account.fields.region)}/customer/api/v1/me`, {
      signal,
      headers: { Authorization: `Bearer ${account.fields.token}`, Accept: "application/json" },
    });
    if (!response.ok) throw new Error(`Jiminny rejected the API key (HTTP ${response.status}).`);
  },
});

export default defineApp(
  { user: { accounts: { jiminny: jiminny.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.jiminny ?? [],
        (account) => {
          const origin = originFor(account.fields.region);
          return withApprovals(
            liveOpenapiRouter({
              ...options,
              allowedOrigin: origin,
              baseUrl: `${origin}/customer/api/v1`,
              cache,
              fetch,
              signal,
              account,
            }),
            (tool) => (tool.kind === "mutation" ? always() : undefined),
          );
        },
        { signal },
      ),
      {
        title: "Jiminny",
        description:
          "Jiminny conversation intelligence: activities, transcripts, summaries, action items, questions, triggers, comments, AI scorecards, coaching feedback, users and webhooks.",
        instructions:
          "The account's region (com or eu) selects the Jiminny instance; use eu if the Jiminny web app is at app.jiminny.eu.",
        icons,
      },
    ),
  }),
);
