import {
  accountRouter,
  defineApp,
  defineProvider,
  mutation,
  oauth2,
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

const apiVersion = "2025-05-05";

type Fields = { accountName: string; sasToken: string } | { access_token: string };

// Microsoft Entra ID's /common OIDC metadata has a templated issuer, so the endpoints are declared; the connect page asks for an app registration's client.
// The Azure Storage delegated permission is `user_impersonation` on https://storage.azure.com.
const azure = defineProvider({
  name: "Azure Blob Storage",
  hosts: ["*.blob.core.windows.net"],
  auth: {
    // A shared access signature (account, service or user delegation SAS) for one storage account.
    sas: secrets({
      label: "Storage account name and SAS token",
      fields: object({ accountName: plain(string({ minLength: 3 })), sasToken: string({ minLength: 1 }) }),
    }),
    oauth: oauth2({
      authorizationUrl: "https://login.microsoftonline.com/common/oauth2/v2.0/authorize",
      tokenUrl: "https://login.microsoftonline.com/common/oauth2/v2.0/token",
      tokenEndpointAuthMethod: "client_secret_post",
      scopes: ["offline_access", "https://storage.azure.com/user_impersonation"],
    }),
  },
  // Get Account Information is allowed for any valid SAS. An OAuth token is not tied to one
  // storage account, so there is nothing account-specific to read until a tool names one.
  async health({ account, fetch, signal }) {
    if (account.method === "oauth") return { accountInfo: {} };
    const { accountName, sasToken } = account.fields;
    const response = await fetch(
      `https://${accountName}.blob.core.windows.net/?restype=account&comp=properties&${sasToken.replace(/^\?/, "")}`,
      { signal, headers: { "x-ms-version": apiVersion } },
    );
    if (response.status === 401 || response.status === 403) throw new Error("Azure rejected this SAS token for that storage account.");
    if (!response.ok) throw new Error(`Azure Blob Storage returned HTTP ${response.status}.`);
    return { accountInfo: { externalId: accountName, displayName: accountName } };
  },
});

type Params = Record<string, string | undefined>;
type Result = { status: number; headers: Record<string, string>; body: string };

const segments = (path: string) => path.split("/").map(encodeURIComponent).join("/");

function build(account: { method: string; fields: unknown }, fetcher: typeof fetch, signal: AbortSignal | undefined) {
  const fields = account.fields as Fields;
  const storedAccount = "accountName" in fields ? fields.accountName : undefined;

  const call = async (
    verb: string,
    storageAccount: string | undefined,
    path: string,
    search: Params,
    headers: Record<string, string> = {},
    body?: string,
  ): Promise<Result> => {
    const name = storageAccount ?? storedAccount;
    if (name === undefined) throw new Error("storageAccount is required: pass the storage account name (the part before .blob.core.windows.net).");
    if (!/^[a-z0-9]{3,24}$/.test(name)) throw new Error("storageAccount must be 3-24 lowercase letters and digits.");
    if (storedAccount !== undefined && name !== storedAccount)
      throw new Error(`This account's SAS token is for ${storedAccount}; storageAccount ${name} does not match.`);
    const parts = Object.entries(search)
      .filter((entry): entry is [string, string] => entry[1] !== undefined && entry[1] !== "")
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`);
    if ("sasToken" in fields) parts.push(fields.sasToken.replace(/^\?/, ""));
    const url = `https://${name}.blob.core.windows.net/${path}${parts.length > 0 ? `?${parts.join("&")}` : ""}`;
    const auth: Record<string, string> = "access_token" in fields ? { Authorization: `Bearer ${fields.access_token}` } : {};
    const response = await fetcher(url, {
      method: verb,
      signal,
      headers: { "x-ms-version": apiVersion, ...auth, ...headers },
      ...(body === undefined ? {} : { body }),
    });
    const text = await response.text();
    if (!response.ok) {
      const code = /<Code>([^<]*)<\/Code>/.exec(text)?.[1] ?? "";
      const message = /<Message>([^<]*)<\/Message>/.exec(text)?.[1] ?? "";
      throw new Error(`Azure Blob Storage HTTP ${response.status} ${code} ${message}`.trim());
    }
    const out: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      if (key.startsWith("x-ms-") || ["content-type", "content-length", "etag", "last-modified", "content-md5"].includes(key)) out[key] = value;
    });
    return { status: response.status, headers: out, body: text };
  };

  const sa = string().optional();
  const meta = (m: Record<string, string> | undefined) =>
    Object.fromEntries(Object.entries(m ?? {}).map(([k, v]) => [`x-ms-meta-${k}`, v]));
  const blobPath = (container: string, blob: string) => `${encodeURIComponent(container)}/${segments(blob)}`;

  return router({
    getAccountInformation: query(
      { description: "Get the SKU name and account kind of the storage account.", input: object({ storageAccount: sa }) },
      async (_c, i) => call("GET", i.storageAccount, "", { restype: "account", comp: "properties" }),
    ),
    listContainers: query(
      {
        description:
          "List blob containers in the storage account. Returns the XML EnumerationResults; follow NextMarker by passing it as marker.",
        input: object({ storageAccount: sa, prefix: string().optional(), marker: string().optional(), maxresults: string().optional() }),
      },
      async (_c, i) => call("GET", i.storageAccount, "", { comp: "list", prefix: i.prefix, marker: i.marker, maxresults: i.maxresults }),
    ),
    getContainerProperties: query(
      { description: "Get a container's properties and metadata (returned as response headers).", input: object({ storageAccount: sa, container: string() }) },
      async (_c, i) => call("HEAD", i.storageAccount, encodeURIComponent(i.container), { restype: "container" }),
    ),
    listBlobs: query(
      {
        description:
          "List blobs in a container as XML. Use delimiter '/' with prefix to browse like folders; follow NextMarker via marker. include is a comma-separated list such as metadata,tags,snapshots,versions.",
        input: object({
          storageAccount: sa,
          container: string(),
          prefix: string().optional(),
          delimiter: string().optional(),
          marker: string().optional(),
          maxresults: string().optional(),
          include: string().optional(),
        }),
      },
      async (_c, i) =>
        call("GET", i.storageAccount, encodeURIComponent(i.container), {
          restype: "container",
          comp: "list",
          prefix: i.prefix,
          delimiter: i.delimiter,
          marker: i.marker,
          maxresults: i.maxresults,
          include: i.include,
        }),
    ),
    findBlobsByTags: query(
      {
        description: "Find blobs across the storage account whose index tags match a filter expression, e.g. \"project\" = 'x' AND \"status\" = 'done'. Returns XML.",
        input: object({ storageAccount: sa, where: string(), marker: string().optional(), maxresults: string().optional() }),
      },
      async (_c, i) => call("GET", i.storageAccount, "", { comp: "blobs", where: i.where, marker: i.marker, maxresults: i.maxresults }),
    ),
    getBlob: query(
      {
        description:
          "Download a blob's content as text (binary blobs will not decode cleanly). Optional range like bytes=0-1023.",
        input: object({ storageAccount: sa, container: string(), blob: string(), range: string().optional() }),
      },
      async (_c, i) =>
        call("GET", i.storageAccount, blobPath(i.container, i.blob), {}, i.range === undefined ? {} : { "x-ms-range": i.range }),
    ),
    getBlobProperties: query(
      { description: "Get a blob's properties and metadata (size, content type, ETag, x-ms-meta-* headers) without downloading it.", input: object({ storageAccount: sa, container: string(), blob: string() }) },
      async (_c, i) => call("HEAD", i.storageAccount, blobPath(i.container, i.blob), {}),
    ),
    getBlobTags: query(
      { description: "Get a blob's index tags as XML.", input: object({ storageAccount: sa, container: string(), blob: string() }) },
      async (_c, i) => call("GET", i.storageAccount, blobPath(i.container, i.blob), { comp: "tags" }),
    ),
    createContainer: mutation(
      { description: "Create a container. Optional metadata key/value pairs.", input: object({ storageAccount: sa, container: string(), metadata: record(string()).optional() }) },
      async (_c, i) => call("PUT", i.storageAccount, encodeURIComponent(i.container), { restype: "container" }, meta(i.metadata)),
    ),
    deleteContainer: mutation(
      { description: "Delete a container and every blob in it.", input: object({ storageAccount: sa, container: string() }) },
      async (_c, i) => call("DELETE", i.storageAccount, encodeURIComponent(i.container), { restype: "container" }),
    ),
    putBlob: mutation(
      {
        description: "Upload text content as a block blob, replacing any existing blob of that name. contentType defaults to text/plain; charset=utf-8.",
        input: object({
          storageAccount: sa,
          container: string(),
          blob: string(),
          content: string(),
          contentType: string().optional(),
          metadata: record(string()).optional(),
        }),
      },
      async (_c, i) =>
        call(
          "PUT",
          i.storageAccount,
          blobPath(i.container, i.blob),
          {},
          {
            "x-ms-blob-type": "BlockBlob",
            "Content-Type": i.contentType ?? "text/plain; charset=utf-8",
            ...meta(i.metadata),
          },
          i.content,
        ),
    ),
    copyBlob: mutation(
      {
        description:
          "Copy a blob within the storage account (or from a URL the account can read) to a destination blob. source is a full URL, for example https://myaccount.blob.core.windows.net/src/a.txt.",
        input: object({ storageAccount: sa, container: string(), blob: string(), source: string() }),
      },
      async (_c, i) => call("PUT", i.storageAccount, blobPath(i.container, i.blob), {}, { "x-ms-copy-source": i.source }),
    ),
    setBlobMetadata: mutation(
      { description: "Replace all user-defined metadata on a blob with the given key/value pairs.", input: object({ storageAccount: sa, container: string(), blob: string(), metadata: record(string()) }) },
      async (_c, i) => call("PUT", i.storageAccount, blobPath(i.container, i.blob), { comp: "metadata" }, meta(i.metadata)),
    ),
    setBlobTags: mutation(
      {
        description: "Replace a blob's index tags. tags is a map of tag name to value.",
        input: object({ storageAccount: sa, container: string(), blob: string(), tags: record(string()) }),
      },
      async (_c, i) => {
        const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
        const xml = `<?xml version="1.0" encoding="utf-8"?><Tags><TagSet>${Object.entries(i.tags)
          .map(([k, v]) => `<Tag><Key>${esc(k)}</Key><Value>${esc(v)}</Value></Tag>`)
          .join("")}</TagSet></Tags>`;
        return call("PUT", i.storageAccount, blobPath(i.container, i.blob), { comp: "tags" }, { "Content-Type": "application/xml" }, xml);
      },
    ),
    snapshotBlob: mutation(
      { description: "Create a read-only snapshot of a blob.", input: object({ storageAccount: sa, container: string(), blob: string() }) },
      async (_c, i) => call("PUT", i.storageAccount, blobPath(i.container, i.blob), { comp: "snapshot" }),
    ),
    deleteBlob: mutation(
      {
        description: "Delete a blob. deleteSnapshots 'include' also deletes its snapshots; 'only' deletes just the snapshots.",
        input: object({ storageAccount: sa, container: string(), blob: string(), deleteSnapshots: string().optional() }),
      },
      async (_c, i) =>
        call("DELETE", i.storageAccount, blobPath(i.container, i.blob), {}, i.deleteSnapshots === undefined ? {} : { "x-ms-delete-snapshots": i.deleteSnapshots }),
    ),
    undeleteBlob: mutation(
      { description: "Restore a soft-deleted blob and its snapshots.", input: object({ storageAccount: sa, container: string(), blob: string() }) },
      async (_c, i) => call("PUT", i.storageAccount, blobPath(i.container, i.blob), { comp: "undelete" }),
    ),
  });
}

export default defineApp(
  { user: { accounts: { azure: azure.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.azure ?? [],
        (account) =>
          withApprovals(build(account, fetch, signal), (tool) => (tool.kind === "mutation" ? always() : undefined)),
        { signal },
      ),
      {
        title: "Azure Blob Storage",
        description:
          "List, read, upload, copy, tag, snapshot and delete blobs and containers in an Azure Storage account.",
        instructions:
          "Every tool takes storageAccount, the account name before .blob.core.windows.net. It is optional for SAS-token accounts, which are tied to one storage account. List operations return Azure's XML; page with NextMarker via marker. Blob content is handled as text.",
        icons,
      },
    ),
  }),
);
