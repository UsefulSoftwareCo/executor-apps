// Hand-written from Stannp's API reference (https://www.stannp.com/us/direct-mail-api/guide).
// Stannp publishes no OpenAPI document. Param types: s string, n number, b boolean, j JSON
// (an object or array, form-encoded as key[sub]=value / key[]=value).
export type ParamType = "s" | "n" | "b" | "j";
export interface Param {
  readonly name: string;
  readonly type: ParamType;
  readonly required?: boolean;
}
export interface Operation {
  readonly group: string;
  readonly name: string;
  readonly method: "GET" | "POST";
  readonly path: string;
  /** Read-only tools skip the approval prompt even when they POST. */
  readonly readOnly?: boolean;
  readonly description: string;
  readonly params: readonly Param[];
}

const s = (name: string, required = false): Param => ({ name, type: "s", required });
const n = (name: string, required = false): Param => ({ name, type: "n", required });
const b = (name: string): Param => ({ name, type: "b" });
const j = (name: string, required = false): Param => ({ name, type: "j", required });

const recipient =
  "recipient is either an existing recipient ID or an object with title, company, firstname, lastname, address1, address2, city, postcode, country and any custom merge fields.";
const mailpiece = "Set test to true for a sample PDF that is neither dispatched nor charged.";

export const operations: readonly Operation[] = [
  { group: "postcards", name: "create", method: "POST", path: "/postcards/create", description: `Create and send a single postcard. ${recipient} Provide template, or front (and optionally back) as a URL or base64 JPG/PNG/PDF. size is A6, A5, A5-ENV or A5-PORT (EU/UK) or 4x6, 6x9 or 6x11 (US). addons is comma-separated (FIRST_CLASS, STOCK_350_SILK, STOCK_350_UNCOATED). ${mailpiece}`, params: [j("recipient", true), s("size"), b("test"), n("template"), s("message"), s("signature"), s("front"), s("back"), n("padding"), b("post_unverified"), b("clearzone"), s("return_address"), s("tags"), s("addons"), s("idempotency_key")] },
  { group: "postcards", name: "get", method: "GET", path: "/postcards/get/{id}", description: "Get a postcard mailpiece with its status and tracking events.", params: [n("id", true)] },
  { group: "postcards", name: "cancel", method: "POST", path: "/postcards/cancel", description: "Cancel a postcard whose processing has not started.", params: [n("id", true)] },
  { group: "letters", name: "create", method: "POST", path: "/letters/create", description: `Create and send a single mail-merged letter. ${recipient} Provide template, or file as a URL or base64 PDF/DOC (max 10 pages). size is A4 or US-LETTER. addons is comma-separated (FIRST_CLASS, C4_ENVELOPE, CONFIDENTIAL, STOCK_120). ${mailpiece}`, params: [j("recipient", true), b("test"), n("template"), s("file"), s("size"), b("duplex"), b("clearzone"), b("post_unverified"), s("tags"), s("addons"), s("idempotency_key")] },
  { group: "letters", name: "post", method: "POST", path: "/letters/post", description: `Post a letter whose PDF already carries the address; the address is read by OCR. country is an ISO alpha-2 code. pdf is a URL or base64 PDF. ${mailpiece}`, params: [s("country", true), s("pdf"), b("test"), s("size"), b("duplex"), b("transactional"), s("tags"), s("addons"), s("idempotency_key")] },
  { group: "letters", name: "get", method: "GET", path: "/letters/get/{id}", description: "Get a letter mailpiece with its status and tracking events.", params: [n("id", true)] },
  { group: "letters", name: "cancel", method: "POST", path: "/letters/cancel", description: "Cancel a letter whose processing has not started.", params: [n("id", true)] },
  { group: "sms", name: "create", method: "POST", path: "/sms/create", description: `Send an SMS. Provide phone_number or recipient_id. message supports tags such as {firstname} with recipient_id. country defaults to the account region. test true sends nothing and charges nothing.`, params: [s("message", true), s("phone_number"), n("recipient_id"), s("country"), b("test"), s("idempotency_key")] },
  { group: "recipients", name: "list", method: "GET", path: "/recipients/list", description: "List recipients, optionally of one group, with offset and limit paging.", params: [n("group_id"), n("offset"), n("limit")] },
  { group: "recipients", name: "get", method: "GET", path: "/recipients/get/{id}", description: "Get one recipient by ID.", params: [n("id", true)] },
  { group: "recipients", name: "new", method: "POST", path: "/recipients/new", description: "Create a recipient. on_duplicate is update, ignore or duplicate; test_level (email, fullname, initial, ref_id) chooses how duplicates are matched. Custom merge fields may be passed as extra keys in custom.", params: [n("group_id"), s("title"), s("firstname"), s("lastname"), s("company"), s("job_title"), s("address1"), s("address2"), s("address3"), s("city"), s("county"), s("postcode"), s("country"), s("email"), s("phone_number"), s("ref_id"), s("on_duplicate"), s("test_level"), j("custom")] },
  { group: "recipients", name: "delete", method: "POST", path: "/recipients/delete", description: "Permanently delete a recipient.", params: [n("id", true)] },
  { group: "recipients", name: "import", method: "POST", path: "/recipients/import", description: "Import a CSV or XLS file into a group. file is a URL or base64 CSV. duplicates is update, ignore or duplicate. mappings is a comma-separated heading map (use custom or skip), required with no_headings.", params: [s("file", true), n("group_id", true), s("duplicates"), b("no_headings"), s("mappings")] },
  { group: "groups", name: "list", method: "GET", path: "/groups/list", description: "List mailing groups with offset and limit paging.", params: [n("offset"), n("limit")] },
  { group: "groups", name: "new", method: "POST", path: "/groups/new", description: "Create an empty mailing group.", params: [s("name", true)] },
  { group: "groups", name: "add", method: "POST", path: "/groups/add/{group_id}", description: "Add recipients to a group. recipients is a comma-separated list of recipient IDs.", params: [n("group_id", true), s("recipients", true)] },
  { group: "groups", name: "remove", method: "POST", path: "/groups/remove/{group_id}", description: "Remove recipients from a group without deleting them. recipients is a comma-separated list of recipient IDs.", params: [n("group_id", true), s("recipients", true)] },
  { group: "groups", name: "purge", method: "POST", path: "/groups/purge", description: "Remove every recipient from a group; delete_recipients also deletes them from the account.", params: [n("id", true), b("delete_recipients")] },
  { group: "groups", name: "calculate", method: "POST", path: "/groups/calculate/{group_id}", description: "Recalculate a group's statistics.", params: [n("group_id", true)] },
  { group: "groups", name: "delete", method: "POST", path: "/groups/delete", description: "Delete a group; delete_recipients also deletes its recipients from the account.", params: [n("id", true), b("delete_recipients")] },
  { group: "selections", name: "new", method: "POST", path: "/selections/new", description: "Create an auto-filter selection for a group. filters is column:::operator:::value, chained with :::AND::: (operators: matches, contains, begins, ends, before, after, less_than, more_than, is_not).", params: [n("group_id", true), s("name"), s("filters")] },
  { group: "campaigns", name: "list", method: "GET", path: "/campaigns/list", description: "List campaigns.", params: [] },
  { group: "campaigns", name: "get", method: "GET", path: "/campaigns/get/{id}", description: "Get one campaign.", params: [n("id", true)] },
  { group: "campaigns", name: "create", method: "POST", path: "/campaigns/create", description: "Create a campaign. type is a6-postcard, a5-postcard or letter. Use template_id, file, or front and back (with size). what_recipients is all, valid, not_valid or int.", params: [s("name", true), s("type", true), n("group_id", true), n("template_id"), s("file"), s("front"), s("back"), s("size"), b("save"), s("what_recipients"), s("addons")] },
  { group: "campaigns", name: "sample", method: "POST", path: "/campaigns/sample", readOnly: true, description: "Produce a PDF sample of a campaign; the link is valid for 30 minutes.", params: [n("id", true)] },
  { group: "campaigns", name: "cost", method: "POST", path: "/campaigns/cost", readOnly: true, description: "Get the cost breakdown for a campaign.", params: [n("id", true)] },
  { group: "campaigns", name: "availableDates", method: "POST", path: "/campaigns/availableDates", readOnly: true, description: "List dates a campaign can be booked for. start and end are YYYY-MM-DD.", params: [s("start"), s("end")] },
  { group: "campaigns", name: "approve", method: "POST", path: "/campaigns/approve", description: "Approve a campaign, locking its design and recipients.", params: [n("id", true)] },
  { group: "campaigns", name: "book", method: "POST", path: "/campaigns/book", description: "Book an approved campaign for dispatch on send_date (YYYY-MM-DD); payment is taken from the balance unless use_balance is false.", params: [n("id", true), s("send_date", true), b("next_available_date"), b("use_balance")] },
  { group: "campaigns", name: "delete", method: "POST", path: "/campaigns/delete", description: "Delete a campaign that has not been booked.", params: [n("id", true)] },
  { group: "events", name: "create", method: "POST", path: "/recipientEvents/create", description: "Record a recipient event such as PURCHASE or SIGNUP. recipient_id may be a Stannp ID or a ref_id. conversion marks conversions.", params: [s("recipient_id", true), s("name", true), s("value"), b("conversion"), s("data"), s("ref")] },
  { group: "account", name: "balance", method: "GET", path: "/accounts/balance", description: "Get the account balance.", params: [] },
  { group: "account", name: "topup", method: "POST", path: "/accounts/topup", description: "Top up the balance from the saved default card. net is the amount, such as 10.00.", params: [s("net", true)] },
  { group: "addresses", name: "validate", method: "POST", path: "/addresses/validate", readOnly: true, description: "Validate a UK, US or CA postal address. Use state and zipcode for US, province and zipcode for CA.", params: [s("address1", true), s("address2"), s("address3"), s("company"), s("city"), s("postcode"), s("country"), s("state"), s("province"), s("zipcode")] },
  { group: "reporting", name: "summary", method: "GET", path: "/reporting/summary/{startdate}/{enddate}", description: "Count mailpieces by status between two dates (YYYY-MM-DD).", params: [s("startdate", true), s("enddate", true)] },
  { group: "reporting", name: "list", method: "GET", path: "/reporting/list/{startdate}/{enddate}/{status}/{tag}", description: "List mailpieces sent between two dates (YYYY-MM-DD), optionally filtered by status and tag.", params: [s("startdate", true), s("enddate", true), s("status"), s("tag")] },
  { group: "files", name: "upload", method: "POST", path: "/files/upload", description: "Upload a file (URL or base64) to the secure file transfer area, optionally into a folder ID.", params: [s("file", true), n("folder")] },
  { group: "files", name: "createFolder", method: "POST", path: "/files/createFolder", description: "Create a folder in the secure file transfer area.", params: [s("name", true)] },
  { group: "files", name: "folders", method: "GET", path: "/files/folders", description: "List folders in the secure file transfer area.", params: [] },
  { group: "templates", name: "list", method: "GET", path: "/templates/list", description: "List the templates on the account.", params: [] },
  { group: "tools", name: "mergePdf", method: "POST", path: "/pdf/merge", description: "Merge PDFs into one file. files is an array of PDF URLs.", params: [j("files", true)] },
];
