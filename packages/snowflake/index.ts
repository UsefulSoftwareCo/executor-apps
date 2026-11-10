import {
  accountRouter,
  array,
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
import { options } from "./openapi.js";


// Account hostnames: exactly one account label, optionally followed by .privatelink, matching the
// provider hosts list. Region-form locators (xy12345.us-east-1) have extra labels and are rejected.
const hostPattern = /^[a-z0-9][a-z0-9_-]*(\.privatelink)?\.snowflakecomputing\.com$/;

function origin(account: { fields: { account: string } }) {
  const host = account.fields.account
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/\/.*$/, "");
  if (!hostPattern.test(host))
    throw new Error("Enter your Snowflake account hostname, for example myorg-myaccount.snowflakecomputing.com (region-form locators are not supported).");
  return `https://${host}`;
}

const snowflake = defineProvider({
  name: "Snowflake",
  hosts: ["*.snowflakecomputing.com", "*.privatelink.snowflakecomputing.com"],
  auth: {
    // Snowflake OAuth and External OAuth need a security integration and per-account endpoints,
    // so only programmatic access tokens are offered.
    token: secrets({
      label: "Programmatic access token",
      fields: object({
        account: plain(string({ minLength: 1 })),
        token: string({ minLength: 1 }),
      }),
    }),
  },
  async health({ account, fetch, signal }) {
    const base = origin(account);
    // Listing databases needs no warehouse and no particular privilege.
    const response = await fetch(`${base}/api/v2/databases?showLimit=1`, {
      signal,
      headers: {
        Authorization: `Bearer ${account.fields.token}`,
        Accept: "application/json",
      },
    });
    await decodeJson(response, array(object({ name: string() })));
    return { accountInfo: { externalId: new URL(base).hostname, displayName: new URL(base).hostname } };
  },
});

export default defineApp(
  { user: { accounts: { snowflake: snowflake.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.snowflake ?? [],
        (account) => {
          const base = origin(account);
          return withApprovals(
            liveOpenapiRouter({ ...options, allowedOrigin: base, baseUrl: base, cache, fetch, signal, account }),
            (tool) => (tool.kind === "mutation" ? always() : undefined),
          );
        },
        { signal },
      ),
      {
        title: "Snowflake",
        description:
          "Run SQL and manage databases, schemas, tables, views, warehouses, roles, grants, tasks, streams, Cortex and the rest of Snowflake's REST APIs.",
        instructions:
          "Run SQL with `sqlapi.submitStatement`; long statements return a statement handle to poll with `sqlapi.getStatementStatus`. Resource paths take unquoted object names, and fully qualified names are `database`, `schema`, `name` path parameters.",
        icons,
      },
    ),
  }),
);
