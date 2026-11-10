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
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const base = "https://www.provenexpert.com/api/v1";

const provenexpert = defineProvider({
  name: "ProvenExpert",
  hosts: ["www.provenexpert.com"],
  auth: {
    // ProvenExpert account > API: the API ID is the Basic username, the API key the password.
    apiKey: secrets({
      label: "API ID and key",
      fields: object({ apiId: string({ minLength: 1 }), apiKey: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/rating/summary/get`, {
      method: "POST",
      signal,
      headers: { Authorization: authorization(account.fields) },
    });
    await decodeJson(response, object({ status: string() }));
  },
});

function authorization(fields: { apiId: string; apiKey: string }) {
  return `Basic ${btoa(`${fields.apiId}:${fields.apiKey}`)}`;
}

type Fetch = typeof fetch;
type Json = unknown;

// The API takes PHP-style form fields: data[contact][city]=..., recipients[0][email]=...
function flatten(prefix: string, value: Json, out: URLSearchParams) {
  if (value === undefined || value === null) return;
  if (Array.isArray(value)) {
    value.forEach((item, index) => flatten(`${prefix}[${index}]`, item, out));
  } else if (typeof value === "object") {
    for (const [key, item] of Object.entries(value)) flatten(`${prefix}[${key}]`, item, out);
  } else {
    out.append(prefix, typeof value === "boolean" ? (value ? "1" : "0") : String(value));
  }
}

function client(fields: { apiId: string; apiKey: string }, fetcher: Fetch, signal: AbortSignal | undefined) {
  return {
    post: async (
      path: string,
      parts: { data?: Json; filter?: Json; limit?: number; offset?: number; proxyUser?: Json } = {},
    ) => {
      const body = new URLSearchParams();
      if (parts.data !== undefined) flatten("data", parts.data, body);
      if (parts.filter !== undefined) flatten("filter", parts.filter, body);
      if (parts.proxyUser !== undefined) flatten("proxyUser", parts.proxyUser, body);
      if (parts.limit !== undefined) body.set("limit", String(parts.limit));
      if (parts.offset !== undefined) body.set("offset", String(parts.offset));
      const response = await fetcher(`${base}/${path}`, {
        method: "POST",
        signal,
        headers: { Authorization: authorization(fields), "Content-Type": "application/x-www-form-urlencoded" },
        body,
      });
      return decodeJson(response, json());
    },
  };
}

const proxyUser = record(string()).optional();
const paging = { limit: number().optional(), offset: number().optional() };

function build(api: ReturnType<typeof client>) {
  return router({
    getRatingSummary: query(
      { description: "Get the average rating value and review count of the profile.", input: object({ proxyUser }) },
      async (_ctx, { proxyUser }) => api.post("rating/summary/get", { proxyUser }),
    ),
    getRatingSummaryChildren: query(
      { description: "Get rating value and review count for each next-level subprofile (Enterprise plan).", input: object({ proxyUser }) },
      async (_ctx, { proxyUser }) => api.post("rating/summary/children", { proxyUser }),
    ),
    getRichSnippet: query(
      {
        description:
          "Get the rating summary plus an HTML rich snippet (Google stars). version 1-4; colors are hex without #. Plus, Premium or Enterprise plan.",
        input: object({
          version: number().optional(),
          strokeColor: string().optional(),
          fillColor: string().optional(),
          fontColor: string().optional(),
          proxyUser,
        }),
      },
      async (_ctx, { proxyUser, ...data }) => api.post("rating/summary/richsnippet", { data, proxyUser }),
    ),
    listSurveys: query(
      { description: "List surveys (code, name, url, qr, active, pos). Plus, Premium or Enterprise plan.", input: object({ proxyUser, ...paging }) },
      async (_ctx, { proxyUser, limit, offset }) => api.post("survey/get", { proxyUser, limit, offset }),
    ),
    createSurvey: mutation(
      {
        description:
          "Create a survey. data accepts name (required), pos (0/1), posLabel, posLogoUrl, posLogoBase64. Enterprise plan.",
        input: object({ data: record(json()), proxyUser }),
      },
      async (_ctx, { data, proxyUser }) => api.post("survey/create", { data, proxyUser }),
    ),
    updateSurvey: mutation(
      {
        description: "Update a survey by code. data accepts active (0/1), posLabel, posLogoUrl, posLogoBase64. Enterprise plan.",
        input: object({ code: string({ minLength: 1 }), data: record(json()), proxyUser }),
      },
      async (_ctx, { code, data, proxyUser }) => api.post("survey/update", { filter: { code }, data, proxyUser }),
    ),
    createInviteUrl: mutation(
      {
        description: "Create a personalized rating link for a survey code and customer email (optional name). Plus, Premium or Enterprise plan.",
        input: object({ code: string({ minLength: 1 }), email: string({ minLength: 1 }), name: string().optional(), proxyUser }),
      },
      async (_ctx, { proxyUser, ...data }) => api.post("invite/url/create", { data, proxyUser }),
    ),
    listInviteUrls: query(
      {
        description: "List invitation links of a survey code with created, rated and used status.",
        input: object({ code: string({ minLength: 1 }), proxyUser, ...paging }),
      },
      async (_ctx, { code, proxyUser, limit, offset }) => api.post("invite/url/get", { data: { code }, proxyUser, limit, offset }),
    ),
    sendInviteMails: mutation(
      {
        description:
          "Send rating invitation emails. data: code (required), recipients (array of up to 100 objects with email and optional name, subject, salutation, text, reminderSubject, reminderSalutation, reminderText), reminder (0/1), locale. Only email customers who opted in. Returns a mailing id.",
        input: object({ data: record(json()), proxyUser }),
      },
      async (_ctx, { data, proxyUser }) => api.post("invite/mail/create", { data, proxyUser }),
    ),
    getInviteMailStatus: query(
      {
        description: "Get the delivery status of an invitation mailing by its mailing id.",
        input: object({ id: string({ minLength: 1 }), proxyUser }),
      },
      async (_ctx, { id, proxyUser }) => api.post("invite/mail/status", { data: { id }, proxyUser }),
    ),
    createWidget: mutation(
      {
        description:
          "Generate the HTML for a seal or widget. data: type (portrait, square, landscape, circle, logo, bar, landing, awards), width, and type-specific options (feedback, slider, fixed, origin, position, side, viewport, style, avatar, competence).",
        input: object({ data: record(json()), proxyUser }),
      },
      async (_ctx, { data, proxyUser }) => api.post("widget/create", { data, proxyUser }),
    ),
    getProfile: query(
      { description: "Get the profile of the account (Enterprise plan).", input: object({ proxyUser }) },
      async (_ctx, { proxyUser }) => api.post("profile/get", { proxyUser }),
    ),
    listChildProfiles: query(
      { description: "List next-level subprofiles (Enterprise plan).", input: object({ proxyUser, ...paging }) },
      async (_ctx, { proxyUser, limit, offset }) => api.post("profile/children", { proxyUser, limit, offset }),
    ),
    createProfile: mutation(
      {
        description:
          "Create a subprofile (Enterprise plan). data: email (required) plus company, or firstname and lastname; optional password, description, about, tags, avatarUrl, public, imprint, externalData, contact, websites, social, openingHours.",
        input: object({ data: record(json()), proxyUser }),
      },
      async (_ctx, { data, proxyUser }) => api.post("profile/create", { data, proxyUser }),
    ),
    updateProfile: mutation(
      {
        description: "Update a profile (Enterprise plan). Same fields as createProfile; an empty string clears a field.",
        input: object({ data: record(json()), proxyUser }),
      },
      async (_ctx, { data, proxyUser }) => api.post("profile/update", { data, proxyUser }),
    ),
    getProfileSettings: query(
      { description: "Get privacy, notification and mail settings of a profile (Enterprise plan).", input: object({ proxyUser }) },
      async (_ctx, { proxyUser }) => api.post("profile/settings/get", { proxyUser }),
    ),
    updateProfileSettings: mutation(
      {
        description: "Update profile settings (Enterprise plan), e.g. { public: 1, mails: { reporting: 0 } }.",
        input: object({ data: record(json()), proxyUser }),
      },
      async (_ctx, { data, proxyUser }) => api.post("profile/settings/update", { data, proxyUser }),
    ),
    getLoginUrl: mutation(
      { description: "Get a single sign-on login link for the profile, valid about 10 minutes (Enterprise plan).", input: object({ proxyUser }) },
      async (_ctx, { proxyUser }) => api.post("auth/url/get", { proxyUser }),
    ),
  });
}

export default defineApp(
  { user: { accounts: { provenexpert: provenexpert.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.provenexpert ?? [],
        (account) =>
          withApprovals(build(client(account.fields, fetch, signal)), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "ProvenExpert",
        description: "Read ratings and manage surveys, review invitations, widgets and profiles on ProvenExpert.",
        icons,
      },
    ),
  }),
);
