import {
  accountRouter,
  array,
  boolean,
  decodeJson,
  defineApp,
  defineProvider,
  json,
  mutation,
  object,
  router,
  secrets,
  string,
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const base = "https://push.userlist.com";

const userlist = defineProvider({
  name: "Userlist",
  hosts: ["push.userlist.com"],
  auth: {
    apiKey: secrets({
      label: "Push key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // The Push API is write-only and has no read endpoint. An empty event is rejected with 422 after
  // authentication succeeds and stores nothing; 401 means a bad push key.
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/events`, {
      method: "POST",
      signal,
      headers: headers(account.fields.token),
      body: "{}",
    });
    if (response.status === 401) throw new Error("Userlist rejected the push key (401)");
    if (response.status !== 422 && !response.ok) throw new Error(`Userlist health check failed (${response.status})`);
  },
});

function headers(token: string) {
  return {
    Authorization: `Push ${token}`,
    Accept: "application/json",
    "Content-Type": "application/json; charset=utf-8",
  };
}

type Fetch = typeof fetch;

function client(token: string, fetcher: Fetch, signal: AbortSignal | undefined) {
  return async (method: "POST" | "DELETE", path: string, body: Record<string, unknown>) => {
    const response = await fetcher(`${base}${path}`, {
      method,
      signal,
      headers: headers(token),
      body: JSON.stringify(body),
    });
    // Success is 202 with an empty body.
    if (response.status === 202) return { accepted: true };
    return decodeJson(response, json());
  };
}

const id = string({ minLength: 1 });
const props = json();
const ref = json();

function build(call: ReturnType<typeof client>) {
  return router({
    users: router(
      {
        upsert: mutation(
          {
            description:
              "Create or update a user. Requires identifier or email. Omitted fields stay unchanged; null removes a value. Returns accepted (the API processes asynchronously). preferences is a list of {topic, subscribed}; only listed topics change. relationships is a list of {company, properties}; company/companies are shortcuts.",
            input: object({
              identifier: id.optional(),
              email: string({ minLength: 3 }).optional(),
              signed_up_at: string().optional(),
              properties: props.optional(),
              relationships: array(json()).optional(),
              company: ref.optional(),
              companies: array(json()).optional(),
              preferences: array(object({ topic: id, subscribed: boolean() })).optional(),
            }),
          },
          async (_ctx, input) => call("POST", "/users", input),
        ),
        delete: mutation(
          {
            description: "Delete a user by identifier or email. Deleting a user that does not exist is ignored.",
            input: object({ identifier: id.optional(), email: string({ minLength: 3 }).optional() }),
          },
          async (_ctx, input) => call("DELETE", "/users", input),
        ),
      },
      { title: "Users", description: "Create, update and delete the people Userlist emails." },
    ),
    companies: router(
      {
        upsert: mutation(
          {
            description:
              "Create or update a company. identifier is required. user/users attach users by identifier (or embedded object). Omitted fields stay unchanged; null removes a value.",
            input: object({
              identifier: id,
              name: string().optional(),
              signed_up_at: string().optional(),
              properties: props.optional(),
              relationships: array(json()).optional(),
              user: ref.optional(),
              users: array(json()).optional(),
            }),
          },
          async (_ctx, input) => call("POST", "/companies", input),
        ),
        delete: mutation(
          {
            description: "Delete a company by identifier. Deleting a company that does not exist is ignored.",
            input: object({ identifier: id }),
          },
          async (_ctx, input) => call("DELETE", "/companies", input),
        ),
      },
      { title: "Companies", description: "Create, update and delete the companies users belong to." },
    ),
    relationships: router(
      {
        upsert: mutation(
          {
            description:
              "Create or update the relationship between a user and a company. user and company are identifiers or embedded objects. properties holds relationship data such as {role: 'admin'}.",
            input: object({ user: ref, company: ref, properties: props.optional() }),
          },
          async (_ctx, input) => call("POST", "/relationships", input),
        ),
        delete: mutation(
          {
            description: "Delete the relationship between a user and a company. Ignored if it does not exist.",
            input: object({ user: ref, company: ref }),
          },
          async (_ctx, input) => call("DELETE", "/relationships", input),
        ),
      },
      { title: "Relationships", description: "Link users to companies." },
    ),
    events: router(
      {
        create: mutation(
          {
            description:
              "Track an event (names are converted to snake_case, e.g. project_created). Requires name and a user or company (identifier or embedded object). occurred_at is an ISO 8601 timestamp, defaulting to now. Events cannot be updated or deleted.",
            input: object({
              name: id,
              user: ref.optional(),
              company: ref.optional(),
              occurred_at: string().optional(),
              properties: props.optional(),
            }),
          },
          async (_ctx, input) => call("POST", "/events", input),
        ),
      },
      { title: "Events", description: "Track behavior that triggers campaigns." },
    ),
    messages: router(
      {
        send: mutation(
          {
            description:
              "Send a transactional message. Use template (identifier) or subject plus body. channel is email (default) or web; web needs user and rejects to. For email, user or to is required; from and reply_to are email addresses. body is {type: 'html'|'text'|'multipart', content}; multipart content is an array of {type, content}. subject and preheader support Liquid; properties are available as {{event.*}}. sender and topic are IDs; theme is an ID or false.",
            input: object({
              template: id.optional(),
              user: ref.optional(),
              company: ref.optional(),
              properties: props.optional(),
              channel: string().optional(),
              to: string().optional(),
              from: string().optional(),
              reply_to: string().optional(),
              subject: string().optional(),
              preheader: string().optional(),
              body: json().optional(),
              sender: json().optional(),
              theme: json().optional(),
              topic: json().optional(),
            }),
          },
          async (_ctx, input) => call("POST", "/messages", input),
        ),
      },
      { title: "Messages", description: "Send one-off transactional email or in-app messages." },
    ),
  });
}

export default defineApp(
  { user: { accounts: { userlist: userlist.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.userlist ?? [],
        (account) =>
          withApprovals(build(client(account.fields.token, fetch, signal)), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Userlist",
        description: "Push users, companies, relationships and events to Userlist and send transactional messages.",
        icons,
      },
    ),
  }),
);
