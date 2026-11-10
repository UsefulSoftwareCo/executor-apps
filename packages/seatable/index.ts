import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  object,
  plain,
  query,
  router,
  secrets,
  string,
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { liveOpenapiRouter } from "apps/openapi";
import { icons } from "./icon.js";
import { baseOptions, filesOptions } from "./openapi.js";

// The API-Token is sent to the server the user names, so only SeaTable Cloud hosts are accepted.
const hostPattern = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9-]+)+$/;
const allowedSuffixes = [".seatable.io", ".seatable.com"];

function hostOf(raw: string): string {
  const host = raw
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/\/.*$/, "");
  if (!hostPattern.test(host) || !allowedSuffixes.some((suffix) => host.endsWith(suffix)))
    throw new Error("Enter your SeaTable server, for example cloud.seatable.io (*.seatable.io or *.seatable.com).");
  return host;
}

const BaseAccess = object({
  access_token: string({ minLength: 1 }),
  dtable_uuid: string({ minLength: 1 }),
  dtable_name: string({ minLength: 1 }),
});

type Fetch = typeof fetch;
type Fields = { server: string; token: string };

// Every base operation needs a Base-Token (a JWT valid for 3 days), which an API-Token for that
// base exchanges for. The response also carries the base UUID that the operations take.
async function exchange(fields: Fields, fetcher: Fetch, signal: AbortSignal | undefined) {
  const response = await fetcher(`https://${hostOf(fields.server)}/api/v2.1/dtable/app-access-token/`, {
    signal,
    headers: { Authorization: `Bearer ${fields.token}`, Accept: "application/json" },
  });
  return decodeJson(response, BaseAccess);
}

const seatable = defineProvider({
  name: "SeaTable",
  hosts: ["*.seatable.io", "*.seatable.com"],
  auth: {
    // Create the API-Token in the base: ... menu > API Tokens (one token per base, read-only or read-write).
    apiKey: secrets({
      label: "Base API-Token",
      fields: object({
        server: plain(string({ minLength: 1 })),
        token: string({ minLength: 1 }),
      }),
    }),
  },
  async health({ account, fetch, signal }) {
    const base = await exchange(account.fields, fetch, signal);
    return { accountInfo: { externalId: base.dtable_uuid, displayName: base.dtable_name } };
  },
});

export default defineApp(
  { user: { accounts: { seatable: seatable.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.seatable ?? [],
        (account) => {
          const origin = `https://${hostOf(account.fields.server)}`;
          const scoped = cache.forAccount(account);
          const access = () =>
            scoped.get({
              key: ["seatable-base-access", origin],
              schema: BaseAccess,
              freshFor: "2 days",
              load: ({ fetch: loadFetch, signal: loadSignal }) => exchange(account.fields, loadFetch, loadSignal),
            });
          // Base operations go out with the exchanged Base-Token; file operations take the API-Token as is.
          const authorized: Fetch = async (input, init) => {
            const request = new Request(input, init);
            if (new URL(request.url).pathname.includes("/dtables/"))
              request.headers.set("Authorization", `Bearer ${(await access()).access_token}`);
            return fetch(request);
          };
          const mount = (options: typeof baseOptions | typeof filesOptions) =>
            withApprovals(
              liveOpenapiRouter({ ...options, allowedOrigin: origin, baseUrl: origin, cache, fetch: authorized, signal, account }),
              (tool) => (tool.kind === "mutation" ? always() : undefined),
            );
          return router({
            info: router({
              getBaseUuid: query(
                {
                  description:
                    "Return the UUID and name of the base this API-Token belongs to. Pass the UUID as base_uuid to every base operation.",
                  input: object({}),
                },
                async () => {
                  const { dtable_uuid, dtable_name } = await access();
                  return { base_uuid: dtable_uuid, name: dtable_name };
                },
              ),
            }),
            base: mount(baseOptions),
            files: mount(filesOptions),
          });
        },
        { signal },
      ),
      {
        title: "SeaTable",
        description:
          "SeaTable no-code database: rows, tables, columns, views, links, SQL queries, comments, notifications, snapshots and file assets for a base.",
        instructions:
          "An account is one base (one API-Token). Call info.getBaseUuid first and pass its base_uuid to every base operation. Call base.baseInfo.getMetadata to discover table and column names; rows.querySql takes SQL such as SELECT * FROM \`Table\` LIMIT 10.",
        icons,
      },
    ),
  }),
);
