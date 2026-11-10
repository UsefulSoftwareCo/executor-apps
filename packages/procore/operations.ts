// Procore publishes its REST reference only as a JavaScript single-page app (no downloadable
// OpenAPI document; the procore/open-api-spec repository is an unrelated Honest Buildings spec),
// so these are documented endpoints of https://developers.procore.com/reference/rest wrapped by hand.
//
export type Operation = {
  group: string;
  name: string;
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  path: string;
  description: string;
  readOnly?: boolean;
};

export const operations: readonly Operation[] = [
  { group: "account", name: "getMe", method: "GET", path: "/rest/v1.0/me", description: "Get the authenticated Procore user (id, login, name)." },
  { group: "companies", name: "list", method: "GET", path: "/rest/v1.0/companies", description: "List companies the user can access. Use the returned id as companyId on other tools." },
  { group: "companies", name: "get", method: "GET", path: "/rest/v1.0/companies/{company_id}", description: "Get one company." },
  { group: "companies", name: "listUsers", method: "GET", path: "/rest/v1.0/companies/{company_id}/users", description: "List users in a company directory. Query: page, per_page, filters[search]." },
  { group: "companies", name: "listVendors", method: "GET", path: "/rest/v1.0/vendors", description: "List vendors in a company. Query: company_id (required), page, per_page, filters[search]." },
  { group: "projects", name: "list", method: "GET", path: "/rest/v1.0/projects", description: "List projects. Query: company_id (required), page, per_page, filters[by_status]." },
  { group: "projects", name: "get", method: "GET", path: "/rest/v1.0/projects/{id}", description: "Get one project. Query: company_id." },
  { group: "projects", name: "create", method: "POST", path: "/rest/v1.0/projects", description: "Create a project. Query: company_id (required). Body: {project: {name (required), active, address, city, state_code, country_code, start_date, completion_date, project_number, description}}." },
  { group: "projects", name: "update", method: "PATCH", path: "/rest/v1.0/projects/{id}", description: "Update a project. Query: company_id (required). Body: {project: {...fields}}." },
  { group: "projects", name: "listUsers", method: "GET", path: "/rest/v1.0/projects/{project_id}/users", description: "List users on a project directory. Query: page, per_page." },
  { group: "rfis", name: "list", method: "GET", path: "/rest/v1.0/projects/{project_id}/rfis", description: "List RFIs on a project. Query: page, per_page, filters[status]." },
  { group: "rfis", name: "get", method: "GET", path: "/rest/v1.0/projects/{project_id}/rfis/{id}", description: "Get one RFI." },
  { group: "rfis", name: "create", method: "POST", path: "/rest/v1.0/projects/{project_id}/rfis", description: "Create an RFI. Body: {rfi: {subject (required), question: {body}, assignee_id, rfi_manager_id, due_date, status, private}}." },
  { group: "rfis", name: "update", method: "PATCH", path: "/rest/v1.0/projects/{project_id}/rfis/{id}", description: "Update an RFI. Body: {rfi: {...fields}}." },
  { group: "submittals", name: "list", method: "GET", path: "/rest/v1.1/projects/{project_id}/submittals", description: "List submittals on a project. Query: page, per_page." },
  { group: "submittals", name: "get", method: "GET", path: "/rest/v1.1/projects/{project_id}/submittals/{id}", description: "Get one submittal." },
  { group: "observations", name: "list", method: "GET", path: "/rest/v1.0/observations/items", description: "List observation items. Query: project_id (required), page, per_page, filters[status]." },
  { group: "punchItems", name: "list", method: "GET", path: "/rest/v1.0/projects/{project_id}/punch_items", description: "List punch list items on a project. Query: page, per_page, filters[status]." },
  { group: "punchItems", name: "get", method: "GET", path: "/rest/v1.0/projects/{project_id}/punch_items/{id}", description: "Get one punch item." },
  { group: "punchItems", name: "create", method: "POST", path: "/rest/v1.0/projects/{project_id}/punch_items", description: "Create a punch item. Body: {punch_item: {name (required), description, due_date, location_id, punch_item_manager_id, assignments}}." },
  { group: "meetings", name: "list", method: "GET", path: "/rest/v1.0/meetings", description: "List meetings. Query: project_id (required), page, per_page." },
  { group: "documents", name: "listFolders", method: "GET", path: "/rest/v1.0/folders", description: "List folders and files at the root of a project's Documents tool. Query: project_id (required)." },
  { group: "documents", name: "getFolder", method: "GET", path: "/rest/v1.0/folders/{id}", description: "Get a folder with its sub-folders and files. Query: project_id (required)." },
  { group: "documents", name: "getFile", method: "GET", path: "/rest/v1.0/files/{id}", description: "Get a file's metadata and download URL. Query: project_id (required)." },
  { group: "commitments", name: "listPurchaseOrders", method: "GET", path: "/rest/v1.0/purchase_order_contracts", description: "List purchase order contracts. Query: project_id (required), page, per_page." },
  { group: "commitments", name: "listWorkOrders", method: "GET", path: "/rest/v1.0/work_order_contracts", description: "List subcontracts (work order contracts). Query: project_id (required), page, per_page." },
  { group: "commitments", name: "listChangeOrderPackages", method: "GET", path: "/rest/v1.0/change_order_packages", description: "List change order packages. Query: project_id (required), page, per_page." },
];
