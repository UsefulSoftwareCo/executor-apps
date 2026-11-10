import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  json,
  mutation,
  object,
  query,
  router,
  secrets,
  string,
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const base = "https://api.spoki.com";

const spoki = defineProvider({
  name: "Spoki",
  hosts: ["api.spoki.com"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // Listing the accounts the key can see is read-only and authenticated.
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/api/1/accounts/`, {
      signal,
      headers: { "X-Spoki-Api-Key": account.fields.token, Accept: "application/json" },
    });
    await decodeJson(response, json());
  },
});

type Fetch = typeof fetch;
type Call = (method: string, path: string, query?: unknown, body?: unknown) => Promise<unknown>;

function client(token: string, fetcher: Fetch, signal: AbortSignal | undefined): Call {
  return async (method, path, params, body) => {
    const url = new URL(`${base}${path}`);
    if (params !== undefined && params !== null && typeof params === "object") {
      for (const [key, value] of Object.entries(params)) {
        if (value === undefined || value === null) continue;
        // Arrays repeat the key, objects are sent as JSON, scalars as strings.
        if (Array.isArray(value)) {
          for (const item of value) {
            url.searchParams.append(key, typeof item === "object" && item !== null ? JSON.stringify(item) : String(item));
          }
        } else if (typeof value === "object") url.searchParams.set(key, JSON.stringify(value));
        else url.searchParams.set(key, String(value));
      }
    }
    const response = await fetcher(url.toString(), {
      method,
      signal,
      headers: {
        "X-Spoki-Api-Key": token,
        Accept: "application/json",
        ...(body === undefined ? {} : { "Content-Type": "application/json" }),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    // Several actions answer 200/204 with an empty body: any 2xx with no body
    // is reported as { ok: true }. Anything else keeps the normal error path.
    if (response.ok) {
      const text = await response.text();
      if (text.trim() === "") return { ok: true };
      return JSON.parse(text);
    }
    return decodeJson(response, json());
  };
}

const Id = object({ id: string({ minLength: 1 }) });
const Filters = object({
  filters: json().optional(),
});
const IdBody = object({ id: string({ minLength: 1 }), body: json() });
const Body = object({ body: json() });

const filtersDescription =
  " Optional `filters` is an object of query-string parameters (for example page, page_size, channel_id, or field filters). Values should be scalars; arrays repeat the key and objects are sent as JSON.";

function build(call: Call) {
  const list = (path: string, what: string) =>
    query({ description: `List, search and filter ${what}.${filtersDescription}`, input: Filters }, async (_c, { filters }) =>
      call("GET", path, filters),
    );
  const get = (path: string, what: string) =>
    query({ description: `Retrieve one ${what} by id.`, input: Id }, async (_c, { id }) =>
      call("GET", `${path}${encodeURIComponent(id)}/`),
    );
  const create = (path: string, what: string, shape: string) =>
    mutation({ description: `Create ${what}. \`body\` fields: ${shape}`, input: Body }, async (_c, { body }) =>
      call("POST", path, undefined, body),
    );
  const update = (path: string, what: string, shape: string) =>
    mutation({ description: `Partially update ${what}. \`body\` fields: ${shape}`, input: IdBody }, async (_c, { id, body }) =>
      call("PATCH", `${path}${encodeURIComponent(id)}/`, undefined, body),
    );
  const remove = (path: string, what: string) =>
    mutation({ description: `Delete ${what} by id.`, input: Id }, async (_c, { id }) =>
      call("DELETE", `${path}${encodeURIComponent(id)}/`),
    );
  const action = (path: string, suffix: string, description: string) =>
    mutation({ description, input: Id }, async (_c, { id }) =>
      call("POST", `${path}${encodeURIComponent(id)}/${suffix}/`, undefined, {}),
    );
  const actionBody = (path: string, suffix: string, description: string) =>
    mutation({ description, input: IdBody }, async (_c, { id, body }) =>
      call("POST", `${path}${encodeURIComponent(id)}/${suffix}/`, undefined, body),
    );

  const contactShape =
    "phone (E.164), first_name, last_name, email, language, status, custom_fields (object keyed by custom field code).";

  return router({
    messages: router(
      {
        send: mutation(
          {
            description:
              "Send a WhatsApp message through POST /messages/send/. `body` is one of: a template { type: 'Template', phone, template: <template id>, email?, language?, custom_fields?, buttons?: [{order, payload}], header_media?: {url, filename}, header_media_set?: [{url, filename, language?}], metadata? }; a free-text message { type: 'Message', content_type: 'Text', phone, text, metadata? } (only inside the 24-hour customer service window); an interactive message { type: 'Message', content_type: 'Interactive', phone, text, header?, footer?, buttons: [{button_type: 'quick_reply', text, order, payload?}] }; or a list { type: 'Message', content_type: 'List', phone, text, header?, footer?, list: {title, sections: [{title, rows: [{title, description, payload}]}]} }. Add channel_id to choose a sending channel.",
            input: Body,
          },
          async (_c, { body }) => call("POST", "/api/1/messages/send/", undefined, body),
        ),
        report: query(
          { description: `List detailed message reports (reports V2).${filtersDescription}`, input: Filters },
          async (_c, { filters }) => call("GET", "/api/1/reports/detailed/", filters),
        ),
      },
      { title: "Messages", description: "Send WhatsApp templates and messages, and read delivery reports." },
    ),
    contacts: router(
      {
        list: list("/api/1/contacts/", "contacts"),
        get: get("/api/1/contacts/", "contact"),
        sync: create("/api/1/contacts/sync/", "or update a contact, matched by phone", contactShape),
        syncMany: mutation(
          { description: "Create or update many contacts in one call. `body` is an array of contact objects: " + contactShape, input: Body },
          async (_c, { body }) => call("POST", "/api/1/contacts/sync_all/", undefined, body),
        ),
        update: update("/api/1/contacts/", "a contact", contactShape + " Set is_blocked true or false to block or unblock."),
        delete: remove("/api/1/contacts/", "a contact"),
        addOperator: actionBody("/api/1/contacts/", "add_operator", "Assign an operator to a contact. `body` is { email }."),
        removeOperator: actionBody("/api/1/contacts/", "remove_operator", "Remove an operator from a contact. `body` is { email }."),
      },
      { title: "Contacts", description: "WhatsApp contacts, keyed by phone number." },
    ),
    lists: router(
      {
        list: list("/api/1/lists/", "contact lists"),
        get: get("/api/1/lists/", "list"),
        create: create("/api/1/lists/", "a list", "name."),
        syncContacts: actionBody("/api/1/lists/", "sync_contacts", "Create or update contacts, then add them to the list. `body` is { contacts: [contact objects] }."),
        removeContacts: actionBody("/api/1/lists/", "remove_contacts", "Remove contacts from a list. `body` is { emails?, phones?, ids? }."),
        removeAllContacts: action("/api/1/lists/", "remove_all_contacts", "Remove every contact from a list."),
        delete: remove("/api/1/lists/", "a list"),
      },
      { title: "Lists", description: "Contact lists used as campaign audiences." },
    ),
    customFields: router(
      {
        list: list("/api/1/custom-fields/", "custom fields"),
        get: get("/api/1/custom-fields/", "custom field"),
        create: create("/api/1/custom-fields/", "a custom field", "label, code, field_type (integer), example."),
        update: update("/api/1/custom-fields/", "a custom field", "label and other field properties."),
        delete: remove("/api/1/custom-fields/", "a custom field"),
      },
      { title: "Custom fields", description: "Per-account contact fields." },
    ),
    tags: router(
      {
        list: list("/api/1/tags/", "tags"),
        get: get("/api/1/tags/", "tag"),
      },
      { title: "Tags", description: "Contact tags." },
    ),
    templates: router(
      {
        list: list("/api/1/templates/", "message templates"),
        get: get("/api/1/templates/", "template"),
        create: create(
          "/api/1/templates/",
          "a message template",
          "name, category (MARKETING, UTILITY...), subcategory, templatelocalization_set: [{language, header_template_component, body_template_component, footer_template_component, buttons...}].",
        ),
        update: update("/api/1/templates/", "a template", "same shape as create; localizations carry their id."),
        // Spoki uses GET for this, but it creates a new draft template, so it is a mutation.
        clone: mutation({ description: "Clone a template into a new DRAFT copy (name suffixed _1, _2...). Uses GET upstream but creates a template.", input: Id }, async (_c, { id }) =>
          call("GET", `/api/1/templates/${encodeURIComponent(id)}/clone/`),
        ),
        submit: action("/api/1/templates/", "submit", "Submit a template to WhatsApp for approval."),
        backToDraft: action("/api/1/templates/", "back_to_draft", "Move a template back to Draft."),
        delete: mutation(
          {
            description:
              "Delete a template by id. Blocked with the list of automations when the template is used in automations, unless `force_delete` is true (deactivates those automation steps; needs access to every account using the template).",
            input: object({ id: string({ minLength: 1 }), force_delete: json().optional() }),
          },
          async (_c, { id, force_delete }) =>
            call("DELETE", `/api/1/templates/${encodeURIComponent(id)}/`, force_delete === true ? { force_delete: "true" } : undefined),
        ),
      },
      { title: "Templates", description: "WhatsApp message templates and their approval." },
    ),
    campaigns: router(
      {
        list: list("/api/1/campaigns/", "campaigns"),
        get: get("/api/1/campaigns/", "campaign"),
        create: create("/api/1/campaigns/", "a campaign", "name, scheduled_datetime (ISO 8601), status ('Scheduled'), automation (id), lists ([ids]), template (id)."),
        update: update("/api/1/campaigns/", "a campaign", "name, scheduled_datetime, status, automation, lists."),
        delete: remove("/api/1/campaigns/", "a campaign"),
      },
      { title: "Campaigns", description: "Scheduled broadcasts to lists." },
    ),
    automations: router(
      {
        list: list("/api/1/automations/", "automations"),
        get: get("/api/1/automations/", "automation"),
        create: create("/api/1/automations/", "an automation", "see Spoki's docs."),
        customFieldsUsed: query({ description: "List the custom fields an automation uses.", input: Id }, async (_c, { id }) =>
          call("GET", `/api/1/automations/${encodeURIComponent(id)}/custom-fields-used/`),
        ),
      },
      { title: "Automations", description: "Automation flows (read and create). Triggering one uses a per-automation webhook secret and is not covered." },
    ),
    tickets: router(
      {
        list: list("/api/1/tickets/", "tickets"),
        get: get("/api/1/tickets/", "ticket"),
        create: create("/api/1/tickets/", "a ticket", "contact_phone, title, status ('Open'), priority ('Medium'), description, reference."),
        update: update("/api/1/tickets/", "a ticket", "contact_phone, title, status, priority, description, reference."),
        delete: remove("/api/1/tickets/", "a ticket"),
      },
      { title: "Tickets", description: "Support tickets linked to contacts." },
    ),
    media: router(
      {
        list: list("/api/1/media/", "media files"),
        get: get("/api/1/media/", "media file"),
        create: create("/api/1/media/", "a media entry from an external URL", "title, external_url, format_type ('image', 'video', 'document'), content_type (MIME type)."),
        update: update("/api/1/media/", "a media entry", "title."),
        delete: remove("/api/1/media/", "a media entry"),
      },
      { title: "Media", description: "Media library." },
    ),
    channels: router(
      {
        list: list("/api/1/channel/", "channels"),
        get: get("/api/1/channel/", "channel"),
        create: create("/api/1/channel/", "a channel", "platform (integer), name, is_primary, identifier (phone number)."),
        rename: update("/api/1/channel/", "a channel (rename)", "name."),
        setPrimary: action("/api/1/channel/", "set-primary", "Make a channel the account's primary one."),
        refreshWhatsappStatus: action("/api/1/channel/", "refresh-wa-status", "Refresh the WhatsApp phone status of a channel."),
        lookupByPhone: query(
          { description: "Look up a channel by phone number or identifier.", input: object({ identifier: string({ minLength: 1 }) }) },
          async (_c, { identifier }) => call("GET", `/api/1/channel/phone/${encodeURIComponent(identifier)}/`),
        ),
        serviceMessageAllowance: query(
          { description: "List the free service message allowance of every channel.", input: object({}) },
          async () => call("GET", "/api/1/channel/service-message-allowance/"),
        ),
        channelServiceMessageAllowance: query(
          { description: "Retrieve the free service message allowance of one channel.", input: Id },
          async (_c, { id }) => call("GET", `/api/1/channel/${encodeURIComponent(id)}/service-message-allowance/`),
        ),
      },
      { title: "Channels", description: "WhatsApp, SMS and voice channels." },
    ),
    accounts: router(
      {
        list: list("/api/1/accounts/", "accounts the key can see"),
        get: get("/api/1/accounts/", "account"),
        getByPhone: query(
          { description: "Retrieve an account by phone number.", input: object({ phone: string({ minLength: 1 }) }) },
          async (_c, { phone }) => call("GET", `/api/1/accounts/phone/${encodeURIComponent(phone)}/`),
        ),
        createOnboardingLink: action("/api/1/accounts/", "onboarding", "Create an onboarding link for an account."),
        listAgencies: list("/api/1/agencies/", "agencies"),
        getAgency: get("/api/1/agencies/", "agency"),
      },
      { title: "Accounts", description: "Accounts and agencies." },
    ),
    team: router(
      {
        listRoles: list("/api/1/roles/", "roles (team members)"),
        getRole: get("/api/1/roles/", "role"),
        updateRole: actionBody("/api/1/roles/", "update_role", "Change a role. `body` is { role }, for example 'Administrator' or 'Chat Operator'."),
        deleteRole: remove("/api/1/roles/", "a role"),
        listInvitations: list("/api/1/invitations/", "invitations"),
        getInvitation: get("/api/1/invitations/", "invitation"),
        invite: create("/api/1/invitations/", "an invitation by email", "email, role, additional_info: {first_name, last_name}."),
        resendInvitation: action("/api/1/invitations/", "send", "Resend an invitation email."),
        updateInvitationRole: actionBody("/api/1/invitations/", "update_role", "Change an invitation's role. `body` is { role }."),
        deleteInvitation: remove("/api/1/invitations/", "an invitation"),
      },
      { title: "Team", description: "Roles and invitations." },
    ),
    webhooks: router(
      {
        list: list("/api/1/external-webhooks/", "webhooks"),
        get: get("/api/1/external-webhooks/", "webhook"),
        create: create("/api/1/external-webhooks/", "a webhook", "event, version (1 or 2), url, is_active."),
        update: update("/api/1/external-webhooks/", "a webhook", "event, version, url, is_active."),
        delete: remove("/api/1/external-webhooks/", "a webhook"),
        getExpands: query({ description: "Get the related objects a webhook expands in its payload.", input: Id }, async (_c, { id }) =>
          call("GET", `/api/1/external-webhooks/${encodeURIComponent(id)}/expands/`),
        ),
        setExpands: actionBody("/api/1/external-webhooks/", "expands", "Set the expanded objects. `body` is { expands: ['contact', 'tag_set'] }."),
        test: action("/api/1/external-webhooks/", "test", "Send a test delivery to a webhook."),
        rotateSecret: action("/api/1/external-webhooks/", "rotate_secret", "Rotate a webhook's signing secret."),
      },
      { title: "Webhooks", description: "Outgoing event webhooks." },
    ),
    partners: router(
      {
        list: list("/api/1/partners/", "partners"),
        accounts: query({ description: `List the accounts associated with the partner.${filtersDescription}`, input: Filters }, async (_c, { filters }) =>
          call("GET", "/api/1/partners/accounts/", filters),
        ),
        accountReport: query(
          { description: "Report for one account. `filters` needs account_id, granularity, startDate and endDate (YYYY-MM-DD).", input: Filters },
          async (_c, { filters }) => call("GET", "/api/1/partners/get_account_report/", filters),
        ),
        accountForecasts: query(
          { description: "Forecasts for one account. `filters` needs account_id and country_code.", input: Filters },
          async (_c, { filters }) => call("GET", "/api/1/partners/get_account_forecasts/", filters),
        ),
        createOnboardingLink: create("/api/1/partners/onboarding/", "a partner onboarding link", "see Spoki's docs."),
        createApiKeyForAccount: create("/api/1/partners/create_api_key_for_account/", "an API key for a partner's account", "account id."),
        revokeApiKeyForAccount: create("/api/1/partners/revoke_api_key_for_account/", "a revocation of a partner account's API key", "account id."),
      },
      { title: "Partners", description: "Partner-level endpoints; they require a partner API key." },
    ),
  });
}

export default defineApp(
  { user: { accounts: { spoki: spoki.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.spoki ?? [],
        (account) =>
          withApprovals(build(client(account.fields.token, fetch, signal)), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Spoki",
        description: "Send WhatsApp messages and templates and manage contacts, lists, campaigns, automations, tickets, channels and webhooks in Spoki.",
        icons,
      },
    ),
  }),
);
