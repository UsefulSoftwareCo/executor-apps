export type Operation = {
  group: string;
  name: string;
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  path: string;
  description: string;
};

const op = (group: string, name: string, method: Operation["method"], path: string, description: string): Operation => ({
  group,
  name,
  method,
  path,
  description,
});

export const operations: Operation[] = [
  op("project", "get", "GET", "/projects/info", "Get information about the Zep project the API key belongs to."),
  op("project", "update", "PATCH", "/projects/info", "Update project settings such as the time zone."),
  op("project", "getObservationSteering", "GET", "/projects/observation-steering", "Get the observation steering configuration (experimental)."),
  op("project", "setObservationSteering", "PUT", "/projects/observation-steering", "Replace the observation steering configuration (experimental)."),

  op("users", "list", "GET", "/users-ordered", "List users ordered by creation, with pagination."),
  op("users", "create", "POST", "/users", "Create a user (user_id, email, first_name, last_name, metadata)."),
  op("users", "get", "GET", "/users/{user_id}", "Get a user."),
  op("users", "update", "PATCH", "/users/{user_id}", "Update a user."),
  op("users", "delete", "DELETE", "/users/{user_id}", "Delete a user together with their graph and threads."),
  op("users", "getNode", "GET", "/users/{user_id}/node", "Get the user's node in their graph."),
  op("users", "listThreads", "GET", "/users/{user_id}/threads", "List a user's threads."),
  op("users", "warmCache", "GET", "/users/{user_id}/warm", "Hint Zep to warm the user's graph for low-latency search."),

  op("threads", "list", "GET", "/threads", "List threads with pagination (page_number, page_size, order_by, asc)."),
  op("threads", "create", "POST", "/threads", "Start a thread (thread_id, user_id)."),
  op("threads", "delete", "DELETE", "/threads/{thread_id}", "Delete a thread."),
  op("threads", "getUserContext", "GET", "/threads/{thread_id}/context", "Get the context block for the thread's user (query: mode, template_id)."),
  op("threads", "listMessages", "GET", "/threads/{thread_id}/messages", "List the messages of a thread (query: limit, cursor, lastn)."),
  op("threads", "addMessages", "POST", "/threads/{thread_id}/messages", "Add messages to a thread. Body: { messages: [{ role, content, name?, created_at?, metadata? }], return_context?, ignore_roles? }."),
  op("threads", "addMessagesBatch", "POST", "/threads/{thread_id}/messages-batch", "Add messages to a thread in batch mode, processed concurrently. Same body as addMessages."),
  op("threads", "listEpisodes", "GET", "/threads/{thread_id}/episodes", "List the episodes created from a thread."),
  op("threads", "getSummary", "GET", "/threads/{thread_id}/summary", "Get the thread summary."),
  op("threads", "updateMessage", "PATCH", "/messages/{message_uuid}", "Update a message, for example its metadata."),

  op("graph", "search", "POST", "/graph/search", "Search a graph for edges, nodes, episodes or observations. Body: { query, user_id or graph_id, scope, limit, reranker, search_filters }."),
  op("graph", "add", "POST", "/graph", "Add data to a graph. Body: { type: text|json|message, data, user_id or graph_id, source_description? }."),
  op("graph", "addBatch", "POST", "/graph-batch", "Add up to 20 episodes to a graph in batch mode. Body: { episodes: [...], user_id or graph_id }."),
  op("graph", "addFactTriple", "POST", "/graph/add-fact-triple", "Add a fact triple (source node, edge, target node) to a graph."),
  op("graph", "addNodes", "POST", "/graph/nodes", "Add nodes to a graph."),
  op("graph", "create", "POST", "/graph/create", "Create a standalone graph (graph_id, name, description)."),
  op("graph", "listAll", "GET", "/graph/list-all", "List standalone graphs with pagination."),
  op("graph", "get", "GET", "/graph/{graph_id}", "Get a standalone graph."),
  op("graph", "update", "PATCH", "/graph/{graph_id}", "Update a standalone graph."),
  op("graph", "delete", "DELETE", "/graph/{graph_id}", "Delete a standalone graph."),
  op("graph", "clone", "POST", "/graph/clone", "Clone a user graph or standalone graph into a new one."),
  op("graph", "warmCache", "GET", "/graph/{graph_id}/warm", "Hint Zep to warm a graph for low-latency search."),
  op("graph", "getSubgraph", "POST", "/graph/subgraph", "Get a subgraph around given nodes."),
  op("graph", "detectPatterns", "POST", "/graph/patterns", "Detect patterns in a graph (experimental)."),
  op("graph", "listCustomInstructions", "GET", "/custom-instructions", "List custom graph-extraction instructions for the project, a user or a graph."),
  op("graph", "addCustomInstructions", "POST", "/custom-instructions", "Add custom graph-extraction instructions."),
  op("graph", "deleteCustomInstructions", "DELETE", "/custom-instructions", "Delete custom graph-extraction instructions."),
  op("graph", "getEpisodesForDocument", "GET", "/graph/documents/{document_id}/episodes", "List the episodes created from a document."),

  op("nodes", "listForUser", "POST", "/graph/node/user/{user_id}", "List a user graph's nodes with cursor pagination (body: limit, uuid_cursor)."),
  op("nodes", "listForGraph", "POST", "/graph/node/graph/{graph_id}", "List a standalone graph's nodes with cursor pagination."),
  op("nodes", "get", "GET", "/graph/node/{uuid}", "Get a node by UUID."),
  op("nodes", "update", "PATCH", "/graph/node/{uuid}", "Update a node's name, summary or attributes."),
  op("nodes", "delete", "DELETE", "/graph/node/{uuid}", "Delete a node."),
  op("nodes", "getEntityEdges", "GET", "/graph/node/{uuid}/entity-edges", "Get the entity edges of a node."),
  op("nodes", "getEpisodes", "GET", "/graph/node/{uuid}/episodes", "Get the episodes that mention a node."),
  op("nodes", "getNeighbors", "POST", "/graph/node/{uuid}/neighbors", "Get the neighbors of a node."),

  op("edges", "listForUser", "POST", "/graph/edge/user/{user_id}", "List a user graph's edges with cursor pagination (body: limit, uuid_cursor)."),
  op("edges", "listForGraph", "POST", "/graph/edge/graph/{graph_id}", "List a standalone graph's edges with cursor pagination."),
  op("edges", "get", "GET", "/graph/edge/{uuid}", "Get an edge (fact) by UUID."),
  op("edges", "update", "PATCH", "/graph/edge/{uuid}", "Update an edge's fact or attributes."),
  op("edges", "delete", "DELETE", "/graph/edge/{uuid}", "Delete an edge."),

  op("episodes", "listForUser", "GET", "/graph/episodes/user/{user_id}", "List a user graph's episodes (query: lastn)."),
  op("episodes", "listForGraph", "GET", "/graph/episodes/graph/{graph_id}", "List a standalone graph's episodes (query: lastn)."),
  op("episodes", "get", "GET", "/graph/episodes/{uuid}", "Get an episode by UUID."),
  op("episodes", "updateMetadata", "PATCH", "/graph/episodes/{uuid}", "Update an episode's metadata."),
  op("episodes", "delete", "DELETE", "/graph/episodes/{uuid}", "Delete an episode."),
  op("episodes", "getMentions", "GET", "/graph/episodes/{uuid}/mentions", "Get the nodes and edges mentioned in an episode."),

  op("contextTemplates", "list", "GET", "/context-templates", "List context templates."),
  op("contextTemplates", "create", "POST", "/context-templates", "Create a context template (template_id, template)."),
  op("contextTemplates", "get", "GET", "/context-templates/{template_id}", "Get a context template."),
  op("contextTemplates", "update", "PUT", "/context-templates/{template_id}", "Update a context template."),
  op("contextTemplates", "delete", "DELETE", "/context-templates/{template_id}", "Delete a context template."),
];
