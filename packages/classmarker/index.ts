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

const base = "https://api.classmarker.com";

const classmarker = defineProvider({
  name: "ClassMarker",
  hosts: ["api.classmarker.com"],
  auth: {
    apiKey: secrets({
      label: "API key and secret",
      fields: object({ apiKey: string({ minLength: 1 }), apiSecret: string({ minLength: 1 }) }),
    }),
  },
  // Listing groups, links and tests is read-only; it counts against the 30 requests per hour limit.
  async health({ account, fetch, signal }) {
    const response = await fetch(await signedUrl(account, "/v1.json"), { signal, headers: { Accept: "application/json" } });
    await checked(response);
  },
});

type Account = { fields: { apiKey: string; apiSecret: string } };
type Params = Record<string, string | number | boolean | undefined>;

const sha256Hex = async (text: string) => {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
};

// Every request carries api_key, timestamp (unix seconds) and signature = sha256(key + secret + timestamp).
const signedUrl = async (account: Account, path: string, params: Params = {}) => {
  const timestamp = Math.floor(Date.now() / 1000);
  const out = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) if (value !== undefined) out.set(key, String(value));
  out.set("api_key", account.fields.apiKey);
  out.set("signature", await sha256Hex(`${account.fields.apiKey}${account.fields.apiSecret}${timestamp}`));
  out.set("timestamp", String(timestamp));
  return `${base}${path}?${out.toString()}`;
};

// ClassMarker answers errors with HTTP 200 and {"status":"error","error":{...}}.
const checked = async (response: Response) => {
  const body = await decodeJson(response, json());
  if (typeof body === "object" && body !== null && !Array.isArray(body)) {
    const record = body as Record<string, unknown>;
    if (record.status === "error") {
      const error = record.error as Record<string, unknown> | null | undefined;
      throw new Error(`ClassMarker API error ${String(error?.error_code ?? "error")}: ${String(error?.error_message ?? "")}`);
    }
  }
  return body;
};

const verifyOnly = boolean().optional();

const classmarkerTools = (account: Account, signal: AbortSignal) => {
  const get = async (fetch: typeof globalThis.fetch, path: string, params: Params = {}) =>
    checked(await fetch(await signedUrl(account, path, params), { signal, headers: { Accept: "application/json" } }));
  const send = async (
    fetch: typeof globalThis.fetch,
    method: "POST" | "PUT" | "DELETE",
    path: string,
    body: unknown,
    params: Params = {},
  ) =>
    checked(
      await fetch(await signedUrl(account, path, params), {
        method,
        signal,
        headers: { Accept: "application/json", "Content-Type": "application/json; charset=utf-8" },
        body: JSON.stringify(body),
      }),
    );

  const recentInput = { finishedAfterTimestamp: number().optional(), limit: number().optional() };
  const recentNote =
    " finishedAfterTimestamp is a unix timestamp in seconds (default 2 weeks ago, at most 3 months back). limit is at most 200. Page by passing next_finished_after_timestamp from the previous response while more_results_exist is true.";

  return router({
    overview: query(
      {
        description:
          "List every group, link and test the API key can access, with their ids, link_url_id and access_list_id. Call this first to find the ids other tools need. Each API key is limited to 30 requests per hour.",
        input: object({}),
      },
      async ({ fetch }) => get(fetch, "/v1.json"),
    ),
    results: router(
      {
        forAllGroups: query(
          {
            description: `Recent test results across all groups.${recentNote}`,
            input: object(recentInput),
          },
          async ({ fetch }, input) => get(fetch, "/v1/groups/recent_results.json", input),
        ),
        forAllLinks: query(
          {
            description: `Recent test results across all links (public link exams).${recentNote}`,
            input: object(recentInput),
          },
          async ({ fetch }, input) => get(fetch, "/v1/links/recent_results.json", input),
        ),
        forGroupTest: query(
          {
            description: `Recent results for one test assigned to one group.${recentNote}`,
            input: object({ groupId: number(), testId: number(), ...recentInput }),
          },
          async ({ fetch }, { groupId, testId, ...input }) =>
            get(fetch, `/v1/groups/${groupId}/tests/${testId}/recent_results.json`, input),
        ),
        forLinkTest: query(
          {
            description: `Recent results for one test assigned to one link.${recentNote}`,
            input: object({ linkId: number(), testId: number(), ...recentInput }),
          },
          async ({ fetch }, { linkId, testId, ...input }) =>
            get(fetch, `/v1/links/${linkId}/tests/${testId}/recent_results.json`, input),
        ),
      },
      { title: "Results", description: "Recently finished test results by group or link." },
    ),
    accessLists: router(
      {
        addCodes: mutation(
          {
            description:
              "Add access codes to an access list (access_list_id comes from overview). At most 100 codes per request, 20,000 per list, 255 characters per code. Not rate limited.",
            input: object({ accessListId: number(), codes: array(string()) }),
            approval: always(),
          },
          async ({ fetch }, { accessListId, codes }) =>
            send(fetch, "POST", `/v1/accesslists/${accessListId}.json`, codes),
        ),
        removeCodes: mutation(
          {
            description: "Remove access codes from an access list. At most 100 codes per request. Not rate limited.",
            input: object({ accessListId: number(), codes: array(string()) }),
            approval: always(),
          },
          async ({ fetch }, { accessListId, codes }) =>
            send(fetch, "DELETE", `/v1/accesslists/${accessListId}.json`, codes),
        ),
      },
      { title: "Access lists", description: "Manage access codes for link exams." },
    ),
    categories: router(
      {
        list: query(
          { description: "List all parent categories and their sub-categories in the question bank.", input: object({}) },
          async ({ fetch }) => get(fetch, "/v1/categories.json"),
        ),
        createParent: mutation(
          {
            description: "Create a parent category. Set verifyOnly to validate the request without saving.",
            input: object({ parentCategoryName: string(), verifyOnly }),
            approval: always(),
          },
          async ({ fetch }, { parentCategoryName, verifyOnly }) =>
            send(fetch, "POST", "/v1/categories/parent_category.json", { parent_category_name: parentCategoryName }, {
              verify_only: verifyOnly,
            }),
        ),
        updateParent: mutation(
          {
            description: "Rename a parent category. Set verifyOnly to validate the request without saving.",
            input: object({ parentCategoryId: number(), parentCategoryName: string(), verifyOnly }),
            approval: always(),
          },
          async ({ fetch }, { parentCategoryId, parentCategoryName, verifyOnly }) =>
            send(
              fetch,
              "PUT",
              `/v1/categories/parent_category/${parentCategoryId}.json`,
              { parent_category_name: parentCategoryName },
              { verify_only: verifyOnly },
            ),
        ),
        create: mutation(
          {
            description: "Create a category under a parent category. Set verifyOnly to validate the request without saving.",
            input: object({ categoryName: string(), parentCategoryId: number(), verifyOnly }),
            approval: always(),
          },
          async ({ fetch }, { categoryName, parentCategoryId, verifyOnly }) =>
            send(
              fetch,
              "POST",
              "/v1/categories/category.json",
              { category_name: categoryName, parent_category_id: parentCategoryId },
              { verify_only: verifyOnly },
            ),
        ),
        update: mutation(
          {
            description:
              "Rename a category and optionally move it to another parent category. Set verifyOnly to validate the request without saving.",
            input: object({
              categoryId: number(),
              categoryName: string(),
              parentCategoryId: number().optional(),
              verifyOnly,
            }),
            approval: always(),
          },
          async ({ fetch }, { categoryId, categoryName, parentCategoryId, verifyOnly }) =>
            send(
              fetch,
              "PUT",
              `/v1/categories/category/${categoryId}.json`,
              { category_name: categoryName, parent_category_id: parentCategoryId },
              { verify_only: verifyOnly },
            ),
        ),
      },
      { title: "Categories", description: "Question bank categories and sub-categories." },
    ),
    questions: router(
      {
        list: query(
          {
            description: "List question bank questions, 200 per page. page starts at 1.",
            input: object({ page: number().optional() }),
          },
          async ({ fetch }, input) => get(fetch, "/v1/questions.json", input),
        ),
        get: query(
          { description: "Get one question from the question bank.", input: object({ questionId: number() }) },
          async ({ fetch }, { questionId }) => get(fetch, `/v1/questions/${questionId}.json`),
        ),
        create: mutation(
          {
            description:
              "Create a question. question is the ClassMarker question object: question (text), question_type (multiplechoice, multipleresponse, truefalse or essay), category_id, points, optional correct_feedback and incorrect_feedback. Multiple choice and true/false take options (letters A-J mapping to {content}) and correct_options; multiple response also takes grade_style (partial_with_deduction, partial_without_deduction or off); multiple choice and multiple response take random_answers. Do not send question_id, last_updated_timestamp or status. Set verifyOnly to validate without saving.",
            input: object({ question: json(), verifyOnly }),
            approval: always(),
          },
          async ({ fetch }, { question, verifyOnly }) =>
            send(fetch, "POST", "/v1/questions.json", question, { verify_only: verifyOnly }),
        ),
        update: mutation(
          {
            description:
              "Update a question. question is the same object as for create. Only multiple choice, multiple response, true/false and essay questions can be written; other types are read-only. Set verifyOnly to validate without saving.",
            input: object({ questionId: number(), question: json(), verifyOnly }),
            approval: always(),
          },
          async ({ fetch }, { questionId, question, verifyOnly }) =>
            send(fetch, "PUT", `/v1/questions/${questionId}.json`, question, { verify_only: verifyOnly }),
        ),
      },
      { title: "Questions", description: "Read and write question bank questions." },
    ),
  });
};

export default defineApp({ user: { accounts: { classmarker: classmarker.many() } }, icons }, async ({ user, signal }) => ({
  tools: router(await accountRouter(user?.accounts.classmarker ?? [], (account) => classmarkerTools(account, signal), { signal }), {
    title: "ClassMarker",
    description: "Online quizzes and exams: groups, links and tests, recent results, access codes, categories and the question bank.",
    icons,
  }),
}));
