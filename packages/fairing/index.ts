import {
  accountRouter,
  array,
  decodeJson,
  defineApp,
  defineProvider,
  json,
  mutation,
  number,
  oauth2,
  object,
  query,
  router,
  secrets,
  string,
  toolAnnotations,
  withApprovals,
} from "apps";
import { mcpHealth, mcpRouter } from "apps/mcp";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const base = "https://app.fairing.co/api";
const mcpUrl = "https://app.fairing.co/mcp";

const fairing = defineProvider({
  name: "Fairing",
  hosts: ["app.fairing.co"],
  auth: {
    // Official read-only MCP server: OAuth with dynamic client registration (RFC 7591) and PKCE S256.
    oauth: oauth2({ discover: mcpUrl }),
    apiKey: secrets({
      label: "Secret token",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // Listing questions is read-only and works on every plan.
  async health(check) {
    const { account, fetch, signal } = check;
    if (account.method === "oauth") {
      return mcpHealth(check, { url: mcpUrl, headers: { Authorization: `Bearer ${account.fields.access_token}` } });
    }
    const response = await fetch(`${base}/questions`, {
      signal,
      headers: { Authorization: account.fields.token, Accept: "application/json" },
    });
    // The reference page for the questions list is not published, so no body shape is documented;
    // decodeJson rejects non-2xx statuses and non-JSON bodies.
    await decodeJson(response, json());
    return {};
  },
});

type Account = { fields: { token: string } };

// Fairing takes the raw secret token in the Authorization header, with no scheme prefix.
const headers = (account: Account) => ({ Authorization: account.fields.token, Accept: "application/json" });

const search = (params: Record<string, string | number | undefined>) => {
  const out = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) if (value !== undefined) out.set(key, String(value));
  return out.toString();
};

const fairingTools = (account: Account, signal: AbortSignal) =>
  router({
    listQuestions: query(
      {
        description:
          "List the survey questions running on the shop.",
        input: object({}),
      },
      async ({ fetch }) =>
        decodeJson(await fetch(`${base}/questions`, { signal, headers: headers(account) }), json()),
    ),
    listResponses: query(
      {
        description:
          "List survey responses (see https://docs.fairing.co/reference/the-response-object.md for the fields: question, answer, customer and order details, coupon and UTM data). Page with starting_after (a response id); limit is at most 1000 per page. inserted_at_min and since fetch only newer responses. The shared rate limit is 100 requests per minute per store, so prefer large pages.",
        input: object({
          starting_after: string().optional(),
          limit: number().optional(),
          inserted_at_min: string().optional(),
          since: string().optional(),
        }),
      },
      async ({ fetch }, input) =>
        decodeJson(await fetch(`${base}/responses?${search(input)}`, { signal, headers: headers(account) }), json()),
    ),
    createSources: mutation(
      {
        description:
          "Push up to 100 advanced-attribution sources (podcasts, creators, channels) that customers can pick as an answer. channel must be exactly one of Podcast, YouTube, Instagram, TikTok, Facebook (case-sensitive; others are rejected per item). channel_source_id is an optional handle or id. Partial success: invalid items come back under rejected. Idempotent. Partner-only: needs the Advanced Attribution plan and an approved source contributor token, otherwise 403.",
        input: object({
          sources: array(
            object({
              name: string(),
              channel: string(),
              channel_source_id: string().optional(),
            }),
          ),
        }),
        approval: always(),
      },
      async ({ fetch }, input) =>
        decodeJson(
          await fetch(`${base}/sources`, {
            method: "POST",
            signal,
            headers: { ...headers(account), "content-type": "application/json" },
            body: JSON.stringify(input),
          }),
          json(),
        ),
    ),
  });

const mcpApprovals = (tool: Parameters<typeof toolAnnotations>[0]) =>
  toolAnnotations(tool)?.readOnlyHint === true ? undefined : always();

export default defineApp({ user: { accounts: { fairing: fairing.many() } }, icons }, async ({ user, cache, signal }) => ({
  tools: router(
    await accountRouter(
      user?.accounts.fairing ?? [],
      async (account) => {
        if (account.method === "oauth") {
          return withApprovals(
            await mcpRouter({
              url: mcpUrl,
              account,
              headers: { Authorization: `Bearer ${account.fields.access_token}` },
              cache,
              signal,
            }),
            mcpApprovals,
          );
        }
        return fairingTools(account, signal);
      },
      { signal },
    ),
    {
      title: "Fairing",
      description:
        "Read Fairing post-purchase attribution survey data. API-key accounts get REST tools for questions, responses and attribution sources; OAuth accounts get Fairing's official read-only MCP analysis tools.",
      icons,
    },
  ),
}));
