import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  json,
  mutation,
  number,
  object,
  plain,
  query,
  record,
  router,
  secrets,
  string,
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

// Oracle Fusion Cloud is hosted per customer pod (for example acme.fa.us2.oraclecloud.com), so the
// host is part of the account. Credentials only go to Oracle cloud hosts; every request is built
// from the validated host below, never from a free-form URL.
function podOrigin(raw: string): string {
  const text = raw.trim();
  let url: URL;
  try {
    url = new URL(/^https?:\/\//i.test(text) ? text : `https://${text}`);
  } catch {
    throw new Error("Enter your Oracle Fusion host, for example acme.fa.us2.oraclecloud.com.");
  }
  if (url.protocol !== "https:") throw new Error("The Oracle Fusion host must use https.");
  if (!/^[a-z0-9-]+(\.[a-z0-9-]+)*\.oraclecloud\.com$/i.test(url.hostname) || url.port !== "") {
    throw new Error("The Oracle Fusion host must be an oraclecloud.com address such as acme.fa.us2.oraclecloud.com.");
  }
  return url.origin;
}

type Fields = { host: string; username: string; password: string };
type Fetch = typeof fetch;
type Params = Record<string, unknown>;

const defaultVersion = "11.13.18.05";

const oracleHcm = defineProvider({
  name: "Oracle HCM",
  hosts: ["*.oraclecloud.com"],
  auth: {
    password: secrets({
      label: "Username and password",
      fields: object({
        host: plain(string({ minLength: 1 })),
        username: plain(string({ minLength: 1 })),
        password: string({ minLength: 1 }),
      }),
    }),
  },
  async health({ account, fetch, signal }) {
    const { host, username, password } = account.fields;
    const origin = podOrigin(host);
    const response = await fetch(`${origin}/hcmRestApi/resources/${defaultVersion}/emps?limit=1&onlyData=true`, {
      signal,
      headers: { Accept: "application/json", Authorization: `Basic ${btoa(`${username}:${password}`)}` },
    });
    await decodeJson(response, object({}));
    return { accountInfo: { externalId: `${origin}:${username}`, displayName: `${username} @ ${new URL(origin).hostname}` } };
  },
});

const segment = /^[A-Za-z0-9_.\-]+$/;

function resourcePath(input: Params, resource: string): string {
  const version = String(input.version ?? defaultVersion);
  if (version !== "latest" && !/^[0-9.]+$/.test(version)) throw new Error("version must look like 11.13.18.05 or latest.");
  const name = String(input.resource ?? resource);
  const parts = name.split("/").filter((part) => part !== "");
  if (parts.length === 0 || !parts.every((part) => segment.test(part))) {
    throw new Error("resource must be a resource path such as workers, or workers/<id>/child/assignments.");
  }
  return `/hcmRestApi/resources/${version}/${parts.join("/")}`;
}

function recordId(id: unknown): string {
  const text = String(id);
  if (text === "") throw new Error("id must be the record's resource id (for example a PersonId or a composite key joined by ',').");
  return encodeURIComponent(text);
}

function search(input: Params): string {
  const url = new URLSearchParams();
  const map: Record<string, string> = {
    q: "q",
    finder: "finder",
    fields: "fields",
    orderBy: "orderBy",
    expand: "expand",
    limit: "limit",
    offset: "offset",
    totalResults: "totalResults",
    effectiveOf: "effectiveDate",
  };
  for (const [key, name] of Object.entries(map)) {
    const value = input[key];
    if (value !== undefined && value !== null && value !== "") url.set(name, String(value));
  }
  url.set("onlyData", "true");
  return `?${url.toString()}`;
}

async function send(fields: Fields, fetcher: Fetch, signal: AbortSignal | undefined, path: string, init: RequestInit = {}) {
  const origin = podOrigin(fields.host);
  const response = await fetcher(`${origin}${path}`, {
    ...init,
    signal,
    headers: {
      Accept: "application/json",
      Authorization: `Basic ${btoa(`${fields.username}:${fields.password}`)}`,
      ...(init.body === undefined ? {} : { "Content-Type": "application/vnd.oracle.adf.resourceitem+json" }),
    },
  });
  if (response.status === 204) return { ok: true };
  return decodeJson(response, json());
}

const version = string().optional();
const listInput = {
  version,
  q: string().optional(),
  finder: string().optional(),
  fields: string().optional(),
  orderBy: string().optional(),
  expand: string().optional(),
  limit: number().optional(),
  offset: number().optional(),
  totalResults: string().optional(),
  effectiveOf: string().optional(),
};
const payload = record(json());

function crud(fields: Fields, fetcher: Fetch, signal: AbortSignal | undefined, resource: string, noun: string, writable: boolean) {
  const dynamic = resource === "";
  const resourceInput: Record<string, ReturnType<typeof string>> = dynamic ? { resource: string() } : {};
  const read = {
    list: query(
      {
        description: `List ${noun} records. q is an Oracle REST filter such as "LastName='Smith' and PersonNumber>1000"; finder, fields, orderBy and expand are Oracle REST parameters. Page with limit and offset (hasMore in the response tells whether more rows exist).`,
        input: object({ ...resourceInput, ...listInput }),
      },
      async (_ctx, input: Params) => send(fields, fetcher, signal, `${resourcePath(input, resource)}${search(input)}`),
    ),
    get: query(
      {
        description: `Retrieve one ${noun} by its resource id. Use fields and expand to choose attributes and child collections.`,
        input: object({ ...resourceInput, id: string(), version, fields: string().optional(), expand: string().optional(), effectiveOf: string().optional() }),
      },
      async (_ctx, input: Params) =>
        send(fields, fetcher, signal, `${resourcePath(input, resource)}/${recordId(input.id)}${search(input)}`),
    ),
  };
  if (!writable) return read;
  return {
    ...read,
    create: mutation(
      {
        description: `Create a ${noun}. body is the JSON representation of the resource, with child collections nested.`,
        input: object({ ...resourceInput, version, body: payload }),
      },
      async (_ctx, input: Params) =>
        send(fields, fetcher, signal, resourcePath(input, resource), { method: "POST", body: JSON.stringify(input.body) }),
    ),
    update: mutation(
      {
        description: `Update a ${noun} by resource id. body holds only the attributes to change (Oracle PATCH).`,
        input: object({ ...resourceInput, id: string(), version, body: payload }),
      },
      async (_ctx, input: Params) =>
        send(fields, fetcher, signal, `${resourcePath(input, resource)}/${recordId(input.id)}`, {
          method: "PATCH",
          body: JSON.stringify(input.body),
        }),
    ),
    delete: mutation(
      {
        description: `Delete a ${noun} by resource id.`,
        input: object({ ...resourceInput, id: string(), version }),
      },
      async (_ctx, input: Params) =>
        send(fields, fetcher, signal, `${resourcePath(input, resource)}/${recordId(input.id)}`, { method: "DELETE" }),
    ),
  };
}

// [router key, REST resource, noun, supports writes]
const resources: ReadonlyArray<[string, string, string, boolean]> = [
  ["workers", "workers", "worker", true],
  ["emps", "emps", "employee (lightweight worker view)", false],
  ["publicWorkers", "publicWorkers", "public worker directory entry", false],
  ["absences", "absences", "absence entry", true],
  ["absencePlans", "absencePlans", "absence plan", false],
  ["absenceTypes", "absenceTypesLOV", "absence type", false],
  ["jobs", "jobsLov", "job", false],
  ["grades", "gradesLov", "grade", false],
  ["positions", "positionsLov", "position", false],
  ["departments", "departmentsLov", "department", false],
  ["locations", "locationsLov", "location", false],
  ["legalEmployers", "legalEmployersLov", "legal employer", false],
  ["businessUnits", "businessUnitsLOV", "business unit", false],
  ["userAccounts", "userAccounts", "user account", false],
  ["personalPaymentMethods", "personalPaymentMethods", "personal payment method", true],
  ["goalPlans", "goalPlans", "goal plan", false],
  ["performanceDocuments", "performanceDocuments", "performance document", false],
  ["workRelationships", "workRelationships", "work relationship", false],
  ["recruitingJobRequisitions", "recruitingCEJobRequisitions", "job requisition", false],
  ["recruitingCandidates", "recruitingCECandidates", "recruiting candidate", false],
  ["recruitingJobApplications", "recruitingJobApplications", "job application", true],
];

export default defineApp(
  { user: { accounts: { oracleHcm: oracleHcm.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.oracleHcm ?? [],
        (account) => {
          const fields = account.fields;
          const named = Object.fromEntries(
            resources.map(([key, resource, noun, writable]) => [
              key,
              router(crud(fields, fetch, signal, resource, noun, writable), { title: noun, description: `Oracle HCM ${resource} REST resource.` }),
            ]),
          );
          return withApprovals(
            router({
              describe: query(
                {
                  description: "Retrieve a resource's metadata (attributes, child collections, finders and actions) from its /describe endpoint. Use it to discover the shape of any resource, including ones without a named tool.",
                  input: object({ resource: string(), version }),
                },
                async (_ctx, input: Params) => send(fields, fetch, signal, `${resourcePath(input, "")}/describe`),
              ),
              resource: router(crud(fields, fetch, signal, "", "record of any REST resource", true), {
                title: "Any resource",
                description:
                  "The same operations for any HCM REST resource or child collection: pass resource (for example workers, or workers/<id>/child/assignments) and the operation's other inputs.",
              }),
              action: mutation(
                {
                  description: "Invoke a custom resource action, for example the action named in a resource's describe output. POSTs body with the vendor action content type to <resource>/<id>.",
                  input: object({ resource: string(), id: string().optional(), version, body: payload }),
                },
                async (_ctx, input: Params) => {
                  const base = resourcePath(input, "");
                  const target = input.id === undefined || input.id === "" ? base : `${base}/${recordId(input.id)}`;
                  return send(fields, fetch, signal, target, { method: "POST", body: JSON.stringify(input.body) });
                },
              ),
              ...named,
            }),
            (tool) => (tool.kind === "mutation" ? always() : undefined),
          );
        },
        { signal },
      ),
      {
        title: "Oracle HCM",
        description:
          "Oracle Fusion Cloud HCM: workers, employees, absences, jobs, grades, positions, departments, locations, legal employers, recruiting and performance, plus any HCM REST resource.",
        instructions:
          "Oracle HCM REST resources live under /hcmRestApi/resources/<version> (default 11.13.18.05). Filter with q (Oracle REST syntax, e.g. \"LastName='Smith'\"), pick attributes with fields, load children with expand, and page with limit and offset. A record's id is its resource id (often a PersonId, or a composite key joined by ','). Resource names are case sensitive; call describe to discover a resource's attributes, children and finders, and use the resource.* tools for resources without a named router. Child collections are addressed as workers/<id>/child/<collection>.",
        icons,
      },
    ),
  }),
);
