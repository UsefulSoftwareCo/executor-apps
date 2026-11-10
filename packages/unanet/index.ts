import {
  accountRouter,
  defineApp,
  defineProvider,
  object,
  router,
  secrets,
  string,
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { liveOpenapiRouter } from "apps/openapi";
import { icons } from "./icon.js";
import { compassOptions, crmOptions } from "./openapi.js";

type Fetch = typeof globalThis.fetch;
type Fields = { readonly firmId: string; readonly apiKey: string; readonly username: string; readonly password: string };
type Session = { token: string; refresh: string | undefined };

const origin = "https://compass.cosential.com";

// The login response is `{ Response: { Token, Refresh } }`; the documented refresh response is
// `{ AuthResponse: { token, refresh } }`. Read either shape, with either capitalization.
const readSession = (body: unknown): Session | undefined => {
  const queue: unknown[] = [body];
  for (let node = queue.shift(); node !== undefined; node = queue.shift()) {
    if (typeof node !== "object" || node === null) continue;
    const record = node as Record<string, unknown>;
    const token = record.Token ?? record.token;
    if (typeof token === "string" && token.length > 0) {
      const refresh = record.Refresh ?? record.refresh;
      return { token, refresh: typeof refresh === "string" && refresh.length > 0 ? refresh : undefined };
    }
    queue.push(record.Response, record.AuthResponse);
  }
  return undefined;
};

const postJson = async (fetch: Fetch, path: string, body: unknown, signal: AbortSignal | undefined) => {
  const response = await fetch(`${origin}${path}`, {
    method: "POST",
    signal,
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(body),
  });
  return response;
};

// POST /v2/api/token/auth with the firm id, username and password. The firm id is an integer in the
// document; the server also accepts its decimal string (checked against the live endpoint).
const login = async (fetch: Fetch, fields: Fields, signal: AbortSignal | undefined): Promise<Session> => {
  const response = await postJson(
    fetch,
    "/v2/api/token/auth",
    { FirmId: fields.firmId, Username: fields.username, Password: fields.password },
    signal,
  );
  if (!response.ok) {
    throw new Error(
      response.status === 401 || response.status === 400
        ? "Unanet rejected the firm ID, username or password."
        : `Unanet token request failed with status ${response.status}.`,
    );
  }
  const session = readSession(await response.json().catch(() => undefined));
  if (session === undefined) throw new Error("Unanet returned no access token.");
  return session;
};

// POST /v2/api/token/auth/refresh; falls back to a fresh login when the refresh token is gone or refused.
const renew = async (fetch: Fetch, fields: Fields, previous: Session | undefined, signal: AbortSignal | undefined) => {
  if (previous?.refresh !== undefined) {
    const response = await postJson(fetch, "/v2/api/token/auth/refresh", { Refresh: previous.refresh }, signal);
    if (response.ok) {
      const session = readSession(await response.json().catch(() => undefined));
      if (session !== undefined) return session;
    }
  }
  return login(fetch, fields, signal);
};

const withCredentials = (init: RequestInit | undefined, input: Parameters<Fetch>[0], fields: Fields, token: string) => {
  const headers = new Headers(init?.headers ?? (input instanceof Request ? input.headers : undefined));
  headers.set("Authorization", `Bearer ${token}`);
  headers.set("x-compass-api-key", fields.apiKey);
  headers.set("x-compass-firm-id", fields.firmId);
  return headers;
};

const sessions = new Map<string, Session>();

// Every tool call carries `Authorization: Bearer` (the documents' global requirement, together with
// x-compass-api-key). The token is fetched on first use, kept in memory and renewed after a 401.
const bearerFetch = (fetch: Fetch, accountId: string, fields: Fields): Fetch =>
  async (input, init) => {
    const signal = init?.signal ?? undefined;
    const send = async (session: Session) =>
      fetch(input instanceof Request ? input.clone() : input, {
        ...init,
        headers: withCredentials(init, input, fields, session.token),
      });
    let session = sessions.get(accountId) ?? (await login(fetch, fields, signal));
    sessions.set(accountId, session);
    const response = await send(session);
    if (response.status !== 401) return response;
    session = await renew(fetch, fields, session, signal);
    sessions.set(accountId, session);
    return send(session);
  };

const unanet = defineProvider({
  name: "Unanet",
  hosts: ["compass.cosential.com"],
  auth: {
    // Compass sign-up page / Unanet CRM admin: the firm id and API key issued for your firm, plus the
    // username and password of a Unanet CRM user (exchanged for a Bearer token at /v2/api/token/auth).
    apiKey: secrets({
      label: "Firm ID, API key and user login",
      fields: object({
        firmId: string({ minLength: 1 }),
        apiKey: string({ minLength: 1 }),
        username: string({ minLength: 1 }),
        password: string({ minLength: 1 }),
      }),
    }),
  },
  async health({ account, fetch, signal }) {
    const fields = account.fields;
    const session = await login(fetch, fields, signal);
    const response = await fetch(`${origin}/v2/api/rest/currencies`, {
      signal,
      headers: withCredentials({ headers: { Accept: "application/json" } }, "", fields, session.token),
    });
    if (response.status === 401 || response.status === 403) {
      throw new Error("Unanet accepted the login but rejected the API key. Check the firm ID and API key.");
    }
    if (!response.ok) throw new Error(`Unanet health check failed with status ${response.status}.`);
    return { accountInfo: { externalId: fields.firmId } };
  },
});

export default defineApp(
  { user: { accounts: { unanet: unanet.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.unanet ?? [],
        (account) => {
          const mount = (options: typeof compassOptions | typeof crmOptions) =>
            withApprovals(liveOpenapiRouter({
                ...options,
                cache,
                fetch: bearerFetch(fetch, account.id, account.fields),
                signal,
                account,
              }), (tool) =>
              tool.kind === "mutation" ? always() : undefined,
            );
          return router({ compass: mount(compassOptions), crm: mount(crmOptions) });
        },
        { signal },
      ),
      {
        title: "Unanet",
        description: "Unanet CRM (Cosential Compass): projects, companies, contacts, opportunities and activities.",
        icons,
      },
    ),
  }),
);
