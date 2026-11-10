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
  oauth2,
  object,
  query,
  record,
  router,
  secrets,
  string,
  toolAnnotations,
  withApprovals,
} from "apps";
import { mcpHealth, mcpRouter } from "apps/mcp";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const url = "https://mcp.esputnik.com/";
const base = "https://esputnik.com/api";

const esputnik = defineProvider({
  name: "eSputnik",
  hosts: ["mcp.esputnik.com", "esputnik.com"],
  auth: {
    // REST API: HTTP Basic with any username and the API key as the password.
    // Created under profile > Settings > API > New key.
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
    // The server publishes OAuth metadata and dynamic client registration (PKCE S256).
    oauth: oauth2({ discover: url }),
  },
  async health(check) {
    const { account, fetch, signal } = check;
    if (account.method === "oauth") {
      return mcpHealth(check, { url, headers: { Authorization: `Bearer ${account.fields.access_token}` } });
    }
    const response = await fetch(`${base}/v1/account/info`, { signal, headers: restHeaders(account.fields.token) });
    await decodeJson(response, object({ orgId: number() }));
    return {};
  },
});

const restHeaders = (token: string) => ({
  Authorization: `Basic ${btoa(`executor:${token}`)}`,
  Accept: "application/json",
});

const search = (params: Record<string, string | number | boolean | undefined>) => {
  const out = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) if (value !== undefined) out.set(key, String(value));
  const text = out.toString();
  return text === "" ? "" : `?${text}`;
};

const restTools = (token: string, signal: AbortSignal) => {
  const headers = restHeaders(token);
  const jsonHeaders = { ...headers, "Content-Type": "application/json; charset=UTF-8" };
  return router({
    accountInfo: query(
      { description: "Get the account's organization ID, organization name and user email.", input: object({}) },
      async ({ fetch }) => decodeJson(await fetch(`${base}/v1/account/info`, { signal, headers }), json()),
    ),
    balance: query(
      {
        description: "Get the organization balance: current balance, credit limit, currency, prepaid emails and SMS, and per-sender reserved balances.",
        input: object({}),
      },
      async ({ fetch }) => decodeJson(await fetch(`${base}/v1/balance`, { signal, headers }), json()),
    ),
    searchContacts: query(
      {
        description:
          "Search contacts by externalCustomerId, email, sms (phone number), firstname or lastname. startindex starts at 1; maxrows is at most 500 (default 500).",
        input: object({
          externalCustomerId: string().optional(),
          email: string().optional(),
          sms: string().optional(),
          firstname: string().optional(),
          lastname: string().optional(),
          startindex: number().optional(),
          maxrows: number().optional(),
        }),
      },
      async ({ fetch }, input) =>
        decodeJson(await fetch(`${base}/v1/contacts${search(input)}`, { signal, headers }), json()),
    ),
    getContact: query(
      { description: "Get one contact by its eSputnik contact ID.", input: object({ id: number() }) },
      async ({ fetch }, { id }) => decodeJson(await fetch(`${base}/v1/contact/${id}`, { signal, headers }), json()),
    ),
    listSegments: query(
      {
        description: "List segments (Static, Dynamic or Combined), optionally filtered by name. startindex starts at 1; maxrows is at most 500.",
        input: object({ name: string().optional(), startindex: number().optional(), maxrows: number().optional() }),
      },
      async ({ fetch }, input) =>
        decodeJson(await fetch(`${base}/v1/groups${search(input)}`, { signal, headers }), json()),
    ),
    upsertContact: mutation(
      {
        description:
          "Add or update a contact (matched by channel value or externalCustomerId). Omitted fields keep their stored value. Each channel is { type: email | sms | mobilepush | webpush, value }. Returns the contact ID. Repeated identical requests within one minute return 409.",
        input: object({
          firstName: string().optional(),
          lastName: string().optional(),
          externalCustomerId: string().optional(),
          languageCode: string().optional(),
          timeZone: string().optional(),
          channels: array(object({ type: string(), value: string() })).optional(),
          fields: array(object({ id: number(), value: string() })).optional(),
        }),
        approval: always(),
      },
      async ({ fetch }, input) =>
        decodeJson(
          await fetch(`${base}/v1/contact`, { method: "POST", signal, headers: jsonHeaders, body: JSON.stringify(input) }),
          json(),
        ),
    ),
    deleteContact: mutation(
      {
        description: "Delete a contact by its eSputnik contact ID. With erase true the profile, activity and tracking data are wiped permanently.",
        input: object({ id: number(), erase: boolean().optional() }),
        approval: always(),
      },
      async ({ fetch }, { id, erase }) =>
        decodeJson(
          await fetch(`${base}/v1/contact/${id}${search({ erase })}`, { method: "DELETE", signal, headers }),
          json(),
        ),
    ),
    sendEmail: mutation(
      {
        description:
          'Send an email without a template. "from" must be a valid sender, for example "Name <sender@example.com>". Creates contacts for unknown recipients. Returns per-recipient status and requestId.',
        input: object({
          from: string(),
          subject: string(),
          htmlText: string(),
          emails: array(string()),
          plainText: string().optional(),
          tags: array(string()).optional(),
          externalRequestId: string().optional(),
          trackUrls: boolean().optional(),
        }),
        approval: always(),
      },
      async ({ fetch }, input) =>
        decodeJson(
          await fetch(`${base}/v1/message/email`, { method: "POST", signal, headers: jsonHeaders, body: JSON.stringify(input) }),
          json(),
        ),
    ),
    sendSms: mutation(
      {
        description:
          "Send an SMS to phoneNumbers or to a segment (groupId). One of the two is required. \"from\" must be a valid sender name. Returns per-recipient status and requestId.",
        input: object({
          from: string(),
          text: string(),
          phoneNumbers: array(string()).optional(),
          groupId: number().optional(),
          tags: array(string()).optional(),
          externalRequestId: string().optional(),
          trackUrls: boolean().optional(),
        }),
        approval: always(),
      },
      async ({ fetch }, input) =>
        decodeJson(
          await fetch(`${base}/v1/message/sms`, { method: "POST", signal, headers: jsonHeaders, body: JSON.stringify(input) }),
          json(),
        ),
    ),
    generateEvent: mutation(
      {
        description:
          "Generate a custom event (v3). params is a flat map of string values and must include a contact identifier such as externalCustomerId or email. Event data is limited to 20 KB. A 200 only means the request passed validation.",
        input: object({ eventTypeKey: string(), params: record(string()) }),
        approval: always(),
      },
      async ({ fetch }, input) =>
        decodeJson(
          await fetch(`${base}/v3/event`, {
            method: "POST",
            signal,
            headers: jsonHeaders,
            body: JSON.stringify(input),
          }),
          json(),
        ),
    ),
  });
};

export default defineApp(
  { user: { accounts: { esputnik: esputnik.many() } }, icons },
  async ({ user, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.esputnik ?? [],
        async (account) =>
          account.method === "oauth"
            ? withApprovals(
                await mcpRouter({
                  url,
                  account,
                  headers: { Authorization: `Bearer ${account.fields.access_token}` },
                  signal,
                }),
                (tool) => (toolAnnotations(tool)?.readOnlyHint === true ? undefined : always()),
              )
            : restTools(account.fields.token, signal),
        { signal },
      ),
      {
        title: "eSputnik",
        description: "Manage contacts, segments, events, message templates, sending, workflows and analytics in eSputnik.",
        icons,
      },
    ),
  }),
);
