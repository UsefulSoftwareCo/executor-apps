import {
  accountRouter,
  boolean,
  decodeJson,
  defineApp,
  defineProvider,
  json,
  mutation,
  object,
  query,
  router,
  secrets,
  string,
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const base = "https://app.asyncinterview.ai/api";

const asyncInterview = defineProvider({
  name: "Async Interview",
  hosts: ["app.asyncinterview.ai"],
  auth: {
    apiKey: secrets({
      label: "API token",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // Listing jobs is read-only and authenticated; the response shape is not documented, so only the status is checked.
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/jobs`, {
      signal,
      headers: { Authorization: `Bearer ${account.fields.token}`, Accept: "application/json" },
    });
    await decodeJson(response, json());
  },
});

type Fetch = typeof fetch;

function client(token: string, fetcher: Fetch, signal: AbortSignal | undefined) {
  return async (method: string, path: string, body?: Record<string, unknown>, query?: Record<string, string>) => {
    const search = query ? `?${new URLSearchParams(query)}` : "";
    const response = await fetcher(`${base}${path}${search}`, {
      method,
      signal,
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
        ...(body ? { "Content-Type": "application/json" } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    // Updates and deletes may answer with an empty body.
    if (response.status === 204 || response.headers.get("content-length") === "0") return { ok: true };
    return decodeJson(response, json());
  };
}

function build(call: ReturnType<typeof client>) {
  return router({
    jobs: router(
      {
        list: query(
          { description: "List all interview jobs on the account.", input: object({}) },
          async () => call("GET", "/jobs"),
        ),
        update: mutation(
          {
            description:
              "Update an interview job. Provide jobId and any of title, subTitle, description or isPublic; omitted fields are left unchanged.",
            input: object({
              jobId: string({ minLength: 1 }),
              title: string().optional(),
              subTitle: string().optional(),
              description: string().optional(),
              isPublic: boolean().optional(),
            }),
          },
          async (_ctx, { jobId, title, subTitle, description, isPublic }) => {
            const body: Record<string, unknown> = {};
            if (title !== undefined) body.title = title;
            if (subTitle !== undefined) body.sub_title = subTitle;
            if (description !== undefined) body.description = description;
            if (isPublic !== undefined) body.is_public = isPublic;
            return call("PUT", `/jobs/${encodeURIComponent(jobId)}`, body);
          },
        ),
        delete: mutation(
          { description: "Permanently delete an interview job.", input: object({ jobId: string({ minLength: 1 }) }) },
          async (_ctx, { jobId }) => call("DELETE", `/jobs/${encodeURIComponent(jobId)}`),
        ),
      },
      { title: "Jobs", description: "Interview jobs (roles candidates record answers for)." },
    ),
    interviews: router(
      {
        list: query(
          {
            description: "List candidate interview responses with candidate details, optionally limited to one job.",
            input: object({ jobId: string().optional() }),
          },
          async (_ctx, { jobId }) => call("GET", "/interviews", undefined, jobId ? { job_id: jobId } : undefined),
        ),
      },
      { title: "Interviews", description: "Candidate responses to interview jobs." },
    ),
  });
}

export default defineApp(
  { user: { accounts: { asyncInterview: asyncInterview.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.asyncInterview ?? [],
        (account) =>
          withApprovals(build(client(account.fields.token, fetch, signal)), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Async Interview",
        description: "On-demand video interview platform: list, update and delete interview jobs and read candidate responses.",
        icons,
      },
    ),
  }),
);
