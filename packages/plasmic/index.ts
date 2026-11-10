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
  plain,
  query,
  record,
  router,
  secrets,
  string,
  boolean,
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const base = "https://data.plasmic.app/api/v1/cms";

// The CMS has no account endpoint and every route needs a model id, so health makes no
// network call. A wrong CMS ID or token surfaces as a 401/403 on the first tool call.
const plasmic = defineProvider({
  name: "Plasmic",
  hosts: ["data.plasmic.app"],
  auth: {
    apiKey: secrets({
      label: "Plasmic CMS credentials (CMS ID, public token, secret token from CMS Settings)",
      fields: object({
        cmsId: plain(string({ minLength: 1 })),
        publicToken: string({ minLength: 1 }),
        secretToken: string({ minLength: 1 }),
      }),
    }),
  },
  async health() {},
});

const Row = object({
  identifier: string().optional(),
  data: record(json()),
});

export default defineApp(
  { user: { accounts: { plasmic: plasmic.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.plasmic ?? [],
        (account) => {
          const { cmsId, publicToken, secretToken } = account.fields;
          const headers = (token: string, body: boolean) => ({
            "x-plasmic-api-cms-tokens": `${cmsId}:${token}`,
            ...(body ? { "content-type": "application/json" } : {}),
          });
          const table = (modelId: string) =>
            `${base}/databases/${encodeURIComponent(cmsId)}/tables/${encodeURIComponent(modelId)}`;
          const params = (input: {
            where?: Record<string, unknown> | undefined;
            limit?: number | undefined;
            offset?: number | undefined;
            draft?: boolean | undefined;
            locale?: string | undefined;
          }) => {
            const search = new URLSearchParams();
            const q = {
              ...(input.where ? { where: input.where } : {}),
              ...(input.limit !== undefined ? { limit: input.limit } : {}),
              ...(input.offset !== undefined ? { offset: input.offset } : {}),
            };
            if (Object.keys(q).length > 0) search.set("q", JSON.stringify(q));
            if (input.draft) search.set("draft", "1");
            if (input.locale) search.set("locale", input.locale);
            const text = search.toString();
            return text ? `?${text}` : "";
          };
          const readInput = {
            modelId: string({ minLength: 1 }),
            where: record(json()).optional(),
            limit: number().optional(),
            offset: number().optional(),
            draft: boolean().optional(),
            locale: string().optional(),
          };
          return router({
            items: router(
              {
                list: query(
                  {
                    description:
                      "Get entries of a CMS model. where is a filter such as { slug: 'a' } or { $and: [...] } with operators $and, $or, $not, $in, $gt, $ge, $lt, $le, $regex; limit defaults to 100. draft returns unpublished data. locale returns localized fields.",
                    input: object(readInput),
                  },
                  async (_ctx, input) =>
                    decodeJson(
                      await fetch(`${table(input.modelId)}/query${params(input)}`, {
                        signal,
                        headers: headers(input.draft ? secretToken : publicToken, false),
                      }),
                      json(),
                    ),
                ),
                count: query(
                  {
                    description: "Count entries of a CMS model matching an optional where filter (same syntax as items.list).",
                    input: object({ modelId: string({ minLength: 1 }), where: record(json()).optional() }),
                  },
                  async (_ctx, input) =>
                    decodeJson(
                      await fetch(`${table(input.modelId)}/count${params({ where: input.where })}`, {
                        signal,
                        headers: headers(publicToken, false),
                      }),
                      json(),
                    ),
                ),
                create: mutation(
                  {
                    description:
                      "Create entries in a CMS model. Each row has an optional identifier and data keyed by field name (localized fields take { '': default, 'ar-JO': value }). publish publishes them immediately.",
                    input: object({
                      modelId: string({ minLength: 1 }),
                      rows: array(Row),
                      publish: boolean().optional(),
                    }),
                    approval: always(),
                  },
                  async (_ctx, input) =>
                    decodeJson(
                      await fetch(`${table(input.modelId)}/rows${input.publish ? "?publish=1" : ""}`, {
                        method: "POST",
                        signal,
                        headers: headers(secretToken, true),
                        body: JSON.stringify({ rows: input.rows }),
                      }),
                      json(),
                    ),
                ),
                update: mutation(
                  {
                    description:
                      "Update an entry by row id. Omitted fields are unchanged; null clears a field. publish publishes the result immediately.",
                    input: object({
                      rowId: string({ minLength: 1 }),
                      identifier: string().optional(),
                      data: record(json()),
                      publish: boolean().optional(),
                    }),
                    approval: always(),
                  },
                  async (_ctx, input) =>
                    decodeJson(
                      await fetch(`${base}/rows/${encodeURIComponent(input.rowId)}${input.publish ? "?publish=1" : ""}`, {
                        method: "PUT",
                        signal,
                        headers: headers(secretToken, true),
                        body: JSON.stringify({
                          ...(input.identifier !== undefined ? { identifier: input.identifier } : {}),
                          data: input.data,
                        }),
                      }),
                      json(),
                    ),
                ),
                publish: mutation(
                  {
                    description: "Publish an entry's current draft data by row id.",
                    input: object({ rowId: string({ minLength: 1 }) }),
                    approval: always(),
                  },
                  async (_ctx, { rowId }) =>
                    decodeJson(
                      await fetch(`${base}/rows/${encodeURIComponent(rowId)}/publish`, {
                        method: "POST",
                        signal,
                        headers: headers(secretToken, false),
                      }),
                      json(),
                    ),
                ),
                delete: mutation(
                  {
                    description: "Delete an entry by row id.",
                    input: object({ rowId: string({ minLength: 1 }) }),
                    approval: always(),
                  },
                  async (_ctx, { rowId }) => {
                    const response = await fetch(`${base}/rows/${encodeURIComponent(rowId)}`, {
                      method: "DELETE",
                      signal,
                      headers: headers(secretToken, false),
                    });
                    const text = await response.text();
                    if (!response.ok) throw new Error(`Plasmic returned ${response.status}: ${text.slice(0, 500)}`);
                    return { deleted: true };
                  },
                ),
              },
              { title: "Items", description: "Entries of Plasmic CMS models." },
            ),
          });
        },
        { signal },
      ),
      {
        title: "Plasmic",
        description: "Plasmic headless CMS: query, count, create, update, publish and delete entries of your content models.",
        icons,
      },
    ),
  }),
);
