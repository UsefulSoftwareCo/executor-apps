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
  record,
  router,
  secrets,
  string,
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const base = "https://amcards.com/.api/v1";

const amcards = defineProvider({
  name: "Amcards",
  hosts: ["amcards.com"],
  auth: {
    apiKey: secrets({
      label: "API access token",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/user/`, {
      signal,
      headers: { Authorization: `Token ${account.fields.token}`, Accept: "application/json" },
    });
    await decodeJson(response, object({ meta: object({}), objects: array(object({})) }));
  },
});

type Fetch = typeof fetch;
type Params = Record<string, string | number | boolean | undefined>;

function client(token: string, fetcher: Fetch, signal: AbortSignal | undefined) {
  return async (method: string, path: string, params: Params = {}, body?: unknown) => {
    const url = new URL(`${base}${path}`);
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) url.searchParams.set(key, String(value));
    }
    const response = await fetcher(url.toString(), {
      method,
      signal,
      headers: {
        Authorization: `Token ${token}`,
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
const idInput = object({ id: number() });
const listInput = object({
  limit: number().optional(),
  offset: number().optional(),
  filters: record(string()).optional(),
});
const filterDoc =
  'Optional filters keyed by Tastypie lookups, for example {"first_name__icontains": "Ann", "email": "a@b.com"}.';

function build(call: Call) {
  const list = (resource: string, description: string) =>
    query({ description: `${description} ${filterDoc}`, input: listInput }, (_c, { limit, offset, filters }) =>
      call("GET", `/${resource}/`, { limit, offset, ...(filters ?? {}) }),
    );
  const get = (resource: string, description: string) =>
    query({ description, input: idInput }, (_c, { id }) => call("GET", `/${resource}/${seg(String(id))}/`));
  const create = (resource: string, description: string) =>
    mutation(
      { description: `${description} Body is the JSON resource as defined by /${resource}/schema/.`, input: object({ body: json() }) },
      (_c, { body }) => call("POST", `/${resource}/`, {}, body),
    );
  const update = (resource: string, description: string) =>
    mutation(
      { description: `${description} Body holds the fields to change.`, input: object({ id: number(), body: json() }) },
      (_c, { id, body }) => call("PATCH", `/${resource}/${seg(String(id))}/`, {}, body),
    );
  const remove = (resource: string, description: string) =>
    mutation({ description, input: idInput }, (_c, { id }) => call("DELETE", `/${resource}/${seg(String(id))}/`));
  const schema = (resource: string) =>
    query({ description: `Get the field schema and allowed methods of the ${resource} resource.`, input: object({}) }, () =>
      call("GET", `/${resource}/schema/`),
    );

  return {
    user: router({
      list: list("user", "List the authenticated AMcards user and account details."),
      get: get("user", "Get a user by id."),
    }),
    contacts: router({
      list: list("contact", "List contacts (address book)."),
      get: get("contact", "Get a contact by id."),
      create: create("contact", "Create a contact."),
      update: update("contact", "Update a contact."),
      delete: remove("contact", "Delete a contact."),
      schema: schema("contact"),
    }),
    groups: router({
      list: list("group", "List contact groups."),
      get: get("group", "Get a contact group by id."),
      create: create("group", "Create a contact group."),
      update: update("group", "Update a contact group."),
      delete: remove("group", "Delete a contact group."),
    }),
    cards: router({
      list: list("card", "List cards on the account."),
      get: get("card", "Get a card by id."),
      create: create("card", "Create a card."),
      update: update("card", "Update a card."),
      delete: remove("card", "Delete a card."),
      schema: schema("card"),
    }),
    mailings: router({
      list: list("mailing", "List mailings (cards queued or sent to recipients)."),
      get: get("mailing", "Get a mailing by id."),
      create: create("mailing", "Create a mailing, which sends a card to a recipient."),
      schema: schema("mailing"),
    }),
    campaigns: router({
      list: list("campaign", "List campaigns."),
      get: get("campaign", "Get a campaign by id."),
      create: create("campaign", "Create a campaign."),
      update: update("campaign", "Update a campaign."),
      schema: schema("campaign"),
    }),
    templates: router({
      list: list("template", "List the account's card templates."),
      get: get("template", "Get a template by id."),
      listPublic: list("publictemplate", "List AMcards' public template library (filter by category, name__icontains)."),
      getPublic: get("publictemplate", "Get a public template by id."),
      listQuickSend: list("quicksendtemplate", "List quick-send templates."),
      getQuickSend: get("quicksendtemplate", "Get a quick-send template by id."),
    }),
    catalog: router({
      listCategories: list("category", "List template categories."),
      getCategory: get("category", "Get a template category by id."),
      listGifts: list("gift", "List gifts that can be attached to cards."),
      getGift: get("gift", "Get a gift by id."),
      listGiftRelationships: list("giftrelationship", "List gift relationships."),
    }),
    billing: router({
      listCreditTransactions: list("credittransaction", "List credit transactions."),
      listPaymentMethods: list("paymentmethod", "List saved payment methods."),
    }),
    media: router({
      listPhotos: list("photo", "List uploaded photos."),
      listVectors: list("vector", "List vector images."),
    }),
  };
}

export default defineApp(
  { user: { accounts: { amcards: amcards.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.amcards ?? [],
        (account) =>
          withApprovals(router(build(client(account.fields.token, fetch, signal))), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Amcards",
        description: "Contacts, groups, cards, mailings, campaigns, templates and gifts in AMcards.",
        icons,
      },
    ),
  }),
);
