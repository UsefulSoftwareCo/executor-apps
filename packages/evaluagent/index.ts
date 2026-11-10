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

const regions: Record<string, string> = {
  eu: "https://api.evaluagent.com",
  "us-east": "https://api.us-east.evaluagent.com",
  aus: "https://api.aus.evaluagent.com",
};

function originFor(raw: string): string {
  const origin = regions[raw.trim().toLowerCase()];
  if (origin === undefined) throw new Error("Region must be one of: eu, us-east, aus.");
  return origin;
}

const evaluagent = defineProvider({
  name: "evaluagent",
  hosts: Object.values(regions).map((origin) => new URL(origin).hostname),
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({
        region: plain(string({ minLength: 1 })),
        accessKeyId: string({ minLength: 1 }),
        secretKey: string({ minLength: 1 }),
      }),
    }),
  },
  async health({ account, fetch, signal }) {
    const { accessKeyId, secretKey, region } = account.fields;
    const response = await fetch(`${originFor(region)}/v1/ping`, {
      signal,
      headers: { Authorization: `Basic ${btoa(`${accessKeyId}:${secretKey}`)}`, Accept: "application/json" },
    });
    if (!response.ok) throw new Error(`evaluagent rejected the API key (HTTP ${response.status}).`);
  },
});

export default defineApp(
  { user: { accounts: { evaluagent: evaluagent.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.evaluagent ?? [],
        (account) => {
          const origin = originFor(account.fields.region);
          return withApprovals(
            liveOpenapiRouter({
              ...options,
              allowedOrigin: origin,
              baseUrl: `${origin}/v1`,
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
        title: "evaluagent",
        description:
          "evaluagent contact centre quality assurance: evaluations, disputes, calibrations, actions, one-to-ones, conversation analytics, users, groups, roles and the knowledge vault.",
        instructions:
          "The account's region selects the cluster: eu (api.evaluagent.com), us-east (api.us-east.evaluagent.com) or aus (api.aus.evaluagent.com). Responses follow JSON:API.",
        icons,
      },
    ),
  }),
);
