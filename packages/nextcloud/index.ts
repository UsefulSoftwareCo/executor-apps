import {
  accountRouter,
  array,
  boolean,
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

// Nextcloud is self-hosted on arbitrary origins, so the server URL is part of the account. The
// provider declares no `hosts` (framework host patterns cannot cover arbitrary servers), so app
// code holds the raw app password; it is only sent to the https origin of the stored server URL.
const nextcloud = defineProvider({
  name: "Nextcloud",
  auth: {
    appPassword: secrets({
      label: "Username and app password",
      fields: object({
        server: plain(string({ minLength: 1 })),
        username: plain(string({ minLength: 1 })),
        appPassword: string({ minLength: 1 }),
      }),
    }),
  },
  async health({ account, fetch, signal }) {
    const origin = serverOrigin(account.fields.server);
    const response = await fetch(`${origin}/ocs/v2.php/cloud/user?format=json`, {
      signal,
      headers: authHeaders(account.fields.username, account.fields.appPassword),
    });
    const body = await decodeJson(response, object({ ocs: object({ data: object({ id: string() }) }) }));
    return { accountInfo: { externalId: `${origin}:${body.ocs.data.id}`, displayName: `${body.ocs.data.id} @ ${origin}` } };
  },
});

// One place that validates the stored server; every use (health and tool routing) goes through it.
function serverOrigin(raw: string): string {
  const text = raw.trim();
  let url: URL;
  try {
    url = new URL(/^https?:\/\//i.test(text) ? text : `https://${text}`);
  } catch {
    throw new Error("Enter your Nextcloud server URL, for example https://cloud.example.com.");
  }
  if (url.protocol !== "https:") throw new Error("The Nextcloud server must use https.");
  // Keep a sub-path install such as https://example.com/nextcloud.
  return `${url.origin}${url.pathname.replace(/\/+$/, "")}`;
}

function authHeaders(username: string, appPassword: string) {
  return {
    Authorization: `Basic ${btoa(`${username}:${appPassword}`)}`,
    "OCS-APIRequest": "true",
    Accept: "application/json",
  };
}

type Params = Record<string, unknown>;

const segment = (value: unknown) => encodeURIComponent(String(value));
// Encodes a file path for WebDAV, keeping the slashes.
const davPath = (value: unknown) =>
  String(value)
    .split("/")
    .filter((part) => part !== "")
    .map(encodeURIComponent)
    .join("/");

const xmlText = (xml: string, tag: string) =>
  xml.match(new RegExp(`<(?:[a-z]+:)?${tag}[^>]*>([\\s\\S]*?)</(?:[a-z]+:)?${tag}>`, "i"))?.[1];
const decodeEntities = (text: string) =>
  text.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, "&");

function build(serverUrl: string, username: string, appPassword: string, fetcher: typeof fetch, signal: AbortSignal | undefined) {
  const origin = serverOrigin(serverUrl);
  const headers = authHeaders(username, appPassword);

  // OCS call. Returns the `ocs.data` payload.
  const ocs = async (method: string, path: string, search: Params = {}, body?: Params) => {
    const url = new URL(`${origin}/ocs/v2.php${path}`);
    url.searchParams.set("format", "json");
    for (const [name, value] of Object.entries(search)) {
      if (value !== undefined && value !== null) url.searchParams.set(name, String(value));
    }
    const response = await fetcher(url.toString(), {
      method,
      signal,
      headers: { ...headers, ...(body === undefined ? {} : { "Content-Type": "application/json" }) },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    const payload = (await decodeJson(response, json())) as { ocs?: { data?: unknown } };
    return payload?.ocs ? (payload.ocs.data ?? null) : payload;
  };

  const dav = async (method: string, path: string, init: { headers?: Record<string, string>; body?: string } = {}) => {
    const response = await fetcher(`${origin}/remote.php/dav/files/${segment(username)}/${davPath(path)}`, {
      method,
      signal,
      headers: { ...headers, ...init.headers },
      ...(init.body === undefined ? {} : { body: init.body }),
    });
    if (!response.ok) throw new Error(`Nextcloud WebDAV ${method} failed with status ${response.status}.`);
    return response;
  };

  const destination = (path: unknown) => `${origin}/remote.php/dav/files/${segment(username)}/${davPath(path)}`;

  const files = router({
    list: query(
      {
        description: "List the files and folders directly inside a folder of the user's files (path \"\" is the root). Returns name, path, type, size, content type, modified time, etag and file id.",
        input: object({ path: string().optional() }),
      },
      async (_ctx, args: Params) => {
        const response = await dav("PROPFIND", String(args.path ?? ""), {
          headers: { Depth: "1", "Content-Type": "application/xml" },
          body: '<?xml version="1.0"?><d:propfind xmlns:d="DAV:" xmlns:oc="http://owncloud.org/ns"><d:prop><d:getlastmodified/><d:getcontentlength/><d:getcontenttype/><d:resourcetype/><d:getetag/><oc:fileid/><oc:size/></d:prop></d:propfind>',
        });
        const xml = await response.text();
        const entries = [...xml.matchAll(/<(?:[a-z]+:)?response>([\s\S]*?)<\/(?:[a-z]+:)?response>/gi)].map((match) => {
          const block = match[1] ?? "";
          const href = decodeEntities(xmlText(block, "href") ?? "");
          const decoded = decodeURIComponent(href);
          const index = decoded.indexOf(`/remote.php/dav/files/${username}/`);
          const full = index >= 0 ? decoded.slice(index + `/remote.php/dav/files/${username}/`.length) : decoded;
          const isFolder = /<(?:[a-z]+:)?collection\b/i.test(block);
          const trimmed = full.replace(/\/+$/, "");
          const size = xmlText(block, "size") ?? xmlText(block, "getcontentlength");
          return {
            name: trimmed.split("/").pop() ?? "",
            path: trimmed,
            type: isFolder ? "folder" : "file",
            size: size === undefined ? null : Number(size),
            contentType: xmlText(block, "getcontenttype") ?? null,
            modified: xmlText(block, "getlastmodified") ?? null,
            etag: decodeEntities(xmlText(block, "getetag") ?? "").replace(/"/g, "") || null,
            fileId: xmlText(block, "fileid") ?? null,
          };
        });
        const self = String(args.path ?? "").split("/").filter(Boolean).join("/");
        return entries.filter((entry) => entry.path !== self);
      },
    ),
    read: query(
      {
        description: "Download a file and return its content as text (UTF-8). Use for text files; binary files are not decoded. Content is truncated at maxBytes (default 200000).",
        input: object({ path: string(), maxBytes: number().optional() }),
      },
      async (_ctx, args: Params) => {
        const response = await dav("GET", String(args.path));
        const buffer = new Uint8Array(await response.arrayBuffer());
        const limit = typeof args.maxBytes === "number" ? args.maxBytes : 200000;
        const truncated = buffer.length > limit;
        return {
          path: args.path,
          size: buffer.length,
          truncated,
          content: new TextDecoder().decode(truncated ? buffer.slice(0, limit) : buffer),
        };
      },
    ),
    write: mutation(
      {
        description: "Create or overwrite a text file with the given content. The parent folder must exist.",
        input: object({ path: string(), content: string(), contentType: string().optional() }),
      },
      async (_ctx, args: Params) => {
        await dav("PUT", String(args.path), {
          headers: { "Content-Type": String(args.contentType ?? "text/plain; charset=utf-8") },
          body: String(args.content),
        });
        return { path: args.path, written: true };
      },
    ),
    createFolder: mutation(
      { description: "Create a folder. The parent folder must exist.", input: object({ path: string() }) },
      async (_ctx, args: Params) => {
        await dav("MKCOL", String(args.path));
        return { path: args.path, created: true };
      },
    ),
    move: mutation(
      {
        description: "Move or rename a file or folder to a new path. Fails if the destination exists unless overwrite is true.",
        input: object({ path: string(), destination: string(), overwrite: boolean().optional() }),
      },
      async (_ctx, args: Params) => {
        await dav("MOVE", String(args.path), {
          headers: { Destination: destination(args.destination), Overwrite: args.overwrite === true ? "T" : "F" },
        });
        return { path: args.destination, moved: true };
      },
    ),
    copy: mutation(
      {
        description: "Copy a file or folder to a new path. Fails if the destination exists unless overwrite is true.",
        input: object({ path: string(), destination: string(), overwrite: boolean().optional() }),
      },
      async (_ctx, args: Params) => {
        await dav("COPY", String(args.path), {
          headers: { Destination: destination(args.destination), Overwrite: args.overwrite === true ? "T" : "F" },
        });
        return { path: args.destination, copied: true };
      },
    ),
    delete: mutation(
      { description: "Delete a file or folder (it moves to the trash bin when the trash app is enabled).", input: object({ path: string() }) },
      async (_ctx, args: Params) => {
        await dav("DELETE", String(args.path));
        return { path: args.path, deleted: true };
      },
    ),
  });

  const users = router({
    current: query({ description: "Return the signed-in user: id, display name, email, quota, groups, language and more.", input: object({}) }, async () =>
      ocs("GET", "/cloud/user"),
    ),
    list: query(
      { description: "List user ids. Needs admin or group-admin rights.", input: object({ search: string().optional(), limit: number().optional(), offset: number().optional() }) },
      async (_ctx, args: Params) => ocs("GET", "/cloud/users", { search: args.search, limit: args.limit, offset: args.offset }),
    ),
    listDetails: query(
      { description: "List users with their full details (display name, email, quota, groups). Needs admin or group-admin rights.", input: object({ search: string().optional(), limit: number().optional(), offset: number().optional() }) },
      async (_ctx, args: Params) => ocs("GET", "/cloud/users/details", { search: args.search, limit: args.limit, offset: args.offset }),
    ),
    get: query(
      { description: "Get one user by id.", input: object({ userId: string() }) },
      async (_ctx, args: Params) => ocs("GET", `/cloud/users/${segment(args.userId)}`),
    ),
    create: mutation(
      {
        description: "Create a user. Provide a password, or an email so Nextcloud sends an invitation. Needs admin or group-admin rights.",
        input: object({
          userid: string(),
          password: string().optional(),
          displayName: string().optional(),
          email: string().optional(),
          groups: array(string()).optional(),
          subadmin: array(string()).optional(),
          quota: string().optional(),
          language: string().optional(),
        }),
      },
      async (_ctx, args: Params) => ocs("POST", "/cloud/users", {}, args),
    ),
    update: mutation(
      {
        description: "Edit one field of a user. key is one of: email, quota, displayname, phone, address, website, twitter, organisation, role, headline, biography, password, language, locale, additional_mail, notify_email.",
        input: object({ userId: string(), key: string(), value: string() }),
      },
      async (_ctx, args: Params) => ocs("PUT", `/cloud/users/${segment(args.userId)}`, {}, { key: args.key, value: args.value }),
    ),
    enable: mutation(
      { description: "Enable a disabled user.", input: object({ userId: string() }) },
      async (_ctx, args: Params) => ocs("PUT", `/cloud/users/${segment(args.userId)}/enable`, {}, {}),
    ),
    disable: mutation(
      { description: "Disable a user so they can no longer sign in.", input: object({ userId: string() }) },
      async (_ctx, args: Params) => ocs("PUT", `/cloud/users/${segment(args.userId)}/disable`, {}, {}),
    ),
    delete: mutation(
      { description: "Delete a user and their files. Cannot be undone.", input: object({ userId: string() }) },
      async (_ctx, args: Params) => ocs("DELETE", `/cloud/users/${segment(args.userId)}`),
    ),
    listGroups: query(
      { description: "List the groups a user belongs to.", input: object({ userId: string() }) },
      async (_ctx, args: Params) => ocs("GET", `/cloud/users/${segment(args.userId)}/groups`),
    ),
    addToGroup: mutation(
      { description: "Add a user to a group.", input: object({ userId: string(), groupid: string() }) },
      async (_ctx, args: Params) => ocs("POST", `/cloud/users/${segment(args.userId)}/groups`, {}, { groupid: args.groupid }),
    ),
    removeFromGroup: mutation(
      { description: "Remove a user from a group.", input: object({ userId: string(), groupid: string() }) },
      async (_ctx, args: Params) => ocs("DELETE", `/cloud/users/${segment(args.userId)}/groups`, {}, { groupid: args.groupid }),
    ),
  });

  const groups = router({
    list: query(
      { description: "List group ids.", input: object({ search: string().optional(), limit: number().optional(), offset: number().optional() }) },
      async (_ctx, args: Params) => ocs("GET", "/cloud/groups", { search: args.search, limit: args.limit, offset: args.offset }),
    ),
    listDetails: query(
      { description: "List groups with display name and member counts.", input: object({ search: string().optional(), limit: number().optional(), offset: number().optional() }) },
      async (_ctx, args: Params) => ocs("GET", "/cloud/groups/details", { search: args.search, limit: args.limit, offset: args.offset }),
    ),
    listMembers: query(
      { description: "List the user ids in a group.", input: object({ groupId: string() }) },
      async (_ctx, args: Params) => ocs("GET", `/cloud/groups/${segment(args.groupId)}`),
    ),
    create: mutation(
      { description: "Create a group. Needs admin rights.", input: object({ groupid: string(), displayname: string().optional() }) },
      async (_ctx, args: Params) => ocs("POST", "/cloud/groups", {}, args),
    ),
    delete: mutation(
      { description: "Delete a group. Needs admin rights.", input: object({ groupId: string() }) },
      async (_ctx, args: Params) => ocs("DELETE", `/cloud/groups/${segment(args.groupId)}`),
    ),
  });

  const shares = router({
    list: query(
      {
        description: "List shares created by the user, or shares of one path. Set sharedWithMe to list shares others made with the user. shareType values: 0 user, 1 group, 3 public link, 4 email, 6 federated, 10 Talk room.",
        input: object({ path: string().optional(), reshares: boolean().optional(), subfiles: boolean().optional(), sharedWithMe: boolean().optional() }),
      },
      async (_ctx, args: Params) =>
        ocs("GET", "/apps/files_sharing/api/v1/shares", {
          path: args.path,
          reshares: args.reshares,
          subfiles: args.subfiles,
          shared_with_me: args.sharedWithMe,
        }),
    ),
    get: query(
      { description: "Get one share by id.", input: object({ shareId: string() }) },
      async (_ctx, args: Params) => ocs("GET", `/apps/files_sharing/api/v1/shares/${segment(args.shareId)}`),
    ),
    listPending: query(
      { description: "List incoming shares that are waiting to be accepted.", input: object({}) },
      async () => ocs("GET", "/apps/files_sharing/api/v1/shares/pending"),
    ),
    create: mutation(
      {
        description: "Share a file or folder. shareType: 0 user, 1 group, 3 public link, 4 email, 6 federated, 10 Talk room. shareWith is the user id, group id, email or room token (omit for public links). permissions is a bit mask: 1 read, 2 update, 4 create, 8 delete, 16 share, 31 all.",
        input: object({
          path: string(),
          shareType: number(),
          shareWith: string().optional(),
          permissions: number().optional(),
          password: string().optional(),
          expireDate: string().optional(),
          label: string().optional(),
          note: string().optional(),
          publicUpload: boolean().optional(),
        }),
      },
      async (_ctx, args: Params) => ocs("POST", "/apps/files_sharing/api/v1/shares", {}, args),
    ),
    update: mutation(
      {
        description: "Change a share's permissions, password, expiry date (YYYY-MM-DD), label or note.",
        input: object({
          shareId: string(),
          permissions: number().optional(),
          password: string().optional(),
          expireDate: string().optional(),
          label: string().optional(),
          note: string().optional(),
          publicUpload: boolean().optional(),
        }),
      },
      async (_ctx, args: Params) => {
        const { shareId, ...rest } = args;
        return ocs("PUT", `/apps/files_sharing/api/v1/shares/${segment(shareId)}`, {}, rest);
      },
    ),
    delete: mutation(
      { description: "Delete a share (revokes access).", input: object({ shareId: string() }) },
      async (_ctx, args: Params) => ocs("DELETE", `/apps/files_sharing/api/v1/shares/${segment(args.shareId)}`),
    ),
    accept: mutation(
      { description: "Accept a pending incoming share.", input: object({ shareId: string() }) },
      async (_ctx, args: Params) => ocs("POST", `/apps/files_sharing/api/v1/shares/pending/${segment(args.shareId)}`, {}, {}),
    ),
    decline: mutation(
      { description: "Decline a pending incoming share.", input: object({ shareId: string() }) },
      async (_ctx, args: Params) => ocs("DELETE", `/apps/files_sharing/api/v1/shares/pending/${segment(args.shareId)}`),
    ),
    searchSharees: query(
      { description: "Search users, groups, emails and remotes that can be shared with. itemType is file or folder.", input: object({ search: string(), itemType: string().optional(), perPage: number().optional() }) },
      async (_ctx, args: Params) =>
        ocs("GET", "/apps/files_sharing/api/v1/sharees", { search: args.search, itemType: args.itemType ?? "file", perPage: args.perPage }),
    ),
  });

  const server = router({
    capabilities: query(
      { description: "Return the server version and the capabilities of every enabled app (features, limits, sharing rules).", input: object({}) },
      async () => ocs("GET", "/cloud/capabilities"),
    ),
    listApps: query(
      { description: "List app ids installed on the server. filter is enabled or disabled. Needs admin rights.", input: object({ filter: string().optional() }) },
      async (_ctx, args: Params) => ocs("GET", "/cloud/apps", { filter: args.filter }),
    ),
    getApp: query(
      { description: "Get information about one app. Needs admin rights.", input: object({ appId: string() }) },
      async (_ctx, args: Params) => ocs("GET", `/cloud/apps/${segment(args.appId)}`),
    ),
    enableApp: mutation(
      { description: "Install (when needed) and enable an app. Needs admin rights.", input: object({ appId: string() }) },
      async (_ctx, args: Params) => ocs("POST", `/cloud/apps/${segment(args.appId)}`, {}, {}),
    ),
    disableApp: mutation(
      { description: "Disable an app. Needs admin rights.", input: object({ appId: string() }) },
      async (_ctx, args: Params) => ocs("DELETE", `/cloud/apps/${segment(args.appId)}`),
    ),
  });

  const notifications = router({
    list: query(
      { description: "List the user's notifications.", input: object({}) },
      async () => ocs("GET", "/apps/notifications/api/v2/notifications"),
    ),
    get: query(
      { description: "Get one notification by id.", input: object({ notificationId: string() }) },
      async (_ctx, args: Params) => ocs("GET", `/apps/notifications/api/v2/notifications/${segment(args.notificationId)}`),
    ),
    dismiss: mutation(
      { description: "Dismiss one notification.", input: object({ notificationId: string() }) },
      async (_ctx, args: Params) => ocs("DELETE", `/apps/notifications/api/v2/notifications/${segment(args.notificationId)}`),
    ),
    dismissAll: mutation(
      { description: "Dismiss all of the user's notifications.", input: object({}) },
      async () => ocs("DELETE", "/apps/notifications/api/v2/notifications"),
    ),
  });

  const status = router({
    get: query(
      { description: "Get the user's own status (online, away, dnd, invisible, offline) and custom message.", input: object({}) },
      async () => ocs("GET", "/apps/user_status/api/v1/user_status"),
    ),
    setStatus: mutation(
      { description: "Set the user's status type: online, away, dnd or invisible.", input: object({ statusType: string() }) },
      async (_ctx, args: Params) => ocs("PUT", "/apps/user_status/api/v1/user_status/status", {}, { statusType: args.statusType }),
    ),
    setMessage: mutation(
      { description: "Set a custom status message with an optional emoji and an optional expiry (unix seconds).", input: object({ message: string(), statusIcon: string().optional(), clearAt: number().optional() }) },
      async (_ctx, args: Params) => ocs("PUT", "/apps/user_status/api/v1/user_status/message/custom", {}, args),
    ),
    clearMessage: mutation(
      { description: "Clear the user's custom status message.", input: object({}) },
      async () => ocs("DELETE", "/apps/user_status/api/v1/user_status/message"),
    ),
  });

  const activity = router({
    list: query(
      { description: "List recent activity. filter is an activity filter such as all, self, by, files or filter id; since is an activity id to page from.", input: object({ filter: string().optional(), since: number().optional(), limit: number().optional(), object_type: string().optional(), object_id: string().optional() }) },
      async (_ctx, args: Params) =>
        ocs("GET", `/apps/activity/api/v2/activity${args.filter === undefined ? "" : `/${segment(args.filter)}`}`, {
          since: args.since,
          limit: args.limit,
          object_type: args.object_type,
          object_id: args.object_id,
        }),
    ),
  });

  const talk = router({
    listRooms: query(
      { description: "List the user's Talk conversations with tokens, names, unread counts and last message.", input: object({}) },
      async () => ocs("GET", "/apps/spreed/api/v4/room"),
    ),
    getRoom: query(
      { description: "Get one Talk conversation by token.", input: object({ token: string() }) },
      async (_ctx, args: Params) => ocs("GET", `/apps/spreed/api/v4/room/${segment(args.token)}`),
    ),
    listMessages: query(
      { description: "Read messages of a Talk conversation, newest first. Use lastKnownMessageId to page back.", input: object({ token: string(), limit: number().optional(), lastKnownMessageId: number().optional() }) },
      async (_ctx, args: Params) =>
        ocs("GET", `/apps/spreed/api/v1/chat/${segment(args.token)}`, {
          lookIntoFuture: 0,
          limit: args.limit ?? 50,
          lastKnownMessageId: args.lastKnownMessageId,
        }),
    ),
    sendMessage: mutation(
      { description: "Post a message in a Talk conversation. replyTo is a message id to reply to.", input: object({ token: string(), message: string(), replyTo: number().optional() }) },
      async (_ctx, args: Params) =>
        ocs("POST", `/apps/spreed/api/v1/chat/${segment(args.token)}`, {}, { message: args.message, ...(args.replyTo === undefined ? {} : { replyTo: args.replyTo }) }),
    ),
    createRoom: mutation(
      { description: "Create a Talk conversation. roomType: 1 one-to-one, 2 group, 3 public. invite is a user id for one-to-one.", input: object({ roomType: number(), roomName: string().optional(), invite: string().optional() }) },
      async (_ctx, args: Params) => ocs("POST", "/apps/spreed/api/v4/room", {}, args),
    ),
  });

  const request = router({
    ocs: mutation(
      {
        description: "Call any other OCS endpoint under /ocs/v2.php by path (for example /apps/provisioning_api/api/v1/config/apps). May change data. Returns the ocs.data payload.",
        input: object({ method: string(), path: string(), query: record(json()).optional(), body: record(json()).optional() }),
      },
      async (_ctx, args: Params) => {
        const method = String(args.method).toUpperCase();
        const path = String(args.path);
        if (!["GET", "POST", "PUT", "DELETE"].includes(method)) throw new Error("method must be GET, POST, PUT or DELETE.");
        if (!path.startsWith("/") || path.includes("..") || path.includes("?")) throw new Error("path must start with / and carry no query string; use query.");
        return ocs(method, path, (args.query as Params | undefined) ?? {}, (args.body as Params | undefined) ?? (method === "GET" || method === "DELETE" ? undefined : {}));
      },
    ),
  });

  return router({ files, users, groups, shares, server, notifications, status, activity, talk, request });
}

export default defineApp(
  { user: { accounts: { nextcloud: nextcloud.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.nextcloud ?? [],
        (account) =>
          withApprovals(
            build(account.fields.server, account.fields.username, account.fields.appPassword, fetch, signal),
            (tool) => (tool.kind === "mutation" ? always() : undefined),
          ),
        { signal },
      ),
      {
        title: "Nextcloud",
        description:
          "Nextcloud files (WebDAV), users, groups, shares, Talk conversations, notifications, status, activity and server apps through the OCS API.",
        instructions:
          "Connect with the server URL, the user name and an app password. File paths are relative to the user's root (\"\" is the root, \"Documents/report.txt\"). Admin tools (users, groups, apps) need an admin account. Shares use numeric shareType and a permissions bit mask. request.ocs reaches any OCS endpoint not covered by a typed tool.",
        icons,
      },
    ),
  }),
);
