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

const base = "https://amara.org/api";

const amara = defineProvider({
  name: "Amara",
  hosts: ["amara.org"],
  auth: {
    apiKey: secrets({
      label: "API key (from your Amara account page)",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // Amara has no current-user endpoint; listing one team is a cheap authenticated read.
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/teams/?limit=1`, {
      signal,
      headers: { "X-api-key": account.fields.token, Accept: "application/json" },
    });
    await decodeJson(response, object({}));
  },
});

type Fetch = typeof fetch;
type Params = Record<string, unknown>;
// Amara 404s on %24, so keep "$" literal (users are addressed as id$<userid>).
const seg = (value: string) => encodeURIComponent(value).replace(/%24/gi, "$");

/** resource_uri values are absolute or relative; only amara.org is accepted so the API key never leaves it. */
function apiPath(resourceUri: string): string {
  const url = new URL(resourceUri, "https://amara.org/");
  if (url.origin !== "https://amara.org") throw new Error(`resourceUri must point at https://amara.org, got ${url.origin}`);
  return `${url.pathname.replace(/^\/api(?=\/)/, "")}${url.search}`;
}

function client(token: string, fetcher: Fetch, signal: AbortSignal | undefined) {
  const call = async (method: string, path: string, params: Params = {}, body?: unknown) => {
    const url = new URL(`${base}${path}`);
    if (method === "GET") {
      for (const [key, value] of Object.entries(params)) {
        if (value === undefined || value === null) continue;
        url.searchParams.set(key, String(value));
      }
    }
    const response = await fetcher(url.toString(), {
      method,
      signal,
      headers: {
        "X-api-key": token,
        Accept: "application/json",
        ...(body === undefined ? {} : { "Content-Type": "application/json" }),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    // DELETE and some action calls answer with an empty body.
    if (response.status === 204) return { ok: true };
    const text = await response.text();
    if (!response.ok) throw new Error(`Amara returned ${response.status}: ${text.slice(0, 500)}`);
    if (text.trim() === "") return { ok: true };
    return decodeJson(new Response(text, { status: 200 }), json());
  };
  return {
    get: (path: string, params?: Params) => call("GET", path, params),
    post: (path: string, body: Params) => call("POST", path, {}, body),
    put: (path: string, body: unknown) => call("PUT", path, {}, body),
    del: (path: string) => call("DELETE", path),
  };
}

type Client = ReturnType<typeof client>;

/** Drop undefined entries and the path-only fields from a body. */
const body = (input: Params, omit: string[] = []) =>
  Object.fromEntries(Object.entries(input).filter(([key, value]) => value !== undefined && !omit.includes(key)));

const page = { limit: number().optional(), offset: number().optional() };

function tools(c: Client) {
  const video = (id: string) => `/videos/${seg(id)}`;
  const lang = (id: string, code: string) => `${video(id)}/languages/${seg(code)}`;
  const subs = (id: string, code: string) => `${lang(id, code)}/subtitles`;
  const team = (slug: string) => `/teams/${seg(slug)}`;

  return router({
    videos: router({
      list: query(
        {
          description:
            "List videos. Filter by video_url, or by team (required for project and primaryAudioLanguageCode). orderBy is title, -title, created or -created.",
          input: object({
            videoUrl: string().optional(),
            team: string().optional(),
            project: string().optional(),
            primaryAudioLanguageCode: string().optional(),
            orderBy: string().optional(),
            ...page,
          }),
        },
        async (_ctx, i) =>
          c.get("/videos/", {
            video_url: i.videoUrl,
            team: i.team,
            project: i.project,
            primary_audio_language_code: i.primaryAudioLanguageCode,
            order_by: i.orderBy,
            limit: i.limit,
            offset: i.offset,
          }),
      ),
      get: query(
        { description: "Get a video by its Amara video id.", input: object({ videoId: string({ minLength: 1 }) }) },
        async (_ctx, { videoId }) => c.get(`${video(videoId)}/`),
      ),
      create: mutation(
        {
          description:
            "Add a video to Amara by URL. Optionally set title, description, duration (seconds), primary audio language, thumbnail, metadata, and the team and project to place it in.",
          input: object({
            videoUrl: string({ minLength: 1 }),
            title: string().optional(),
            description: string().optional(),
            duration: number().optional(),
            primaryAudioLanguageCode: string().optional(),
            thumbnail: string().optional(),
            metadata: json().optional(),
            team: string().optional(),
            project: string().optional(),
          }),
          approval: always(),
        },
        async (_ctx, i) =>
          c.post(
            "/videos/",
            body({
              video_url: i.videoUrl,
              title: i.title,
              description: i.description,
              duration: i.duration,
              primary_audio_language_code: i.primaryAudioLanguageCode,
              thumbnail: i.thumbnail,
              metadata: i.metadata,
              team: i.team,
              project: i.project,
            }),
          ),
      ),
      delete: mutation(
        {
          description: "Delete a video. You must be an admin of the video's team.",
          input: object({ videoId: string({ minLength: 1 }) }),
          approval: always(),
        },
        async (_ctx, { videoId }) => c.del(`${video(videoId)}/`),
      ),
      listUrls: query(
        { description: "List the URLs attached to a video.", input: object({ videoId: string({ minLength: 1 }), ...page }) },
        async (_ctx, { videoId, limit, offset }) => c.get(`${video(videoId)}/urls/`, { limit, offset }),
      ),
      setPrimaryUrl: mutation(
        {
          description: "Make a video URL the primary one. resourceUri is the URL's resource_uri from videos.listUrls, absolute (https://amara.org/api/videos/<id>/urls/<url-id>/) or relative (/api/...) values are both accepted.",
          input: object({ resourceUri: string({ minLength: 1 }) }),
          approval: always(),
        },
        async (_ctx, { resourceUri }) => c.put(apiPath(resourceUri), { primary: true }),
      ),
      deleteUrl: mutation(
        {
          description: "Remove a URL from a video. resourceUri is the URL's resource_uri from videos.listUrls; the absolute or relative value is accepted.",
          input: object({ resourceUri: string({ minLength: 1 }) }),
          approval: always(),
        },
        async (_ctx, { resourceUri }) => c.del(apiPath(resourceUri)),
      ),
      activity: query(
        {
          description:
            "Activity on a video. before and after are ISO-8601 timestamps; type filters by activity type.",
          input: object({
            videoId: string({ minLength: 1 }),
            type: string().optional(),
            user: string().optional(),
            language: string().optional(),
            before: string().optional(),
            after: string().optional(),
            ...page,
          }),
        },
        async (_ctx, i) => c.get(`${video(i.videoId)}/activity/`, body(i, ["videoId"])),
      ),
    }),
    languages: router({
      listSupported: query(
        { description: "All languages Amara supports, as an object with a `languages` field keyed by language code, with the language name as value.", input: object({}) },
        async () => c.get("/languages/"),
      ),
      list: query(
        { description: "List the subtitle languages of a video.", input: object({ videoId: string({ minLength: 1 }), ...page }) },
        async (_ctx, { videoId, limit, offset }) => c.get(`${video(videoId)}/languages/`, { limit, offset }),
      ),
      get: query(
        {
          description: "Get one subtitle language of a video.",
          input: object({ videoId: string({ minLength: 1 }), languageCode: string({ minLength: 1 }) }),
        },
        async (_ctx, { videoId, languageCode }) => c.get(`${lang(videoId, languageCode)}/`),
      ),
      create: mutation(
        {
          description: "Add a subtitle language to a video.",
          input: object({
            videoId: string({ minLength: 1 }),
            languageCode: string({ minLength: 1 }),
            isPrimaryAudioLanguage: boolean().optional(),
            subtitlesComplete: boolean().optional(),
            softLimitLines: number().optional(),
            softLimitMinDuration: number().optional(),
            softLimitMaxDuration: number().optional(),
            softLimitCpl: number().optional(),
            softLimitCps: number().optional(),
          }),
          approval: always(),
        },
        async (_ctx, i) =>
          c.post(`${video(i.videoId)}/languages/`, {
            language_code: i.languageCode,
            ...body({
              is_primary_audio_language: i.isPrimaryAudioLanguage,
              subtitles_complete: i.subtitlesComplete,
              soft_limit_lines: i.softLimitLines,
              soft_limit_min_duration: i.softLimitMinDuration,
              soft_limit_max_duration: i.softLimitMaxDuration,
              soft_limit_cpl: i.softLimitCpl,
              soft_limit_cps: i.softLimitCps,
            }),
          }),
      ),
      update: mutation(
        {
          description: "Update a video's subtitle language settings.",
          input: object({
            videoId: string({ minLength: 1 }),
            languageCode: string({ minLength: 1 }),
            isPrimaryAudioLanguage: boolean().optional(),
            subtitlesComplete: boolean().optional(),
            softLimitLines: number().optional(),
            softLimitMinDuration: number().optional(),
            softLimitMaxDuration: number().optional(),
            softLimitCpl: number().optional(),
            softLimitCps: number().optional(),
          }),
          approval: always(),
        },
        async (_ctx, i) =>
          c.put(
            lang(i.videoId, i.languageCode),
            body({
              is_primary_audio_language: i.isPrimaryAudioLanguage,
              subtitles_complete: i.subtitlesComplete,
              soft_limit_lines: i.softLimitLines,
              soft_limit_min_duration: i.softLimitMinDuration,
              soft_limit_max_duration: i.softLimitMaxDuration,
              soft_limit_cpl: i.softLimitCpl,
              soft_limit_cps: i.softLimitCps,
            }),
          ),
      ),
    }),
    subtitles: router({
      get: query(
        {
          description:
            "Fetch subtitles for a video language. subFormat is json (default), dfxp, srt, vtt, sbv, ssa. versionNumber may be a number or 'last'.",
          input: object({
            videoId: string({ minLength: 1 }),
            languageCode: string({ minLength: 1 }),
            subFormat: string().optional(),
            versionNumber: string().optional(),
          }),
        },
        async (_ctx, i) =>
          c.get(`${subs(i.videoId, i.languageCode)}/`, { sub_format: i.subFormat, version_number: i.versionNumber }),
      ),
      upload: mutation(
        {
          description:
            "Upload a new subtitle version. Provide subtitles (the content) or subtitlesUrl. subFormat defaults to dfxp. action is e.g. save-draft or publish.",
          input: object({
            videoId: string({ minLength: 1 }),
            languageCode: string({ minLength: 1 }),
            subtitles: string().optional(),
            subtitlesUrl: string().optional(),
            subFormat: string().optional(),
            title: string().optional(),
            description: string().optional(),
            action: string().optional(),
          }),
          approval: always(),
        },
        async (_ctx, i) =>
          c.post(
            `${subs(i.videoId, i.languageCode)}/`,
            body({
              subtitles: i.subtitles,
              subtitles_url: i.subtitlesUrl,
              sub_format: i.subFormat,
              title: i.title,
              description: i.description,
              action: i.action,
            }),
          ),
      ),
      delete: mutation(
        {
          description: "Delete all subtitle versions of a video language. The video must belong to a team where you are an admin.",
          input: object({ videoId: string({ minLength: 1 }), languageCode: string({ minLength: 1 }) }),
          approval: always(),
        },
        async (_ctx, { videoId, languageCode }) => c.del(`${subs(videoId, languageCode)}/`),
      ),
      listActions: query(
        {
          description: "List the workflow actions available for a video language's subtitles.",
          input: object({ videoId: string({ minLength: 1 }), languageCode: string({ minLength: 1 }) }),
        },
        async (_ctx, { videoId, languageCode }) => c.get(`${subs(videoId, languageCode)}/actions/`),
      ),
      performAction: mutation(
        {
          description: "Perform a workflow action (e.g. save-draft, publish) on a video language's subtitles.",
          input: object({ videoId: string({ minLength: 1 }), languageCode: string({ minLength: 1 }), action: string({ minLength: 1 }) }),
          approval: always(),
        },
        async (_ctx, { videoId, languageCode, action }) => c.post(`${subs(videoId, languageCode)}/actions/`, { action }),
      ),
      listNotes: query(
        {
          description: "List the notes on a video language's subtitles.",
          input: object({ videoId: string({ minLength: 1 }), languageCode: string({ minLength: 1 }), ...page }),
        },
        async (_ctx, { videoId, languageCode, limit, offset }) => c.get(`${subs(videoId, languageCode)}/notes/`, { limit, offset }),
      ),
      addNote: mutation(
        {
          description: "Add a note to a video language's subtitles.",
          input: object({ videoId: string({ minLength: 1 }), languageCode: string({ minLength: 1 }), body: string({ minLength: 1 }) }),
          approval: always(),
        },
        async (_ctx, i) => c.post(`${subs(i.videoId, i.languageCode)}/notes/`, { body: i.body }),
      ),
    }),
    users: router({
      get: query(
        {
          description: "Get a user by username or id$<userid> (the id form is more reliable).",
          input: object({ user: string({ minLength: 1 }) }),
        },
        async (_ctx, { user }) => c.get(`/users/${seg(user)}/`),
      ),
      create: mutation(
        {
          description: "Create a user. Needs a partner account.",
          input: object({
            username: string({ minLength: 1 }),
            email: string({ minLength: 1 }),
            password: string({ minLength: 1 }),
            firstName: string().optional(),
            lastName: string().optional(),
            allow3rdPartyLogin: boolean().optional(),
            createLoginToken: boolean().optional(),
            findUniqueUsername: boolean().optional(),
          }),
          approval: always(),
        },
        async (_ctx, i) =>
          c.post("/users/", {
            username: i.username,
            email: i.email,
            password: i.password,
            ...body({
              first_name: i.firstName,
              last_name: i.lastName,
              allow_3rd_party_login: i.allow3rdPartyLogin,
              create_login_token: i.createLoginToken,
              find_unique_username: i.findUniqueUsername,
            }),
          }),
      ),
      update: mutation(
        {
          description: "Update a user's username, email or name.",
          input: object({
            user: string({ minLength: 1 }),
            username: string().optional(),
            email: string().optional(),
            firstName: string().optional(),
            lastName: string().optional(),
          }),
          approval: always(),
        },
        async (_ctx, i) =>
          c.put(`/users/${seg(i.user)}/`, body({ username: i.username, email: i.email, first_name: i.firstName, last_name: i.lastName })),
      ),
      activity: query(
        {
          description: "Activity of a user. before and after are ISO-8601 timestamps.",
          input: object({
            user: string({ minLength: 1 }),
            type: string().optional(),
            video: string().optional(),
            videoLanguage: string().optional(),
            language: string().optional(),
            team: string().optional(),
            before: string().optional(),
            after: string().optional(),
            ...page,
          }),
        },
        async (_ctx, i) =>
          c.get(`/users/${seg(i.user)}/activity/`, {
            type: i.type,
            video: i.video,
            video_language: i.videoLanguage,
            language: i.language,
            team: i.team,
            before: i.before,
            after: i.after,
            limit: i.limit,
            offset: i.offset,
          }),
      ),
    }),
    messages: router({
      send: mutation(
        {
          description: "Send an Amara message to a user or to a team (set exactly one of user and team).",
          input: object({
            user: string().optional(),
            team: string().optional(),
            subject: string({ minLength: 1 }),
            content: string({ minLength: 1 }),
          }),
          approval: always(),
        },
        async (_ctx, i) => c.post("/message/", body(i)),
      ),
    }),
    teams: router({
      list: query({ description: "List the teams you can see.", input: object({ ...page }) }, async (_ctx, i) => c.get("/teams/", i)),
      get: query(
        { description: "Get a team by slug.", input: object({ team: string({ minLength: 1 }) }) },
        async (_ctx, { team: slug }) => c.get(`${team(slug)}/`),
      ),
      create: mutation(
        {
          description: "Create a team. Partner accounts only. type is default, simple or collaboration. membershipPolicy is one of Open, Application, 'Invitation by any team member', 'Invitation by manager', 'Invitation by admin'. videoPolicy is one of 'Any team member', 'Managers and admins', 'Admins only'. teamVisibility/videoVisibility are private, unlisted or public (per the Amara API reference).",
          input: object({
            name: string({ minLength: 1 }),
            slug: string({ minLength: 1 }),
            type: string({ minLength: 1 }),
            description: string().optional(),
            teamVisibility: string().optional(),
            videoVisibility: string().optional(),
            isVisible: boolean().optional(),
            membershipPolicy: string().optional(),
            videoPolicy: string().optional(),
          }),
          approval: always(),
        },
        async (_ctx, i) =>
          c.post("/teams/", {
            name: i.name,
            slug: i.slug,
            type: i.type,
            ...body({
              description: i.description,
              team_visibility: i.teamVisibility,
              video_visibility: i.videoVisibility,
              is_visible: i.isVisible,
              membership_policy: i.membershipPolicy,
              video_policy: i.videoPolicy,
            }),
          }),
      ),
      activity: query(
        {
          description: "Activity of a team. before and after are ISO-8601 timestamps.",
          input: object({
            team: string({ minLength: 1 }),
            type: string().optional(),
            user: string().optional(),
            video: string().optional(),
            videoLanguage: string().optional(),
            language: string().optional(),
            before: string().optional(),
            after: string().optional(),
            ...page,
          }),
        },
        async (_ctx, i) =>
          c.get(`${team(i.team)}/activity/`, {
            type: i.type,
            user: i.user,
            video: i.video,
            video_language: i.videoLanguage,
            language: i.language,
            before: i.before,
            after: i.after,
            limit: i.limit,
            offset: i.offset,
          }),
      ),
      listMembers: query(
        { description: "List the members of a team.", input: object({ team: string({ minLength: 1 }), ...page }) },
        async (_ctx, { team: slug, limit, offset }) => c.get(`${team(slug)}/members/`, { limit, offset }),
      ),
      getMember: query(
        {
          description: "Get one team member by username or id$<userid>.",
          input: object({ team: string({ minLength: 1 }), user: string({ minLength: 1 }) }),
        },
        async (_ctx, { team: slug, user }) => c.get(`${team(slug)}/members/${seg(user)}/`),
      ),
      addMember: mutation(
        {
          description:
            "Add a user to a team. role is owner, admin, manager, proj_lang_manager, contributor or limited_contributor. Requires an API-created user or a partner account.",
          input: object({
            team: string({ minLength: 1 }),
            user: string({ minLength: 1 }),
            role: string({ minLength: 1 }),
            languagesManaged: array(string()).optional(),
            projectsManaged: array(string()).optional(),
          }),
          approval: always(),
        },
        async (_ctx, i) =>
          c.post(`${team(i.team)}/members/`, {
            user: i.user,
            role: i.role,
            ...body({ languages_managed: i.languagesManaged, projects_managed: i.projectsManaged }),
          }),
      ),
      updateMember: mutation(
        {
          description: "Change a team member's role or managed languages and projects.",
          input: object({
            team: string({ minLength: 1 }),
            user: string({ minLength: 1 }),
            role: string().optional(),
            languagesManaged: array(string()).optional(),
            projectsManaged: array(string()).optional(),
          }),
          approval: always(),
        },
        async (_ctx, i) =>
          c.put(
            `${team(i.team)}/members/${seg(i.user)}/`,
            body({ role: i.role, languages_managed: i.languagesManaged, projects_managed: i.projectsManaged }),
          ),
      ),
      removeMember: mutation(
        {
          description: "Remove a member from a team.",
          input: object({ team: string({ minLength: 1 }), user: string({ minLength: 1 }) }),
          approval: always(),
        },
        async (_ctx, { team: slug, user }) => c.del(`${team(slug)}/members/${seg(user)}/`),
      ),
      listProjects: query(
        { description: "List a team's projects.", input: object({ team: string({ minLength: 1 }) }) },
        async (_ctx, { team: slug }) => c.get(`${team(slug)}/projects/`),
      ),
      getProject: query(
        { description: "Get a team project by slug.", input: object({ team: string({ minLength: 1 }), project: string({ minLength: 1 }) }) },
        async (_ctx, { team: slug, project }) => c.get(`${team(slug)}/projects/${seg(project)}/`),
      ),
      createProject: mutation(
        {
          description: "Create a project in a team.",
          input: object({
            team: string({ minLength: 1 }),
            name: string({ minLength: 1 }),
            slug: string({ minLength: 1 }),
            description: string().optional(),
            guidelines: string().optional(),
          }),
          approval: always(),
        },
        async (_ctx, i) => c.post(`${team(i.team)}/projects/`, body(i, ["team"])),
      ),
      updateProject: mutation(
        {
          description: "Update a team project's name, description or guidelines.",
          input: object({
            team: string({ minLength: 1 }),
            project: string({ minLength: 1 }),
            name: string().optional(),
            description: string().optional(),
            guidelines: string().optional(),
          }),
          approval: always(),
        },
        async (_ctx, i) => c.put(`${team(i.team)}/projects/${seg(i.project)}/`, body(i, ["team", "project"])),
      ),
      deleteProject: mutation(
        {
          description: "Delete a team project.",
          input: object({ team: string({ minLength: 1 }), project: string({ minLength: 1 }) }),
          approval: always(),
        },
        async (_ctx, { team: slug, project }) => c.del(`${team(slug)}/projects/${seg(project)}/`),
      ),
      listApplications: query(
        {
          description: "List a team's membership applications. status filters them; before and after are ISO-8601 timestamps.",
          input: object({
            team: string({ minLength: 1 }),
            status: string().optional(),
            user: string().optional(),
            before: string().optional(),
            after: string().optional(),
            ...page,
          }),
        },
        async (_ctx, i) => c.get(`${team(i.team)}/applications/`, body(i, ["team"])),
      ),
      reviewApplication: mutation(
        {
          description: "Approve or deny a membership application. resourceUri is the application's resource_uri from teams.listApplications (absolute or relative value accepted); status is Approved or Denied.",
          input: object({ resourceUri: string({ minLength: 1 }), status: string({ minLength: 1 }) }),
          approval: always(),
        },
        async (_ctx, { resourceUri, status }) => c.put(apiPath(resourceUri), { status }),
      ),
      setPreferredLanguages: mutation(
        {
          description: "Replace a team's preferred language codes.",
          input: object({ team: string({ minLength: 1 }), languages: array(string()) }),
          approval: always(),
        },
        async (_ctx, { team: slug, languages }) => c.put(`${team(slug)}/languages/preferred/`, languages),
      ),
      setBlacklistedLanguages: mutation(
        {
          description: "Replace a team's blacklisted language codes.",
          input: object({ team: string({ minLength: 1 }), languages: array(string()) }),
          approval: always(),
        },
        async (_ctx, { team: slug, languages }) => c.put(`${team(slug)}/languages/blacklisted/`, languages),
      ),
      listNotifications: query(
        { description: "List a team's notifications.", input: object({ team: string({ minLength: 1 }), ...page }) },
        async (_ctx, { team: slug, limit, offset }) => c.get(`${team(slug)}/notifications/`, { limit, offset }),
      ),
      getNotification: query(
        { description: "Get one team notification by number.", input: object({ team: string({ minLength: 1 }), number: string({ minLength: 1 }) }) },
        async (_ctx, { team: slug, number: n }) => c.get(`${team(slug)}/notifications/${seg(n)}/`),
      ),
    }),
    subtitleRequests: router({
      list: query(
        {
          description:
            "List a team's subtitle requests, newest first. type is local, outgoing, incoming or evaluations; sort is creation, due or completion (prefix - to reverse).",
          input: object({
            team: string({ minLength: 1 }),
            workStatus: string().optional(),
            video: string().optional(),
            videoTitle: string().optional(),
            videoLanguage: string().optional(),
            language: string().optional(),
            project: string().optional(),
            assignee: string().optional(),
            sort: string().optional(),
            type: string().optional(),
            status: string().optional(),
            evaluationStatus: string().optional(),
            ...page,
          }),
        },
        async (_ctx, i) =>
          c.get(`${team(i.team)}/subtitle-requests/`, {
            work_status: i.workStatus,
            video: i.video,
            video_title: i.videoTitle,
            video_language: i.videoLanguage,
            language: i.language,
            project: i.project,
            assignee: i.assignee,
            sort: i.sort,
            type: i.type,
            status: i.status,
            evaluation_status: i.evaluationStatus,
            limit: i.limit,
            offset: i.offset,
          }),
      ),
      get: query(
        { description: "Get one subtitle request.", input: object({ team: string({ minLength: 1 }), jobId: string({ minLength: 1 }) }) },
        async (_ctx, { team: slug, jobId }) => c.get(`${team(slug)}/subtitle-requests/${seg(jobId)}/`),
      ),
      create: mutation(
        {
          description:
            "Request subtitles for a video in a team (team admins only). language is a BCP-47 code; dates are ISO-8601. team (work team) and evaluationTeams apply to multi-team setups.",
          input: object({
            team: string({ minLength: 1 }),
            video: string({ minLength: 1 }),
            language: string({ minLength: 1 }),
            dueDate: string().optional(),
            subtitlesDueDate: string().optional(),
            reviewDueDate: string().optional(),
            approvalDueDate: string().optional(),
            workTeam: string().optional(),
            evaluationTeams: array(string()).optional(),
          }),
          approval: always(),
        },
        async (_ctx, i) =>
          c.post(`${team(i.team)}/subtitle-requests/`, {
            video: i.video,
            language: i.language,
            ...body({
              due_date: i.dueDate,
              subtitles_due_date: i.subtitlesDueDate,
              review_due_date: i.reviewDueDate,
              approval_due_date: i.approvalDueDate,
              team: i.workTeam,
              evaluation_teams: i.evaluationTeams,
            }),
          }),
      ),
      update: mutation(
        {
          description:
            "Update a subtitle request. Assign subtitler, reviewer or approver (username), clear assignments with unassign (any of subtitler, reviewer, approver), set workStage (subtitles, review, approval, complete) or due dates.",
          input: object({
            team: string({ minLength: 1 }),
            jobId: string({ minLength: 1 }),
            dueDate: string().optional(),
            subtitler: string().optional(),
            reviewer: string().optional(),
            approver: string().optional(),
            unassign: array(string()).optional(),
            workStage: string().optional(),
            workTeam: string().optional(),
            evaluationTeams: array(string()).optional(),
            evaluator: string().optional(),
            evaluationDueDate: string().optional(),
            subtitlesDueDate: string().optional(),
            reviewDueDate: string().optional(),
            approvalDueDate: string().optional(),
          }),
          approval: always(),
        },
        async (_ctx, i) =>
          c.put(
            `${team(i.team)}/subtitle-requests/${seg(i.jobId)}/`,
            body({
              due_date: i.dueDate,
              subtitler: i.unassign?.includes("subtitler") ? null : i.subtitler,
              reviewer: i.unassign?.includes("reviewer") ? null : i.reviewer,
              approver: i.unassign?.includes("approver") ? null : i.approver,
              work_stage: i.workStage,
              team: i.workTeam,
              evaluation_teams: i.evaluationTeams,
              evaluator: i.evaluator,
              evaluation_due_date: i.evaluationDueDate,
              subtitles_due_date: i.subtitlesDueDate,
              review_due_date: i.reviewDueDate,
              approval_due_date: i.approvalDueDate,
            }),
          ),
      ),
      delete: mutation(
        {
          description: "Delete a subtitle request.",
          input: object({ team: string({ minLength: 1 }), jobId: string({ minLength: 1 }) }),
          approval: always(),
        },
        async (_ctx, { team: slug, jobId }) => c.del(`${team(slug)}/subtitle-requests/${seg(jobId)}/`),
      ),
    }),
  });
}

const description =
  "Amara subtitles and captions: videos, subtitle languages and versions, teams, members, projects, subtitle requests, activity and messages.";

export default defineApp(
  { user: { accounts: { amara: amara.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(user?.accounts.amara ?? [], (account) => tools(client(account.fields.token, fetch, signal)), { signal }),
      { title: "Amara", description, icons },
    ),
  }),
);
