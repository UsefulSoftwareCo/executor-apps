import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  json,
  mutation,
  object,
  plain,
  query,
  record,
  router,
  secrets,
  string,
  withApprovals,
  type Schema,
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

// Every Addepar firm has its own host: https://<subdomain>.addepar.com/api/v1 (the same name as the firm's
// login URL). Addepar has no public OpenAPI document, so the tools below are written from the
// developer documentation at https://developers.addepar.com/llms.txt.
function normalizeSubdomain(raw: string): string {
  const match = /^(?:https?:\/\/)?([a-z0-9](?:[a-z0-9-]*[a-z0-9])?)(?:\.addepar\.com)?(?:\/.*)?$/.exec(
    raw.trim().toLowerCase(),
  );
  if (match === null)
    throw new Error("Enter the <subdomain> of <subdomain>.addepar.com (letters, digits, hyphens).");
  return match[1]!;
}

type Fields = { subdomain: string; firmId: string; keyId: string; keySecret: string };

const addepar = defineProvider({
  name: "Addepar",
  hosts: ["*.addepar.com"],
  auth: {
    // API keys are created in Firm Administration > Admin Tools > API Access Key and inherit the
    // permissions of the user who created them. Addepar's OAuth clients are issued by Addepar to
    // partner applications (no self-service registration), so OAuth is not offered.
    apiKey: secrets({
      label: "API key and secret",
      fields: object({
        subdomain: plain(string({ minLength: 1 })),
        firmId: plain(string({ minLength: 1 })),
        keyId: string({ minLength: 1 }),
        keySecret: string({ minLength: 1 }),
      }),
    }),
  },
  async health({ account, fetch, signal }) {
    const subdomain = normalizeSubdomain(account.fields.subdomain);
    const response = await fetch(`https://${subdomain}.addepar.com/api/v1/users/me`, {
      signal,
      headers: headers(account.fields),
    });
    const me = await decodeJson(response, object({ data: object({ id: string() }) }));
    return { accountInfo: { externalId: `${subdomain}:${me.data.id}`, displayName: `${subdomain}.addepar.com` } };
  },
});

function headers(fields: Fields, body = false): Record<string, string> {
  return {
    Authorization: `Basic ${btoa(`${fields.keyId}:${fields.keySecret}`)}`,
    "Addepar-Firm": fields.firmId,
    Accept: "application/vnd.api+json",
    ...(body ? { "Content-Type": "application/vnd.api+json" } : {}),
  };
}

type Input = { id?: string; params?: Readonly<Record<string, string>>; body?: unknown };

// `id` fills the :id segment. "?" marks a bulk-capable route where id may be omitted.
type Op = {
  method: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  path: string;
  description: string;
  // A POST that only reads (search, query) is exposed as a query and needs no approval.
  read?: boolean;
  // Result of a download: returned as JSON when it parses, otherwise as text.
  download?: boolean;
};

const idNote = " Pass the resource id as id.";
const listNote =
  " Paginated: pass params such as {\"page[limit]\": \"500\", \"page[after]\": \"<last id>\"}; links.next in the response is null on the last page. Other JSON:API query parameters (filter[...], fields[...], include) also go in params.";
const bodyNote = " body is the JSON:API request document, e.g. {\"data\": {\"type\": \"...\", \"attributes\": {...}}}.";
const bulkNote = " Omit id and send an array in body.data for the bulk form.";

const get = (path: string, description: string): Op => ({ method: "GET", path, description });
const list = (path: string, description: string): Op => ({ method: "GET", path, description: description + listNote });
const search = (path: string, description: string): Op => ({ method: "POST", path, description, read: true });
const create = (path: string, description: string): Op => ({ method: "POST", path, description });
const update = (path: string, description: string): Op => ({ method: "PATCH", path, description });
const remove = (path: string, description: string): Op => ({ method: "DELETE", path, description });

type Group = { title: string; description: string; ops: Record<string, Op> };

const groups: Record<string, Group> = {
  portfolio: {
    title: "Portfolio",
    description: "Run portfolio analytics (values, returns, allocations) and saved views.",
    ops: {
      query: search(
        "/v1/portfolio/query",
        'Run a portfolio query. body.data = {"type": "portfolio_query", "attributes": {columns: [{key}], groupings: [{key}], portfolio_type: ENTITY|GROUP|FIRM|..., portfolio_id: [id], start_date, end_date, filters?}}. Returns a tree of grouped column values. Large queries should use jobs.create instead.',
      ),
      listViews: list("/v1/portfolio/views", "List saved portfolio views."),
      getView: get("/v1/portfolio/views/:id", "Get a saved portfolio view's definition." + idNote),
      runView: get(
        "/v1/portfolio/views/:id/results",
        "Run a saved portfolio view. Set params portfolio_id, portfolio_type, start_date, end_date (YYYY-MM-DD)." + idNote,
      ),
    },
  },
  jobs: {
    title: "Jobs",
    description: "Asynchronous exports of portfolio views and queries.",
    ops: {
      list: list("/v1/jobs", "List portfolio export jobs."),
      get: get("/v1/jobs/:id", "Get a job's status (Queued, In Progress, Completed, ...)." + idNote),
      create: create(
        "/v1/jobs",
        'Start an export job. body.data = {"type": "jobs", "attributes": {"job_type": "portfolio_view_results" | "portfolio_query_results", "parameters": {...}}}. Use output_type JSON so download returns data.',
      ),
      download: {
        method: "GET",
        path: "/v1/jobs/:id/download",
        description:
          "Download a completed job's results (available for 24 hours). Returns the current status payload while the job is still running." +
          idNote,
        download: true,
      },
      delete: remove("/v1/jobs/:id", "Delete a job." + idNote),
    },
  },
  entities: {
    title: "Entities",
    description: "Clients, accounts, trusts, funds and securities in the ownership graph.",
    ops: {
      list: list("/v1/entities", "List entities. Filters include filter[model_types], filter[ids], filter[created_after], filter[modified_after]."),
      get: get("/v1/entities/:id", "Get one entity." + idNote),
      search: search("/v1/entities/search", "Search entities by name, model type, external ID or identifiers." + bodyNote),
      validate: search("/v1/entities/validate", "Validate an entity payload without creating it." + bodyNote),
      create: create("/v1/entities", "Create entity or entities." + bodyNote),
      update: update("/v1/entities/:id?", "Update an entity, or many." + idNote + bulkNote + bodyNote),
      delete: remove("/v1/entities/:id?", "Delete an entity, or many." + idNote + bulkNote),
      listPrices: list("/v1/entities/:id/prices", "List historical prices of a security entity." + idNote),
      createPrice: create("/v1/entities/:id/prices", "Add historical prices to a security entity." + idNote + bodyNote),
      deletePrice: remove("/v1/entities/:id/prices/:date", "Delete a historical price. Pass id as `<entityId>/<YYYY-MM-DD>`."),
      listTypes: list("/v1/entity_types", "List entity model types with required fields and mutability."),
      getType: get("/v1/entity_types/:id", "Get one entity model type." + idNote),
      createExternalIdType: create("/v1/external_id_types", "Create an external ID type." + bodyNote),
    },
  },
  positions: {
    title: "Positions",
    description: "Holdings that connect entities (an account holding a security).",
    ops: {
      list: list("/v1/positions", "List positions."),
      get: get("/v1/positions/:id", "Get one position." + idNote),
      create: create("/v1/positions", "Create a position." + bodyNote),
      update: update("/v1/positions/:id?", "Update a position, or many." + idNote + bulkNote + bodyNote),
      delete: remove("/v1/positions/:id?", "Delete a position, or many." + idNote + bulkNote),
    },
  },
  groups: {
    title: "Groups",
    description: "Households and other groups of entities, with group types.",
    ops: {
      list: list("/v1/groups", "List groups."),
      get: get("/v1/groups/:id", "Get one group." + idNote),
      listChildGroups: list("/v1/groups/:id/child_groups", "List a group's child groups." + idNote),
      query: search("/v1/groups/query", "Find groups by display name, group type or external ID." + bodyNote),
      create: create("/v1/groups", "Create a group." + bodyNote),
      update: update("/v1/groups/:id?", "Update a group, or many." + idNote + bulkNote + bodyNote),
      delete: remove("/v1/groups/:id?", "Delete a group, or many." + idNote + bulkNote),
      listTypes: list("/v1/group_types", "List group types."),
      getType: get("/v1/group_types/:id", "Get one group type." + idNote),
      createType: create("/v1/group_types", "Create a group type." + bodyNote),
      updateType: update("/v1/group_types/:id", "Update a group type." + idNote + bodyNote),
      deleteType: remove("/v1/group_types/:id", "Delete a group type." + idNote),
    },
  },
  attributes: {
    title: "Attributes",
    description: "Attributes and arguments usable as portfolio columns, groupings and filters.",
    ops: {
      list: list("/v1/attributes", "List attributes available as columns and groupings."),
      get: get("/v1/attributes/:id", "Get one attribute." + idNote),
      listArguments: list("/v1/attributes/:id/arguments", "List arguments an attribute accepts." + idNote),
      query: search("/v1/attributes/query", "Look up attributes by key or name." + bodyNote),
      listAllArguments: list("/v1/arguments", "List all arguments."),
      getArgument: get("/v1/arguments/:id", "Get one argument." + idNote),
    },
  },
  transactions: {
    title: "Transactions",
    description: "Transaction queries, saved transaction views and asynchronous transaction jobs.",
    ops: {
      query: search("/v1/transactions/query", "Query transactions." + bodyNote),
      runView: get(
        "/v1/transactions/views/:id/results",
        "Run a saved transaction view. Set params portfolio_id, portfolio_type, start_date, end_date." + idNote,
      ),
      listJobs: list("/v1/transaction_jobs", "List transaction export jobs."),
      getJob: get("/v1/transaction_jobs/:id", "Get a transaction job's status." + idNote),
      createJob: create("/v1/transaction_jobs", "Start a transaction export job." + bodyNote),
      downloadJob: {
        method: "GET",
        path: "/v1/transaction_jobs/:id/download",
        description: "Download a completed transaction job's results (available for 24 hours)." + idNote,
        download: true,
      },
      deleteJob: remove("/v1/transaction_jobs/:id", "Delete a transaction job." + idNote),
    },
  },
  benchmarks: {
    title: "Benchmarks",
    description: "Benchmark definitions.",
    ops: {
      list: list("/v1/benchmarks", "List benchmarks."),
      get: get("/v1/benchmarks/:id", "Get one benchmark." + idNote),
      create: create("/v1/benchmarks", "Create a benchmark." + bodyNote),
      update: update("/v1/benchmarks/:id?", "Update a benchmark, or many." + idNote + bulkNote + bodyNote),
      delete: remove("/v1/benchmarks/:id", "Delete a benchmark." + idNote),
    },
  },
  snapshots: {
    title: "Snapshots",
    description: "Saved snapshots of portfolio data.",
    ops: {
      get: get("/v1/snapshots/:id", "Get one snapshot." + idNote),
      create: create("/v1/snapshots", "Create a snapshot." + bodyNote),
      update: update("/v1/snapshots/:id?", "Update a snapshot, or many." + idNote + bulkNote + bodyNote),
      delete: remove("/v1/snapshots/:id?", "Delete a snapshot, or many." + idNote + bulkNote),
    },
  },
  allocations: {
    title: "Target allocations",
    description: "Allocation models and templates.",
    ops: {
      listModels: list("/v1/allocation_models", "List allocation models."),
      getModel: get("/v1/allocation_models/:id", "Get one allocation model." + idNote),
      createModel: create("/v1/allocation_models", "Create an allocation model." + bodyNote),
      updateModel: update("/v1/allocation_models/:id", "Update an allocation model." + idNote + bodyNote),
      deleteModel: remove("/v1/allocation_models/:id", "Delete an allocation model." + idNote),
      listTemplates: list("/v1/allocation_templates", "List allocation templates."),
      getTemplate: get("/v1/allocation_templates/:id", "Get one allocation template." + idNote),
      createTemplate: create("/v1/allocation_templates", "Create an allocation template." + bodyNote),
      updateTemplate: update("/v1/allocation_templates/:id", "Update an allocation template." + idNote + bodyNote),
      replaceTemplate: { method: "PUT", path: "/v1/allocation_templates/:id", description: "Replace an allocation template." + idNote + bodyNote },
      deleteTemplate: remove("/v1/allocation_templates/:id", "Delete an allocation template." + idNote),
    },
  },
  reports: {
    title: "Reports",
    description: "Report list, report generation and generated reports.",
    ops: {
      list: list("/v1/reports", "List reports."),
      generate: create("/v1/report_generation_job", "Start a report generation job." + bodyNote),
      listGenerated: list("/v1/generated_reports", "List generated reports."),
      getGenerated: get("/v1/generated_reports/:id", "Get one generated report." + idNote),
      listViewSets: list("/v1/view_sets", "List view sets."),
      getViewSet: get("/v1/view_sets/:id", "Get one view set." + idNote),
    },
  },
  files: {
    title: "Files",
    description: "Files stored in Addepar (metadata; uploads are not supported).",
    ops: {
      list: list("/v1/files", "List files."),
      get: get("/v1/files/:id", "Get a file's metadata." + idNote),
      update: update("/v1/files/:id", "Update a file's metadata." + idNote + bodyNote),
      delete: remove("/v1/files/:id", "Delete a file." + idNote),
    },
  },
  users: {
    title: "Users",
    description: "Firm users, their roles and portfolio permissions.",
    ops: {
      me: get("/v1/users/me", "Get the user who owns the API key."),
      list: list("/v1/users", "List users."),
      get: get("/v1/users/:id", "Get one user." + idNote),
      findByEmail: search("/v1/users/email_query", "Find users by email address." + bodyNote),
      findByExternalId: search("/v1/users/external_user_id_query", "Find users by external user ID." + bodyNote),
      create: create("/v1/users", "Create a user." + bodyNote),
      update: update("/v1/users/:id", "Update a user." + idNote + bodyNote),
      delete: remove("/v1/users/:id", "Delete a user." + idNote),
      getAssignedRole: get("/v1/users/:id/relationships/assigned_role", "Get a user's role." + idNote),
      setAssignedRole: update("/v1/users/:id/relationships/assigned_role", "Assign a role to a user." + idNote + bodyNote),
      listPermissionedEntities: list("/v1/users/:id/relationships/permissioned_entities", "List entities a user may access." + idNote),
      grantEntities: create("/v1/users/:id/relationships/permissioned_entities", "Grant a user access to entities." + idNote + bodyNote),
      revokeEntities: remove("/v1/users/:id/relationships/permissioned_entities", "Revoke a user's access to entities." + idNote + bodyNote),
      listPermissionedGroups: list("/v1/users/:id/relationships/permissioned_groups", "List groups a user may access." + idNote),
      grantGroups: create("/v1/users/:id/relationships/permissioned_groups", "Grant a user access to groups." + idNote + bodyNote),
      revokeGroups: remove("/v1/users/:id/relationships/permissioned_groups", "Revoke a user's access to groups." + idNote + bodyNote),
    },
  },
  teams: {
    title: "Teams",
    description: "Teams and their members.",
    ops: {
      list: list("/v1/teams", "List teams."),
      get: get("/v1/teams/:id", "Get one team." + idNote),
      create: create("/v1/teams", "Create a team." + bodyNote),
      update: update("/v1/teams/:id", "Update a team." + idNote + bodyNote),
      delete: remove("/v1/teams/:id", "Delete a team." + idNote),
      listMembers: list("/v1/teams/:id/relationships/members", "List a team's members." + idNote),
      addMembers: create("/v1/teams/:id/relationships/members", "Add members to a team." + idNote + bodyNote),
      replaceMembers: update("/v1/teams/:id/relationships/members", "Replace a team's members." + idNote + bodyNote),
      removeMembers: remove("/v1/teams/:id/relationships/members", "Remove members from a team." + idNote + bodyNote),
    },
  },
  roles: {
    title: "Roles",
    description: "Roles and the users assigned to them.",
    ops: {
      list: list("/v1/roles", "List roles."),
      get: get("/v1/roles/:id", "Get one role." + idNote),
      listAssignedUsers: list("/v1/roles/:id/assigned_users", "List users assigned to a role." + idNote),
      assignUsers: create("/v1/roles/:id/relationships/assigned_users", "Assign users to a role." + idNote + bodyNote),
      replaceAssignedUsers: update("/v1/roles/:id/relationships/assigned_users", "Replace the users assigned to a role." + idNote + bodyNote),
      unassignUsers: remove("/v1/roles/:id/relationships/assigned_users", "Unassign users from a role." + idNote + bodyNote),
    },
  },
  contacts: {
    title: "Contacts",
    description: "Client portal contacts and their affiliations.",
    ops: {
      list: list("/v1/contacts", "List contacts."),
      get: get("/v1/contacts/:id", "Get one contact." + idNote),
      create: create("/v1/contacts", "Create a contact." + bodyNote),
      update: update("/v1/contacts/:id", "Update a contact." + idNote + bodyNote),
      delete: remove("/v1/contacts/:id", "Delete a contact." + idNote),
      invite: create("/v1/contacts/:id/invite", "Send a contact an invitation to the client portal." + idNote),
      restore: update("/v1/contacts/:id/restore", "Restore a revoked contact." + idNote),
      revoke: update("/v1/contacts/:id/revoke", "Revoke a contact's portal access." + idNote),
      listEntityAffiliations: list("/v1/contacts/:id/relationships/entity_affiliations", "List a contact's entity affiliations." + idNote),
      addEntityAffiliations: create("/v1/contacts/:id/relationships/entity_affiliations", "Add entity affiliations to a contact." + idNote + bodyNote),
      replaceEntityAffiliations: update("/v1/contacts/:id/relationships/entity_affiliations", "Replace a contact's entity affiliations." + idNote + bodyNote),
      removeEntityAffiliations: remove("/v1/contacts/:id/relationships/entity_affiliations", "Remove a contact's entity affiliations." + idNote + bodyNote),
      listGroupAffiliations: list("/v1/contacts/:id/relationships/group_affiliations", "List a contact's group affiliations." + idNote),
      addGroupAffiliations: create("/v1/contacts/:id/relationships/group_affiliations", "Add group affiliations to a contact." + idNote + bodyNote),
      replaceGroupAffiliations: update("/v1/contacts/:id/relationships/group_affiliations", "Replace a contact's group affiliations." + idNote + bodyNote),
      removeGroupAffiliations: remove("/v1/contacts/:id/relationships/group_affiliations", "Remove a contact's group affiliations." + idNote + bodyNote),
      getTeam: get("/v1/contacts/:id/relationships/team", "Get a contact's team." + idNote),
      setTeam: update("/v1/contacts/:id/relationships/team", "Set a contact's team." + idNote + bodyNote),
      removeTeam: remove("/v1/contacts/:id/relationships/team", "Remove a contact from its team." + idNote),
    },
  },
  audit: {
    title: "Audit",
    description: "Audit trail of changes in the firm.",
    ops: {
      search: search("/v1/audit_trail", "Search the audit trail." + bodyNote),
      get: get("/v1/audit_trail/:id", "Get one audit trail record." + idNote),
    },
  },
};

const idSchema = string({ minLength: 1 });
const paramsSchema = record(string());
const bodySchema = json();

function build(fields: Fields, fetcher: typeof fetch, signal: AbortSignal | undefined) {
  const origin = `https://${normalizeSubdomain(fields.subdomain)}.addepar.com/api`;

  const toolFor = (o: Op) => {
    const optionalId = o.path.includes(":id?");
    const needsId = o.path.includes(":id");
    const shape: Record<string, Schema<unknown, boolean>> = {};
    if (needsId) shape.id = optionalId ? idSchema.optional() : idSchema;
    if (o.method === "GET") shape.params = paramsSchema.optional();
    const bodyless = o.method === "DELETE" || /\/(invite|restore|revoke)$/.test(o.path);
    if (o.method !== "GET") shape.body = bodyless ? bodySchema.optional() : bodySchema;
    const input = object(shape as never) as unknown as Schema<Input, boolean>;
    const run = async (_ctx: unknown, args: Input) => {
      let path = o.path;
      if (path.includes(":date")) {
        const [entity, date] = (args.id ?? "").split("/");
        if (!entity || !date) throw new Error("Pass id as <entityId>/<YYYY-MM-DD>.");
        path = path.replace(":id", encodeURIComponent(entity)).replace(":date", encodeURIComponent(date));
      } else if (path.includes(":id?")) {
        path = args.id ? path.replace(":id?", encodeURIComponent(args.id)) : path.replace("/:id?", "");
      } else if (path.includes(":id")) {
        if (!args.id) throw new Error("id is required.");
        path = path.replace(":id", encodeURIComponent(args.id));
      }
      const search = args.params
        ? "?" + Object.entries(args.params).map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join("&")
        : "";
      const withBody = args.body !== undefined;
      const response = await fetcher(`${origin}${path}${search}`, {
        method: o.method,
        signal,
        headers: headers(fields, withBody),
        ...(withBody ? { body: JSON.stringify(args.body) } : {}),
      });
      if (o.download === true) {
        const text = await response.text();
        if (!response.ok) throw new Error(`Addepar returned ${response.status}: ${text.slice(0, 500)}`);
        try {
          return JSON.parse(text) as unknown;
        } catch {
          return { text };
        }
      }
      if (response.status === 204) return { status: 204 };
      return decodeJson(response, json());
    };
    const options = { description: o.description, input };
    const isRead = o.method === "GET" || o.read === true;
    return isRead ? query(options, run) : mutation(options, run);
  };

  return router(
    Object.fromEntries(
      Object.entries(groups).map(([key, g]) => [
        key,
        router(Object.fromEntries(Object.entries(g.ops).map(([name, o]) => [name, toolFor(o)])), {
          title: g.title,
          description: g.description,
        }),
      ]),
    ),
  );
}

export default defineApp(
  { user: { accounts: { addepar: addepar.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.addepar ?? [],
        (account) =>
          withApprovals(build(account.fields, fetch, signal), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Addepar",
        description:
          "Wealth-management portfolio data in Addepar: portfolio queries and views, entities, positions, groups, transactions, benchmarks, users, teams and reports.",
        instructions:
          "Requests use the permissions of the user who created the API key. For portfolio analytics use portfolio.query (up to 100 entities, or small queries) or jobs.create then jobs.download for large ones. Bodies are JSON:API documents.",
        icons,
      },
    ),
  }),
);
