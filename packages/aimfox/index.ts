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
  router,
  secrets,
  string,
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const base = "https://api.aimfox.com/api/v3";

const aimfox = defineProvider({
  name: "Aimfox",
  hosts: ["api.aimfox.com"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // Labels are readable with a normal read-only or full key; master keys are rejected on workspace routes.
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/labels`, {
      signal,
      headers: { Authorization: `Bearer ${account.fields.token}` },
    });
    await decodeJson(response, object({}));
  },
});

type Fetch = typeof fetch;
type Call = (
  method: string,
  path: string,
  query: ReadonlyArray<readonly [string, string | number | undefined]>,
  body: unknown,
) => Promise<unknown>;

const seg = (value: string) => encodeURIComponent(value);

function client(token: string, fetcher: Fetch, signal: AbortSignal | undefined): Call {
  return async (method, path, query, body) => {
    const url = new URL(`${base}${path}`);
    for (const [key, value] of query) if (value !== undefined) url.searchParams.set(key, String(value));
    const response = await fetcher(url.toString(), {
      method,
      signal,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(body === undefined ? {} : { "Content-Type": "application/json" }),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    return decodeJson(response, json());
  };
}

function build(call: Call) {
  return router(
    {
  workspaces: router(
    {
    createWorkspace: mutation(
      {
        description: "Creates a new workspace. Body example: {\"name\":\"New Workspace\"}",
        input: object({ body: json() }),
      },
      async (_ctx, input) => call("POST", `/workspaces`, [], input.body),
    ),
    createWorkspaceToken: mutation(
      {
        description: "Creates an API token for a specific workspace. Body example: {\"name\":\"Master Token\",\"write\":true}",
        input: object({ workspace_id: string({ minLength: 1 }), body: json() }),
      },
      async (_ctx, input) => call("POST", `/workspaces/${seg(input.workspace_id)}/tokens`, [], input.body),
    ),
    getWorkspaceTokens: query(
      {
        description: "Returns all API tokens of a specific workspace.",
        input: object({ workspace_id: string({ minLength: 1 }) }),
      },
      async (_ctx, input) => call("GET", `/workspaces/${seg(input.workspace_id)}/tokens`, [], undefined),
    ),
    listWorkspaces: query(
      {
        description: "Returns all workspaces associated with the provided Master API key.",
        input: object({  }),
      },
      async (_ctx, input) => call("GET", `/workspaces`, [], undefined),
    ),
    },
    { title: "Workspaces", description: "Workspaces and their API tokens (needs a master API key)." },
  ),
  whiteLabel: router(
    {
    generateClientToken: mutation(
      {
        description: "Generates a login token for a client using their email address. The token can be appended to your whitelabel login URL to authenticate the client directly. Body example: {\"email\":\"john.doe@gmail.com\"}",
        input: object({ body: json() }),
      },
      async (_ctx, input) => call("POST", `/clients/token`, [], input.body),
    ),
    createClient: mutation(
      {
        description: "Creates a new client. Body example: {\"first_name\":\"John\",\"last_name\":\"Doe\",\"email\":\"john.doe@gmail.com\",\"skip_login_email\":true}",
        input: object({ body: json() }),
      },
      async (_ctx, input) => call("POST", `/clients`, [], input.body),
    ),
    },
    { title: "White label", description: "White-label clients (needs a master API key)." },
  ),
  loginTokens: router(
    {
    generateLoginToken: mutation(
      {
        description: "Generates a login token that can be appended to your whitelabel login URL to authenticate a user directly. Body example: {\"account_id\":\"123456\"}",
        input: object({ body: json() }),
      },
      async (_ctx, input) => call("POST", `/token`, [], input.body),
    ),
    },
    { title: "Login tokens", description: "Login tokens for the Aimfox dashboard." },
  ),
  accounts: router(
    {
    listAccounts: query(
      {
        description: "Retrieves all LinkedIn accounts in a specific workspace.",
        input: object({  }),
      },
      async (_ctx, input) => call("GET", `/accounts`, [], undefined),
    ),
    getAccount: query(
      {
        description: "Retrieves the details of a specific account.",
        input: object({ account_id: string({ minLength: 1 }) }),
      },
      async (_ctx, input) => call("GET", `/accounts/${seg(input.account_id)}/profile`, [], undefined),
    ),
    getAccountLimits: query(
      {
        description: "Retrieves the interaction limits for an account: its Connect and InMail limits (the workspace default unless set for this account) and its warm-up state.",
        input: object({ account_id: string({ minLength: 1 }) }),
      },
      async (_ctx, input) => call("GET", `/accounts/${seg(input.account_id)}/limits`, [], undefined),
    ),
    setAccountLimits: mutation(
      {
        description: "Updates the interaction limits for a specific account. Send only the fields you want to change; the response is the account's limits after the update (as in **Get Account Limits**). Body example: {\"connect\":75,\"inmail\":100,\"warmup\":{\"enabled\":true,\"connect\":10,\"inmail\":10,\"speed\":\"MEDIUM\"}}",
        input: object({ account_id: string({ minLength: 1 }), body: json() }),
      },
      async (_ctx, input) => call("PATCH", `/accounts/${seg(input.account_id)}/limits`, [], input.body),
    ),
    getAccountFile: query(
      {
        description: "Fetches a file from the given LinkedIn URL using the specified account and streams it back.",
        input: object({ account_id: string({ minLength: 1 }), url: string().optional() }),
      },
      async (_ctx, input) => call("GET", `/accounts/${seg(input.account_id)}/file`, [["url", input.url]], undefined),
    ),
    },
    { title: "Accounts", description: "Connected LinkedIn accounts, their profiles and interaction limits." },
  ),
  analytics: router(
    {
    listRecentLeads: query(
      {
        description: "Retrieves the workspace's most recent leads: campaign targets that recently became leads (for example by accepting a connection request), with the campaign and the lead's profile. Body example: {\"account_ids\":[\"123345678\"]}",
        input: object({ body: json().optional() }),
      },
      async (_ctx, input) => call("POST", `/analytics/recent-leads`, [], input.body),
    ),
    listInteractions: query(
      {
        description: "Retrieves all interactions for a specific workspace. Body example: {\"account_ids\":[\"123345678\"]}",
        input: object({ bucket: string().optional(), from: string().optional(), to: string().optional(), campaign_id: string().optional(), body: json().optional() }),
      },
      async (_ctx, input) => call("POST", `/analytics/interactions`, [["bucket", input.bucket], ["from", input.from], ["to", input.to], ["campaign_id", input.campaign_id]], input.body),
    ),
    },
    { title: "Analytics", description: "Interaction and recent-lead analytics." },
  ),
  blacklist: router(
    {
    searchBlacklistedProfiles: query(
      {
        description: "Searches the LinkedIn profiles blacklisted in your workspace and returns one page of results. Body example: {\"keyword\":\"\",\"locations\":[],\"current_companies\":[],\"past_companies\":[],\"schools\":[],\"languages\":[],\"premium\":false}",
        input: object({ page: number().optional(), size: number().optional(), body: json().optional() }),
      },
      async (_ctx, input) => call("POST", `/blacklist:search`, [["page", input.page], ["size", input.size]], input.body),
    ),
    listBlacklistedCompanies: query(
      {
        description: "Retrieves one page of the LinkedIn companies blacklisted in your workspace.",
        input: object({ page: number().optional(), size: number().optional() }),
      },
      async (_ctx, input) => call("GET", `/blacklist-companies`, [["page", input.page], ["size", input.size]], undefined),
    ),
    addCompaniesToBlacklist: mutation(
      {
        description: "Blacklists multiple LinkedIn companies. Body example: {\"companies\":[\"https://www.linkedin.com/company/ubisoft/\"]}",
        input: object({ body: json() }),
      },
      async (_ctx, input) => call("POST", `/blacklist-companies`, [], input.body),
    ),
    addProfileToBlacklist: mutation(
      {
        description: "Adds a LinkedIn profile to your workspace blacklist using their URN, preventing any further interactions or campaign operations from targeting that profile.",
        input: object({ urn: string({ minLength: 1 }) }),
      },
      async (_ctx, input) => call("POST", `/blacklist/${seg(input.urn)}`, [], undefined),
    ),
    addProfilesToBlacklist: mutation(
      {
        description: "Adds one or more LinkedIn profiles to your workspace blacklist using their LinkedIn URLs, preventing any further interactions or campaign operations from targeting those profiles. Body example: {\"urls\":[\"https://www.linkedin.com/in/ognjen-bjeletic-bb1869208/\"]}",
        input: object({ body: json() }),
      },
      async (_ctx, input) => call("POST", `/blacklist`, [], input.body),
    ),
    removeProfileFromBlacklist: mutation(
      {
        description: "Removes a LinkedIn profile from your workspace blacklist using their URN.",
        input: object({ urn: string({ minLength: 1 }) }),
      },
      async (_ctx, input) => call("DELETE", `/blacklist/${seg(input.urn)}`, [], undefined),
    ),
    removeCompanyFromBlacklist: mutation(
      {
        description: "Removes a LinkedIn company from your workspace blacklist using their URN.",
        input: object({ company_urn: string({ minLength: 1 }) }),
      },
      async (_ctx, input) => call("DELETE", `/blacklist-companies/${seg(input.company_urn)}`, [], undefined),
    ),
    },
    { title: "Blacklist", description: "Profiles and companies excluded from all outreach." },
  ),
  campaigns: router(
    {
    listCampaigns: query(
      {
        description: "Retrieves all campaigns in your workspace, including each campaign's details and current status. Body example: {\"account_ids\":[\"123345678\"]}",
        input: object({ outreach_type: string().optional(), body: json().optional() }),
      },
      async (_ctx, input) => call("POST", `/campaigns:search`, [["outreach_type", input.outreach_type]], input.body),
    ),
    createCampaign: mutation(
      {
        description: "Creates a new Aimfox campaign in the `INIT` state. Body example: {\"name\":\"Q4 Connection Campaign\",\"outreach_type\":\"connect\",\"account_ids\":[\"885983605\"]}",
        input: object({ body: json() }),
      },
      async (_ctx, input) => call("POST", `/campaigns`, [], input.body),
    ),
    getCampaign: query(
      {
        description: "Retrieves detailed information about a specific campaign, including its attributes, current status, and associated data.",
        input: object({ campaign_id: string({ minLength: 1 }) }),
      },
      async (_ctx, input) => call("GET", `/campaigns/${seg(input.campaign_id)}`, [], undefined),
    ),
    searchCampaignTargets: query(
      {
        description: "Searches the targets of an Aimfox campaign and returns a page of matching targets together with facet counts. Body example: {\"states\":[\"init\"],\"keyword\":\"\",\"locations\":[],\"current_companies\":[],\"past_companies\":[],\"schools\":[],\"languages\":[],\"premium\":false}",
        input: object({ campaign_id: string({ minLength: 1 }), page: number().optional(), size: number().optional(), body: json().optional() }),
      },
      async (_ctx, input) => call("POST", `/campaigns/${seg(input.campaign_id)}/targets:search`, [["page", input.page], ["size", input.size]], input.body),
    ),
    deleteCampaign: mutation(
      {
        description: "Deletes a campaign from your workspace and cancels all of its targets. It can't be undone through the API; the campaign's list is kept. To stop a campaign but keep it, set its `state` to `ARCHIVED` with **Update Campaign** instead.",
        input: object({ campaign_id: string({ minLength: 1 }) }),
      },
      async (_ctx, input) => call("DELETE", `/campaigns/${seg(input.campaign_id)}`, [], undefined),
    ),
    getCampaignMetrics: query(
      {
        description: "Retrieves the interaction metrics for a specific campaign. Body example: {\"account_ids\":[\"123345678\"]}",
        input: object({ campaign_id: string({ minLength: 1 }), body: json().optional() }),
      },
      async (_ctx, input) => call("POST", `/campaigns/${seg(input.campaign_id)}/metrics`, [], input.body),
    ),
    addTargetsToCampaign: mutation(
      {
        description: "Adds one or more LinkedIn profiles as targets to an Aimfox campaign, each with its own custom variables. Body example: {\"type\":\"profile_url\",\"profiles\":[{\"profile_url\":\"https://www.linkedin.com/in/john-doe/\",\"custom_variables\":{\"first name\":\"John\",\"last name\":\"Doe\"}}]}",
        input: object({ campaign_id: string({ minLength: 1 }), body: json() }),
      },
      async (_ctx, input) => call("POST", `/campaigns/${seg(input.campaign_id)}/targets`, [], input.body),
    ),
    removeTargetFromCampaign: mutation(
      {
        description: "Removes a specific target from an Aimfox campaign using their Public Identifier.",
        input: object({ campaign_id: string({ minLength: 1 }), public_identifier: string({ minLength: 1 }) }),
      },
      async (_ctx, input) => call("DELETE", `/campaigns/${seg(input.campaign_id)}/targets/${seg(input.public_identifier)}`, [], undefined),
    ),
    updateCampaign: mutation(
      {
        description: "Updates a campaign's settings or changes its state. Send only the fields you want to change; the response is the updated campaign (as in **Get Campaign**). Body example: {\"name\":\"Q4 Connection Campaign\",\"state\":\"PAUSED\",\"exclude_active_targets\":false,\"exclude_previous_targets\":true}",
        input: object({ campaign_id: string({ minLength: 1 }), body: json() }),
      },
      async (_ctx, input) => call("PATCH", `/campaigns/${seg(input.campaign_id)}`, [], input.body),
    ),
    deleteCampaignTargets: mutation(
      {
        description: "Removes targets from an Aimfox campaign, either by an explicit list of URNs or by filter. Body example: {\"urns\":[\"ACoAACLJ24MBzmiDMnvfLfdTJgMutVzE2bTVppk\"]}",
        input: object({ campaign_id: string({ minLength: 1 }), body: json() }),
      },
      async (_ctx, input) => call("POST", `/campaigns/${seg(input.campaign_id)}/targets:delete`, [], input.body),
    ),
    exportCampaignTargets: query(
      {
        description: "Exports the targets of an Aimfox campaign, either by an explicit list of URNs or by filter, without pagination. Body example: {\"states\":[\"init\"],\"keyword\":\"\"}",
        input: object({ campaign_id: string({ minLength: 1 }), body: json().optional() }),
      },
      async (_ctx, input) => call("POST", `/campaigns/${seg(input.campaign_id)}/targets:export`, [], input.body),
    ),
    getCampaignCustomVariables: query(
      {
        description: "Retrieves all custom variables associated with a specific campaign.",
        input: object({ campaign_id: string({ minLength: 1 }) }),
      },
      async (_ctx, input) => call("GET", `/campaigns/${seg(input.campaign_id)}/custom-variables`, [], undefined),
    ),
    getCampaignTargetCustomVariables: query(
      {
        description: "Retrieves all custom variables associated with a specific target within an Aimfox campaign.",
        input: object({ campaign_id: string({ minLength: 1 }), urn: string({ minLength: 1 }) }),
      },
      async (_ctx, input) => call("GET", `/campaigns/${seg(input.campaign_id)}/custom-variables/${seg(input.urn)}`, [], undefined),
    ),
    addCustomVariablesToTarget: mutation(
      {
        description: "Adds custom variables to a specific target within an Aimfox campaign. Body example: {\"custom_variables\":[{\"target_urn\":\"ACoAAALFnSUBDfSrz2kO3C8PelRi1DHIPNWuOlo\",\"variables\":{\"CUSTOM_MESSAGE\":\"Hello there\"}}]}",
        input: object({ campaign_id: string({ minLength: 1 }), body: json() }),
      },
      async (_ctx, input) => call("POST", `/campaigns/${seg(input.campaign_id)}/custom-variables`, [], input.body),
    ),
    },
    { title: "Campaigns", description: "Outreach campaigns, their targets, metrics and custom variables." },
  ),
  labels: router(
    {
    listWorkspaceLabels: query(
      {
        description: "Retrieves all labels associated with your workspace.",
        input: object({  }),
      },
      async (_ctx, input) => call("GET", `/labels`, [], undefined),
    ),
    addLabelToWorkspace: mutation(
      {
        description: "Adds a new label to your workspace. Body example: {\"name\":\"test3\",\"color\":\"info\"}",
        input: object({ body: json() }),
      },
      async (_ctx, input) => call("POST", `/labels`, [], input.body),
    ),
    editWorkspaceLabel: mutation(
      {
        description: "Updates an existing label in your workspace. Body example: {\"name\":\"test23\",\"color\":\"info\"}",
        input: object({ label_id: string({ minLength: 1 }), body: json() }),
      },
      async (_ctx, input) => call("PATCH", `/labels/${seg(input.label_id)}`, [], input.body),
    ),
    deleteWorkspaceLabel: mutation(
      {
        description: "Removes a specific label from your workspace.",
        input: object({ label_id: string({ minLength: 1 }) }),
      },
      async (_ctx, input) => call("DELETE", `/labels/${seg(input.label_id)}`, [], undefined),
    ),
    },
    { title: "Labels", description: "Workspace labels." },
  ),
  leads: router(
    {
    getLeadDetails: query(
      {
        description: "Retrieves all data associated with a specific lead. Body example: {\"account_ids\":[\"123345678\"]}",
        input: object({ lead_id: string({ minLength: 1 }), body: json().optional() }),
      },
      async (_ctx, input) => call("POST", `/leads/${seg(input.lead_id)}`, [], input.body),
    ),
    getLeadCustomVariables: query(
      {
        description: "Retrieves all custom variables associated with a specific lead.",
        input: object({ account_id: string({ minLength: 1 }), lead_urn: string({ minLength: 1 }) }),
      },
      async (_ctx, input) => call("GET", `/accounts/${seg(input.account_id)}/leads/${seg(input.lead_urn)}/custom-variables`, [], undefined),
    ),
    addLabelToLead: mutation(
      {
        description: "Adds a label to a specific lead.",
        input: object({ lead_id: string({ minLength: 1 }), label_id: string({ minLength: 1 }) }),
      },
      async (_ctx, input) => call("POST", `/leads/${seg(input.lead_id)}/labels/${seg(input.label_id)}`, [], undefined),
    ),
    searchLeads: query(
      {
        description: "Searches through all leads in your workspace. Body example: {\"keywords\":\"\",\"current_companies\":[],\"past_companies\":[],\"education\":[],\"interests\":[],\"labels\":[],\"languages\":[],\"locations\":[],\"origins\":[],\"skills\":[],\"lead_of\":[],\"optimize\":false}",
        input: object({ start: number().optional(), count: number().optional(), body: json().optional() }),
      },
      async (_ctx, input) => call("POST", `/leads:search`, [["start", input.start], ["count", input.count]], input.body),
    ),
    searchLeadFacets: query(
      {
        description: "Returns the values of one filter \u2014 the `:name` facet \u2014 among the leads matching the search, with the number of leads for each value. Use it to build filter options; the body takes the same filters as **Search Leads**. Body example: {\"keywords\":\"\",\"current_companies\":[],\"past_companies\":[],\"education\":[],\"interests\":[],\"labels\":[],\"languages\":[],\"locations\":[],\"origins\":[],\"skills\":[],\"lead_of\":[],\"optimize\":false}",
        input: object({ name: string({ minLength: 1 }), body: json().optional() }),
      },
      async (_ctx, input) => call("POST", `/leads:search/facets/${seg(input.name)}`, [], input.body),
    ),
    getTotalLeadsCount: query(
      {
        description: "Retrieves the total count of leads matching the provided filters. Body example: {\"keywords\":\"\",\"current_companies\":[],\"past_companies\":[],\"education\":[],\"interests\":[],\"labels\":[],\"languages\":[],\"locations\":[],\"origins\":[],\"skills\":[],\"lead_of\":[],\"optimize\":false}",
        input: object({ body: json().optional() }),
      },
      async (_ctx, input) => call("POST", `/leads:search/total`, [], input.body),
    ),
    removeLabelFromLead: mutation(
      {
        description: "Removes a label from a specific lead. Body example: {\"account_ids\":[\"123345678\"]}",
        input: object({ lead_id: string({ minLength: 1 }), label_id: string({ minLength: 1 }), body: json() }),
      },
      async (_ctx, input) => call("POST", `/leads/${seg(input.lead_id)}/labels/${seg(input.label_id)}/delete`, [], input.body),
    ),
    listLeadNotes: query(
      {
        description: "Retrieves all notes associated with a specific lead.",
        input: object({ lead_id: string({ minLength: 1 }) }),
      },
      async (_ctx, input) => call("GET", `/leads/${seg(input.lead_id)}/notes`, [], undefined),
    ),
    createLeadNote: mutation(
      {
        description: "Adds a note to a specific lead. Body example: {\"text\":\"add note\"}",
        input: object({ lead_id: string({ minLength: 1 }), body: json() }),
      },
      async (_ctx, input) => call("POST", `/leads/${seg(input.lead_id)}/notes`, [], input.body),
    ),
    updateLeadNote: mutation(
      {
        description: "Updates a specific note associated with a lead. Body example: {\"text\":\"add note test 2\"}",
        input: object({ lead_id: string({ minLength: 1 }), note_id: string({ minLength: 1 }), body: json() }),
      },
      async (_ctx, input) => call("PATCH", `/leads/${seg(input.lead_id)}/notes/${seg(input.note_id)}`, [], input.body),
    ),
    deleteLeadNote: mutation(
      {
        description: "Removes a specific note from a lead.",
        input: object({ lead_id: string({ minLength: 1 }), note_id: string({ minLength: 1 }) }),
      },
      async (_ctx, input) => call("DELETE", `/leads/${seg(input.lead_id)}/notes/${seg(input.note_id)}`, [], undefined),
    ),
    },
    { title: "Leads", description: "Search leads; manage lead labels and notes." },
  ),
  messages: router(
    {
    listConversations: query(
      {
        description: "Retrieves all conversations associated with your workspace. Body example: {\"account_ids\":[\"123345678\"]}",
        input: object({ in_app: string().optional(), before: string().optional(), campaigns: string().optional(), unread: string().optional(), body: json().optional() }),
      },
      async (_ctx, input) => call("POST", `/conversations`, [["in_app", input.in_app], ["before", input.before], ["campaigns", input.campaigns], ["unread", input.unread]], input.body),
    ),
    getConversation: query(
      {
        description: "Retrieves the details of a specific conversation using the conversation URN.",
        input: object({ account_id: string({ minLength: 1 }), conversation_urn: string({ minLength: 1 }) }),
      },
      async (_ctx, input) => call("GET", `/accounts/${seg(input.account_id)}/conversations/${seg(input.conversation_urn)}`, [], undefined),
    ),
    getLeadConversation: query(
      {
        description: "Retrieves the conversation URN for a conversation with a specific lead.",
        input: object({ account_id: string({ minLength: 1 }), lead_id: string({ minLength: 1 }) }),
      },
      async (_ctx, input) => call("GET", `/accounts/${seg(input.account_id)}/leads/${seg(input.lead_id)}/conversation`, [], undefined),
    ),
    startConversation: mutation(
      {
        description: "Starts a conversation from the given account with one or more LinkedIn members and sends the first message. Body example: {\"message\":\"test\",\"recipients\":[\"1113575873\"]}",
        input: object({ account_id: string({ minLength: 1 }), body: json() }),
      },
      async (_ctx, input) => call("POST", `/accounts/${seg(input.account_id)}/conversations`, [], input.body),
    ),
    sendMessageToConversation: mutation(
      {
        description: "Sends a message to an existing conversation. Body example: {\"message\":\"\"}",
        input: object({ account_id: string({ minLength: 1 }), conversation_urn: string({ minLength: 1 }), body: json() }),
      },
      async (_ctx, input) => call("POST", `/accounts/${seg(input.account_id)}/conversations/${seg(input.conversation_urn)}`, [], input.body),
    ),
    readAConversation: mutation(
      {
        description: "Marks a specific conversation as read, setting its status to `seen`.",
        input: object({ account_id: string({ minLength: 1 }), conversation_urn: string({ minLength: 1 }) }),
      },
      async (_ctx, input) => call("POST", `/accounts/${seg(input.account_id)}/conversations/${seg(input.conversation_urn)}/mark-as-read`, [], undefined),
    ),
    reactToMessage: mutation(
      {
        description: "Adds a reaction to a specific message in a conversation. Body example: {\"emoji\":\"\\ud83d\\udc80\",\"unreact\":false}",
        input: object({ account_id: string({ minLength: 1 }), conversation_urn: string({ minLength: 1 }), message_id: string({ minLength: 1 }), body: json() }),
      },
      async (_ctx, input) => call("POST", `/accounts/${seg(input.account_id)}/conversations/${seg(input.conversation_urn)}/messages/${seg(input.message_id)}/react`, [], input.body),
    ),
    editMessage: mutation(
      {
        description: "Edits a specific message in a conversation. Body example: {\"message\":\"test2\"}",
        input: object({ account_id: string({ minLength: 1 }), conversation_urn: string({ minLength: 1 }), message_id: string({ minLength: 1 }), body: json() }),
      },
      async (_ctx, input) => call("PATCH", `/accounts/${seg(input.account_id)}/conversations/${seg(input.conversation_urn)}/messages/${seg(input.message_id)}`, [], input.body),
    ),
    deleteMessage: mutation(
      {
        description: "Deletes a specific message from a conversation.",
        input: object({ account_id: string({ minLength: 1 }), conversation_urn: string({ minLength: 1 }), message_id: string({ minLength: 1 }) }),
      },
      async (_ctx, input) => call("DELETE", `/accounts/${seg(input.account_id)}/conversations/${seg(input.conversation_urn)}/messages/${seg(input.message_id)}`, [], undefined),
    ),
    },
    { title: "Messages", description: "LinkedIn conversations and messages sent through a connected account." },
  ),
  templates: router(
    {
    listTemplates: query(
      {
        description: "Retrieves all templates associated with your workspace, including each template's attributes and usage details.",
        input: object({  }),
      },
      async (_ctx, input) => call("GET", `/templates`, [], undefined),
    ),
    getTemplate: query(
      {
        description: "Retrieves the details of a specific template in your workspace.",
        input: object({ template_id: string({ minLength: 1 }) }),
      },
      async (_ctx, input) => call("GET", `/templates/${seg(input.template_id)}`, [], undefined),
    ),
    createTemplate: mutation(
      {
        description: "Creates a new template in your workspace. Body example: {\"name\":\"test\",\"type\":\"NOTE_TEMPLATE\",\"message\":\"Test message\",\"ai\":false}",
        input: object({ body: json() }),
      },
      async (_ctx, input) => call("POST", `/templates`, [], input.body),
    ),
    editTemplate: mutation(
      {
        description: "Updates a specific template in your workspace. Body example: {\"name\":\"Test Template\",\"message\":\"Test message\",\"ai\":false}",
        input: object({ template_id: string({ minLength: 1 }), body: json() }),
      },
      async (_ctx, input) => call("PATCH", `/templates/${seg(input.template_id)}`, [], input.body),
    ),
    deleteTemplate: mutation(
      {
        description: "Removes a specific template from your workspace.",
        input: object({ template_id: string({ minLength: 1 }) }),
      },
      async (_ctx, input) => call("DELETE", `/templates/${seg(input.template_id)}`, [], undefined),
    ),
    },
    { title: "Templates", description: "Message templates." },
  ),
  webhooks: router(
    {
    listWebhooks: query(
      {
        description: "Retrieves all webhooks associated with your workspace, including each webhook's attributes and configuration details.",
        input: object({  }),
      },
      async (_ctx, input) => call("GET", `/webhooks`, [], undefined),
    ),
    createWebhook: mutation(
      {
        description: "Creates a new webhook in your workspace. Body example: {\"name\":\"Aimfox Webhook\",\"events\":[\"account_logged_in\"],\"url\":\"https://0bf5-80-93-251-178.ngrok-free.app/api/v1/webhooks/char\",\"integration\":false}",
        input: object({ body: json() }),
      },
      async (_ctx, input) => call("POST", `/webhooks`, [], input.body),
    ),
    editWebhook: mutation(
      {
        description: "Updates an existing webhook in your workspace. Body example: {\"name\":\"Test Webhook\",\"events\":[\"account_logged_out\"],\"url\":\"https://localhost:5000/api/v1/webhooks\",\"headers\":{\"Authorization\":\"Bearer 123\"}}",
        input: object({ webhook_id: string({ minLength: 1 }), body: json() }),
      },
      async (_ctx, input) => call("PATCH", `/webhooks/${seg(input.webhook_id)}`, [], input.body),
    ),
    deleteWebhook: mutation(
      {
        description: "Removes a specific webhook from your workspace.",
        input: object({ webhook_id: string({ minLength: 1 }) }),
      },
      async (_ctx, input) => call("DELETE", `/webhooks/${seg(input.webhook_id)}`, [], undefined),
    ),
    },
    { title: "Webhooks", description: "Event webhooks." },
  ),
  lists: router(
    {
    createList: mutation(
      {
        description: "Creates a new, empty list. Add leads to it by creating a source (**Create List Source**). Body example: {\"name\":\"Q4 Prospects\"}",
        input: object({ body: json() }),
      },
      async (_ctx, input) => call("POST", `/lists`, [], input.body),
    ),
    listLists: query(
      {
        description: "Retrieves all lists in the workspace, with their lead count and the time the last lead was added (`last_updated_at`). Sources are not included; use **Get List** for those.",
        input: object({  }),
      },
      async (_ctx, input) => call("GET", `/lists`, [], undefined),
    ),
    getList: query(
      {
        description: "Retrieves a single list with its sources, the IDs of the campaigns using it, and the time the last lead was added (`last_updated_at`).",
        input: object({ list_id: string({ minLength: 1 }) }),
      },
      async (_ctx, input) => call("GET", `/lists/${seg(input.list_id)}`, [], undefined),
    ),
    updateList: mutation(
      {
        description: "Renames a list. Body example: {\"name\":\"Q4 Prospects (EMEA)\"}",
        input: object({ list_id: string({ minLength: 1 }), body: json() }),
      },
      async (_ctx, input) => call("PATCH", `/lists/${seg(input.list_id)}`, [], input.body),
    ),
    deleteList: mutation(
      {
        description: "Deletes a list and cancels any of its sources that are still collecting leads.",
        input: object({ list_id: string({ minLength: 1 }) }),
      },
      async (_ctx, input) => call("DELETE", `/lists/${seg(input.list_id)}`, [], undefined),
    ),
    searchListLeads: query(
      {
        description: "Searches the leads in a list and returns a page of matching leads together with facet counts. Body example: {\"keyword\":\"\",\"locations\":[],\"current_companies\":[],\"past_companies\":[],\"schools\":[],\"languages\":[],\"premium\":false,\"source_ids\":[],\"removed\":false,\"blacklisted\":false}",
        input: object({ list_id: string({ minLength: 1 }), page: number().optional(), size: number().optional(), body: json().optional() }),
      },
      async (_ctx, input) => call("POST", `/lists/${seg(input.list_id)}/leads:search`, [["page", input.page], ["size", input.size]], input.body),
    ),
    getListCustomVariables: query(
      {
        description: "Retrieves the custom variable keys used in a list and the values stored for each lead.",
        input: object({ list_id: string({ minLength: 1 }) }),
      },
      async (_ctx, input) => call("GET", `/lists/${seg(input.list_id)}/custom-variables`, [], undefined),
    ),
    addCustomVariablesToList: mutation(
      {
        description: "Creates or updates custom variables for leads in a list. They can then be used to personalize message templates in campaigns that use the list. Body example: {\"custom_variables\":[{\"target_urn\":\"ACoAACLJ24MBzmiDMnvfLfdTJgMutVzE2bTVppk\",\"variables\":{\"first name\":\"John\",\"company\":\"Company d.o.o.\"}}]}",
        input: object({ list_id: string({ minLength: 1 }), body: json() }),
      },
      async (_ctx, input) => call("POST", `/lists/${seg(input.list_id)}/custom-variables`, [], input.body),
    ),
    getListSources: query(
      {
        description: "Retrieves the sources feeding a list, with their type, state, settings, collection progress (`progress`, 0\u2013100) and the number of leads each one contributed (`total`).",
        input: object({ list_id: string({ minLength: 1 }) }),
      },
      async (_ctx, input) => call("GET", `/lists/${seg(input.list_id)}/source`, [], undefined),
    ),
    createListSource: mutation(
      {
        description: "Adds a source to a list and immediately starts collecting the matching LinkedIn profiles into it. Track progress with **Get List Sources**. Body example: {\"type\":\"list\",\"settings\":{\"identifiers\":[\"john-doe\",\"jane-doe\"]}}",
        input: object({ list_id: string({ minLength: 1 }), body: json() }),
      },
      async (_ctx, input) => call("POST", `/lists/${seg(input.list_id)}/source`, [], input.body),
    ),
    },
    { title: "Lists", description: "Target lists that campaigns run on, and their sources." },
  ),    },
  );
}

export default defineApp(
  { user: { accounts: { aimfox: aimfox.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.aimfox ?? [],
        (account) =>
          withApprovals(build(client(account.fields.token, fetch, signal)), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Aimfox",
        description:
          "Aimfox LinkedIn outreach: campaigns, targets, lists, leads, conversations, templates, labels, webhooks and analytics.",
        icons,
        instructions:
        "The API allows 60 requests per minute across all routes. Read-only API keys can only call queries. Workspace routes need a normal workspace API key; workspaces, whiteLabel and loginTokens need a master key. Campaign/lead IDs are UUIDs; lead and account IDs are LinkedIn URNs/ids as returned by the list tools.",
      },
    ),
  }),
);
