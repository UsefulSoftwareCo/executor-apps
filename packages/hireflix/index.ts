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
import { graphqlRouter } from "apps/graphql";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const url = "https://api.hireflix.com/me";

const hireflix = defineProvider({
  name: "Hireflix",
  hosts: ["api.hireflix.com"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // Hireflix answers HTTP 200 even for failures, with the reason in the GraphQL `errors` payload.
  async health({ account, fetch, signal }) {
    const response = await fetch(url, {
      method: "POST",
      signal,
      headers: { "x-api-key": account.fields.token, "content-type": "application/json" },
      body: JSON.stringify({ query: "{ info { id } }" }),
    });
    const text = await response.text();
    let body: { data?: { info?: { id?: unknown } } | null; errors?: Array<{ message?: unknown }> } | undefined;
    try {
      body = JSON.parse(text);
    } catch {
      body = undefined;
    }
    const messages = (body?.errors ?? []).map((e) => String(e?.message ?? "")).filter(Boolean);
    if (messages.length > 0) throw new Error(`Hireflix rejected the request: ${messages.join("; ")}`);
    if (!response.ok) throw new Error(`Hireflix health check failed (${response.status})`);
    const data = await decodeJson(
      new Response(text, { headers: { "content-type": "application/json" } }),
      object({ data: object({ info: object({ id: string() }) }) }),
    ).then((b) => b.data);
    return { accountInfo: { externalId: data.info.id } };
  },
});

export default defineApp(
  { user: { accounts: { hireflix: hireflix.many() } }, icons },
  async ({ user, cache, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.hireflix ?? [],
        async (account) =>
          withApprovals(
            await graphqlRouter({ url, account, headers: { "x-api-key": account.fields.token }, cache, signal }),
            (tool) => (tool.kind === "mutation" ? always() : undefined),
          ),
        { signal },
      ),
      {
        title: "Hireflix",
        description: "One-way video interviews with Hireflix: positions, interviews, candidates, templates, themes, webhooks and company settings.",
        icons,
      },
    ),
  }),
);
