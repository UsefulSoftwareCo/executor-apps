export type Operation = {
  group: string;
  name: string;
  method: "GET" | "POST" | "PUT" | "DELETE";
  path: string;
  description: string;
};

const list = (group: string, path: string, what: string, filters: string): Operation => ({
  group,
  name: "list",
  method: "GET",
  path,
  description: `List ${what}. Filters go in query: ${filters}. Paginate with page and per_page (default 25).`,
});

const get = (group: string, path: string, what: string): Operation => ({
  group,
  name: "get",
  method: "GET",
  path: `${path}/{id}`,
  description: `Get one ${what} by id.`,
});

const create = (group: string, path: string, what: string, fields: string): Operation => ({
  group,
  name: "create",
  method: "POST",
  path,
  description: `Create a ${what}. ${fields}`,
});

const update = (group: string, path: string, what: string, fields: string): Operation => ({
  group,
  name: "update",
  method: "PUT",
  path: `${path}/{id}`,
  description: `Update a ${what}. ${fields}`,
});

const remove = (group: string, path: string, what: string): Operation => ({
  group,
  name: "delete",
  method: "DELETE",
  path: `${path}/{id}`,
  description: `Delete a ${what}.`,
});

const category = (name: string, type: string, what: string): Operation => ({
  group: "categories",
  name,
  method: "GET",
  path: `/v1/categories/${type}`,
  description: `List ${what}.`,
});

export const operations: Operation[] = [
  { group: "account", name: "me", method: "GET", path: "/v1/me", description: "Get the authenticated user and their account." },
  { group: "account", name: "listUsers", method: "GET", path: "/v1/users", description: "List users. Filter with query.status: active (default), invited, inactive, legacy or all." },
  { group: "account", name: "listTeams", method: "GET", path: "/v1/teams", description: "List teams." },
  { group: "account", name: "listUserGroups", method: "GET", path: "/v1/user_groups", description: "List user groups, usable in visible_to." },
  { group: "account", name: "listActivity", method: "GET", path: "/v1/activity", description: "List the activity stream. Query: contact, cursor, type, updated_since, updated_before. Uses cursor pagination." },

  list("contacts", "/v1/contacts", "contacts", "id, contact_type, name, email, phone, active, tags, deleted, deleted_since, household_title, type (Person, Household, Organization, Trust), order, updated_since, updated_before, external_unique_id"),
  get("contacts", "/v1/contacts", "contact"),
  create("contacts", "/v1/contacts", "contact", "Body requires first_name and last_name; optional email_addresses[], phone_numbers[], websites[] (each with address), contact_roles[] ({id, value}), tags[], type, status, background_information and more."),
  update("contacts", "/v1/contacts", "contact", "All body fields are optional; contact_roles entries need id and value."),
  remove("contacts", "/v1/contacts", "contact"),

  list("tasks", "/v1/tasks", "tasks", "resource_id, resource_type, assigned_to, assigned_to_team, created_by, completed, task_type, subtasks, updated_since, updated_before"),
  get("tasks", "/v1/tasks", "task"),
  create("tasks", "/v1/tasks", "task", "Body requires name and due_date; optional assigned_to (user id), assigned_to_team, linked_to[] ({id, type}), description, priority, category, subtasks[], complete, reminder."),
  update("tasks", "/v1/tasks", "task", "Body requires name and due_date."),
  remove("tasks", "/v1/tasks", "task"),

  list("events", "/v1/events", "events", "resource_id, resource_type, start_date_min, start_date_max, order (asc, desc, recent, created), updated_since, updated_before"),
  get("events", "/v1/events", "event"),
  create("events", "/v1/events", "event", "Body requires title, starts_at and ends_at; optional all_day, repeats, email_invitees, event_category, location, description, state (unconfirmed, confirmed, tentative, completed, cancelled), visible_to, linked_to[] (contacts only), invitees[] ({id, type: User or Contact}), custom_fields[]."),
  update("events", "/v1/events", "event", "Body requires title, starts_at and ends_at."),
  remove("events", "/v1/events", "event"),

  list("notes", "/v1/notes", "notes (returned in status_updates)", "resource_id, resource_type, order (asc, created, updated), updated_since, updated_before"),
  get("notes", "/v1/notes", "note"),
  create("notes", "/v1/notes", "note", "Body requires content; optional linked_to[] ({id, type: Contact}), visible_to, tags[] (strings)."),
  update("notes", "/v1/notes", "note", "Body requires content."),

  list("opportunities", "/v1/opportunities", "opportunities", "resource_id, resource_type, order (asc, desc, recent, created), include_closed, updated_since, updated_before"),
  get("opportunities", "/v1/opportunities", "opportunity"),
  create("opportunities", "/v1/opportunities", "opportunity", "Body requires name, target_close, probability, stage and amounts[] ({amount, currency, kind: Fee, Commission, AUM or Other}); optional description, manager, next_step, linked_to[] (first contact used), visible_to, custom_fields[]."),
  update("opportunities", "/v1/opportunities", "opportunity", "Body takes the same required fields as create."),
  remove("opportunities", "/v1/opportunities", "opportunity"),

  list("projects", "/v1/projects", "projects", "updated_since, updated_before"),
  get("projects", "/v1/projects", "project"),
  create("projects", "/v1/projects", "project", "Body requires name and description; optional organizer, visible_to, custom_fields[]."),
  update("projects", "/v1/projects", "project", "Body requires name and description."),
  remove("projects", "/v1/projects", "project"),

  list("workflows", "/v1/workflows", "workflows", "none"),
  get("workflows", "/v1/workflows", "workflow"),
  create("workflows", "/v1/workflows", "workflow (start a workflow from a template)", "Body requires workflow_template (template id) and linked_to ({id, type}); optional label, starts_at, workflow_milestones[] ({id, name, milestone_date})."),
  remove("workflows", "/v1/workflows", "workflow"),
  { group: "workflows", name: "listTemplates", method: "GET", path: "/v1/workflow_templates", description: "List workflow templates the user can access." },
  { group: "workflows", name: "getTemplate", method: "GET", path: "/v1/workflow_templates/{id}", description: "Get one workflow template by id." },
  { group: "workflows", name: "updateStep", method: "PUT", path: "/v1/workflows/{workflow_id}/steps/{id}", description: "Complete or revert a workflow step. Body: complete (bool) with optional workflow_outcome_id, due_date_set and due_date; or revert (bool) to undo completion." },

  list("comments", "/v1/comments", "comments", "resource_id, resource_type (resource_id is ignored without it), updated_since, updated_before"),

  { group: "households", name: "addMember", method: "POST", path: "/v1/households/{household_id}/members", description: "Add a contact to a household. Body requires id (contact id) and title: Head, Spouse, Partner, Child, Grandchild, Parent, Grandparent, Sibling or Other Dependent." },
  { group: "households", name: "removeMember", method: "DELETE", path: "/v1/households/{household_id}/members/{id}", description: "Remove a contact from a household." },

  category("tags", "tags", "tags. Query document_type: Contact or Note (all when omitted)"),
  category("customFields", "custom_fields", "custom field definitions. Query document_type: Contact, Opportunity, Project, Task, Event, ManualInvestmentAccount or DataFile (all when omitted)"),
  category("contactRoles", "contact_roles", "contact roles"),
  category("opportunityStages", "opportunity_stages", "opportunity stages"),
  category("opportunityPipelines", "opportunity_pipelines", "opportunity pipelines"),
  category("contactTypes", "contact_types", "contact types"),
  category("contactSources", "contact_sources", "contact sources"),
  category("taskCategories", "task_categories", "task categories"),
  category("eventCategories", "event_categories", "event categories"),
  category("fileCategories", "file_categories", "file categories"),
  category("investmentObjectives", "investment_objectives", "investment objectives"),
  category("financialAccountTypes", "financial_account_types", "financial account types"),
  category("emailTypes", "email_types", "email address types"),
  category("phoneTypes", "phone_types", "phone number types"),
  category("addressTypes", "address_types", "street address types"),
  category("websiteTypes", "website_types", "website types"),
];
