import {
  accountRouter,
  defineApp,
  defineProvider,
  mutation,
  number,
  object,
  plain,
  query,
  router,
  secrets,
  string,
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

// Every account lives on its own host: https://<account>.mvsite.app.
function originFor(raw: string): string {
  const match = /^(?:https?:\/\/)?([a-z0-9][a-z0-9-]{0,61}[a-z0-9]?)(?:\.mvsite\.app)?\/?$/.exec(raw.trim().toLowerCase());
  if (match === null) throw new Error("Enter the <account> of <account>.mvsite.app (letters, digits, hyphens).");
  return `https://${match[1]}.mvsite.app`;
}

const membervault = defineProvider({
  name: "MemberVault",
  hosts: ["*.mvsite.app"],
  auth: {
    // The key is under Integrations -> Other -> Webhooks API in the MemberVault admin.
    apiKey: secrets({
      label: "API key",
      fields: object({
        subdomain: plain(string({ minLength: 1 })),
        token: string({ minLength: 1 }),
      }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch(endpoint(account, "get_courses", {}), { signal });
    if (!response.ok) throw new Error(`MemberVault rejected the API key (HTTP ${response.status}).`);
  },
});

type Account = { fields: { subdomain: string; token: string } };

// The API is GET-only and takes the key as the apikey query parameter.
function endpoint(account: Account, name: string, params: Record<string, string | number>): string {
  const url = new URL(`${originFor(account.fields.subdomain)}/api/${name}`);
  url.searchParams.set("apikey", account.fields.token);
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, String(value));
  return url.toString();
}

// Some endpoints answer with plain text rather than JSON.
async function result(response: Response) {
  const text = await response.text();
  if (!response.ok) throw new Error(`MemberVault returned HTTP ${response.status}: ${text.slice(0, 500)}`);
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return { response: text };
  }
}

const membervaultTools = (account: Account, signal: AbortSignal) =>
  router({
    getCourses: query(
      {
        description: "List every course (product) in the MemberVault account with its id and name.",
        input: object({}),
      },
      async ({ fetch }) => result(await fetch(endpoint(account, "get_courses", {}), { signal })),
    ),
    addUser: mutation(
      {
        description:
          "Add a member by email and grant access to a course. Use course_id -1 to create the member without granting access to anything. Existing members are not duplicated.",
        input: object({
          email: string(),
          course_id: number(),
          first_name: string().optional(),
          last_name: string().optional(),
        }),
        approval: always(),
      },
      async ({ fetch }, input) => {
        const params: Record<string, string | number> = { email: input.email, course_id: input.course_id };
        if (input.first_name !== undefined) params.first_name = input.first_name;
        if (input.last_name !== undefined) params.last_name = input.last_name;
        return result(await fetch(endpoint(account, "add_user", params), { signal }));
      },
    ),
    removeUser: mutation(
      {
        description: "Remove a member's access to one course without deleting the member from the account.",
        input: object({ email: string(), course_id: number() }),
        approval: always(),
      },
      async ({ fetch }, input) => result(await fetch(endpoint(account, "remove_user", input), { signal })),
    ),
    deleteUser: mutation(
      {
        description:
          "Permanently delete a member from the account, including all data, progress and quiz answers. Irreversible.",
        input: object({ email: string() }),
        approval: always(),
      },
      async ({ fetch }, input) => result(await fetch(endpoint(account, "delete_user", input), { signal })),
    ),
  });

export default defineApp({ user: { accounts: { membervault: membervault.many() } }, icons }, async ({ user, signal }) => ({
  tools: router(await accountRouter(user?.accounts.membervault ?? [], (account) => membervaultTools(account, signal), { signal }), {
    title: "MemberVault",
    description: "List courses and add, remove or delete members in a MemberVault account.",
    icons,
  }),
}));
