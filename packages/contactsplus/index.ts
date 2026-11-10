import {
  accountRouter,
  array,
  decodeJson,
  defineApp,
  defineProvider,
  json,
  mutation,
  number,
  boolean,
  oauth2,
  object,
  query,
  router,
  string,
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const base = "https://api.contactsplus.com/api/v1";

const Account = object({ account: object({ accountId: string() }) });

const contactsplus = defineProvider({
  name: "Contacts+",
  hosts: ["api.contactsplus.com"],
  auth: {
    // Contacts+ has no API keys and no client registration: the connect page asks for an OAuth app's client
    // (created at https://app.contactsplus.com/apps).
    oauth: oauth2({
      authorizationUrl: "https://app.contactsplus.com/oauth/authorize",
      tokenUrl: "https://api.contactsplus.com/v3/oauth.exchangeAuthCode",
      tokenEndpointAuthMethod: "client_secret_post",
      scopes: [
        "account.read",
        "contacts.read",
        "contacts.write",
        "tags.read",
        "tags.write",
        "teams.read",
        "teams.contacts.read",
        "teams.contacts.write",
        "teams.tags.read",
        "teams.tags.write",
      ],
      scopeSeparator: ",",
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/account.get`, {
      method: "POST",
      signal,
      headers: { Authorization: `Bearer ${account.fields.access_token}`, "content-type": "application/json" },
      body: "{}",
    });
    const me = await decodeJson(response, Account);
    return { accountInfo: { externalId: me.account.accountId } };
  },
});

function build(token: string, fetcher: typeof fetch, signal: AbortSignal | undefined) {
  const call = async (method: string, body: Record<string, unknown>) => {
    const response = await fetcher(`${base}/${method}`, {
      method: "POST",
      signal,
      headers: { Authorization: `Bearer ${token}`, "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    if (response.status === 204) return { ok: true };
    const text = await response.text();
    if (!response.ok) throw new Error(`Contacts+ ${method} failed (${response.status}): ${text.slice(0, 500)}`);
    return text ? (JSON.parse(text) as never) : { ok: true };
  };
  const ids = () => array(string({ minLength: 1 }));
  const team = { teamId: string().optional() };
  const teamNote = " Set teamId to act on a team's data instead of the personal account (ids from teams.get).";
  const etagNote = " Requires the current etag from a previous read.";

  const contactBody = "contact.contactData holds name {givenName, familyName, ...}, emails, phoneNumbers, addresses, organizations, urls, notes.";

  return router({
    account: router({
      get: query({ description: "Get the connected Contacts+ account and its profile data.", input: object({}) }, () =>
        call("account.get", {}),
      ),
    }),
    contacts: router({
      get: query(
        { description: "Fetch contacts by id." + teamNote, input: object({ contactIds: ids(), ...team }) },
        (_c, input) => call("contacts.get", input),
      ),
      scroll: query(
        {
          description:
            "List all contacts, a page at a time. Pass the cursor from the previous response as scrollCursor to continue." + teamNote,
          input: object({
            size: number().optional(),
            scrollCursor: string().optional(),
            includeDeletedContacts: boolean().optional(),
            ...team,
          }),
        },
        (_c, input) => call("contacts.scroll", input),
      ),
      search: query(
        {
          description:
            "Search contacts. searchQuery supports field queries joined with AND/OR, for example firstName:John AND company:Acme. tagIds filters by tag. Pass the cursor from the previous response as searchCursor to continue." +
            teamNote,
          input: object({
            searchQuery: string().optional(),
            searchCursor: string().optional(),
            tagIds: ids().optional(),
            ...team,
          }),
        },
        (_c, input) => call("contacts.search", input),
      ),
      create: mutation(
        {
          description: `Create a contact. ${contactBody}${teamNote}`,
          input: object({ contact: json(), ...team }),
        },
        (_c, input) => call("contacts.create", input),
      ),
      update: mutation(
        {
          description: `Update a contact: contact is {contactId, etag, contactData}. Set resolveConflicts to merge with newer server changes.${etagNote}${teamNote}`,
          input: object({ contact: json(), resolveConflicts: boolean().optional(), ...team }),
        },
        (_c, input) => call("contacts.update", input),
      ),
      delete: mutation(
        {
          description: `Delete a contact.${etagNote}${teamNote}`,
          input: object({ contactId: string({ minLength: 1 }), etag: string({ minLength: 1 }), ...team }),
        },
        (_c, input) => call("contacts.delete", input),
      ),
      changeOwner: mutation(
        {
          description:
            "Change the owner of team contacts. ownerId is an accountId from teams.get, or null to remove the owner." + teamNote,
          input: object({ contactIds: ids(), ownerId: json(), ...team }),
        },
        (_c, input) => call("contacts.changeOwner", input),
      ),
      manageTags: mutation(
        {
          description: "Add and remove tags on contacts in one call." + teamNote,
          input: object({ contactIds: ids(), addTagIds: ids().optional(), removeTagIds: ids().optional(), ...team }),
        },
        (_c, input) => call("contacts.manageTags", input),
      ),
    }),
    tags: router({
      get: query(
        { description: "Fetch tags by id." + teamNote, input: object({ tagIds: ids(), ...team }) },
        (_c, input) => call("tags.get", input),
      ),
      scroll: query(
        {
          description: "List all tags, a page at a time. Pass the cursor from the previous response as scrollCursor." + teamNote,
          input: object({
            size: number().optional(),
            scrollCursor: string().optional(),
            includeDeletedTags: boolean().optional(),
            ...team,
          }),
        },
        (_c, input) => call("tags.scroll", input),
      ),
      create: mutation(
        {
          description: 'Create a tag: tag is {tagData: {name}}. Returns the existing tag when the name is taken.' + teamNote,
          input: object({ tag: json(), ...team }),
        },
        (_c, input) => call("tags.create", input),
      ),
      update: mutation(
        {
          description: `Rename a tag: tag is {tagId, etag, tagData: {name}}.${etagNote}${teamNote}`,
          input: object({ tag: json(), ...team }),
        },
        (_c, input) => call("tags.update", input),
      ),
      delete: mutation(
        {
          description: `Delete a tag.${etagNote}${teamNote}`,
          input: object({ tagId: string({ minLength: 1 }), etag: string({ minLength: 1 }), ...team }),
        },
        (_c, input) => call("tags.delete", input),
      ),
    }),
    teams: router({
      get: query({ description: "List the teams the account belongs to, with their members.", input: object({}) }, () =>
        call("teams.get", {}),
      ),
    }),
    webhooks: router({
      get: query(
        {
          description: "Fetch webhooks by id, or page through them." + teamNote,
          input: object({ webhookIds: ids().optional(), page: number().optional(), ...team }),
        },
        (_c, input) => call("webhooks.get", input),
      ),
      search: query(
        {
          description: "Search webhooks by target url and trigger ids." + teamNote,
          input: object({ url: string().optional(), triggerIds: ids().optional(), page: number().optional(), ...team }),
        },
        (_c, input) => call("webhooks.search", input),
      ),
      getTriggers: query({ description: "List the events a webhook can subscribe to.", input: object({}) }, () =>
        call("webhooks.getTriggers", {}),
      ),
      getBatches: query(
        {
          description: "Delivery batches of a webhook from the last 14 days." + teamNote,
          input: object({ webhookId: string({ minLength: 1 }), batchId: string().optional(), ...team }),
        },
        (_c, input) => call("webhooks.getBatches", input),
      ),
      create: mutation(
        {
          description: "Subscribe a url to webhook triggers." + teamNote,
          input: object({ url: string({ minLength: 1 }), triggerIds: ids(), ...team }),
        },
        (_c, input) => call("webhooks.create", input),
      ),
      delete: mutation(
        {
          description: "Delete a webhook." + teamNote,
          input: object({ webhookId: string({ minLength: 1 }), ...team }),
        },
        (_c, input) => call("webhooks.delete", input),
      ),
    }),
  });
}

export default defineApp(
  { user: { accounts: { contactsplus: contactsplus.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.contactsplus ?? [],
        (account) =>
          withApprovals(build(account.fields.access_token, fetch, signal), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Contacts+",
        description: "Contacts, tags, teams and webhooks in Contacts+ (FullContact's contact manager).",
        icons,
      },
    ),
  }),
);
