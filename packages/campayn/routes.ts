// Endpoint table taken from Campayn's official API documentation (https://github.com/nebojsac/Campayn-API).
// [group, tool name, method, path, path parameters, query parameters, description]
export type Route = readonly [group: string, name: string, method: "GET" | "POST" | "PUT" | "DELETE", path: string, pathParams: readonly string[], queryParams: readonly string[], description: string];

export const routes: readonly Route[] = [
  ["lists", "getLists", "GET", "/lists.json", [], [], "List the contact lists visible to the authenticated user (id, list_name, tags, contact_count)."],
  ["lists", "unsubscribeContact", "POST", "/lists/{listId}/unsubscribe.json", ["listId"], [], 'Unsubscribe a contact from a list. Body is {"id": "<contactId>"} to unsubscribe one contact, or {"email": "<address>"} to unsubscribe every contact on that list with that address. Not shown in reporting.'],
  ["contacts", "getContacts", "GET", "/lists/{listId}/contacts.json", ["listId"], ["filter[contact]"], "List contacts in a list (id, email, first_name, last_name, image_url). filter[contact] matches names, emails and companies."],
  ["contacts", "getContact", "GET", "/contacts/{contactId}.json", ["contactId"], [], "Get the full details of one contact: address, phones, sites, social accounts and custom fields."],
  ["contacts", "createContact", "POST", "/lists/{listId}/contacts.json", ["listId"], [], 'Add a contact to a list. Body fields: email (required), first_name, last_name, title, company, address, city, state, zip, country, phones [{value,type}], sites [{value,type}], social [{value,type,protocol}], custom_fields [{field,value}], failOnDuplicate (boolean).'],
  ["contacts", "updateContact", "PUT", "/contacts/{contactId}.json", ["contactId"], [], "Update a contact. Body takes the same fields as createContact; fields not sent are removed from the contact, so send the complete record."],
  ["forms", "getForms", "GET", "/lists/{listId}/forms.json", ["listId"], ["filter[form_type]"], "List the signup forms of a list. filter[form_type]: 0 signup page, 1 embed, 2 WordPress, 3 Facebook."],
  ["forms", "getForm", "GET", "/lists/{listId}/forms/{formId}.json", ["listId", "formId"], [], "Get one signup form of a list."],
  ["emails", "getEmails", "GET", "/emails.json", [], [], "List emails with basic status and reporting figures (sends, unique views and responses, preview URLs)."],
  ["reports", "getCalendar", "GET", "/reports/calendar.json", [], ["from", "to"], "List sent and scheduled emails with report URLs. from and to are optional UTC timestamps; the vendor docs say microtime but their example is Unix seconds (1420070400). Values are passed through unchanged."],
] as const;
