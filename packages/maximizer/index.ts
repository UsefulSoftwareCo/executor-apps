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
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const origin = "https://api.maximizer.com";

type Account = { fields: { token: string } };

const maximizer = defineProvider({
  name: "Maximizer",
  hosts: ["api.maximizer.com"],
  auth: {
    // OAuth is not offered: Maximizer requires the PKCE method "SHA256" rather than the standard "S256".
    token: secrets({
      label: "Personal access token",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch(`${origin}/octopus/Read`, {
      method: "POST",
      signal,
      headers: { Authorization: `Bearer ${account.fields.token}`, "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ User: { Scope: { Fields: { Key: 1 } }, Criteria: { SearchQuery: {} } } }),
    });
    await decodeJson(response, json());
    return { accountInfo: { externalId: "maximizer", displayName: "Maximizer CRM", profileUrl: "https://developer.maximizer.com" } };
  },
});

// Octopus object names. `write` objects accept Create, Update and Delete.
const objects: { name: string; tool: string; description: string; write: boolean }[] = [
  { name: "AbEntry", tool: "contacts", description: "address book entries (companies, individuals and contacts of a company)", write: true },
  { name: "Lead", tool: "leads", description: "leads", write: true },
  { name: "Opportunity", tool: "opportunities", description: "sales opportunities", write: true },
  { name: "Task", tool: "tasks", description: "tasks", write: true },
  { name: "Note", tool: "notes", description: "notes", write: true },
  { name: "Appointment", tool: "appointments", description: "appointments", write: true },
  { name: "Case", tool: "cases", description: "customer service cases", write: true },
  { name: "Campaign", tool: "campaigns", description: "marketing campaigns", write: true },
  { name: "CampaignSubscriber", tool: "campaignSubscribers", description: "campaign subscribers", write: true },
  { name: "InteractionLog", tool: "interactionLogs", description: "interaction logs", write: true },
  { name: "Document", tool: "documents", description: "documents", write: true },
  { name: "Address", tool: "addresses", description: "addresses of address book entries", write: false },
  { name: "User", tool: "users", description: "Maximizer users", write: false },
  { name: "SalesTeam", tool: "salesTeams", description: "sales teams", write: false },
  { name: "Territory", tool: "territories", description: "territories", write: false },
  { name: "KeyFieldDefinition", tool: "keyFieldDefinitions", description: "key field (category) definitions", write: false },
  { name: "UdfDefinition", tool: "udfDefinitions", description: "user defined field definitions", write: false },
  { name: "SalesProcessSetup", tool: "salesProcessSetups", description: "sales process setups", write: false },
  { name: "SalesStageSetup", tool: "salesStageSetups", description: "sales stage setups", write: false },
  { name: "Workflow", tool: "workflows", description: "workflows", write: false },
];

const readNote =
  "fields lists the field names to return (Key is always useful). criteria is the Octopus Criteria object, for example { SearchQuery: { Company: { $LIKE: \"Acme%\" } }, Top: 10 } plus OrderBy/GroupBy; Top, $LT and $GT need the SQL searcher driver passed in configuration (see the Maximizer object docs). Keys are opaque base64 strings. Cloud limits: 30 requests per minute (Core) or 90 (Business).";

const readInput = object({
  fields: json(),
  criteria: json().optional(),
  configuration: json().optional(),
});

function build(account: Account, fetcher: typeof fetch, signal: AbortSignal | undefined) {
  const post = async (operation: "Read" | "Create" | "Update" | "Delete", body: unknown) => {
    const response = await fetcher(`${origin}/octopus/${operation}`, {
      method: "POST",
      signal,
      headers: {
        Authorization: `Bearer ${account.fields.token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(body),
    });
    const text = await response.text();
    if (!response.ok) throw new Error(`Maximizer answered ${response.status}: ${text.slice(0, 1000)}`);
    return text === "" ? { ok: true } : (JSON.parse(text) as unknown);
  };

  const tools: Record<string, unknown> = {};
  for (const o of objects) {
    const group: Record<string, unknown> = {
      read: query(
        { description: `Search ${o.description}. ${readNote}`, input: readInput },
        async (_ctx: unknown, input: { fields: unknown; criteria?: unknown; configuration?: unknown }) => {
          const names = Array.isArray(input.fields) ? input.fields : Object.keys((input.fields ?? {}) as object);
          const scope = Object.fromEntries((names as string[]).map((name) => [name, 1]));
          const body: Record<string, unknown> = {
            [o.name]: { Scope: { Fields: scope }, Criteria: input.criteria ?? { SearchQuery: {} } },
          };
          if (input.configuration !== undefined) body.Configuration = input.configuration;
          return post("Read", body);
        },
      ),
    };
    if (o.write) {
      group.create = mutation(
        {
          description: `Create a record in ${o.description}. data holds the fields as the Maximizer ${o.name} object documents them (https://developer.maximizer.com/reference/octopus-api).`,
          input: object({ data: json() }),
        },
        async (_ctx: unknown, input: { data: unknown }) => post("Create", { [o.name]: { Data: input.data } }),
      );
      group.update = mutation(
        {
          description: `Update a record in ${o.description}. data must include the record Key plus the fields to change.`,
          input: object({ data: json() }),
        },
        async (_ctx: unknown, input: { data: unknown }) => post("Update", { [o.name]: { Data: input.data } }),
      );
      group.delete = mutation(
        { description: `Delete a record from ${o.description} by Key.`, input: object({ key: string({ minLength: 1 }) }) },
        async (_ctx: unknown, input: { key: string }) => post("Delete", { [o.name]: { Data: { Key: input.key } } }),
      );
    }
    tools[o.tool] = router(group as never);
  }

  tools.fieldOptions = query(
    {
      description:
        "List the valid values of option fields of an object (for example Priority, Activity, Result or Category on Task). object is the Octopus object name such as Task or AbEntry; fields lists the option field names.",
      input: object({ object: string({ minLength: 1 }), fields: json() }),
    },
    async (_ctx: unknown, input: { object: string; fields: unknown }) => {
      const names = Array.isArray(input.fields) ? input.fields : Object.keys((input.fields ?? {}) as object);
      const options = Object.fromEntries((names as string[]).map((name) => [name, [{ Key: 1, DisplayValue: 1 }]]));
      return post("Read", { [input.object]: { FieldOptions: options }, Compatibility: { SchemaObject: "1.0" } });
    },
  );

  tools.request = mutation(
    {
      description:
        "Send any Octopus API request as documented at https://developer.maximizer.com/reference/octopus-api. operation is Read, Create, Update or Delete; body is the full JSON body (for example { \"Task\": { ... } }). Use for objects without a dedicated tool and for batch queries. Always requires approval.",
      input: object({ operation: string({ minLength: 1 }), body: json() }),
    },
    async (_ctx: unknown, input: { operation: string; body: unknown }) => {
      if (!["Read", "Create", "Update", "Delete"].includes(input.operation)) throw new Error("operation must be Read, Create, Update or Delete.");
      return post(input.operation as "Read", input.body);
    },
  );
  return router(tools as never);
}

export default defineApp(
  { user: { accounts: { maximizer: maximizer.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.maximizer ?? [],
        (account) =>
          withApprovals(build(account as unknown as Account, fetch, signal), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Maximizer",
        description:
          "Maximizer CRM: contacts and companies, leads, opportunities, tasks, notes, appointments, cases and campaigns.",
        instructions:
          "Every call is an Octopus API POST. Read tools take the field names to return and an optional Criteria object; write tools take the object's Data. Keys are opaque base64 strings from earlier reads. Use fieldOptions to look up valid values for option fields, and request for objects without a dedicated tool.",
        icons,
      },
    ),
  }),
);
