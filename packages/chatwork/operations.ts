// Chatwork's OpenAPI definition is only published embedded in each reference page on
// https://developer.chatwork.com/reference/ (no single document URL), so these are the documented
// endpoints of the Chatwork API v2 (https://api.chatwork.com/v2). Write bodies are form-encoded.
export type Operation = {
  group: string;
  name: string;
  method: "GET" | "POST" | "PUT" | "DELETE";
  path: string;
  description: string;
};

const R = "/rooms/{room_id}";

export const operations: readonly Operation[] = [
  { group: "me", name: "get", method: "GET", path: "/me", description: "Get the authenticated user's profile (account_id, name, chatwork_id, organization, department, mail...)." },
  { group: "me", name: "getStatus", method: "GET", path: "/my/status", description: "Get the user's unread, mention and open-task counts." },
  { group: "me", name: "listTasks", method: "GET", path: "/my/tasks", description: "List the user's tasks (max 100). Query: assigned_by_account_id, status (open or done)." },
  { group: "contacts", name: "list", method: "GET", path: "/contacts", description: "List the user's contacts." },
  { group: "contacts", name: "listIncomingRequests", method: "GET", path: "/incoming_requests", description: "List pending contact approval requests sent to the user (max 100)." },
  { group: "contacts", name: "approveIncomingRequest", method: "PUT", path: "/incoming_requests/{request_id}", description: "Approve a contact request." },
  { group: "contacts", name: "rejectIncomingRequest", method: "DELETE", path: "/incoming_requests/{request_id}", description: "Reject a contact request." },
  { group: "rooms", name: "list", method: "GET", path: "/rooms", description: "List the chats the user belongs to." },
  { group: "rooms", name: "create", method: "POST", path: "/rooms", description: "Create a group chat. Body: name (required), description, icon_preset, link (1 to create an invite link), link_code, link_need_acceptance (1 or 0), members_admin_ids (required, comma-separated account ids; at least one admin), members_member_ids, members_readonly_ids." },
  { group: "rooms", name: "get", method: "GET", path: R, description: "Get a chat's information (name, type, icon, role, unread counts, description)." },
  { group: "rooms", name: "update", method: "PUT", path: R, description: "Update a group chat. Body: name, description, icon_preset." },
  { group: "rooms", name: "leaveOrDelete", method: "DELETE", path: R, description: "Leave or delete a group chat. Body: action_type (required): leave or delete. Leaving removes the user's tasks and uploaded files there; deleting removes all messages, tasks and files and cannot be undone." },
  { group: "rooms", name: "listMembers", method: "GET", path: `${R}/members`, description: "List a chat's members." },
  { group: "rooms", name: "updateMembers", method: "PUT", path: `${R}/members`, description: "Replace the whole member list of a group chat. Body: members_admin_ids (required, comma-separated account ids), members_member_ids, members_readonly_ids. Anyone omitted is removed." },
  { group: "rooms", name: "getInviteLink", method: "GET", path: `${R}/link`, description: "Get the chat's invitation link." },
  { group: "rooms", name: "createInviteLink", method: "POST", path: `${R}/link`, description: "Create the chat's invitation link (400 if one exists). Body: code, need_acceptance (1 or 0), description." },
  { group: "rooms", name: "updateInviteLink", method: "PUT", path: `${R}/link`, description: "Change the chat's invitation link (400 if disabled). Body: code, need_acceptance (1 or 0), description." },
  { group: "rooms", name: "deleteInviteLink", method: "DELETE", path: `${R}/link`, description: "Delete the chat's invitation link (400 if disabled)." },
  { group: "messages", name: "list", method: "GET", path: `${R}/messages`, description: "List up to 100 messages. Query: force (1 returns the latest 100; 0 returns only messages not fetched since the last call)." },
  { group: "messages", name: "post", method: "POST", path: `${R}/messages`, description: "Post a message. Body: body (required, Chatwork message notation such as [To:123] and [info]), self_unread (1 to keep it unread for the sender)." },
  { group: "messages", name: "markRead", method: "PUT", path: `${R}/messages/read`, description: "Mark messages as read up to message_id (body). Omitting it marks all read." },
  { group: "messages", name: "markUnread", method: "PUT", path: `${R}/messages/unread`, description: "Mark messages as unread from message_id (body, required)." },
  { group: "messages", name: "get", method: "GET", path: `${R}/messages/{message_id}`, description: "Get one message." },
  { group: "messages", name: "update", method: "PUT", path: `${R}/messages/{message_id}`, description: "Edit one of the user's messages. Body: body (required)." },
  { group: "messages", name: "delete", method: "DELETE", path: `${R}/messages/{message_id}`, description: "Delete one of the user's messages." },
  { group: "tasks", name: "list", method: "GET", path: `${R}/tasks`, description: "List up to 100 tasks in a chat. Query: account_id (assignee), assigned_by_account_id, status (open or done)." },
  { group: "tasks", name: "create", method: "POST", path: `${R}/tasks`, description: "Add a task. Body: body (required), to_ids (required, comma-separated assignee account ids), limit (unix timestamp deadline), limit_type (none, date or time)." },
  { group: "tasks", name: "get", method: "GET", path: `${R}/tasks/{task_id}`, description: "Get one task." },
  { group: "tasks", name: "updateStatus", method: "PUT", path: `${R}/tasks/{task_id}/status`, description: "Set a task's completion state. Body: body (required): open or done." },
  { group: "files", name: "list", method: "GET", path: `${R}/files`, description: "List up to 100 files in a chat. Query: account_id (uploader)." },
  { group: "files", name: "get", method: "GET", path: `${R}/files/{file_id}`, description: "Get a file's information. Query: create_download_url (1 returns a download URL valid for 30 seconds)." },
];
