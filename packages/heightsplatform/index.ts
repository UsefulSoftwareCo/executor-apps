import {
  accountRouter,
  boolean,
  decodeJson,
  defineApp,
  defineProvider,
  header,
  json,
  mutation,
  number,
  object,
  plain,
  query,
  router,
  secrets,
  string,
  t,
  withApprovals,
} from "apps";
import type { Schema } from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

// The schema builders have no pattern option, so the subdomain is validated here before it is placed in a host.
const baseUrl = (subdomain: string) => {
  if (!/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/i.test(subdomain)) {
    throw new Error("Heights Platform subdomain may only contain letters, digits and hyphens.");
  }
  return `https://${subdomain.toLowerCase()}.heightsplatform.com/api/v1`;
};

const heights = defineProvider({
  name: "Heights Platform",
  hosts: ["*.heightsplatform.com"],
  auth: {
    // An admin user's API key (Account Settings, Custom Code tab). The API accepts it as a Bearer token.
    apiKey: secrets({
      label: "Admin API key",
      fields: object({
        subdomain: plain(string({ minLength: 1 })),
        token: string({ minLength: 1 }),
      }),
      request: ({ token }) => header("authorization", t`Bearer ${token}`),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch(account.url(`${baseUrl(account.fields.subdomain)}/account`), {
      signal,
      headers: { ...account.headers(), Accept: "application/json" },
    });
    await decodeJson(response, object({ account: json() }));
    return { accountInfo: { externalId: account.fields.subdomain, displayName: account.fields.subdomain } };
  },
});

type Type = "string" | "number" | "boolean" | "json";
type Where = "path" | "query" | "body";
type Field = [name: string, type: Type, required: boolean, where: Where];

const q = (name: string, type: Type = "string", required = false): Field => [name, type, required, "query"];
const b = (name: string, type: Type = "string", required = false): Field => [name, type, required, "body"];
const page = [q("page", "number"), q("per_page", "number")];

// `json` rows take a `body` input sent as the JSON request body.
type Row = [
  resource: string,
  action: string,
  method: "GET" | "POST" | "PUT" | "PATCH",
  path: string,
  description: string,
  fields: Field[],
  jsonBody?: boolean,
  readOnly?: boolean,
];

const rows: Row[] = [
  // Account
  ["account", "get", "GET", "/account", "Account details, API capabilities and the supported webhook event names.", []],

  // Courses
  ["courses", "list", "GET", "/courses", "List published courses.", []],
  ["courses", "get", "GET", "/courses/{id}", "Detailed metadata for one course.", []],
  ["courses", "roles", "GET", "/courses/roles", "List the roles that can be granted to students.", []],
  ["courses", "completionPercentage", "POST", "/courses/{id}/completion-percentage", "Overall and course-specific completion for a student identified by email. Read-only.", [b("user_email", "string", true)], false, true],
  ["lessons", "list", "GET", "/courses/{course_id}/lessons", "The ordered course outline: modules with lesson summaries, then ungrouped lessons.", []],
  ["lessons", "create", "POST", "/courses/{course_id}/lessons", "Create a lesson. body needs title; optional content, module_id, is_published, lesson_type, points, sequence, learning_objective, video_embed, video_url, release_day, requires_unlock.", [], true],
  ["lessons", "update", "PATCH", "/lessons/{id}", "Update only the provided lesson fields (title, content, is_published, lesson_type, points, module_id, sequence, learning_objective, video_embed, video_url, release_day, requires_unlock). module_id null makes the lesson ungrouped.", [], true],

  // Bundles
  ["bundles", "list", "GET", "/bundles", "List bundles (offers).", []],
  ["bundles", "get", "GET", "/bundles/{id}", "Detailed metadata for one bundle.", []],

  // Digital products
  ["digitalProducts", "list", "GET", "/digital_products", "List digital products.", []],
  ["digitalProducts", "get", "GET", "/digital_products/{id}", "Metadata for one digital product.", []],

  // Unified products
  ["products", "search", "GET", "/products", "Search products. product_type is course, challenge, digital_product, bundle, offer or project; limit is 1 to 25 (default 10).", [q("query"), q("product_type"), q("limit", "number")]],
  ["products", "get", "GET", "/products/{product_type}/{id_or_slug}", "A product's identity fields and unified attributes object.", []],
  ["products", "update", "PATCH", "/products/{product_type}/{id_or_slug}", "Update a product with unified fields. body is { product: { title, is_published, price, hidden, ... } }; raw model fields return 422 invalid_fields.", [], true],

  // Community
  ["community", "searchChannels", "GET", "/community/channels", "Search readable channels. limit is 1 to 50 (default 25).", [q("query"), q("limit", "number")]],
  ["community", "getChannel", "GET", "/community/channels/{id_or_slug}", "A channel's details, derived privacy, topic count and up to 10 attached offers.", []],
  ["community", "createChannel", "POST", "/community/channels", "Create a channel. body is { channel: { name, description, group_id, locked } }.", [], true],
  ["community", "updateChannel", "PATCH", "/community/channels/{id_or_slug}", "Update a channel. body is { channel: { name, description, group_id, locked } }; privacy cannot be set.", [], true],
  ["community", "listGroups", "GET", "/community/groups", "Up to 100 channel groups ordered by position, with channel counts.", []],
  ["community", "listPosts", "GET", "/community/channels/{id_or_slug}/posts", "Posts in a channel, newest first. created_after and created_before are ISO-8601; per_page is 1 to 100 (default 25). Returns meta with total_pages.", [q("query"), q("topic_id", "number"), q("created_after"), q("created_before"), ...page]],

  // Orders
  ["orders", "list", "GET", "/orders", "List orders; status is pending, failed, paid, paypal_executed or all (default paid). Optional paging with page and per_page (max 100); created_after and created_before are ISO-8601.", [q("status"), q("user_email"), q("created_after"), q("created_before"), ...page]],
  ["orders", "get", "GET", "/orders/{id}", "One order by its public id (for example ORD_ABC123).", []],

  // Students
  ["students", "list", "GET", "/students", "List students, 50 per page; read meta.total_pages.", [q("page", "number")]],
  ["students", "get", "GET", "/students/details", "A student by email, with lesson views and completions, paid orders and enrolled courses.", [q("email", "string", true)]],
  ["students", "completions", "GET", "/students/completions", "Students whose total completion is 100 percent or more.", []],
  ["students", "answers", "GET", "/students/answers", "All assignment answers.", []],
  ["students", "projectPosts", "GET", "/students/project-posts", "All project posts.", []],

  // Student access management
  ["access", "enroll", "POST", "/student/enroll", "Create or update a student and optionally grant a course or bundle through a $0 paid order. name is required when creating.", [b("email", "string", true), b("name"), b("course_id", "number"), b("bundle_id", "number")]],
  ["access", "unenroll", "POST", "/student/unenroll", "Unenroll a student from paid membership (paying_student=false).", [b("email", "string", true), b("name", "string", true)]],
  ["access", "revokeCourse", "POST", "/student/revoke-course", "Remove a course from each of the student's orders.", [b("email", "string", true), b("name", "string", true), b("course_id", "number", true)]],
  ["access", "revokeBundle", "POST", "/student/revoke-bundle", "Remove bundle access, and the bundle's courses and digital products, from the student's orders.", [b("email", "string", true), b("bundle_id", "number", true)]],
  ["access", "grantRole", "POST", "/student/grant-role", "Grant a role to a student.", [b("email", "string", true), b("role_id", "number", true)]],
  ["access", "revokeRole", "POST", "/student/revoke-role", "Revoke a role from a student.", [b("email", "string", true), b("role_id", "number", true)]],
  ["access", "resetCourseProgress", "POST", "/student/reset-course-progress", "Reset a student's progress for one course.", [b("email", "string", true), b("course_id", "number", true)]],
  ["access", "resetBundleProgress", "POST", "/student/reset-bundle-progress", "Reset a student's progress for every course in a bundle.", [b("email", "string", true), b("bundle_id", "number", true)]],
];

type Account = {
  fields: { subdomain: string };
  headers(): Record<string, string>;
  url(input: string): string;
};

function fieldsOf(path: string, extra: Field[], jsonBody: boolean): Field[] {
  const pathFields: Field[] = [...path.matchAll(/\{(\w+)\}/g)].map((m) => [m[1]!, "string", true, "path"]);
  const body: Field[] = jsonBody ? [["body", "json", true, "body"]] : [];
  return [...pathFields, ...extra, ...body];
}

function schemaFor(fields: Field[]) {
  const shape: Record<string, Schema<unknown, boolean>> = {};
  for (const [name, type, required] of fields) {
    const base: Schema<unknown, boolean> =
      type === "number" ? number() : type === "boolean" ? boolean() : type === "json" ? json() : string();
    shape[name] = required ? base : base.optional();
  }
  return object(shape);
}

// The schema builders carry no per-field descriptions, so parameter docs go in the tool description.
function describe(description: string, fields: Field[]): string {
  if (fields.length === 0) return description;
  const params = fields.map(([name, type, required]) => `- ${name} (${type}${required ? ", required" : ""})`);
  return `${description}\n\nParameters:\n${params.join("\n")}`;
}

function build(account: Account, fetcher: typeof fetch, signal: AbortSignal | undefined) {
  const call = async (method: string, path: string, fields: Field[], jsonBody: boolean, input: Record<string, unknown>) => {
    let target = path;
    const params = new URLSearchParams();
    const body: Record<string, unknown> = {};
    for (const [name, , , where] of fields) {
      const value = input[name];
      if (name === "body" && jsonBody) continue;
      if (value === undefined || value === null) continue;
      if (where === "path") target = target.replace(`{${name}}`, encodeURIComponent(String(value)));
      else if (where === "body") body[name] = value;
      else params.set(name, String(value));
    }
    const payload = jsonBody ? input.body : Object.keys(body).length > 0 ? body : undefined;
    const url = `${baseUrl(account.fields.subdomain)}${target}${params.size > 0 ? `?${params.toString()}` : ""}`;
    const response = await fetcher(account.url(url), {
      method,
      signal,
      headers: {
        ...account.headers(),
        Accept: "application/json",
        ...(payload !== undefined ? { "content-type": "application/json" } : {}),
      },
      body: payload !== undefined ? JSON.stringify(payload) : undefined,
    });
    const text = await response.text();
    if (!response.ok) throw new Error(`Heights Platform answered ${response.status}: ${text.slice(0, 1000)}`);
    return text === "" ? { ok: true } : (JSON.parse(text) as unknown);
  };

  const groups = new Map<string, Record<string, unknown>>();
  for (const [resource, action, method, path, description, extra, jsonBody = false, readOnly = false] of rows) {
    const fields = fieldsOf(path, extra, jsonBody);
    const options = { description: describe(description, fields), input: schemaFor(fields) };
    const handler = async (_ctx: unknown, input: Record<string, unknown>) => call(method, path, fields, jsonBody, input);
    const tool = method === "GET" || readOnly ? query(options, handler as never) : mutation(options, handler as never);
    const group = groups.get(resource) ?? {};
    group[action] = tool;
    groups.set(resource, group);
  }
  return router(Object.fromEntries([...groups].map(([name, tools]) => [name, router(tools as never)])) as never);
}

export default defineApp(
  { user: { accounts: { heightsplatform: heights.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.heightsplatform ?? [],
        (account) =>
          withApprovals(build(account as unknown as Account, fetch, signal), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Heights Platform",
        description:
          "Heights Platform course and community business: courses, lessons, bundles, digital products, community, orders, students and student access.",
        instructions:
          "Requests are rate limited to 60 per minute (300 on Academy plans). Students are 50 per page; orders page only when page is given. Tools that take body send it as the JSON request body exactly as documented.",
        icons,
      },
    ),
  }),
);
