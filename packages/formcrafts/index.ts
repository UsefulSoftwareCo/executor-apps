import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  json,
  number,
  object,
  query,
  router,
  secrets,
  string,
} from "apps";
import { icons } from "./icon.js";

const base = "https://api.formcrafts.com/v2";

const formcrafts = defineProvider({
  name: "Formcrafts",
  hosts: ["api.formcrafts.com"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // GET /v2 is the documented ping and returns the organization name.
  async health({ account, fetch, signal }) {
    const response = await fetch(base, { signal, headers: authorization(account.fields.token) });
    const { organization_name } = await decodeJson(response, object({ organization_name: string() }));
    return { accountInfo: { displayName: organization_name } };
  },
});

// HTTP basic auth: the API key is the username and the password is empty.
function authorization(token: string) {
  return { Authorization: `Basic ${btoa(`${token}:`)}` };
}

type Fetch = typeof fetch;

function client(token: string, fetcher: Fetch, signal: AbortSignal | undefined) {
  return async (path: string, params: Record<string, string | number | undefined> = {}) => {
    const url = new URL(`${base}${path}`);
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) url.searchParams.set(key, String(value));
    }
    const response = await fetcher(url, { signal, headers: authorization(token) });
    return decodeJson(response, json());
  };
}

const Page = {
  limit: number().optional(),
  before: string().optional(),
  after: string().optional(),
};
const pageHelp =
  " limit is 1-100 (default 10). before and after page by created_at (YYYY-MM-DD or ISO 8601); has_more says whether more items exist.";

function build(call: ReturnType<typeof client>) {
  return router({
    organization: query(
      { description: "Return the organization name for the API key (the documented ping).", input: object({}) },
      async () => call(""),
    ),
    workspaces: query(
      { description: `List workspaces in the organization.${pageHelp}`, input: object(Page) },
      async (_ctx, input) => call("/workspaces", input),
    ),
    forms: router(
      {
        list: query(
          {
            description: `List forms in the organization with id, name, workspace_id, enabled and timestamps (updated_at is the last published date).${pageHelp}`,
            input: object(Page),
          },
          async (_ctx, input) => call("/forms", input),
        ),
        get: query(
          {
            description:
              "Get one form: name, workspace, enabled flag, response count, fields (id, type, page, label, required) and pages.",
            input: object({ id: string({ minLength: 1 }) }),
          },
          async (_ctx, { id }) => call(`/forms/${encodeURIComponent(id)}`),
        ),
        responses: query(
          {
            description: `List live (not test) responses for a form. Each response has visitor info and a response array of field_id, field_type, value_type and value; file values carry file ids.${pageHelp}`,
            input: object({ id: string({ minLength: 1 }), ...Page }),
          },
          async (_ctx, { id, ...page }) => call(`/forms/${encodeURIComponent(id)}/responses`, page),
        ),
      },
      { title: "Forms", description: "Forms and their responses." },
    ),
    files: router(
      {
        list: query(
          {
            description: `List files uploaded through forms across the organization (id, name, type, size, timestamps).${pageHelp}`,
            input: object(Page),
          },
          async (_ctx, input) => call("/files", input),
        ),
      },
      { title: "Files", description: "Files uploaded to forms." },
    ),
  });
}

export default defineApp(
  { user: { accounts: { formcrafts: formcrafts.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(user?.accounts.formcrafts ?? [], (account) => build(client(account.fields.token, fetch, signal)), {
        signal,
      }),
      {
        title: "Formcrafts",
        description: "Read Formcrafts workspaces, forms, form responses and uploaded files.",
        icons,
      },
    ),
  }),
);
