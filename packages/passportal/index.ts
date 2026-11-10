import {
  accountRouter,
  array,
  decodeJson,
  defineApp,
  defineProvider,
  json,
  mutation,
  number,
  object,
  plain,
  query,
  raw,
  router,
  secrets,
  string,
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const passportal = defineProvider({
  name: "Passportal",
  hosts: ["*.passportalmsp.com"],
  auth: {
    // Settings > API Keys > Create access key in the Passportal dashboard.
    // The API access token is minted from an HMAC-SHA256 of a fixed message keyed with the
    // secret key, so the app must be able to read the secret key.
    apiKey: secrets({
      label: "API access key",
      fields: object({
        baseUrl: plain(string({ minLength: 1 })),
        accessKeyId: string({ minLength: 1 }),
        secretKey: raw(string({ minLength: 1 })),
      }),
    }),
  },
  async health({ account, fetch, signal }) {
    const base = baseUrl(account.fields.baseUrl);
    const token = await accessToken(account, fetch, signal);
    const response = await fetch(`${base}/api/v2/documents?resultsPerPage=1&pageNum=1`, {
      signal,
      headers: { "x-access-token": token, accept: "application/json" },
    });
    await decodeJson(response, object({ success: json() }));
  },
});

type Account = { fields: { baseUrl: string; accessKeyId: string; secretKey: string } };
type Fetch = typeof fetch;

const encoder = new TextEncoder();
const content = "api-content-hash";

const hex = (bytes: ArrayBuffer) =>
  [...new Uint8Array(bytes)].map((byte) => byte.toString(16).padStart(2, "0")).join("");

// The dashboard URL of the instance, for example https://us-clover.passportalmsp.com.
function baseUrl(value: string) {
  const host = value.trim().toLowerCase().replace(/^https:\/\//, "").replace(/\/.*$/, "");
  if (!/^[a-z0-9-]+(\.[a-z0-9-]+)*\.passportalmsp\.com$/.test(host)) {
    throw new Error(`Unexpected Passportal base URL: ${value} (expected https://<instance>.passportalmsp.com)`);
  }
  return `https://${host}`;
}

// POST /api/v2/auth/client_token with x-key and x-hash (HMAC-SHA256 hex of the content, keyed by the secret).
async function accessToken(account: Account, fetchImpl: Fetch, signal: AbortSignal | undefined) {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(account.fields.secretKey),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const hash = hex(await crypto.subtle.sign("HMAC", key, encoder.encode(content)));
  const response = await fetchImpl(`${baseUrl(account.fields.baseUrl)}/api/v2/auth/client_token`, {
    method: "POST",
    signal,
    headers: {
      "x-key": account.fields.accessKeyId,
      "x-hash": hash,
      "content-type": "application/json",
      accept: "application/json",
    },
    body: JSON.stringify({ scope: "docs_api", content }),
  });
  const { access_token } = await decodeJson(response, object({ access_token: string() }));
  return access_token;
}

const segment = (value: string | number) => encodeURIComponent(String(value));

const passportalTools = (account: Account, signal: AbortSignal) => {
  const call = async (
    fetchImpl: Fetch,
    method: "GET" | "POST" | "PUT" | "PATCH",
    path: string,
    params: Record<string, string | number | undefined> = {},
    body?: unknown,
  ) => {
    const token = await accessToken(account, fetchImpl, signal);
    const search = new URLSearchParams();
    for (const [name, value] of Object.entries(params)) if (value !== undefined) search.set(name, String(value));
    const query = search.size === 0 ? "" : `?${search}`;
    const headers: Record<string, string> = { "x-access-token": token, accept: "application/json" };
    if (body !== undefined) headers["content-type"] = "application/json";
    const response = await fetchImpl(`${baseUrl(account.fields.baseUrl)}${path}${query}`, {
      method,
      signal,
      headers,
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    return decodeJson(response, json());
  };

  return router({
    documents: router(
      {
        list: query(
          {
            description:
              "List documents (id, label, client_id, templateId, templateName, type). Filter by type, templateUid (UID or id such as tpl-101 or 101), clientId or searchTxt; page with resultsPerPage and pageNum.",
            input: object({
              resultsPerPage: number().optional(),
              pageNum: number().optional(),
              orderBy: string().optional(),
              orderDir: string().optional(),
              type: string().optional(),
              templateUid: string().optional(),
              clientId: number().optional(),
              searchTxt: string().optional(),
            }),
          },
          ({ fetch }, input) => call(fetch, "GET", "/api/v2/documents", input),
        ),
        get: query(
          { description: "Get one document with its fields by documentId.", input: object({ documentId: string() }) },
          ({ fetch }, { documentId }) => call(fetch, "GET", `/api/v2/documents/${segment(documentId)}`),
        ),
        createBatch: mutation(
          {
            description:
              "Create documents. documents is a list of { templateUid, clientId, title } objects, for example [{ templateUid: \"59\", clientId: 101, title: \"New asset\" }].",
            input: object({ documents: array(json()) }),
            approval: always(),
          },
          ({ fetch }, { documents }) => call(fetch, "POST", "/api/v2/documents", {}, documents),
        ),
        updateBatch: mutation(
          {
            description:
              "Update documents, changing only the properties present. documents is a list of { templateUid, id, title } objects.",
            input: object({ documents: array(json()) }),
            approval: always(),
          },
          ({ fetch }, { documents }) => call(fetch, "PATCH", "/api/v2/documents", {}, documents),
        ),
        replaceBatch: mutation(
          {
            description:
              "Update documents and remove every property that is not present. documents is a list of { templateUid, id, title } objects.",
            input: object({ documents: array(json()) }),
            approval: always(),
          },
          ({ fetch }, { documents }) => call(fetch, "PUT", "/api/v2/documents", {}, documents),
        ),
        update: mutation(
          {
            description:
              "Update one document, changing only the properties present. fields maps a property key to { name, description, value: { type, text } }.",
            input: object({ documentId: string(), fields: json() }),
            approval: always(),
          },
          ({ fetch }, { documentId, fields }) =>
            call(fetch, "PATCH", `/api/v2/documents/${segment(documentId)}`, {}, fields),
        ),
        replace: mutation(
          {
            description:
              "Update one document and remove every property that is not present. fields maps a property key to { name, description, value: { type, text } }.",
            input: object({ documentId: string(), fields: json() }),
            approval: always(),
          },
          ({ fetch }, { documentId, fields }) =>
            call(fetch, "PUT", `/api/v2/documents/${segment(documentId)}`, {}, fields),
        ),
      },
      { title: "Documents" },
    ),
  });
};

export default defineApp(
  { user: { accounts: { passportal: passportal.many() } }, icons },
  async ({ user, signal }) => ({
    tools: router(
      await accountRouter(user?.accounts.passportal ?? [], (account) => passportalTools(account, signal), { signal }),
      {
        title: "Passportal",
        description:
          "N-able Passportal documentation: list, read, create and update documents (assets, applications, contacts, locations and other templates).",
        icons,
      },
    ),
  }),
);
