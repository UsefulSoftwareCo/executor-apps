import {
  accountRouter,
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

const mcpUrl = "https://api.woodpecker.co/mcp/v1";
const rest = "https://api.woodpecker.co/rest";

const woodpecker = defineProvider({
  name: "Woodpecker",
  hosts: ["api.woodpecker.co", "login.woodpecker.co"],
  auth: {
    // REST API key: Add-ons > API & Integrations > API keys > Create a key. Sent in the x-api-key header.
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
    // The hosted MCP server is OAuth-only.
    oauth: oauth2({ discover: mcpUrl }),
  },
  // API keys: the mailbox list is read-only. OAuth: initialize the MCP server.
  async health(check) {
    const { account, fetch, signal } = check;
    if (account.method === "oauth") {
      return mcpHealth(check, { url: mcpUrl, headers: { Authorization: `Bearer ${account.fields.access_token}` } });
    }
    const response = await fetch(`${rest}/v2/mailboxes`, {
      signal,
      headers: { "x-api-key": account.fields.token, Accept: "application/json" },
    });
    await decodeJson(response, json());
  },
});

type Account = { fields: { token: string } };

const search = (params: Record<string, string | number | boolean | undefined>) => {
  const out = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) if (value !== undefined) out.set(key, String(value));
  const text = out.toString();
  return text === "" ? "" : `?${text}`;
};

const restTools = (account: Account, signal: AbortSignal) => {
  const headers = { "x-api-key": account.fields.token, Accept: "application/json" };
  type F = typeof fetch;
  // Some endpoints answer 200 or 204 with an empty body.
  const read = async (response: Response) => {
    if (response.status === 204) return null;
    const text = await response.clone().text();
    return text === "" ? null : decodeJson(response, json());
  };
  const get = (f: F, path: string) => f(`${rest}${path}`, { signal, headers }).then(read);
  const send = (f: F, method: "POST" | "PATCH" | "DELETE", path: string, body?: unknown) =>
    f(`${rest}${path}`, {
      method,
      signal,
      headers: body === undefined ? headers : { ...headers, "content-type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    }).then(read);

  const CampaignId = object({ campaign_id: number() });
  const id = (value: number) => encodeURIComponent(String(value));

  return router({
    campaigns: router(
      {
        list: query(
          {
            description:
              "List campaigns (v1 campaign_list). status is a comma-separated filter of RUNNING, DRAFT, EDITED, PAUSED, STOPPED, COMPLETED; id is a comma-separated list of campaign ids (a single id returns detailed stats).",
            input: object({ status: string().optional(), id: string().optional() }),
          },
          ({ fetch }, input) => get(fetch, `/v1/campaign_list${search(input)}`),
        ),
        get: query(
          { description: "Get one campaign with its settings, mailboxes and step chain.", input: CampaignId },
          ({ fetch }, { campaign_id }) => get(fetch, `/v2/campaigns/${id(campaign_id)}`),
        ),
        stats: query(
          {
            description: "Get statistics for a single campaign, including per-step counts (v1 campaign_list with one id).",
            input: CampaignId,
          },
          ({ fetch }, { campaign_id }) => get(fetch, `/v1/campaign_list${search({ id: campaign_id })}`),
        ),
        run: mutation(
          { description: "Start or resume a campaign (status becomes RUNNING).", input: CampaignId, approval: always() },
          ({ fetch }, { campaign_id }) => send(fetch, "POST", `/v2/campaigns/${id(campaign_id)}/run`),
        ),
        pause: mutation(
          { description: "Pause a campaign; outreach stops until it is run again.", input: CampaignId, approval: always() },
          ({ fetch }, { campaign_id }) => send(fetch, "POST", `/v2/campaigns/${id(campaign_id)}/pause`),
        ),
        stop: mutation(
          { description: "Stop a campaign.", input: CampaignId, approval: always() },
          ({ fetch }, { campaign_id }) => send(fetch, "POST", `/v2/campaigns/${id(campaign_id)}/stop`),
        ),
        delete: mutation(
          { description: "Delete a campaign.", input: CampaignId, approval: always() },
          ({ fetch }, { campaign_id }) => send(fetch, "DELETE", `/v2/campaigns/${id(campaign_id)}`),
        ),
      },
      { title: "Campaigns" },
    ),
    prospects: router(
      {
        list: query(
          {
            description:
              "List prospects (v1). Filters: id (comma-separated), status (ACTIVE, BOUNCED, REPLIED, BLACKLIST, INVALID), contacted, interested (INTERESTED, MAYBE-LATER, NOT-INTERESTED, NOT-MARKED), activity (OPENED, NOT-OPENED, CLICKED, NOT-CLICKED), diff. page starts at 1; per_page defaults to 100, max 1000; sort is e.g. +company,-last_contacted. An empty result is a message object.",
            input: object({
              id: string().optional(),
              status: string().optional(),
              contacted: string().optional(),
              interested: string().optional(),
              activity: string().optional(),
              diff: string().optional(),
              page: number().optional(),
              per_page: number().optional(),
              sort: string().optional(),
            }),
          },
          ({ fetch }, input) => get(fetch, `/v1/prospects${search(input)}`),
        ),
        search: query(
          {
            description:
              "Search prospects (v1). search is comma-separated field=value pairs such as email=drew,company=Acme (different fields AND, repeated field OR). Optional status, campaigns_id, campaigns_details, page, per_page, sort.",
            input: object({
              search: string(),
              status: string().optional(),
              campaigns_id: string().optional(),
              campaigns_details: string().optional(),
              page: number().optional(),
              per_page: number().optional(),
              sort: string().optional(),
            }),
          },
          ({ fetch }, input) => get(fetch, `/v1/prospects${search(input)}`),
        ),
        addToCampaign: mutation(
          {
            description:
              "Add prospects to a campaign (v1 add_prospects_campaign, up to 20000 per request). Body: campaign {campaign_id, send_after?}, prospects [{email, first_name?, last_name?, company?, title?, tags?, snippet1..snippet15?, ...}], force? (also adds non-ACTIVE prospects, which may be re-contacted), file_name?.",
            input: object({
              campaign: object({ campaign_id: number(), send_after: string().optional() }),
              prospects: json(),
              force: json().optional(),
              file_name: string().optional(),
            }),
            approval: always(),
          },
          ({ fetch }, input) => send(fetch, "POST", "/v1/add_prospects_campaign", input),
        ),
        delete: mutation(
          {
            description: "Delete prospects from the database (v1 DELETE /prospects). ids is a comma-separated list of prospect ids.",
            input: object({ ids: string() }),
            approval: always(),
          },
          ({ fetch }, { ids }) => send(fetch, "DELETE", `/v1/prospects${search({ id: ids })}`),
        ),
      },
      { title: "Prospects" },
    ),
    mailboxes: router(
      {
        list: query(
          { description: "List connected SMTP and IMAP mailbox configurations.", input: object({}) },
          ({ fetch }) => get(fetch, "/v2/mailboxes"),
        ),
        get: query(
          { description: "Get one mailbox configuration by id.", input: object({ id: number() }) },
          ({ fetch }, { id: mailboxId }) => get(fetch, `/v2/mailboxes/${id(mailboxId)}`),
        ),
      },
      { title: "Mailboxes" },
    ),
    reports: router(
      {
        // Report generation only starts server-side computation and returns a hash; it changes nothing the user owns.
        generateCampaignStats: mutation(
          {
            description:
              "Start the general statistics per campaign report for a date range (YYYY-MM-DD, at most the last 30 days). Returns a hash; pass it to reports.get until status is READY.",
            input: object({ from: string(), to: string() }),
            approval: always(),
          },
          ({ fetch }, input) => send(fetch, "POST", "/v2/reports/campaigns", input),
        ),
        get: query(
          {
            description:
              "Fetch a generated report by hash. status is PENDING, WAITING, IN_PROGRESS, READY or FAILED; report is null until READY. sort is +id or -id.",
            input: object({ hash: string(), sort: string().optional() }),
          },
          ({ fetch }, { hash, sort }) => get(fetch, `/v2/reports/${encodeURIComponent(hash)}${search({ sort })}`),
        ),
      },
      { title: "Reports" },
    ),
  });
};

export default defineApp({ user: { accounts: { woodpecker: woodpecker.many() } }, icons }, async ({ user, signal }) => ({
  tools: router(
    await accountRouter(
      user?.accounts.woodpecker ?? [],
      async (account) => {
        // The hosted MCP server accepts OAuth only; the REST API accepts API keys only.
        if (account.method === "apiKey") return router({ rest: restTools(account, signal) }, { title: "Woodpecker" });
        return withApprovals(
          await mcpRouter({
            url: mcpUrl,
            account,
            headers: { Authorization: `Bearer ${account.fields.access_token}` },
            signal,
          }),
          (tool) => (toolAnnotations(tool)?.readOnlyHint === true ? undefined : always()),
        );
      },
      { signal },
    ),
    {
      title: "Woodpecker",
      description:
        "Run cold email and LinkedIn outreach in Woodpecker: campaigns, sequence steps, prospects, mailboxes and statistics. OAuth accounts get the hosted MCP tools; API-key accounts get REST tools under rest.",
      icons,
    },
  ),
}));
