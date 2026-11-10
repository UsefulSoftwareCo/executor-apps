// Tanium publishes its REST reference (Swagger, served by each Tanium server and on the gated
// developer portal at https://developer.tanium.com) only to registered customers, so these are the
// documented Platform REST v2 endpoints under https://<server>/api/v2. Writes are JSON bodies.
export type Operation = {
  group: string;
  name: string;
  method: "GET" | "POST" | "PUT" | "DELETE";
  path: string;
  description: string;
  /** POST endpoints that only read data. */
  readOnly?: boolean;
};

export const operations: readonly Operation[] = [
  { group: "session", name: "getCurrent", method: "GET", path: "/session/current", description: "Get the current API session (user, roles, expiry)." },
  { group: "sensors", name: "list", method: "GET", path: "/sensors", description: "List sensors, the data collectors questions are built from." },
  { group: "sensors", name: "get", method: "GET", path: "/sensors/{id}", description: "Get one sensor by id." },
  { group: "sensors", name: "getByName", method: "GET", path: "/sensors/by-name/{name}", description: "Get one sensor by exact name." },
  { group: "questions", name: "list", method: "GET", path: "/questions", description: "List asked questions." },
  { group: "questions", name: "get", method: "GET", path: "/questions/{id}", description: "Get one asked question, including its expiry and result state." },
  { group: "questions", name: "create", method: "POST", path: "/questions", description: "Ask a question of endpoints. Body: query_text (natural-language question such as 'Get Computer Name from all machines'), or selects, group and expire_seconds. Use questions.parse first to turn text into a structure. Asking reaches live endpoints." },
  { group: "questions", name: "parse", method: "POST", path: "/parse_question", description: "Parse question text into the question structure without asking it. Body: text.", readOnly: true },
  { group: "questions", name: "getResults", method: "GET", path: "/result_data/question/{id}", description: "Get result rows for an asked question by id. Query: row_start, row_count, sort_order, return_cache_id_in_response." },
  { group: "savedQuestions", name: "list", method: "GET", path: "/saved_questions", description: "List saved questions." },
  { group: "savedQuestions", name: "get", method: "GET", path: "/saved_questions/{id}", description: "Get one saved question by id." },
  { group: "savedQuestions", name: "getByName", method: "GET", path: "/saved_questions/by-name/{name}", description: "Get one saved question by exact name." },
  { group: "savedQuestions", name: "getResults", method: "GET", path: "/result_data/saved_question/{id}", description: "Get the latest result rows of a saved question by id. Query: row_start, row_count, sort_order." },
  { group: "groups", name: "list", method: "GET", path: "/groups", description: "List computer groups, used to target questions and actions." },
  { group: "groups", name: "get", method: "GET", path: "/groups/{id}", description: "Get one computer group by id." },
  { group: "groups", name: "getByName", method: "GET", path: "/groups/by-name/{name}", description: "Get one computer group by exact name." },
  { group: "groups", name: "create", method: "POST", path: "/groups", description: "Create a computer group. Body: name (required), text (filter text) or filters, sub_groups, type." },
  { group: "groups", name: "delete", method: "DELETE", path: "/groups/{id}", description: "Delete a computer group by id." },
  { group: "packages", name: "list", method: "GET", path: "/packages", description: "List packages that actions can deploy." },
  { group: "packages", name: "get", method: "GET", path: "/packages/{id}", description: "Get one package by id, including its command and parameters." },
  { group: "packages", name: "getByName", method: "GET", path: "/packages/by-name/{name}", description: "Get one package by exact name." },
  { group: "actions", name: "list", method: "GET", path: "/actions", description: "List deployed actions." },
  { group: "actions", name: "get", method: "GET", path: "/actions/{id}", description: "Get one deployed action by id, including status." },
  { group: "actions", name: "create", method: "POST", path: "/actions", description: "Deploy a package to endpoints. Body: name, package_spec ({id} or {name}, plus parameters), target_group ({id} or {name}), expire_seconds, distribute_seconds. This runs commands on live endpoints." },
  { group: "actions", name: "stop", method: "POST", path: "/actions/stop", description: "Stop a running action. Body: action ({id})." },
  { group: "actions", name: "getResults", method: "GET", path: "/result_data/action/{id}", description: "Get per-endpoint results of a deployed action by id. Query: row_start, row_count." },
  { group: "savedActions", name: "list", method: "GET", path: "/saved_actions", description: "List saved actions (reusable and scheduled deployments)." },
  { group: "savedActions", name: "get", method: "GET", path: "/saved_actions/{id}", description: "Get one saved action by id." },
  { group: "users", name: "list", method: "GET", path: "/users", description: "List Tanium console users." },
  { group: "users", name: "get", method: "GET", path: "/users/{id}", description: "Get one user by id." },
  { group: "roles", name: "list", method: "GET", path: "/roles", description: "List user roles." },
  { group: "system", name: "getStatus", method: "GET", path: "/system_status", description: "Get per-endpoint client status: version, health and last registration of every client." },
  { group: "system", name: "listSettings", method: "GET", path: "/system_settings", description: "List platform system settings." },
  { group: "system", name: "getSetting", method: "GET", path: "/system_settings/{id}", description: "Get one system setting by id." },
];
