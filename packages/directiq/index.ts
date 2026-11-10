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
  plain,
  query,
  router,
  secrets,
  string,
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const base = "https://restapi.directiq.com";

const directiq = defineProvider({
  name: "DirectIQ",
  hosts: ["restapi.directiq.com"],
  auth: {
    apiKey: secrets({
      label: "User name and API key",
      fields: object({
        username: plain(string({ minLength: 1 })),
        token: string({ minLength: 1 }),
      }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/contactlists`, {
      signal,
      headers: { "user-name": account.fields.username, "api-key": account.fields.token },
    });
    await decodeJson(response, json());
  },
});

type Fetch = typeof fetch;

function client(username: string, token: string, fetcher: Fetch, signal: AbortSignal | undefined) {
  const call = async (method: string, path: string, body?: unknown) =>
    decodeJson(
      await fetcher(`${base}${path}`, {
        method,
        signal,
        headers: {
          "user-name": username,
          "api-key": token,
          ...(body === undefined ? {} : { "content-type": "application/json" }),
        },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      }),
      json(),
    );
  return {
    get: (path: string) => call("GET", path),
    post: (path: string, body?: unknown) => call("POST", path, body),
    del: (path: string, body?: unknown) => call("DELETE", path, body),
  };
}

type Client = ReturnType<typeof client>;

const id = (v: number) => encodeURIComponent(String(v));
const listId = object({ listId: number() });
const campaignId = object({ campaignId: number() });

function tools(c: Client) {
  return router({
    contacts: router({
      list: query(
        { description: "List all contacts in the account.", input: object({}) },
        async () => c.get("/contacts/view"),
      ),
      get: query(
        { description: "Get a contact by its contact id.", input: object({ contactId: number() }) },
        async (_ctx, { contactId }) => c.get(`/contacts/${id(contactId)}`),
      ),
      listByList: query(
        { description: "List all contacts in a contact list.", input: listId },
        async (_ctx, { listId }) => c.get(`/contacts/view/${id(listId)}`),
      ),
      listActive: query(
        { description: "List the active (subscribed) contacts in a contact list.", input: listId },
        async (_ctx, { listId }) => c.get(`/contacts/active/view/${id(listId)}`),
      ),
      listPassive: query(
        { description: "List the passive (unsubscribed, bounced or inactive) contacts in a contact list.", input: listId },
        async (_ctx, { listId }) => c.get(`/contacts/passive/view/${id(listId)}`),
      ),
      create: mutation(
        {
          description: "Add a contact to a contact list.",
          input: object({
            listId: number(),
            email: string({ minLength: 1 }),
            firstName: string().optional(),
            lastName: string().optional(),
          }),
          approval: always(),
        },
        async (_ctx, { listId, email, firstName, lastName }) =>
          c.post(`/contacts/${id(listId)}`, {
            Email: email,
            ...(firstName === undefined ? {} : { FirstName: firstName }),
            ...(lastName === undefined ? {} : { LastName: lastName }),
          }),
      ),
      remove: mutation(
        {
          description: "Delete a contact, by email address, from a contact list.",
          input: object({ listId: number(), email: string({ minLength: 1 }) }),
          approval: always(),
        },
        async (_ctx, { listId, email }) => c.del(`/contacts/delete/${id(listId)}`, { Email: email }),
      ),
    }),
    lists: router({
      list: query(
        { description: "List all contact lists.", input: object({}) },
        async () => c.get("/contactlists"),
      ),
      get: query(
        { description: "Get a contact list by id.", input: listId },
        async (_ctx, { listId }) => c.get(`/contactlists/view/${id(listId)}`),
      ),
      create: mutation(
        {
          description: "Create a contact list.",
          input: object({ name: string({ minLength: 1 }) }),
          approval: always(),
        },
        async (_ctx, { name }) => c.post(`/contactlists?name=${encodeURIComponent(name)}`),
      ),
      remove: mutation(
        { description: "Delete a contact list.", input: listId, approval: always() },
        async (_ctx, { listId }) => c.del(`/contactlists/delete/${id(listId)}`),
      ),
    }),
    campaigns: router({
      list: query(
        { description: "List all campaigns.", input: object({}) },
        async () => c.get("/campaigns"),
      ),
      create: mutation(
        {
          description:
            "Create a campaign from a template and send it to one or more contact lists. timeToSend is a date-time such as '4/11/2018 2:00:00 PM'. senderEmailId comes from mailFroms.list.",
          input: object({
            name: string({ minLength: 1 }),
            subject: string({ minLength: 1 }),
            templateId: number(),
            listIds: array(number()),
            timeToSend: string({ minLength: 1 }),
            senderEmailId: number(),
          }),
          approval: always(),
        },
        async (_ctx, input) =>
          c.post("/campaigns", {
            Name: input.name,
            Subject: input.subject,
            TemplateId: input.templateId,
            ListIds: input.listIds,
            TimeToSend: input.timeToSend,
            SenderEmailId: input.senderEmailId,
          }),
      ),
    }),
    templates: router({
      list: query(
        { description: "List all email templates.", input: object({}) },
        async () => c.get("/templates"),
      ),
      create: mutation(
        {
          description: "Create an email template with an HTML body and an optional plain-text body.",
          input: object({
            name: string({ minLength: 1 }),
            subject: string({ minLength: 1 }),
            body: string({ minLength: 1 }),
            textBody: string().optional(),
          }),
          approval: always(),
        },
        async (_ctx, { name, subject, body, textBody }) =>
          c.post("/templates", {
            Name: name,
            Subject: subject,
            Body: body,
            ...(textBody === undefined ? {} : { TextBody: textBody }),
            UpdateDate: new Date().toISOString(),
          }),
      ),
    }),
    mailFroms: router({
      list: query(
        { description: "List the verified sender (mail-from) addresses.", input: object({}) },
        async () => c.get("/mailfroms"),
      ),
    }),
    reports: router({
      stats: query(
        {
          description: "Campaign statistics: recipients, delivered, bounces, hard bounces, reads, unique reads, clicks, forwards, unsubscribes and spam complaints.",
          input: campaignId,
        },
        async (_ctx, { campaignId }) => c.get(`/stats/${id(campaignId)}`),
      ),
      reads: query(
        { description: "List the reads (opens) recorded for a campaign.", input: campaignId },
        async (_ctx, { campaignId }) => c.get(`/reads/${id(campaignId)}`),
      ),
      clicks: query(
        { description: "List the link clicks recorded for a campaign.", input: campaignId },
        async (_ctx, { campaignId }) => c.get(`/clicks/${id(campaignId)}`),
      ),
      unsubscribes: query(
        { description: "List the unsubscribes recorded for a campaign.", input: campaignId },
        async (_ctx, { campaignId }) => c.get(`/unsubscribes/${id(campaignId)}`),
      ),
      spamComplaints: query(
        { description: "List the spam complaints recorded for a campaign.", input: campaignId },
        async (_ctx, { campaignId }) => c.get(`/spamcomplaints/${id(campaignId)}`),
      ),
    }),
  });
}

export default defineApp(
  { user: { accounts: { directiq: directiq.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.directiq ?? [],
        (account) => tools(client(account.fields.username, account.fields.token, fetch, signal)),
        { signal },
      ),
      {
        title: "DirectIQ",
        description: "DirectIQ email marketing: contacts, contact lists, campaigns, templates, sender addresses and campaign reports.",
        icons,
      },
    ),
  }),
);
