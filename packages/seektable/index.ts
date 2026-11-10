import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  json,
  mutation,
  object,
  query,
  router,
  secrets,
  string,
  boolean,
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const base = "https://www.seektable.com/api";

const seektable = defineProvider({
  name: "SeekTable",
  hosts: ["www.seektable.com"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // Listing cubes is read-only and available to every key.
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/cube`, { signal, headers: headers(account) });
    await decodeJson(response, json());
  },
});

type Account = { fields: { token: string } };

// SeekTable expects the key in the Authorization header as it is, with no Bearer prefix.
const headers = (account: Account) => ({ Authorization: account.fields.token, Accept: "application/json" });

const search = (params: Record<string, string | boolean | undefined>) => {
  const out = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) if (value !== undefined) out.set(key, String(value));
  return out.toString();
};

const textFormats = ["html", "csv", "json"];

// Text formats come back as text; binary ones (pdf, png, excel) as base64.
async function readExport(response: Response, format: string) {
  if (!response.ok) throw new Error(`SeekTable returned ${response.status}: ${await response.text()}`);
  const contentType = response.headers.get("content-type") ?? "";
  if (textFormats.includes(format)) return { format, contentType, encoding: "text", content: await response.text() };
  const bytes = new Uint8Array(await response.arrayBuffer());
  let binary = "";
  for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return { format, contentType, encoding: "base64", content: btoa(binary) };
}

const seektableTools = (account: Account, signal: AbortSignal) =>
  router({
    listReports: query(
      {
        description: "List all reports in the account (id, name, type and other metadata). Report ids are GUIDs.",
        input: object({}),
      },
      async ({ fetch }) => decodeJson(await fetch(`${base}/report`, { signal, headers: headers(account) }), json()),
    ),
    getReport: query(
      {
        description:
          "Get one report: Id, Name, ReportType (pivot or table) and Config, the report's JSON configuration as a string.",
        input: object({ reportId: string() }),
      },
      async ({ fetch }, { reportId }) =>
        decodeJson(
          await fetch(`${base}/report/${encodeURIComponent(reportId)}`, { signal, headers: headers(account) }),
          json(),
        ),
    ),
    exportReport: query(
      {
        description:
          "Run and export a saved report. format is html, pdf, csv, excel, excelpivottable (pivot reports only), json or png. Text formats (html, csv, json) return as text; pdf, png and excel return base64. reportParameters is a JSON string such as {\"name\":\"value\"} and needs the Advanced publishing plan. rowMode (json only) is array or object. Cloud accounts are limited to 50 calls per day (500 with Advanced publishing).",
        input: object({
          reportId: string(),
          format: string(),
          reportParameters: string().optional(),
          htmlInlineStyle: boolean().optional(),
          chartOnly: boolean().optional(),
          valueFormatting: boolean().optional(),
          rowMode: string().optional(),
        }),
      },
      async ({ fetch }, { reportId, format, ...input }) =>
        readExport(
          await fetch(
            `${base}/report/${encodeURIComponent(reportId)}/export?${search({
              format,
              report_parameters: input.reportParameters,
              html_inline_style: input.htmlInlineStyle,
              chart_only: input.chartOnly,
              value_formatting: input.valueFormatting,
              row_mode: input.rowMode,
            })}`,
            { signal, headers: headers(account) },
          ),
          format,
        ),
    ),
    shareReportByEmail: mutation(
      {
        description:
          "Email a report. attachExport is a comma-separated list of pdf, csv, excel, excelpivottable. includeReportHtml defaults to true. reportParameters is a JSON string and needs the Advanced publishing plan. Sends an email to the given recipient.",
        input: object({
          reportId: string(),
          to: string(),
          subject: string(),
          message: string().optional(),
          includeReportHtml: boolean().optional(),
          attachExport: string().optional(),
          reportParameters: string().optional(),
        }),
        approval: always(),
      },
      async ({ fetch }, { reportId, ...input }) => {
        const form = new FormData();
        form.set("to", input.to);
        form.set("subject", input.subject);
        if (input.message !== undefined) form.set("message", input.message);
        if (input.includeReportHtml !== undefined) form.set("include_report_html", String(input.includeReportHtml));
        if (input.attachExport !== undefined) form.set("attach_export", input.attachExport);
        if (input.reportParameters !== undefined) form.set("report_parameters", input.reportParameters);
        const response = await fetch(`${base}/report/${encodeURIComponent(reportId)}/share/email`, {
          method: "POST",
          signal,
          headers: headers(account),
          body: form,
        });
        if (!response.ok) throw new Error(`SeekTable returned ${response.status}: ${await response.text()}`);
        return { sent: true };
      },
    ),
    listCubes: query(
      { description: "List all cubes (data sources) in the account.", input: object({}) },
      async ({ fetch }) => decodeJson(await fetch(`${base}/cube`, { signal, headers: headers(account) }), json()),
    ),
    getCube: query(
      {
        description: "Get one cube: Id, Name, SourceType, SourceTypeId, SourceFile (CSV cubes only) and CreateDate.",
        input: object({ cubeId: string() }),
      },
      async ({ fetch }, { cubeId }) =>
        decodeJson(
          await fetch(`${base}/cube/${encodeURIComponent(cubeId)}`, { signal, headers: headers(account) }),
          json(),
        ),
    ),
    importCsv: mutation(
      {
        description:
          "Upload CSV text as a cube. With cubeId it refreshes that existing CSV cube; without it a new cube is created. filename is optional. Returns the cube metadata.",
        input: object({ csv: string(), cubeId: string().optional(), filename: string().optional() }),
        approval: always(),
      },
      async ({ fetch }, { csv, cubeId, filename }) =>
        decodeJson(
          await fetch(`${base}/cube/import/csv?${search({ cubeId, filename })}`, {
            method: "POST",
            signal,
            headers: { ...headers(account), "content-type": "text/csv" },
            body: csv,
          }),
          json(),
        ),
    ),
    listDashboards: query(
      {
        description: "List dashboards the account can access. Only works when dashboards are enabled for the account.",
        input: object({}),
      },
      async ({ fetch }) => decodeJson(await fetch(`${base}/dashboard`, { signal, headers: headers(account) }), json()),
    ),
    exportDashboard: query(
      {
        description:
          "Export a dashboard as excel or pdf (the format must be enabled on that dashboard). Returns base64. reportParameters is a JSON string and needs the Advanced publishing plan.",
        input: object({ dashboardId: string(), format: string(), reportParameters: string().optional() }),
      },
      async ({ fetch }, { dashboardId, format, reportParameters }) =>
        readExport(
          await fetch(
            `${base}/dashboard/${encodeURIComponent(dashboardId)}/export?${search({ format, report_parameters: reportParameters })}`,
            { signal, headers: headers(account) },
          ),
          format,
        ),
    ),
    backupAccount: query(
      {
        description:
          "Back up the account (reports, cubes, workspaces, dashboards, team). format is xml (default) or zip (zip returns base64). Requires a Full access API key (Advanced publishing or Team sharing).",
        input: object({
          format: string().optional(),
          workspaces: boolean().optional(),
          dashboards: boolean().optional(),
          team: boolean().optional(),
        }),
      },
      async ({ fetch }, input) => {
        const format = input.format ?? "xml";
        const response = await fetch(`${base}/account/backup?${search({ ...input, format })}`, {
          signal,
          headers: headers(account),
        });
        return readExport(response, format === "xml" ? "json" : "zip");
      },
    ),
  });

export default defineApp({ user: { accounts: { seektable: seektable.many() } }, icons }, async ({ user, signal }) => ({
  tools: router(await accountRouter(user?.accounts.seektable ?? [], (account) => seektableTools(account, signal), { signal }), {
    title: "SeekTable",
    description: "List, export and email SeekTable reports and dashboards, manage CSV cubes, and back up the account.",
    icons,
  }),
}));
