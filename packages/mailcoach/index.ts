import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  json,
  mutation,
  number,
  object,
  plain,
  query,
  record,
  router,
  secrets,
  string,
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

// Mailcoach is self-hosted (any domain) or hosted on Mailcoach Cloud; the API lives at <domain>/api.
function origin(account: { fields: { url: string } }) {
  const raw = account.fields.url.trim();
  let parsed: URL;
  try {
    parsed = new URL(/^[a-z][a-z0-9+.-]*:\/\//i.test(raw) ? raw : `https://${raw}`);
  } catch {
    throw new Error("Enter your Mailcoach domain, for example https://mail.example.com.");
  }
  if (parsed.protocol !== "https:")
    throw new Error("The Mailcoach URL must use https:// so the API token is not sent in plaintext.");
  if (parsed.search !== "" || parsed.hash !== "" || parsed.username !== "" || parsed.password !== "")
    throw new Error("Enter only the Mailcoach base URL, without credentials, query or fragment.");
  return `${parsed.origin}${parsed.pathname.replace(/\/+$/, "").replace(/\/api$/, "")}`;
}

// No `hosts`: self-hosted installations live on any domain, and a wildcard is not a valid host pattern.
const mailcoach = defineProvider({
  name: "Mailcoach",
  auth: {
    apiKey: secrets({
      label: "API token",
      fields: object({
        url: plain(string({ minLength: 1 })),
        token: string({ minLength: 1 }),
      }),
    }),
  },
  // GET /api/user returns the user the token belongs to.
  async health({ account, fetch, signal }) {
    const response = await fetch(`${origin(account)}/api/user`, {
      signal,
      headers: { Authorization: `Bearer ${account.fields.token}`, Accept: "application/json" },
    });
    await decodeJson(response, object({}));
  },
});

type Fetch = typeof fetch;
type Params = Record<string, string | number | boolean | undefined>;

function client(base: string, token: string, fetcher: Fetch, signal: AbortSignal | undefined) {
  return async (method: string, path: string, params: Params = {}, body?: unknown) => {
    if (path.includes("?") || path.includes("#")) throw new Error("path must not contain ? or #; use the query field");
    const url = new URL(`${base}/api${path}`);
    const apiRoot = new URL(`${base}/api/`);
    if (url.origin !== apiRoot.origin || !url.pathname.startsWith(apiRoot.pathname))
      throw new Error("path must stay under /api on the account host");
    for (const [key, value] of Object.entries(params)) {
      if (value === undefined) continue;
      url.searchParams.set(key, String(value));
    }
    const response = await fetcher(url.toString(), {
      method,
      signal,
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
        ...(body === undefined ? {} : { "Content-Type": "application/json" }),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    if (response.status === 204 || (method === "DELETE" && response.ok)) return { ok: true };
    return decodeJson(response, json());
  };
}

type Call = ReturnType<typeof client>;

const seg = encodeURIComponent;
const id = () => string({ minLength: 1 });
const Query = record(string());
const queryDoc =
  'Extra query parameters, for example {"filter[search]": "term", "sort": "-created_at"}.';
const listInput = object({ page: number().optional(), query: Query.optional() });
const bodyInput = object({ body: json() });

function build(call: Call) {
  const list = (path: string, description: string) =>
    query({ description: `${description} Paginated; pass page. ${queryDoc}`, input: listInput }, (_c, { page, query: q }) =>
      call("GET", path, { page, ...(q ?? {}) }),
    );
  const listOf = (path: (i: string) => string, description: string) =>
    query(
      { description: `${description} Paginated; pass page. ${queryDoc}`, input: object({ id: id(), page: number().optional(), query: Query.optional() }) },
      (_c, { id: i, page, query: q }) => call("GET", path(i), { page, ...(q ?? {}) }),
    );
  const get = (path: (i: string) => string, description: string) =>
    query({ description, input: object({ id: id() }) }, (_c, { id: i }) => call("GET", path(i)));
  const create = (path: string, description: string) =>
    mutation({ description, input: bodyInput }, (_c, { body }) => call("POST", path, {}, body));
  const createOn = (path: (i: string) => string, description: string) =>
    mutation({ description, input: object({ id: id(), body: json() }) }, (_c, { id: i, body }) => call("POST", path(i), {}, body));
  const update = (method: "PUT" | "PATCH", path: (i: string) => string, description: string) =>
    mutation({ description, input: object({ id: id(), body: json() }) }, (_c, { id: i, body }) => call(method, path(i), {}, body));
  const action = (path: (i: string) => string, description: string) =>
    mutation({ description, input: object({ id: id() }) }, (_c, { id: i }) => call("POST", path(i)));
  const remove = (path: (i: string) => string, description: string) =>
    mutation({ description, input: object({ id: id() }) }, (_c, { id: i }) => call("DELETE", path(i)));
  const childUpdate = (method: "PUT", path: (i: string, j: string) => string, description: string) =>
    mutation(
      { description, input: object({ id: id(), childId: id(), body: json() }) },
      (_c, { id: i, childId, body }) => call(method, path(i, childId), {}, body),
    );
  const childRemove = (path: (i: string, j: string) => string, description: string) =>
    mutation({ description, input: object({ id: id(), childId: id() }) }, (_c, { id: i, childId }) =>
      call("DELETE", path(i, childId)),
    );

  const emailLists = router(
    {
      list: list("/email-lists", "List email lists."),
      get: get((i) => `/email-lists/${seg(i)}`, "Get an email list by UUID."),
      create: create("/email-lists", "Create an email list. Body: {name, default_from_email, ...} as in the API reference."),
      update: update("PUT", (i) => `/email-lists/${seg(i)}`, "Update an email list. Pass all fields from the create payload."),
      delete: remove((i) => `/email-lists/${seg(i)}`, "Delete an email list."),
      tags: listOf((i) => `/email-lists/${seg(i)}/tags`, "List the tags of an email list."),
      createTag: createOn((i) => `/email-lists/${seg(i)}/tags`, "Create a tag on an email list. Body: {name}."),
      segments: listOf((i) => `/email-lists/${seg(i)}/segments`, "List the segments of an email list."),
      createSegment: createOn((i) => `/email-lists/${seg(i)}/segments`, "Create a segment on an email list. Body: {name, ...}."),
      updateTag: childUpdate("PUT", (i, j) => `/email-lists/${seg(i)}/tags/${seg(j)}`, "Update a tag. id is the email list UUID, childId the tag UUID. Pass all fields from the create payload."),
      deleteTag: childRemove((i, j) => `/email-lists/${seg(i)}/tags/${seg(j)}`, "Delete a tag. id is the email list UUID, childId the tag UUID."),
      updateSegment: childUpdate("PUT", (i, j) => `/email-lists/${seg(i)}/segments/${seg(j)}`, "Update a segment. id is the email list UUID, childId the segment UUID. Pass all fields from the create payload."),
      deleteSegment: childRemove((i, j) => `/email-lists/${seg(i)}/segments/${seg(j)}`, "Delete a segment. id is the email list UUID, childId the segment UUID."),
    },
    { title: "Email lists", description: "Email lists with their tags and segments." },
  );
  const subscribers = router(
    {
      list: listOf((i) => `/email-lists/${seg(i)}/subscribers`, "List subscribers of an email list (id is the list UUID). Filters: filter[email], filter[search], filter[status] (unconfirmed, subscribed, unsubscribed)."),
      get: get((i) => `/subscribers/${seg(i)}`, "Get a subscriber by UUID."),
      subscribe: createOn((i) => `/email-lists/${seg(i)}/subscribers`, "Subscribe an email address to a list (id is the list UUID). Body: {email, first_name, last_name, tags, skip_confirmation, ...}."),
      update: update("PATCH", (i) => `/subscribers/${seg(i)}`, "Update a subscriber."),
      delete: remove((i) => `/subscribers/${seg(i)}`, "Delete a subscriber and erase it."),
      confirm: action((i) => `/subscribers/${seg(i)}/confirm`, "Confirm a subscriber's subscription."),
      unsubscribe: action((i) => `/subscribers/${seg(i)}/unsubscribe`, "Unsubscribe a subscriber."),
      resendConfirmation: action((i) => `/subscribers/${seg(i)}/resend-confirmation`, "Resend the confirmation email to a subscriber."),
      addTags: createOn((i) => `/subscribers/${seg(i)}/tags`, "Add tags to a subscriber. Body: {tags: [...]}."),
      removeTags: mutation(
        { description: "Remove tags from a subscriber. Body: {tags: [...]}.", input: object({ id: id(), body: json() }) },
        (_c, { id: i, body }) => call("DELETE", `/subscribers/${seg(i)}/tags`, {}, body),
      ),
      confirmByEmail: createOn((i) => `/email-lists/${seg(i)}/confirm`, "Confirm a subscriber by email (id is the list UUID). Body: {email}."),
      unsubscribeByEmail: createOn((i) => `/email-lists/${seg(i)}/unsubscribe`, "Unsubscribe a subscriber by email (id is the list UUID). Body: {email}."),
      resendConfirmationByEmail: createOn((i) => `/email-lists/${seg(i)}/resend-confirmation`, "Resend the confirmation email by email address (id is the list UUID). Body: {email}."),
    },
    { title: "Subscribers", description: "Subscribers, their status and tags." },
  );

  const campaigns = router(
    {
      list: list("/campaigns", "List campaigns."),
      get: get((i) => `/campaigns/${seg(i)}`, "Get a campaign by UUID."),
      create: create("/campaigns", "Create a campaign. Body: {name, email_list_uuid, html or template_uuid, subject, from_email, from_name, ...}."),
      update: update("PUT", (i) => `/campaigns/${seg(i)}`, "Update a campaign."),
      delete: remove((i) => `/campaigns/${seg(i)}`, "Delete a campaign."),
      send: action((i) => `/campaigns/${seg(i)}/send`, "Send a campaign to its list now."),
      sendTest: createOn((i) => `/campaigns/${seg(i)}/send-test`, "Send a test of a campaign. Body: {email}."),
      opens: listOf((i) => `/campaigns/${seg(i)}/opens`, "List opens of a campaign."),
      clicks: listOf((i) => `/campaigns/${seg(i)}/clicks`, "List clicks of a campaign."),
      unsubscribes: listOf((i) => `/campaigns/${seg(i)}/unsubscribes`, "List unsubscribes caused by a campaign."),
      bounces: listOf((i) => `/campaigns/${seg(i)}/bounces`, "List bounced subscribers of a campaign."),
    },
    { title: "Campaigns", description: "Email campaigns and their engagement." },
  );

  const templates = router(
    {
      list: list("/templates", "List templates."),
      get: get((i) => `/templates/${seg(i)}`, "Get a template by UUID."),
      create: create("/templates", "Create a template. Body: {name, html, ...}."),
      update: update("PUT", (i) => `/templates/${seg(i)}`, "Update a template."),
      delete: remove((i) => `/templates/${seg(i)}`, "Delete a template."),
    },
    { title: "Templates", description: "Reusable email templates." },
  );

  const automationMails = router(
    {
      list: list("/automation-mails", "List automation mails."),
      get: get((i) => `/automation-mails/${seg(i)}`, "Get an automation mail by UUID."),
      create: create("/automation-mails", "Create an automation mail. Body: {name, subject, html, ...}."),
      update: update("PUT", (i) => `/automation-mails/${seg(i)}`, "Update an automation mail."),
      delete: remove((i) => `/automation-mails/${seg(i)}`, "Delete an automation mail."),
    },
    { title: "Automation mails", description: "Emails sent by automations." },
  );

  const transactional = router(
    {
      templates: list("/transactional-mails/templates", "List transactional email templates."),
      getTemplate: get((i) => `/transactional-mails/templates/${seg(i)}`, "Get a transactional email template by UUID."),
      list: list("/transactional-mails", "List sent transactional emails."),
      get: get((i) => `/transactional-mails/${seg(i)}`, "Get a sent transactional email by UUID."),
      send: create("/transactional-mails/send", "Send a transactional email. Body: {mail_name or html, subject, from, to, cc, bcc, replacements, mailer, fake, ...}."),
    },
    { title: "Transactional mail", description: "Transactional email templates and sending." },
  );

  const imports = router(
    {
      list: list("/subscriber-imports", "List subscriber imports."),
      get: get((i) => `/subscriber-imports/${seg(i)}`, "Get a subscriber import by UUID."),
      create: create("/subscriber-imports", "Create a subscriber import. Body: {email_list_uuid, subscribers_csv, subscribe_unsubscribed, unsubscribe_missing, replace_tags, ...}."),
      update: update("PUT", (i) => `/subscriber-imports/${seg(i)}`, "Update a subscriber import."),
      append: createOn((i) => `/subscriber-imports/${seg(i)}/append`, "Append CSV rows to an import. Body: {subscribers_csv}."),
      start: action((i) => `/subscriber-imports/${seg(i)}/start`, "Start a subscriber import."),
      delete: remove((i) => `/subscriber-imports/${seg(i)}`, "Delete a subscriber import."),
    },
    { title: "Subscriber imports", description: "Bulk CSV subscriber imports." },
  );

  const suppressions = router(
    {
      list: list("/suppressions", "List suppressed email addresses."),
      get: get((i) => `/suppressions/${seg(i)}`, "Get a suppression by email address (id)."),
      create: create("/suppressions", "Add a suppression. Body: {email, reason}."),
      delete: remove((i) => `/suppressions/${seg(i)}`, "Remove a suppression by email address (id)."),
    },
    { title: "Suppressions", description: "Addresses Mailcoach will not send to." },
  );

  const reporting = router(
    {
      user: query({ description: "Get the user that owns the API token.", input: object({}) }, () => call("GET", "/user")),
      getSend: get((i) => `/sends/${seg(i)}`, "Get a send (one email delivery) by UUID."),
      deleteSend: remove((i) => `/sends/${seg(i)}`, "Delete a send."),
      getLink: get((i) => `/links/${seg(i)}`, "Get a tracked link, with click statistics, by UUID."),
    },
    { title: "Account, sends and links", description: "Current user, individual sends and tracked links." },
  );

  return router({
    emailLists,
    subscribers,
    campaigns,
    templates,
    automationMails,
    transactional,
    imports,
    suppressions,
    reporting,
  });
}

export default defineApp(
  { user: { accounts: { mailcoach: mailcoach.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.mailcoach ?? [],
        (account) =>
          withApprovals(build(client(origin(account), account.fields.token, fetch, signal)), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Mailcoach",
        description:
          "Email lists, subscribers, tags, segments, campaigns, templates, automation mails, transactional email, imports and suppressions in Mailcoach.",
        icons,
        instructions:
          "Resources are addressed by UUID. Tools with a body take the JSON payload documented in the Mailcoach API reference. List tools are paginated with page and accept a query record for filter[...] and sort keys.",
      },
    ),
  }),
);
