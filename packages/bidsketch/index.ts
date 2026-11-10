import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  json,
  mutation,
  number,
  object,
  query,
  record,
  router,
  secrets,
  string,
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const base = "https://bidsketch.com/api/v1";

const bidsketch = defineProvider({
  name: "Bidsketch",
  hosts: ["bidsketch.com"],
  auth: {
    apiKey: secrets({
      label: "API token",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/proposals/stats.json`, {
      signal,
      headers: { Authorization: authorization(account.fields.token), Accept: "application/json" },
    });
    await decodeJson(response, object({ total: number() }));
  },
});

// Bidsketch uses Rails-style HTTP token authentication.
function authorization(token: string) {
  return `Token token="${token}"`;
}

type Fetch = typeof fetch;
type Method = "GET" | "POST" | "PUT" | "DELETE";
type Params = Record<string, unknown>;

function client(token: string, fetcher: Fetch, signal: AbortSignal | undefined) {
  return async (method: Method, path: string, search: Params = {}, body?: Params) => {
    const url = new URL(`${base}${path}`);
    for (const [key, value] of Object.entries(search)) {
      if (value === undefined || value === null) continue;
      url.searchParams.set(key, String(value));
    }
    const response = await fetcher(url.toString(), {
      method,
      signal,
      headers: {
        Authorization: authorization(token),
        Accept: "application/json",
        ...(body === undefined ? {} : { "Content-Type": "application/json" }),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    if (response.status === 204) return { ok: true };
    return decodeJson(response, json());
  };
}

type Call = ReturnType<typeof client>;

const page = { page: number().optional(), per_page: number().optional() };
const payload = record(json());

function read(call: Call, path: string, description: string, ids: readonly string[] = [], paged = false) {
  return query(
    {
      description,
      input: object({ ...Object.fromEntries(ids.map((id) => [id, number()])), ...(paged ? page : {}) }),
    },
    async (_ctx, input: Params) => call("GET", fill(path, ids, input), paged ? { page: input.page, per_page: input.per_page } : {}),
  );
}

function write(call: Call, method: Exclude<Method, "GET">, path: string, description: string, ids: readonly string[] = [], hasBody = true) {
  return mutation(
    {
      description,
      input: object({ ...Object.fromEntries(ids.map((id) => [id, number()])), ...(hasBody ? { body: payload } : {}) }),
    },
    async (_ctx, input: Params) => call(method, fill(path, ids, input), {}, hasBody ? (input.body as Params) : undefined),
  );
}

function fill(path: string, ids: readonly string[], input: Params) {
  let out = path;
  for (const id of ids) out = out.replace(`{${id}}`, encodeURIComponent(String(input[id])));
  return out;
}

function build(call: Call) {
  return router({
    clients: router(
      {
        list: read(call, "/clients.json", "List clients (100 per page).", [], true),
        get: read(call, "/clients/{client_id}.json", "Retrieve a client.", ["client_id"]),
        proposals: read(call, "/clients/{client_id}/proposals.json", "List a client's proposals.", ["client_id"], true),
        create: write(call, "POST", "/clients.json", "Create a client. body holds the client fields (first_name, last_name, email, name, ...)."),
        update: write(call, "PUT", "/clients/{client_id}.json", "Update a client. body holds the fields to change.", ["client_id"]),
        delete: write(call, "DELETE", "/clients/{client_id}.json", "Delete a client.", ["client_id"], false),
      },
      { title: "Clients", description: "The people and companies proposals are sent to." },
    ),
    proposals: router(
      {
        list: read(call, "/proposals.json", "List proposals (100 per page).", [], true),
        stats: read(call, "/proposals/stats.json", "Proposal statistics for the account."),
        get: read(call, "/proposals/{proposal_id}.json", "Retrieve a proposal.", ["proposal_id"]),
        content: read(call, "/proposals/{proposal_id}/content.json", "Retrieve a proposal with all its sections and fees.", ["proposal_id"]),
        create: write(call, "POST", "/proposals.json", "Create a proposal from scratch. body needs name and client_id."),
        createFromTemplate: write(
          call,
          "POST",
          "/templates/{template_id}/proposals.json",
          "Create a proposal from a template. body needs name and client_id.",
          ["template_id"],
        ),
        update: write(call, "PUT", "/proposals/{proposal_id}.json", "Update a proposal. body holds the fields to change.", ["proposal_id"]),
        delete: write(call, "DELETE", "/proposals/{proposal_id}.json", "Delete a proposal and all its content.", ["proposal_id"], false),
        sections: router(
          {
            list: read(call, "/proposals/{proposal_id}/sections.json", "List a proposal's sections.", ["proposal_id"], true),
            opening: read(call, "/proposals/{proposal_id}/sections/opening.json", "List a proposal's opening sections.", ["proposal_id"]),
            closing: read(call, "/proposals/{proposal_id}/sections/closing.json", "List a proposal's closing sections.", ["proposal_id"]),
            get: read(call, "/proposals/{proposal_id}/sections/{section_id}.json", "Retrieve a proposal section.", ["proposal_id", "section_id"]),
            create: write(call, "POST", "/proposals/{proposal_id}/sections.json", "Create a proposal section.", ["proposal_id"]),
            update: write(call, "PUT", "/proposals/{proposal_id}/sections/{section_id}.json", "Update a proposal section.", ["proposal_id", "section_id"]),
            delete: write(call, "DELETE", "/proposals/{proposal_id}/sections/{section_id}.json", "Delete a proposal section.", ["proposal_id", "section_id"], false),
          },
          { title: "Proposal sections", description: "Sections inside one proposal." },
        ),
        fees: router(
          {
            list: read(call, "/proposals/{proposal_id}/fees.json", "List a proposal's fees.", ["proposal_id"], true),
            get: read(call, "/proposals/{proposal_id}/fees/{fee_id}.json", "Retrieve a proposal fee.", ["proposal_id", "fee_id"]),
            create: write(call, "POST", "/proposals/{proposal_id}/fees.json", "Create a proposal fee.", ["proposal_id"]),
            update: write(call, "PUT", "/proposals/{proposal_id}/fees/{fee_id}.json", "Update a proposal fee.", ["proposal_id", "fee_id"]),
            delete: write(call, "DELETE", "/proposals/{proposal_id}/fees/{fee_id}.json", "Delete a proposal fee.", ["proposal_id", "fee_id"], false),
          },
          { title: "Proposal fees", description: "Fees inside one proposal." },
        ),
      },
      { title: "Proposals", description: "Proposals, their content, sections and fees." },
    ),
    fees: router(
      {
        list: read(call, "/fees.json", "List saved fees.", [], true),
        get: read(call, "/fees/{fee_id}.json", "Retrieve a saved fee.", ["fee_id"]),
        create: write(call, "POST", "/fees.json", "Create a saved fee."),
        update: write(call, "PUT", "/fees/{fee_id}.json", "Update a saved fee.", ["fee_id"]),
        delete: write(call, "DELETE", "/fees/{fee_id}.json", "Delete a saved fee.", ["fee_id"], false),
      },
      { title: "Fees", description: "Reusable fees saved to the account." },
    ),
    sections: router(
      {
        list: read(call, "/sections.json", "List saved sections.", [], true),
        get: read(call, "/sections/{section_id}.json", "Retrieve a saved section.", ["section_id"]),
        create: write(call, "POST", "/sections.json", "Create a saved section."),
        update: write(call, "PUT", "/sections/{section_id}.json", "Update a saved section.", ["section_id"]),
        delete: write(call, "DELETE", "/sections/{section_id}.json", "Delete a saved section.", ["section_id"], false),
      },
      { title: "Sections", description: "Reusable content sections saved to the account." },
    ),
    templates: router(
      {
        list: read(call, "/templates.json", "List proposal templates.", [], true),
        get: read(call, "/templates/{template_id}.json", "Retrieve a proposal template.", ["template_id"]),
      },
      { title: "Templates", description: "Proposal templates (read only)." },
    ),
    webhooks: router(
      {
        create: write(
          call,
          "POST",
          "/webhooks.json",
          "Create a webhook. body needs event (client_created, proposal_created, proposal_sent, proposal_viewed, proposal_accepted, proposal_declined, proposal_accepted_or_declined) and endpoint (URL).",
        ),
        delete: write(call, "DELETE", "/webhooks/{webhook_id}.json", "Delete a webhook.", ["webhook_id"], false),
      },
      { title: "Webhooks", description: "Event notifications. The API can only create and delete them." },
    ),
  });
}

export default defineApp(
  { user: { accounts: { bidsketch: bidsketch.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.bidsketch ?? [],
        (account) => withApprovals(build(client(account.fields.token, fetch, signal)), (tool) => (tool.kind === "mutation" ? always() : undefined)),
        { signal },
      ),
      {
        title: "Bidsketch",
        description: "Proposal software: clients, proposals with their sections and fees, saved fees and sections, templates and webhooks. Pass record fields in body; list tools take page and per_page.",
        icons,
      },
    ),
  }),
);
