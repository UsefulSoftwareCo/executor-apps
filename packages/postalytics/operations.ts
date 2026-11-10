// Hand-written from Postalytics' API reference (https://docs.postalytics.com).
// Postalytics publishes no OpenAPI document. Param types: s string, n number, j JSON
// (an object sent as the request body, or a value in the query string).
export type ParamType = "s" | "n" | "j";
export interface Param {
  readonly name: string;
  readonly type: ParamType;
  readonly required?: boolean;
  /** Where the value goes: a path segment, the query string or the JSON body. */
  readonly in: "path" | "query" | "body";
}
export interface Operation {
  readonly group: string;
  readonly name: string;
  readonly method: "GET" | "POST" | "PUT" | "DELETE";
  readonly path: string;
  readonly description: string;
  readonly params: readonly Param[];
}

const path = (name: string, type: ParamType = "n"): Param => ({ name, type, required: true, in: "path" });
const query = (name: string, type: ParamType = "n"): Param => ({ name, type, in: "query" });
const b = (): Param => ({ name: "body", type: "j", required: true, in: "body" });

const contact =
  "body fields (snake_case): contact_list_id, first_name, last_name, company, email_address, phone, mobile_phone, occupation, address_street, address_street2, address_city, address_state, address_zip, var_field_1 through var_field_30.";

export const operations: readonly Operation[] = [
  { group: "account", name: "me", method: "GET", path: "/api/v1/account/me", description: "Get basic information about the authenticated account.", params: [] },
  { group: "account", name: "get", method: "GET", path: "/api/v1/account/{id}", description: "Get the account with the given ID (password is not returned).", params: [path("id")] },
  { group: "account", name: "create", method: "POST", path: "/api/v1/account", description: "Create a sub-account under the requester. Returns the new account's API key and user ID. body fields: username (unique), password (8+ characters with upper, lower, number and special character), email_address, first_name, last_name, company, phone, address_street, address_city, address_state, address_zip.", params: [b()] },
  { group: "account", name: "update", method: "PUT", path: "/api/v1/account", description: "Update an existing account or sub-account. body takes the same fields as account.create plus account_id.", params: [b()] },
  { group: "account", name: "delete", method: "DELETE", path: "/api/v1/account/{id}", description: "Delete a sub-account or sub-user. Permanently deletes its campaigns, templates and lists. Parent accounts cannot be deleted through the API.", params: [path("id")] },
  { group: "account", name: "integrations", method: "GET", path: "/api/v1/account/integrations", description: "List the integrations configured on the account.", params: [] },
  { group: "account", name: "loginLink", method: "POST", path: "/api/v1/loginlink", description: "Create a temporary auto-login URL for the Postalytics app. body fields: id, domain, url, api_key.", params: [b()] },

  { group: "campaigns", name: "list", method: "GET", path: "/api/v1/campaigns", description: "List all campaigns with their stats and flags.", params: [] },
  { group: "campaigns", name: "get", method: "GET", path: "/api/v1/campaigns/{id}", description: "Get a campaign. campaign_type: 1 SmartSend, 2 Automated File, 3 Triggered Drip. status: 1 sent, 0 pending, -1 draft, 9 or 10 processing.", params: [path("id")] },
  { group: "campaigns", name: "details", method: "GET", path: "/api/v1/campaigns/{id}/details", description: "Get the delivery statistics and details of a campaign.", params: [path("id")] },
  { group: "campaigns", name: "drips", method: "GET", path: "/api/v1/campaigns/drips", description: "List triggered drip campaigns, including their endpoint IDs for the send API.", params: [] },
  { group: "campaigns", name: "create", method: "POST", path: "/api/v1/campaigns", description: "Create a campaign. A proofed template must exist first; include its template id. body fields: direct_mail_name, template_id, contact_list_id, suppression_list_id, sender_name, sender_address1, sender_address2, sender_city, sender_state, sender_zip, sender_country, is_live_mode, direct_mail_send_date, has_reply_envelope, postage_type.", params: [b()] },
  { group: "campaigns", name: "setStatus", method: "PUT", path: "/api/v1/campaigns/{id}", description: "Move a Triggered Drip or Automated File campaign between test mode and live. body: { is_live_mode: boolean }.", params: [path("id"), b()] },
  { group: "campaigns", name: "delete", method: "DELETE", path: "/api/v1/campaigns/{id}", description: "Delete a campaign.", params: [path("id")] },
  { group: "campaigns", name: "events", method: "GET", path: "/api/v1/campaigns/{id}/events", description: "List the tracking events (delivery, scans, visits) of a campaign.", params: [path("id")] },
  { group: "campaigns", name: "contactEvents", method: "GET", path: "/api/v1/campaigns/{id}/events/{dataid}", description: "List the tracking events of one recipient (data ID) in a campaign.", params: [path("id"), path("dataid")] },

  { group: "templates", name: "list", method: "GET", path: "/api/v1/templates", description: "List all templates.", params: [] },
  { group: "templates", name: "get", method: "GET", path: "/api/v1/templates/{id}", description: "Get a template.", params: [path("id")] },
  { group: "templates", name: "create", method: "POST", path: "/api/v1/templates", description: "Create a template either from front and back images (front, back) or from full HTML (html with is_full_html). Other fields: name, size, is_double_sided, font_family, is_proofed. Setting is_proofed to true skips proofing; Postalytics takes no responsibility for malformed templates.", params: [b()] },
  { group: "templates", name: "delete", method: "DELETE", path: "/api/v1/templates/{id}", description: "Delete a template.", params: [path("id")] },

  { group: "contacts", name: "lists", method: "GET", path: "/api/v1/contacts", description: "List all contact lists in the account.", params: [] },
  { group: "contacts", name: "list", method: "GET", path: "/api/v1/contacts/{id}", description: "List contacts on a contact list. start is the first row; limit is capped at 100.", params: [path("id"), query("start"), query("limit")] },
  { group: "contacts", name: "get", method: "GET", path: "/api/v1/contacts/details/{id}", description: "Get one contact by ID.", params: [path("id")] },
  { group: "contacts", name: "create", method: "POST", path: "/api/v1/contacts", description: `Create a contact on a list. ${contact}`, params: [b()] },
  { group: "contacts", name: "update", method: "PUT", path: "/api/v1/contacts", description: `Update a contact on a list; include contact_id. ${contact}`, params: [b()] },
  { group: "contacts", name: "delete", method: "DELETE", path: "/api/v1/contacts/{id}", description: "Delete a contact.", params: [path("id")] },

  { group: "suppression", name: "lists", method: "GET", path: "/api/v1/lists/suppression", description: "List suppression lists.", params: [query("id")] },
  { group: "suppression", name: "get", method: "GET", path: "/api/v1/lists/suppression/{id}", description: "Get a suppression list.", params: [path("id")] },
  { group: "suppression", name: "create", method: "POST", path: "/api/v1/lists/suppression", description: "Create a suppression list. body fields: name, country.", params: [b()] },
  { group: "suppression", name: "delete", method: "DELETE", path: "/api/v1/lists/suppression/{id}", description: "Delete a suppression list.", params: [path("id")] },
  { group: "suppression", name: "contacts", method: "GET", path: "/api/v1/lists/suppression/contacts/{listId}", description: "List contacts on a suppression list; offset pages through them.", params: [path("listId"), query("offset")] },
  { group: "suppression", name: "getContact", method: "GET", path: "/api/v1/lists/suppression/contacts/{listId}/{contactId}", description: "Get one contact on a suppression list.", params: [path("listId"), path("contactId")] },
  { group: "suppression", name: "addContact", method: "POST", path: "/api/v1/lists/suppression/contacts/{listId}", description: "Add a contact to a suppression list. body fields: first_name, last_name, company, email, phone, mobile, occupation, address, address2, city, state, country, zip, var_field_1 through var_field_30.", params: [path("listId"), b()] },
  { group: "suppression", name: "updateContact", method: "PUT", path: "/api/v1/lists/suppression/contacts/{listId}/{contactId}", description: "Update a contact on a suppression list. body takes the same fields as suppression.addContact.", params: [path("listId"), path("contactId"), b()] },
  { group: "suppression", name: "deleteContact", method: "DELETE", path: "/api/v1/lists/suppression/contacts/{listId}/{contactId}", description: "Remove a contact from a suppression list.", params: [path("listId"), path("contactId")] },

  { group: "send", name: "send", method: "POST", path: "/api/v1/send/{endPoint}", description: "Send one mailpiece through a triggered drip campaign. endPoint is the campaign's endpoint ID (see campaigns.drips). body fields: first_name, last_name, address_street, address_street2, address_city, address_state, address_zip (required), company, phone, mobile_phone, occupation, website, var_field_1 through var_field_30. Returns the ID of the mailpiece.", params: [path("endPoint", "s"), b()] },

  { group: "flows", name: "list", method: "GET", path: "/api/v1/flow", description: "List flows.", params: [] },
  { group: "flows", name: "get", method: "GET", path: "/api/v1/flow/{endpointId}", description: "Get a flow by endpoint ID.", params: [path("endpointId", "s")] },
  { group: "flows", name: "enroll", method: "POST", path: "/api/v1/flow/{endPoint}", description: "Enroll a contact into a flow. body: { campaign_id?, contact: { first_name, last_name, address fields, var_field_n } }.", params: [path("endPoint", "s"), b()] },
  { group: "flows", name: "unenroll", method: "DELETE", path: "/api/v1/flow/unenroll/{endPoint}/{dataId}", description: "Unenroll a contact (data ID) from a flow.", params: [path("endPoint", "s"), path("dataId")] },

  { group: "webhooks", name: "list", method: "GET", path: "/api/v1/webhooks", description: "List webhooks.", params: [] },
  { group: "webhooks", name: "get", method: "GET", path: "/api/v1/webhooks/{id}", description: "Get a webhook.", params: [path("id")] },
  { group: "webhooks", name: "create", method: "POST", path: "/api/v1/webhooks", description: "Create a webhook that posts campaign events to a URL. body fields: endpoint_id (the endpoint linked to the campaign), url (third-party URL that receives the webhook), is_subscribed (1 active, 0 inactive); campaign_name is the webhook name. campaign_id is the webhook id and is not required here. Which events are sent is edited in the Postalytics app.", params: [b()] },
  { group: "webhooks", name: "update", method: "PUT", path: "/api/v1/webhooks", description: "Update a webhook. body takes the same fields as webhooks.create (endpoint_id, campaign_name, url, is_subscribed) plus campaign_id, which is the id of the webhook being updated.", params: [b()] },
  { group: "webhooks", name: "delete", method: "DELETE", path: "/api/v1/webhooks/{id}", description: "Delete a webhook.", params: [path("id")] },
];
