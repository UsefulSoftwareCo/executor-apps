import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  json,
  mutation,
  number,
  object,
  plain,
  query,
  router,
  secrets,
  string,
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

// Formsite serves each account from a numbered server (fs1, fs2, ...) under /api/v2/{user_dir}.
const serverPattern = /^fs[0-9]+$/;
const dirPattern = /^[A-Za-z0-9_.-]+$/;

type Fields = { server: string; userDir: string; token: string };

function base(fields: Fields) {
  const server = fields.server.trim().toLowerCase();
  const userDir = fields.userDir.trim();
  if (!serverPattern.test(server))
    throw new Error("Formsite server must look like fs1 or fs22, as in your form's share link.");
  if (!dirPattern.test(userDir)) throw new Error("Formsite user directory contains invalid characters.");
  return `https://${server}.formsite.com/api/v2/${userDir}`;
}

const formsite = defineProvider({
  name: "Formsite",
  hosts: ["*.formsite.com"],
  auth: {
    // The API is available on Professional plans and above; the token is on each form's Settings > Integrations > Formsite API page.
    apiKey: secrets({
      label: "API access token",
      fields: object({
        server: plain(string({ minLength: 1 })),
        userDir: plain(string({ minLength: 1 })),
        token: string({ minLength: 1 }),
      }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base(account.fields)}/forms`, {
      signal,
      headers: { Authorization: `bearer ${account.fields.token}`, Accept: "application/json" },
    });
    await decodeJson(response, object({}));
    return {
      accountInfo: { externalId: `${account.fields.server}/${account.fields.userDir}`, displayName: account.fields.userDir },
    };
  },
});

type Params = Record<string, unknown>;

function client(fields: Fields, fetcher: typeof fetch, signal: AbortSignal | undefined) {
  const root = base(fields);
  return async (method: "GET" | "POST" | "DELETE", path: string, search: Params = {}) => {
    const url = new URL(`${root}${path}`);
    for (const [key, value] of Object.entries(search)) {
      if (value === undefined || value === null) continue;
      url.searchParams.set(key, String(value));
    }
    const response = await fetcher(url.toString(), {
      method,
      signal,
      headers: { Authorization: `bearer ${fields.token}`, Accept: "application/json" },
    });
    return decodeJson(response, json());
  };
}

type Call = ReturnType<typeof client>;

const formDir = string({ minLength: 1 });

function build(call: Call) {
  const form = (input: Params) => encodeURIComponent(String(input.formDir));
  return router({
    forms: router(
      {
        list: query(
          { description: "List all forms with name, directory, state, publish link and stats (filesSize, resultsCount).", input: object({}) },
          async () => call("GET", "/forms"),
        ),
        get: query(
          { description: "Get one form by its directory (formDir).", input: object({ formDir }) },
          async (_ctx, input: Params) => call("GET", `/forms/${form(input)}`),
        ),
        items: query(
          {
            description: "List a form's result items (id, position, label, children for matrix items). Item ids are used in result searches.",
            input: object({ formDir, resultsLabels: string().optional() }),
          },
          async (_ctx, input: Params) =>
            call("GET", `/forms/${form(input)}/items`, { results_labels: input.resultsLabels }),
        ),
      },
      { title: "Forms", description: "Forms and their items." },
    ),
    results: router(
      {
        list: query(
          {
            description:
              "List a form's results. Paging: limit (max 500) and page. Filters: afterDate/beforeDate (ISO 8601 or YYYY-MM-DD HH:MM:SS), afterId/beforeId, resultsView (Results View id), sortId, sortDirection (asc|desc). `search` holds raw search parameters such as {\"search_equals[<itemId>]\": \"x\", \"search_contains[<itemId>]\": \"y\", \"search_method\": \"and\"}.",
            input: object({
              formDir,
              limit: number().optional(),
              page: number().optional(),
              afterDate: string().optional(),
              beforeDate: string().optional(),
              afterId: number().optional(),
              beforeId: number().optional(),
              resultsView: string().optional(),
              sortId: string().optional(),
              sortDirection: string().optional(),
              search: object({}).optional(),
            }),
          },
          async (_ctx, input: Params) =>
            call("GET", `/forms/${form(input)}/results`, {
              limit: input.limit,
              page: input.page,
              after_date: input.afterDate,
              before_date: input.beforeDate,
              after_id: input.afterId,
              before_id: input.beforeId,
              results_view: input.resultsView,
              sort_id: input.sortId,
              sort_direction: input.sortDirection,
              ...((input.search as Params | undefined) ?? {}),
            }),
        ),
      },
      { title: "Results", description: "Submitted form results." },
    ),
    webhooks: router(
      {
        list: query(
          { description: "List a form's webhooks (event, url, handshake_key).", input: object({ formDir }) },
          async (_ctx, input: Params) => call("GET", `/forms/${form(input)}/webhooks`),
        ),
        create: mutation(
          {
            description: "Create a result_completed webhook for a form, or update it when the url already exists. handshakeKey is echoed back in each delivery.",
            input: object({ formDir, url: string({ minLength: 1 }), handshakeKey: string().optional() }),
          },
          async (_ctx, input: Params) =>
            call("POST", `/forms/${form(input)}/webhooks`, {
              event: "result_completed",
              url: input.url,
              handshake_key: input.handshakeKey,
            }),
        ),
        delete: mutation(
          { description: "Delete a form's webhook by url.", input: object({ formDir, url: string({ minLength: 1 }) }) },
          async (_ctx, input: Params) => call("DELETE", `/forms/${form(input)}/webhooks`, { url: input.url }),
        ),
      },
      { title: "Webhooks", description: "Result-completed webhooks." },
    ),
  });
}

export default defineApp(
  { user: { accounts: { formsite: formsite.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.formsite ?? [],
        (account) =>
          withApprovals(build(client(account.fields, fetch, signal)), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Formsite",
        description: "Formsite forms, items, results and result-completed webhooks.",
        icons,
      },
    ),
  }),
);
