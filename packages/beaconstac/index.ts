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
  record,
  router,
  secrets,
  string,
  withApprovals,
  type Schema,
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const base = "https://api.uniqode.com";

const beaconstac = defineProvider({
  name: "Beaconstac",
  hosts: ["api.uniqode.com"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/api/2.0/organizations/`, {
      signal,
      headers: { Authorization: `Token ${account.fields.token}`, Accept: "application/json" },
    });
    await decodeJson(response, object({}));
  },
});

type Fetch = typeof fetch;
type Method = "GET" | "POST" | "PUT" | "DELETE";

function client(token: string, fetcher: Fetch, signal: AbortSignal | undefined) {
  return async (method: Method, path: string, search: Record<string, string>, body: unknown) => {
    const url = new URL(`${base}${path}`);
    for (const [key, value] of Object.entries(search)) url.searchParams.set(key, value);
    const hasBody = body !== undefined && method !== "GET" && method !== "DELETE";
    const response = await fetcher(url.toString(), {
      method,
      signal,
      headers: {
        Authorization: `Token ${token}`,
        Accept: "application/json",
        ...(hasBody ? { "Content-Type": "application/json" } : {}),
      },
      ...(hasBody ? { body: JSON.stringify(body) } : {}),
    });
    if (response.status === 204) return { ok: true };
    if (method === "DELETE" && response.ok) {
      const text = await response.text();
      return text === "" ? { ok: true } : JSON.parse(text);
    }
    return decodeJson(response, json());
  };
}

type Call = ReturnType<typeof client>;

const queryField = record(json()).optional();
const bodyField = json().optional();

/**
 * One endpoint. `{name}` segments in the path become required numeric inputs (all Uniqode ids are integers).
 */
function endpoint(
  call: Call,
  method: Method,
  path: string,
  description: string,
  options: { body?: boolean; read?: boolean } = {},
) {
  const params = [...path.matchAll(/\{(\w+)\}/g)].map((match) => match[1]!);
  const fields: Record<string, Schema<unknown, boolean>> = {};
  for (const name of params) fields[name] = number();
  fields.query = queryField;
  if (options.body ?? (method === "POST" || method === "PUT")) fields.body = bodyField;
  const input = object(fields);
  const run = async (_ctx: unknown, args: Record<string, unknown>) => {
    const resolved = path.replace(/\{(\w+)\}/g, (_m, name: string) => String(args[name]));
    const search: Record<string, string> = {};
    for (const [key, value] of Object.entries((args.query as Record<string, unknown> | undefined) ?? {})) {
      if (value === null || value === undefined) continue;
      search[key] = typeof value === "string" ? value : JSON.stringify(value);
    }
    return call(method, resolved, search, args.body);
  };
  const options2 = { description, input };
  return method === "GET" || options.read
    ? query(options2, run as never)
    : mutation(options2, run as never);
}

function build(call: Call) {
  const e = (method: Method, path: string, description: string, options?: { body?: boolean; read?: boolean }) =>
    endpoint(call, method, path, description, options);
  return router({
    qrCodes: router(
      {
        list: e("GET", "/api/2.0/qrcodes/", "List QR codes in the account. Query supports page, page_size, organization, name__icontains, campaign__content_type, state and more."),
        get: e("GET", "/api/2.0/qrcodes/{id}/", "Retrieve one QR code with its campaign, attributes and short URL."),
        create: e(
          "POST",
          "/api/2.0/qrcodes/",
          "Create a QR code. Body: {name, organization, qr_type (1 static, 2 dynamic), campaign: {content_type, ...fields}, location_enabled, attributes (design: color, frameText, logoImage, dataPattern...)}. content_type values: 1 custom URL, 2 phone call, 3 SMS, 4 email, 5 vCard, 6 text, 7 WiFi, 13 website, among others; the campaign fields depend on content_type (custom URL uses custom_url).",
        ),
        update: e("PUT", "/api/2.0/qrcodes/{id}/", "Update a QR code. Send the complete QR code body, as in create."),
        delete: e("DELETE", "/api/2.0/qrcodes/{id}/", "Delete a QR code permanently."),
        activate: e("PUT", "/api/2.0/qrcodes/{id}/activate/", "Activate a QR code so scans resolve to its campaign.", { body: false }),
        deactivate: e("DELETE", "/api/2.0/qrcodes/{id}/activate/", "Deactivate a QR code so scans no longer resolve."),
      },
      { title: "QR codes", description: "Create, update, download, activate and delete QR codes." },
    ),
    qrTemplates: router(
      {
        list: e("GET", "/api/2.0/qrtemplates/", "List QR code design templates."),
        get: e("GET", "/api/2.0/qrtemplates/{id}/", "Retrieve one QR code template."),
        create: e("POST", "/api/2.0/qrtemplates/", "Create a QR code design template. Body: {name, organization, attributes}."),
        update: e("PUT", "/api/2.0/qrtemplates/{id}/", "Update a QR code template."),
        delete: e("DELETE", "/api/2.0/qrtemplates/{id}/", "Delete a QR code template."),
      },
      { title: "QR templates", description: "Reusable QR code designs." },
    ),
    bulkQrCodes: router(
      {
        list: e("GET", "/api/2.0/bulkqrcodes/", "List bulk QR code collections."),
        get: e("GET", "/api/2.0/bulkqrcodes/{id}/", "Retrieve one bulk QR code collection."),
        create: e("POST", "/api/2.0/bulkqrcodes/", "Create a bulk QR code collection."),
        update: e("PUT", "/api/2.0/bulkqrcodes/{id}/", "Update a bulk QR code collection."),
      },
      { title: "Bulk QR codes", description: "Collections of QR codes generated in bulk. File-upload (CSV) endpoints are not exposed." },
    ),
    cards: router(
      {
        list: e("GET", "/api/2.0/dbc/", "List digital business cards. Query: organization (required), page, page_size, state, card_owner__is."),
        get: e("GET", "/api/2.0/dbc/{id}/", "Retrieve a digital business card. Query: organization (required)."),
        create: e("POST", "/api/2.0/dbc/", "Create a digital business card. Query: organization (required). Body is the card definition."),
        update: e("PUT", "/api/2.0/dbc/{id}/", "Update a digital business card. Query: organization (required)."),
        delete: e("DELETE", "/api/2.0/dbc/{id}/", "Delete a digital business card. Query: organization (required)."),
        activate: e("PUT", "/api/2.0/dbc/{id}/activate/", "Activate a card. Query: organization (required).", { body: false }),
        deactivate: e("DELETE", "/api/2.0/dbc/{id}/activate/", "Deactivate a card. Query: organization (required)."),
        listTemplates: e("GET", "/api/2.0/dbc/templates/", "List card templates. Query: organization (required), page, page_size."),
        listWalletPasses: e("GET", "/api/2.0/dbc/{id}/walletpass/", "List wallet passes of a card. Query: organization (required)."),
        createWalletPass: e("POST", "/api/2.0/dbc/{id}/walletpass/", "Create a wallet pass for a card. Query: organization (required)."),
      },
      { title: "Digital business cards", description: "Manage digital business cards and their wallet passes." },
    ),
    leads: router(
      {
        list: e("GET", "/api/2.0/lead/", "List leads collected through cards and QR codes."),
        delete: e("DELETE", "/api/2.0/lead/{id}/", "Delete a lead."),
        export: e("POST", "/api/2.0/lead/export/", "Request an export of leads. Body: filter fields such as organization and a date range."),
      },
      { title: "Leads", description: "Leads captured by Uniqode campaigns." },
    ),
    forms: router(
      {
        list: e("GET", "/api/2.0/forms/", "List forms."),
        get: e("GET", "/api/2.0/forms/{id}/", "Retrieve a form."),
        create: e("POST", "/api/2.0/forms/", "Create a form."),
        update: e("PUT", "/api/2.0/forms/{id}/", "Update a form."),
        responses: e(
          "GET",
          "/api/2.0/forms/{id}/responses/",
          "Fetch form responses. Query: organization (required), page_size, since and until (epoch milliseconds), timezone.",
        ),
      },
      { title: "Forms", description: "Feedback forms and their responses." },
    ),
    places: router(
      {
        list: e("GET", "/api/2.0/places/", "List places (physical locations)."),
        get: e("GET", "/api/2.0/places/{id}/", "Retrieve a place."),
        create: e("POST", "/api/2.0/places/", "Create a place."),
        update: e("PUT", "/api/2.0/places/{id}/", "Update a place."),
      },
      { title: "Places", description: "Physical locations used for location-aware QR codes." },
    ),
    tags: router(
      {
        list: e("GET", "/api/2.0/tags/", "List tags. Query: name__icontains to search."),
        get: e("GET", "/api/2.0/tags/{id}/", "Retrieve a tag."),
        create: e("POST", "/api/2.0/tags/", "Create a tag. Body: {name}."),
        update: e("PUT", "/api/2.0/tags/{id}/", "Rename a tag. Body: {name}."),
        delete: e("DELETE", "/api/2.0/tags/{id}/", "Delete a tag."),
      },
      { title: "Tags", description: "Labels for organizing QR codes." },
    ),
    media: router(
      {
        list: e("GET", "/api/2.0/media/", "List media objects."),
        get: e("GET", "/api/2.0/media/{id}/", "Retrieve a media object."),
        create: e("POST", "/api/2.0/media/", "Create a media object from JSON metadata (binary upload is not supported here)."),
        update: e("PUT", "/api/2.0/media/{id}/", "Update a media object."),
      },
      { title: "Media", description: "Media library objects." },
    ),
    webhooks: router(
      {
        list: e("GET", "/api/2.0/organizationwebhooks/", "List organization webhooks."),
        get: e("GET", "/api/2.0/organizationwebhooks/{id}/", "Retrieve a webhook."),
        create: e("POST", "/api/2.0/organizationwebhooks/", "Create a webhook. Body: {organization, url, event types}."),
        update: e("PUT", "/api/2.0/organizationwebhooks/{id}/", "Update a webhook."),
      },
      { title: "Webhooks", description: "Organization webhooks for scan and lead events." },
    ),
    organizations: router(
      {
        list: e("GET", "/api/2.0/organizations/", "List organizations associated with the account. Use the id for organization inputs."),
        get: e("GET", "/api/2.0/organizations/{id}/", "Retrieve an organization."),
        create: e("POST", "/api/2.0/organizations/", "Create a child organization."),
        update: e("PUT", "/api/2.0/organizations/{id}/", "Update an organization."),
        counts: e("GET", "/api/2.0/organizations/{id}/counts/", "Count of QR codes, cards and other objects in an organization."),
      },
      { title: "Organizations", description: "Organizations and child organizations." },
    ),
    users: router(
      {
        list: e("GET", "/api/2.0/users/", "List users."),
        get: e("GET", "/api/2.0/users/{id}/", "Retrieve a user."),
        create: e("POST", "/api/2.0/users/add/", "Create a user. Body: {email, first_name, last_name, organization, role}."),
        update: e("PUT", "/api/2.0/users/{id}/", "Update a user."),
      },
      { title: "Users", description: "Account users." },
    ),
    analytics: router(
      {
        periodOverview: e(
          "POST",
          "/reporting/2.0/?method=Products.getPeriodOverview",
          "Period overview analytics for a product type. Query: organization (required). Body: {product_type, from, to} where from and to are epoch milliseconds as strings.",
          { read: true },
        ),
        productOverview: e(
          "POST",
          "/reporting/2.0/?method=Products.getOverview",
          "Overview analytics for a product type. Query: organization (required). Body: {product_type, from, to} where from and to are epoch milliseconds as strings.",
          { read: true },
        ),
      },
      { title: "Analytics", description: "Reporting API overviews. These are read-only POST requests." },
    ),
  });
}

export default defineApp(
  { user: { accounts: { beaconstac: beaconstac.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.beaconstac ?? [],
        (account) =>
          withApprovals(build(client(account.fields.token, fetch, signal)), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Beaconstac",
        description:
          "Uniqode (formerly Beaconstac): create and manage dynamic QR codes, digital business cards, forms, places, tags, leads, webhooks and scan analytics.",
        icons,
      },
    ),
  }),
);
