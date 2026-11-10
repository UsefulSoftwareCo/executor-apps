export type Operation = {
  group: string;
  name: string;
  method: "GET" | "POST";
  path: string;
  description: string;
  /** Names of required query parameters (GET) or body fields (POST). */
  required?: string[];
};

// Clearout REST API v2 (https://docs.clearout.io/developers/api/overview), taken from the
// OpenAPI fragments embedded in the vendor's docs. Bulk file-upload endpoints (multipart) are omitted.
export const operations: Operation[] = [
  { group: "emailVerify", name: "instant", method: "POST", path: "/email_verify/instant", required: ["email"], description: "Verify one email address in real time. Body: email, optional timeout (ms, 1000-180000). Consumes credits." },
  { group: "emailVerify", name: "bulkProgress", method: "GET", path: "/email_verify/bulk/progress_status", required: ["list_id"], description: "Progress of a bulk verify list. Query: list_id." },
  { group: "emailVerify", name: "downloadResult", method: "POST", path: "/download/result", required: ["list_id"], description: "Request a download URL for a bulk verify result. Body: list_id." },
  { group: "emailVerify", name: "listLists", method: "POST", path: "/email_verify/list", description: "List bulk verify lists. Body: limit (max 100), start_after cursor (null first), filter {date_range, verified, ...}." },
  { group: "emailVerify", name: "cancelList", method: "POST", path: "/email_verify/list/cancel", required: ["list_id"], description: "Cancel a running bulk verify list. Body: list_id." },
  { group: "emailVerify", name: "removeList", method: "POST", path: "/email_verify/list/remove", required: ["list_id"], description: "Delete a bulk verify list and its result. Body: list_id, optional ignore_result." },
  { group: "emailVerify", name: "catchAll", method: "POST", path: "/email/verify/catchall", required: ["email"], description: "Check whether the email's domain is catch-all. Body: email, optional timeout." },
  { group: "emailVerify", name: "disposable", method: "POST", path: "/email/verify/disposable", required: ["email"], description: "Check whether the email is a disposable address. Body: email, optional timeout." },
  { group: "emailVerify", name: "business", method: "POST", path: "/email/verify/business", required: ["email"], description: "Check whether the email is a business address. Body: email, optional timeout." },
  { group: "emailVerify", name: "free", method: "POST", path: "/email/verify/free", required: ["email"], description: "Check whether the email is a free-provider address. Body: email, optional timeout." },
  { group: "emailVerify", name: "role", method: "POST", path: "/email/verify/role", required: ["email"], description: "Check whether the email is a role account (info@, sales@). Body: email, optional timeout." },
  { group: "emailVerify", name: "gibberish", method: "POST", path: "/email/verify/gibberish", required: ["email"], description: "Check whether the email looks like gibberish. Body: email, optional timeout." },
  { group: "emailFinder", name: "instant", method: "POST", path: "/email_finder/instant", required: ["name", "domain"], description: "Find a person's email from name and domain or company. Body: name, domain, optional timeout (ms) and queue. Consumes credits." },
  { group: "emailFinder", name: "instantStatus", method: "GET", path: "/email_finder/instant/queue_status", required: ["qid"], description: "Status of a queued instant email finder request. Query: qid." },
  { group: "emailFinder", name: "bulkProgress", method: "GET", path: "/email_finder/bulk/progress_status", required: ["list_id"], description: "Progress of a bulk email finder list. Query: list_id." },
  { group: "emailFinder", name: "downloadResult", method: "POST", path: "/email_finder/download/result", required: ["list_id"], description: "Request a download URL for a bulk finder result. Body: list_id." },
  { group: "emailFinder", name: "listLists", method: "POST", path: "/email_finder/list", description: "List bulk email finder lists. Body: limit (max 100), start_after cursor (null first), filter." },
  { group: "emailFinder", name: "cancelList", method: "POST", path: "/email_finder/list/cancel", required: ["list_id"], description: "Cancel a running bulk finder list. Body: list_id." },
  { group: "emailFinder", name: "removeList", method: "POST", path: "/email_finder/list/remove", required: ["list_id"], description: "Delete a bulk finder list and its result. Body: list_id, optional ignore_result." },
  { group: "reverseLookup", name: "linkedin", method: "GET", path: "/reverse_lookup/linkedin", required: ["url"], description: "Lead information from a LinkedIn profile URL. Query: url." },
  { group: "reverseLookup", name: "email", method: "GET", path: "/reverse_lookup/email", required: ["email_address"], description: "Lead information from an email address. Query: email_address." },
  { group: "reverseLookup", name: "domain", method: "GET", path: "/reverse_lookup/domain", required: ["name"], description: "Company lead information from a domain name. Query: name." },
  { group: "nameValidation", name: "validate", method: "POST", path: "/name/validate", required: ["name"], description: "Validate that a string is a plausible person name. Body: name, optional settings {gibberish_threshold: off|medium|high}, timeout (ms, 1000-10000)." },
  { group: "autocomplete", name: "companyDomains", method: "GET", path: "/public/companies/autocomplete", required: ["query"], description: "Find website domains, logos and confidence for a company name. Query: query. Free." },
  { group: "domain", name: "mx", method: "POST", path: "/domain/resolve/mx", required: ["domain"], description: "MX records for a domain in priority order. Body: domain, optional timeout (ms)." },
  { group: "domain", name: "whois", method: "POST", path: "/domain/resolve/whois", required: ["domain"], description: "Whois record for a domain as JSON. Body: domain, optional timeout (ms)." },
  { group: "account", name: "credits", method: "GET", path: "/account/credits", description: "Remaining credit balance with subscription, pay-as-you-go and bonus breakdown." },
  { group: "account", name: "plans", method: "GET", path: "/account/myplans", description: "Active subscription plan and add-ons." },
  { group: "account", name: "limits", method: "GET", path: "/account/limits", description: "Rate limits (requests per minute) and parallel processing limits." },
];
