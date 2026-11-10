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
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const base = "https://api.eventee.com/public/v1";

const eventee = defineProvider({
  name: "Eventee",
  hosts: ["api.eventee.com"],
  auth: {
    apiKey: secrets({
      label: "API token (one event)",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // The token is scoped to one event; /content is the cheapest authenticated read.
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/content`, {
      signal,
      headers: { Authorization: `Bearer ${account.fields.token}`, Accept: "application/json" },
    });
    await decodeJson(response, object({}));
  },
});

type Fetch = typeof fetch;
type Call = (method: string, path: string, body?: unknown) => Promise<unknown>;

function client(token: string, fetcher: Fetch, signal: AbortSignal | undefined): Call {
  return async (method, path, body) => {
    const response = await fetcher(`${base}${path}`, {
      method,
      signal,
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
        ...(body === undefined ? {} : { "Content-Type": "application/json" }),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    if (response.status === 204) return { ok: true };
    const text = await response.text();
    if (!response.ok) throw new Error(`Eventee ${method} ${path} failed (${response.status}): ${text.slice(0, 500)}`);
    if (text === "") return { ok: true };
    return decodeJson(new Response(text, { status: 200 }), json());
  };
}

const Id = object({ id: number() });

const HallBody = { name: string({ minLength: 1 }) };
const LectureBody = {
  name: string({ minLength: 1 }),
  description: string().optional(),
  start: string({ minLength: 1 }),
  end: string({ minLength: 1 }),
  hall_id: number().optional(),
  speakers: array(number()).optional(),
  tracks: array(number()).optional(),
  discussion: boolean().optional(),
  moderating: boolean().optional(),
  polling: boolean().optional(),
  capacity: number().optional(),
  type: number().optional(),
  stream: string().optional(),
  virtual_meeting: string().optional(),
};
const PauseBody = {
  name: string({ minLength: 1 }),
  description: string().optional(),
  start: string({ minLength: 1 }),
  end: string({ minLength: 1 }),
};
const SpeakerBody = {
  name: string({ minLength: 1 }),
  email: string().optional(),
  photo: string().optional(),
  phone: string().optional(),
  bio: string().optional(),
  web: string().optional(),
  facebook: string().optional(),
  twitter: string().optional(),
  linkedIn: string().optional(),
  position: string().optional(),
  company: string().optional(),
  country: string().optional(),
  language: string().optional(),
};
const PartnerBody = {
  company: string({ minLength: 1 }),
  description: string().optional(),
  photo_url: string().optional(),
  logo_url: string().optional(),
  web: string().optional(),
  email: string().optional(),
  phone: string().optional(),
  address: string().optional(),
  booth_number: string().optional(),
};
const TrackBody = { name: string({ minLength: 1 }), color: string().optional() };
const Person = {
  email: string({ minLength: 3 }),
  first_name: string().optional(),
  last_name: string().optional(),
  photo: string().optional(),
  phone: string().optional(),
  bio: string().optional(),
  web: string().optional(),
  facebook_link: string().optional(),
  twitter_link: string().optional(),
  linked_in_link: string().optional(),
  position: string().optional(),
  company: string().optional(),
  send_email: boolean().optional(),
  group_id: number().optional(),
};
const Email = object({ email: string({ minLength: 3 }) });

function build(call: Call) {
  const write = <S extends Record<string, any>>(
    description: string,
    method: string,
    path: string,
    fields: S,
  ) =>
    mutation({ description, input: object({ ...fields }) }, async (_ctx, input: any) => call(method, path, input));
  // PATCH: every field except id is optional so callers can change one field.
  // Partial-body acceptance is unverified against the vendor docs (unreachable).
  const update = <S extends Record<string, any>>(description: string, path: string, fields: S) =>
    mutation(
      {
        description,
        input: object({
          id: number(),
          ...Object.fromEntries(Object.entries(fields).map(([k, v]) => [k, v.optional()])),
        }),
      },
      async (_ctx, { id, ...body }: any) => call("PATCH", `${path}/${id}`, body),
    );
  const remove = (description: string, path: string) =>
    mutation({ description, input: Id }, async (_ctx, { id }) => call("DELETE", `${path}/${id}`));

  return router({
    content: query(
      {
        description:
          "Get all content of the event the token belongs to: halls, lectures, speakers, partners, pauses, tracks and settings.",
        input: object({}),
      },
      async () => call("GET", "/content"),
    ),
    reviews: query(
      { description: "Get all attendee reviews (ratings and comments) for the event.", input: object({}) },
      async () => call("GET", "/reviews"),
    ),
    groups: query(
      { description: "List attendee groups of the event; use a group id as group_id when inviting.", input: object({}) },
      async () => call("GET", "/groups"),
    ),
    clearTestContent: mutation(
      {
        description:
          "Delete all test content of the event (the vendor's reset call for test data). Destructive: use only on test events.",
        input: object({}),
      },
      async () => call("DELETE", "/test/content"),
    ),
    halls: router(
      {
        create: write("Create a hall (room or stage).", "POST", "/hall", HallBody),
        update: update("Rename a hall by id.", "/hall", HallBody),
        delete: remove("Delete a hall by id.", "/hall"),
      },
      { title: "Halls", description: "Rooms and stages where lectures take place." },
    ),
    lectures: router(
      {
        create: write(
          "Create a lecture. start and end are 'YYYY-MM-DD HH:mm:ss'; speakers and tracks are arrays of ids; type is the lecture type number.",
          "POST",
          "/lecture",
          LectureBody,
        ),
        update: update("Update a lecture by id. Send only the lecture fields to change.", "/lecture", LectureBody),
        delete: remove("Delete a lecture by id.", "/lecture"),
      },
      { title: "Lectures", description: "Sessions in the event schedule." },
    ),
    pauses: router(
      {
        create: write("Create a pause (break) in the schedule. start and end are 'YYYY-MM-DD HH:mm:ss'.", "POST", "/pause", PauseBody),
        update: update("Update a pause by id.", "/pause", PauseBody),
        delete: remove("Delete a pause by id.", "/pause"),
      },
      { title: "Pauses", description: "Breaks in the event schedule." },
    ),
    speakers: router(
      {
        create: write("Create a speaker.", "POST", "/speaker", SpeakerBody),
        update: update("Update a speaker by id.", "/speaker", SpeakerBody),
        delete: remove("Delete a speaker by id.", "/speaker"),
      },
      { title: "Speakers", description: "People presenting at the event." },
    ),
    partners: router(
      {
        list: query({ description: "List all partners (sponsors and exhibitors).", input: object({}) }, async () =>
          call("GET", "/partners"),
        ),
        create: write("Create a partner.", "POST", "/partner", PartnerBody),
        update: update("Update a partner by id.", "/partner", PartnerBody),
        delete: remove("Delete a partner by id.", "/partner"),
        updateSections: mutation(
          {
            description:
              "Replace the content sections of a partner. sections is an array of objects with id, type, title, html, urls [{text,url}], images, files and social links (facebook, twitter, linkedIn, youtube, instagram, general).",
            input: object({ id: number(), sections: array(json()) }),
          },
          async (_ctx, { id, sections }) => call("PATCH", `/partner/${id}/sections`, sections),
        ),
      },
      { title: "Partners", description: "Sponsors and exhibitors with their profile sections." },
    ),
    tracks: router(
      {
        create: write("Create a track (label) used to categorise lectures.", "POST", "/label", TrackBody),
        update: update("Update a track by id.", "/label", TrackBody),
        delete: remove("Delete a track by id.", "/label"),
      },
      { title: "Tracks", description: "Labels that categorise lectures." },
    ),
    attendees: router(
      {
        list: query(
          { description: "List all participants (registered attendees) of the event.", input: object({}) },
          async () => call("GET", "/participants"),
        ),
        invite: mutation(
          {
            description:
              "Invite attendees, creating them when new. Each user needs an email; optional profile fields, send_email, group_id and tickets [{number,title,type}].",
            input: object({ users: array(object({ ...Person, tickets: array(json()).optional() })) }),
          },
          async (_ctx, { users }) => call("PUT", "/attendee/invite", { users }),
        ),
        setCheckin: mutation(
          { description: "Set the check-in state of an attendee by id.", input: object({ id: number(), checkin: boolean() }) },
          async (_ctx, { id, checkin }) => call("PUT", `/attendee/${id}/checkin`, { checkin }),
        ),
        remove: mutation(
          { description: "Remove an attendee from the event by email.", input: Email },
          async (_ctx, { email }) => call("DELETE", "/attendee", { email }),
        ),
      },
      { title: "Attendees", description: "People attending the event." },
    ),
    registrations: router(
      {
        list: query({ description: "List all registrations for the event.", input: object({}) }, async () =>
          call("GET", "/registrations"),
        ),
        invite: mutation(
          {
            description: "Invite registrations. Each needs an email; optional profile fields, send_email and group_id.",
            input: object({ registrations: array(object({ ...Person })) }),
          },
          async (_ctx, { registrations }) => call("PUT", "/registration/invite", { registrations }),
        ),
        remove: mutation(
          { description: "Remove a registration by email.", input: Email },
          async (_ctx, { email }) => call("DELETE", "/registration", { email }),
        ),
      },
      { title: "Registrations", description: "People registered but not yet attendees." },
    ),
  });
}

export default defineApp(
  { user: { accounts: { eventee: eventee.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.eventee ?? [],
        (account) =>
          withApprovals(build(client(account.fields.token, fetch, signal)), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Eventee",
        description:
          "Manage an Eventee event: schedule (halls, lectures, pauses, tracks), speakers, partners, attendees, registrations and reviews.",
        icons,
      },
    ),
  }),
);
