import {
  accountRouter,
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
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const base = "https://connect.enginemailer.com/api/N8N/v1";

const enginemailer = defineProvider({
  name: "Enginemailer",
  hosts: ["connect.enginemailer.com"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // The connect endpoint only validates the API key.
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/connect`, {
      signal,
      headers: { APIKEY: account.fields.token, Accept: "application/json" },
    });
    if (!response.ok) throw new Error(`Enginemailer rejected the API key (HTTP ${response.status})`);
  },
});

type Account = { fields: { token: string } };

const headers = (account: Account) => ({
  APIKEY: account.fields.token,
  Accept: "application/json",
  "Content-Type": "application/json",
});

const search = (params: Record<string, string | number | undefined>) => {
  const out = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) if (value !== undefined) out.set(key, String(value));
  const text = out.toString();
  return text === "" ? "" : `?${text}`;
};

const tools = (account: Account, signal: AbortSignal) => {
  const list = (path: string, description: string) =>
    query(
      { description, input: object({}) },
      async ({ fetch }) => decodeJson(await fetch(`${base}/${path}`, { signal, headers: headers(account) }), json()),
    );

  const poll = (path: string, description: string) =>
    query(
      {
        description: `${description} limit defaults to 50. lastpollingdate is an ISO date-time; only records after it are returned.`,
        input: object({
          limit: number().optional(),
          lastpollingdate: string().optional(),
          filter_subcategory: number().optional(),
          filter_autoresponder: number().optional(),
        }),
      },
      async ({ fetch }, input) =>
        decodeJson(await fetch(`${base}/${path}${search(input)}`, { signal, headers: headers(account) }), json()),
    );

  const send = async (
    fetch: typeof globalThis.fetch,
    path: string,
    body: Record<string, unknown>,
  ) =>
    decodeJson(
      await fetch(`${base}/${path}`, { method: "POST", signal, headers: headers(account), body: JSON.stringify(body) }),
      json(),
    );

  return router({
    subscribers: router(
      {
        find: mutation(
          {
            description: "Find a subscriber by email address and return its profile, subscriptions and custom fields. Read-only despite using POST.",
            input: object({ email: string() }),
            approval: always(),
          },
          async ({ fetch }, input) => send(fetch, "findsubscriber", input),
        ),
        addOrUpdate: mutation(
          {
            description:
              "Create a subscriber or update it if the email exists. updatetype is Overwrite, Append or Ignore and controls how existing subcategories and custom fields are merged. sourcetype, subcategories (names or ids) and customfields are optional; subcategories and customfields are passed through as given.",
            input: object({
              email: string(),
              updatetype: string(),
              sourcetype: string().optional(),
              subcategories: string().optional(),
              customfields: string().optional(),
            }),
            approval: always(),
          },
          async ({ fetch }, input) => send(fetch, "addupdatesubscriber", input),
        ),
        delete: mutation(
          { description: "Permanently delete a subscriber by email address.", input: object({ email: string() }), approval: always() },
          async ({ fetch }, input) => send(fetch, "deletesubscriber", input),
        ),
        deactivate: mutation(
          { description: "Unsubscribe (deactivate) a subscriber by email address.", input: object({ email: string() }), approval: always() },
          async ({ fetch }, input) => send(fetch, "unsubscribe", input),
        ),
        tag: mutation(
          {
            description: "Tag a subscriber into one or more subcategories. subcategories is the subcategory identifier(s) as a string, from subcategories.list.",
            input: object({ email: string(), subcategories: string() }),
            approval: always(),
          },
          async ({ fetch }, input) => send(fetch, "tagtosubcategory", input),
        ),
        untag: mutation(
          {
            description: "Remove a subscriber from one or more subcategories. subcategories is the subcategory identifier(s) as a string.",
            input: object({ email: string(), subcategories: string() }),
            approval: always(),
          },
          async ({ fetch }, input) => send(fetch, "untagtosubcategory", input),
        ),
        listNew: query(
          {
            description:
              "List newly added subscribers. Optionally filter by source, or by the form, page or popup id that captured them. limit defaults to 50; lastpollingdate is an ISO date-time.",
            input: object({
              source: string().optional(),
              limit: number().optional(),
              filter_form: number().optional(),
              filter_page: number().optional(),
              filter_popup: number().optional(),
              lastpollingdate: string().optional(),
            }),
          },
          async ({ fetch }, input) =>
            decodeJson(await fetch(`${base}/newsubscribers${search(input)}`, { signal, headers: headers(account) }), json()),
        ),
        listModified: poll("subscribersmodified", "List subscribers modified since a date."),
        listDeleted: poll("subscribersdeleted", "List subscribers deleted since a date."),
        listTagged: poll("subscriberstagged", "List subscribers tagged into a subcategory (filter_subcategory) since a date."),
        listUntagged: poll("subscribersuntagged", "List subscribers removed from a subcategory (filter_subcategory) since a date."),
        listUnsubscribed: query(
          {
            description:
              "List unsubscribe events, optionally filtered by campaign id (filter_campaign), autoresponder id (filter_autoresponder) or a free-text filter. limit defaults to 50; lastpollingdate is an ISO date-time.",
            input: object({
              limit: number().optional(),
              filter: string().optional(),
              filter_campaign: number().optional(),
              filter_autoresponder: number().optional(),
              lastpollingdate: string().optional(),
            }),
          },
          async ({ fetch }, input) =>
            decodeJson(await fetch(`${base}/unsubscribe${search(input)}`, { signal, headers: headers(account) }), json()),
        ),
        autoresponderTriggered: poll("subscriberautorespondertriggered", "List subscribers who triggered an autoresponder (filter_autoresponder) since a date."),
        autoresponderCompleted: poll("subscriberautorespondercompleted", "List subscribers who completed an autoresponder (filter_autoresponder) since a date."),
      },
      { title: "Subscribers", description: "Find, add, update, delete, tag and poll subscribers." },
    ),
    email: router(
      {
        send: mutation(
          {
            description:
              "Send a transactional email to one recipient. type is expected to be Template (set template_id and substitution_tags) or HTML (set html); these values are inferred, the vendor does not document them. sender_email must be a verified sender (see domains.list). cc_emails is optional.",
            input: object({
              email: string(),
              type: string(),
              subject: string().optional(),
              sender_email: string().optional(),
              sender_name: string().optional(),
              html: string().optional(),
              template_id: string().optional(),
              substitution_tags: string().optional(),
              cc_emails: string().optional(),
            }),
            approval: always(),
          },
          async ({ fetch }, input) => send(fetch, "sendemail", input),
        ),
      },
      { title: "Email", description: "Send transactional email." },
    ),
    assets: router(
      {
        subcategories: list("listsubcategories", "List subcategories (tags) with their ids."),
        forms: list("listforms", "List sign-up forms."),
        pages: list("listpages", "List landing pages."),
        popups: list("listpopups", "List popups."),
        autoresponders: list("listautoresponders", "List autoresponders."),
        campaigns: list("listcampaigns", "List campaigns."),
        domains: list("listdomains", "List sender domains."),
        templates: list("listtemplates", "List email templates with their ids."),
      },
      { title: "Assets", description: "List forms, pages, popups, autoresponders, campaigns, domains, templates and subcategories." },
    ),
  });
};

export default defineApp({ user: { accounts: { enginemailer: enginemailer.many() } }, icons }, async ({ user, signal }) => ({
  tools: router(await accountRouter(user?.accounts.enginemailer ?? [], (account) => tools(account, signal), { signal }), {
    title: "Enginemailer",
    description: "Manage Enginemailer subscribers, tags, campaigns, forms and templates, and send transactional email.",
    icons,
  }),
}));
