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

const base = "https://app.helloleads.io/index.php/private/api";

const helloleads = defineProvider({
  name: "HelloLeads",
  hosts: ["app.helloleads.io"],
  auth: {
    apiKey: secrets({
      label: "API key and account email",
      fields: object({ token: string({ minLength: 1 }), email: string({ minLength: 1 }) }),
    }),
  },
  // Listing lists is read-only.
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/lists`, { signal, headers: authHeaders(account) });
    await decodeJson(response, json());
  },
});

type Account = { fields: { token: string; email: string } };

const authHeaders = (account: Account) => ({
  "hls-key": `token=${account.fields.token}`,
  Xemail: account.fields.email,
  "Content-Type": "application/json",
  Accept: "application/json",
});

const search = (params: Record<string, string | number | undefined>) => {
  const out = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) if (value !== undefined) out.set(key, String(value));
  return out.toString();
};

export default defineApp(
  { user: { accounts: { helloleads: helloleads.many() } }, icons },
  async ({ user, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.helloleads ?? [],
        (account) =>
          router({
            listLists: query(
              {
                description:
                  "List the lead lists in the HelloLeads account (name and list_key). A list_key is required to create a lead. Paginated: page starts at 1.",
                input: object({ page: number().optional() }),
              },
              async ({ fetch }, { page }) =>
                decodeJson(
                  await fetch(`${base}/lists?${search({ page })}`, { signal, headers: authHeaders(account) }),
                  json(),
                ),
            ),
            listLeads: query(
              {
                description:
                  "List leads in the HelloLeads account. Paginated: page starts at 1; the response includes a paging object with current_page and total_pages.",
                input: object({ page: number().optional() }),
              },
              async ({ fetch }, { page }) =>
                decodeJson(
                  await fetch(`${base}/leads?${search({ page })}`, { signal, headers: authHeaders(account) }),
                  json(),
                ),
            ),
            createLead: mutation(
              {
                description:
                  "Add a lead to a HelloLeads list. Requires listKey (from listLists), firstName, and at least one of email or mobile. interests and tags are comma-separated strings without special characters. potential is High, Medium, Low or Not Relevant (default Low).",
                input: object({
                  listKey: string({ minLength: 1 }),
                  firstName: string({ minLength: 1 }),
                  lastName: string().optional(),
                  designation: string().optional(),
                  company: string().optional(),
                  email: string().optional(),
                  phone: string().optional(),
                  mobile: string().optional(),
                  mobileCode: string().optional(),
                  fax: string().optional(),
                  addressLine1: string().optional(),
                  addressLine2: string().optional(),
                  city: string().optional(),
                  state: string().optional(),
                  postalCode: string().optional(),
                  country: string().optional(),
                  website: string().optional(),
                  notes: string().optional(),
                  interests: string().optional(),
                  category: string().optional(),
                  tags: string().optional(),
                  dealSize: string().optional(),
                  potential: string().optional(),
                }),
                approval: always(),
              },
              async ({ fetch }, input) => {
                if ((input.email ?? "") === "" && (input.mobile ?? "") === "") {
                  throw new Error("HelloLeads requires at least one of email or mobile");
                }
                const body: Record<string, string> = {
                  list_key: input.listKey,
                  first_name: input.firstName,
                };
                const optional: Record<string, string | undefined> = {
                  last_name: input.lastName,
                  designation: input.designation,
                  company: input.company,
                  email: input.email,
                  phone: input.phone,
                  mobile: input.mobile,
                  mobile_code: input.mobileCode,
                  fax: input.fax,
                  address_line1: input.addressLine1,
                  address_line2: input.addressLine2,
                  city: input.city,
                  state: input.state,
                  postal_code: input.postalCode,
                  country: input.country,
                  website: input.website,
                  notes: input.notes,
                  interests: input.interests,
                  category: input.category,
                  tags: input.tags,
                  deal_size: input.dealSize,
                  potential: input.potential,
                };
                for (const [key, value] of Object.entries(optional)) {
                  if (value !== undefined && value !== "") body[key] = value;
                }
                return decodeJson(
                  await fetch(`${base}/leads`, {
                    method: "POST",
                    signal,
                    headers: authHeaders(account),
                    body: JSON.stringify(body),
                  }),
                  json(),
                );
              },
            ),
          }),
        { signal },
      ),
      {
        title: "HelloLeads",
        description:
          "HelloLeads CRM: list lead lists and leads, and add new leads to a list.",
        icons,
      },
    ),
  }),
);
