export type Operation = {
  group: string;
  name: string;
  method: "GET" | "POST" | "PUT" | "DELETE";
  /** Path under https://api.crawlbase.com. Management paths carry the token as {token}; {crawler} and {rid} come from params. */
  path: string;
  /** Which token the call sends. `crawl` lets the caller pick the JavaScript token with params.token_type. */
  auth: "query" | "path" | "crawl";
  kind: "query" | "mutation";
  description: string;
  /** Names of required params. */
  required?: string[];
};

// Crawlbase Crawling API, Cloud Storage, Account and Enterprise Crawler management APIs
// (https://crawlbase.com/docs/). Legacy Scraper/Leads/Screenshots APIs and the Smart AI Proxy are omitted.
export const operations: Operation[] = [
  { group: "crawl", name: "fetch", method: "GET", path: "/", auth: "crawl", kind: "query", required: ["url"],
    description: "Fetch a web page through Crawlbase proxies. Params: url (required, unencoded), token_type ('normal' default or 'javascript' for the JS token), format (html|json|md), md_readability, country, device (desktop|tablet|mobile), user_agent, request_headers ('name:value|name:value'), cookies, cookies_session, javascript, page_wait (ms), ajax_wait, css_click_selector, scroll, scroll_interval, screenshot, scraper, autoparse, get_headers, get_cookies, custom_success_codes, store (save to Cloud Storage, returns rid), async, callback. Returns the Crawlbase status headers (cb_status, original_status, url, rid, screenshot_url, storage_url) and the body. Billed per successful request. With store=true it also writes the page to Cloud Storage." },
  { group: "crawl", name: "post", method: "POST", path: "/", auth: "crawl", kind: "mutation", required: ["url"],
    description: "Send a POST request to a target URL through Crawlbase (normal token only). Params: url (required), body (string payload, form-encoded by default), post_content_type (also sent as the Content-Type request header), plus the options of crawl.fetch." },
  { group: "crawl", name: "put", method: "PUT", path: "/", auth: "crawl", kind: "mutation", required: ["url"],
    description: "Send a PUT request with a raw payload to a target URL through Crawlbase (normal token only). Params: url (required), body (raw payload), plus the options of crawl.fetch." },
  { group: "crawl", name: "pushToCrawler", method: "GET", path: "/", auth: "crawl", kind: "mutation", required: ["url", "crawler"],
    description: "Push a URL onto a named Enterprise Crawler queue. Params: url, crawler (queue name), callback_headers, queue_timeout (minutes), format, plus crawl options. Sets callback=true. Returns { rid }." },
  { group: "storage", name: "get", method: "GET", path: "/storage", auth: "query", kind: "query",
    description: "Retrieve a stored page. Params: rid or url (one required), format (html|json). Free." },
  { group: "storage", name: "bulkGet", method: "POST", path: "/storage/bulk", auth: "query", kind: "mutation", required: ["rids"],
    description: "Retrieve up to 100 stored pages. Params: rids (string array), auto_delete (boolean; when true the stored pages are permanently DELETED once returned, so this tool can delete data and requires approval). Bodies come back as base64 gzip." },
  { group: "storage", name: "listRids", method: "GET", path: "/storage/rids", auth: "query", kind: "query",
    description: "List stored request IDs. Params: limit (max 10000), scroll (true on first call), scroll_id (from previous response), scroll_order (asc|desc)." },
  { group: "storage", name: "totalCount", method: "GET", path: "/storage/total_count", auth: "query", kind: "query",
    description: "Total number of pages in Cloud Storage." },
  { group: "storage", name: "delete", method: "DELETE", path: "/storage", auth: "query", kind: "mutation", required: ["rid"],
    description: "Delete one stored page. Params: rid. Irreversible." },
  { group: "storage", name: "bulkDelete", method: "POST", path: "/storage/bulk_delete", auth: "query", kind: "mutation", required: ["rids"],
    description: "Delete many stored pages. Params: rids (string array). Irreversible." },
  { group: "account", name: "usage", method: "GET", path: "/account", auth: "query", kind: "query", required: ["product"],
    description: "Usage and billing for a product this month. Params: product (crawling-api|crawler|smartproxy|scraper-api|leads-api|screenshot-api), previous_month. Rate limited to one call per 5 minutes." },
  { group: "crawler", name: "create", method: "POST", path: "/crawler/{token}", auth: "path", kind: "mutation", required: ["name"],
    description: "Create an Enterprise Crawler queue. Params: name, callback_url (omit to deliver to Cloud Storage), plus optional settings such as max_concurrency." },
  { group: "crawler", name: "get", method: "GET", path: "/crawler/{token}/{crawler}", auth: "path", kind: "query", required: ["crawler"],
    description: "Details of an Enterprise Crawler. Params: crawler (name)." },
  { group: "crawler", name: "update", method: "PUT", path: "/crawler/{token}/{crawler}", auth: "path", kind: "mutation", required: ["crawler"],
    description: "Update an Enterprise Crawler. Params: crawler (name) plus the fields to change (e.g. callback_url, max_concurrency)." },
  { group: "crawler", name: "stats", method: "GET", path: "/crawler/{token}/stats", auth: "path", kind: "query",
    description: "Statistics for all crawlers. Params: history_from, history_to." },
  { group: "crawler", name: "findJob", method: "GET", path: "/crawler/{token}/{crawler}/find_by_rid/{rid}", auth: "path", kind: "query", required: ["crawler", "rid"],
    description: "Check whether a job is still queued. Params: crawler, rid. Returns QUEUED or NOT_QUEUED." },
  { group: "crawler", name: "pause", method: "POST", path: "/crawler/{token}/{crawler}/pause", auth: "path", kind: "mutation", required: ["crawler"],
    description: "Pause an Enterprise Crawler. Params: crawler." },
  { group: "crawler", name: "unpause", method: "POST", path: "/crawler/{token}/{crawler}/unpause", auth: "path", kind: "mutation", required: ["crawler"],
    description: "Resume a paused Enterprise Crawler. Params: crawler." },
  { group: "crawler", name: "purge", method: "POST", path: "/crawler/{token}/{crawler}/purge", auth: "path", kind: "mutation", required: ["crawler"],
    description: "Remove every queued URL from a crawler. Params: crawler. Irreversible." },
  { group: "crawler", name: "deleteJob", method: "POST", path: "/crawler/{token}/{crawler}/delete_job", auth: "path", kind: "mutation", required: ["crawler", "rid"],
    description: "Delete one queued job. Params: crawler, rid (sent in the query string)." },
  { group: "crawler", name: "delete", method: "POST", path: "/crawler/{token}/{crawler}/delete", auth: "path", kind: "mutation", required: ["crawler"],
    description: "Delete an Enterprise Crawler. Params: crawler. Irreversible." },
];
