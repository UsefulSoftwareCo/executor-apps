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
  oauth2,
  object,
  query,
  router,
  secrets,
  string,
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const api = "https://api.dropboxapi.com/2";
const content = "https://content.dropboxapi.com/2";

const Account = object({ account_id: string(), email: string(), name: object({ display_name: string() }) });

const dropbox = defineProvider({
  name: "Dropbox",
  hosts: ["api.dropboxapi.com", "content.dropboxapi.com"],
  auth: {
    token: secrets({
      label: "Access token",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
    // Dropbox offers no client registration: the connect page asks for an app's key and secret.
    // token_access_type=offline makes Dropbox return a refresh token.
    oauth: oauth2({
      authorizationUrl: "https://www.dropbox.com/oauth2/authorize",
      tokenUrl: "https://api.dropboxapi.com/oauth2/token",
      tokenEndpointAuthMethod: "client_secret_post",
      scopes: [
        "account_info.read",
        "files.metadata.read",
        "files.metadata.write",
        "files.content.read",
        "files.content.write",
        "sharing.read",
        "sharing.write",
        "file_requests.read",
        "file_requests.write",
      ],
      authorizationParams: { token_access_type: "offline" },
    }),
  },
  async health({ account, fetch, signal }) {
    const token = account.method === "oauth" ? account.fields.access_token : account.fields.token;
    const response = await fetch(`${api}/users/get_current_account`, {
      method: "POST",
      signal,
      headers: { Authorization: `Bearer ${token}` },
    });
    const me = await decodeJson(response, Account);
    return { accountInfo: { externalId: me.account_id, username: me.email, displayName: me.name.display_name } };
  },
});

type Fetch = typeof fetch;

function tools(token: string, fetcher: Fetch, signal: AbortSignal | undefined) {
  const fail = async (response: Response) => {
    const text = await response.text();
    throw new Error(`Dropbox answered ${response.status}: ${text.slice(0, 1000)}`);
  };

  // RPC endpoints take a JSON body; endpoints without arguments must send no body at all.
  const rpc = async (path: string, body?: Record<string, unknown>) => {
    const response = await fetcher(`${api}${path}`, {
      method: "POST",
      signal,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(body === undefined ? {} : { "content-type": "application/json" }),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    if (!response.ok) return fail(response);
    const text = await response.text();
    return text === "" ? { ok: true } : (JSON.parse(text) as unknown);
  };

  // Content endpoints carry their arguments in the Dropbox-API-Arg header, ASCII-escaped.
  const arg = (value: unknown) =>
    JSON.stringify(value).replace(/[\u007f-￿]/g, (c) => `\\u${c.charCodeAt(0).toString(16).padStart(4, "0")}`);

  const path = string({ minLength: 1 });
  const cursor = string({ minLength: 1 });
  const ids = array(string({ minLength: 1 }));

  return router({
    account: router(
      {
        current: query(
          {
            description: "The connected Dropbox account: id, name, email, country, account type and team.",
            input: object({}),
          },
          async () => rpc("/users/get_current_account"),
        ),
        spaceUsage: query(
          { description: "Used and allocated storage for the connected account.", input: object({}) },
          async () => rpc("/users/get_space_usage"),
        ),
        get: query(
          {
            description: "Basic information about another Dropbox account by id (dbid:...).",
            input: object({ accountId: string({ minLength: 1 }) }),
          },
          async (_ctx, { accountId }) => rpc("/users/get_account", { account_id: accountId }),
        ),
      },
      { title: "Account", description: "The connected Dropbox account and its storage." },
    ),
    files: router(
      {
        listFolder: query(
          {
            description:
              'List a folder. path is "" for the root, otherwise "/Folder/Sub" (or an id:... / ns:... value). Returns entries, a cursor and has_more; continue with files.listFolderContinue.',
            input: object({
              path: string(),
              recursive: boolean().optional(),
              includeDeleted: boolean().optional(),
              includeMediaInfo: boolean().optional(),
              limit: number().optional(),
            }),
          },
          async (_ctx, i) =>
            rpc("/files/list_folder", {
              path: i.path,
              recursive: i.recursive,
              include_deleted: i.includeDeleted,
              include_media_info: i.includeMediaInfo,
              limit: i.limit,
            }),
        ),
        listFolderContinue: query(
          {
            description: "Fetch the next page of a folder listing using the cursor from listFolder.",
            input: object({ cursor }),
          },
          async (_ctx, { cursor }) => rpc("/files/list_folder/continue", { cursor }),
        ),
        listFolderLatestCursor: query(
          {
            description: "A cursor representing the folder's current state, for later change detection with listFolderContinue.",
            input: object({ path: string(), recursive: boolean().optional() }),
          },
          async (_ctx, i) => rpc("/files/list_folder/get_latest_cursor", { path: i.path, recursive: i.recursive }),
        ),
        getMetadata: query(
          {
            description: "Metadata of a file or folder by path or id.",
            input: object({ path, includeMediaInfo: boolean().optional() }),
          },
          async (_ctx, i) => rpc("/files/get_metadata", { path: i.path, include_media_info: i.includeMediaInfo }),
        ),
        search: query(
          {
            description:
              "Search file and folder names and file contents. Optionally restrict to a folder with path, or set fileExtensions (without dots) and maxResults. Returns matches, has_more and a cursor for files.searchContinue.",
            input: object({
              query: string({ minLength: 1 }),
              path: string().optional(),
              maxResults: number().optional(),
              fileExtensions: array(string()).optional(),
              filenameOnly: boolean().optional(),
            }),
          },
          async (_ctx, i) =>
            rpc("/files/search_v2", {
              query: i.query,
              options: {
                path: i.path,
                max_results: i.maxResults,
                file_extensions: i.fileExtensions,
                filename_only: i.filenameOnly,
              },
            }),
        ),
        searchContinue: query(
          { description: "Next page of search results using the cursor from files.search.", input: object({ cursor }) },
          async (_ctx, { cursor }) => rpc("/files/search/continue_v2", { cursor }),
        ),
        listRevisions: query(
          {
            description: "Revisions of a file, newest first. Use a revision id with files.restore.",
            input: object({ path, limit: number().optional() }),
          },
          async (_ctx, i) => rpc("/files/list_revisions", { path: i.path, limit: i.limit }),
        ),
        temporaryLink: query(
          {
            description:
              "A temporary (4 hour) direct download link for a file. Use it to hand the file to something that can fetch URLs.",
            input: object({ path }),
          },
          async (_ctx, { path }) => rpc("/files/get_temporary_link", { path }),
        ),
        readText: query(
          {
            description:
              "Download a file and return its content as UTF-8 text, truncated to maxBytes (default 200000). Intended for text files; use temporaryLink for binaries.",
            input: object({ path, maxBytes: number().optional() }),
          },
          async (_ctx, { path, maxBytes }) => {
            const response = await fetcher(`${content}/files/download`, {
              method: "POST",
              signal,
              headers: { Authorization: `Bearer ${token}`, "Dropbox-API-Arg": arg({ path }) },
            });
            if (!response.ok) return fail(response);
            const limit = maxBytes ?? 200000;
            const metadata: unknown = JSON.parse(response.headers.get("dropbox-api-result") ?? "null");
            const chunks: Uint8Array[] = [];
            let received = 0;
            let truncated = false;
            const reader = response.body?.getReader();
            if (reader) {
              while (received <= limit) {
                const { done, value } = await reader.read();
                if (done) break;
                chunks.push(value);
                received += value.length;
              }
              if (received > limit) {
                truncated = true;
                await reader.cancel();
              }
            }
            const bytes = new Uint8Array(received);
            let offset = 0;
            for (const chunk of chunks) {
              bytes.set(chunk, offset);
              offset += chunk.length;
            }
            const size = Number(response.headers.get("content-length") ?? NaN);
            return {
              metadata,
              truncated,
              size: Number.isFinite(size) ? size : received,
              text: new TextDecoder().decode(bytes.slice(0, limit)),
            };
          },
        ),
        getTags: query(
          { description: "User-defined tags on the given files or folders.", input: object({ paths: array(path) }) },
          async (_ctx, { paths }) => rpc("/files/tags/get", { paths }),
        ),
        createFolder: mutation(
          {
            description: "Create a folder at the given path. Set autorename to pick a new name on conflict.",
            input: object({ path, autorename: boolean().optional() }),
            approval: always(),
          },
          async (_ctx, i) => rpc("/files/create_folder_v2", { path: i.path, autorename: i.autorename }),
        ),
        uploadText: mutation(
          {
            description:
              "Upload text as a file (up to 150 MB). mode is exactly add (default, fails or renames on conflict) or overwrite; any other value is rejected. Binary uploads are not supported.",
            input: object({
              path,
              text: string(),
              mode: string().default("add"),
              autorename: boolean().optional(),
              mute: boolean().optional(),
            }),
            approval: always(),
          },
          async (_ctx, i) => {
            if (i.mode !== "add" && i.mode !== "overwrite") {
              throw new Error(`mode must be "add" or "overwrite", got "${i.mode}"`);
            }
            const response = await fetcher(`${content}/files/upload`, {
              method: "POST",
              signal,
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/octet-stream",
                "Dropbox-API-Arg": arg({ path: i.path, mode: i.mode, autorename: i.autorename, mute: i.mute }),
              },
              body: new TextEncoder().encode(i.text),
            });
            if (!response.ok) return fail(response);
            return JSON.parse(await response.text()) as unknown;
          },
        ),
        copy: mutation(
          {
            description: "Copy a file or folder to another path.",
            input: object({ fromPath: path, toPath: path, autorename: boolean().optional() }),
            approval: always(),
          },
          async (_ctx, i) =>
            rpc("/files/copy_v2", { from_path: i.fromPath, to_path: i.toPath, autorename: i.autorename }),
        ),
        move: mutation(
          {
            description: "Move or rename a file or folder.",
            input: object({ fromPath: path, toPath: path, autorename: boolean().optional() }),
            approval: always(),
          },
          async (_ctx, i) =>
            rpc("/files/move_v2", { from_path: i.fromPath, to_path: i.toPath, autorename: i.autorename }),
        ),
        delete: mutation(
          {
            description: "Delete a file or folder (recoverable for a while from the Dropbox trash).",
            input: object({ path }),
            approval: always(),
          },
          async (_ctx, { path }) => rpc("/files/delete_v2", { path }),
        ),
        permanentlyDelete: mutation(
          {
            description: "Permanently delete a file or folder. This cannot be undone.",
            input: object({ path }),
            approval: always(),
          },
          async (_ctx, { path }) => rpc("/files/permanently_delete", { path }),
        ),
        restore: mutation(
          {
            description: "Restore a file to a previous revision (rev from files.listRevisions).",
            input: object({ path, rev: string({ minLength: 1 }) }),
            approval: always(),
          },
          async (_ctx, i) => rpc("/files/restore", { path: i.path, rev: i.rev }),
        ),
        saveUrl: mutation(
          {
            description: "Save the content of a URL as a file. Returns a job id for files.saveUrlStatus, or the finished file.",
            input: object({ path, url: string({ minLength: 1 }) }),
            approval: always(),
          },
          async (_ctx, i) => rpc("/files/save_url", { path: i.path, url: i.url }),
        ),
        addTag: mutation(
          {
            description: "Add a tag to a file or folder.",
            input: object({ path, tagText: string({ minLength: 1 }) }),
            approval: always(),
          },
          async (_ctx, i) => rpc("/files/tags/add", { path: i.path, tag_text: i.tagText }),
        ),
        removeTag: mutation(
          {
            description: "Remove a tag from a file or folder.",
            input: object({ path, tagText: string({ minLength: 1 }) }),
            approval: always(),
          },
          async (_ctx, i) => rpc("/files/tags/remove", { path: i.path, tag_text: i.tagText }),
        ),
        saveUrlStatus: query(
          {
            description: "Status of a files.saveUrl job.",
            input: object({ asyncJobId: string({ minLength: 1 }) }),
          },
          async (_ctx, { asyncJobId }) => rpc("/files/save_url/check_job_status", { async_job_id: asyncJobId }),
        ),
      },
      { title: "Files", description: "Browse, search, read, upload, move, copy, delete and restore files and folders." },
    ),
    sharing: router(
      {
        listSharedLinks: query(
          {
            description: "Shared links for the account, or only those for one path. Pass cursor to continue.",
            input: object({ path: string().optional(), cursor: cursor.optional(), directOnly: boolean().optional() }),
          },
          async (_ctx, i) =>
            rpc("/sharing/list_shared_links", { path: i.path, cursor: i.cursor, direct_only: i.directOnly }),
        ),
        sharedLinkMetadata: query(
          {
            description: "Metadata of a shared link URL (and of what it points to).",
            input: object({ url: string({ minLength: 1 }), linkPassword: string().optional() }),
          },
          async (_ctx, i) => rpc("/sharing/get_shared_link_metadata", { url: i.url, link_password: i.linkPassword }),
        ),
        listFolders: query(
          {
            description: "Shared folders the account has access to. Pass cursor to continue.",
            input: object({ limit: number().optional() }),
          },
          async (_ctx, { limit }) => rpc("/sharing/list_folders", { limit }),
        ),
        folderMetadata: query(
          {
            description: "Metadata of a shared folder by shared_folder_id.",
            input: object({ sharedFolderId: string({ minLength: 1 }) }),
          },
          async (_ctx, { sharedFolderId }) => rpc("/sharing/get_folder_metadata", { shared_folder_id: sharedFolderId }),
        ),
        listFolderMembers: query(
          {
            description: "Users, groups and invitees of a shared folder.",
            input: object({ sharedFolderId: string({ minLength: 1 }), limit: number().optional() }),
          },
          async (_ctx, i) => rpc("/sharing/list_folder_members", { shared_folder_id: i.sharedFolderId, limit: i.limit }),
        ),
        listFileMembers: query(
          {
            description: "Users, groups and invitees with access to a file.",
            input: object({ file: path, limit: number().optional() }),
          },
          async (_ctx, i) => rpc("/sharing/list_file_members", { file: i.file, limit: i.limit }),
        ),
        createSharedLink: mutation(
          {
            description:
              "Create a shared link for a file or folder. settings is optional, for example { requested_visibility: 'public' | 'team_only' | 'password', link_password, expires } (some settings need a paid plan).",
            input: object({ path, settings: json().optional() }),
            approval: always(),
          },
          async (_ctx, i) => rpc("/sharing/create_shared_link_with_settings", { path: i.path, settings: i.settings }),
        ),
        revokeSharedLink: mutation(
          {
            description: "Revoke a shared link by its URL.",
            input: object({ url: string({ minLength: 1 }) }),
            approval: always(),
          },
          async (_ctx, { url }) => rpc("/sharing/revoke_shared_link", { url }),
        ),
        shareFolder: mutation(
          {
            description:
              "Share an existing folder so others can be added. Returns the shared folder or an async job id; check with sharing.shareFolderStatus.",
            input: object({ path, aclUpdatePolicy: string().optional(), memberPolicy: string().optional() }),
            approval: always(),
          },
          async (_ctx, i) =>
            rpc("/sharing/share_folder", {
              path: i.path,
              acl_update_policy: i.aclUpdatePolicy,
              member_policy: i.memberPolicy,
            }),
        ),
        shareFolderStatus: query(
          {
            description: "Status of a sharing.shareFolder job.",
            input: object({ asyncJobId: string({ minLength: 1 }) }),
          },
          async (_ctx, { asyncJobId }) => rpc("/sharing/check_share_job_status", { async_job_id: asyncJobId }),
        ),
        addFolderMember: mutation(
          {
            description:
              "Invite people to a shared folder by email. accessLevel is editor, viewer or viewer_no_comment. Sends an invitation email.",
            input: object({
              sharedFolderId: string({ minLength: 1 }),
              emails: ids,
              accessLevel: string().default("viewer"),
              customMessage: string().optional(),
              quiet: boolean().optional(),
            }),
            approval: always(),
          },
          async (_ctx, i) =>
            rpc("/sharing/add_folder_member", {
              shared_folder_id: i.sharedFolderId,
              members: i.emails.map((email) => ({
                member: { ".tag": "email", email },
                access_level: { ".tag": i.accessLevel },
              })),
              custom_message: i.customMessage,
              quiet: i.quiet,
            }),
        ),
        unshareFolder: mutation(
          {
            description: "Stop sharing a folder. leaveACopy keeps a copy in each member's Dropbox.",
            input: object({ sharedFolderId: string({ minLength: 1 }), leaveACopy: boolean().default(false) }),
            approval: always(),
          },
          async (_ctx, i) =>
            rpc("/sharing/unshare_folder", { shared_folder_id: i.sharedFolderId, leave_a_copy: i.leaveACopy }),
        ),
      },
      { title: "Sharing", description: "Shared links, shared folders and their members." },
    ),
    fileRequests: router(
      {
        list: query(
          { description: "File requests created by the account.", input: object({ limit: number().optional() }) },
          async (_ctx, { limit }) => rpc("/file_requests/list_v2", { limit }),
        ),
        get: query(
          {
            description: "A file request by id.",
            input: object({ id: string({ minLength: 1 }) }),
          },
          async (_ctx, { id }) => rpc("/file_requests/get", { id }),
        ),
        create: mutation(
          {
            description:
              "Create a file request that lets anyone upload into destination (a folder path). deadline is optional, for example { deadline: '2027-01-31T00:00:00Z' }.",
            input: object({
              title: string({ minLength: 1 }),
              destination: path,
              open: boolean().default(true),
              deadline: json().optional(),
            }),
            approval: always(),
          },
          async (_ctx, i) =>
            rpc("/file_requests/create", {
              title: i.title,
              destination: i.destination,
              open: i.open,
              deadline: i.deadline,
            }),
        ),
        delete: mutation(
          {
            description: "Delete file requests by id.",
            input: object({ ids }),
            approval: always(),
          },
          async (_ctx, { ids }) => rpc("/file_requests/delete", { ids }),
        ),
      },
      { title: "File requests", description: "Collect files from other people into a folder." },
    ),
  });
}

export default defineApp(
  { user: { accounts: { dropbox: dropbox.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.dropbox ?? [],
        (account) =>
          tools(account.method === "oauth" ? account.fields.access_token : account.fields.token, fetch, signal),
        { signal },
      ),
      {
        title: "Dropbox",
        description:
          "Dropbox files and folders, search, sharing, shared links, file requests and account info through the Dropbox API v2.",
        icons,
      },
    ),
  }),
);
