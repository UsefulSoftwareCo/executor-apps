import {
  accountRouter,
  boolean,
  decodeJson,
  defineApp,
  defineProvider,
  json,
  mutation,
  object,
  plain,
  query,
  record,
  router,
  secrets,
  string,
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

// AppDrag Cloud Backend: one project is identified by its App ID and secured by its API key
// (Cloud Backend > API in the dashboard). Management commands go to api.appdrag.com; the
// project's own API functions are served from https://<project name>.appdrag.com.
const managementUrl = "https://api.appdrag.com/CloudBackend.aspx";
const appIdPattern = /^[A-Za-z0-9][A-Za-z0-9-]*$/;

function checkAppId(appId: string) {
  const trimmed = appId.trim();
  if (!appIdPattern.test(trimmed)) throw new Error("App ID may only contain letters, digits and '-'");
  return trimmed;
}

const appdrag = defineProvider({
  name: "AppDrag",
  hosts: ["api.appdrag.com", "*.appdrag.com"],
  auth: {
    apiKey: secrets({
      label: "Cloud Backend API key (with the project's App ID and project name)",
      fields: object({
        appId: plain(string({ minLength: 1 })),
        projectName: plain(string({ minLength: 1 })),
        token: string({ minLength: 1 }),
      }),
    }),
  },
  async health({ account, fetch, signal }) {
    const appId = checkAppId(account.fields.appId);
    const response = await fetch(managementUrl, {
      method: "POST",
      signal,
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        command: "DirectoryList",
        APIKey: account.fields.token,
        appID: appId,
        directory: "/",
      }),
    });
    await decodeJson(response, json());
    return { accountInfo: { externalId: appId, displayName: appId } };
  },
});

type Fetch = typeof fetch;
type Params = Record<string, string | undefined>;

function client(appId: string, projectName: string, token: string, fetcher: Fetch, signal: AbortSignal | undefined) {
  const command = async (name: string, params: Params = {}) => {
    const body = new URLSearchParams({ command: name, APIKey: token, appID: appId });
    for (const [key, value] of Object.entries(params)) if (value !== undefined) body.set(key, value);
    const response = await fetcher(managementUrl, {
      method: "POST",
      signal,
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body,
    });
    const text = await response.text();
    if (!response.ok) throw new Error(`AppDrag returned ${response.status}: ${text.slice(0, 500)}`);
    try {
      return JSON.parse(text) as unknown;
    } catch {
      return { raw: text };
    }
  };
  const fn = async (projectName: string, method: string, folder: string, name: string, params: Record<string, unknown>) => {
    const seg = encodeURIComponent;
    const url = new URL(`https://${projectName}.appdrag.com/api/${seg(folder)}/${seg(name)}`);
    const all: Record<string, unknown> = { ...params, APIKey: token };
    let init: RequestInit;
    if (method === "GET") {
      for (const [key, value] of Object.entries(all)) if (value !== undefined && value !== null) url.searchParams.set(key, String(value));
      init = { method, signal };
    } else {
      init = {
        method,
        signal,
        headers: { "content-type": "application/json" },
        body: JSON.stringify(all),
      };
    }
    const response = await fetcher(url.toString(), init);
    const text = await response.text();
    if (!response.ok) throw new Error(`AppDrag function returned ${response.status}: ${text.slice(0, 500)}`);
    try {
      return JSON.parse(text) as unknown;
    } catch {
      return { raw: text };
    }
  };
  return { command, fn, projectName };
}

type Client = ReturnType<typeof client>;

const key = () => string({ minLength: 1 });
const Args = record(json());

function build({ command, fn, projectName }: Client) {
  return router({
    database: router({
      select: query(
        {
          description:
            "Run a SQL SELECT against the project's Cloud Database (MySQL) and return the rows. AppDrag does not document that the server rejects writes sent through this command, so it requires approval.",
          input: object({ query: key() }),
          approval: always(),
        },
        async (_c, { query: sql }) => command("CloudDBGetDataset", { query: sql }),
      ),
      execute: mutation(
        {
          description:
            "Run a raw SQL statement (INSERT, UPDATE, DELETE, DDL) against the project's Cloud Database.",
          input: object({ query: key() }),
          approval: always(),
        },
        async (_c, { query: sql }) => command("CloudDBExecuteRawQuery", { query: sql }),
      ),
    }),
    files: router({
      list: query(
        {
          description: "List the files and subdirectories of a Cloud Backend storage directory.",
          input: object({ directory: key() }),
        },
        async (_c, { directory }) => command("DirectoryList", { directory }),
      ),
      writeText: mutation(
        {
          description: "Create or overwrite a text file in Cloud Backend storage.",
          input: object({ filekey: key(), content: string() }),
          approval: always(),
        },
        async (_c, { filekey, content }) => command("WriteTextFile", { filekey, content }),
      ),
      downloadRemote: mutation(
        {
          description: "Download a file from a public URL into Cloud Backend storage.",
          input: object({ url: key(), filekey: key() }),
          approval: always(),
        },
        async (_c, { url, filekey }) => command("DownloadRemoteFile", { url, filekey }),
      ),
      copy: mutation(
        {
          description: "Copy a file inside Cloud Backend storage.",
          input: object({ filekey: key(), destkey: key() }),
          approval: always(),
        },
        async (_c, { filekey, destkey }) => command("FileCopy", { filekey, destkey }),
      ),
      rename: mutation(
        {
          description: "Rename or move a file inside Cloud Backend storage.",
          input: object({ filekey: key(), destkey: key() }),
          approval: always(),
        },
        async (_c, { filekey, destkey }) => command("FileRename", { filekey, destkey }),
      ),
      delete: mutation(
        {
          description: "Delete a file from Cloud Backend storage.",
          input: object({ filekey: key() }),
          approval: always(),
        },
        async (_c, { filekey }) => command("FileDelete", { filekey }),
      ),
      createDirectory: mutation(
        {
          description: "Create a directory in Cloud Backend storage.",
          input: object({ directory: key() }),
          approval: always(),
        },
        async (_c, { directory }) => command("DirectoryCreate", { directory }),
      ),
      renameDirectory: mutation(
        {
          description: "Rename or move a directory in Cloud Backend storage.",
          input: object({ directory: key(), destDirectory: key() }),
          approval: always(),
        },
        async (_c, { directory, destDirectory }) => command("DirectoryRename", { directory, destDirectory }),
      ),
      deleteDirectory: mutation(
        {
          description: "Delete a directory from Cloud Backend storage.",
          input: object({ directory: key() }),
          approval: always(),
        },
        async (_c, { directory }) => command("DirectoryDelete", { directory }),
      ),
    }),
    email: router({
      send: mutation(
        {
          description: "Send an email through the project's Cloud Backend email service.",
          input: object({
            from: key(),
            sender: key(),
            to: key(),
            subject: string(),
            content: string(),
            isHtml: boolean().optional(),
          }),
          approval: always(),
        },
        async (_c, { from, sender, to, subject, content, isHtml }) =>
          command("CloudAPISendEmail", { from, sender, to, subject, content, isHtml: isHtml ? "1" : "0" }),
      ),
    }),
    functions: router({
      get: query(
        {
          description:
            "Call one of the project's Cloud Backend API functions that is configured for GET. params become query-string parameters; the API key is added automatically. GET functions are user-defined and may have side effects, so this requires approval.",
          input: object({ folder: key(), function: key(), params: Args.optional() }),
          approval: always(),
        },
        async (_c, i) => fn(projectName, "GET", i.folder, i.function, i.params ?? {}),
      ),
      post: mutation(
        {
          description:
            "Call one of the project's Cloud Backend API functions configured for POST. params are sent as the JSON body; the API key is added automatically.",
          input: object({ folder: key(), function: key(), params: Args.optional() }),
          approval: always(),
        },
        async (_c, i) => fn(projectName, "POST", i.folder, i.function, i.params ?? {}),
      ),
      put: mutation(
        {
          description: "Call a project API function configured for PUT. params are sent as the JSON body.",
          input: object({ folder: key(), function: key(), params: Args.optional() }),
          approval: always(),
        },
        async (_c, i) => fn(projectName, "PUT", i.folder, i.function, i.params ?? {}),
      ),
      patch: mutation(
        {
          description: "Call a project API function configured for PATCH. params are sent as the JSON body.",
          input: object({ folder: key(), function: key(), params: Args.optional() }),
          approval: always(),
        },
        async (_c, i) => fn(projectName, "PATCH", i.folder, i.function, i.params ?? {}),
      ),
      delete: mutation(
        {
          description: "Call a project API function configured for DELETE. params are sent as the JSON body.",
          input: object({ folder: key(), function: key(), params: Args.optional() }),
          approval: always(),
        },
        async (_c, i) => fn(projectName, "DELETE", i.folder, i.function, i.params ?? {}),
      ),
    }),
  });
}

export default defineApp(
  { user: { accounts: { appdrag: appdrag.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.appdrag ?? [],
        (account) => build(client(checkAppId(account.fields.appId), checkAppId(account.fields.projectName), account.fields.token, fetch, signal)),
        { signal },
      ),
      {
        title: "AppDrag",
        description:
          "AppDrag Cloud Backend: SQL against the project's cloud database, file storage, email, and the project's own API functions. One account per AppDrag project.",
        icons,
      },
    ),
  }),
);
