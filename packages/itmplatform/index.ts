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
import { v1Options, v2Options } from "./openapi.js";

const companyPattern = /^[A-Za-z0-9._-]+$/;
const origin = "https://api.itmplatform.com";

function company(account: { fields: { company: string } }) {
  const value = account.fields.company.trim();
  if (!companyPattern.test(value)) {
    throw new Error("Enter your ITM Platform company URL name, the part after itmplatform.com/ in your login URL.");
  }
  return value;
}

type Fetch = (input: string | URL | Request, init?: RequestInit) => Promise<Response>;

// The API key is exchanged for a session token at GET /<company>/login/<apiKey>; calls carry it in `Token`.
async function login(fetch: Fetch, companyName: string, apiKey: string, signal?: AbortSignal) {
  const response = await fetch(`${origin}/${companyName}/login/${encodeURIComponent(apiKey)}`, { signal });
  const body = await decodeJson(response, object({ Token: string() }));
  return body.Token;
}

const itmplatform = defineProvider({
  name: "ITM Platform",
  hosts: ["api.itmplatform.com"],
  auth: {
    apiKey: secrets({
      label: "Company URL name and API key",
      fields: object({
        company: plain(string({ minLength: 1 })),
        apiKey: string({ minLength: 1 }),
      }),
    }),
  },
  async health({ account, fetch, signal }) {
    await login(fetch, company(account), account.fields.apiKey, signal);
    return { accountInfo: { externalId: company(account), displayName: company(account) } };
  },
});

export default defineApp(
  { user: { accounts: { itmplatform: itmplatform.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.itmplatform ?? [],
        (account) => {
          const name = company(account);
          let token: Promise<string> | undefined;
          const session = () => (token ??= login(fetch, name, account.fields.apiKey, signal).catch((e) => {
            token = undefined;
            throw e;
          }));
          // Expired sessions answer 400 ("Token expired. Please generate a new token."), not 401.
          const expired = async (response: Response) =>
            response.status === 401 ||
            (response.status === 400 && /token\s+expired/i.test(await response.clone().text().catch(() => "")));
          const sessionFetch: Fetch = async (input, init) => {
            const request = new Request(input, init);
            const send = async () => {
              const attempt = request.clone();
              attempt.headers.set("Token", await session());
              return fetch(attempt);
            };
            const response = await send();
            if (!(await expired(response))) return response;
            token = undefined;
            return send();
          };
          const mount = (options: typeof v1Options | typeof v2Options, base: string) =>
            withApprovals(
              liveOpenapiRouter({ ...options, baseUrl: base, cache, fetch: sessionFetch, signal, account }),
              (tool) => (tool.kind === "mutation" ? always() : undefined),
            );
          return router({ v1: mount(v1Options, `${origin}/${name}`), v2: mount(v2Options, `${origin}/v2/${name}`) });
        },
        { signal },
      ),
      {
        title: "ITM Platform",
        description:
          "ITM Platform: projects, programs, portfolios, tasks, timesheets, clients, services, issues, risks, purchases, revenues, resources and configuration.",
        icons,
      },
    ),
  }),
);
