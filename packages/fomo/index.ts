import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  json,
  jsonSchema,
  mutation,
  number,
  object,
  query,
  router,
  secrets,
  string,
  withApprovals,
  array,
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const base = "https://api.fomo.com/api/v1/applications/me";

const fomo = defineProvider({
  name: "Fomo",
  hosts: ["api.fomo.com"],
  auth: {
    apiKey: secrets({
      label: "Site auth token",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // Fomo has no current-user endpoint; listing one event checks the token. Only the status matters.
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/events?per=1&page=1`, {
      signal,
      headers: { Authorization: `Token ${account.fields.token}` },
    });
    if (!response.ok) throw new Error(`Fomo rejected the auth token (${response.status})`);
  },
});

type Fetch = typeof fetch;

function client(token: string, fetcher: Fetch, signal: AbortSignal | undefined) {
  return async (method: string, path: string, body?: unknown) => {
    const response = await fetcher(`${base}${path}`, {
      method,
      signal,
      headers: {
        Authorization: `Token ${token}`,
        Accept: "application/json",
        ...(body === undefined ? {} : { "Content-Type": "application/json" }),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    if (response.status === 204) return { ok: true };
    return decodeJson(response, json());
  };
}

const seg = encodeURIComponent;
// Event ids may be integers or strings in responses; accept both and put them in the path as text.
const id = () => jsonSchema({ anyOf: [{ type: "integer" }, { type: "string", minLength: 1 }] });

const eventFields = {
  event_type_id: string().optional(),
  event_type_tag: string().optional(),
  url: string().optional(),
  first_name: string().optional(),
  email_address: string().optional(),
  ip_address: string().optional(),
  city: string().optional(),
  province: string().optional(),
  country: string().optional(),
  title: string().optional(),
  image_url: string().optional(),
  custom_event_fields_attributes: array(object({ key: string({ minLength: 1 }), value: string() })).optional(),
};
const eventDoc =
  "Text fields are at most 255 characters. country is an ISO 3166-1 alpha-2 code. custom_event_fields_attributes is a list of {key, value} pairs available to the notification template.";

function strip(fields: Record<string, unknown>) {
  return Object.fromEntries(Object.entries(fields).filter(([, v]) => v !== undefined));
}

function build(call: ReturnType<typeof client>) {
  return router({
    listEvents: query(
      {
        description: "List the site's events (the data behind social proof notifications), newest first. Paginated with per (page size, default 30) and page (default 1). Set showMeta to include metadata.",
        input: object({ per: number().optional(), page: number().optional(), showMeta: string().optional() }),
      },
      (_c, { per, page, showMeta }) => {
        const params = new URLSearchParams({ per: String(per ?? 30), page: String(page ?? 1) });
        if (showMeta === "true") params.set("show_meta", "true");
        return call("GET", `/events?${params}`);
      },
    ),
    getEvent: query({ description: "Get one event by id.", input: object({ id: id() }) }, (_c, { id: i }) =>
      call("GET", `/events/${seg(String(i))}`),
    ),
    createEvent: mutation(
      {
        description: `Create an event, which Fomo shows as a notification. Give event_type_id or event_type_tag (the template's tag in the Fomo dashboard under Templates) and url (where a click on the notification goes). ${eventDoc}`,
        input: object(eventFields),
      },
      (_c, args) => call("POST", "/events", { event: strip(args) }),
    ),
    updateEvent: mutation(
      {
        description: `Update an event by id; only the fields you give change. ${eventDoc}`,
        input: object({ id: id(), ...eventFields }),
      },
      (_c, { id: i, ...rest }) => call("PATCH", `/events/${seg(String(i))}`, { event: strip(rest) }),
    ),
    deleteEvent: mutation({ description: "Delete an event by id.", input: object({ id: id() }) }, (_c, { id: i }) =>
      call("DELETE", `/events/${seg(String(i))}`),
    ),
  });
}

export default defineApp(
  { user: { accounts: { fomo: fomo.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.fomo ?? [],
        (account) =>
          withApprovals(build(client(account.fields.token, fetch, signal)), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Fomo",
        description: "Manage Fomo social proof notification events: list, create, update and delete.",
        icons,
      },
    ),
  }),
);
