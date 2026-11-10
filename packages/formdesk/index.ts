import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  json,
  mutation,
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
import { routes } from "./routes.js";

const formdesk = defineProvider({
  name: "Formdesk",
  hosts: ["www.formdesk.com", "*.formdesk.com"],
  auth: {
    // The API key is on a user's profile under Users > (user) > Web API. It has that user's rights.
    apiKey: secrets({
      label: "API key",
      fields: object({
        token: string({ minLength: 1 }),
        // The unique account name (folder of forms) shown in the account settings.
        domain: plain(string({ minLength: 1 })),
        // The server hosting the account, as returned by the Connect call, for example fd7.formdesk.com.
        host: plain(string({ minLength: 1 })),
      }),
    }),
  },
  // Connect is the one call that costs no credit and validates the key and folder.
  async health({ account, fetch, signal }) {
    const response = await fetch(
      `https://www.formdesk.com/api/rest/v1/${encodeURIComponent(account.fields.domain)}/connect`,
      { signal, headers: { Authorization: `Bearer ${account.fields.token}`, Accept: "application/json" } },
    );
    const connected = await decodeJson(response, object({ host: string() }));
    return { accountInfo: { externalId: account.fields.domain, displayName: connected.host } };
  },
});

type Fetch = typeof fetch;
type Fields = { token: string; domain: string; host: string };

function client(fields: Fields, fetcher: Fetch, signal: AbortSignal | undefined) {
  const base = `https://${fields.host}/api/rest/v1/${encodeURIComponent(fields.domain)}`;
  return async (method: string, path: string, search: Record<string, unknown>, body: unknown) => {
    const url = new URL(`${base}${path}`);
    for (const [key, value] of Object.entries(search)) {
      if (value === undefined || value === null) continue;
      url.searchParams.set(key, String(value));
    }
    const response = await fetcher(url.toString(), {
      method,
      signal,
      headers: {
        Authorization: `Bearer ${fields.token}`,
        Accept: "application/json",
        ...(body === undefined ? {} : { "Content-Type": "application/json" }),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const type = response.headers.get("content-type") ?? "";
    if (!response.ok) throw new Error(`Formdesk answered ${response.status}: ${(await response.text()).slice(0, 1000)}`);
    if (!type.includes("json") && !type.startsWith("text/")) {
      const bytes = new Uint8Array(await response.arrayBuffer());
      let binary = "";
      for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
      return { contentType: type, contentDisposition: response.headers.get("content-disposition"), base64: btoa(binary) };
    }
    const text = await response.text();
    if (text === "") return { status: response.status, credits: response.headers.get("credits") };
    try {
      return JSON.parse(text) as unknown;
    } catch {
      return { status: response.status, body: text };
    }
  };
}

const enc = encodeURIComponent;

function build(call: ReturnType<typeof client>) {
  const groups = new Map<string, Record<string, unknown>>();
  for (const [group, name, method, path, pathParams, queryParams, description] of routes) {
    const fields: Record<string, unknown> = {};
    for (const p of pathParams) fields[p] = string({ minLength: 1 });
    for (const p of queryParams) fields[p] = string().optional();
    const hasBody = method === "POST" || method === "PUT";
    if (hasBody) fields["body"] = json().optional();
    const options = {
      description: `${description} ${method} ${path}. Every call except connect costs one Formdesk credit.`,
      input: object(fields as never),
    };
    const run = async (_ctx: unknown, input: Record<string, unknown>) => {
      let resolved = path;
      for (const p of pathParams) resolved = resolved.replace(`{${p}}`, enc(String(input[p])));
      const search: Record<string, unknown> = {};
      for (const p of queryParams) search[p] = input[p];
      return call(method, resolved, search, hasBody ? input["body"] : undefined);
    };
    const operation = method === "GET" ? query(options as never, run as never) : mutation(options as never, run as never);
    const members = groups.get(group) ?? {};
    members[name] = operation;
    groups.set(group, members);
  }
  return router(
    Object.fromEntries(
      [...groups].map(([group, members]) => [
        group,
        router(members as never, { title: group, description: `Formdesk ${group} endpoints.` }),
      ]),
    ) as never,
  );
}

export default defineApp(
  { user: { accounts: { formdesk: formdesk.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.formdesk ?? [],
        (account) =>
          withApprovals(build(client(account.fields, fetch, signal)), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Formdesk",
        description: "Formdesk online forms: forms, results, files, users, visitors and prefill tickets.",
        instructions:
          "Form arguments are form names (as in the form URL). Result and file ids come from results.listIds and files.list. The API bills one credit per call.",
        icons,
      },
    ),
  }),
);
