// [group, name, method, path, pathParams, query params, required body fields, optional body fields, description]
// Body fields are sent form-encoded, except the bulk member sync which takes JSON.
export type Route = readonly [
  group: string,
  name: string,
  method: "GET" | "POST" | "DELETE",
  path: string,
  pathParams: readonly string[],
  queryParams: readonly string[],
  requiredBody: readonly string[],
  optionalBody: readonly string[],
  description: string,
];

const memberPaging = ["limit", "cursor", "order_by", "order"] as const;
const campaignFields = ["previewtext", "reply_to", "stats"] as const;

export const routes: readonly Route[] = [
  ["lists", "list", "GET", "/v2/list", [], [], [], [], "List all mailing lists with member counts."],
  ["lists", "get", "GET", "/v2/list/{list_id}", ["list_id"], [], [], [], "Get one list."],
  ["lists", "create", "POST", "/v2/list", [], [], ["name"], ["locked", "remarks", "subscribe_notification_email", "unsubscribe_notification_email"], "Create a list."],
  ["lists", "update", "POST", "/v2/list/{list_id}", ["list_id"], [], [], ["name", "locked", "remarks", "subscribe_notification_email", "unsubscribe_notification_email"], "Update a list; only the fields sent change."],
  ["lists", "delete", "DELETE", "/v2/list/{list_id}", ["list_id"], [], [], [], "Delete a list (returned with state deleted)."],
  ["lists", "clear_members", "DELETE", "/v2/list/{list_id}/members", ["list_id"], [], [], [], "Permanently remove all active members from the list but keep the list."],

  ["fields", "list", "GET", "/v2/field", [], ["list_id"], [], [], "List the fields of a list. Required: list_id."],
  ["fields", "get", "GET", "/v2/field/{field_id}", ["field_id"], ["list_id"], [], [], "Get one field. Required: list_id."],
  ["fields", "create", "POST", "/v2/field", [], [], ["list_id", "name", "datatype", "required", "in_form", "in_list"], ["defaultvalue", "datatype_display", "options"], "Create a field. datatype is text, numeric, date, select_single or select_multiple. required, in_form and in_list are true or false. options (array of strings) is required for select types."],
  ["fields", "update", "POST", "/v2/field/{field_id}", ["field_id"], [], ["list_id"], ["name", "datatype", "datatype_display", "options_full", "defaultvalue", "required", "in_form", "in_list"], "Update a field. Changing datatype erases member data for it. options_full replaces the whole option set as an id to label map (new options use non-numeric keys such as new-0)."],
  ["fields", "delete", "DELETE", "/v2/field/{field_id}", ["field_id"], ["list_id"], [], [], "Delete a field. Required: list_id."],

  ["segments", "list", "GET", "/v2/segment", [], ["list_id"], [], [], "List the segments of a list. Required: list_id."],
  ["segments", "get", "GET", "/v2/segment/{segment_id}", ["segment_id"], ["list_id"], [], [], "Get one segment with its JSON definition. Required: list_id."],
  ["segments", "create", "POST", "/v2/segment", [], [], ["list_id", "name", "definition"], [], "Create a segment. definition is a JSON string; build the segment in the Laposta app first and copy its definition from the API."],
  ["segments", "update", "POST", "/v2/segment/{segment_id}", ["segment_id"], [], ["list_id"], ["name", "definition"], "Update a segment."],
  ["segments", "delete", "DELETE", "/v2/segment/{segment_id}", ["segment_id"], ["list_id"], [], [], "Delete a segment. Required: list_id."],

  ["members", "list", "GET", "/v2/member", [], ["list_id", "state", "search", "label", ...memberPaging], [], [], "List members of a list. Required: list_id. Without limit or cursor everything is returned at once; with them the response is paged (reuse the same filters with pagination.next_cursor). state is active, unsubscribed or cleaned. order_by is email, signup_date or a text-field tag."],
  ["members", "get", "GET", "/v2/member/{member_id}", ["member_id"], ["list_id"], [], [], "Get a member by id or email address. Required: list_id."],
  ["members", "history", "GET", "/v2/member/{member_id}/history", ["member_id"], ["list_id", "campaign_id", "event_date_from", "event_date_to", ...memberPaging], [], [], "Event history of a member (subscription changes, campaign results, automations). Required: list_id. Cursor-paged."],
  ["members", "create", "POST", "/v2/member", [], [], ["list_id", "ip", "email"], ["source_url", "custom_fields", "user_agent", "options"], "Add a member. custom_fields is an object keyed by field custom_name (labels and multi-select take arrays). options is an object with optional upsert, suppress_reactivation, suppress_email_notification, ignore_doubleoptin and spam_check booleans."],
  ["members", "update", "POST", "/v2/member/{member_id}", ["member_id"], [], ["list_id"], ["email", "state", "custom_fields"], "Update a member by id or email. state is active or unsubscribed."],
  ["members", "delete", "DELETE", "/v2/member/{member_id}", ["member_id"], ["list_id"], [], [], "Delete a member. Required: list_id."],

  ["webhooks", "list", "GET", "/v2/webhook", [], ["list_id"], [], [], "List the webhooks of a list. Required: list_id."],
  ["webhooks", "get", "GET", "/v2/webhook/{webhook_id}", ["webhook_id"], ["list_id"], [], [], "Get one webhook, including its signing secret. Required: list_id."],
  ["webhooks", "create", "POST", "/v2/webhook", [], [], ["list_id", "event", "url", "blocked"], [], "Create a webhook. event is subscribed, modified or deactivated. blocked is true or false (whether blocked addresses are included)."],
  ["webhooks", "update", "POST", "/v2/webhook/{webhook_id}", ["webhook_id"], [], ["list_id"], ["event", "url", "blocked"], "Update a webhook."],
  ["webhooks", "delete", "DELETE", "/v2/webhook/{webhook_id}", ["webhook_id"], ["list_id"], [], [], "Delete a webhook. Required: list_id."],

  ["campaigns", "list", "GET", "/v2/campaign", [], [], [], [], "List all campaigns."],
  ["campaigns", "get", "GET", "/v2/campaign/{campaign_id}", ["campaign_id"], [], [], [], "Get one campaign."],
  ["campaigns", "create", "POST", "/v2/campaign", [], [], ["type", "name", "subject", "from", "list_ids"], [...campaignFields], "Create a campaign without content. type is regular. from is { name, email } (email must be an approved sender). list_ids is an array of list and/or segment ids. stats is { ga: true|false }."],
  ["campaigns", "update", "POST", "/v2/campaign/{campaign_id}", ["campaign_id"], [], [], ["name", "subject", "from", "list_ids", ...campaignFields], "Update a campaign; only the fields sent change."],
  ["campaigns", "delete", "DELETE", "/v2/campaign/{campaign_id}", ["campaign_id"], [], [], [], "Delete a campaign. Unsent campaigns are removed permanently; sent ones can be restored for 180 days."],
  ["campaigns", "history", "GET", "/v2/campaign/{campaign_id}/history", ["campaign_id"], ["event_date_from", "event_date_to", "limit", "cursor", "order_by", "order"], [], [], "Event history of a campaign (cursor-paged)."],
  ["campaigns", "get_content", "GET", "/v2/campaign/{campaign_id}/content", ["campaign_id"], [], [], [], "Get campaign content. Only works for imported campaigns, not drag-and-drop ones."],
  ["campaigns", "set_content", "POST", "/v2/campaign/{campaign_id}/content", ["campaign_id"], [], [], ["html", "import_url", "inline_css"], "Set campaign content from html or import_url (html wins when both are sent). inline_css is true or false."],
  ["campaigns", "send", "POST", "/v2/campaign/{campaign_id}/action/send", ["campaign_id"], [], [], [], "Send the campaign now to its lists."],
  ["campaigns", "schedule", "POST", "/v2/campaign/{campaign_id}/action/schedule", ["campaign_id"], [], ["delivery_requested"], [], "Schedule delivery. delivery_requested is a date time (YYYY-MM-DD HH:MM:SS in the account timezone, or ISO with offset)."],
  ["campaigns", "test_mail", "POST", "/v2/campaign/{campaign_id}/action/testmail", ["campaign_id"], [], ["email"], [], "Send a test mail of an unsent campaign that has content."],

  ["reports", "list", "GET", "/v2/report", [], [], [], [], "Results (sent, opened, clicked, bounced, unsubscribed) of all campaigns."],
  ["reports", "get", "GET", "/v2/report/{campaign_id}", ["campaign_id"], [], [], [], "Results of one campaign."],
];
