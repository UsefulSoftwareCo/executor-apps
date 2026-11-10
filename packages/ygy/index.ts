import {
  accountRouter,
  array,
  boolean,
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

const base = "https://api.y.gy/api/v1";

const ygy = defineProvider({
  name: "y.gy",
  hosts: ["api.y.gy"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // Listing one link is read-only and always returns the account's link total.
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/link?limit=1`, { signal, headers: headers(account) });
    await decodeJson(response, object({ total_links: number() }));
  },
});

type Account = { fields: { token: string } };

const headers = (account: Account) => ({ "api-key": account.fields.token, Accept: "application/json" });

const jsonHeaders = (account: Account) => ({ ...headers(account), "content-type": "application/json" });

const search = (params: Record<string, string | number | undefined>) => {
  const out = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) if (value !== undefined) out.set(key, String(value));
  return out.toString();
};

// Deleting returns 204 with no body.
const noContent = async (response: Response) => {
  if (!response.ok) await decodeJson(response, json());
  return { deleted: true };
};

const ygyTools = (account: Account, signal: AbortSignal) =>
  router({
    listLinks: query(
      {
        description:
          "List short links (and their QR codes), 25 per page by default. Returns { links, total_links }. Use limit and offset to page.",
        input: object({ limit: number().optional(), offset: number().optional() }),
      },
      async ({ fetch }, input) =>
        decodeJson(await fetch(`${base}/link?${search(input)}`, { signal, headers: headers(account) }), json()),
    ),
    getLink: query(
      {
        description:
          "Get one short link by id: destination, short url, QR code (qr_code_svg, qr_code_png), password and expiry settings, social preview, tags and webhook.",
        input: object({ id: string() }),
      },
      async ({ fetch }, { id }) =>
        decodeJson(
          await fetch(`${base}/link/${encodeURIComponent(id)}`, { signal, headers: headers(account) }),
          json(),
        ),
    ),
    createLink: mutation(
      {
        description:
          "Create a short link and its QR code. destination_url is required. domain defaults to y.gy (a custom domain must be verified in the dashboard first); suffix is the path, e.g. 'promo' gives y.gy/promo. expiration_date is a datetime. QR colors are full hex including '#'. tags are tag ids from listTags. Set disable_png to skip PNG generation (faster).",
        input: object({
          destination_url: string(),
          domain: string().optional(),
          suffix: string().optional(),
          name: string().optional(),
          password: string().optional(),
          og_title: string().optional(),
          og_description: string().optional(),
          og_image: string().optional(),
          expiration_date: string().optional(),
          qr_code_foreground_hex: string().optional(),
          qr_code_background_hex: string().optional(),
          tags: array(number()).optional(),
          android_link_destination: string().optional(),
          ios_link_destination: string().optional(),
          webhook_url: string().optional(),
          webhook_auth_key: string().optional(),
          disable_png: boolean().optional(),
        }),
        approval: always(),
      },
      async ({ fetch }, { disable_png, ...body }) =>
        decodeJson(
          await fetch(`${base}/link${disable_png === true ? "?disable_png=true" : ""}`, {
            method: "POST",
            signal,
            headers: jsonHeaders(account),
            body: JSON.stringify(body),
          }),
          json(),
        ),
    ),
    updateLink: mutation(
      {
        description:
          "Update a short link by id. Only the fields you pass change. domain and suffix cannot be changed. add_tags and remove_tags take tag ids. bot_protection blocks bots; captcha requires a captcha before redirecting.",
        input: object({
          id: string(),
          destination_url: string().optional(),
          name: string().optional(),
          password: string().optional(),
          og_title: string().optional(),
          og_description: string().optional(),
          og_image: string().optional(),
          expiration_date: string().optional(),
          qr_code_foreground_hex: string().optional(),
          qr_code_background_hex: string().optional(),
          android_link_destination: string().optional(),
          ios_link_destination: string().optional(),
          webhook_url: string().optional(),
          webhook_auth_key: string().optional(),
          add_tags: array(number()).optional(),
          remove_tags: array(number()).optional(),
          bot_protection: boolean().optional(),
          captcha: boolean().optional(),
        }),
        approval: always(),
      },
      async ({ fetch }, { id, ...body }) =>
        decodeJson(
          await fetch(`${base}/link/${encodeURIComponent(id)}`, {
            method: "PATCH",
            signal,
            headers: jsonHeaders(account),
            body: JSON.stringify(body),
          }),
          json(),
        ),
    ),
    deleteLink: mutation(
      {
        description: "Delete a short link and its QR code by id. The short url stops working.",
        input: object({ id: string() }),
        approval: always(),
      },
      async ({ fetch }, { id }) =>
        noContent(
          await fetch(`${base}/link/${encodeURIComponent(id)}`, { method: "DELETE", signal, headers: headers(account) }),
        ),
    ),
    listTags: query(
      {
        description: "List all tags in the account. Each tag has id, name, organization_id and created_at.",
        input: object({}),
      },
      async ({ fetch }) => decodeJson(await fetch(`${base}/tag`, { signal, headers: headers(account) }), json()),
    ),
    createTag: mutation(
      {
        description: "Create a tag by name. Returns the tag with its id, which links accept in tags, add_tags and remove_tags.",
        input: object({ name: string() }),
        approval: always(),
      },
      async ({ fetch }, { name }) =>
        decodeJson(
          await fetch(`${base}/tag`, {
            method: "POST",
            signal,
            headers: jsonHeaders(account),
            body: JSON.stringify({ name }),
          }),
          json(),
        ),
    ),
    deleteTag: mutation(
      {
        description: "Delete a tag by id.",
        input: object({ id: string() }),
        approval: always(),
      },
      async ({ fetch }, { id }) =>
        noContent(
          await fetch(`${base}/tag/${encodeURIComponent(id)}`, { method: "DELETE", signal, headers: headers(account) }),
        ),
    ),
  });

export default defineApp({ user: { accounts: { ygy: ygy.many() } }, icons }, async ({ user, signal }) => ({
  tools: router(await accountRouter(user?.accounts.ygy ?? [], (account) => ygyTools(account, signal), { signal }), {
    title: "y.gy",
    description: "Create, update and delete y.gy short links and QR codes, and manage tags.",
    icons,
  }),
}));
