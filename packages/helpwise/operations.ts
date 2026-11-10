export type Operation = {
  group: string;
  name: string;
  method: "GET" | "POST" | "PUT" | "DELETE";
  /** Which API the endpoint belongs to: v1 (apis.helpwise.io) or v0 (app.helpwise.io/dev-apis). */
  api: "v1" | "v0";
  path: string;
  description: string;
};

// Endpoints from Helpwise's official Postman documentation
// (https://documenter.getpostman.com/view/29744652/2s9YC5yYKf).
export const operations: Operation[] = [
  // V1 (https://apis.helpwise.io)
  { group: "conversations", name: "list", api: "v1", method: "GET", path: "/conversations", description: "List conversations. Query: inboxIds (array), labelId, limit (max 100), pageToken." },
  { group: "conversations", name: "get", api: "v1", method: "GET", path: "/inboxes/{inboxId}/conversations/{conversationId}", description: "Get a conversation. Query: labelId." },
  { group: "conversations", name: "close", api: "v1", method: "PUT", path: "/conversations/action/close", description: "Close conversations. Body: ids (array of integer ids, fewer than 100)." },
  { group: "conversations", name: "moveToInbox", api: "v1", method: "PUT", path: "/conversations/action/moveToInbox", description: "Move conversations back to the inbox. Body: ids (array of integer ids, fewer than 100)." },
  { group: "conversations", name: "markSpam", api: "v1", method: "PUT", path: "/conversations/action/spam", description: "Mark conversations as spam. Body: ids (array of integer ids, fewer than 100)." },
  { group: "conversations", name: "trash", api: "v1", method: "PUT", path: "/conversations/action/trash", description: "Move conversations to trash. Body: ids (array of integer ids, fewer than 100)." },
  { group: "conversations", name: "delete", api: "v1", method: "PUT", path: "/conversations/action/delete", description: "Delete conversations permanently. Body: ids (array of integer ids, fewer than 100)." },
  { group: "messages", name: "sendSmsOrWhatsApp", api: "v1", method: "POST", path: "/smsWhatsApp/sendMsg", description: "Send or schedule an SMS or WhatsApp message. Body: body, clientNumber, inboxId, hash, optional template {templateId, templateVariables} for WhatsApp, optional sendAt (ISO time) with scheduleMsg true to schedule." },
  { group: "customFields", name: "list", api: "v1", method: "GET", path: "/customFields", description: "List custom fields." },
  { group: "customFields", name: "get", api: "v1", method: "GET", path: "/customFields/{id}", description: "Get a custom field." },
  { group: "customFields", name: "create", api: "v1", method: "POST", path: "/customFields", description: "Create a custom field. Body: name, description." },
  { group: "customFields", name: "update", api: "v1", method: "PUT", path: "/customFields/{id}", description: "Update a custom field. Body: name, description." },
  { group: "customFields", name: "delete", api: "v1", method: "DELETE", path: "/customFields/{id}", description: "Delete a custom field." },
  { group: "customFields", name: "listForInbox", api: "v1", method: "GET", path: "/customFields/inbox/{inboxId}", description: "List the custom fields of an inbox." },
  { group: "customFields", name: "updateForInbox", api: "v1", method: "PUT", path: "/customFields/inbox/{inboxId}", description: "Hide or unhide custom fields in an inbox. Body: hideIds, unHideIds (arrays of field ids)." },
  { group: "contacts", name: "list", api: "v1", method: "GET", path: "/contacts", description: "List contacts. Query: limit, offset." },
  { group: "contacts", name: "search", api: "v1", method: "GET", path: "/contacts/search", description: "Search contacts. Query: term, limit, offset." },
  { group: "contacts", name: "get", api: "v1", method: "GET", path: "/contacts/{contactId}", description: "Get a contact." },
  { group: "contacts", name: "create", api: "v1", method: "POST", path: "/contacts", description: "Create a contact. Body: firstname, lastname, company, jobTitle, emails (array), phones (array of {phoneTxt, phoneNo, type}), customFields (array of {id, value})." },
  { group: "contacts", name: "update", api: "v1", method: "PUT", path: "/contacts/{contactId}", description: "Update a contact. Body takes the same fields as create." },
  { group: "tags", name: "list", api: "v1", method: "GET", path: "/tags", description: "List tags." },
  { group: "tags", name: "get", api: "v1", method: "GET", path: "/tags/{tagId}", description: "Get a tag." },
  { group: "tags", name: "apply", api: "v1", method: "POST", path: "/tags/apply", description: "Apply tags to conversations. Body: threadIds, tagIds (arrays of integer ids)." },
  { group: "tags", name: "remove", api: "v1", method: "POST", path: "/tags/remove", description: "Remove tags from conversations. Body: threadIds, tagIds (arrays of integer ids)." },
  { group: "reports", name: "overall", api: "v1", method: "GET", path: "/reports", description: "Overall report. Query: start, end (YYYY-MM-DD HH:mm:ss), inboxId, tagId (array), isBusinessHours (0 or 1)." },
  { group: "reports", name: "tags", api: "v1", method: "GET", path: "/inboxes/{inboxId}/reports/tags", description: "Tags report of an inbox. Query: start, end, tagId (array), isBusinessHours." },
  // V0 (https://app.helpwise.io/dev-apis), all POST with a JSON body
  { group: "mailboxes", name: "list", api: "v0", method: "POST", path: "/mailboxes/list", description: "List mailboxes. Body: page, limit." },
  { group: "mailboxes", name: "get", api: "v0", method: "POST", path: "/mailboxes/get", description: "Get a mailbox. Body: id." },
  { group: "users", name: "me", api: "v0", method: "POST", path: "/users/me", description: "Get the user the API key belongs to." },
  { group: "users", name: "list", api: "v0", method: "POST", path: "/users/list", description: "List users of a mailbox. Body: mailbox_id." },
  { group: "threads", name: "list", api: "v0", method: "POST", path: "/threads/list", description: "List conversations of a mailbox. Body: mailboxId, limit, page." },
  { group: "threads", name: "get", api: "v0", method: "POST", path: "/threads/get", description: "Get a conversation with its emails. Body: mailbox_id, thread_id." },
  { group: "threads", name: "assign", api: "v0", method: "POST", path: "/threads/assign", description: "Assign a conversation to a user. Body: mailbox_id, thread_id, assigned_to (user id)." },
  { group: "emails", name: "list", api: "v0", method: "POST", path: "/emails/list", description: "List emails of a conversation. Body: mailboxId, threadId, limit, page." },
  { group: "emails", name: "send", api: "v0", method: "POST", path: "/emails/send_mail", description: "Send an email. Body: mailbox_id, to (comma-separated), cc, subject, reply_to, body (HTML)." },
  { group: "notes", name: "add", api: "v0", method: "POST", path: "/notes/add", description: "Add an internal note to a conversation. Body: mailbox_id, thread_id, message." },
  { group: "chat", name: "send", api: "v0", method: "POST", path: "/chat/send", description: "Send a chat message in a conversation. Body: mailbox_id, thread_id, message." },
  { group: "sms", name: "send", api: "v0", method: "POST", path: "/sms/send", description: "Send an SMS. Body: mailbox_id, to, message." },
  { group: "whatsapp", name: "listTemplates", api: "v0", method: "POST", path: "/whatsapp/templates/list", description: "List WhatsApp templates of a mailbox. Body: mailbox_id." },
  { group: "whatsapp", name: "send", api: "v0", method: "POST", path: "/whatsapp/send", description: "Send a WhatsApp message. Body: mailbox_id, to, message, templateId, template_variables_data (array)." },
  { group: "contactsV0", name: "list", api: "v0", method: "POST", path: "/contacts/list.php", description: "List contacts (legacy). Body: order, page, limit (under 100), offset." },
  { group: "contactsV0", name: "search", api: "v0", method: "POST", path: "/contacts/search", description: "Search contacts (legacy). Body: name, phone, email." },
  { group: "contactsV0", name: "get", api: "v0", method: "POST", path: "/contacts/get", description: "Get a contact (legacy). Body: id." },
  { group: "contactsV0", name: "create", api: "v0", method: "POST", path: "/contacts/create", description: "Create a contact (legacy). Body: firstname, lastname, companyName, jobTitle, emails, phones." },
];
