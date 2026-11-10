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
  record,
  router,
  secrets,
  string,
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const endpoint = "https://integrations.expensify.com/Integration-Server/ExpensifyIntegrations";

const expensify = defineProvider({
  name: "Expensify",
  hosts: ["integrations.expensify.com"],
  auth: {
    // Expensify's OAuth2 for the Integration Server is a private beta, so partner credentials are the self-serve method.
    apiKey: secrets({
      label: "Partner credentials",
      fields: object({ partnerUserID: string({ minLength: 1 }), partnerUserSecret: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch(endpoint, {
      method: "POST",
      signal,
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        requestJobDescription: JSON.stringify({
          type: "get",
          credentials: account.fields,
          inputSettings: { type: "policyList", adminOnly: false },
        }),
      }).toString(),
    });
    const body = await decodeJson(response, object({ responseCode: number() }));
    if (body.responseCode !== 200) throw new Error(`Expensify rejected the partner credentials (responseCode ${body.responseCode})`);
  },
});

type Credentials = { partnerUserID: string; partnerUserSecret: string };
type Params = Record<string, unknown>;

// Every Integration Server call is one form POST whose requestJobDescription JSON carries the credentials.
function client(credentials: Credentials, fetcher: typeof fetch, signal: AbortSignal | undefined) {
  return async (job: Params, extra: Params = {}) => {
    const form = new URLSearchParams({ requestJobDescription: JSON.stringify({ ...job, credentials }) });
    for (const [key, value] of Object.entries(extra)) if (typeof value === "string") form.set(key, value);
    const response = await fetcher(endpoint, {
      method: "POST",
      signal,
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: form.toString(),
    });
    const text = await response.text();
    if (!response.ok) throw new Error(`Expensify returned ${response.status}: ${text.slice(0, 500)}`);
    try {
      return JSON.parse(text) as unknown;
    } catch {
      return { content: text };
    }
  };
}

type Call = ReturnType<typeof client>;

const body = record(json());
const text = string({ minLength: 1 });

function build(call: Call) {
  return router({
    policies: router(
      {
        list: query(
          {
            description: "List the policies (workspaces) the account can access, with id, name, role, owner, type and output currency.",
            input: object({ adminOnly: boolean().optional(), userEmail: string().optional() }),
          },
          async (_ctx, input) => call({ type: "get", inputSettings: { type: "policyList", ...input } }),
        ),
        get: query(
          {
            description: "Get policies by id with optional extra fields (categories, reportFields, tags, tax, employees). Returns policyInfo keyed by policy id.",
            input: object({
              policyIDList: array(text),
              fields: array(string()).optional(),
              userEmail: string().optional(),
            }),
          },
          async (_ctx, input) => call({ type: "get", inputSettings: { type: "policy", ...input } }),
        ),
        create: mutation(
          {
            description: "Create a policy. plan is 'team' (default) or 'corporate'.",
            input: object({ policyName: text, plan: string().optional() }),
          },
          async (_ctx, input) => call({ type: "create", inputSettings: { type: "policy", ...input } }),
        ),
        update: mutation(
          {
            description:
              "Update a policy's categories, report fields or tags. Pass policyID (or policyIDList in settings) and any of categories, reportFields, tags exactly as in the Expensify docs, e.g. categories: { action: 'merge', data: [{ name, enabled, glCode }] }. File-based tag updates are not supported.",
            input: object({
              policyID: text,
              categories: body.optional(),
              reportFields: body.optional(),
              tags: body.optional(),
            }),
          },
          async (_ctx, { policyID, ...changes }) =>
            call({ type: "update", inputSettings: { type: "policy", policyID }, ...changes }),
        ),
        updateTagApprovers: mutation(
          {
            description: "Set or clear (empty approver) the approver per tag on a policy with single-level tags.",
            input: object({
              policyID: text,
              tagApprovers: array(object({ name: text, approver: string() })),
            }),
          },
          async (_ctx, { policyID, tagApprovers }) =>
            call({ type: "update", inputSettings: { type: "tagApprovers", policyID }, tagApprovers }),
        ),
      },
      { title: "Policies", description: "Workspaces, categories, tags, report fields and tag approvers." },
    ),
    reports: router(
      {
        create: mutation(
          {
            description:
              "Create a report with expenses (requires Concierge enablement and domain plus policy admin). expenses: [{ date, currency, merchant, amount (cents) }]. Returns reportName and reportID.",
            input: object({
              policyID: text,
              employeeEmail: text,
              report: body,
              expenses: array(record(json())),
            }),
          },
          async (_ctx, input) => call({ type: "create", inputSettings: { type: "report", ...input } }),
        ),
        updateStatus: mutation(
          {
            description:
              "Mark approved reports as REIMBURSED. filters: { reportIDList: 'id1,id2' } or { startDate, endDate }. Returns 207 with skippedReports and failedReports on partial success.",
            input: object({ status: string(), paymentSource: string().optional(), filters: body }),
          },
          async (_ctx, input) => call({ type: "update", inputSettings: { type: "reportStatus", ...input } }),
        ),
        export: mutation(
          {
            description:
              "Export reports through a Freemarker template. Returns a file name to pass to files.download. filters needs reportIDList, startDate or approvedAfter. onFinish may email, markAsExported or upload by SFTP.",
            input: object({
              template: text,
              filters: body,
              fileExtension: string(),
              fileBasename: string().optional(),
              reportState: string().optional(),
              limit: string().optional(),
              employeeEmail: string().optional(),
              onFinish: array(record(json())).optional(),
            }),
          },
          async (_ctx, input) =>
            call(
              {
                type: "file",
                onReceive: { immediateResponse: ["returnRandomFileName"] },
                inputSettings: {
                  type: "combinedReportData",
                  filters: input.filters,
                  ...(input.reportState === undefined ? {} : { reportState: input.reportState }),
                  ...(input.limit === undefined ? {} : { limit: input.limit }),
                  ...(input.employeeEmail === undefined ? {} : { employeeEmail: input.employeeEmail }),
                },
                outputSettings: {
                  fileExtension: input.fileExtension,
                  ...(input.fileBasename === undefined ? {} : { fileBasename: input.fileBasename }),
                },
                ...(input.onFinish === undefined ? {} : { onFinish: input.onFinish }),
              },
              { template: input.template },
            ),
        ),
      },
      { title: "Reports", description: "Create reports, mark them reimbursed and export them." },
    ),
    expenses: router(
      {
        create: mutation(
          {
            description:
              "Create expenses. transactionList items need merchant, created (YYYY-MM-DD), amount (cents) and currency; optional externalID, category, tag, billable, reimbursable, comment, reportID, policyID, tax. Returns transaction ids.",
            input: object({ employeeEmail: text, transactionList: array(record(json())) }),
          },
          async (_ctx, input) => call({ type: "create", inputSettings: { type: "expenses", ...input } }),
        ),
      },
      { title: "Expenses", description: "Create expenses for an employee." },
    ),
    expenseRules: router(
      {
        create: mutation(
          {
            description: "Create an expense rule for an employee on a policy. actions keys: tag, defaultBillable.",
            input: object({ policyID: text, employeeEmail: text, actions: body }),
          },
          async (_ctx, input) => call({ type: "create", inputSettings: { type: "expenseRules", ...input } }),
        ),
        update: mutation(
          {
            description: "Update an expense rule by ruleID.",
            input: object({ policyID: text, employeeEmail: text, ruleID: number(), actions: body }),
          },
          async (_ctx, input) => call({ type: "update", inputSettings: { type: "expenseRules", ...input } }),
        ),
      },
      { title: "Expense rules", description: "Per-employee expense rules." },
    ),
    cards: router(
      {
        domainCards: query(
          {
            description: "List the company cards of a domain (credentials must belong to a domain admin).",
            input: object({ domain: text }),
          },
          async (_ctx, input) => call({ type: "get", inputSettings: { type: "domainCardList", ...input } }),
        ),
        reconciliation: mutation(
          {
            description:
              "Export card transactions through a Freemarker template (domain admin). type is 'Unreported' or 'All'; feed is a feed name or export_all_feeds. Returns a filename for files.download with fileSystem 'reconciliation'.",
            input: object({
              template: text,
              startDate: text,
              endDate: text,
              domain: text,
              type: string(),
              feed: string().optional(),
              fileExtension: string().optional(),
            }),
          },
          async (_ctx, { template, fileExtension, ...settings }) =>
            call(
              {
                type: "reconciliation",
                inputSettings: { ...settings, async: false },
                ...(fileExtension === undefined ? {} : { outputSettings: { fileExtension } }),
              },
              { template },
            ),
        ),
      },
      { title: "Cards", description: "Domain card lists and card reconciliation exports." },
    ),
    files: router(
      {
        download: query(
          {
            description:
              "Download a file produced by reports.export (fileSystem 'integrationServer', default) or cards.reconciliation ('reconciliation'). Returns parsed JSON or { content } text.",
            input: object({ fileName: text, fileSystem: string().optional() }),
          },
          async (_ctx, input) => call({ type: "download", ...input }),
        ),
      },
      { title: "Files", description: "Download generated export files." },
    ),
  });
}

export default defineApp(
  { user: { accounts: { expensify: expensify.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.expensify ?? [],
        (account) =>
          withApprovals(build(client(account.fields, fetch, signal)), (tool) => (tool.kind === "mutation" ? always() : undefined)),
        { signal },
      ),
      {
        title: "Expensify",
        description:
          "Expensify Integration Server: policies, categories, tags, report fields, reports, expenses, expense rules, report exports, card reconciliation and file downloads.",
        icons,
      },
    ),
  }),
);
