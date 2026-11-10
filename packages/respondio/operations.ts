export type Operation = {
  group: string;
  name: string;
  method: "GET" | "POST" | "PUT" | "DELETE";
  path: string;
  description: string;
  paginated?: boolean;
};

const id = "{identifier}";
const identifier = "identifier is id:<contactId>, email:<address> or phone:<E.164 number>.";

// Hand-written from https://developers.respond.io (paths relative to https://api.respond.io/v2).
export const operations: Operation[] = [
  { group: "contacts", name: "get", method: "GET", path: `/contact/${id}`, description: `Get a contact. ${identifier}` },
  { group: "contacts", name: "create", method: "POST", path: `/contact/${id}`, description: `Create a contact (firstName, lastName, email, phone, language, profilePic, countryCode, custom_fields, assignee...). ${identifier}` },
  { group: "contacts", name: "update", method: "PUT", path: `/contact/${id}`, description: `Update a contact. ${identifier}` },
  { group: "contacts", name: "delete", method: "DELETE", path: `/contact/${id}`, description: `Delete a contact. ${identifier}` },
  { group: "contacts", name: "createOrUpdate", method: "POST", path: `/contact/create_or_update/${id}`, description: `Create the contact, or update it when it exists. ${identifier}` },
  { group: "contacts", name: "merge", method: "POST", path: "/contact/merge", description: "Merge two contacts. Body: { contactIds: [primaryId, secondaryId] }." },
  { group: "contacts", name: "list", method: "POST", path: "/contact/list", paginated: true, description: "List and search contacts. Body: { search, timezone, filter: { $and: [...] } }. Page with limit (1-100) and cursorId in query." },
  { group: "contacts", name: "addTags", method: "POST", path: `/contact/${id}/tag`, description: `Add tags to a contact. Body: an array of tag names. ${identifier}` },
  { group: "contacts", name: "removeTags", method: "DELETE", path: `/contact/${id}/tag`, description: `Remove tags from a contact. Body: an array of tag names. ${identifier}` },
  { group: "contacts", name: "listChannels", method: "GET", path: `/contact/${id}/channels`, paginated: true, description: `List the channels a contact is connected through. ${identifier}` },
  { group: "contacts", name: "updateLifecycle", method: "POST", path: `/contact/${id}/lifecycle/update`, description: `Set a contact's lifecycle stage. Body: { name }, or { name: null } to clear. ${identifier}` },
  { group: "messages", name: "send", method: "POST", path: `/contact/${id}/message`, description: `Send a message to a contact. Body: { channelId?, message: { type: text | attachment | quick_reply | custom_payload | whatsapp_template | email, ... } }. ${identifier}` },
  { group: "messages", name: "get", method: "GET", path: `/contact/${id}/message/{messageId}`, description: `Get a message and its delivery status. ${identifier}` },
  { group: "messages", name: "list", method: "GET", path: `/contact/${id}/message/list`, paginated: true, description: `List a contact's messages. ${identifier}` },
  { group: "conversations", name: "assign", method: "POST", path: `/contact/${id}/conversation/assignee`, description: `Assign or unassign a conversation. Body: { assignee: <user id, email> or null }. ${identifier}` },
  { group: "conversations", name: "setStatus", method: "POST", path: `/contact/${id}/conversation/status`, description: `Open or close a conversation. Body: { status: "open" | "close", category?, summary? }. ${identifier}` },
  { group: "comments", name: "create", method: "POST", path: `/contact/${id}/comment`, description: `Add an internal comment to a contact; mention users as {{@user.id}}. Body: { text }. ${identifier}` },
  { group: "workspace", name: "listUsers", method: "GET", path: "/space/user", paginated: true, description: "List workspace users." },
  { group: "workspace", name: "getUser", method: "GET", path: "/space/user/{userId}", description: "Get a workspace user." },
  { group: "workspace", name: "listCustomFields", method: "GET", path: "/space/custom_field", paginated: true, description: "List custom fields." },
  { group: "workspace", name: "getCustomField", method: "GET", path: "/space/custom_field/{fieldId}", description: "Get a custom field." },
  { group: "workspace", name: "createCustomField", method: "POST", path: "/space/custom_field", description: "Create a custom field. Body: { name, slug, dataType, description?, allowedValues? }." },
  { group: "workspace", name: "listClosingNotes", method: "GET", path: "/space/closing_notes", paginated: true, description: "List closing note categories used when closing conversations." },
  { group: "workspace", name: "listChannels", method: "GET", path: "/space/channel", paginated: true, description: "List connected channels." },
  { group: "workspace", name: "listChannelTemplates", method: "GET", path: "/space/channel/{channelId}/template", paginated: true, description: "List message templates (such as WhatsApp) of a channel." },
  { group: "workspace", name: "createTag", method: "POST", path: "/space/tag", description: "Create a workspace tag. Body: { name, description?, colorCode?, emoji? }." },
  { group: "workspace", name: "updateTag", method: "PUT", path: "/space/tag", description: "Update a workspace tag. Body: { currentName, name?, description?, colorCode?, emoji? }." },
  { group: "workspace", name: "deleteTag", method: "DELETE", path: "/space/tag", description: "Delete a workspace tag. Body: { name }." },
];
