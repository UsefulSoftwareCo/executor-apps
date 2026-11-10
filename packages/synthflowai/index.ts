import {
  accountRouter,
  decodeJson,
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
import { options, regions } from "./openapi.js";

type Region = keyof typeof regions;

const regionOf = (value: string): Region => {
  const region = value.trim().toLowerCase();
  if (region === "global" || region === "us" || region === "eu") return region;
  throw new Error('Region must be "global", "us" or "eu".');
};

const synthflow = defineProvider({
  name: "Synthflow AI",
  hosts: ["api.synthflow.ai", "api.us.synthflow.ai", "api.eu.synthflow.ai"],
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
    const response = await fetch(`${regions[regionOf(account.fields.region)]}/v2/assistants/?limit=1`, {
      signal,
      headers: { Authorization: `Bearer ${account.fields.token}` },
    });
    await decodeJson(response, object({}));
  },
});

export default defineApp(
  { user: { accounts: { synthflow: synthflow.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.synthflow ?? [],
        (account) => {
          const origin = regions[regionOf(account.fields.region)];
          return withApprovals(
            liveOpenapiRouter({ ...options, allowedOrigin: origin, baseUrl: `${origin}/v2`, cache, fetch, signal, account }),
            (tool) => (tool.kind === "mutation" ? always() : undefined),
          );
        },
        { signal },
      ),
      {
        title: "Synthflow AI",
        description: "Build and run Synthflow AI voice agents: assistants, calls, batch calls, phone numbers, actions, knowledge bases and subaccounts.",
        icons,
      },
    ),
  }),
);
