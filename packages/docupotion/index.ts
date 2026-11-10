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
  boolean,
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const base = "https://api.docupotion.com/v1";

const docupotion = defineProvider({
  name: "DocuPotion",
  hosts: ["api.docupotion.com"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // DocuPotion has no key-validation endpoint; GET /account is free and answers 401 for a bad key.
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/account`, {
      signal,
      headers: { Authorization: `Bearer ${account.fields.token}` },
    });
    if (!response.ok) throw new Error(`DocuPotion rejected the API key (${response.status})`);
    await decodeJson(response, object({ username: string() }));
  },
});

type Fetch = typeof fetch;

function client(token: string, fetcher: Fetch, signal: AbortSignal | undefined) {
  return async (path: string, init: { method: string; body?: unknown } = { method: "GET" }) => {
    const response = await fetcher(`${base}${path}`, {
      method: init.method,
      signal,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(init.body === undefined ? {} : { "content-type": "application/json" }),
      },
      ...(init.body === undefined ? {} : { body: JSON.stringify(init.body) }),
    });
    return decodeJson(response, json());
  };
}

function build(call: ReturnType<typeof client>) {
  return router({
    account: query(
      {
        description: "Account email plus documents used and the document limit for the current billing period.",
        input: object({}),
      },
      async () => call("/account"),
    ),
    listTemplates: query(
      { description: "List every template on the account with its templateId and templateName.", input: object({}) },
      async () => call("/templates"),
    ),
    createDocument: mutation(
      {
        description:
          "Render a template with data into a PDF or PNG and count it against the document quota. data keys must match the template's variables. output is 'base64' (default; returns the file inline and can be very large) or 'url' (returns a presigned link valid for expiration minutes). format is 'pdf' (default) or 'png'. s3Bucket uploads to the S3 bucket connected in the dashboard and requires output 'url'; s3Key is the path without extension.",
        input: object({
          templateId: string({ minLength: 1 }),
          data: record(json()).optional(),
          output: string().optional(),
          expiration: number().optional(),
          format: string().optional(),
          s3Bucket: boolean().optional(),
          s3Key: string().optional(),
        }),
        approval: always(),
      },
      async (_ctx, { s3Bucket, s3Key, ...rest }) =>
        call("/create", { method: "POST", body: { ...rest, s3_bucket: s3Bucket, s3_key: s3Key } }),
    ),
  });
}

export default defineApp(
  { user: { accounts: { docupotion: docupotion.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.docupotion ?? [],
        (account) =>
          withApprovals(build(client(account.fields.token, fetch, signal)), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "DocuPotion",
        description: "Generate PDF and PNG documents from DocuPotion templates and data, list templates and check usage.",
        icons,
      },
    ),
  }),
);
