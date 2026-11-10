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

const base = "https://app.hyperise.io/api/v1/regular";

const hyperise = defineProvider({
  name: "Hyperise",
  hosts: ["app.hyperise.io"],
  auth: {
    apiKey: secrets({
      label: "API token",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/users/current?api_token=${encodeURIComponent(account.fields.token)}`, {
      signal,
      headers: { Accept: "application/json" },
    });
    const user = await decodeJson(response, object({ id: number(), name: string() }));
    return { accountInfo: { externalId: String(user.id), displayName: user.name } };
  },
});

type Account = { fields: { token: string } };

// The API authenticates with an api_token query parameter.
const url = (account: Account, path: string, params: Record<string, string | number | undefined> = {}) => {
  const out = new URLSearchParams({ api_token: account.fields.token });
  for (const [key, value] of Object.entries(params)) if (value !== undefined) out.set(key, String(value));
  return `${base}${path}?${out.toString()}`;
};

const accept = { Accept: "application/json" };
const jsonHeaders = { Accept: "application/json", "content-type": "application/json" };

const businessFields = {
  business_name: string().optional(),
  business_address: string().optional(),
  business_phone: string().optional(),
  email: string().optional(),
  website: string().optional(),
  category: string().optional(),
  logo: string().optional(),
  phone: string().optional(),
  first_name: string().optional(),
  last_name: string().optional(),
  title: string().optional(),
  job_title: string().optional(),
  gender: string().optional(),
  profile_image: string().optional(),
  lat: string().optional(),
  long: string().optional(),
  custom_image_1: string().optional(),
  custom_image_2: string().optional(),
  custom_image_3: string().optional(),
  custom_text_1: string().optional(),
  custom_text_2: string().optional(),
  custom_text_3: string().optional(),
  custom_text_4: string().optional(),
  custom_text_5: string().optional(),
};

const hyperiseTools = (account: Account, signal: AbortSignal) =>
  router({
    currentUser: query(
      {
        description: "Validate the API token and return the account it belongs to: id, name, email, photo, image service domain and app URL.",
        input: object({}),
      },
      async ({ fetch }) => decodeJson(await fetch(url(account, "/users/current"), { signal, headers: accept }), json()),
    ),
    listImageTemplates: query(
      {
        description:
          "List the user's active image templates with id, image_hash, name, size, preview_image, base_url and image_url. base_url + image_url is the dynamic image URL; append personalisation parameters such as first_name, business_name, website, email or custom_text_1 to it.",
        input: object({}),
      },
      async ({ fetch }) =>
        decodeJson(await fetch(url(account, "/image-templates"), { signal, headers: accept }), json()),
    ),
    listImageViews: query(
      {
        description:
          "List personalised views (impressions) of an image template, with the prospect details and enrichment data of each viewer. Without dateFrom, returns all views since the last call. dateFrom is an ISO 8601 UTC time such as 2026-01-27T10:46:00Z. Get imageHash from listImageTemplates.",
        input: object({ imageHash: string(), dateFrom: string().optional() }),
      },
      async ({ fetch }, { imageHash, dateFrom }) =>
        decodeJson(
          await fetch(url(account, "/image-impressions", { image_hash: imageHash, date_from: dateFrom }), {
            signal,
            headers: accept,
          }),
          json(),
        ),
    ),
    enrichEmail: query(
      {
        description:
          "Return enriched business and contact data (name, job title, company, logo, profile image and more) for an email address, falling back to data defined on the image template.",
        input: object({ imageHash: string(), email: string() }),
      },
      async ({ fetch }, { imageHash, email }) =>
        decodeJson(
          await fetch(url(account, "/data-enrichment", { image_hash: imageHash, email }), { signal, headers: accept }),
          json(),
        ),
    ),
    listBusinesses: query(
      {
        description: "List the prospect business records stored in Hyperise for the token owner.",
        input: object({}),
      },
      async ({ fetch }) => decodeJson(await fetch(url(account, "/businesses"), { signal, headers: accept }), json()),
    ),
    getBusiness: query(
      {
        description: "Fetch one prospect business record by id.",
        input: object({ id: number() }),
      },
      async ({ fetch }, { id }) =>
        decodeJson(await fetch(url(account, `/businesses/${id}`), { signal, headers: accept }), json()),
    ),
    createBusiness: mutation(
      {
        description:
          "Create a prospect business record. business_name, email and website are required by Hyperise. Images (logo, profile_image, custom_image_1-3) accept a URL or base64 data. gender is male or female. Returns the record id, usable in image URLs as user-business-<id>.",
        input: object({ ...businessFields, business_name: string(), email: string(), website: string() }),
        approval: always(),
      },
      async ({ fetch }, input) =>
        decodeJson(
          await fetch(url(account, "/businesses"), {
            method: "POST",
            signal,
            headers: jsonHeaders,
            body: JSON.stringify(input),
          }),
          json(),
        ),
    ),
    updateBusiness: mutation(
      {
        description: "Update a prospect business record by id. Send the fields to change; the same validation as createBusiness applies.",
        input: object({ id: number(), ...businessFields }),
        approval: always(),
      },
      async ({ fetch }, { id, ...input }) =>
        decodeJson(
          await fetch(url(account, `/businesses/${id}`), {
            method: "PUT",
            signal,
            headers: jsonHeaders,
            body: JSON.stringify(input),
          }),
          json(),
        ),
    ),
    deleteBusiness: mutation(
      {
        description: "Delete a prospect business record by id.",
        input: object({ id: number() }),
        approval: always(),
      },
      async ({ fetch }, { id }) =>
        decodeJson(
          await fetch(url(account, `/businesses/${id}`), { method: "DELETE", signal, headers: accept }),
          json(),
        ),
    ),
    createShortLink: mutation(
      {
        description:
          "Create a personalised short link that redirects to url and carries personalised Open Graph title and description. title and desc may use {{first_name}}-style placeholders. queryParams maps Hyperise parameter names (first_name, last_name, business_name, email, website...) to values. Needs a custom link domain set up in the Hyperise account.",
        input: object({
          imageHash: string(),
          url: string(),
          title: string(),
          desc: string(),
          queryParams: json(),
        }),
        approval: always(),
      },
      async ({ fetch }, { imageHash, url: destination, title, desc, queryParams }) =>
        decodeJson(
          await fetch(url(account, "/short-links"), {
            method: "POST",
            signal,
            headers: jsonHeaders,
            body: JSON.stringify({ image_hash: imageHash, url: destination, title, desc, query_params: queryParams }),
          }),
          json(),
        ),
    ),
    createClientAccount: mutation(
      {
        description: "Create a client sub-account (organization) with a number of seats and send the invite email. Agency plan only.",
        input: object({ name: string(), email: string(), seats: number() }),
        approval: always(),
      },
      async ({ fetch }, input) =>
        decodeJson(
          await fetch(url(account, "/organizations"), {
            method: "POST",
            signal,
            headers: jsonHeaders,
            body: JSON.stringify(input),
          }),
          json(),
        ),
    ),
  });

export default defineApp({ user: { accounts: { hyperise: hyperise.many() } }, icons }, async ({ user, signal }) => ({
  tools: router(await accountRouter(user?.accounts.hyperise ?? [], (account) => hyperiseTools(account, signal), { signal }), {
    title: "Hyperise",
    description: "Personalised images and short links: image templates, image views, prospect business data, email enrichment and agency client accounts.",
    icons,
  }),
}));
