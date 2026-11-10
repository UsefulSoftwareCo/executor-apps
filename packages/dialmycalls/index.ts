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
  router,
  secrets,
  string,
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { basicAuth, body } from "./body.js";
import { icons } from "./icon.js";

const base = "https://api.dialmycalls.com/2.0";

const dialmycalls = defineProvider({
  name: "DialMyCalls",
  hosts: ["api.dialmycalls.com"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/account`, {
      signal,
      headers: { Authorization: basicAuth(account.fields.token), Accept: "application/json" },
    });
    await decodeJson(response, object({}));
  },
});

type Fetch = typeof fetch;
type Params = Record<string, unknown>;

function client(token: string, fetcher: Fetch, signal: AbortSignal | undefined) {
  return async (method: string, path: string, body?: Params, range?: { from?: number; to?: number }) => {
    const headers: Record<string, string> = { Authorization: basicAuth(token), Accept: "application/json" };
    if (body) headers["Content-Type"] = "application/json";
    if (range) headers.Range = `records=${range.from ?? 1}-${range.to ?? (range.from ?? 1) + 99}`;
    const response = await fetcher(`${base}${path}`, {
      method,
      signal,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
    return decodeJson(response, json());
  };
}
type Call = ReturnType<typeof client>;

const id = (label: string) => object({ id: string({ minLength: 1 }) });
const paging = {
  from: number().optional(),
  to: number().optional(),
};
const pagingNote =
  " Returns at most 100 records per call; use from/to (1-based, inclusive) to page, default 1-100.";

function strip(input: Params): Params {
  const out: Params = {};
  for (const [key, value] of Object.entries(input)) if (value !== undefined) out[key] = value;
  return out;
}

const contactEntry = object({
  phone: string({ minLength: 1 }),
  firstname: string().optional(),
  lastname: string().optional(),
  email: string().optional(),
});

function build(call: Call) {
  const list = (path: string, description: string, extra: Params = {}) =>
    query(
      { description: description + pagingNote, input: object({ ...paging, ...extra } as typeof paging) },
      async (_ctx, input: { from?: number; to?: number }) => call("GET", path, undefined, input),
    );
  const get = (path: (id: string) => string, description: string) =>
    query({ description, input: id("id") }, async (_ctx, { id }) => call("GET", path(id)));

  return router({
    account: router(
      {
        get: query({ description: "Get the DialMyCalls account: name, email, credits and plan details.", input: object({}) }, async () =>
          call("GET", "/account"),
        ),
        listAccessAccounts: list("/accessaccounts", "List access accounts (sub-users) of the account."),
        getAccessAccount: get((i) => `/accessaccount/${encodeURIComponent(i)}`, "Get one access account by ID."),
        createAccessAccount: mutation(
          {
            description: "Create an access account (sub-user). Password needs 8+ characters, 1 digit and 1 upper-case letter.",
            input: object({ email: string({ minLength: 1 }), password: string({ minLength: 8 }), name: string({ minLength: 1 }) }),
          },
          async (_ctx, input) => call("POST", "/accessaccount", input),
        ),
        updateAccessAccount: mutation(
          {
            description: "Update an access account's email, password or name.",
            input: object({ id: string({ minLength: 1 }), email: string().optional(), password: string().optional(), name: string().optional() }),
          },
          async (_ctx, { id, ...rest }) => call("PUT", `/accessaccount/${encodeURIComponent(id)}`, strip(rest)),
        ),
        deleteAccessAccount: mutation(
          { description: "Delete an access account.", input: id("id") },
          async (_ctx, { id }) => call("DELETE", `/accessaccount/${encodeURIComponent(id)}`),
        ),
      },
      { title: "Account", description: "Account details and access accounts (sub-users)." },
    ),
    calls: router(
      {
        list: list("/service/calls", "List voice broadcasts (calls)."),
        get: get((i) => `/service/call/${encodeURIComponent(i)}`, "Get one voice broadcast by ID."),
        recipients: query(
          { description: "List the recipients of a voice broadcast and their delivery results." + pagingNote, input: object({ id: string({ minLength: 1 }), ...paging }) },
          async (_ctx, { id, from, to }) => call("GET", `/service/call/${encodeURIComponent(id)}/recipients`, undefined, { from, to }),
        ),
        create: mutation(
          {
            description:
              "Create a voice broadcast that plays a recording to a list of contacts. Needs a verified callerId and a recordingId. Set sendImmediately true to send now, otherwise provide sendAt (e.g. 2026-07-25T12:00:00+0000). Places real phone calls and uses credits.",
            input: object({
              name: string({ minLength: 1 }),
              calleridId: string({ minLength: 1 }),
              recordingId: string({ minLength: 1 }),
              contacts: array(contactEntry),
              machineRecordingId: string().optional(),
              sendAt: string().optional(),
              sendImmediately: boolean().optional(),
              useAmd: boolean().optional(),
              sendEmail: boolean().optional(),
              accessaccountId: string().optional(),
            }),
          },
          async (_ctx, input) => call("POST", "/service/call", body(input)),
        ),
        cancel: mutation(
          { description: "Cancel a scheduled voice broadcast.", input: id("id") },
          async (_ctx, { id }) => call("DELETE", `/service/call/${encodeURIComponent(id)}`),
        ),
      },
      { title: "Calls", description: "Voice broadcasts." },
    ),
    texts: router(
      {
        list: list("/service/texts", "List text (SMS) broadcasts."),
        get: get((i) => `/service/text/${encodeURIComponent(i)}`, "Get one text broadcast by ID."),
        recipients: query(
          { description: "List the recipients of a text broadcast and their delivery results." + pagingNote, input: object({ id: string({ minLength: 1 }), ...paging }) },
          async (_ctx, { id, from, to }) => call("GET", `/service/text/${encodeURIComponent(id)}/recipients`, undefined, { from, to }),
        ),
        create: mutation(
          {
            description:
              "Create a text broadcast to a list of contacts. Needs a keywordId and 1-10 messages. Set sendImmediately true to send now, otherwise provide sendAt (e.g. 2026-07-25T12:00:00+0000). Sends real SMS messages and uses credits.",
            input: object({
              name: string({ minLength: 1 }),
              keywordId: string({ minLength: 1 }),
              messages: array(string({ minLength: 1 })),
              contacts: array(contactEntry),
              sendAt: string().optional(),
              sendImmediately: boolean().optional(),
              sendEmail: boolean().optional(),
              accessaccountId: string().optional(),
              shortcodeId: string().optional(),
              concatenateSms: boolean().optional(),
            }),
          },
          async (_ctx, input) => call("POST", "/service/text", body(input)),
        ),
        cancel: mutation(
          { description: "Cancel a scheduled text broadcast.", input: id("id") },
          async (_ctx, { id }) => call("DELETE", `/service/text/${encodeURIComponent(id)}`),
        ),
        listIncoming: list("/incoming/texts", "List incoming text replies."),
        getIncoming: get((i) => `/incoming/text/${encodeURIComponent(i)}`, "Get one incoming text by ID."),
        deleteIncoming: mutation(
          { description: "Delete an incoming text.", input: id("id") },
          async (_ctx, { id }) => call("DELETE", `/incoming/text/${encodeURIComponent(id)}`),
        ),
        listShortcodes: list("/shortcodes", "List shortcodes available to the account."),
      },
      { title: "Texts", description: "Text (SMS) broadcasts, incoming replies and shortcodes." },
    ),
    recordings: router(
      {
        list: list("/recordings", "List voice recordings."),
        get: get((i) => `/recording/${encodeURIComponent(i)}`, "Get one recording by ID."),
        createFromText: mutation(
          {
            description: "Create a recording from text using text-to-speech. gender is M or F; language is en or es.",
            input: object({ name: string({ minLength: 1 }), gender: string({ minLength: 1 }), language: string({ minLength: 1 }), text: string({ minLength: 1 }) }),
          },
          async (_ctx, input) => call("POST", "/recording/tts", input),
        ),
        createFromUrl: mutation(
          { description: "Create a recording from an MP3 or WAV file at a URL.", input: object({ name: string({ minLength: 1 }), url: string({ minLength: 1 }) }) },
          async (_ctx, input) => call("POST", "/recording/url", input),
        ),
        createByPhone: mutation(
          {
            description: "Create a recording by calling a phone number; the person who answers records the message. Places a real phone call.",
            input: object({
              name: string({ minLength: 1 }),
              phone: string({ minLength: 1 }),
              calleridId: string().optional(),
              whitelabel: boolean().optional(),
              extension: string().optional(),
            }),
          },
          async (_ctx, input) => call("POST", "/recording/phone", body(input)),
        ),
        rename: mutation(
          { description: "Rename a recording.", input: object({ id: string({ minLength: 1 }), name: string({ minLength: 1 }) }) },
          async (_ctx, { id, name }) => call("PUT", `/recording/${encodeURIComponent(id)}`, { name }),
        ),
        delete: mutation(
          { description: "Delete a recording.", input: id("id") },
          async (_ctx, { id }) => call("DELETE", `/recording/${encodeURIComponent(id)}`),
        ),
      },
      { title: "Recordings", description: "Voice recordings used by call broadcasts." },
    ),
    contacts: router(
      {
        list: list("/contacts", "List contacts."),
        listInGroup: query(
          { description: "List contacts in a group." + pagingNote, input: object({ groupId: string({ minLength: 1 }), ...paging }) },
          async (_ctx, { groupId, from, to }) => call("GET", `/contacts/${encodeURIComponent(groupId)}`, undefined, { from, to }),
        ),
        get: get((i) => `/contact/${encodeURIComponent(i)}`, "Get one contact by ID."),
        create: mutation(
          {
            description: "Add a contact. phone is required; groups is a list of group IDs.",
            input: object({
              phone: string({ minLength: 1 }),
              firstname: string().optional(),
              lastname: string().optional(),
              extension: string().optional(),
              email: string().optional(),
              extra1: string().optional(),
              groups: array(string()).optional(),
            }),
          },
          async (_ctx, input) => call("POST", "/contact", strip(input)),
        ),
        update: mutation(
          {
            description: "Update a contact. phone is required by the API even when unchanged.",
            input: object({
              id: string({ minLength: 1 }),
              phone: string({ minLength: 1 }),
              firstname: string().optional(),
              lastname: string().optional(),
              extension: string().optional(),
              email: string().optional(),
              extra1: string().optional(),
              groups: array(string()).optional(),
            }),
          },
          async (_ctx, { id, ...rest }) => call("PUT", `/contact/${encodeURIComponent(id)}`, strip(rest)),
        ),
        delete: mutation(
          { description: "Delete a contact.", input: id("id") },
          async (_ctx, { id }) => call("DELETE", `/contact/${encodeURIComponent(id)}`),
        ),
        listDoNotContact: list("/donotcontacts", "List do-not-contact numbers."),
      },
      { title: "Contacts", description: "Contacts and the do-not-contact list." },
    ),
    groups: router(
      {
        list: list("/groups", "List contact groups."),
        get: get((i) => `/group/${encodeURIComponent(i)}`, "Get one group by ID."),
        create: mutation(
          { description: "Add a contact group.", input: object({ name: string({ minLength: 1 }) }) },
          async (_ctx, input) => call("POST", "/group", input),
        ),
        rename: mutation(
          { description: "Rename a contact group.", input: object({ id: string({ minLength: 1 }), name: string({ minLength: 1 }) }) },
          async (_ctx, { id, name }) => call("PUT", `/group/${encodeURIComponent(id)}`, { name }),
        ),
        delete: mutation(
          { description: "Delete a contact group.", input: id("id") },
          async (_ctx, { id }) => call("DELETE", `/group/${encodeURIComponent(id)}`),
        ),
      },
      { title: "Groups", description: "Contact groups." },
    ),
    callerIds: router(
      {
        list: list("/callerids", "List caller IDs."),
        get: get((i) => `/callerid/${encodeURIComponent(i)}`, "Get one caller ID by ID."),
        create: mutation(
          {
            description: "Add a caller ID. DialMyCalls calls the number with a PIN that must then be passed to verify.",
            input: object({ phone: string({ minLength: 1 }), name: string({ minLength: 1 }) }),
          },
          async (_ctx, input) => call("POST", "/callerid", input),
        ),
        createUnverified: mutation(
          { description: "Add a caller ID without verifying it.", input: object({ phone: string({ minLength: 1 }), name: string({ minLength: 1 }) }) },
          async (_ctx, input) => call("POST", "/verify/callerid", input),
        ),
        verify: mutation(
          { description: "Verify a caller ID with the PIN received by phone.", input: object({ id: string({ minLength: 1 }), pin: string({ minLength: 1 }) }) },
          async (_ctx, { id, pin }) => call("PUT", `/verify/callerid/${encodeURIComponent(id)}`, { pin }),
        ),
        rename: mutation(
          { description: "Rename a caller ID.", input: object({ id: string({ minLength: 1 }), name: string({ minLength: 1 }) }) },
          async (_ctx, { id, name }) => call("PUT", `/callerid/${encodeURIComponent(id)}`, { name }),
        ),
        delete: mutation(
          { description: "Delete a caller ID.", input: id("id") },
          async (_ctx, { id }) => call("DELETE", `/callerid/${encodeURIComponent(id)}`),
        ),
      },
      { title: "Caller IDs", description: "Caller IDs that broadcasts are sent from." },
    ),
    keywords: router(
      {
        list: list("/keywords", "List text keywords."),
        get: get((i) => `/keyword/${encodeURIComponent(i)}`, "Get one keyword by ID."),
        delete: mutation(
          { description: "Delete a keyword.", input: id("id") },
          async (_ctx, { id }) => call("DELETE", `/keyword/${encodeURIComponent(id)}`),
        ),
      },
      { title: "Keywords", description: "Text-message keywords." },
    ),
    vanityNumbers: router(
      {
        list: list("/vanitynumbers", "List vanity numbers."),
        get: get((i) => `/vanitynumber/${encodeURIComponent(i)}`, "Get one vanity number by ID."),
        update: mutation(
          {
            description:
              "Update a vanity number. callOptions is an object of booleans (voicemail, ptt, optin, repeat); omitted options are turned off. recordingSource is specific, lastsent or lastuploaded.",
            input: object({
              id: string({ minLength: 1 }),
              callOptions: object({ voicemail: boolean().optional(), ptt: boolean().optional(), optin: boolean().optional(), repeat: boolean().optional() }).optional(),
              recordingSource: string().optional(),
              specificRecordingId: string().optional(),
              playCta: boolean().optional(),
              pttNumberId: string().optional(),
            }),
          },
          async (_ctx, { id, ...rest }) => call("PUT", `/vanitynumber/${encodeURIComponent(id)}`, body(rest)),
        ),
        listVoicemails: query(
          { description: "List voicemails left on a vanity number." + pagingNote, input: object({ id: string({ minLength: 1 }), ...paging }) },
          async (_ctx, { id, from, to }) => call("GET", `/vanitynumber/${encodeURIComponent(id)}/voicemails`, undefined, { from, to }),
        ),
        getVoicemail: query(
          { description: "Get one voicemail of a vanity number.", input: object({ id: string({ minLength: 1 }), voicemailId: string({ minLength: 1 }) }) },
          async (_ctx, { id, voicemailId }) => call("GET", `/vanitynumber/${encodeURIComponent(id)}/voicemail/${encodeURIComponent(voicemailId)}`),
        ),
        deleteVoicemail: mutation(
          { description: "Delete one voicemail of a vanity number.", input: object({ id: string({ minLength: 1 }), voicemailId: string({ minLength: 1 }) }) },
          async (_ctx, { id, voicemailId }) => call("DELETE", `/vanitynumber/${encodeURIComponent(id)}/voicemail/${encodeURIComponent(voicemailId)}`),
        ),
        delete: mutation(
          { description: "Delete a vanity number.", input: id("id") },
          async (_ctx, { id }) => call("DELETE", `/vanitynumber/${encodeURIComponent(id)}`),
        ),
      },
      { title: "Vanity numbers", description: "Vanity numbers." },
    ),
  });
}

export default defineApp(
  { user: { accounts: { dialmycalls: dialmycalls.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.dialmycalls ?? [],
        (account) =>
          withApprovals(build(client(account.fields.token, fetch, signal)), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "DialMyCalls",
        description:
          "Send voice and text broadcasts with DialMyCalls: calls, texts, recordings, contacts, groups, caller IDs, keywords and vanity numbers.",
        icons,
      },
    ),
  }),
);
