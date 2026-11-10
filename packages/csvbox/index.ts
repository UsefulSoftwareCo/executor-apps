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
  router,
  secrets,
  string,
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const base = "https://api.csvbox.io/1.1";

const csvbox = defineProvider({
  name: "CSVBox",
  hosts: ["api.csvbox.io"],
  auth: {
    apiKey: secrets({
      label: "API key and secret API key",
      fields: object({
        token: string({ minLength: 1 }),
        secret: string({ minLength: 1 }),
      }),
    }),
  },
  // Documented credential check: it validates both keys and returns the account owner.
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/auth`, {
      method: "GET",
      signal,
      headers: headers(account.fields),
    });
    const { data } = await decodeJson(response, object({ data: object({ name: string(), email: string() }) }));
    return { accountInfo: { externalId: data.email, displayName: data.name, email: data.email } };
  },
});

type Keys = { token: string; secret: string };
type Fetch = typeof fetch;

function headers(keys: Keys): Record<string, string> {
  return {
    Accept: "application/json",
    "x-csvbox-api-key": keys.token,
    "x-csvbox-secret-api-key": keys.secret,
  };
}

function client(keys: Keys, fetcher: Fetch, signal: AbortSignal | undefined) {
  return async (method: string, path: string, body?: unknown) => {
    const response = await fetcher(`${base}${path}`, {
      method,
      signal,
      headers: body === undefined ? headers(keys) : { ...headers(keys), "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    return decodeJson(response, json());
  };
}

const SheetKey = string({ minLength: 1 });

const sheetBodyHelp =
  "The body is a CSVBox sheet definition: title, sheet_columns (column_name, display_label, type, required, validators, ...), destinations, webhooks, steps, security_settings, virtual_columns (max 20), validation_functions (max 10), data_transforms (max 10) and pdf_metadata_config (max 20). Errors come back keyed by dotted path into the body.";

function build(call: ReturnType<typeof client>) {
  return router({
    sheets: router(
      {
        list: query(
          {
            description:
              "List the importer sheets owned by the account, newest first, with sheet_license_key, title, column count and import count. Paginated.",
            input: object({ page: number().optional(), perPage: number().optional() }),
          },
          async (_ctx, { page, perPage }) => {
            const params = new URLSearchParams();
            if (page !== undefined) params.set("page", String(page));
            if (perPage !== undefined) params.set("per_page", String(perPage));
            const qs = params.size > 0 ? `?${params}` : "";
            return call("GET", `/sheet${qs}`);
          },
        ),
        get: query(
          {
            description:
              "Get one sheet in full (columns, destinations, webhooks, validation functions, security settings, steps) by its sheet_license_key or sheet_id.",
            input: object({ sheetLicenseKey: SheetKey }),
          },
          async (_ctx, { sheetLicenseKey }) => call("GET", `/sheet/${encodeURIComponent(sheetLicenseKey)}`),
        ),
        create: mutation(
          {
            description: `Create a new importer sheet. ${sheetBodyHelp} Omitted list keys create nothing.`,
            input: object({ sheet: json() }),
          },
          async (_ctx, { sheet }) => call("POST", "/sheet", sheet),
        ),
        update: mutation(
          {
            description: `Replace a sheet with a full definition (PUT). ${sheetBodyHelp} Prefer patch for small edits.`,
            input: object({ sheetLicenseKey: SheetKey, sheet: json() }),
          },
          async (_ctx, { sheetLicenseKey, sheet }) =>
            call("PUT", `/sheet/${encodeURIComponent(sheetLicenseKey)}`, sheet),
        ),
        patch: mutation(
          {
            description: `Partially update a sheet (PATCH): send only the keys to change. ${sheetBodyHelp}`,
            input: object({ sheetLicenseKey: SheetKey, changes: json() }),
          },
          async (_ctx, { sheetLicenseKey, changes }) =>
            call("PATCH", `/sheet/${encodeURIComponent(sheetLicenseKey)}`, changes),
        ),
      },
      { title: "Sheets", description: "Configure importer sheets: columns, validation, destinations and webhooks." },
    ),
    files: router(
      {
        submit: mutation(
          {
            description:
              "Submit a spreadsheet from a public URL to a sheet through the File API. CSVBox pushes the rows to the sheet's destination without applying the sheet's validation rules, then fires the import-complete webhook if configured. The File API must be enabled for the account. Columns must match the sheet template's order and names unless autoMap is true. Limit 30 requests per minute. Returns import_id and sheet details.",
            input: object({
              sheetLicenseKey: SheetKey,
              publicFileUrl: string({ minLength: 1 }),
              fileSheetName: string().optional(),
              hasHeader: boolean().optional(),
              autoMap: boolean().optional(),
              maxRows: number().optional(),
              user: json().optional(),
            }),
          },
          async (_ctx, input) => {
            const options: Record<string, unknown> = {};
            if (input.hasHeader !== undefined) options.has_header = input.hasHeader ? 1 : 0;
            if (input.autoMap !== undefined) options.auto_map = input.autoMap;
            if (input.maxRows !== undefined) options.max_rows = input.maxRows;
            return call("POST", "/file", {
              import: {
                public_file_url: input.publicFileUrl,
                sheet_license_key: input.sheetLicenseKey,
                ...(input.fileSheetName !== undefined ? { file_sheet_name: input.fileSheetName } : {}),
                ...(input.user !== undefined ? { user: input.user } : {}),
                ...(Object.keys(options).length > 0 ? { options } : {}),
              },
            });
          },
        ),
      },
      { title: "Files", description: "Submit spreadsheet files to a sheet through the File API." },
    ),
  });
}

export default defineApp(
  { user: { accounts: { csvbox: csvbox.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.csvbox ?? [],
        (account) =>
          withApprovals(build(client(account.fields, fetch, signal)), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "CSVBox",
        description:
          "Manage CSVBox importer sheets (columns, validation, destinations, webhooks) and submit spreadsheet files to them.",
        icons,
      },
    ),
  }),
);
