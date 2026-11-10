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
  router,
  secrets,
  string,
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const base = "https://app.wisepops.com/api2";

const wisepops = defineProvider({
  name: "Wisepops",
  hosts: ["app.wisepops.com"],
  auth: {
    apiKey: secrets({
      label: "API key (one website)",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // Listing popups is read-only; the key is tied to one website.
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/wisepops`, { signal, headers: headers(account) });
    await decodeJson(response, array(object({ id: number() })));
  },
});

type Account = { fields: { token: string } };

// Wisepops uses a custom Authorization scheme, not a bearer token.
const headers = (account: Account) => ({
  Authorization: `WISEPOPS-API key="${account.fields.token}"`,
  Accept: "application/json",
});

const search = (params: Record<string, string | number | undefined>) => {
  const out = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) if (value !== undefined) out.set(key, String(value));
  return out.toString();
};

const wisepopsTools = (account: Account, signal: AbortSignal) =>
  router({
    popups: router(
      {
        list: query(
          {
            description:
              "List the website's popups (campaigns) with id, label, created_at, activated flag and display, click and email counts.",
            input: object({}),
          },
          async ({ fetch }) => decodeJson(await fetch(`${base}/wisepops`, { signal, headers: headers(account) }), json()),
        ),
      },
      { title: "Popups", description: "Popup campaigns and their performance." },
    ),
    contacts: router(
      {
        list: query(
          {
            description:
              "List collected contacts (emails, phones, survey answers). Each has collected_at, wisepop_id, ip, country_code and a fields object. collectedAfter is a UTC ISO date such as 2017-03-01T01:00:00Z, wisepopId limits to one popup, pageSize is 1-1000 (default 100). The API is quota-limited (1,500 calls per 30 days on Custom plans); prefer webhooks for near-real-time leads.",
            input: object({
              collectedAfter: string().optional(),
              wisepopId: number().optional(),
              pageSize: number().optional(),
            }),
          },
          async ({ fetch }, { collectedAfter, wisepopId, pageSize }) =>
            decodeJson(
              await fetch(
                `${base}/contacts?${search({ collected_after: collectedAfter, wisepop_id: wisepopId, page_size: pageSize })}`,
                { signal, headers: headers(account) },
              ),
              json(),
            ),
        ),
      },
      { title: "Contacts", description: "Leads collected by popups." },
    ),
    hooks: router(
      {
        list: query(
          {
            description: "List the webhooks configured for this website.",
            input: object({}),
          },
          async ({ fetch }) => decodeJson(await fetch(`${base}/hooks`, { signal, headers: headers(account) }), json()),
        ),
        create: mutation(
          {
            description:
              "Create a webhook that receives collected leads as a JSON array via POST. event is email (sign-up blocks), phone (phone blocks) or survey (survey blocks). Omit wisepopId to receive leads from every popup. Returns the new hook id. Deliveries carry an X-Wisepops-Signature header: HMAC-SHA256 hex of the raw body keyed with the API key.",
            input: object({ event: string(), targetUrl: string(), wisepopId: number().optional() }),
            approval: always(),
          },
          async ({ fetch }, { event, targetUrl, wisepopId }) =>
            decodeJson(
              await fetch(`${base}/hooks`, {
                method: "POST",
                signal,
                headers: { ...headers(account), "content-type": "application/json" },
                body: JSON.stringify({ event, target_url: targetUrl, wisepop_id: wisepopId }),
              }),
              json(),
            ),
        ),
        delete: mutation(
          {
            description: "Delete a webhook by the hook id returned at creation.",
            input: object({ hookId: number() }),
            approval: always(),
          },
          async ({ fetch }, { hookId }) => {
            const response = await fetch(`${base}/hooks?${search({ hook_id: hookId })}`, {
              method: "DELETE",
              signal,
              headers: headers(account),
            });
            if (!response.ok) throw new Error(`Wisepops returned ${response.status}`);
            return { deleted: true, hookId };
          },
        ),
      },
      { title: "Webhooks", description: "Push collected leads to a URL as they arrive." },
    ),
    dataPrivacy: router(
      {
        delete: mutation(
          {
            description:
              "GDPR/CCPA erasure: delete and suppress all stored data for an end user. Give email, phone (international format, starting with + and no spaces) or both; records matching either are deleted. Returns {deleted: count}.",
            input: object({ email: string().optional(), phone: string().optional() }),
            approval: always(),
          },
          async ({ fetch }, { email, phone }) => {
            if (email === undefined && phone === undefined) throw new Error("Provide email or phone");
            return decodeJson(
              await fetch(`${base}/data-privacy`, {
                method: "DELETE",
                signal,
                headers: { ...headers(account), "content-type": "application/json" },
                body: JSON.stringify({ email, phone }),
              }),
              json(),
            );
          },
        ),
      },
      { title: "Data privacy", description: "Erase an end user's data." },
    ),
  });

export default defineApp({ user: { accounts: { wisepops: wisepops.many() } }, icons }, async ({ user, signal }) => ({
  tools: router(await accountRouter(user?.accounts.wisepops ?? [], (account) => wisepopsTools(account, signal), { signal }), {
    title: "Wisepops",
    description: "Popup performance, collected contacts, webhooks and data-privacy deletion for a Wisepops website.",
    icons,
  }),
}));
