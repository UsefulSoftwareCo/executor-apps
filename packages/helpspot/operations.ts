// HelpSpot private API methods, from https://support.helpspot.com/index.php?pg=kb.page&id=164.
// `required` and `optional` list the form/query parameter names the method accepts.
export type Operation = {
  group: string;
  name: string;
  method: "GET" | "POST";
  api: string;
  description: string;
  required?: string[];
  optional?: string[];
  array?: string[];
};

const customFields = "Custom<id> (custom field values, pass as e.g. Custom12)";

export const operations: Operation[] = [
  { group: "request", name: "create", method: "POST", api: "private.request.create", description: "Create a request. Needs tNote and xCategory plus at least one of sFirstName, sLastName, sUserId, sEmail or sPhone.", required: ["tNote", "xCategory"], optional: ["xPersonAssignedTo", "fNoteType", "fNoteIsHTML", "xPersonOpenedBy", "sTitle", "reportingTags", "fOpen", "xStatus", "sUserId", "sFirstName", "sLastName", "sEmail", "sPhone", "fUrgent", "fOpenedVia", "xPortal", "dtGMTOpened", "email_from", "email_cc", "email_bcc", "email_to", "email_staff", "skipCustomChecks", customFields] },
  { group: "request", name: "update", method: "POST", api: "private.request.update", description: "Update a request: add a note, reassign, change category or status, close or reopen.", required: ["xRequest"], optional: ["tNote", "xCategory", "xPersonAssignedTo", "xPerson", "fNoteType", "sTitle", "reportingTags", "fOpen", "xStatus", "sUserId", "sFirstName", "sLastName", "sEmail", "sPhone", "fUrgent", "dtGMTChange", "email_from", "email_cc", "email_bcc", "email_to", "email_staff", "skipCustomChecks", "skipReopen", customFields] },
  { group: "request", name: "get", method: "GET", api: "private.request.get", description: "Get one request with its history.", required: ["xRequest"], optional: ["fRawValues", "fIncludeTimeTotal"] },
  { group: "request", name: "multiGet", method: "GET", api: "private.request.multiGet", description: "Get several requests by id. Pass xRequest as an array of ids.", required: ["xRequest"], optional: ["fIncludeTimeTotal"], array: ["xRequest"] },
  { group: "request", name: "search", method: "GET", api: "private.request.search", description: "Search requests by customer, text, status, category, dates and custom fields.", optional: ["anyall", "xRequest", "sUserId", "sFirstName", "sLastName", "sEmail", "sPhone", "sSearch", "xStatus", "xCategory", "fOpen", "fRawValues", "beforeDate", "afterDate", "closedBeforeDate", "closedAfterDate", "relativedate", "start", "length", "orderBy", "orderByDir", "xPersonAssignedTo", "fIncludeTimeTotal", customFields] },
  { group: "request", name: "getChanged", method: "GET", api: "private.request.getChanged", description: "List requests changed since a GMT timestamp.", required: ["dtGMTChange"] },
  { group: "request", name: "merge", method: "POST", api: "private.request.merge", description: "Merge one request into another.", required: ["xRequestFrom", "xRequestTo"] },
  { group: "request", name: "markTrash", method: "POST", api: "private.request.markTrash", description: "Move a request to the trash.", required: ["xRequest"] },
  { group: "request", name: "markSpam", method: "POST", api: "private.request.markSpam", description: "Mark a request as spam.", required: ["xRequest"] },
  { group: "request", name: "subscriptions", method: "GET", api: "private.request.subscriptions", description: "List the requests a staff member is subscribed to.", required: ["xPerson"] },
  { group: "request", name: "subscribe", method: "POST", api: "private.request.subscribe", description: "Subscribe a staff member to a request.", required: ["xRequest", "xPerson"] },
  { group: "request", name: "unsubscribe", method: "POST", api: "private.request.unsubscribe", description: "Unsubscribe a staff member from a request.", required: ["xRequest", "xPerson"] },
  { group: "request", name: "getCategories", method: "GET", api: "private.request.getCategories", description: "List request categories." },
  { group: "request", name: "getMailboxes", method: "GET", api: "private.request.getMailboxes", description: "List mailboxes.", optional: ["fActiveOnly"] },
  { group: "request", name: "getStatusTypes", method: "GET", api: "private.request.getStatusTypes", description: "List request status types.", optional: ["fActiveOnly"] },
  { group: "request", name: "getCustomFields", method: "GET", api: "private.request.getCustomFields", description: "List custom fields, optionally for one category.", optional: ["xCategory"] },
  { group: "time", name: "addEvent", method: "POST", api: "private.request.addTimeEvent", description: "Add a time tracker entry to a request. tTime is hh:mm or decimal hours.", required: ["xRequest", "xPerson", "iMonth", "iDay", "iYear", "tDescription", "tTime"], optional: ["dtGMTDateAdded", "fBillable"] },
  { group: "time", name: "deleteEvent", method: "POST", api: "private.request.deleteTimeEvent", description: "Delete a time tracker entry.", required: ["xTimeId"] },
  { group: "time", name: "getEvents", method: "GET", api: "private.request.getTimeEvents", description: "List the time tracker entries of a request.", required: ["xRequest"], optional: ["fRawValues"] },
  { group: "time", name: "search", method: "GET", api: "private.timetracker.search", description: "Search time tracker entries (defaults to the last 30 days; start_time 0 means all time).", optional: ["sUserId", "sEmail", "sFirstName", "sLastName", "fOpen", "xStatus", "xMailbox", "fOpenedVia", "xCategory", "fUrgent", "xPersonAssignedTo", "xPersonOpenedBy", "start_time", "end_time", "fRawValues", "orderBy", "orderByDir", customFields] },
  { group: "filter", name: "get", method: "GET", api: "private.filter.get", description: "Get the requests in a filter. xFilter is a filter id, \"inbox\" or \"myq\".", required: ["xFilter"], optional: ["fRawValues", "start", "length"] },
  { group: "filter", name: "getColumnNames", method: "GET", api: "private.filter.getColumnNames", description: "List the column names filters return." },
  { group: "filter", name: "getStream", method: "GET", api: "private.filter.getStream", description: "Get the activity stream of a filter. sFilterView is stream, stream-priv, stream-cust or stream-cust-staff.", required: ["xFilter"], optional: ["sFilterView", "fromRequestHistory", "limit"] },
  { group: "response", name: "listAll", method: "GET", api: "private.response.listAll", description: "List all canned responses." },
  { group: "response", name: "usersMostCommon", method: "GET", api: "private.response.usersMostCommon", description: "List the authenticated user's most used canned responses." },
  { group: "response", name: "get", method: "GET", api: "private.response.get", description: "Get one canned response.", required: ["xResponse"] },
  { group: "document", name: "get", method: "GET", api: "private.document.get", description: "Download a request attachment by document id.", required: ["xDocumentId"] },
  { group: "addressBook", name: "getContacts", method: "GET", api: "private.addressbook.getContacts", description: "List address book contacts." },
  { group: "addressBook", name: "createContact", method: "POST", api: "private.addressbook.createContact", description: "Create an address book contact.", required: ["sFirstName", "sLastName", "sEmail"], optional: ["sTitle", "sDescription", "fHighlight"] },
  { group: "addressBook", name: "deleteContact", method: "POST", api: "private.addressbook.deleteContact", description: "Delete an address book contact.", required: ["xContact"] },
  { group: "user", name: "getFilters", method: "GET", api: "private.user.getFilters", description: "List the authenticated user's filters." },
  { group: "user", name: "preferences", method: "GET", api: "private.user.preferences", description: "Get the authenticated user's preferences." },
  { group: "util", name: "getActiveStaff", method: "GET", api: "private.util.getActiveStaff", description: "List active staff members." },
  { group: "util", name: "getAuditLog", method: "GET", api: "private.util.getAuditLog", description: "Read the audit log.", optional: ["start", "length"] },
  { group: "report", name: "getSaved", method: "GET", api: "private.report.getSaved", description: "Run a saved report, optionally between two Unix timestamps.", required: ["xReport"], optional: ["from", "to"] },
];
