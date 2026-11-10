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
  record,
  router,
  secrets,
  string,
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

type Fetch = typeof fetch;
type Fields = { scimEndpoint: string; token: string };
type Params = Record<string, unknown>;

// The SCIM base URL is generated per workspace in ChatGPT (Workspace settings > Identity & Provisioning > Custom
// SCIM). The token is only ever sent to that URL.
function baseOf(raw: string): string {
  const text = raw.trim().replace(/\/+$/, "");
  let url: URL;
  try {
    url = new URL(/^https?:\/\//i.test(text) ? text : `https://${text}`);
  } catch {
    throw new Error("Enter the SCIM endpoint URL shown when you created the directory connection.");
  }
  if (url.protocol !== "https:") throw new Error("The SCIM endpoint must use https.");
  if (url.search !== "" || url.hash !== "") throw new Error("Enter the SCIM endpoint without a query or fragment.");
  return `${url.origin}${url.pathname.replace(/\/+$/, "")}`;
}

const scimTypes = "application/scim+json";

function build(fields: Fields, fetcher: Fetch, signal: AbortSignal | undefined) {
  const base = baseOf(fields.scimEndpoint);
  const call = async (method: string, path: string, search?: Params, body?: Params) => {
    const url = new URL(`${base}${path}`);
    for (const [key, value] of Object.entries(search ?? {})) {
      if (value !== undefined && value !== null) url.searchParams.set(key, String(value));
    }
    const response = await fetcher(url.toString(), {
      method,
      signal,
      headers: {
        Authorization: `Bearer ${fields.token}`,
        Accept: scimTypes,
        ...(body === undefined ? {} : { "Content-Type": scimTypes }),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    if (response.status === 204) return { ok: true };
    return decodeJson(response, json());
  };

  const listInput = object({
    filter: string().optional(),
    startIndex: number().optional(),
    count: number().optional(),
  });
  const listQuery = (a: Params) => ({ filter: a.filter, startIndex: a.startIndex, count: a.count });
  const id = (a: Params) => encodeURIComponent(String(a.id));

  const resource = (segment: "Users" | "Groups", noun: string, filterHint: string) =>
    router({
      list: query(
        {
          description: `List ${noun}s. Supports the SCIM filter parameter (${filterHint}) and startIndex/count paging (startIndex is 1-based).`,
          input: listInput,
        },
        async (_c, a) => call("GET", `/${segment}`, listQuery(a)),
      ),
      get: query(
        { description: `Get one ${noun} by its SCIM id.`, input: object({ id: string() }) },
        async (_c, a) => call("GET", `/${segment}/${id(a)}`),
      ),
      create: mutation(
        {
          description: `Create a ${noun}. Pass the SCIM resource as body.`,
          input: object({ body: record(json()) }),
        },
        async (_c, a) => call("POST", `/${segment}`, undefined, a.body as Params),
      ),
      replace: mutation(
        {
          description: `Replace a ${noun} (SCIM PUT). Pass the full resource as body.`,
          input: object({ id: string(), body: record(json()) }),
        },
        async (_c, a) => call("PUT", `/${segment}/${id(a)}`, undefined, a.body as Params),
      ),
      patch: mutation(
        {
          description: `Update a ${noun} with a SCIM PatchOp. Body: { schemas: ["urn:ietf:params:scim:api:messages:2.0:PatchOp"], Operations: [{ op, path, value }] }.`,
          input: object({ id: string(), body: record(json()) }),
        },
        async (_c, a) => call("PATCH", `/${segment}/${id(a)}`, undefined, a.body as Params),
      ),
      delete: mutation(
        { description: `Delete a ${noun}.`, input: object({ id: string() }) },
        async (_c, a) => call("DELETE", `/${segment}/${id(a)}`),
      ),
    });

  return router({
    users: resource("Users", "user", 'for example userName eq "a@example.com"'),
    groups: resource("Groups", "group", 'for example displayName eq "Engineering"'),
    discovery: router({
      serviceProviderConfig: query(
        { description: "Get the SCIM service provider configuration (supported features and limits).", input: object({}) },
        async () => call("GET", "/ServiceProviderConfig"),
      ),
      resourceTypes: query(
        { description: "List the SCIM resource types the endpoint supports.", input: object({}) },
        async () => call("GET", "/ResourceTypes"),
      ),
      schemas: query(
        { description: "List the SCIM schemas the endpoint supports.", input: object({}) },
        async () => call("GET", "/Schemas"),
      ),
    }),
  });
}

const chatgptenterprise = defineProvider({
  name: "ChatGPT Enterprise",
  // The SCIM endpoint is per workspace and part of the account, so there are no static hosts.
  auth: {
    scim: secrets({
      label: "SCIM endpoint and token",
      fields: object({
        scimEndpoint: plain(string({ minLength: 1 })),
        token: string({ minLength: 1 }),
      }),
    }),
  },
  async health({ account, fetch, signal }) {
    const base = baseOf(account.fields.scimEndpoint);
    const response = await fetch(`${base}/Users?count=1`, {
      signal,
      headers: { Authorization: `Bearer ${account.fields.token}`, Accept: scimTypes },
    });
    await decodeJson(response, object({}));
    return { accountInfo: { externalId: base, displayName: new URL(base).host } };
  },
});

export default defineApp(
  { user: { accounts: { chatgptenterprise: chatgptenterprise.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.chatgptenterprise ?? [],
        (account) =>
          withApprovals(build(account.fields, fetch, signal), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "ChatGPT Enterprise",
        description: "Provision and manage ChatGPT Enterprise and Edu workspace users and groups through the SCIM 2.0 API.",
        instructions:
          "This is the workspace SCIM API (RFC 7643/7644), not the OpenAI API Platform. Resources are Users and Groups; ids are SCIM ids returned by list. Use filter such as userName eq \"a@example.com\" to find a user. Write bodies are SCIM JSON resources with a schemas array. Which operations the workspace allows is reported by discovery.serviceProviderConfig.",
        icons,
      },
    ),
  }),
);
