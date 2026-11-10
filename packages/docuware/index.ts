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

// DocuWare Cloud is hosted per organization (https://<name>.docuware.cloud) and signs users in
// through an identity service on a docuware.cloud host. Every request is built from the validated
// https origin below, which must be a single-level subdomain of docuware.cloud.
function instanceBase(raw: string): string {
  const text = raw.trim();
  let url: URL;
  try {
    url = new URL(/^https?:\/\//i.test(text) ? text : `https://${text}`);
  } catch {
    throw new Error("Enter your DocuWare URL, for example https://mycompany.docuware.cloud.");
  }
  if (url.protocol !== "https:") throw new Error("The DocuWare URL must use https.");
  if (!/^[a-z0-9-]+\.docuware\.cloud$/i.test(url.hostname) || url.port !== "") {
    throw new Error("The DocuWare URL must be a cloud address such as https://mycompany.docuware.cloud; on-premises systems are not supported.");
  }
  return url.origin;
}

function cloudUrl(raw: unknown, what: string): string {
  let url: URL;
  try {
    url = new URL(String(raw));
  } catch {
    throw new Error(`DocuWare returned an invalid ${what}.`);
  }
  if (url.protocol !== "https:" || !/\.docuware\.cloud$/i.test(url.hostname)) {
    throw new Error(`Refusing to send credentials to ${url.hostname}: the ${what} is not a docuware.cloud address.`);
  }
  return url.toString();
}

type Fields = { instance: string; username: string; password: string };
type Fetch = typeof fetch;

// DocuWare's OAuth2 password grant, discovered per system: IdentityServiceInfo -> OIDC metadata -> token.
async function accessToken(fields: Fields, fetcher: Fetch, signal: AbortSignal | undefined): Promise<string> {
  const base = instanceBase(fields.instance);
  const info = await decodeJson(
    await fetcher(`${base}/DocuWare/Platform/Home/IdentityServiceInfo`, { signal, headers: { Accept: "application/json" } }),
    object({ IdentityServiceUrl: string() }),
  );
  const identity = cloudUrl(info.IdentityServiceUrl, "identity service URL").replace(/\/+$/, "");
  const metadata = await decodeJson(
    await fetcher(`${identity}/.well-known/openid-configuration`, { signal, headers: { Accept: "application/json" } }),
    object({ token_endpoint: string() }),
  );
  const tokenUrl = cloudUrl(metadata.token_endpoint, "token endpoint");
  const response = await fetcher(tokenUrl, {
    method: "POST",
    signal,
    headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
    body: new URLSearchParams({
      grant_type: "password",
      scope: "docuware.platform",
      client_id: "docuware.platform.net.client",
      username: fields.username,
      password: fields.password,
    }).toString(),
  });
  if (!response.ok) throw new Error(`DocuWare sign-in failed with HTTP ${response.status}.`);
  const token = await decodeJson(response, object({ access_token: string() }));
  return token.access_token;
}

const docuware = defineProvider({
  name: "DocuWare",
  hosts: ["*.docuware.cloud"],
  auth: {
    // DocuWare's OAuth endpoints are discovered per system and it offers no client registration for
    // third parties, so the connection uses a user's name and password with the password grant.
    password: secrets({
      label: "User name and password",
      fields: object({
        instance: plain(string({ minLength: 1 })),
        username: plain(string({ minLength: 1 })),
        password: string({ minLength: 1 }),
      }),
    }),
  },
  async health({ account, fetch, signal }) {
    const fields = account.fields;
    const base = instanceBase(fields.instance);
    const token = await accessToken(fields, fetch, signal);
    const response = await fetch(`${base}/DocuWare/Platform/Organizations`, {
      signal,
      headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
    });
    await decodeJson(response, object({}));
    return { accountInfo: { externalId: `${base}:${fields.username}`, displayName: `${fields.username} @ ${new URL(base).hostname}` } };
  },
});

type Params = Record<string, unknown>;
const platform = "/DocuWare/Platform";
const payload = record(json());

function id(value: unknown, what: string): string {
  const text = String(value);
  if (!/^[A-Za-z0-9_-]+$/.test(text)) throw new Error(`${what} must be an id such as a GUID.`);
  return text;
}

function qs(input: Params, names: string[]): string {
  const url = new URLSearchParams();
  for (const name of names) {
    const value = input[name];
    if (value !== undefined && value !== null && value !== "") url.set(name, String(value));
  }
  const text = url.toString();
  return text === "" ? "" : `?${text}`;
}

export default defineApp(
  { user: { accounts: { docuware: docuware.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.docuware ?? [],
        (account) => {
          const fields = account.fields;
          const base = instanceBase(fields.instance);
          let cached: { token: Promise<string>; expires: number } | undefined;
          const token = () => {
            if (cached === undefined || cached.expires < Date.now()) {
              const token = accessToken(fields, fetch, signal);
              token.catch(() => {
                cached = undefined;
              });
              cached = { token, expires: Date.now() + 5 * 60_000 };
            }
            return cached.token;
          };

          async function send(path: string, init: RequestInit = {}): Promise<unknown> {
            const response = await fetch(`${base}${platform}${path}`, {
              ...init,
              signal,
              headers: {
                Accept: "application/json",
                Authorization: `Bearer ${await token()}`,
                ...(init.body === undefined ? {} : { "Content-Type": "application/json" }),
              },
            });
            if (response.status === 204) return { ok: true };
            return decodeJson(response, json());
          }

          const cabinet = (input: Params) => `/FileCabinets/${id(input.fileCabinetId, "fileCabinetId")}`;
          const paging = { count: number().optional(), start: number().optional() };
          const fileCabinetId = { fileCabinetId: string() };

          return withApprovals(
            router({
              organizations: router(
                {
                  list: query({ description: "List the organizations of this DocuWare system.", input: object({}) }, async () => send("/Organizations")),
                  users: query(
                    { description: "List the users of an organization.", input: object({ organizationId: string() }) },
                    async (_ctx, input: Params) => send(`/Organizations/${id(input.organizationId, "organizationId")}/Users`),
                  ),
                  groups: query(
                    { description: "List the groups of an organization.", input: object({ organizationId: string() }) },
                    async (_ctx, input: Params) => send(`/Organizations/${id(input.organizationId, "organizationId")}/Groups`),
                  ),
                  roles: query(
                    { description: "List the roles of an organization.", input: object({ organizationId: string() }) },
                    async (_ctx, input: Params) => send(`/Organizations/${id(input.organizationId, "organizationId")}/Roles`),
                  ),
                },
                { title: "Organizations", description: "The organization, its users, groups and roles." },
              ),
              fileCabinets: router(
                {
                  list: query(
                    { description: "List the file cabinets and document trays the user can access (document trays have IsBasket true).", input: object({}) },
                    async () => send("/FileCabinets"),
                  ),
                  get: query({ description: "Retrieve one file cabinet or document tray.", input: object(fileCabinetId) }, async (_ctx, input: Params) =>
                    send(cabinet(input)),
                  ),
                  dialogs: query(
                    {
                      description: "List a file cabinet's dialogs (search, result list, store and info dialogs). Search dialog ids are used by documents.query.",
                      input: object({ ...fileCabinetId, dialogType: string().optional() }),
                    },
                    async (_ctx, input: Params) => send(`${cabinet(input)}/Dialogs${qs({ DialogType: input.dialogType }, ["DialogType"])}`),
                  ),
                  dialog: query(
                    {
                      description: "Retrieve a dialog with its fields (DBName, type, selection lists) to know which index fields can be searched or stored.",
                      input: object({ ...fileCabinetId, dialogId: string() }),
                    },
                    async (_ctx, input: Params) => send(`${cabinet(input)}/Dialogs/${id(input.dialogId, "dialogId")}`),
                  ),
                },
                { title: "File cabinets", description: "File cabinets, document trays and their dialogs." },
              ),
              documents: router(
                {
                  list: query(
                    {
                      description: "List documents of a file cabinet or document tray without a search condition. Page with count and start.",
                      input: object({ ...fileCabinetId, ...paging }),
                    },
                    async (_ctx, input: Params) => send(`${cabinet(input)}/Documents${qs(input, ["count", "start"])}`),
                  ),
                  get: query(
                    { description: "Retrieve one document's index fields and metadata.", input: object({ ...fileCabinetId, documentId: number() }) },
                    async (_ctx, input: Params) => send(`${cabinet(input)}/Documents/${id(input.documentId, "documentId")}`),
                  ),
                  query: query(
                    {
                      description:
                        'Search a file cabinet with a search dialog. body is DocuWare\'s query, for example {"Condition":[{"DBName":"COMPANY","Value":["Acme*"]}],"Operation":"And","SortOrder":[{"Field":"DWSTOREDATETIME","Direction":"Desc"}],"Count":50}. Reading only; nothing is changed.',
                      input: object({ ...fileCabinetId, dialogId: string(), body: payload }),
                    },
                    async (_ctx, input: Params) =>
                      send(`${cabinet(input)}/Query/DocumentsQuery${qs(input, ["dialogId"])}`, { method: "POST", body: JSON.stringify(input.body) }),
                  ),
                  create: mutation(
                    {
                      description:
                        'Create a document in a file cabinet or document tray from index fields only (no file). body is {"Fields":[{"FieldName":"COMPANY","Item":"Acme","ItemElementName":"String"}]}.',
                      input: object({ ...fileCabinetId, body: payload }),
                    },
                    async (_ctx, input: Params) => send(`${cabinet(input)}/Documents`, { method: "POST", body: JSON.stringify(input.body) }),
                  ),
                  updateFields: mutation(
                    {
                      description:
                        'Update a document\'s index fields. body is {"Field":[{"FieldName":"STATUS","Item":"Paid","ItemElementName":"String"}]}.',
                      input: object({ ...fileCabinetId, documentId: number(), body: payload }),
                    },
                    async (_ctx, input: Params) =>
                      send(`${cabinet(input)}/Documents/${id(input.documentId, "documentId")}/Fields`, { method: "PUT", body: JSON.stringify(input.body) }),
                  ),
                  delete: mutation(
                    { description: "Delete a document.", input: object({ ...fileCabinetId, documentId: number() }) },
                    async (_ctx, input: Params) => send(`${cabinet(input)}/Documents/${id(input.documentId, "documentId")}`, { method: "DELETE" }),
                  ),
                },
                { title: "Documents", description: "Search, read, create, index and delete documents." },
              ),
              get: query(
                {
                  description:
                    "GET any DocuWare Platform REST resource by path below /DocuWare/Platform, for example /Workflows or /FileCabinets/<id>/Documents/<n>/Annotations.",
                  input: object({ path: string(), query: record(string()).optional() }),
                },
                async (_ctx, input: Params) => rawSend(input, "GET"),
              ),
              request: mutation(
                {
                  description: "Send a POST, PUT, PATCH or DELETE to any DocuWare Platform REST resource by path below /DocuWare/Platform.",
                  input: object({ method: string(), path: string(), query: record(string()).optional(), body: payload.optional() }),
                },
                async (_ctx, input: Params) => rawSend(input, String(input.method).toUpperCase()),
              ),
            }),
            (tool) => (tool.kind === "mutation" ? always() : undefined),
          );

          function rawSend(input: Params, method: string): Promise<unknown> {
            if (!["GET", "POST", "PUT", "PATCH", "DELETE"].includes(method)) throw new Error("method must be GET, POST, PUT, PATCH or DELETE.");
            const path = String(input.path);
            if (!path.startsWith("/") || path.includes("..") || path.includes("?") || path.includes("#") || path.includes("//")) {
              throw new Error("path must start with / and not contain .., ?, # or //; pass query parameters in query.");
            }
            const search = new URLSearchParams((input.query as Record<string, string> | undefined) ?? {}).toString();
            return send(`${path}${search === "" ? "" : `?${search}`}`, {
              method,
              ...(input.body === undefined ? {} : { body: JSON.stringify(input.body) }),
            });
          }
        },
        { signal },
      ),
      {
        title: "DocuWare",
        description: "DocuWare Cloud document management: organizations and users, file cabinets and trays, dialogs, document search, create, index update and delete.",
        instructions:
          "Start with fileCabinets.list, then fileCabinets.dialogs and dialog to learn the searchable fields (DBName). Search with documents.query using a search dialog id; list needs no condition. Use get / request for any other Platform resource (workflows, annotations, stamps). File content download and upload are not covered by named tools.",
        icons,
      },
    ),
  }),
);
