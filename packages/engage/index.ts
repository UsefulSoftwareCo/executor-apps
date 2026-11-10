import {
  accountRouter,
  array,
  boolean,
  decodeJson,
  defineApp,
  defineProvider,
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

const base = "https://api.engage.so/v1";

type Fields = { apiKey: string; apiSecret: string };
type Params = Record<string, unknown>;

// HTTP Basic: API key as the username, API secret as the password.
function authorization(fields: Fields): string {
  return `Basic ${btoa(`${fields.apiKey}:${fields.apiSecret}`)}`;
}

const engage = defineProvider({
  name: "Engage",
  hosts: ["api.engage.so"],
  auth: {
    // Engage dashboard > Settings > Account > API keys.
    apiKey: secrets({
      label: "API key and secret (secret may be left empty for endpoints that accept the key alone)",
      fields: object({ apiKey: string({ minLength: 1 }), apiSecret: string() }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/lists?limit=1`, {
      signal,
      headers: { Authorization: authorization(account.fields), Accept: "application/json" },
    });
    await decodeJson(response, object({}));
  },
});

const uid = string();
const meta = record(json());

function build(fields: Fields, fetcher: typeof fetch, signal: AbortSignal | undefined) {
  const call = async (method: string, path: string, search: Params, body: Params | undefined) => {
    const url = new URL(`${base}${path}`);
    for (const [key, value] of Object.entries(search)) {
      if (value !== undefined && value !== null) url.searchParams.set(key, String(value));
    }
    const response = await fetcher(url.toString(), {
      method,
      signal,
      headers: {
        Authorization: authorization(fields),
        Accept: "application/json",
        ...(body === undefined ? {} : { "Content-Type": "application/json" }),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    return decodeJson(response, json());
  };
  const enc = encodeURIComponent;
  // Strips path parameters from the arguments, leaving the request body.
  const rest = (args: Params, ...omit: string[]): Params =>
    Object.fromEntries(Object.entries(args).filter(([key, value]) => !omit.includes(key) && value !== undefined));

  const page = { limit: number().optional(), next_cursor: string().optional(), previous_cursor: string().optional() };
  const userBody = {
    first_name: string().optional(),
    last_name: string().optional(),
    email: string().optional(),
    number: string().optional(),
    device_token: string().optional(),
    device_platform: string().optional(),
    created_at: string().optional(),
    meta: meta.optional(),
  };
  const accountRefs = array(object({ id: string(), role: string().optional() }));

  const users = router({
    create: mutation(
      {
        description:
          "Create a customer (or an account when is_account is true). id is your own unique, alphanumeric identifier for the user and becomes the uid. Optionally subscribe to lists (list ids) and add to accounts.",
        input: object({
          id: string(),
          ...userBody,
          is_account: boolean().optional(),
          lists: array(string()).optional(),
          accounts: accountRefs.optional(),
        }),
      },
      (_c, args) => call("POST", "/users", {}, rest(args)),
    ),
    get: query(
      { description: "Retrieve a customer or account by uid (the id you supplied, not Engage's internal id).", input: object({ uid }) },
      (_c, args) => call("GET", `/users/${enc(args.uid)}`, {}, undefined),
    ),
    list: query(
      {
        description: "List customers and accounts, 10 by default and at most 30 per page. Returns data and next_cursor. Use only one of next_cursor and previous_cursor.",
        input: object({ ...page, email: string().optional() }),
      },
      (_c, args) => call("GET", "/users", rest(args), undefined),
    ),
    update: mutation(
      {
        description:
          "Update a user's attributes, creating the user if the uid does not exist. Custom attributes go in meta. Changing email needs the key and secret. is_account converts between customer and account.",
        input: object({ uid, ...userBody, is_account: boolean().optional() }),
      },
      (_c, args) => call("PUT", `/users/${enc(args.uid)}`, {}, rest(args, "uid")),
    ),
    deleteAttribute: mutation(
      { description: "Delete a custom (meta) attribute from a user.", input: object({ uid, attribute: string() }) },
      (_c, args) => call("DELETE", `/users/${enc(args.uid)}/attributes/${enc(args.attribute)}`, {}, undefined),
    ),
    deleteDeviceToken: mutation(
      { description: "Remove a push device token from a user, for example when they log out of the app.", input: object({ uid, token: string() }) },
      (_c, args) => call("DELETE", `/users/${enc(args.uid)}/tokens/${enc(args.token)}`, {}, undefined),
    ),
    trackEvent: mutation(
      {
        description: "Record an event for a user, usable later for segmentation and automations.",
        input: object({
          uid,
          event: string(),
          value: json().optional(),
          properties: meta.optional(),
          timestamp: string().optional(),
        }),
      },
      (_c, args) => call("POST", `/users/${enc(args.uid)}/events`, {}, rest(args, "uid")),
    ),
    addToLists: mutation(
      { description: "Add a customer or account to one or more lists by list id.", input: object({ uid, lists: array(string()) }) },
      (_c, args) => call("POST", `/users/${enc(args.uid)}/lists`, {}, rest(args, "uid")),
    ),
    delete: mutation(
      { description: "Permanently delete a customer or account and all their data.", input: object({ uid }) },
      (_c, args) => call("DELETE", `/users/${enc(args.uid)}`, {}, undefined),
    ),
  });

  const listBody = {
    title: string().optional(),
    description: string().optional(),
    redirect_url: string().optional(),
    double_optin: boolean().optional(),
  };

  const lists = router({
    create: mutation(
      { description: "Create a list. title is required (64 characters max).", input: object({ ...listBody, title: string() }) },
      (_c, args) => call("POST", "/lists", {}, rest(args)),
    ),
    list: query({ description: "List all lists, 10 by default and at most 30 per page.", input: object(page) }, (_c, args) =>
      call("GET", "/lists", rest(args), undefined),
    ),
    update: mutation({ description: "Update a list's title, description, redirect_url or double_optin.", input: object({ id: string(), ...listBody }) }, (_c, args) =>
      call("PUT", `/lists/${enc(args.id)}`, {}, rest(args, "id")),
    ),
    subscribe: mutation(
      {
        description:
          "Create a user and subscribe them to a list, or subscribe an existing user matched by email or number. Sends a confirmation email when the list has double opt-in.",
        input: object({
          id: string(),
          first_name: string().optional(),
          last_name: string().optional(),
          email: string().optional(),
          number: string().optional(),
          created_at: string().optional(),
          meta: meta.optional(),
        }),
      },
      (_c, args) => call("POST", `/lists/${enc(args.id)}/subscribers`, {}, rest(args, "id")),
    ),
  });

  return router({ users, lists });
}

export default defineApp(
  { user: { accounts: { engage: engage.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.engage ?? [],
        (account) =>
          withApprovals(build(account.fields, fetch, signal), (t) => (t.kind === "mutation" ? always() : undefined)),
        { signal },
      ),
      {
        title: "Engage",
        description: "Customer messaging platform: manage users, accounts, events and lists in Engage.",
        instructions:
          "Users are identified by uid, the id you chose when creating them, not Engage's internal id. Custom attributes live in meta. Lists are paged with next_cursor.",
        icons,
      },
    ),
  }),
);
