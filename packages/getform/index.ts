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
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const api = "https://api.forminit.com";
const submitBase = "https://forminit.com";

const getform = defineProvider({
  name: "Getform",
  hosts: ["api.forminit.com", "forminit.com"],
  auth: {
    // Getform was renamed Forminit. Keys are created under Account > API Tokens and sent in X-API-Key.
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // There is no account endpoint. Listing a form that cannot exist answers 404 for a valid key and 401 for an invalid one.
  async health({ account, fetch, signal }) {
    const response = await fetch(`${api}/v1/forms/executor-health-check`, {
      signal,
      headers: { "X-API-Key": account.fields.token, Accept: "application/json" },
    });
    if (response.status === 401) throw new Error("Getform rejected the API key (401)");
    if (response.status >= 500) throw new Error(`Getform is unavailable (${response.status})`);
  },
});

function build(token: string, fetch: typeof globalThis.fetch, signal: AbortSignal) {
  const headers = { "X-API-Key": token, Accept: "application/json" };
  return router({
    submissions: router({
      list: query(
        {
          description:
            "List the submissions of a form, newest first, with sender, tracking and custom field values. Pages hold up to 100 submissions.",
          input: object({
            formId: string({ minLength: 1 }),
            page: number().optional(),
            size: number().optional(),
            query: string().optional(),
            files: boolean().optional(),
            timezone: string().optional(),
          }),
        },
        async (_ctx, { formId, ...params }) => {
          const url = new URL(`${api}/v1/forms/${encodeURIComponent(formId)}`);
          for (const [key, value] of Object.entries(params)) {
            if (value !== undefined) url.searchParams.set(key, String(value));
          }
          return await decodeJson(await fetch(url, { signal, headers }), json());
        },
      ),
      submit: mutation(
        {
          description:
            "Create a submission on a form. Blocks are objects such as {type:'sender', properties:{email,firstName,lastName}} or {type:'text', name:'message', value:'...'}; field types are text, number, email, phone, url, date, rating, select, checkbox, radio and country.",
          input: object({
            formId: string({ minLength: 1 }),
            blocks: array(json()),
          }),
        },
        async (_ctx, { formId, blocks }) =>
          await decodeJson(
            await fetch(`${submitBase}/f/${encodeURIComponent(formId)}`, {
              method: "POST",
              signal,
              headers: { ...headers, "Content-Type": "application/json" },
              body: JSON.stringify({ blocks }),
            }),
            json(),
          ),
      ),
    }),
  });
}

export default defineApp(
  { user: { accounts: { getform: getform.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.getform ?? [],
        (account) =>
          withApprovals(build(account.fields.token, fetch, signal), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Getform",
        description: "Getform (now Forminit) form backend: list form submissions and create submissions on a form.",
        icons,
      },
    ),
  }),
);
