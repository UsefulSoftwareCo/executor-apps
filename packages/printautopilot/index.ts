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
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const base = "https://printautopilot.com/api";

const printautopilot = defineProvider({
  name: "Print Autopilot",
  hosts: ["printautopilot.com"],
  auth: {
    apiKey: secrets({
      label: "API token (print queue token or account connection token)",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // The API has no current-user endpoint. GET /print-jobs is the print client's read-only job poll;
  // only 401/403 mean a bad token.
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/print-jobs`, {
      signal,
      headers: { Authorization: `Bearer ${account.fields.token}`, Accept: "application/json" },
    });
    if (response.status === 401 || response.status === 403) {
      throw new Error(`Print Autopilot rejected the token (${response.status})`);
    }
  },
});

type Fetch = typeof fetch;

function client(token: string, fetcher: Fetch, signal: AbortSignal | undefined) {
  return async (method: "GET" | "POST", path: string, body?: unknown) => {
    const response = await fetcher(`${base}${path}`, {
      method,
      signal,
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
        ...(body === undefined ? {} : { "Content-Type": "application/json" }),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    return decodeJson(response, json());
  };
}

const PaperSize = object({
  name: string({ minLength: 1 }),
  height: number(),
  width: number(),
  rawKind: string({ minLength: 1 }),
});

const Printer = object({
  name: string({ minLength: 1 }),
  paperSizes: array(PaperSize),
});

const JobResult = object({
  id: number(),
  state: string({ minLength: 1 }),
  err_msg: string().optional(),
});

function build(call: ReturnType<typeof client>) {
  return router({
    documents: router(
      {
        create: mutation(
          {
            description:
              "Add one base64-encoded PDF to the print queue that the token belongs to; it prints on that queue's printer. Use the print queue's own API token. Print Autopilot does not validate the base64, so pass a real PDF. One document per call.",
            input: object({
              fileName: string({ minLength: 1 }),
              base64: string({ minLength: 1 }),
            }),
          },
          async (_ctx, { fileName, base64 }) => call("POST", "/document/create", { fileName, base64 }),
        ),
      },
      { title: "Documents", description: "Queue PDF documents for printing." },
    ),
    printJobs: router(
      {
        list: query(
          {
            description:
              "List pending print jobs with their printer, paper size and base64 documents. This is the endpoint the Print Autopilot desktop client polls; results include full document content and can be large.",
            input: object({}),
          },
          async () => call("GET", "/print-jobs"),
        ),
        finish: mutation(
          {
            description:
              "Report print jobs as finished, with state \"success\" or \"failed\" (and err_msg on failure). Normally done by the desktop print client; calling it removes jobs from the pending list.",
            input: object({ jobs: array(JobResult) }),
          },
          async (_ctx, { jobs }) => call("POST", "/finish-print-jobs", jobs),
        ),
      },
      { title: "Print jobs", description: "Read and complete jobs in the print queue." },
    ),
    printers: router(
      {
        create: mutation(
          {
            description:
              "Register printers and their paper sizes so print queues can use them. Normally done by the desktop print client with the account connection token.",
            input: object({ printers: array(Printer) }),
          },
          async (_ctx, { printers }) => call("POST", "/printers", printers),
        ),
      },
      { title: "Printers", description: "Register printers and paper sizes." },
    ),
  });
}

export default defineApp(
  { user: { accounts: { printautopilot: printautopilot.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.printautopilot ?? [],
        (account) =>
          withApprovals(build(client(account.fields.token, fetch, signal)), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Print Autopilot",
        description: "Queue PDF documents on remote printers and manage printers and print jobs through Print Autopilot.",
        icons,
      },
    ),
  }),
);
