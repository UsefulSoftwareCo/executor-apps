import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  json,
  mutation,
  number,
  object,
  query,
  record,
  router,
  secrets,
  string,
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const base = "https://api.wanikani.com/v2";

const wanikani = defineProvider({
  name: "WaniKani",
  hosts: ["api.wanikani.com"],
  auth: {
    apiKey: secrets({
      label: "API token",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/user`, { signal, headers: headers(account.fields.token) });
    const { data } = await decodeJson(response, object({ data: object({ username: string() }) }));
    return { accountInfo: { externalId: data.username, displayName: data.username } };
  },
});

function headers(token: string, body = false): Record<string, string> {
  return {
    Authorization: `Bearer ${token}`,
    "Wanikani-Revision": "20170710",
    ...(body ? { "Content-Type": "application/json; charset=utf-8" } : {}),
  };
}

type Params = Record<string, unknown>;
type Call = (method: string, path: string, search: Params, body: unknown) => Promise<unknown>;

const filters = record(json()).optional();
const listNote =
  " Filters go in query (arrays as lists, e.g. {\"levels\": [1, 2]}); page with page_after_id or page_before_id taken from pages.next_url.";

function list(description: string, path: string, call: Call) {
  return query(
    { description: description + listNote, input: object({ query: filters }) },
    async (_ctx, args) => call("GET", path, (args.query as Params | undefined) ?? {}, undefined),
  );
}

function get(description: string, path: string, call: Call) {
  return query({ description, input: object({ id: number() }) }, async (_ctx, args) =>
    call("GET", `${path}/${args.id}`, {}, undefined),
  );
}

function build(token: string, fetcher: typeof fetch, signal: AbortSignal | undefined) {
  const call: Call = async (method, path, search, body) => {
    const url = new URL(`${base}${path}`);
    for (const [key, value] of Object.entries(search)) {
      if (value === undefined || value === null) continue;
      const text = Array.isArray(value)
        ? value.map((v) => (typeof v === "object" && v !== null ? JSON.stringify(v) : String(v))).join(",")
        : typeof value === "object"
          ? JSON.stringify(value)
          : String(value);
      url.searchParams.set(key, text);
    }
    const response = await fetcher(url.toString(), {
      method,
      signal,
      headers: headers(token, body !== undefined),
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    return decodeJson(response, json());
  };
  const body = record(json());
  return router({
    user: router({
      get: query({ description: "Get the user's profile, level, subscription and preferences.", input: object({}) }, async () =>
        call("GET", "/user", {}, undefined),
      ),
      updatePreferences: mutation(
        {
          description:
            "Update user preferences. Pass preferences such as lessons_batch_size, lessons_autoplay_audio, reviews_autoplay_audio, extra_study_autoplay_audio, reviews_display_srs_indicator, reviews_presentation_order (shuffled or lower_levels_first). lessons_batch_size has no documented range; the deprecated default_voice_actor_id and lessons_presentation_order cannot be set.",
          input: object({ preferences: body }),
        },
        async (_ctx, args) => call("PUT", "/user", {}, { user: { preferences: args.preferences } }),
      ),
    }),
    summary: query(
      { description: "Get the summary of available lessons and reviews, now and for each of the next 24 hours.", input: object({}) },
      async () => call("GET", "/summary", {}, undefined),
    ),
    subjects: router({
      list: list("List radicals, kanji and vocabulary. Filters: ids, types, slugs, levels, hidden, updated_after.", "/subjects", call),
      get: get("Get one subject by id.", "/subjects", call),
    }),
    assignments: router({
      list: list(
        "List assignments. Filters: ids, subject_ids, subject_types, levels, srs_stages, available_after, available_before, burned, hidden, started, unlocked, immediately_available_for_lessons, immediately_available_for_review, in_review, updated_after.",
        "/assignments",
        call,
      ),
      get: get("Get one assignment by id.", "/assignments", call),
      start: mutation(
        {
          description: "Start an assignment (begin its lessons). started_at is optional and defaults to now.",
          input: object({ id: number(), started_at: string().optional() }),
        },
        async (_ctx, args) =>
          call("PUT", `/assignments/${args.id}/start`, {}, {
            assignment: args.started_at === undefined ? {} : { started_at: args.started_at },
          }),
      ),
    }),
    reviews: router({
      create: mutation(
        {
          description:
            "Submit a review. Exactly one of assignment_id or subject_id is required (neither or both is rejected), plus the numbers of incorrect meaning and reading answers (0 when correct). Returns the updated assignment and review statistic.",
          input: object({
            assignment_id: number().optional(),
            subject_id: number().optional(),
            incorrect_meaning_answers: number(),
            incorrect_reading_answers: number(),
            created_at: string().optional(),
          }),
        },
        async (_ctx, args) => {
          if ((args.assignment_id === undefined) === (args.subject_id === undefined)) {
            throw new Error("reviews.create requires exactly one of assignment_id or subject_id");
          }
          return call("POST", "/reviews", {}, { review: args });
        },
      ),
    }),
    reviewStatistics: router({
      list: list(
        "List review statistics. Filters: ids, subject_ids, subject_types, hidden, percentages_greater_than, percentages_less_than, updated_after.",
        "/review_statistics",
        call,
      ),
      get: get("Get one review statistic by id.", "/review_statistics", call),
    }),
    studyMaterials: router({
      list: list(
        "List study materials (notes and synonyms). Filters: ids, subject_ids, subject_types, hidden, updated_after.",
        "/study_materials",
        call,
      ),
      get: get("Get one study material by id.", "/study_materials", call),
      create: mutation(
        {
          description: "Create study material for a subject (one per subject). Optional meaning_note, reading_note and meaning_synonyms (array of strings).",
          input: object({ subject_id: number(), material: body.optional() }),
        },
        async (_ctx, args) =>
          call("POST", "/study_materials", {}, { study_material: { subject_id: args.subject_id, ...(args.material ?? {}) } }),
      ),
      update: mutation(
        {
          description: "Update study material by id. Pass any of meaning_note, reading_note, meaning_synonyms in material.",
          input: object({ id: number(), material: body }),
        },
        async (_ctx, args) => call("PUT", `/study_materials/${args.id}`, {}, { study_material: args.material }),
      ),
    }),
    levelProgressions: router({
      list: list("List level progressions. Filters: ids, updated_after.", "/level_progressions", call),
      get: get("Get one level progression by id.", "/level_progressions", call),
    }),
    resets: router({
      list: list("List account resets. Filters: ids, updated_after.", "/resets", call),
      get: get("Get one reset by id.", "/resets", call),
    }),
    spacedRepetitionSystems: router({
      list: list("List spaced repetition systems. Filters: ids, updated_after.", "/spaced_repetition_systems", call),
      get: get("Get one spaced repetition system by id.", "/spaced_repetition_systems", call),
    }),
    voiceActors: router({
      list: list("List voice actors. Filters: ids, updated_after.", "/voice_actors", call),
      get: get("Get one voice actor by id.", "/voice_actors", call),
    }),
  });
}

export default defineApp(
  { user: { accounts: { wanikani: wanikani.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.wanikani ?? [],
        (account) =>
          withApprovals(build(account.fields.token, fetch, signal), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "WaniKani",
        description: "WaniKani Japanese study: subjects, assignments, reviews, statistics, study materials, level progressions and preferences.",
        instructions: "Collections return {data, pages, total_count}; follow pages.next_url by passing its page_after_id in query. Rate limit is 60 requests per minute. reviews.create changes SRS progress.",
        icons,
      },
    ),
  }),
);
