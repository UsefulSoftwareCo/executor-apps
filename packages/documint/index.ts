import {
  accountRouter,
  boolean,
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

const base = "https://api.documint.me/1";

const documint = defineProvider({
  name: "Documint",
  hosts: ["api.documint.me"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // Listing a single template is read-only and works on every plan that has API access.
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/templates?limit=1&select=name`, {
      signal,
      headers: { api_key: account.fields.token, Accept: "application/json" },
    });
    await decodeJson(response, object({}));
  },
});

type Account = { fields: { token: string } };

const headers = (account: Account) => ({ api_key: account.fields.token, Accept: "application/json" });

const search = (params: Record<string, string | number | boolean | undefined>) => {
  const out = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) if (value !== undefined) out.set(key, String(value));
  const text = out.toString();
  return text === "" ? "" : `?${text}`;
};

const documintTools = (account: Account, signal: AbortSignal) =>
  router({
    listTemplates: query(
      {
        description:
          "List your Documint templates (id, name, createdAt by default). limit is 1-200 (default 100), page starts at 1, sort is a field name such as createdAt (prefix with - for descending), and select is a comma-separated list of fields to return (prefix a field with - to exclude it).",
        input: object({
          limit: number().optional(),
          page: number().optional(),
          sort: string().optional(),
          select: string().optional(),
        }),
      },
      async ({ fetch }, input) =>
        decodeJson(await fetch(`${base}/templates${search(input)}`, { signal, headers: headers(account) }), json()),
    ),
    getTemplate: query(
      {
        description:
          "Get one template by id. select is an optional comma-separated list of fields to return (prefix a field with - to exclude it).",
        input: object({ id: string({ minLength: 1 }), select: string().optional() }),
      },
      async ({ fetch }, { id, select }) =>
        decodeJson(
          await fetch(`${base}/templates/${encodeURIComponent(id)}${search({ select })}`, {
            signal,
            headers: headers(account),
          }),
          json(),
        ),
    ),
    updateTemplate: mutation(
      {
        description:
          "Update properties of one template, for example name, isActive or isTrashed. Pass them in fields as a JSON object; to deactivate or trash a template set isActive or isTrashed rather than deleting it.",
        input: object({ id: string({ minLength: 1 }), fields: record(json()) }),
        approval: always(),
      },
      async ({ fetch }, { id, fields }) =>
        decodeJson(
          await fetch(`${base}/templates/${encodeURIComponent(id)}`, {
            method: "PUT",
            signal,
            headers: { ...headers(account), "content-type": "application/json" },
            body: JSON.stringify(fields),
          }),
          json(),
        ),
    ),
    deleteTemplate: mutation(
      {
        description: "Permanently delete one template. To only deactivate or trash it, use updateTemplate with isActive or isTrashed.",
        input: object({ id: string({ minLength: 1 }) }),
        approval: always(),
      },
      async ({ fetch }, { id }) =>
        decodeJson(
          await fetch(`${base}/templates/${encodeURIComponent(id)}`, {
            method: "DELETE",
            signal,
            headers: headers(account),
          }),
          json(),
        ),
    ),
    createDocument: mutation(
      {
        description:
          "Merge data into a template to create a document. data is a JSON object whose keys are the template's merge variables. preview defaults to true, which watermarks the document; set it to false for a clean document. active defaults to true. ignoreFields and watchFields are optional comma-separated field names. Returns the document url, name, fileExtension, timestamp, templateName and templateId.",
        input: object({
          id: string({ minLength: 1 }),
          data: record(json()),
          preview: boolean().optional(),
          active: boolean().optional(),
          ignoreFields: string().optional(),
          watchFields: string().optional(),
        }),
        approval: always(),
      },
      async ({ fetch }, { id, data, preview, active, ignoreFields, watchFields }) =>
        decodeJson(
          await fetch(
            `${base}/templates/${encodeURIComponent(id)}/content${search({
              preview: preview ?? true,
              active: active ?? true,
              ignore_fields: ignoreFields,
              watch_fields: watchFields,
            })}`,
            {
              method: "POST",
              signal,
              headers: { ...headers(account), "content-type": "application/json" },
              body: JSON.stringify(data),
            },
          ),
          json(),
        ),
    ),
  });

export default defineApp({ user: { accounts: { documint: documint.many() } }, icons }, async ({ user, signal }) => ({
  tools: router(await accountRouter(user?.accounts.documint ?? [], (account) => documintTools(account, signal), { signal }), {
    title: "Documint",
    description: "Generate documents (PDFs and more) by merging JSON data into Documint templates, and manage those templates.",
    icons,
  }),
}));
