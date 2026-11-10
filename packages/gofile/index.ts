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
  query,
  router,
  secrets,
  string,
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const api = "https://api.gofile.io";
const upload = "https://upload.gofile.io";

const gofile = defineProvider({
  name: "Gofile",
  hosts: ["api.gofile.io", "upload.gofile.io"],
  auth: {
    apiKey: secrets({
      label: "API token",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch(`${api}/accounts/getid`, {
      signal,
      headers: { Authorization: `Bearer ${account.fields.token}`, Accept: "application/json" },
    });
    await decodeJson(response, object({ status: string(), data: object({ id: string() }) }));
  },
});

type Account = { fields: { token: string } };

const auth = (account: Account) => ({ Authorization: `Bearer ${account.fields.token}`, Accept: "application/json" });
const jsonHeaders = (account: Account) => ({ ...auth(account), "content-type": "application/json" });

const search = (params: Record<string, string | number | undefined>) => {
  const out = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) if (value !== undefined) out.set(key, String(value));
  return out.toString();
};

const premium = " Requires a Premium Gofile account.";

const gofileTools = (account: Account, signal: AbortSignal) =>
  router({
    getAccountId: query(
      {
        description: "Resolve the account behind the token: its id, email and tier (guest, standard or premium).",
        input: object({}),
      },
      async ({ fetch }) => decodeJson(await fetch(`${api}/accounts/getid`, { signal, headers: auth(account) }), json()),
    ),
    getAccount: query(
      {
        description:
          "Full account details: tier, root folder id, creation time and storage, file and folder counts. accountId comes from getAccountId and must be the token's own account. The response includes the account token; do not repeat it to the user.",
        input: object({ accountId: string() }),
      },
      async ({ fetch }, { accountId }) =>
        decodeJson(
          await fetch(`${api}/accounts/${encodeURIComponent(accountId)}`, { signal, headers: auth(account) }),
          json(),
        ),
    ),
    resetToken: mutation(
      {
        description:
          "Invalidate the account token and generate a new one; a sign-in link with the new token is emailed to the account. The current token stops working immediately, so every app using it must be updated. Do not use on a guest account.",
        input: object({ accountId: string() }),
        approval: always(),
      },
      async ({ fetch }, { accountId }) =>
        decodeJson(
          await fetch(`${api}/accounts/${encodeURIComponent(accountId)}/resettoken`, {
            method: "POST",
            signal,
            headers: auth(account),
          }),
          json(),
        ),
    ),
    getContent: query(
      {
        description:
          "Read a folder (metadata plus paginated children) or a single file's metadata. contentId is a UUID or share code. password is the SHA-256 hash of the folder password. sortField is createTime (default), name, size, downloads or mimetype; sortDirection is 1 ascending or -1 descending; maxdepth is 1-16. Pagination info is returned in metadata." +
          premium,
        input: object({
          contentId: string(),
          password: string().optional(),
          page: number().optional(),
          pageSize: number().optional(),
          sortField: string().optional(),
          sortDirection: number().optional(),
          contentFilter: string().optional(),
          maxdepth: number().optional(),
        }),
      },
      async ({ fetch }, { contentId, ...rest }) =>
        decodeJson(
          await fetch(`${api}/contents/${encodeURIComponent(contentId)}?${search(rest)}`, {
            signal,
            headers: auth(account),
          }),
          json(),
        ),
    ),
    searchContents: query(
      {
        description:
          "Search a folder recursively by name or tags (case-insensitive substring). contentId is the folder UUID or share code. createTimeFrom and createTimeTo are Unix timestamps. Returns an object keyed by content UUID." +
          premium,
        input: object({
          contentId: string(),
          searchedString: string(),
          password: string().optional(),
          createTimeFrom: number().optional(),
          createTimeTo: number().optional(),
        }),
      },
      async ({ fetch }, input) =>
        decodeJson(await fetch(`${api}/contents/search?${search(input)}`, { signal, headers: auth(account) }), json()),
    ),
    uploadFile: mutation(
      {
        description:
          "Upload one file. Provide the file as text in content, or as base64 in contentBase64. folderId is the destination folder UUID; omit it to create a new public folder at the account root. Returns the file id, name, size, md5, downloadPage and parent folder.",
        input: object({
          fileName: string({ minLength: 1 }),
          content: string().optional(),
          contentBase64: string().optional(),
          mimeType: string().optional(),
          folderId: string().optional(),
        }),
        approval: always(),
      },
      async ({ fetch }, { fileName, content, contentBase64, mimeType, folderId }) => {
        if ((content === undefined) === (contentBase64 === undefined)) {
          throw new Error("Provide exactly one of content or contentBase64.");
        }
        const bytes =
          contentBase64 !== undefined
            ? Uint8Array.from(atob(contentBase64), (c) => c.charCodeAt(0))
            : new TextEncoder().encode(content);
        const form = new FormData();
        if (folderId !== undefined) form.set("folderId", folderId);
        form.set("file", new Blob([bytes], { type: mimeType ?? "application/octet-stream" }), fileName);
        return decodeJson(
          await fetch(`${upload}/uploadfile`, { method: "POST", signal, headers: auth(account), body: form }),
          json(),
        );
      },
    ),
    createFolder: mutation(
      {
        description:
          "Create a folder inside a parent folder. parentFolderId is the parent UUID (the account's rootFolder for a top-level folder). The folder inherits public, password and expiry from its parent unless public is set. Returns its id and 8-character share code.",
        input: object({
          parentFolderId: string(),
          folderName: string().optional(),
          public: boolean().optional(),
        }),
        approval: always(),
      },
      async ({ fetch }, input) =>
        decodeJson(
          await fetch(`${api}/contents/createFolder`, {
            method: "POST",
            signal,
            headers: jsonHeaders(account),
            body: JSON.stringify(input),
          }),
          json(),
        ),
    ),
    updateContent: mutation(
      {
        description:
          "Update one attribute of a file or folder (UUID only). attribute is one of: name (files and folders), description (folders, markdown, max 2000 chars), tags (comma-separated), public (folders, true or false), password (folders, 4-100 chars, empty removes), expiry (folders, Unix timestamp, empty removes; on guest or standard accounts expiry permanently deletes the folder), modTime (Unix timestamp). attributeValue is sent as given; booleans and numbers as strings. deleteAfterExpiry is only for Premium owners combined with expiry.",
        input: object({
          contentId: string(),
          attribute: string(),
          attributeValue: string(),
          deleteAfterExpiry: boolean().optional(),
        }),
        approval: always(),
      },
      async ({ fetch }, { contentId, attribute, attributeValue, deleteAfterExpiry }) => {
        const value: string | boolean | number =
          attribute === "public" ? attributeValue === "true" : attribute === "expiry" || attribute === "modTime"
            ? attributeValue === "" ? attributeValue : Number(attributeValue)
            : attributeValue;
        return decodeJson(
          await fetch(`${api}/contents/${encodeURIComponent(contentId)}/update`, {
            method: "PUT",
            signal,
            headers: jsonHeaders(account),
            body: JSON.stringify({
              attribute,
              attributeValue: value,
              ...(deleteAfterExpiry === undefined ? {} : { deleteAfterExpiry }),
            }),
          }),
          json(),
        );
      },
    ),
    deleteContents: mutation(
      {
        description:
          "Delete files and/or folders by UUID. Deleting a folder removes everything inside it recursively; with the recycle bin enabled deletions may be recoverable, otherwise they are permanent.",
        input: object({ contentsId: array(string()) }),
        approval: always(),
      },
      async ({ fetch }, { contentsId }) =>
        decodeJson(
          await fetch(`${api}/contents`, {
            method: "DELETE",
            signal,
            headers: jsonHeaders(account),
            body: JSON.stringify({ contentsId: contentsId.join(",") }),
          }),
          json(),
        ),
    ),
    copyContents: mutation(
      {
        description:
          "Copy files and/or folders (UUIDs) into a destination folder of your account; copies get new UUIDs. password is the SHA-256 hash for password-protected sources." +
          premium,
        input: object({ contentsId: array(string()), folderId: string(), password: string().optional() }),
        approval: always(),
      },
      async ({ fetch }, { contentsId, ...rest }) =>
        decodeJson(
          await fetch(`${api}/contents/copy`, {
            method: "POST",
            signal,
            headers: jsonHeaders(account),
            body: JSON.stringify({ contentsId: contentsId.join(","), ...rest }),
          }),
          json(),
        ),
    ),
    moveContents: mutation(
      {
        description:
          "Move files and/or folders (UUIDs) into another folder of your account. Attributes and permissions are preserved." +
          premium,
        input: object({ contentsId: array(string()), folderId: string() }),
        approval: always(),
      },
      async ({ fetch }, { contentsId, folderId }) =>
        decodeJson(
          await fetch(`${api}/contents/move`, {
            method: "PUT",
            signal,
            headers: jsonHeaders(account),
            body: JSON.stringify({ contentsId: contentsId.join(","), folderId }),
          }),
          json(),
        ),
    ),
    importContents: mutation(
      {
        description:
          "Save content shared with you into your own root folder. The UUIDs come from the shared folder's listing. password is the SHA-256 hash for protected sources." +
          premium,
        input: object({ contentsId: array(string()), password: string().optional() }),
        approval: always(),
      },
      async ({ fetch }, { contentsId, ...rest }) =>
        decodeJson(
          await fetch(`${api}/contents/import`, {
            method: "POST",
            signal,
            headers: jsonHeaders(account),
            body: JSON.stringify({ contentsId: contentsId.join(","), ...rest }),
          }),
          json(),
        ),
    ),
    createDirectLink: mutation(
      {
        description:
          "Create a direct download link for a file or folder (UUID). Optional restrictions: expireTime (Unix timestamp), sourceIpsAllowed (IPv4 list), domainsAllowed and domainsBlocked (referring domains), auth (user:password pairs for HTTP basic auth)." +
          premium,
        input: object({
          contentId: string(),
          expireTime: number().optional(),
          sourceIpsAllowed: array(string()).optional(),
          domainsAllowed: array(string()).optional(),
          domainsBlocked: array(string()).optional(),
          auth: array(string()).optional(),
        }),
        approval: always(),
      },
      async ({ fetch }, { contentId, ...rest }) =>
        decodeJson(
          await fetch(`${api}/contents/${encodeURIComponent(contentId)}/directlinks`, {
            method: "POST",
            signal,
            headers: jsonHeaders(account),
            body: JSON.stringify(rest),
          }),
          json(),
        ),
    ),
    updateDirectLink: mutation(
      {
        description:
          "Replace the restrictions of an existing direct link. expireTime 4102444800 means never. Lists replace the existing ones." +
          premium,
        input: object({
          contentId: string(),
          directLinkId: string(),
          expireTime: number().optional(),
          sourceIpsAllowed: array(string()).optional(),
          domainsAllowed: array(string()).optional(),
          domainsBlocked: array(string()).optional(),
          auth: array(string()).optional(),
        }),
        approval: always(),
      },
      async ({ fetch }, { contentId, directLinkId, ...rest }) =>
        decodeJson(
          await fetch(
            `${api}/contents/${encodeURIComponent(contentId)}/directlinks/${encodeURIComponent(directLinkId)}`,
            { method: "PUT", signal, headers: jsonHeaders(account), body: JSON.stringify(rest) },
          ),
          json(),
        ),
    ),
    deleteDirectLink: mutation(
      {
        description: "Permanently remove one direct link; the content and its other links are unaffected." + premium,
        input: object({ contentId: string(), directLinkId: string() }),
        approval: always(),
      },
      async ({ fetch }, { contentId, directLinkId }) =>
        decodeJson(
          await fetch(
            `${api}/contents/${encodeURIComponent(contentId)}/directlinks/${encodeURIComponent(directLinkId)}`,
            { method: "DELETE", signal, headers: auth(account) },
          ),
          json(),
        ),
    ),
  });

export default defineApp({ user: { accounts: { gofile: gofile.many() } }, icons }, async ({ user, signal }) => ({
  tools: router(await accountRouter(user?.accounts.gofile ?? [], (account) => gofileTools(account, signal), { signal }), {
    title: "Gofile",
    description: "Upload, organize and share files and folders on Gofile, manage direct links and read account details.",
    icons,
  }),
}));
