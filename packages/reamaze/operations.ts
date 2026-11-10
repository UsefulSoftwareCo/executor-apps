// Re:amaze publishes no OpenAPI document; these are the endpoints documented at
// https://www.reamaze.com/api (base https://{brand}.reamaze.io/api/v1). Write bodies are JSON.
export type Operation = {
  group: string;
  name: string;
  method: "GET" | "POST" | "PUT" | "DELETE";
  path: string;
  description: string;
};

export const operations: readonly Operation[] = [
  { group: "conversations", name: "list", method: "GET", path: "/conversations", description: "List conversations for the brand. Query: filter (archived, open, unassigned, all), for (customer email), for_id, sort (updated, changed), tag (comma separated), category (channel slug), q, page. Returns page_size, page_count, total_count and conversations." },
  { group: "conversations", name: "get", method: "GET", path: "/conversations/{slug}", description: "Get one conversation by slug. Query: id_type (ref to look up by reference id, origin to look up by origin id together with category and channel)." },
  { group: "conversations", name: "create", method: "POST", path: "/conversations", description: "Create a conversation on behalf of a customer. Body: {conversation: {subject, category (channel slug, e.g. support), tag_list, message: {body, recipients}, user: {name, email}}}." },
  { group: "conversations", name: "update", method: "PUT", path: "/conversations/{slug}", description: "Update a conversation. Body: {conversation: {assignee: {email}, tag_list, status (0 unresolved, 1 pending, 2 resolved, 3 spam, 4 archived), data: {custom fields}}}." },
  { group: "messages", name: "list", method: "GET", path: "/messages", description: "List individual messages across all conversations in the brand. Query: filter (staff, customer), tag, origin, sent_by (staff email), category (channel slug), start_date, end_date (ISO8601), include (original_body), page." },
  { group: "messages", name: "listForConversation", method: "GET", path: "/conversations/{slug}/messages", description: "List messages of one conversation. Same query parameters as messages.list." },
  { group: "messages", name: "create", method: "POST", path: "/conversations/{slug}/messages", description: "Reply to a conversation. Body: {message: {body, visibility (0 public reply, 1 internal note), suppress_notifications, recipients, attachments}}." },
  { group: "contacts", name: "list", method: "GET", path: "/contacts", description: "List contacts (tied to the account, not the brand). Query: q, data[key]=value filters, sort (date), type (email, mobile), page." },
  { group: "contacts", name: "create", method: "POST", path: "/contacts", description: "Create a contact. Body: {contact: {name, email or mobile, id, external_avatar_url, notes: [strings], data: {custom attributes}}}." },
  { group: "contacts", name: "update", method: "PUT", path: "/contacts/{identifier}", description: "Update a contact by email (or another identifier type via the identifier_type query: mobile, facebook, twitter, instagram). Body: {contact: {...}}." },
  { group: "contacts", name: "listIdentities", method: "GET", path: "/contacts/{identifier}/identities", description: "List the identities (emails, mobiles, social handles) of a contact." },
  { group: "contacts", name: "createIdentity", method: "POST", path: "/contacts/{identifier}/identities", description: "Attach an email, mobile number, twitter handle or instagram user to a contact. Query: identifier_type when the identifier is not an email. Body: {identity: {type, identifier}}." },
  { group: "contactNotes", name: "list", method: "GET", path: "/contacts/{identifier}/notes", description: "List notes of a contact (identifier is an email or phone)." },
  { group: "contactNotes", name: "create", method: "POST", path: "/contacts/{identifier}/notes", description: "Add a note to a contact. Body: {body}. Returns all notes of the contact." },
  { group: "contactNotes", name: "update", method: "PUT", path: "/contacts/{identifier}/notes/{id}", description: "Update a contact note. Body: {body}." },
  { group: "contactNotes", name: "delete", method: "DELETE", path: "/contacts/{identifier}/notes/{id}", description: "Delete a contact note." },
  { group: "articles", name: "list", method: "GET", path: "/articles", description: "List help articles (published by default). Query: status (published, draft, internal), q, page." },
  { group: "articles", name: "listForTopic", method: "GET", path: "/topics/{topic}/articles", description: "List help articles within a topic slug. Query: status, q, page." },
  { group: "articles", name: "get", method: "GET", path: "/articles/{slug}", description: "Get a help article by slug." },
  { group: "articles", name: "create", method: "POST", path: "/topics/{topic}/articles", description: "Create a help article in a topic. Body: {article: {title, body, status (0 published, 1 draft, 4 internal), topic_id}}." },
  { group: "articles", name: "update", method: "PUT", path: "/articles/{slug}", description: "Update a help article. Body: {article: {title, body, status}}." },
  { group: "channels", name: "list", method: "GET", path: "/channels", description: "List channels of the brand. Query: channel (email, facebook, twitter, chat)." },
  { group: "channels", name: "get", method: "GET", path: "/channels/{slug}", description: "Get a channel by slug." },
  { group: "responseTemplates", name: "list", method: "GET", path: "/response_templates", description: "List response templates, including the caller's personal ones. Query: q, page." },
  { group: "responseTemplates", name: "get", method: "GET", path: "/response_templates/{id}", description: "Get a response template." },
  { group: "responseTemplates", name: "create", method: "POST", path: "/response_templates", description: "Create a response template. Body: {response_template: {name, body, is_personal (0 or 1)}}." },
  { group: "responseTemplates", name: "update", method: "PUT", path: "/response_templates/{id}", description: "Update a response template. Body: {response_template: {name, body, is_personal}}." },
  { group: "staff", name: "list", method: "GET", path: "/staff", description: "List staff users of the account." },
  { group: "staff", name: "create", method: "POST", path: "/staff", description: "Create a staff user (may raise the subscription cost). Body: {staff: {name, email, password}}." },
  { group: "satisfactionRatings", name: "list", method: "GET", path: "/satisfaction_ratings", description: "List satisfaction survey ratings for all brands. Query: brand (brand url to filter), page." },
  { group: "reports", name: "volume", method: "GET", path: "/reports/volume", description: "Daily conversation volume. Query: brand, start_date, end_date (default last 30 days; between 1 day and 1 year)." },
  { group: "reports", name: "responseTime", method: "GET", path: "/reports/response_time", description: "Daily response time (seconds) and summary. Query: brand, start_date, end_date." },
  { group: "reports", name: "staff", method: "GET", path: "/reports/staff", description: "Per-staff metrics. Query: brand, start_date, end_date." },
  { group: "reports", name: "tags", method: "GET", path: "/reports/tags", description: "Tag usage summary. Query: brand, start_date, end_date." },
  { group: "reports", name: "channelSummary", method: "GET", path: "/reports/channel_summary", description: "Channel metrics summary. Query: brand, start_date, end_date." },
  { group: "incidents", name: "list", method: "GET", path: "/incidents", description: "List status page incidents of the brand." },
  { group: "incidents", name: "listActive", method: "GET", path: "/incidents/active", description: "List only active status page incidents." },
  { group: "incidents", name: "get", method: "GET", path: "/incidents/{identifier}", description: "Get a status page incident." },
  { group: "incidents", name: "create", method: "POST", path: "/incidents", description: "Create an incident. Body: {incident: {title, updates_attributes: [{status, message}], incidents_systems_attributes: [{system_id, status}]}}." },
  { group: "incidents", name: "update", method: "PUT", path: "/incidents/{identifier}", description: "Update an incident or add an update to it. Body: {incident: {title, updates_attributes: [{status, message}]}}." },
  { group: "systems", name: "list", method: "GET", path: "/systems", description: "List status page systems of the brand." },
];
