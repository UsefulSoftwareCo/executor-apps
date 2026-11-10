import {
  accountRouter,
  base64,
  boolean,
  decodeJson,
  defineApp,
  defineProvider,
  header,
  json,
  mutation,
  number,
  object,
  plain,
  query,
  router,
  secrets,
  string,
  t,
  withApprovals,
} from "apps";
import type { Schema } from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

// Every Freshservice account lives on its own host: https://<subdomain>.freshservice.com.
const siteUrl = (subdomain: string) => {
  const match = /^(?:https?:\/\/)?([a-z0-9][a-z0-9-]{0,61}[a-z0-9])(?:\.freshservice\.com)?\/?$/.exec(
    subdomain.trim().toLowerCase(),
  );
  if (match === null)
    throw new Error("Enter the <subdomain> of <subdomain>.freshservice.com (letters, digits, hyphens).");
  return `https://${match[1]}.freshservice.com`;
};

const freshservice = defineProvider({
  name: "Freshservice",
  hosts: ["*.freshservice.com"],
  auth: {
    // Freshservice API v2 uses basic auth with the API key as username and any password ("X").
    apiKey: secrets({
      label: "API key",
      fields: object({
        subdomain: plain(string({ minLength: 1 })),
        apiKey: string({ minLength: 1 }),
      }),
      request: ({ apiKey }) => header("authorization", t`Basic ${base64(t`${apiKey}:X`)}`),
    }),
  },
  // Read-only call that every agent key may make; the body always carries an `agents` array.
  async health({ account, fetch, signal }) {
    const response = await fetch(account.url(`${siteUrl(account.fields.subdomain)}/api/v2/agents?per_page=1`), {
      signal,
      headers: { ...account.headers(), Accept: "application/json" },
    });
    await decodeJson(response, object({ agents: json() }));
  },
});

type Type = "string" | "number" | "boolean" | "json";
type Field = [name: string, type: Type, required: boolean, where: "path" | "query" | "body"];

const s = (name: string, where: "query" | "body" = "body", required = false): Field => [name, "string", required, where];
const n = (name: string, where: "query" | "body" = "body", required = false): Field => [name, "number", required, where];
const b = (name: string, where: "query" | "body" = "body", required = false): Field => [name, "boolean", required, where];
const j = (name: string, where: "query" | "body" = "body", required = false): Field => [name, "json", required, where];

const paging = [n("page", "query"), n("per_page", "query")];
const since = [s("updated_since", "query")];

type Row = [resource: string, action: string, method: string, path: string, description: string, fields: Field[]];

// Path parameters ({braces}) are numeric ids, except those named in `stringPath`.
const stringPath = new Set<string>();

const ticketBody = [
  s("subject"), s("description"), s("email"), n("requester_id"), s("phone"), n("status"), n("priority"), n("source"),
  s("type"), n("urgency"), n("impact"), n("responder_id"), n("group_id"), n("department_id"), n("workspace_id"),
  n("category_id"), s("category"), s("sub_category"), s("item_category"), s("due_by"), s("fr_due_by"), j("cc_emails"),
  j("tags"), j("custom_fields"),
];
const problemBody = [
  s("subject"), s("description"), n("requester_id"), n("priority"), n("status"), n("impact"), n("urgency"),
  n("agent_id"), n("group_id"), n("department_id"), s("category"), s("sub_category"), s("item_category"),
  s("due_by"), b("known_error"), j("assets"), j("custom_fields"),
];
const changeBody = [
  s("subject"), s("description"), n("requester_id"), n("priority"), n("status"), n("impact"), n("risk"),
  n("change_type"), n("agent_id"), n("group_id"), n("department_id"), s("category"), s("sub_category"),
  s("item_category"), s("planned_start_date"), s("planned_end_date"), j("assets"), j("custom_fields"),
  j("planning_fields"),
];
const releaseBody = [
  s("subject"), s("description"), n("priority"), n("status"), n("release_type"), n("agent_id"), n("group_id"),
  n("department_id"), s("planned_start_date"), s("planned_end_date"), j("assets"), j("custom_fields"),
];
const requesterBody = [
  s("first_name"), s("last_name"), s("primary_email"), j("secondary_emails"), s("job_title"), s("work_phone_number"),
  s("mobile_phone_number"), j("department_ids"), s("language"), s("time_zone"), n("location_id"),
  n("reporting_manager_id"), b("can_see_all_tickets_from_associated_departments"), j("background_information"),
  j("custom_fields"),
];
const agentBody = [
  s("first_name"), s("last_name"), s("email"), j("role_ids"), j("group_ids"), b("occasional"), s("job_title"),
  s("work_phone_number"), s("mobile_phone_number"), s("language"), s("time_zone"), n("location_id"),
  n("reporting_manager_id"), j("department_ids"), j("custom_fields"),
];
const assetBody = [
  s("name"), s("description"), n("asset_type_id"), s("asset_tag"), n("impact"), n("usage_type"), n("user_id"),
  n("agent_id"), n("location_id"), n("department_id"), n("group_id"), j("type_fields"),
];
const noteBody = [s("body", "body", true), j("notify_emails")];
const timeBody = [b("billable"), s("time_spent"), s("note"), n("agent_id"), s("executed_at"), b("timer_running")];
const taskBody = [s("title"), s("description"), n("status"), n("priority"), n("agent_id"), n("group_id"), s("due_date"), s("notify_before")];

const rows: Row[] = [
  // Tickets
  ["tickets", "list", "GET", "/tickets", "List tickets (30 days by default; use updated_since for older). filter is one of new_and_my_open, watching, spam, deleted. include may be requester, requested_for, stats, problem, assets, change, related_tickets. order_by is created_at, due_by, updated_at or status; order_type asc or desc.", [s("filter", "query"), n("requester_id", "query"), s("email", "query"), ...since, s("include", "query"), s("order_by", "query"), s("order_type", "query"), n("workspace_id", "query"), ...paging]],
  ["tickets", "get", "GET", "/tickets/{ticketId}", "Retrieve a ticket. include may be conversations, requester, requested_for, stats, problem, assets, change, related_tickets, tags.", [s("include", "query")]],
  ["tickets", "create", "POST", "/tickets", "Create a ticket. Requires email or requester_id, subject, description (HTML), status (2 open, 3 pending, 4 resolved, 5 closed), priority (1 low to 4 urgent). source: 1 email, 2 portal, 3 phone, 4 chat, 7 feedback widget, 8 yammer, 9 AWS cloudwatch, 10 pagerduty, 14 slack.", [...ticketBody]],
  ["tickets", "update", "PUT", "/tickets/{ticketId}", "Update a ticket's properties, including status, priority, assignee (responder_id), group, tags and custom fields.", [...ticketBody]],
  ["tickets", "delete", "DELETE", "/tickets/{ticketId}", "Move a ticket to the trash.", []],
  ["tickets", "restore", "PUT", "/tickets/{ticketId}/restore", "Restore a ticket from the trash.", []],
  ["tickets", "filter", "GET", "/tickets/filter", "Filter tickets with a query in double quotes, for example \"status:2 AND priority:4\" or \"tag:'billing'\". Returns up to 30 per page.", [s("query", "query", true), n("page", "query"), n("workspace_id", "query")]],
  ["tickets", "listActivities", "GET", "/tickets/{ticketId}/activities", "List the activity log of a ticket.", []],
  ["tickets", "listFields", "GET", "/ticket_form_fields", "List ticket form fields, including custom fields and their choices.", []],
  ["tickets", "listApprovals", "GET", "/tickets/{ticketId}/approvals", "List the approvals requested on a ticket.", []],
  ["tickets", "listRequestedItems", "GET", "/tickets/{ticketId}/requested_items", "List the service catalog items requested on a service request ticket.", []],
  ["tickets", "listCsatResponses", "GET", "/tickets/{ticketId}/csat_response", "Retrieve the customer satisfaction response for a ticket.", []],

  // Conversations
  ["conversations", "list", "GET", "/tickets/{ticketId}/conversations", "List the replies and notes on a ticket.", [...paging]],
  ["conversations", "reply", "POST", "/tickets/{ticketId}/reply", "Send a public reply to the requester of a ticket. body is HTML.", [s("body", "body", true), s("from_email"), n("user_id"), j("cc_emails"), j("bcc_emails")]],
  ["conversations", "addNote", "POST", "/tickets/{ticketId}/notes", "Add a note to a ticket. private defaults to true; set false for a public note. notify_emails lists agents to notify.", [s("body", "body", true), b("private"), n("user_id"), j("notify_emails")]],
  ["conversations", "update", "PUT", "/conversations/{conversationId}", "Edit a note's body.", [s("body", "body", true)]],
  ["conversations", "delete", "DELETE", "/conversations/{conversationId}", "Delete a reply or note.", []],

  // Ticket time entries and tasks
  ["ticketTimeEntries", "list", "GET", "/tickets/{ticketId}/time_entries", "List time entries on a ticket.", [...paging]],
  ["ticketTimeEntries", "create", "POST", "/tickets/{ticketId}/time_entries", "Add a time entry to a ticket. time_spent is hh:mm.", [...timeBody]],
  ["ticketTimeEntries", "update", "PUT", "/tickets/{ticketId}/time_entries/{timeEntryId}", "Update a time entry on a ticket.", [...timeBody]],
  ["ticketTimeEntries", "delete", "DELETE", "/tickets/{ticketId}/time_entries/{timeEntryId}", "Delete a time entry from a ticket.", []],
  ["ticketTasks", "list", "GET", "/tickets/{ticketId}/tasks", "List the tasks on a ticket.", [...paging]],
  ["ticketTasks", "get", "GET", "/tickets/{ticketId}/tasks/{taskId}", "Retrieve a ticket task.", []],
  ["ticketTasks", "create", "POST", "/tickets/{ticketId}/tasks", "Create a task on a ticket.", [...taskBody]],
  ["ticketTasks", "update", "PUT", "/tickets/{ticketId}/tasks/{taskId}", "Update a ticket task.", [...taskBody]],
  ["ticketTasks", "delete", "DELETE", "/tickets/{ticketId}/tasks/{taskId}", "Delete a ticket task.", []],

  // Problems
  ["problems", "list", "GET", "/problems", "List problems. updated_since filters by update time.", [...since, ...paging]],
  ["problems", "get", "GET", "/problems/{problemId}", "Retrieve a problem.", []],
  ["problems", "create", "POST", "/problems", "Create a problem. Requires requester_id, subject, description, priority (1-4), status (1 open, 2 change requested, 3 closed), impact (1-3), due_by.", [...problemBody]],
  ["problems", "update", "PUT", "/problems/{problemId}", "Update a problem.", [...problemBody]],
  ["problems", "delete", "DELETE", "/problems/{problemId}", "Move a problem to the trash.", []],
  ["problems", "restore", "PUT", "/problems/{problemId}/restore", "Restore a problem from the trash.", []],
  ["problems", "listFields", "GET", "/problem_form_fields", "List problem form fields.", []],
  ["problems", "listNotes", "GET", "/problems/{problemId}/notes", "List notes on a problem.", [...paging]],
  ["problems", "addNote", "POST", "/problems/{problemId}/notes", "Add a note to a problem.", [...noteBody]],
  ["problems", "listTasks", "GET", "/problems/{problemId}/tasks", "List tasks on a problem.", [...paging]],
  ["problems", "createTask", "POST", "/problems/{problemId}/tasks", "Create a task on a problem.", [...taskBody]],

  // Changes
  ["changes", "list", "GET", "/changes", "List changes. filter is one of my_open, unassigned, closed, release_requested, requester_id; updated_since filters by update time.", [s("filter", "query"), ...since, ...paging]],
  ["changes", "get", "GET", "/changes/{changeId}", "Retrieve a change.", []],
  ["changes", "create", "POST", "/changes", "Create a change. Requires requester_id, subject, description, priority (1-4), impact (1-3), status (1 open, 2 planning, 3 awaiting approval, 4 pending release, 5 pending review, 6 closed), risk (1-4), change_type (1 minor, 2 standard, 3 major, 4 emergency), planned_start_date and planned_end_date.", [...changeBody]],
  ["changes", "update", "PUT", "/changes/{changeId}", "Update a change.", [...changeBody]],
  ["changes", "delete", "DELETE", "/changes/{changeId}", "Move a change to the trash.", []],
  ["changes", "listFields", "GET", "/change_form_fields", "List change form fields.", []],
  ["changes", "listNotes", "GET", "/changes/{changeId}/notes", "List notes on a change.", [...paging]],
  ["changes", "addNote", "POST", "/changes/{changeId}/notes", "Add a note to a change.", [...noteBody]],
  ["changes", "listTasks", "GET", "/changes/{changeId}/tasks", "List tasks on a change.", [...paging]],
  ["changes", "createTask", "POST", "/changes/{changeId}/tasks", "Create a task on a change.", [...taskBody]],

  // Releases
  ["releases", "list", "GET", "/releases", "List releases.", [...since, ...paging]],
  ["releases", "get", "GET", "/releases/{releaseId}", "Retrieve a release.", []],
  ["releases", "create", "POST", "/releases", "Create a release. Requires subject, description, priority (1-4), status (1 open, 2 on hold, 3 in progress, 4 incomplete, 5 completed), release_type (1 minor, 2 standard, 3 major, 4 emergency), planned_start_date, planned_end_date.", [...releaseBody]],
  ["releases", "update", "PUT", "/releases/{releaseId}", "Update a release.", [...releaseBody]],
  ["releases", "delete", "DELETE", "/releases/{releaseId}", "Move a release to the trash.", []],
  ["releases", "restore", "PUT", "/releases/{releaseId}/restore", "Restore a release from the trash.", []],
  ["releases", "listFields", "GET", "/release_form_fields", "List release form fields.", []],
  ["releases", "addNote", "POST", "/releases/{releaseId}/notes", "Add a note to a release.", [...noteBody]],

  // Requesters
  ["requesters", "list", "GET", "/requesters", "List requesters. Filter with email, mobile_phone_number, work_phone_number, or query (e.g. \"first_name:'Ann'\" in double quotes); include_agents true adds agents.", [s("email", "query"), s("mobile_phone_number", "query"), s("work_phone_number", "query"), s("query", "query"), b("include_agents", "query"), ...paging]],
  ["requesters", "get", "GET", "/requesters/{requesterId}", "Retrieve a requester.", []],
  ["requesters", "create", "POST", "/requesters", "Create a requester. Requires first_name and primary_email (or a phone number).", [...requesterBody]],
  ["requesters", "update", "PUT", "/requesters/{requesterId}", "Update a requester.", [...requesterBody]],
  ["requesters", "deactivate", "DELETE", "/requesters/{requesterId}", "Deactivate a requester.", []],
  ["requesters", "reactivate", "PUT", "/requesters/{requesterId}/reactivate", "Reactivate a deactivated requester.", []],
  ["requesters", "convertToAgent", "PUT", "/requesters/{requesterId}/convert_to_agent", "Convert a requester to an occasional agent.", []],
  ["requesters", "listFields", "GET", "/requester_fields", "List requester custom and default fields.", []],
  ["requesterGroups", "list", "GET", "/requester_groups", "List requester groups.", [...paging]],
  ["requesterGroups", "get", "GET", "/requester_groups/{requesterGroupId}", "Retrieve a requester group.", []],
  ["requesterGroups", "create", "POST", "/requester_groups", "Create a requester group.", [s("name", "body", true), s("description"), j("criteria")]],
  ["requesterGroups", "update", "PUT", "/requester_groups/{requesterGroupId}", "Update a requester group.", [s("name"), s("description"), j("criteria")]],
  ["requesterGroups", "delete", "DELETE", "/requester_groups/{requesterGroupId}", "Delete a requester group.", []],
  ["requesterGroups", "listMembers", "GET", "/requester_groups/{requesterGroupId}/members", "List the members of a requester group.", [...paging]],

  // Agents
  ["agents", "list", "GET", "/agents", "List agents. Filter with email, mobile_phone_number, work_phone_number, active, state (fulltime or occasional), or query.", [s("email", "query"), s("mobile_phone_number", "query"), s("work_phone_number", "query"), b("active", "query"), s("state", "query"), s("query", "query"), ...paging]],
  ["agents", "get", "GET", "/agents/{agentId}", "Retrieve an agent.", []],
  ["agents", "create", "POST", "/agents", "Create an agent. Requires first_name, email and role_ids.", [...agentBody]],
  ["agents", "update", "PUT", "/agents/{agentId}", "Update an agent.", [...agentBody]],
  ["agents", "deactivate", "DELETE", "/agents/{agentId}", "Deactivate an agent.", []],
  ["agents", "reactivate", "PUT", "/agents/{agentId}/reactivate", "Reactivate a deactivated agent.", []],
  ["agents", "listFields", "GET", "/agent_fields", "List agent custom and default fields.", []],
  ["agents", "listRoles", "GET", "/roles", "List agent roles.", [...paging]],
  ["agents", "getRole", "GET", "/roles/{roleId}", "Retrieve an agent role.", []],
  ["agentGroups", "list", "GET", "/groups", "List agent groups.", [...paging]],
  ["agentGroups", "get", "GET", "/groups/{groupId}", "Retrieve an agent group.", []],
  ["agentGroups", "create", "POST", "/groups", "Create an agent group. members, observers and leaders are arrays of agent ids.", [s("name", "body", true), s("description"), n("unassigned_for"), n("escalate_to"), n("auto_ticket_assign"), j("members"), j("observers"), j("leaders")]],
  ["agentGroups", "update", "PUT", "/groups/{groupId}", "Update an agent group.", [s("name"), s("description"), n("unassigned_for"), n("escalate_to"), n("auto_ticket_assign"), j("members"), j("observers"), j("leaders")]],
  ["agentGroups", "delete", "DELETE", "/groups/{groupId}", "Delete an agent group.", []],

  // Assets
  ["assets", "list", "GET", "/assets", "List assets. include may be type_fields. filter is a quoted query such as \"asset_state:'IN USE'\"; search is a quoted field query such as \"name:'laptop'\".", [s("include", "query"), s("filter", "query"), s("search", "query"), s("order_by", "query"), s("order_type", "query"), ...paging]],
  ["assets", "get", "GET", "/assets/{assetId}", "Retrieve an asset by display id. include may be type_fields.", [s("include", "query")]],
  ["assets", "create", "POST", "/assets", "Create an asset. Requires name and asset_type_id; type_fields holds asset-type-specific fields (keys carry the field suffix, see assetTypes.listFields).", [...assetBody]],
  ["assets", "update", "PUT", "/assets/{assetId}", "Update an asset.", [...assetBody]],
  ["assets", "delete", "DELETE", "/assets/{assetId}", "Move an asset to the trash.", []],
  ["assets", "restore", "PUT", "/assets/{assetId}/restore", "Restore an asset from the trash.", []],
  ["assets", "listComponents", "GET", "/assets/{assetId}/components", "List the components of an asset.", []],
  ["assets", "listRequests", "GET", "/assets/{assetId}/requests", "List tickets associated with an asset.", []],
  ["assets", "listContracts", "GET", "/assets/{assetId}/contracts", "List contracts associated with an asset.", []],
  ["assets", "listRelationships", "GET", "/assets/{assetId}/relationships", "List the relationships of an asset.", []],
  ["assetTypes", "list", "GET", "/asset_types", "List asset types.", [...paging]],
  ["assetTypes", "get", "GET", "/asset_types/{assetTypeId}", "Retrieve an asset type.", []],
  ["assetTypes", "listFields", "GET", "/asset_types/{assetTypeId}/fields", "List the fields of an asset type.", []],
  ["assetTypes", "create", "POST", "/asset_types", "Create an asset type.", [s("name", "body", true), s("description"), n("parent_asset_type_id"), b("visible")]],
  ["assetTypes", "update", "PUT", "/asset_types/{assetTypeId}", "Update an asset type.", [s("name"), s("description"), n("parent_asset_type_id"), b("visible")]],
  ["assetTypes", "delete", "DELETE", "/asset_types/{assetTypeId}", "Delete an asset type.", []],
  ["assetTypes", "listRelationshipTypes", "GET", "/relationship_types", "List asset relationship types.", []],

  // Software, contracts, purchase orders, vendors
  ["software", "list", "GET", "/applications", "List software applications.", [...paging]],
  ["software", "get", "GET", "/applications/{applicationId}", "Retrieve a software application.", []],
  ["software", "listInstallations", "GET", "/applications/{applicationId}/installations", "List installations of a software application.", [...paging]],
  ["software", "listLicenses", "GET", "/applications/{applicationId}/licenses", "List licenses of a software application.", [...paging]],
  ["contracts", "list", "GET", "/contracts", "List contracts.", [...paging]],
  ["contracts", "get", "GET", "/contracts/{contractId}", "Retrieve a contract.", []],
  ["purchaseOrders", "list", "GET", "/purchase_orders", "List purchase orders.", [...paging]],
  ["purchaseOrders", "get", "GET", "/purchase_orders/{purchaseOrderId}", "Retrieve a purchase order.", []],
  ["vendors", "list", "GET", "/vendors", "List vendors.", [...paging]],
  ["vendors", "get", "GET", "/vendors/{vendorId}", "Retrieve a vendor.", []],
  ["vendors", "create", "POST", "/vendors", "Create a vendor.", [s("name", "body", true), s("description"), s("contact_name"), s("email"), s("mobile"), s("phone"), s("address")]],
  ["vendors", "update", "PUT", "/vendors/{vendorId}", "Update a vendor.", [s("name"), s("description"), s("contact_name"), s("email"), s("mobile"), s("phone"), s("address")]],
  ["vendors", "delete", "DELETE", "/vendors/{vendorId}", "Delete a vendor.", []],

  // Organization
  ["departments", "list", "GET", "/departments", "List departments.", [s("query", "query"), ...paging]],
  ["departments", "get", "GET", "/departments/{departmentId}", "Retrieve a department.", []],
  ["departments", "create", "POST", "/departments", "Create a department. prime_user_id is the department head; head_user_id and domains are optional.", [s("name", "body", true), s("description"), n("head_user_id"), n("prime_user_id"), j("domains")]],
  ["departments", "update", "PUT", "/departments/{departmentId}", "Update a department.", [s("name"), s("description"), n("head_user_id"), n("prime_user_id"), j("domains")]],
  ["departments", "delete", "DELETE", "/departments/{departmentId}", "Delete a department.", []],
  ["locations", "list", "GET", "/locations", "List locations.", [s("query", "query"), ...paging]],
  ["locations", "get", "GET", "/locations/{locationId}", "Retrieve a location.", []],
  ["locations", "create", "POST", "/locations", "Create a location. address is an object (line1, line2, city, state, country, zipcode).", [s("name", "body", true), n("parent_location_id"), s("primary_contact_id"), s("primary_contact_name"), j("address")]],
  ["locations", "update", "PUT", "/locations/{locationId}", "Update a location.", [s("name"), n("parent_location_id"), j("address")]],
  ["locations", "delete", "DELETE", "/locations/{locationId}", "Delete a location.", []],
  ["products", "list", "GET", "/products", "List products.", [...paging]],
  ["products", "get", "GET", "/products/{productId}", "Retrieve a product.", []],
  ["workspaces", "list", "GET", "/workspaces", "List workspaces.", [...paging]],
  ["workspaces", "get", "GET", "/workspaces/{workspaceId}", "Retrieve a workspace.", []],
  ["announcements", "list", "GET", "/announcements", "List announcements. state is active, archived, scheduled or unread.", [s("state", "query"), ...paging]],
  ["announcements", "get", "GET", "/announcements/{announcementId}", "Retrieve an announcement.", []],
  ["announcements", "create", "POST", "/announcements", "Create an announcement. visibility is everyone, agents_only or groups.", [s("title", "body", true), s("body_html", "body", true), s("visible_from", "body", true), s("visible_till", "body", true), s("visibility", "body", true), j("departments"), j("groups"), b("additional_emails_notify")]],
  ["announcements", "delete", "DELETE", "/announcements/{announcementId}", "Delete an announcement.", []],

  // Knowledge base and service catalog
  ["solutions", "listCategories", "GET", "/solutions/categories", "List solution (knowledge base) categories.", [...paging]],
  ["solutions", "getCategory", "GET", "/solutions/categories/{categoryId}", "Retrieve a solution category.", []],
  ["solutions", "createCategory", "POST", "/solutions/categories", "Create a solution category.", [s("name", "body", true), s("description"), j("visibility")]],
  ["solutions", "listFolders", "GET", "/solutions/folders", "List solution folders in a category.", [n("category_id", "query", true), ...paging]],
  ["solutions", "getFolder", "GET", "/solutions/folders/{folderId}", "Retrieve a solution folder.", []],
  ["solutions", "createFolder", "POST", "/solutions/folders", "Create a solution folder. visibility is 1 all users, 2 logged-in users, 3 agents, 4 selected departments.", [s("name", "body", true), n("category_id", "body", true), s("description"), n("visibility"), j("department_ids")]],
  ["solutions", "listArticles", "GET", "/solutions/articles", "List solution articles in a folder.", [n("folder_id", "query", true), ...paging]],
  ["solutions", "getArticle", "GET", "/solutions/articles/{articleId}", "Retrieve a solution article.", []],
  ["solutions", "createArticle", "POST", "/solutions/articles", "Create a solution article. status is 1 draft or 2 published; article_type is 1 permanent or 2 workaround.", [s("title", "body", true), s("description", "body", true), n("folder_id", "body", true), n("status"), n("article_type"), j("tags"), j("keywords")]],
  ["solutions", "updateArticle", "PUT", "/solutions/articles/{articleId}", "Update a solution article.", [s("title"), s("description"), n("status"), n("article_type"), j("tags"), j("keywords")]],
  ["solutions", "deleteArticle", "DELETE", "/solutions/articles/{articleId}", "Delete a solution article.", []],
  ["solutions", "searchArticles", "GET", "/solutions/articles/search", "Search published solution articles by keyword. user_email searches as another user (needs impersonation privilege).", [s("search_term", "query", true), s("user_email", "query"), n("workspace_id", "query"), ...paging]],
  ["serviceCatalog", "listItems", "GET", "/service_catalog/items", "List service catalog items.", [n("category_id", "query"), ...paging]],
  ["serviceCatalog", "getItem", "GET", "/service_catalog/items/{itemId}", "Retrieve a service catalog item.", []],
  ["serviceCatalog", "searchItems", "GET", "/service_catalog/items/search", "Search published service catalog items by keyword. user_email searches as another user (needs impersonation privilege).", [s("search_term", "query", true), s("user_email", "query"), n("workspace_id", "query"), ...paging]],
  ["serviceCatalog", "listCategories", "GET", "/service_catalog/categories", "List service catalog categories.", [...paging]],

  // Settings
  ["settings", "listCannedResponseFolders", "GET", "/canned_response_folders", "List canned response folders.", []],
  ["settings", "listCannedResponses", "GET", "/canned_responses", "List canned responses in a folder.", [n("folder_id", "query", true)]],
  ["settings", "listBusinessHours", "GET", "/business_hours", "List business hours calendars.", [...paging]],
  ["settings", "getBusinessHours", "GET", "/business_hours/{businessHoursId}", "Retrieve a business hours calendar.", []],
  ["settings", "listSlaPolicies", "GET", "/sla_policies", "List SLA policies.", []],
  ["settings", "listOnCallSchedules", "GET", "/oncall/ws/{workspaceId}/schedules", "List on-call schedules of a workspace.", [...paging]],
];

function fieldsOf(path: string, extra: Field[]): Field[] {
  const pathFields: Field[] = [...path.matchAll(/\{(\w+)\}/g)].map((m) => [
    m[1]!,
    stringPath.has(m[1]!) ? "string" : "number",
    true,
    "path",
  ]);
  return [...pathFields, ...extra];
}

function schemaFor(fields: Field[]) {
  const shape: Record<string, Schema<unknown, boolean>> = {};
  for (const [name, type, required] of fields) {
    const base: Schema<unknown, boolean> =
      type === "number" ? number() : type === "boolean" ? boolean() : type === "json" ? json() : string();
    shape[name] = required ? base : base.optional();
  }
  return object(shape);
}

// The schema builders carry no per-field descriptions, so parameter docs go in the tool description.
function describe(description: string, fields: Field[]): string {
  if (fields.length === 0) return description;
  const params = fields.map(([name, type, required]) => `- ${name} (${type}${required ? ", required" : ""})`);
  return `${description}\n\nParameters:\n${params.join("\n")}`;
}

type Account = {
  fields: { subdomain: string };
  url: (url: string) => string;
  headers: () => Record<string, string>;
};

function build(account: Account, fetcher: typeof fetch, signal: AbortSignal | undefined) {
  const base = siteUrl(account.fields.subdomain);

  const call = async (method: string, path: string, fields: Field[], input: Record<string, unknown>) => {
    let url = path;
    const search = new URLSearchParams();
    const body: Record<string, unknown> = {};
    for (const [name, , , where] of fields) {
      const value = input[name];
      if (value === undefined || value === null) continue;
      if (where === "path") url = url.replace(`{${name}}`, encodeURIComponent(String(value)));
      else if (where === "query") search.set(name, String(value));
      else body[name] = value;
    }
    const hasBody = method !== "GET" && method !== "DELETE" && Object.keys(body).length > 0;
    const queryString = search.size > 0 ? `?${search.toString()}` : "";
    const response = await fetcher(account.url(`${base}/api/v2${url}${queryString}`), {
      method,
      signal,
      headers: {
        ...account.headers(),
        Accept: "application/json",
        ...(hasBody ? { "content-type": "application/json" } : {}),
      },
      body: hasBody ? JSON.stringify(body) : undefined,
    });
    const text = await response.text();
    if (!response.ok) throw new Error(`Freshservice answered ${response.status}: ${text.slice(0, 1000)}`);
    return text === "" ? { ok: true } : (JSON.parse(text) as unknown);
  };

  const groups = new Map<string, Record<string, unknown>>();
  for (const [resource, action, method, path, description, extra] of rows) {
    const fields = fieldsOf(path, extra);
    const options = { description: describe(description, fields), input: schemaFor(fields) };
    const handler = async (_ctx: unknown, input: Record<string, unknown>) => call(method, path, fields, input);
    const tool = method === "GET" ? query(options, handler as never) : mutation(options, handler as never);
    const group = groups.get(resource) ?? {};
    group[action] = tool;
    groups.set(resource, group);
  }
  return router(Object.fromEntries([...groups].map(([name, tools]) => [name, router(tools as never)])) as never);
}

export default defineApp(
  { user: { accounts: { freshservice: freshservice.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.freshservice ?? [],
        (account) =>
          withApprovals(build(account as unknown as Account, fetch, signal), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Freshservice",
        description:
          "Freshservice ITSM: tickets, problems, changes, releases, requesters, agents, groups, assets, software, vendors, departments, knowledge base, service catalog and settings.",
        icons,
      },
    ),
  }),
);
