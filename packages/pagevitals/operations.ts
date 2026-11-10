export type Operation = {
  group: string;
  name: string;
  method: "GET" | "POST" | "PUT" | "DELETE";
  path: string;
  description: string;
  body?: string;
};

const device = " Pass query.device as desktop or mobile (required).";
const range = " query.date narrows the range as yyyyMMdd-yyyyMMdd (default last 90 days).";
const filters = " Accepts field-testing filters in query (date, region, device (desktop, mobile, tablet), browser, os, page, tags, referrer_type, navigation_type, cache, memory, network_type, p, interval); join values with + and prefix with ~ to negate.";

export const operations: Operation[] = [
  { group: "websites", name: "list", method: "GET", path: "/websites", description: "List the websites in the account (id, displayName, domain)." },
  { group: "websites", name: "add", method: "POST", path: "/account/websites", description: "Add a website. Needs an admin key.", body: "{ domain: string (no scheme or path; include www if used), displayName?: string }" },
  { group: "websites", name: "remove", method: "DELETE", path: "/{websiteId}", description: "Delete a website with all its test data, irreversibly and without confirmation. Needs an admin key." },

  { group: "pages", name: "list", method: "GET", path: "/{websiteId}/pages", description: "List page-device combinations with a daily metrics timeline and the latest 3-day averages." },
  { group: "pages", name: "get", method: "GET", path: "/{websiteId}/pages/{pageId}", description: `Latest Lighthouse and CrUX metrics for one page and device.${device}` },
  { group: "pages", name: "timeline", method: "GET", path: "/{websiteId}/pages/{pageId}/timeline", description: `Daily loading-metric timeline for a page.${device}${range}` },
  { group: "pages", name: "crux", method: "GET", path: "/{websiteId}/pages/{pageId}/crux", description: `CrUX timeline for a page.${device}${range}` },
  { group: "pages", name: "network", method: "GET", path: "/{websiteId}/pages/{pageId}/network", description: `Network chart data for a page.${device}${range}` },
  { group: "pages", name: "cpu", method: "GET", path: "/{websiteId}/pages/{pageId}/cpu", description: `Daily CPU time timeline for a page.${device}${range}` },
  { group: "pages", name: "googleSearch", method: "GET", path: "/{websiteId}/pages/{pageId}/google_search", description: `Google Search Console timeline for a page (needs that integration enabled).${device}${range}` },
  { group: "pages", name: "opportunities", method: "GET", path: "/{websiteId}/pages/{pageId}/opportunities", description: `List the Lighthouse opportunities for a page.${device}` },
  { group: "pages", name: "opportunity", method: "GET", path: "/{websiteId}/pages/{pageId}/opportunities/{opportunityId}", description: `Full Lighthouse audit detail for one opportunity (Lighthouse audit id such as errors-in-console).${device}` },

  { group: "settings", name: "listPages", method: "GET", path: "/{websiteId}/settings/pages", description: "List the pages configured for testing on a website." },
  { group: "settings", name: "addPages", method: "POST", path: "/{websiteId}/settings/pages", description: "Add pages to test. Needs an admin key.", body: "[{ url: string (relative, e.g. /pricing), alias: string }] (bare JSON array, no wrapper object)" },
  { group: "settings", name: "updatePage", method: "PUT", path: "/{websiteId}/settings/{pageId}", description: "Update a page's url and/or alias. Needs an admin key.", body: "{ url?: string, alias?: string }" },
  { group: "settings", name: "deletePage", method: "DELETE", path: "/{websiteId}/settings/{pageId}", description: "Delete a page and all its test results. Needs an admin key." },

  { group: "tests", name: "listSeries", method: "GET", path: "/{websiteId}/testseries", description: "List the latest test series run on a website." },
  { group: "tests", name: "getSeries", method: "GET", path: "/{websiteId}/testseries/{seriesId}", description: "List the tests within one test series." },
  { group: "tests", name: "run", method: "POST", path: "/{websiteId}/testseries", description: "Trigger a synthetic test run for every configured page, or only the given page/device combinations. Returns the new seriesId.", body: "{ pages?: [{ page_id: string, device: \"desktop\" | \"mobile\" }] } (omit body to test everything)" },
  { group: "tests", name: "get", method: "GET", path: "/{websiteId}/tests/{testId}", description: "Detailed results of a single test." },
  { group: "tests", name: "opportunities", method: "GET", path: "/{websiteId}/tests/{testId}/opportunities", description: "Lighthouse opportunities identified in a single test." },
  { group: "tests", name: "waterfall", method: "GET", path: "/{websiteId}/tests/{testId}/waterfall", description: "Network waterfall of a single test." },
  { group: "tests", name: "validation", method: "GET", path: "/{websiteId}/tests/{testId}/validation", description: "HTML validation results of a single test." },

  { group: "multistep", name: "list", method: "GET", path: "/{websiteId}/multistep", description: "List multistep tests with their steps and latest success rates." },
  { group: "multistep", name: "get", method: "GET", path: "/{websiteId}/multistep/{testId}", description: "Details of one multistep test." },
  { group: "multistep", name: "create", method: "POST", path: "/{websiteId}/multistep", description: "Create a multistep test. Needs an admin key.", body: "{ alias: string, device: \"desktop\" | \"mobile\" }" },
  { group: "multistep", name: "update", method: "PUT", path: "/{websiteId}/multistep/{testId}", description: "Edit a multistep test. Needs an admin key.", body: "{ alias?: string, device?: \"desktop\" | \"mobile\" }" },
  { group: "multistep", name: "delete", method: "DELETE", path: "/{websiteId}/multistep/{testId}", description: "Delete a multistep test without confirmation. Needs an admin key." },
  { group: "multistep", name: "runs", method: "GET", path: "/{websiteId}/multistep/{testId}/runs", description: "List the runs of one multistep test." },
  { group: "multistep", name: "run", method: "POST", path: "/{websiteId}/multistep/{testId}/runs", description: "Trigger a run of one multistep test. Returns the runId." },
  { group: "multistep", name: "runAll", method: "POST", path: "/{websiteId}/multistep/run-all", description: "Trigger a run of every multistep test on the website." },

  { group: "budgets", name: "list", method: "GET", path: "/{websiteId}/budgets", description: "List performance budgets with their status (ok, at-risk, exceeded) and affected pages." },
  { group: "budgets", name: "create", method: "POST", path: "/{websiteId}/budgets", description: "Create a performance budget. Needs an admin key.", body: "{ metric: string (e.g. lcp), operator: \"lt\" | \"gt\", value: number, device: \"desktop\" | \"mobile\" | \"all\" }" },
  { group: "budgets", name: "update", method: "PUT", path: "/{websiteId}/budgets/{budgetId}", description: "Edit a performance budget. Needs an admin key.", body: "{ metric, operator, value, device } as in create" },
  { group: "budgets", name: "delete", method: "DELETE", path: "/{websiteId}/budgets/{budgetId}", description: "Delete a performance budget. Needs an admin key." },

  { group: "opportunities", name: "list", method: "GET", path: "/{websiteId}/opportunities", description: "Overall Lighthouse opportunities across the whole website, with affected pages." },

  { group: "field", name: "pages", method: "GET", path: "/{websiteId}/field-testing/pages", description: `Pages that received field (RUM) traffic. query.timing adds metrics joined by + (lcp, fcp, fp, fid, inp, cls, ttfb, dns_time, connect_time, server_time, transfer_time, dom_time, fully_loaded_time, transfer_size, dom_size, dom_elements, plus custom numeric variables).${filters}` },
  { group: "field", name: "countries", method: "GET", path: "/{websiteId}/field-testing/countries", description: `Field traffic by country. query.timing adds metrics joined by + (lcp, fcp, fp, fid, inp, cls, ttfb, dns_time, connect_time, server_time, transfer_time, dom_time, fully_loaded_time, transfer_size, dom_size, dom_elements, plus custom numeric variables).${filters}` },
  { group: "field", name: "resources", method: "GET", path: "/{websiteId}/field-testing/resources", description: `Resource domains seen on pages that received field traffic. query.type limits resource types (doc, css, js, img, font, xhr, other; combine with +). query.timing is not supported here.${filters}` },
];
