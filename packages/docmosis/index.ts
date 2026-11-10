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

const regions = ["us1", "eu1", "au1"];

function originFor(raw: string): string {
  const region = raw.trim().toLowerCase();
  if (!regions.includes(region)) throw new Error("Region must be one of: us1, eu1, au1.");
  return `https://${region}.dws4.docmosis.com`;
}

const docmosis = defineProvider({
  name: "Docmosis",
  hosts: ["us1.dws4.docmosis.com", "eu1.dws4.docmosis.com", "au1.dws4.docmosis.com"],
  auth: {
    apiKey: secrets({
      label: "Access key",
      fields: object({
        region: plain(string({ minLength: 1 })),
        token: string({ minLength: 1 }),
      }),
    }),
  },
  // Answers 200 when the key's environment is active, 400 when the key is invalid or not ready.
  async health({ account, fetch, signal }) {
    const response = await fetch(`${originFor(account.fields.region)}/api/environment/ready`, {
      method: "POST",
      signal,
      headers: { accessKey: account.fields.token, "Content-Type": "application/json" },
      body: "{}",
    });
    if (!response.ok) throw new Error(`Docmosis rejected the access key (HTTP ${response.status}).`);
  },
});

export default defineApp(
  { user: { accounts: { docmosis: docmosis.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.docmosis ?? [],
        (account) => {
          const origin = originFor(account.fields.region);
          return withApprovals(
            liveOpenapiRouter({ ...options, allowedOrigin: origin, baseUrl: `${origin}/api`, cache, fetch, signal, account }),
            (tool) => (tool.kind === "mutation" ? always() : undefined),
          );
        },
        { signal },
      ),
      {
        title: "Docmosis",
        description:
          "Generate PDF and Word documents from templates with Docmosis Cloud: render, convert, and manage templates and images.",
        instructions:
          "The account's region (us1, eu1 or au1) must match where the Docmosis environment is hosted.",
        icons,
      },
    ),
  }),
);
