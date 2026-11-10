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
  query,
  router,
  secrets,
  string,
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

// US accounts use lastpass.com; EU-region accounts use lastpass.eu.
const endpointFor = (region: string | undefined) =>
  `https://${region?.trim().toLowerCase() === "eu" ? "lastpass.eu" : "lastpass.com"}/enterpriseapi.php`;

const lastpass = defineProvider({
  name: "LastPass",
  hosts: ["lastpass.com", "lastpass.eu"],
  auth: {
    // The Enterprise API has no OAuth: the account number (CID) and a provisioning hash
    // generated in the Admin Console under Advanced > Enterprise API are sent in each request body.
    provisioningHash: secrets({
      label: "Account number (CID), provisioning hash and region (us or eu; leave empty for us)",
      fields: object({ cid: string({ minLength: 1 }), provhash: string({ minLength: 1 }), region: string().optional() }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch(endpointFor(account.fields.region), {
      method: "POST",
      signal,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        cid: Number(account.fields.cid),
        provhash: account.fields.provhash,
        cmd: "getuserdata",
        data: { pagesize: 1, pageindex: 0 },
      }),
    });
    await decodeJson(response, object({}));
  },
});

type Call = (cmd: string, data?: unknown) => Promise<unknown>;

function build(call: Call) {
  const username = string({ minLength: 1 });
  return router({
    users: router({
      list: query(
        {
          description:
            "List users (getuserdata). Returns Users keyed by id, Groups, total and count. Omit username to page through everyone; pageindex is zero-based.",
          input: object({
            username: string().optional(),
            pagesize: number().optional(),
            pageindex: number().optional(),
            disabled: number().optional(),
            admin: number().optional(),
          }),
        },
        async (_ctx, input) => call("getuserdata", input),
      ),
      provision: mutation(
        {
          description:
            "Create users, or update existing ones (batchadd). Each entry has username (email) and optional fullname, groups, password and password_reset_required.",
          input: object({
            users: array(
              object({
                username,
                fullname: string().optional(),
                password: string().optional(),
                password_reset_required: json().optional(),
                groups: array(string()).optional(),
              }),
            ),
          }),
        },
        async (_ctx, input) => call("batchadd", input.users),
      ),
      delete: mutation(
        {
          description:
            "Remove a user (deluser). deleteaction: 0 deactivates (default), 1 removes the user from the company but keeps the account, 2 permanently deletes the account and its vault.",
          input: object({ username, deleteaction: number().optional() }),
        },
        async (_ctx, input) => call("deluser", { username: input.username, deleteaction: input.deleteaction ?? 0 }),
      ),
      disable: mutation(
        { description: "Disable the accounts of the given email addresses (disableuser).", input: object({ usernames: array(username) }) },
        async (_ctx, input) => call("disableuser", input.usernames),
      ),
      resetPassword: mutation(
        { description: "Send a master password reset to a user (resetpassword).", input: object({ username }) },
        async (_ctx, input) => call("resetpassword", { username: input.username }),
      ),
      disableMultifactor: mutation(
        { description: "Disable multifactor authentication for a user (disablemultifactor).", input: object({ username }) },
        async (_ctx, input) => call("disablemultifactor", { username: input.username }),
      ),
      changeGroups: mutation(
        {
          description: "Add users to or remove them from groups (batchchangegrp). Each change has username and add and/or del lists of group names.",
          input: object({
            changes: array(object({ username, add: array(string()).optional(), del: array(string()).optional() })),
          }),
        },
        async (_ctx, input) => call("batchchangegrp", input.changes),
      ),
    }),
    sharedFolders: router({
      list: query(
        { description: "List all shared folders with their members and permissions (getsfdata).", input: object({}) },
        async () => call("getsfdata", "all"),
      ),
    }),
    reports: router({
      events: query(
        {
          description:
            "Activity report (reporting). from and to are 'YYYY-MM-DD HH:MM:SS' in the account's reporting time zone. user is an email or 'allusers'. Up to 10,000 events per call; pass the returned next value to continue.",
          input: object({
            from: string({ minLength: 1 }),
            to: string({ minLength: 1 }),
            user: string().optional(),
            search: string().optional(),
            next: string().optional(),
            admin: number().optional(),
          }),
        },
        async (_ctx, input) => call("reporting", input),
      ),
    }),
  });
}

export default defineApp(
  { user: { accounts: { lastpass: lastpass.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.lastpass ?? [],
        (account) => {
          const call: Call = async (cmd, data) => {
            const response = await fetch(endpointFor(account.fields.region), {
              method: "POST",
              signal,
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                cid: Number(account.fields.cid),
                provhash: account.fields.provhash,
                cmd,
                ...(data === undefined ? {} : { data }),
              }),
            });
            return decodeJson(response, json());
          };
          return withApprovals(build(call), (tool) => (tool.kind === "mutation" ? always() : undefined));
        },
        { signal },
      ),
      {
        title: "LastPass",
        description: "Administer LastPass Business or Enterprise: provision and deprovision users, manage groups, list shared folders and pull the activity report.",
        instructions:
          "This is the LastPass Enterprise (provisioning) API. It needs an admin-generated provisioning hash and never reads vault contents. Responses carry status OK or WARN; WARN means partial success, so read the errors field and re-list users to reconcile.",
        icons,
      },
    ),
  }),
);
