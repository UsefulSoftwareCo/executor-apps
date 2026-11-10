export interface Operation {
  group: string;
  name: string;
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  path: string;
  description: string;
}

// DocsBot Admin REST API (https://docsbot.ai/documentation/developer/admin-api-overview), paths under https://docsbot.ai/api.
export const operations: Operation[] = [
  { group: "teams", name: "list", method: "GET", path: "/teams", description: "List the teams the API key's user belongs to." },
  { group: "teams", name: "get", method: "GET", path: "/teams/{teamId}", description: "Get a team with its plan, usage and bot count." },
  { group: "teams", name: "create", method: "POST", path: "/teams", description: "Create a team." },
  { group: "teams", name: "update", method: "PUT", path: "/teams/{teamId}", description: "Update a team (name, OpenAI key)." },
  { group: "members", name: "list", method: "GET", path: "/teams/{teamId}/members", description: "List team members and pending invites." },
  { group: "members", name: "invite", method: "POST", path: "/teams/{teamId}/invite", description: "Invite a user to the team." },
  { group: "members", name: "updateInvite", method: "PUT", path: "/teams/{teamId}/invite", description: "Update a pending team invite." },
  { group: "members", name: "update", method: "PUT", path: "/teams/{teamId}/members", description: "Update a team member's role." },
  { group: "members", name: "remove", method: "DELETE", path: "/teams/{teamId}/members", description: "Remove a member or revoke an invite." },
  { group: "bots", name: "list", method: "GET", path: "/teams/{teamId}/bots", description: "List a team's bots. Query supports page, pageSize, q, sort, order and view=summary." },
  { group: "bots", name: "get", method: "GET", path: "/teams/{teamId}/bots/{botId}", description: "Get a bot and its settings." },
  { group: "bots", name: "create", method: "POST", path: "/teams/{teamId}/bots", description: "Create a bot (name, description, privacy, language, model...)." },
  { group: "bots", name: "update", method: "PUT", path: "/teams/{teamId}/bots/{botId}", description: "Update a bot's settings." },
  { group: "bots", name: "delete", method: "DELETE", path: "/teams/{teamId}/bots/{botId}", description: "Delete a bot and its sources." },
  { group: "bots", name: "getImageUploadUrl", method: "GET", path: "/teams/{teamId}/bots/{botId}/image-upload-url", description: "Get a signed URL for uploading a bot image." },
  { group: "sources", name: "list", method: "GET", path: "/teams/{teamId}/bots/{botId}/sources", description: "List a bot's training sources. Query supports page, perPage and tags." },
  { group: "sources", name: "get", method: "GET", path: "/teams/{teamId}/bots/{botId}/sources/{sourceId}", description: "Get one source." },
  { group: "sources", name: "tagCounts", method: "GET", path: "/teams/{teamId}/bots/{botId}/sources/tag-counts", description: "Get per-tag source counts." },
  { group: "sources", name: "getUploadUrl", method: "GET", path: "/teams/{teamId}/bots/{botId}/upload-url", description: "Get a signed upload URL for a document source. Pass query.fileName." },
  { group: "sources", name: "create", method: "POST", path: "/teams/{teamId}/bots/{botId}/sources", description: "Add a source (type url, document, sitemap, wp, urls, csv, rss, qa...)." },
  { group: "sources", name: "update", method: "PUT", path: "/teams/{teamId}/bots/{botId}/sources/{sourceId}", description: "Replace a source's settings and retrain it." },
  { group: "sources", name: "patch", method: "PATCH", path: "/teams/{teamId}/bots/{botId}/sources/{sourceId}", description: "Partially update a source." },
  { group: "sources", name: "updateTags", method: "POST", path: "/teams/{teamId}/bots/{botId}/sources/tags", description: "Update tags on sources in bulk." },
  { group: "sources", name: "delete", method: "DELETE", path: "/teams/{teamId}/bots/{botId}/sources/{sourceId}", description: "Delete a source." },
  { group: "questions", name: "list", method: "GET", path: "/teams/{teamId}/bots/{botId}/questions", description: "List question and answer history. Query supports ascending, page and perPage." },
  { group: "questions", name: "delete", method: "DELETE", path: "/teams/{teamId}/bots/{botId}/questions/{questionId}", description: "Delete a question from history." },
  { group: "conversations", name: "list", method: "GET", path: "/teams/{teamId}/bots/{botId}/conversations", description: "List conversations. Query supports page and perPage." },
  { group: "conversations", name: "get", method: "GET", path: "/teams/{teamId}/bots/{botId}/conversations/{conversationId}", description: "Get a conversation with its messages." },
  { group: "conversations", name: "delete", method: "DELETE", path: "/teams/{teamId}/bots/{botId}/conversations/{conversationId}", description: "Delete a conversation." },
  { group: "leads", name: "list", method: "GET", path: "/teams/{teamId}/bots/{botId}/leads", description: "List captured leads. Query supports page, perPage and date filters." },
  { group: "leads", name: "export", method: "GET", path: "/teams/{teamId}/bots/{botId}/leads/export", description: "Export leads as CSV. Query supports startDate and endDate." },
  { group: "leads", name: "delete", method: "DELETE", path: "/teams/{teamId}/bots/{botId}/leads/{leadId}", description: "Delete a lead." },
  { group: "webhooks", name: "list", method: "GET", path: "/teams/{teamId}/bots/{botId}/webhooks", description: "List webhook subscriptions." },
  { group: "webhooks", name: "get", method: "GET", path: "/teams/{teamId}/bots/{botId}/webhooks/{webhookId}", description: "Get a webhook subscription." },
  { group: "webhooks", name: "create", method: "POST", path: "/teams/{teamId}/bots/{botId}/webhooks", description: "Subscribe a webhook (targetUrl, events, label, source, expirationDate)." },
  { group: "webhooks", name: "update", method: "PATCH", path: "/teams/{teamId}/bots/{botId}/webhooks/{webhookId}", description: "Update a webhook subscription." },
  { group: "webhooks", name: "delete", method: "DELETE", path: "/teams/{teamId}/bots/{botId}/webhooks/{webhookId}", description: "Unsubscribe a webhook." },
  { group: "webhooks", name: "sampleLead", method: "POST", path: "/teams/{teamId}/bots/{botId}/webhooks/deliver-lead", description: "Deliver a sample lead event for trigger setup." },
  { group: "webhooks", name: "sampleEscalated", method: "POST", path: "/teams/{teamId}/bots/{botId}/webhooks/deliver-escalated", description: "Deliver a sample escalated-conversation event." },
  { group: "webhooks", name: "sampleRated", method: "POST", path: "/teams/{teamId}/bots/{botId}/webhooks/deliver-rated", description: "Deliver a sample rated-conversation event." },
  { group: "webhooks", name: "sampleResearch", method: "POST", path: "/teams/{teamId}/bots/{botId}/webhooks/deliver-research", description: "Deliver a sample research-done event." },
  { group: "research", name: "list", method: "GET", path: "/teams/{teamId}/bots/{botId}/research", description: "List research jobs. Query supports page and perPage." },
  { group: "research", name: "get", method: "GET", path: "/teams/{teamId}/bots/{botId}/research/{jobId}", description: "Get a research job and its result." },
  { group: "stats", name: "get", method: "GET", path: "/teams/{teamId}/bots/{botId}/stats", description: "Get bot statistics. Query: startDate and endDate (YYYY-MM-DD) or timeDelta (days)." },
  { group: "stats", name: "reports", method: "GET", path: "/teams/{teamId}/bots/{botId}/reports", description: "Get a monthly report. Query: month (YYYY-MM)." },
];
