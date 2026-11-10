import {
  accountRouter,
  array,
  boolean,
  json,
  mutation,
  query,
  decodeJson,
  defineApp,
  defineProvider,
  number,
  oauth2,
  object,
  router,
  secrets,
  string,
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const Me = object({ user: object({ id: number(), first_name: string() }) });


const base = "https://secure.splitwise.com/api/v3.0";

type Fetch = typeof fetch;
type Params = Record<string, string | number | boolean | undefined>;

// Splitwise takes nested lists as flat keys: users__0__user_id, users__0__paid_share, ...
function flatten(body: Record<string, unknown>): Params {
  const out: Params = {};
  for (const [key, value] of Object.entries(body)) {
    if (value === undefined) continue;
    if (Array.isArray(value)) {
      value.forEach((item, index) => {
        for (const [prop, v] of Object.entries(item as Record<string, string | number | boolean | undefined>)) {
          if (v !== undefined) out[`${key}__${index}__${prop}`] = v;
        }
      });
    } else out[key] = value as string | number | boolean;
  }
  return out;
}

function client(token: string, fetcher: Fetch, signal: AbortSignal | undefined) {
  const headers = { Authorization: `Bearer ${token}`, Accept: "application/json" };
  return {
    get: async (path: string, params: Params = {}) => {
      const url = new URL(`${base}${path}`);
      for (const [k, v] of Object.entries(params)) if (v !== undefined) url.searchParams.set(k, String(v));
      return decodeJson(await fetcher(url, { signal, headers }), json());
    },
    post: async (path: string, body: Record<string, unknown> = {}) =>
      decodeJson(
        await fetcher(`${base}${path}`, {
          method: "POST",
          signal,
          headers: { ...headers, "Content-Type": "application/json" },
          body: JSON.stringify(flatten(body)),
        }),
        json(),
      ),
  };
}

const id = (_what: string) => object({ id: number() });
const Share = object({
  user_id: number().optional(),
  email: string().optional(),
  first_name: string().optional(),
  last_name: string().optional(),
  paid_share: string().optional(),
  owed_share: string().optional(),
});
const ExpenseFields = {
  cost: string({ minLength: 1 }),
  description: string({ minLength: 1 }),
  group_id: number(),
  details: string().optional(),
  date: string().optional(),
  repeat_interval: string().optional(),
  currency_code: string().optional(),
  category_id: number().optional(),
};

const splitwise = defineProvider({
  name: "Splitwise",
  hosts: ["secure.splitwise.com"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
    // Splitwise offers no client registration: the connect page asks for an OAuth app's client.
    oauth: oauth2({
      authorizationUrl: "https://secure.splitwise.com/oauth/authorize",
      tokenUrl: "https://secure.splitwise.com/oauth/token",
      tokenEndpointAuthMethod: "client_secret_post",
      scopes: [],
    }),
  },
  async health({ account, fetch, signal }) {
    const token = account.method === "oauth" ? account.fields.access_token : account.fields.token;
    const response = await fetch("https://secure.splitwise.com/api/v3.0/get_current_user", {
      signal,
      headers: { Authorization: `Bearer ${token}` },
    });
    const me = await decodeJson(response, Me);
    return { accountInfo: { externalId: String(me.user.id), displayName: me.user.first_name } };
  },
});


function build(c: ReturnType<typeof client>) {
  return router({
    users: router(
      {
        getCurrent: query(
          { description: "Get the authenticated user, including default currency and locale.", input: object({}) },
          async () => c.get("/get_current_user"),
        ),
        get: query({ description: "Get a user by ID.", input: id("user") }, async (_x, { id }) => c.get(`/get_user/${id}`)),
        update: mutation(
          {
            description: "Update a user's profile. Only the fields given change.",
            input: object({
              id: number(),
              first_name: string().optional(),
              last_name: string().optional(),
              email: string().optional(),
              locale: string().optional(),
              default_currency: string().optional(),
            }),
          },
          async (_x, { id, ...body }) => c.post(`/update_user/${id}`, body),
        ),
      },
      { title: "Users", description: "The current user and user profiles." },
    ),
    groups: router(
      {
        list: query(
          { description: "List the current user's groups. Expenses without a group appear under group ID 0.", input: object({}) },
          async () => c.get("/get_groups"),
        ),
        get: query({ description: "Get a group by ID.", input: id("group") }, async (_x, { id }) => c.get(`/get_group/${id}`)),
        create: mutation(
          {
            description:
              "Create a group. The current user is added automatically; each listed member needs a user_id or an email. group_type is one of home, trip, couple, other, apartment, house.",
            input: object({
              name: string({ minLength: 1 }),
              group_type: string().optional(),
              simplify_by_default: boolean().optional(),
              users: array(object({ user_id: number().optional(), email: string().optional(), first_name: string().optional(), last_name: string().optional() })).optional(),
            }),
          },
          async (_x, body) => c.post("/create_group", body),
        ),
        delete: mutation(
          { description: "Delete a group and all its records, including expenses.", input: id("group") },
          async (_x, { id }) => c.post(`/delete_group/${id}`),
        ),
        undelete: mutation(
          { description: "Restore a deleted group. Check the success field in the result.", input: id("group") },
          async (_x, { id }) => c.post(`/undelete_group/${id}`),
        ),
        addUser: mutation(
          {
            description:
              "Add a user to a group, by user_id or by email with first_name and last_name. Check the success field in the result.",
            input: object({
              group_id: number(),
              user_id: number().optional(),
              email: string().optional(),
              first_name: string().optional(),
              last_name: string().optional(),
            }),
          },
          async (_x, body) => c.post("/add_user_to_group", body),
        ),
        removeUser: mutation(
          {
            description: "Remove a user from a group. Fails unless the user's balance is zero. Check the success field.",
            input: object({ group_id: number(), user_id: number() }),
          },
          async (_x, body) => c.post("/remove_user_from_group", body),
        ),
      },
      { title: "Groups", description: "Create and manage expense groups and their members." },
    ),
    friends: router(
      {
        list: query({ description: "List the current user's friends with balances.", input: object({}) }, async () => c.get("/get_friends")),
        get: query({ description: "Get a friend by user ID.", input: id("friend") }, async (_x, { id }) => c.get(`/get_friend/${id}`)),
        create: mutation(
          {
            description: "Add a friend by email. user_first_name is required when the person is new to Splitwise.",
            input: object({
              user_email: string({ minLength: 1 }),
              user_first_name: string().optional(),
              user_last_name: string().optional(),
            }),
          },
          async (_x, body) => c.post("/create_friend", body),
        ),
        createMany: mutation(
          {
            description: "Add several friends at once. A first name is required for people new to Splitwise.",
            input: object({
              users: array(object({ email: string({ minLength: 1 }), first_name: string().optional(), last_name: string().optional() })),
            }),
          },
          async (_x, body) => c.post("/create_friends", body),
        ),
        delete: mutation(
          { description: "End a friendship by the friend's user ID. Check the success field.", input: id("friend") },
          async (_x, { id }) => c.post(`/delete_friend/${id}`),
        ),
      },
      { title: "Friends", description: "Manage the friend list." },
    ),
    expenses: router(
      {
        get: query({ description: "Get an expense by ID.", input: id("expense") }, async (_x, { id }) => c.get(`/get_expense/${id}`)),
        list: query(
          {
            description:
              "List expenses. group_id overrides friend_id. Dates are ISO 8601 date-times. limit defaults to 20.",
            input: object({
              group_id: number().optional(),
              friend_id: number().optional(),
              dated_after: string().optional(),
              dated_before: string().optional(),
              updated_after: string().optional(),
              updated_before: string().optional(),
              limit: number().optional(),
              offset: number().optional(),
            }),
          },
          async (_x, params) => c.get("/get_expenses", params),
        ),
        create: mutation(
          {
            description:
              "Create an expense. For an equal split set group_id and split_equally true (the current user is the payer). For custom shares provide users with paid_share and owed_share (decimal strings) per person, identified by user_id or by email with first_name and last_name. cost has up to two decimals; use group_id 0 for no group. Success only when the returned errors are empty.",
            input: object({ ...ExpenseFields, split_equally: boolean().optional(), users: array(Share).optional() }),
          },
          async (_x, body) => c.post("/create_expense", body),
        ),
        update: mutation(
          {
            description:
              "Update an expense. Send only the fields that change; providing users replaces all shares. group_id 0 means no group. Success only when the returned errors are empty.",
            input: object({
              id: number(),
              cost: string().optional(),
              description: string().optional(),
              group_id: number().optional(),
              details: string().optional(),
              date: string().optional(),
              repeat_interval: string().optional(),
              currency_code: string().optional(),
              category_id: number().optional(),
              users: array(Share).optional(),
            }),
          },
          async (_x, { id, ...body }) => c.post(`/update_expense/${id}`, body),
        ),
        delete: mutation(
          { description: "Delete an expense. Check the success field.", input: id("expense") },
          async (_x, { id }) => c.post(`/delete_expense/${id}`),
        ),
        undelete: mutation(
          { description: "Restore a deleted expense. Check the success field.", input: id("expense") },
          async (_x, { id }) => c.post(`/undelete_expense/${id}`),
        ),
      },
      { title: "Expenses", description: "Create, read, update and delete shared expenses." },
    ),
    comments: router(
      {
        list: query(
          { description: "List the comments on an expense.", input: object({ expense_id: number() }) },
          async (_x, params) => c.get("/get_comments", params),
        ),
        create: mutation(
          { description: "Add a comment to an expense.", input: object({ expense_id: number(), content: string({ minLength: 1 }) }) },
          async (_x, body) => c.post("/create_comment", body),
        ),
        delete: mutation(
          { description: "Delete a comment and return it.", input: id("comment") },
          async (_x, { id }) => c.post(`/delete_comment/${id}`),
        ),
      },
      { title: "Comments", description: "Comments on expenses." },
    ),
    notifications: query(
      {
        description:
          "List recent activity notifications, newest first. limit 0 means the maximum. content is limited HTML.",
        input: object({ updated_after: string().optional(), limit: number().optional() }),
      },
      async (_x, params) => c.get("/get_notifications", params),
    ),
    currencies: query(
      { description: "List supported currency codes, to use as currency_code on expenses.", input: object({}) },
      async () => c.get("/get_currencies"),
    ),
    categories: query(
      { description: "List expense categories and subcategories. Expenses must use a subcategory id.", input: object({}) },
      async () => c.get("/get_categories"),
    ),
  });
}

export default defineApp(
  { user: { accounts: { splitwise: splitwise.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.splitwise ?? [],
        (account) =>
          withApprovals(
            build(client(account.method === "oauth" ? account.fields.access_token : account.fields.token, fetch, signal)),
            (tool) => (tool.kind === "mutation" ? always() : undefined),
          ),
        { signal },
      ),
      {
        title: "Splitwise",
        description: "Shared expenses with friends and groups: users, groups, friends, expenses, comments and notifications.",
        icons,
      },
    ),
  }),
);
