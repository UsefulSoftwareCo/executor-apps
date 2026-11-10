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
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const base = "https://api.imagior.com";

const imagior = defineProvider({
  name: "Imagior",
  hosts: ["api.imagior.com"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/user/account`, {
      signal,
      headers: { Authorization: `Bearer ${account.fields.token}` },
    });
    const body = await decodeJson(
      response,
      object({ name: string(), email: string(), usage: object({ remainingCredits: number() }) }),
    );
    return { accountInfo: { externalId: body.email, displayName: body.name, email: body.email } };
  },
});

type Fetch = typeof fetch;

function client(token: string, fetcher: Fetch, signal: AbortSignal | undefined) {
  const call = async (method: string, path: string, body?: unknown) => {
    const response = await fetcher(`${base}${path}`, {
      method,
      signal,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });
    const text = await response.text();
    if (!response.ok) throw new Error(`Imagior returned ${response.status}: ${text.slice(0, 500)}`);
    if (text === "") return { status: response.status };
    try {
      return JSON.parse(text) as unknown;
    } catch {
      return { status: response.status, body: text };
    }
  };
  return { call };
}

const enc = encodeURIComponent;
const templateId = object({ templateId: string({ minLength: 1 }) });

export default defineApp(
  { user: { accounts: { imagior: imagior.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.imagior ?? [],
        (account) => {
          const { call } = client(account.fields.token, fetch, signal);
          return router({
            account: router({
              get: query(
                {
                  description: "Get the authenticated user's name, email and remaining image credits. Costs no credits.",
                  input: object({}),
                },
                async () => call("GET", "/user/account"),
              ),
            }),
            templates: router({
              list: query(
                {
                  description:
                    "List the design templates in the account (id, name, createdAt, updatedAt). sort is createdAt or updatedAt (default updatedAt); order is asc or desc (default desc).",
                  input: object({ sort: string().optional(), order: string().optional() }),
                },
                async (_ctx, { sort, order }) => {
                  const params = new URLSearchParams();
                  if (sort) params.set("sort", sort);
                  if (order) params.set("order", order);
                  const qs = params.toString();
                  return call("GET", `/templates/all${qs ? `?${qs}` : ""}`);
                },
              ),
              elements: query(
                {
                  description:
                    "Get every element of a template with all its properties (size, fill, font, text, src and so on), keyed by element name. These names are the keys to override in images.generate.",
                  input: templateId,
                },
                async (_ctx, { templateId }) => call("GET", `/templates/${enc(templateId)}/elements`),
              ),
              basicElements: query(
                {
                  description:
                    "Get only the basic property of each template element, keyed by element name: src for images, text for text, fill for paths. Lighter than templates.elements.",
                  input: templateId,
                },
                async (_ctx, { templateId }) => call("GET", `/templates/${enc(templateId)}/elements/basic`),
              ),
            }),
            images: router({
              generate: mutation(
                {
                  description:
                    "Generate an image from a template. Consumes 1 credit. elements optionally overrides template elements: an object keyed by element name (see templates.elements), each value an object of properties to change, e.g. { title: { text: 'Hello' }, logo: { src: 'https://...' }, background: { fill: '#ff5733' } }. Omit elements to render the template as designed.",
                  input: object({
                    templateId: string({ minLength: 1 }),
                    elements: record(json()).optional(),
                  }),
                  approval: always(),
                },
                async (_ctx, { templateId, elements }) =>
                  call("POST", "/image/generate", { templateId, ...(elements ? { elements } : {}) }),
              ),
            }),
          });
        },
        { signal },
      ),
      {
        title: "Imagior",
        description: "Generate images from Imagior design templates, inspect templates and their elements, and check remaining credits.",
        icons,
      },
    ),
  }),
);
