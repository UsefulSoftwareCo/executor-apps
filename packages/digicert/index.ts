import {
  accountRouter,
  defineApp,
  defineProvider,
  decodeJson,
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
import { routes } from "./routes.js";

const hostUs = "www.digicert.com";
const hostEu = "certcentral.digicert.eu";

// The API key is created in CertCentral under Account > API keys and goes in X-DC-DEVKEY.
// US and EU accounts live on different hosts, so each region is its own method.
const fields = object({ token: string({ minLength: 1 }) });

const digicert = defineProvider({
  name: "DigiCert",
  hosts: [hostUs, hostEu],
  auth: {
    apiKey: secrets({ label: "CertCentral API key (US, www.digicert.com)", fields }),
    apiKeyEu: secrets({ label: "CertCentral API key (EU, certcentral.digicert.eu)", fields }),
  },
  async health({ account, fetch, signal }) {
    const host = account.method === "apiKeyEu" ? hostEu : hostUs;
    const response = await fetch(`https://${host}/services/v2/user/me`, {
      signal,
      headers: { "X-DC-DEVKEY": account.fields.token, Accept: "application/json" },
    });
    const user = await decodeJson(
      response,
      object({ id: number(), username: string() }),
    );
    return {
      accountInfo: { externalId: String(user.id), displayName: user.username },
    };
  },
});

type Fetch = typeof fetch;

function client(host: string, token: string, fetcher: Fetch, signal: AbortSignal | undefined) {
  return async (method: string, path: string, search: URLSearchParams, body: unknown) => {
    const qs = search.toString();
    const response = await fetcher(`https://${host}/services/v2${path}${qs === "" ? "" : `?${qs}`}`, {
      method,
      signal,
      headers: {
        "X-DC-DEVKEY": token,
        Accept: "application/json",
        ...(body === undefined ? {} : { "Content-Type": "application/json" }),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const type = response.headers.get("content-type") ?? "";
    if (!response.ok) throw new Error(`DigiCert answered ${response.status}: ${(await response.text()).slice(0, 1000)}`);
    if (response.status === 204) return { status: 204 };
    if (/zip|octet-stream|pkcs7/i.test(type)) {
      const bytes = new Uint8Array(await response.arrayBuffer());
      let binary = "";
      for (const byte of bytes) binary += String.fromCharCode(byte);
      return { contentType: type, encoding: "base64", body: btoa(binary) };
    }
    const text = await response.text();
    if (text === "") return { status: response.status };
    try {
      return JSON.parse(text) as unknown;
    } catch {
      return { contentType: type, body: text };
    }
  };
}

const enc = encodeURIComponent;

function build(call: ReturnType<typeof client>) {
  const groups = new Map<string, Record<string, unknown>>();
  for (const [group, name, method, path, pathParams, queryParams, description, kind] of routes) {
    const shape: Record<string, unknown> = {};
    for (const p of pathParams) shape[p] = string({ minLength: 1 });
    for (const p of queryParams) shape[p] = string().optional();
    if (kind === "list") {
      shape["filters"] = record(string()).optional();
      shape["sort"] = string().optional();
      shape["limit"] = number().optional();
      shape["offset"] = number().optional();
    }
    if (kind === "body") shape["body"] = record(json());
    if (kind === "optionalBody") shape["body"] = record(json()).optional();
    const options = { description: `${description} ${method} /services/v2${path}`, input: object(shape as never) };
    const run = async (_ctx: unknown, input: Record<string, unknown>) => {
      let resolved = path;
      for (const p of pathParams) resolved = resolved.replace(`{${p}}`, enc(String(input[p])));
      const search = new URLSearchParams();
      for (const p of queryParams) if (input[p] !== undefined) search.set(p, String(input[p]));
      if (kind === "list") {
        const filters = (input["filters"] as Record<string, string> | undefined) ?? {};
        for (const [key, value] of Object.entries(filters)) search.set(`filters[${key}]`, value);
        for (const key of ["sort", "limit", "offset"]) if (input[key] !== undefined) search.set(key, String(input[key]));
      }
      const hasBody = kind === "body" || kind === "optionalBody";
      return call(method, resolved, search, hasBody ? (input["body"] ?? (method === "GET" ? undefined : {})) : undefined);
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
        router(members as never, { title: group, description: `DigiCert CertCentral ${group} endpoints.` }),
      ]),
    ) as never,
  );
}

export default defineApp(
  { user: { accounts: { digicert: digicert.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.digicert ?? [],
        (account) =>
          withApprovals(
            build(client(account.method === "apiKeyEu" ? hostEu : hostUs, account.fields.token, fetch, signal)),
            (tool) => (tool.kind === "mutation" ? always() : undefined),
          ),
        { signal },
      ),
      {
        title: "DigiCert",
        description:
          "DigiCert CertCentral: order, reissue, duplicate, download and revoke certificates, and manage domains and DCV, organizations, users, containers and products.",
        icons,
      },
    ),
  }),
);
