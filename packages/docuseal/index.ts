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
import { options } from "./openapi.js";

const regions: Record<string, string> = {
  global: "https://api.docuseal.com",
  eu: "https://api.docuseal.eu",
};

function originFor(raw: string): string {
  const origin = regions[raw.trim().toLowerCase()];
  if (!origin) throw new Error("Region must be one of: global, eu.");
  return origin;
}

const docuseal = defineProvider({
  name: "DocuSeal",
  hosts: ["api.docuseal.com", "api.docuseal.eu"],
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
    const response = await fetch(`${originFor(account.fields.region)}/templates?limit=1`, {
      signal,
      headers: { "X-Auth-Token": account.fields.token },
    });
    await decodeJson(response, object({}));
  },
});

export default defineApp(
  { user: { accounts: { docuseal: docuseal.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.docuseal ?? [],
        (account) => {
          const origin = originFor(account.fields.region);
          return withApprovals(
            liveOpenapiRouter({ ...options, allowedOrigin: origin, baseUrl: origin, cache, fetch, signal, account }),
            (tool) => (tool.kind === "mutation" ? always() : undefined),
          );
        },
        { signal },
      ),
      {
        title: "DocuSeal",
        description: "Manage DocuSeal e-signature workflows: templates, submissions, submitters and signed documents.",
        instructions: "The account region is \"global\" (api.docuseal.com) or \"eu\" (api.docuseal.eu).",
        icons,
      },
    ),
  }),
);
