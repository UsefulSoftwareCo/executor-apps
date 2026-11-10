import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  json,
  number,
  object,
  query,
  router,
  secrets,
  string,
} from "apps";
import { icons } from "./icon.js";

const base = "https://api.forms.bytesuite.io/api";

const byteforms = defineProvider({
  name: "Byteforms",
  hosts: ["api.forms.bytesuite.io"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/form`, {
      signal,
      // The raw key goes in Authorization, with no Bearer prefix.
      headers: { Authorization: account.fields.token },
    });
    await decodeJson(response, object({ status: string() }));
  },
});

export default defineApp(
  { user: { accounts: { byteforms: byteforms.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.byteforms ?? [],
        (account) => {
          const get = async (path: string, params: Record<string, unknown> = {}) => {
            const url = new URL(`${base}${path}`);
            for (const [key, value] of Object.entries(params)) {
              if (value !== undefined) url.searchParams.set(key, String(value));
            }
            return decodeJson(
              await fetch(url, { signal, headers: { Authorization: account.fields.token } }),
              json(),
            );
          };
          return router({
            forms: router({
              list: query(
                { description: "List every form created by the authenticated user.", input: object({}) },
                async () => get("/form"),
              ),
              get: query(
                {
                  description: "Get one form with its fields (body), pages and options. formId is the numeric id or public id.",
                  input: object({ formId: string({ minLength: 1 }) }),
                },
                async (_ctx, { formId }) => get(`/form/${encodeURIComponent(formId)}`),
              ),
              responses: query(
                {
                  description:
                    "List submissions to a form. Returns { count, cursor: { after, before }, data }; pass a cursor value as after or before to page. query searches the responses.",
                  input: object({
                    formId: string({ minLength: 1 }),
                    limit: number().optional(),
                    order: string().optional(),
                    query: string().optional(),
                    after: string().optional(),
                    before: string().optional(),
                  }),
                },
                async (_ctx, { formId, ...params }) =>
                  get(`/form/responses/${encodeURIComponent(formId)}`, params),
              ),
            }),
          });
        },
        { signal },
      ),
      {
        title: "Byteforms",
        description: "Read ByteForms forms and the responses submitted to them.",
        icons,
      },
    ),
  }),
);
