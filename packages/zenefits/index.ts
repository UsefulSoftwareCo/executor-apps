import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  json,
  number,
  oauth2,
  object,
  query,
  router,
  string,
} from "apps";
import { icons } from "./icon.js";

const base = "https://api.trinet.com";

const zenefits = defineProvider({
  name: "Zenefits",
  hosts: ["api.trinet.com", "secure.trinet.com", "api.zenefits.com", "secure.zenefits.com"],
  auth: {
    // Client ID and secret are issued by TriNet to registered integration partners; redirect URIs are allowlisted by TriNet.
    oauth: oauth2({
      authorizationUrl: "https://secure.trinet.com/oauth2/platform-authorize/",
      tokenUrl: "https://secure.trinet.com/oauth2/token/",
      tokenEndpointAuthMethod: "client_secret_post",
      scopes: [
        "platform",
        "companies",
        "locations",
        "departments",
        "people",
        "people.work_email",
        "people.status",
        "people.location",
        "people.department",
        "people.manager",
        "employments",
        "employments.employment_type",
        "custom_fields",
        "people.custom_field_values",
        "time_off.vacation_requests",
        "time_off.vacation_types",
        // Sensitive scopes: TriNet reviews and must approve these per app.
        "banks",
        "company_banks",
      ],
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/core/me`, {
      signal,
      headers: { Authorization: `Bearer ${account.fields.access_token}` },
    });
    await decodeJson(response, object({}));
  },
});

type Params = Record<string, string | number | undefined>;

const enc = encodeURIComponent;
const id = string({ minLength: 1 });
const listShape = {
  limit: number().optional(),
  startingAfter: string().optional(),
  endingBefore: string().optional(),
  filters: json().optional(),
};
const List = object(listShape);

const pagingNote =
  "limit is 1-100 (default 20); pass startingAfter/endingBefore with an object id to page. The response has data.data (items) and data.next_url (null on the last page). filters is an object of extra query parameters such as includes=company or a results filter like company=<id>.";

function build(token: string, fetcher: typeof fetch, signal: AbortSignal | undefined) {
  const send = async (path: string, params: Params = {}) => {
    const url = new URL(`${base}${path}`);
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) url.searchParams.set(key, String(value));
    }
    const response = await fetcher(url.toString(), { signal, headers: { Authorization: `Bearer ${token}` } });
    if (!response.ok) {
      throw new Error(`Zenefits responded with HTTP ${response.status}: ${(await response.text()).slice(0, 500)}`);
    }
    return JSON.parse(await response.text()) as Record<string, unknown>;
  };
  const paging = (i: { limit?: number | undefined; startingAfter?: string | undefined; endingBefore?: string | undefined; filters?: unknown }): Params => ({
    ...((i.filters as Params | undefined) ?? {}),
    limit: i.limit,
    starting_after: i.startingAfter,
    ending_before: i.endingBefore,
  });
  const list = (path: string, noun: string, scopes: string) =>
    query({ description: `List ${noun}. Needs scope ${scopes}. ${pagingNote}`, input: List }, async (_c, i) => send(path, paging(i)));
  const get = (path: string, noun: string, scopes: string) =>
    query(
      {
        description: `Get one of ${noun} by id. Needs scope ${scopes}. filters may hold includes=<field> to expand references inline.`,
        input: object({ id, filters: json().optional() }),
      },
      async (_c, i) => send(`${path}/${enc(i.id)}`, (i.filters as Params | undefined) ?? {}),
    );
  const resource = (path: string, noun: string, scopes: string) =>
    router({ list: list(path, noun, scopes), get: get(path, noun, scopes) }, { title: noun, description: `Read ${noun}.` });
  return router({
    me: query(
      { description: "Get the currently authorized user, company, granted scopes and token expiry.", input: object({}) },
      async () => send("/core/me"),
    ),
    companies: resource("/core/companies", "companies", "companies"),
    people: resource("/core/people", "people (employees)", "people"),
    employments: resource("/core/employments", "employments (employment history)", "employments"),
    departments: resource("/core/departments", "departments", "departments"),
    locations: resource("/core/locations", "locations", "locations"),
    companyBanks: resource("/core/company_banks", "company bank accounts", "company_banks"),
    employeeBanks: resource("/core/banks", "employee bank accounts", "banks"),
    laborGroupTypes: resource("/core/labor_group_types", "labor group types", "people"),
    laborGroups: resource("/core/labor_groups", "labor groups", "people"),
    customFields: resource("/core/custom_fields", "custom field definitions", "custom_fields"),
    customFieldValues: resource("/core/custom_field_values", "custom field values (people's answers)", "people.custom_field_values"),
    vacationRequests: router({ list: list("/time_off/vacation_requests", "PTO vacation requests", "time_off.vacation_requests") }, { title: "Vacation requests", description: "Read PTO vacation requests." }),
    vacationTypes: router({ list: list("/time_off/vacation_types", "PTO vacation types", "time_off.vacation_types") }, { title: "Vacation types", description: "Read PTO vacation types." }),
    platform: router(
      {
        applications: query(
          { description: `List the integration applications registered by this developer. ${pagingNote}`, input: List },
          async (_c, i) => send("/platform/applications", paging(i)),
        ),
        companyInstalls: query(
          { description: `List companies that installed the application. ${pagingNote}`, input: List },
          async (_c, i) => send("/platform/company_installs", paging(i)),
        ),
        flows: query(
          { description: `List flows (hiring, promotion, etc.) completed by people. ${pagingNote}`, input: List },
          async (_c, i) => send("/platform/flows", paging(i)),
        ),
      },
      { title: "Platform", description: "Application-level installation and flow data (read only)." },
    ),
  });
}

export default defineApp(
  { user: { accounts: { zenefits: zenefits.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(user?.accounts.zenefits ?? [], (account) => build(account.fields.access_token, fetch, signal), { signal }),
      {
        title: "Zenefits",
        description:
          "Read-only access to Zenefits (TriNet HR Platform) company, people, employments, departments, locations, bank accounts, custom fields, PTO requests and platform installs.",
        icons,
      },
    ),
  }),
);
