import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  object,
  plain,
  router,
  secrets,
  string,
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { liveOpenapiRouter } from "apps/openapi";
import { icons } from "./icon.js";
import { md5 } from "./md5.js";
import { instanceOptions, serviceUrl } from "./openapi.js";

const LoginResponse = object({ ReturnCode: string(), SessionId: string(), UserItemGuid: string() });

type Credentials = { serviceUrl: string; username: string; password: string };
type Fetch = typeof globalThis.fetch;

// eWay-CRM sessions last 20 minutes after the last call and 24 hours at most.
const idleLimit = 15 * 60 * 1000;
const sessions = new Map<string, { id: string; used: number }>();

async function logIn(fetch: Fetch, fields: Credentials, signal: AbortSignal | undefined) {
  const response = await fetch(`${serviceUrl(fields.serviceUrl)}/API.svc/LogIn`, {
    method: "POST",
    signal,
    headers: { "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify({
      userName: fields.username,
      passwordHash: md5(fields.password),
      appVersion: "Executor",
      clientMachineName: "Executor",
    }),
  });
  const login = await decodeJson(response, LoginResponse);
  if (login.ReturnCode !== "rcSuccess") throw new Error(`eWay-CRM login failed: ${login.ReturnCode}`);
  return login;
}

async function session(fetch: Fetch, fields: Credentials, signal: AbortSignal | undefined, renew: boolean) {
  const key = `${serviceUrl(fields.serviceUrl)}\n${fields.username}\n${md5(fields.password)}`;
  const cached = sessions.get(key);
  if (!renew && cached !== undefined && Date.now() - cached.used < idleLimit) {
    cached.used = Date.now();
    return cached.id;
  }
  const { SessionId } = await logIn(fetch, fields, signal);
  sessions.set(key, { id: SessionId, used: Date.now() });
  return SessionId;
}

const eway = defineProvider({
  name: "eWay-CRM",
  hosts: ["*.eway-crm.com"],
  // OAuth is not declared: the authorize and token endpoints belong to each instance
  // (<service>/auth/connect/...) and the framework only takes static endpoint strings.
  auth: {
    login: secrets({
      label: "Username and password",
      fields: object({
        serviceUrl: plain(string({ minLength: 1 })),
        username: plain(string({ minLength: 1 })),
        password: string({ minLength: 1 }),
      }),
    }),
  },
  async health({ account, fetch, signal }) {
    const login = await logIn(fetch, account.fields, signal);
    return { accountInfo: { externalId: login.UserItemGuid, displayName: account.fields.username } };
  },
});

export default defineApp(
  { user: { accounts: { eway: eway.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.eway ?? [],
        (account) => {
          const fields = account.fields;
          // Every method takes the session id in its JSON body: open a session on first use,
          // add it to each call and retry once with a fresh session when the server rejects it.
          const withSession: typeof fetch = async (input, init) => {
            const send = async (renew: boolean) => {
              const sessionId = await session(fetch, fields, signal, renew);
              let body = init?.body;
              if (typeof body === "string") {
                const parsed: unknown = JSON.parse(body);
                if (typeof parsed === "object" && parsed !== null && !Array.isArray(parsed))
                  body = JSON.stringify({ ...parsed, sessionId });
              }
              return fetch(input, { ...init, body });
            };
            const first = await send(false);
            if (init?.method !== "POST") return first;
            const text = await first.clone().text();
            if (!text.includes("rcBadSession")) return first;
            return send(true);
          };
          return withApprovals(
            liveOpenapiRouter({ ...instanceOptions(fields.serviceUrl), cache, fetch: withSession, signal, account }),
            (tool) => (tool.kind === "mutation" ? always() : undefined),
          );
        },
        { signal },
      ),
      {
        title: "eWay-CRM",
        description: "Contacts, companies, leads, projects, journals, tasks and the rest of the eWay-CRM Web Service API.",
        icons,
      },
    ),
  }),
);
