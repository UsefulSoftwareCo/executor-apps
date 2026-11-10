import {
  accountRouter,
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

const origin = "https://chorus.ai";

const chorus = defineProvider({
  name: "Chorus",
  hosts: ["chorus.ai"],
  auth: {
    apiKey: secrets({
      label: "API token",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch(`${origin}/api/v1/users/me`, {
      signal,
      headers: v1(account),
    });
    await decodeJson(response, json());
  },
});

type Account = { fields: { token: string } };

// Chorus expects the raw token in Authorization, with no "Bearer " prefix.
const v1 = (account: Account) => ({
  Authorization: account.fields.token,
  Accept: "application/vnd.api+json",
});
const v3 = (account: Account) => ({
  Authorization: account.fields.token,
  Accept: "application/json",
  "x-al-version": "2",
});

const search = (params: Record<string, string | number | boolean | undefined>) => {
  const out = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) if (value !== undefined) out.set(key, String(value));
  const text = out.toString();
  return text === "" ? "" : `?${text}`;
};

const chorusTools = (account: Account, signal: AbortSignal) =>
  router({
    me: query(
      {
        description: "Get the Chorus user that owns the API token: name, email, role, license type and team ids.",
        input: object({}),
      },
      async ({ fetch }) =>
        decodeJson(await fetch(`${origin}/api/v1/users/me`, { signal, headers: v1(account) }), json()),
    ),
    listUsers: query(
      {
        description: "List all users in the Chorus organization (v3 API). The result is under `users`.",
        input: object({}),
      },
      async ({ fetch }) => decodeJson(await fetch(`${origin}/v3/users`, { signal, headers: v3(account) }), json()),
    ),
    listTeams: query(
      {
        description: "List all teams in the Chorus organization.",
        input: object({}),
      },
      async ({ fetch }) => decodeJson(await fetch(`${origin}/api/v1/teams`, { signal, headers: v1(account) }), json()),
    ),
    getTeam: query(
      { description: "Get one team by id.", input: object({ id: string() }) },
      async ({ fetch }, { id }) =>
        decodeJson(
          await fetch(`${origin}/api/v1/teams/${encodeURIComponent(id)}`, { signal, headers: v1(account) }),
          json(),
        ),
    ),
    listEngagements: query(
      {
        description:
          "List recorded engagements (meetings and dialer calls) matching the criteria (v3 API). min_date and max_date are Unix epoch seconds. engagement_type is the engagement type, for example meeting or dialer. engagement_id, user_id, team_id are comma-separated id lists. Pass the previous response's continuation_key as continuation_key to fetch the next page. Private recordings are not returned, and the token's user permissions apply.",
        input: object({
          min_date: number().optional(),
          max_date: number().optional(),
          min_duration: number().optional(),
          max_duration: number().optional(),
          engagement_type: string().optional(),
          engagement_id: string().optional(),
          user_id: string().optional(),
          team_id: string().optional(),
          participants_email: string().optional(),
          with_trackers: boolean().optional(),
          continuation_key: string().optional(),
        }),
      },
      async ({ fetch }, input) =>
        decodeJson(await fetch(`${origin}/v3/engagements${search(input)}`, { signal, headers: v3(account) }), json()),
    ),
    getConversation: query(
      {
        description:
          "Get one conversation (recording) by id, with its summary, action items, participants, trackers and utterances (the transcript). fields is an optional comma-delimited list of fields to populate, for example name,summary,participants,recording.utterances,recording.trackers.",
        input: object({ id: string(), fields: string().optional() }),
      },
      async ({ fetch }, { id, fields }) =>
        decodeJson(
          await fetch(`${origin}/api/v1/conversations/${encodeURIComponent(id)}${search({ fields })}`, {
            signal,
            headers: v1(account),
          }),
          json(),
        ),
    ),
    getConversationMedia: query(
      {
        description:
          "Get a time-limited download link and metadata for a conversation's video or audio file, as JSON.",
        input: object({ id: string() }),
      },
      async ({ fetch }, { id }) =>
        decodeJson(
          await fetch(`${origin}/api/v1/conversations/${encodeURIComponent(id)}/media`, {
            signal,
            headers: { ...v1(account), Accept: "application/json" },
          }),
          json(),
        ),
    ),
    listEmails: query(
      {
        description:
          "List emails Chorus has captured. Dates use the form `start:end` of ISO 8601 times, with `*` for an open end (for example 2026-01-01T00:00:00Z:*). Filters: name matches subject, owner_email and participants_email match addresses (participants_email is comma-delimited), thread is an email thread id, ids is a comma-delimited list. page_size is 1-100.",
        input: object({
          sent: string().optional(),
          name: string().optional(),
          owner_email: string().optional(),
          participants_email: string().optional(),
          thread: string().optional(),
          ids: string().optional(),
          page_size: number().optional(),
        }),
      },
      async ({ fetch }, input) =>
        decodeJson(
          await fetch(
            `${origin}/api/v1/emails${search({
              "filter[email.sent]": input.sent,
              "filter[name]": input.name,
              "filter[owner.email]": input.owner_email,
              "filter[participants.email]": input.participants_email,
              "filter[thread]": input.thread,
              "filter[ids]": input.ids,
              "page[size]": input.page_size,
            })}`,
            { signal, headers: v1(account) },
          ),
          json(),
        ),
    ),
    getEmail: query(
      { description: "Get one email by id.", input: object({ id: string() }) },
      async ({ fetch }, { id }) =>
        decodeJson(
          await fetch(`${origin}/api/v1/emails/${encodeURIComponent(id)}`, { signal, headers: v1(account) }),
          json(),
        ),
    ),
    getEmailThread: query(
      { description: "Get an email thread by id, including its emails.", input: object({ id: string() }) },
      async ({ fetch }, { id }) =>
        decodeJson(
          await fetch(`${origin}/api/v1/email_threads/${encodeURIComponent(id)}`, { signal, headers: v1(account) }),
          json(),
        ),
    ),
    listScorecards: query(
      {
        description:
          "List completed coaching scorecards. submitted is a `start:end` ISO 8601 range (`*` for open end); initiative is an initiative id; recipients and reviewers are comma-delimited user ids. page_size is 1-100.",
        input: object({
          submitted: string().optional(),
          initiative: string().optional(),
          recipients: string().optional(),
          reviewers: string().optional(),
          page_number: number().optional(),
          page_size: number().optional(),
        }),
      },
      async ({ fetch }, input) =>
        decodeJson(
          await fetch(
            `${origin}/api/v1/scorecards${search({
              "filter[submitted]": input.submitted,
              "filter[initiative]": input.initiative,
              "filter[recipients]": input.recipients,
              "filter[reviewers]": input.reviewers,
              "page[number]": input.page_number,
              "page[size]": input.page_size,
            })}`,
            { signal, headers: v1(account) },
          ),
          json(),
        ),
    ),
    listMoments: query(
      {
        description:
          "List moments (shared call snippets). shared_on is a `start:end` ISO 8601 range (`*` for open end) of at most 365 days.",
        input: object({ shared_on: string().optional() }),
      },
      async ({ fetch }, { shared_on }) =>
        decodeJson(
          await fetch(`${origin}/api/v1/moments${search({ "filter[shared_on]": shared_on })}`, {
            signal,
            headers: v1(account),
          }),
          json(),
        ),
    ),
    listPlaylists: query(
      {
        description:
          "List playlists. type is a comma-delimited list of BOOKMARKS, HASHTAG_PLAYLIST, PINNED_MOMENTS, PLAYLIST, SMART_PLAYLIST. subscribed=true returns only playlists you follow; top_level=true returns only top-level ones; conversation limits to playlists containing moments from one conversation.",
        input: object({
          name: string().optional(),
          type: string().optional(),
          conversation: string().optional(),
          parent: string().optional(),
          subscribed: boolean().optional(),
          top_level: boolean().optional(),
          page_number: number().optional(),
          page_size: number().optional(),
        }),
      },
      async ({ fetch }, input) =>
        decodeJson(
          await fetch(
            `${origin}/api/v1/playlists${search({
              "filter[name]": input.name,
              "filter[type]": input.type,
              "filter[conversation]": input.conversation,
              "filter[parent]": input.parent,
              "filter[subscribed]": input.subscribed,
              top_level: input.top_level,
              "page[number]": input.page_number,
              "page[size]": input.page_size,
            })}`,
            { signal, headers: v1(account) },
          ),
          json(),
        ),
    ),
    getPlaylist: query(
      { description: "Get one playlist by id.", input: object({ id: string() }) },
      async ({ fetch }, { id }) =>
        decodeJson(
          await fetch(`${origin}/api/v1/playlists/${encodeURIComponent(id)}`, { signal, headers: v1(account) }),
          json(),
        ),
    ),
    listFilters: query(
      { description: "List the organization's saved engagement filters.", input: object({}) },
      async ({ fetch }) => decodeJson(await fetch(`${origin}/api/v1/filters`, { signal, headers: v1(account) }), json()),
    ),
    getFilter: query(
      { description: "Get one saved engagement filter by id.", input: object({ id: string() }) },
      async ({ fetch }, { id }) =>
        decodeJson(
          await fetch(`${origin}/api/v1/filters/${encodeURIComponent(id)}`, { signal, headers: v1(account) }),
          json(),
        ),
    ),
    deleteEngagement: mutation(
      {
        description: "Permanently delete one engagement (recording) by id (v3 API). Cannot be undone.",
        input: object({ engagement_id: string() }),
        approval: always(),
      },
      async ({ fetch }, { engagement_id }) => {
        const response = await fetch(`${origin}/v3/engagements/${encodeURIComponent(engagement_id)}`, {
          method: "DELETE",
          signal,
          headers: v3(account),
        });
        return { ok: response.ok, status: response.status };
      },
    ),
    deleteEngagements: mutation(
      {
        description:
          "Permanently delete several engagements (recordings) at once. engagement_ids is a comma-separated list of ids (v3 API). Cannot be undone.",
        input: object({ engagement_ids: string() }),
        approval: always(),
      },
      async ({ fetch }, { engagement_ids }) => {
        const response = await fetch(`${origin}/v3/engagements${search({ engagement_id: engagement_ids })}`, {
          method: "DELETE",
          signal,
          headers: v3(account),
        });
        return { ok: response.ok, status: response.status };
      },
    ),
    deleteConversation: mutation(
      {
        description:
          "Request asynchronous deletion of a conversation record (recording or email) by id. Returns a task whose status can be polled in Chorus. Cannot be undone.",
        input: object({ id: string() }),
        approval: always(),
      },
      async ({ fetch }, { id }) =>
        decodeJson(
          await fetch(`${origin}/api/v1/conversations/${encodeURIComponent(id)}`, {
            method: "DELETE",
            signal,
            headers: v1(account),
          }),
          json(),
        ),
    ),
    exportConversations: mutation(
      {
        description:
          "Schedule an export of recordings (media links plus metadata) between start and end, given as Unix epoch milliseconds. Chorus emails the result to the token's user when email_on_complete is true, and posts to callback_url when given.",
        input: object({
          start: number(),
          end: number(),
          email_on_complete: boolean().optional(),
          callback_url: string().optional(),
        }),
        approval: always(),
      },
      async ({ fetch }, input) =>
        decodeJson(
          await fetch(`${origin}/api/v1/conversations:export`, {
            method: "POST",
            signal,
            headers: { ...v1(account), "Content-Type": "application/json" },
            body: JSON.stringify(input),
          }),
          json(),
        ),
    ),
  });

export default defineApp({ user: { accounts: { chorus: chorus.many() } }, icons }, async ({ user, signal }) => ({
  tools: router(await accountRouter(user?.accounts.chorus ?? [], (account) => chorusTools(account, signal), { signal }), {
    title: "Chorus",
    description:
      "Read Chorus (by ZoomInfo) call and meeting recordings, transcripts, summaries, emails, scorecards, moments and playlists, and delete or export recordings.",
    icons,
  }),
}));
