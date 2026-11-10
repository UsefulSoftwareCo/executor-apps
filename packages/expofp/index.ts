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
  record,
  router,
  secrets,
  string,
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const base = "https://app.expofp.com/api/v1";

const expofp = defineProvider({
  name: "ExpoFP",
  hosts: ["app.expofp.com"],
  auth: {
    apiKey: secrets({
      label: "API token",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // Every ExpoFP method is a POST that carries the token in the JSON body.
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/list-events`, {
      method: "POST",
      signal,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: account.fields.token }),
    });
    await decodeJson(response, array(object({ id: number() })));
  },
});

type Fetch = typeof fetch;

function client(token: string, fetcher: Fetch, signal: AbortSignal | undefined) {
  const post = async (path: string, body: Record<string, unknown> = {}) => {
    const response = await fetcher(`${base}${path}`, {
      method: "POST",
      signal,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...body, token }),
    });
    if (response.status === 204) return { ok: true };
    if (response.ok && (response.headers.get("content-length") === "0" || !(response.headers.get("content-type") ?? "").includes("json"))) {
      await response.text();
      return { ok: true };
    }
    return decodeJson(response, json());
  };
  // Image endpoints take multipart form data; this wrapper supports the URL form (Img[file] uploads are not exposed).
  const postImageUrl = async (path: string, exhibitorId: number, imgUrl: string) => {
    const form = new FormData();
    form.set("exhibitorid", String(exhibitorId));
    form.set("token", token);
    form.set("imgUrl", imgUrl);
    const response = await fetcher(`${base}${path}`, { method: "POST", signal, body: form });
    if (response.ok && !(response.headers.get("content-type") ?? "").includes("json")) {
      await response.text();
      return { ok: true };
    }
    return decodeJson(response, json());
  };
  return { post, postImageUrl };
}

type Client = ReturnType<typeof client>;

const expoId = number();
const fields = record(json());
const ids = array(number());

function build(c: Client) {
  return router({
    expos: router(
      {
        list: query({ description: "List every expo the token can access (id, key, name).", input: object({}) }, async () => c.post("/list-events")),
        setWebhookUrl: mutation(
          { description: "Set the webhook URL ExpoFP calls for events (for example exhibitor_added) in an expo.", input: object({ eventId: expoId, webhookUrl: string() }) },
          async (_ctx, input) => c.post("/set-webhook-url", input),
        ),
      },
      { title: "Expos", description: "Expos (events) and their webhooks." },
    ),
    exhibitors: router(
      {
        list: query(
          { description: "List the exhibitors of an expo with their booths, categories, tags and extras.", input: object({ eventId: expoId }) },
          async (_ctx, input) => c.post("/list-exhibitors", input),
        ),
        bulkReadTemplate: query(
          { description: "Template of fields returned by bulkRead; trim it and pass it as responseItemTemplate.", input: object({ expoId }) },
          async (_ctx, input) => c.post("/bulk-read-exhibitors-template", input),
        ),
        bulkRead: query(
          {
            description: "Read all exhibitors of an expo with full details. Pass a trimmed bulkReadTemplate result as responseItemTemplate to limit fields, or omit it for all fields.",
            input: object({ expoId, responseItemTemplate: record(json()).optional() }),
          },
          async (_ctx, input) => c.post("/bulk-read-exhibitors", { ...input, responseItemTemplate: input.responseItemTemplate ?? null }),
        ),
        get: query({ description: "Get one exhibitor's details by ID.", input: object({ id: number() }) }, async (_ctx, input) => c.post("/get-exhibitor", input)),
        getId: query(
          { description: "Find an exhibitor ID from its external ID within an expo.", input: object({ eventId: expoId, externalId: string() }) },
          async (_ctx, input) => c.post("/get-exhibitor-id", input),
        ),
        add: mutation(
          {
            description:
              "Create an exhibitor. Put the exhibitor fields in `fields`: name, description (HTML: p, b, strong, i, a, br), featured, advertised, country, address, address2, city, state, zip, phone1, phone2, publicEmail, privateEmail, vatNumber, website, facebook, instagram, linkedin, twitter, xing, youtube, videoUrl, contactName, contactPhone, adminNotes, externalId, categories ([{id}]), tags (strings), metadata ([{key, value}]).",
            input: object({ eventId: expoId, fields }),
          },
          async (_ctx, input) => c.post("/add-exhibitor", { ...input.fields, eventId: input.eventId }),
        ),
        update: mutation(
          {
            description: "Update an exhibitor. Only fields present in `fields` change (same field names as add).",
            input: object({ id: number(), fields }),
          },
          async (_ctx, input) => c.post("/update-exhibitor", { ...input.fields, id: input.id }),
        ),
        delete: mutation({ description: "Delete an exhibitor.", input: object({ id: number() }) }, async (_ctx, input) => c.post("/delete-exhibitor", input)),
        setRebookingState: mutation(
          {
            description: "Set an exhibitor's rebooking state: 0 unasked, 1 accepted, 2 rejected, 3 undecided.",
            input: object({ expoKey: string(), exhibitorId: number(), rebookingState: number() }),
          },
          async (_ctx, input) => c.post("/set-rebooking-state", input),
        ),
        setLogo: mutation(
          { description: "Set an exhibitor's logo from an image URL.", input: object({ exhibitorId: number(), imgUrl: string() }) },
          async (_ctx, input) => c.postImageUrl("/set-exhibitor-logo", input.exhibitorId, input.imgUrl),
        ),
        setLeadingImage: mutation(
          { description: "Set an exhibitor's leading image from an image URL.", input: object({ exhibitorId: number(), imgUrl: string() }) },
          async (_ctx, input) => c.postImageUrl("/set-exhibitor-leading-image", input.exhibitorId, input.imgUrl),
        ),
        removeGalleryImage: mutation(
          { description: "Remove a gallery image from an exhibitor.", input: object({ imgid: number(), exhibitorid: number() }) },
          async (_ctx, input) => c.post("/remove-gallery-image", input),
        ),
      },
      { title: "Exhibitors", description: "Exhibitor profiles and media." },
    ),
    booths: router(
      {
        list: query({ description: "List the booths and points of interest of an expo.", input: object({ expoId }) }, async (_ctx, input) => c.post("/list-booths", input)),
        get: query(
          { description: "Get a booth by name.", input: object({ eventId: expoId, name: string() }) },
          async (_ctx, input) => c.post("/get-booth", input),
        ),
        update: mutation(
          {
            description: "Update a booth by name: adminNotes, isOnHold, externalId and metadata ([{key, value}]) in `fields`.",
            input: object({ eventId: expoId, name: string(), fields }),
          },
          async (_ctx, input) => c.post("/update-booth", { ...input.fields, eventId: input.eventId, name: input.name }),
        ),
        assignExhibitor: mutation(
          { description: "Assign an exhibitor (ID or external ID) to a booth.", input: object({ eventId: expoId, boothName: string(), exhibitorId: string() }) },
          async (_ctx, input) => c.post("/add-exhibitor-booth", input),
        ),
        unassignExhibitor: mutation(
          { description: "Remove an exhibitor (ID or external ID) from a booth.", input: object({ eventId: expoId, boothName: string(), exhibitorId: string() }) },
          async (_ctx, input) => c.post("/remove-exhibitor-booth", input),
        ),
      },
      { title: "Booths", description: "Booths and exhibitor-booth assignments." },
    ),
    categories: router(
      {
        list: query({ description: "List the categories of an expo.", input: object({ eventId: expoId }) }, async (_ctx, input) => c.post("/list-categories", input)),
        add: mutation({ description: "Create a category.", input: object({ eventId: expoId, name: string() }) }, async (_ctx, input) => c.post("/add-category", input)),
        update: mutation({ description: "Rename a category.", input: object({ id: number(), name: string() }) }, async (_ctx, input) => c.post("/update-category", input)),
        remove: mutation({ description: "Delete a category.", input: object({ id: number() }) }, async (_ctx, input) => c.post("/remove-category", input)),
      },
      { title: "Categories", description: "Exhibitor categories." },
    ),
    extras: router(
      {
        list: query({ description: "List an expo's extras and booth extras with the exhibitors assigned.", input: object({ eventId: expoId }) }, async (_ctx, input) => c.post("/list-extras", input)),
        listForExhibitor: query({ description: "List the extras assigned to an exhibitor.", input: object({ exhibitorId: number() }) }, async (_ctx, input) => c.post("/list-exhibitor-extras", input)),
        add: mutation(
          { description: "Assign an extra to an exhibitor.", input: object({ exhibitorId: number(), extraId: number(), quantity: number() }) },
          async (_ctx, input) => c.post("/add-exhibitor-extra", input),
        ),
        remove: mutation(
          { description: "Remove an extra from an exhibitor.", input: object({ exhibitorId: number(), extraId: number() }) },
          async (_ctx, input) => c.post("/remove-exhibitor-extra", input),
        ),
      },
      { title: "Extras", description: "Purchasable extras and their assignment to exhibitors." },
    ),
    sessions: router(
      {
        list: query({ description: "List the sessions of an expo.", input: object({ expoId }) }, async (_ctx, input) => c.post("/sessions/get", input)),
        upsert: mutation(
          {
            description:
              "Create or update sessions in bulk; a session whose externalId matches is updated. Each session: externalId, name, description, startDate and endDate (ISO 8601 UTC), logoFileUrl, boothId or boothName, sessionSpeakerIds, sessionTrackIds, rowId.",
            input: object({ expoId, sessions: array(record(json())) }),
          },
          async (_ctx, input) => c.post("/sessions/upsert", input),
        ),
        delete: mutation({ description: "Delete sessions by ID.", input: object({ expoId, ids }) }, async (_ctx, input) => c.post("/sessions/delete", input)),
      },
      { title: "Sessions", description: "Conference sessions." },
    ),
    sessionTracks: router(
      {
        list: query({ description: "List the session tracks of an expo.", input: object({ expoId }) }, async (_ctx, input) => c.post("/session-tracks/get", input)),
        upsert: mutation(
          {
            description: "Create or update session tracks in bulk. Each track: externalId, name (required), color (hex).",
            input: object({ expoId, sessionTracks: array(record(json())) }),
          },
          async (_ctx, input) => c.post("/session-tracks/upsert", input),
        ),
        delete: mutation({ description: "Delete session tracks by ID.", input: object({ expoId, ids }) }, async (_ctx, input) => c.post("/session-tracks/delete", input)),
      },
      { title: "Session tracks", description: "Conference session tracks." },
    ),
    sessionSpeakers: router(
      {
        list: query({ description: "List the session speakers of an expo.", input: object({ expoId }) }, async (_ctx, input) => c.post("/session-speakers/get", input)),
        upsert: mutation(
          {
            description:
              "Create or update session speakers in bulk. Each speaker: externalId, name (required), company, jobTitle, position, description, photoFileUrl, instagram, youTube, facebook, twitter, linkedIn, tikTok, pinterest, snapchat.",
            input: object({ expoId, sessionSpeakers: array(record(json())) }),
          },
          async (_ctx, input) => c.post("/session-speakers/upsert", input),
        ),
        delete: mutation({ description: "Delete session speakers by ID.", input: object({ expoId, ids }) }, async (_ctx, input) => c.post("/session-speakers/delete", input)),
      },
      { title: "Session speakers", description: "Conference session speakers." },
    ),
    dxf: router(
      {
        convert: mutation(
          {
            description:
              "Start converting a DXF file (URL in filePath) into an SVG floor plan for an expo. Optional: scale, boothLayers, backgroundLayers, foregroundLayers, targetBoothsLayer. Returns a jobId.",
            input: object({
              filePath: string(),
              expoKey: string(),
              scale: number().optional(),
              boothLayers: array(string()).optional(),
              backgroundLayers: array(string()).optional(),
              foregroundLayers: array(string()).optional(),
              targetBoothsLayer: string().optional(),
            }),
          },
          async (_ctx, input) => c.post("/convert/dxf-to-svg", input),
        ),
        status: query({ description: "Status of a DXF conversion job.", input: object({ jobId: string() }) }, async (_ctx, input) => c.post("/convert/dxf-to-svg/status", input)),
      },
      { title: "DXF conversion", description: "Convert DXF drawings to floor plan SVGs." },
    ),
  });
}

export default defineApp(
  { user: { accounts: { expofp: expofp.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.expofp ?? [],
        (account) => withApprovals(build(client(account.fields.token, fetch, signal)), (tool) => (tool.kind === "mutation" ? always() : undefined)),
        { signal },
      ),
      {
        title: "ExpoFP",
        description: "Manage ExpoFP interactive floor plans: expos, exhibitors, booths, categories, extras, sessions, tracks, speakers and DXF conversion.",
        icons,
      },
    ),
  }),
);
