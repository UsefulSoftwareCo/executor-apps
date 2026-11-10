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

const base = "https://app.mailercheck.com/api";

const mailercheck = defineProvider({
  name: "MailerCheck",
  hosts: ["app.mailercheck.com"],
  auth: {
    apiKey: secrets({
      label: "API token",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/credits`, {
      signal,
      headers: { Authorization: `Bearer ${account.fields.token}`, Accept: "application/json" },
    });
    await decodeJson(response, object({ total: number() }));
  },
});

type Account = { fields: { token: string } };

const headers = (account: Account) => ({
  Authorization: `Bearer ${account.fields.token}`,
  Accept: "application/json",
});

const search = (params: Record<string, string | number | undefined>) => {
  const out = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) if (value !== undefined) out.set(key, String(value));
  return out.toString();
};

const mailercheckTools = (account: Account, signal: AbortSignal) =>
  router({
    account: router(
      {
        get: query(
          {
            description: "Get the MailerCheck account tied to the API token: name, credits, company and billing details.",
            input: object({}),
          },
          async ({ fetch }) => decodeJson(await fetch(`${base}/account`, { signal, headers: headers(account) }), json()),
        ),
        user: query(
          {
            description: "Get the user that owns the API token: name, email and timestamps.",
            input: object({}),
          },
          async ({ fetch }) => decodeJson(await fetch(`${base}/user`, { signal, headers: headers(account) }), json()),
        ),
        credits: query(
          {
            description: "Get the available verification credit balance (total).",
            input: object({}),
          },
          async ({ fetch }) => decodeJson(await fetch(`${base}/credits`, { signal, headers: headers(account) }), json()),
        ),
      },
      { title: "Account", description: "Account, user and credit balance." },
    ),
    check: router(
      {
        single: mutation(
          {
            description:
              "Verify one email address in real time and return its status (valid, catch_all, mailbox_full, role, unknown, syntax_error, typo, mailbox_not_found, disposable, blocked, error). Consumes credits. For slow servers prefer singleAsync.",
            input: object({ email: string() }),
            approval: always(),
          },
          async ({ fetch }, input) =>
            decodeJson(
              await fetch(`${base}/check/single`, {
                method: "POST",
                signal,
                headers: { ...headers(account), "content-type": "application/json" },
                body: JSON.stringify(input),
              }),
              json(),
            ),
        ),
        singleAsync: mutation(
          {
            description:
              "Queue an asynchronous verification of one email address. Returns an id and state; fetch the outcome with check.singleAsyncResult. Consumes credits.",
            input: object({ email: string() }),
            approval: always(),
          },
          async ({ fetch }, input) =>
            decodeJson(
              await fetch(`${base}/check/single-async`, {
                method: "POST",
                signal,
                headers: { ...headers(account), "content-type": "application/json" },
                body: JSON.stringify(input),
              }),
              json(),
            ),
        ),
        singleAsyncResult: query(
          {
            description: "Get the state and result of an asynchronous single verification by its id. Result is one of valid, catch_all, mailbox_full, role, unknown, syntax_error, typo, mailbox_not_found, disposable, blocked, error.",
            input: object({ verificationId: string() }),
          },
          async ({ fetch }, { verificationId }) =>
            decodeJson(
              await fetch(`${base}/check/single-async/${encodeURIComponent(verificationId)}`, {
                signal,
                headers: headers(account),
              }),
              json(),
            ),
        ),
      },
      { title: "Check", description: "Verify single email addresses." },
    ),
    lists: router(
      {
        list: query(
          {
            description: "List verification lists with pagination (limit default 100, page default 1).",
            input: object({ limit: number().optional(), page: number().optional() }),
          },
          async ({ fetch }, input) =>
            decodeJson(await fetch(`${base}/lists?${search(input)}`, { signal, headers: headers(account) }), json()),
        ),
        get: query(
          {
            description: "Get one list: status, counts and per-result statistics.",
            input: object({ id: string() }),
          },
          async ({ fetch }, { id }) =>
            decodeJson(await fetch(`${base}/lists/${encodeURIComponent(id)}`, { signal, headers: headers(account) }), json()),
        ),
        create: mutation(
          {
            description: "Create a list from an array of email addresses. The list is not verified until lists.verify is called.",
            input: object({ name: string(), emails: array(string()) }),
            approval: always(),
          },
          async ({ fetch }, input) =>
            decodeJson(
              await fetch(`${base}/lists`, {
                method: "POST",
                signal,
                headers: { ...headers(account), "content-type": "application/json" },
                body: JSON.stringify(input),
              }),
              json(),
            ),
        ),
        upload: mutation(
          {
            description:
              "Create a list by uploading CSV or TXT text (one address per line or column). Provide the file contents as text and a file name ending in .csv or .txt.",
            input: object({ content: string(), fileName: string().default("list.csv") }),
            approval: always(),
          },
          async ({ fetch }, { content, fileName }) => {
            const form = new FormData();
            form.set("file", new Blob([content], { type: fileName.endsWith(".txt") ? "text/plain" : "text/csv" }), fileName);
            return decodeJson(
              await fetch(`${base}/lists/upload`, { method: "POST", signal, headers: headers(account), body: form }),
              json(),
            );
          },
        ),
        verify: mutation(
          {
            description:
              "Start verifying a list. Consumes credits for every address. Fails with 409 if already started and 402 if credits are insufficient.",
            input: object({ id: string() }),
            approval: always(),
          },
          async ({ fetch }, { id }) =>
            decodeJson(
              await fetch(`${base}/lists/${encodeURIComponent(id)}/verify`, {
                method: "PUT",
                signal,
                headers: headers(account),
              }),
              json(),
            ),
        ),
        results: query(
          {
            description:
              "Get verification results of a list, paginated (limit default 100, page default 1). Filter with result, for example valid, typo or unknown.",
            input: object({ id: string(), limit: number().optional(), page: number().optional(), result: string().optional() }),
          },
          async ({ fetch }, { id, ...params }) =>
            decodeJson(
              await fetch(`${base}/lists/${encodeURIComponent(id)}/results?${search(params)}`, {
                signal,
                headers: headers(account),
              }),
              json(),
            ),
        ),
        delete: mutation(
          {
            description: "Delete a list permanently.",
            input: object({ id: string() }),
            approval: always(),
          },
          async ({ fetch }, { id }) => {
            const response = await fetch(`${base}/lists/${encodeURIComponent(id)}`, {
              method: "DELETE",
              signal,
              headers: headers(account),
            });
            if (!response.ok) throw new Error(`MailerCheck returned ${response.status}: ${await response.text()}`);
            return { deleted: true };
          },
        ),
      },
      { title: "Lists", description: "Create, verify and read results of email lists." },
    ),
  });

export default defineApp({ user: { accounts: { mailercheck: mailercheck.many() } }, icons }, async ({ user, signal }) => ({
  tools: router(await accountRouter(user?.accounts.mailercheck ?? [], (account) => mailercheckTools(account, signal), { signal }), {
    title: "MailerCheck",
    description:
      "Verify email addresses and lists with MailerCheck: real-time and async checks, list upload, verification, results and credit balance.",
    icons,
  }),
}));
