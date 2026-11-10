import {
  accountRouter,
  array,
  decodeJson,
  defineApp,
  defineProvider,
  json,
  mutation,
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

// Heap's ingestion APIs take the environment ID in the body and need no secret.
// The deletion API (and the auth token behind it) always lives on heapanalytics.com,
// for US and EU workspaces alike.
const US = "https://heapanalytics.com";
const EU = "https://c.eu.heap-api.com";
const auth = "https://heapanalytics.com/api/public/v0";

const fields = object({ appId: string({ minLength: 1 }), apiKey: string({ minLength: 1 }) });

const heap = defineProvider({
  name: "Heap",
  hosts: ["heapanalytics.com", "c.eu.heap-api.com"],
  auth: {
    // Settings > Account > Manage > Privacy & Security > API (the app ID is the Main Production environment ID).
    apiKey: secrets({ label: "App ID and API key (US data center)", fields }),
    euApiKey: secrets({ label: "App ID and API key (EU data center)", fields }),
  },
  // Exchanges the app ID and API key for a temporary auth token, which is what the deletion API needs.
  async health({ account, fetch, signal }) {
    const basic = btoa(`${account.fields.appId}:${account.fields.apiKey}`);
    const response = await fetch(`${auth}/auth_token`, {
      method: "POST",
      signal,
      headers: { Authorization: `Basic ${basic}` },
    });
    await decodeJson(response, object({ access_token: string() }));
    return { accountInfo: { externalId: account.fields.appId, displayName: `Heap app ${account.fields.appId}` } };
  },
});

type Account = { method: "apiKey" | "euApiKey"; fields: { appId: string; apiKey: string } };

const properties = record(json());

async function post(fetcher: typeof fetch, signal: AbortSignal | undefined, url: string, body: unknown, headers: Record<string, string> = {}) {
  const response = await fetcher(url, {
    method: "POST",
    signal,
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error(`Heap returned ${response.status}: ${(await response.text()).slice(0, 500)}`);
  const text = await response.text();
  return text ? (JSON.parse(text) as unknown) : { ok: true };
}

async function token(fetcher: typeof fetch, signal: AbortSignal | undefined, account: Account) {
  const basic = btoa(`${account.fields.appId}:${account.fields.apiKey}`);
  const response = await fetcher(`${auth}/auth_token`, { method: "POST", signal, headers: { Authorization: `Basic ${basic}` } });
  const { access_token } = await decodeJson(response, object({ access_token: string() }));
  return access_token;
}

const identityNote =
  "Identities are case-sensitive strings up to 255 characters. Heap limits requests to 30 per 30 seconds per identity.";

function tools(account: Account, fetcher: typeof fetch, signal: AbortSignal | undefined) {
  const base = account.method === "euApiKey" ? EU : US;
  const appId = account.fields.appId;
  return router({
    track: mutation(
      {
        description: `Send one custom server-side event for a user. Give either identity or userId, not both. ${identityNote}`,
        input: object({
          event: string({ minLength: 1 }),
          identity: string().optional(),
          userId: string().optional(),
          timestamp: string().optional(),
          properties: properties.optional(),
        }),
      },
      async (_ctx, args) =>
        post(fetcher, signal, `${base}/api/track`, {
          app_id: appId,
          event: args.event,
          ...(args.identity === undefined ? {} : { identity: args.identity }),
          ...(args.userId === undefined ? {} : { user_id: args.userId }),
          ...(args.timestamp === undefined ? {} : { timestamp: args.timestamp }),
          ...(args.properties === undefined ? {} : { properties: args.properties }),
        }),
    ),
    bulkTrack: mutation(
      {
        description:
          "Send many custom server-side events in one call. Each item has event, identity (or user_id), optional ISO 8601 timestamp and optional properties. Limited to 1000 events per minute per identity and 15,000 per minute per app.",
        input: object({ events: array(record(json())) }),
      },
      async (_ctx, args) => post(fetcher, signal, `${base}/api/track`, { app_id: appId, events: args.events }),
    ),
    identify: mutation(
      {
        description:
          "Link an anonymous Heap SDK user ID to a known identity such as an email address. Events recorded for the user ID are migrated to the identity.",
        input: object({ userId: string({ minLength: 1 }), identity: string({ minLength: 1 }), timestamp: string().optional() }),
      },
      async (_ctx, args) =>
        post(fetcher, signal, `${base}/api/v1/identify`, {
          app_id: appId,
          user_id: args.userId,
          identity: args.identity,
          ...(args.timestamp === undefined ? {} : { timestamp: args.timestamp }),
        }),
    ),
    addUserProperties: mutation(
      {
        description: `Attach custom properties to an identified user. Write the built-in Email property with a lowercase "email" key. Values must be numbers or strings under 1024 characters. ${identityNote}`,
        input: object({ identity: string({ minLength: 1 }), properties }),
      },
      async (_ctx, args) =>
        post(fetcher, signal, `${base}/api/add_user_properties`, { app_id: appId, identity: args.identity, properties: args.properties }),
    ),
    bulkAddUserProperties: mutation(
      {
        description:
          "Attach custom properties to many identified users in one call. Each item has identity and properties. At most 1000 users per request.",
        input: object({ users: array(object({ identity: string({ minLength: 1 }), properties })) }),
      },
      async (_ctx, args) => post(fetcher, signal, `${base}/api/add_user_properties`, { app_id: appId, users: args.users }),
    ),
    addAccountProperties: mutation(
      {
        description:
          "Attach custom properties to one account. Requires account IDs to be captured in Heap or the Salesforce integration.",
        input: object({ accountId: string({ minLength: 1 }), properties }),
      },
      async (_ctx, args) =>
        post(fetcher, signal, `${base}/api/add_account_properties`, {
          app_id: appId,
          account_id: args.accountId,
          properties: args.properties,
        }),
    ),
    bulkAddAccountProperties: mutation(
      {
        description: "Attach custom properties to many accounts in one call. Each item has account_id and properties.",
        input: object({ accounts: array(object({ account_id: string({ minLength: 1 }), properties })) }),
      },
      async (_ctx, args) => post(fetcher, signal, `${base}/api/add_account_properties`, { app_id: appId, accounts: args.accounts }),
    ),
    deleteUsers: mutation(
      {
        description:
          "Permanently delete users, and their data, from every environment of the Heap account. Each item has either user_id or identity. Up to 10,000 users per request. Returns a deletion request ID to check with deletionStatus.",
        input: object({ users: array(object({ user_id: string().optional(), identity: string().optional() })) }),
      },
      async (_ctx, args) => {
        const bearer = await token(fetcher, signal, account);
        return post(fetcher, signal, `${auth}/user_deletion`, { users: args.users }, { Authorization: `Bearer ${bearer}` });
      },
    ),
    deletionStatus: query(
      {
        description: "Check the status of a user deletion request by its deletion request ID.",
        input: object({ deletionRequestId: string({ minLength: 1 }) }),
      },
      async (_ctx, args) => {
        const bearer = await token(fetcher, signal, account);
        const response = await fetcher(`${auth}/deletion_status/${encodeURIComponent(args.deletionRequestId)}`, {
          signal,
          headers: { Authorization: `Bearer ${bearer}` },
        });
        return decodeJson(response, json());
      },
    ),
  });
}

export default defineApp(
  { user: { accounts: { heap: heap.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.heap ?? [],
        (account) =>
          withApprovals(tools(account as Account, fetch, signal), (tool) => (tool.kind === "mutation" ? always() : undefined)),
        { signal },
      ),
      {
        title: "Heap",
        description:
          "Heap product analytics: send server-side events, identify users, set user and account properties, and delete users.",
        icons,
      },
    ),
  }),
);
