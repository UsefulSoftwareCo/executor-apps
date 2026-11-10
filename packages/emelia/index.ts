import {
  accountRouter,
  array,
  decodeJson,
  defineApp,
  defineProvider,
  json,
  mutation,
  number,
  object,
  query,
  router,
  secrets,
  string,
  withApprovals,
} from "apps";
import { graphqlRouter } from "apps/graphql";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const url = "https://graphql.emelia.io/graphql";
const REST = "https://api.emelia.io";

const obj = (value: unknown): Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value) ? (value as Record<string, unknown>) : {};

const emelia = defineProvider({
  name: "Emelia",
  hosts: ["graphql.emelia.io", "api.emelia.io"],
  auth: {
    // Emelia API keys are sent as the raw Authorization header, without a Bearer prefix.
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch(url, {
      method: "POST",
      signal,
      headers: { Authorization: account.fields.token, "content-type": "application/json" },
      body: JSON.stringify({ query: "{ me { uid name email } }" }),
    });
    // A bad key returns a GraphQL errors payload with data null; fields on me are optional.
    const body = obj(await decodeJson(response, json()));
    const first = Array.isArray(body.errors) ? body.errors[0] : undefined;
    if (first !== undefined) {
      const message = obj(first).message;
      throw new Error(`Emelia rejected the API key: ${typeof message === "string" ? message : "GraphQL error"}`);
    }
    const rawMe = obj(body.data).me;
    if (typeof rawMe !== "object" || rawMe === null) throw new Error("Emelia returned no account for this API key");
    const me = obj(rawMe);
    return {
      accountInfo: {
        ...(typeof me.uid === "string" ? { externalId: me.uid } : {}),
        ...(typeof me.name === "string" ? { displayName: me.name } : {}),
        ...(typeof me.email === "string" ? { email: me.email } : {}),
      },
    };
  },
});

type Fetch = typeof fetch;
type Params = Record<string, string | number | undefined>;

function client(token: string, fetcher: Fetch, signal: AbortSignal | undefined) {
  const send = async (method: string, path: string, params?: Params, body?: unknown) => {
    const u = new URL(`${REST}${path}`);
    for (const [key, value] of Object.entries(params ?? {})) {
      if (value !== undefined) u.searchParams.set(key, String(value));
    }
    const headers = { Authorization: token };
    return decodeJson(
      await fetcher(u.toString(), {
        method,
        signal,
        headers: body === undefined ? headers : { ...headers, "content-type": "application/json" },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      }),
      json(),
    );
  };
  return {
    get: (path: string, params?: Params) => send("GET", path, params),
    post: (path: string, body?: unknown) => send("POST", path, undefined, body),
    del: (path: string, body?: unknown) => send("DELETE", path, undefined, body),
  };
}

type Client = ReturnType<typeof client>;
const req = () => string({ minLength: 1 });
const seg = encodeURIComponent;

// Operations on https://api.emelia.io (REST), complementing the GraphQL tools.
const rest = (c: Client) =>
  router({
    findEmail: mutation(
      {
        description: "Start an email-finder job from a full name and company (spends credits). Returns a jobId; read it with findEmailResult.",
        input: object({ fullname: req(), companyName: req(), companyWebsite: string().optional(), country: string().optional() }),
        approval: always(),
      },
      async (_ctx, input) => c.post("/tools/find/email", input),
    ),
    findEmailResult: query(
      { description: "Get the result of an email-finder job.", input: object({ jobId: req() }) },
      async (_ctx, { jobId }) => c.get(`/tools/find/email/${seg(jobId)}`),
    ),
    findPhone: mutation(
      {
        description: "Start a phone-finder job from a LinkedIn profile URL (spends credits). Returns a jobId; read it with findPhoneResult.",
        input: object({ linkedinUrl: req() }),
        approval: always(),
      },
      async (_ctx, input) => c.post("/tools/find/phone", input),
    ),
    findPhoneResult: query(
      { description: "Get the result of a phone-finder job.", input: object({ jobId: req() }) },
      async (_ctx, { jobId }) => c.get(`/tools/find/phone/${seg(jobId)}`),
    ),
    verifyEmail: mutation(
      {
        description: "Start an email verification job for one address (spends credits). Returns a jobId; read it with verifyEmailResult.",
        input: object({ email: req() }),
        approval: always(),
      },
      async (_ctx, input) => c.post("/tools/verify/email", input),
    ),
    verifyEmailResult: query(
      { description: "Get the result of an email verification job.", input: object({ jobId: req() }) },
      async (_ctx, { jobId }) => c.get(`/tools/verify/email/${seg(jobId)}`),
    ),
    providers: query(
      { description: "List the email providers (mailboxes) connected to the account.", input: object({}) },
      async () => c.get("/email-providers"),
    ),
    webhooks: router({
      list: query({ description: "List the account's webhooks.", input: object({}) }, async () => c.get("/webhook")),
      create: mutation(
        {
          description: "Create a webhook that posts the given events for a campaign to a callback URL.",
          input: object({ campaignId: req(), url: req(), events: array(string({ minLength: 1 })) }),
          approval: always(),
        },
        async (_ctx, input) => c.post("/webhook", input),
      ),
      delete: mutation(
        { description: "Delete the webhook registered for a callback URL.", input: object({ url: req() }), approval: always() },
        async (_ctx, input) => c.del("/webhook", input),
      ),
    }),
    advancedCampaigns: router({
      list: query(
        {
          description: "List multichannel (advanced) campaigns.",
          input: object({ page: number().optional(), limit: number().optional() }),
        },
        async (_ctx, input) => c.get("/advanced/campaigns", input),
      ),
      create: mutation(
        { description: "Create a multichannel (advanced) campaign.", input: object({ name: req() }), approval: always() },
        async (_ctx, input) => c.post("/advanced/campaigns", input),
      ),
      activities: query(
        {
          description: "List activities (sends, opens, replies...) of a multichannel campaign.",
          input: object({ campaignId: req(), page: number().optional(), limit: number().optional() }),
        },
        async (_ctx, { campaignId, ...paging }) => c.get(`/advanced/campaigns/${seg(campaignId)}/activities`, paging),
      ),
    }),
    linkedinCampaigns: router({
      list: query(
        {
          description: "List LinkedIn campaigns.",
          input: object({ page: number().optional(), limit: number().optional() }),
        },
        async (_ctx, input) => c.get("/linkedin/campaigns", input),
      ),
      create: mutation(
        { description: "Create a LinkedIn campaign.", input: object({ name: req() }), approval: always() },
        async (_ctx, input) => c.post("/linkedin/campaigns", input),
      ),
      activities: query(
        { description: "List activities of a LinkedIn campaign.", input: object({ campaignId: req() }) },
        async (_ctx, { campaignId }) => c.get(`/linkedin/campaigns/${seg(campaignId)}/activities`),
      ),
      deleteContact: mutation(
        {
          description: "Remove a contact (by LinkedIn URL) from a LinkedIn campaign.",
          input: object({ campaignId: req(), contactUrl: req() }),
          approval: always(),
        },
        async (_ctx, input) => c.del("/linkedin/campaign/contacts", input),
      ),
    }),
    blacklist: router({
      add: mutation(
        { description: "Add an email address to the account blacklist.", input: object({ email: req() }), approval: always() },
        async (_ctx, input) => c.post("/emails/blacklists/contact", input),
      ),
      remove: mutation(
        { description: "Remove an email address from the account blacklist.", input: object({ email: req() }), approval: always() },
        async (_ctx, input) => c.del("/emails/blacklists/contact", input),
      ),
    }),
  });

export default defineApp(
  { user: { accounts: { emelia: emelia.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.emelia ?? [],
        async (account) =>
          router({
            graphql: withApprovals(
              await graphqlRouter({ url, account, headers: { Authorization: account.fields.token }, cache, signal }),
              (tool) => (tool.kind === "mutation" ? always() : undefined),
            ),
            rest: rest(client(account.fields.token, fetch, signal)),
          }),
        { signal },
      ),
      {
        title: "Emelia",
        description: "Cold email campaigns, contact lists, mailbox providers, email verification and webhooks in Emelia.",
        icons,
      },
    ),
  }),
);
