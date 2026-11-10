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

const base = "https://api.mapflow.ai/rest";

const mapflow = defineProvider({
  name: "Mapflow",
  hosts: ["api.mapflow.ai"],
  auth: {
    apiKey: secrets({
      label: "API token",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/user/status`, {
      signal,
      headers: { Authorization: `Bearer ${account.fields.token}`, Accept: "application/json" },
    });
    await decodeJson(response, object({}));
  },
});

type Account = { fields: { token: string } };

const headers = (account: Account) => ({ Authorization: `Bearer ${account.fields.token}`, Accept: "application/json" });
const jsonHeaders = (account: Account) => ({ ...headers(account), "content-type": "application/json" });

const search = (params: Record<string, string | number | undefined>) => {
  const out = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) if (value !== undefined) out.set(key, String(value));
  const text = out.toString();
  return text === "" ? "" : `?${text}`;
};

const id = (value: string) => encodeURIComponent(value);

const mapflowTools = (account: Account, signal: AbortSignal) => {
  return router({
    account: router(
      {
        status: query(
          {
            description:
              "Get the current account: user details, credit balance, limits, available AI models, workflow definitions (wdId/wdName) and processing blocks. Call this first to find the workflow definition id or name that processing creation needs.",
            input: object({}),
          },
          async ({ fetch }) => decodeJson(await fetch(`${base}/user/status`, { signal, headers: headers(account) }), json()),
        ),
        storage: query(
          {
            description: "Get how much raster storage the account uses and its storage limit.",
            input: object({}),
          },
          async ({ fetch }) => decodeJson(await fetch(`${base}/rasters/memory`, { signal, headers: headers(account) }), json()),
        ),
        processingStats: query(
          {
            description:
              "Paginated, filterable history of the account's processings. sort is like \"created:desc\"; filter is like \"status=OK\". page is the page number as the vendor documents it (its example uses 1; the starting index and default are unverified); perPage is the page size.",
            input: object({
              page: number().optional(),
              perPage: number().optional(),
              sort: string().optional(),
              filter: string().optional(),
            }),
          },
          async ({ fetch }, input) =>
            decodeJson(
              await fetch(`${base}/processings/stats?type=JSON`, {
                method: "POST",
                signal,
                headers: jsonHeaders(account),
                body: JSON.stringify(input),
              }),
              json(),
            ),
        ),
      },
      { title: "Account", description: "Account status, credits, workflow definitions and storage." },
    ),
    projects: router(
      {
        default: query(
          { description: "Get the account's default project.", input: object({}) },
          async ({ fetch }) =>
            decodeJson(await fetch(`${base}/projects/default`, { signal, headers: headers(account) }), json()),
        ),
        create: mutation(
          {
            description: "Create a project that groups processings.",
            input: object({ name: string(), description: string().optional() }),
            approval: always(),
          },
          async ({ fetch }, input) =>
            decodeJson(
              await fetch(`${base}/projects`, {
                method: "POST",
                signal,
                headers: jsonHeaders(account),
                body: JSON.stringify(input),
              }),
              json(),
            ),
        ),
        update: mutation(
          {
            description: "Rename a project or change its description.",
            input: object({ projectId: string(), name: string().optional(), description: string().optional() }),
            approval: always(),
          },
          async ({ fetch }, { projectId, ...body }) =>
            decodeJson(
              await fetch(`${base}/projects/${id(projectId)}`, {
                method: "PUT",
                signal,
                headers: jsonHeaders(account),
                body: JSON.stringify(body),
              }),
              json(),
            ),
        ),
      },
      { title: "Projects", description: "Projects group processings." },
    ),
    processings: router(
      {
        list: query(
          { description: "List all of the account's processings with status.", input: object({}) },
          async ({ fetch }) =>
            decodeJson(await fetch(`${base}/processings/v2`, { signal, headers: headers(account) }), json()),
        ),
        listForProject: query(
          { description: "List the processings in one project.", input: object({ projectId: string() }) },
          async ({ fetch }, { projectId }) =>
            decodeJson(
              await fetch(`${base}/projects/${id(projectId)}/processings/v2`, { signal, headers: headers(account) }),
              json(),
            ),
        ),
        get: query(
          {
            description:
              "Get one processing: status (UNPROCESSED, IN_PROGRESS, AWAITING, OK, FAILED, CANCELLED, REFUNDED), progress, cost and parameters.",
            input: object({ processingId: string() }),
          },
          async ({ fetch }, { processingId }) =>
            decodeJson(
              await fetch(`${base}/processings/${id(processingId)}/v2`, { signal, headers: headers(account) }),
              json(),
            ),
        ),
        result: query(
          {
            description:
              "Download a finished processing's results as GeoJSON. Optionally restrict to one area of interest with aoiId.",
            input: object({ processingId: string(), aoiId: string().optional() }),
          },
          async ({ fetch }, { processingId, aoiId }) =>
            decodeJson(
              await fetch(`${base}/processings/${id(processingId)}/result${search({ aoiId })}`, {
                signal,
                headers: headers(account),
              }),
              json(),
            ),
        ),
        estimateCost: query(
          {
            description:
              "Estimate the credit cost of a processing before running it. Give wdId (workflow definition id) plus a GeoJSON geometry and/or areaSqKm; params and blocks are the same as for create.",
            input: object({
              wdId: string(),
              geometry: json().optional(),
              areaSqKm: number().optional(),
              params: json().optional(),
              blocks: array(object({ name: string(), enabled: boolean() })).optional(),
            }),
          },
          async ({ fetch }, input) =>
            decodeJson(
              await fetch(`${base}/processing/cost/v2`, {
                method: "POST",
                signal,
                headers: jsonHeaders(account),
                body: JSON.stringify(input),
              }),
              json(),
            ),
        ),
        create: mutation(
          {
            description:
              "Create and start a processing that spends credits. Required: name, projectId, geometry (GeoJSON Polygon or MultiPolygon in WGS84), params and a workflow definition by wdId or wdName (see account.status); the call fails before any request is sent if neither wdId nor wdName is given. params.sourceParams chooses imagery, exactly one of: {dataProvider:{providerName,zoom}}, {myImagery:{imageIds|mosaicId}}, {imagerySearch:{dataProvider,imageIds,zoom}}, {userDefined:{sourceType:XYZ|TMS|QUADKEY|SENTINEL_L2A|LOCAL,url,zoom,crs,rasterLogin,rasterPassword}}. Optional params.inferenceParams, blocks ([{name,enabled}] such as Simplification, Classification, OSM, Heights) and meta.",
            input: object({
              name: string(),
              projectId: string(),
              wdId: string().optional(),
              wdName: string().optional(),
              geometry: json(),
              params: json(),
              blocks: array(object({ name: string(), enabled: boolean() })).optional(),
              description: string().optional(),
              meta: json().optional(),
            }),
            approval: always(),
          },
          async ({ fetch }, input) => {
            if (input.wdId === undefined && input.wdName === undefined) {
              throw new Error("processings.create requires wdId or wdName (see account.status)");
            }
            return decodeJson(
              await fetch(`${base}/processings/v2`, {
                method: "POST",
                signal,
                headers: jsonHeaders(account),
                body: JSON.stringify(input),
              }),
              json(),
            );
          },
        ),
        restart: mutation(
          {
            description: "Restart only the failed partitions of a processing.",
            input: object({ processingId: string() }),
            approval: always(),
          },
          async ({ fetch }, { processingId }) =>
            decodeJson(
              await fetch(`${base}/processings/${id(processingId)}/restart`, {
                method: "POST",
                signal,
                headers: headers(account),
              }),
              json(),
            ),
        ),
        update: mutation(
          {
            description: "Rename a processing, change its description, or move it to another project.",
            input: object({
              processingId: string(),
              name: string().optional(),
              description: string().optional(),
              projectId: string().optional(),
            }),
            approval: always(),
          },
          async ({ fetch }, { processingId, ...body }) =>
            decodeJson(
              await fetch(`${base}/processings/${id(processingId)}`, {
                method: "PUT",
                signal,
                headers: jsonHeaders(account),
                body: JSON.stringify(body),
              }),
              json(),
            ),
        ),
        delete: mutation(
          {
            description: "Delete a processing and its child entities.",
            input: object({ processingId: string() }),
            approval: always(),
          },
          async ({ fetch }, { processingId }) => {
            const response = await fetch(`${base}/processings/${id(processingId)}`, {
              method: "DELETE",
              signal,
              headers: headers(account),
            });
            if (!response.ok) throw new Error(`Mapflow returned ${response.status}: ${await response.text()}`);
            return { deleted: true };
          },
        ),
      },
      { title: "Processings", description: "Run AI analysis on imagery and fetch its GeoJSON results." },
    ),
    mosaics: router(
      {
        get: query(
          { description: "Get a mosaic's metadata.", input: object({ mosaicId: string() }) },
          async ({ fetch }, { mosaicId }) =>
            decodeJson(await fetch(`${base}/rasters/mosaic/${id(mosaicId)}`, { signal, headers: headers(account) }), json()),
        ),
        listImages: query(
          { description: "List the images in a mosaic with their metadata.", input: object({ mosaicId: string() }) },
          async ({ fetch }, { mosaicId }) =>
            decodeJson(
              await fetch(`${base}/rasters/mosaic/${id(mosaicId)}/image`, { signal, headers: headers(account) }),
              json(),
            ),
        ),
        create: mutation(
          {
            description: "Create an empty mosaic of user imagery. Images in one mosaic must share CRS, band count and resolution.",
            input: object({ name: string(), tags: array(string()).optional() }),
            approval: always(),
          },
          async ({ fetch }, input) =>
            decodeJson(
              await fetch(`${base}/rasters/mosaic`, {
                method: "POST",
                signal,
                headers: jsonHeaders(account),
                body: JSON.stringify(input),
              }),
              json(),
            ),
        ),
        update: mutation(
          {
            description: "Rename a mosaic or replace its tags (new tags replace the old ones).",
            input: object({ mosaicId: string(), name: string().optional(), tags: array(string()).optional() }),
            approval: always(),
          },
          async ({ fetch }, { mosaicId, ...body }) =>
            decodeJson(
              await fetch(`${base}/rasters/mosaic/${id(mosaicId)}`, {
                method: "PUT",
                signal,
                headers: jsonHeaders(account),
                body: JSON.stringify(body),
              }),
              json(),
            ),
        ),
        linkImage: mutation(
          {
            description: "Add an image already stored in S3 to a mosaic by URL, without uploading it.",
            input: object({ mosaicId: string(), url: string() }),
            approval: always(),
          },
          async ({ fetch }, { mosaicId, url }) =>
            decodeJson(
              await fetch(`${base}/rasters/mosaic/${id(mosaicId)}/link-image`, {
                method: "POST",
                signal,
                headers: jsonHeaders(account),
                body: JSON.stringify({ url }),
              }),
              json(),
            ),
        ),
        delete: mutation(
          {
            description: "Delete a mosaic and all images linked to it. Irreversible.",
            input: object({ mosaicId: string() }),
            approval: always(),
          },
          async ({ fetch }, { mosaicId }) => {
            const response = await fetch(`${base}/rasters/mosaic/${id(mosaicId)}`, {
              method: "DELETE",
              signal,
              headers: headers(account),
            });
            if (!response.ok) throw new Error(`Mapflow returned ${response.status}: ${await response.text()}`);
            return { deleted: true };
          },
        ),
      },
      { title: "Mosaics", description: "Collections of your own imagery used as processing input." },
    ),
    images: router(
      {
        get: query(
          { description: "Get an uploaded image's metadata.", input: object({ imageId: string() }) },
          async ({ fetch }, { imageId }) =>
            decodeJson(await fetch(`${base}/rasters/image/${id(imageId)}`, { signal, headers: headers(account) }), json()),
        ),
        rename: mutation(
          {
            description: "Rename an uploaded image.",
            input: object({ imageId: string(), name: string() }),
            approval: always(),
          },
          async ({ fetch }, { imageId, name }) =>
            decodeJson(
              await fetch(`${base}/rasters/image/${id(imageId)}${search({ name })}`, {
                method: "PUT",
                signal,
                headers: headers(account),
              }),
              json(),
            ),
        ),
        delete: mutation(
          {
            description: "Delete an uploaded image.",
            input: object({ imageId: string() }),
            approval: always(),
          },
          async ({ fetch }, { imageId }) => {
            const response = await fetch(`${base}/rasters/image/${id(imageId)}`, {
              method: "DELETE",
              signal,
              headers: headers(account),
            });
            if (!response.ok) throw new Error(`Mapflow returned ${response.status}: ${await response.text()}`);
            return { deleted: true };
          },
        ),
      },
      { title: "Images", description: "Uploaded raster images (upload itself needs a file and is not exposed)." },
    ),
    catalog: router(
      {
        search: query(
          {
            description:
              "Search external satellite imagery metadata over an area of interest (GeoJSON geometry in aoi, limited by the account's AOI limit). Filter by acquisition dates (ISO 8601), resolution in metres, cloud cover percent, off-nadir angle, and dataProviders/productTypes. limit defaults to 100; sortOrder is ASC or DESC.",
            input: object({
              aoi: json(),
              acquisitionDateFrom: string().optional(),
              acquisitionDateTo: string().optional(),
              minResolution: number().optional(),
              maxResolution: number().optional(),
              maxCloudCover: number().optional(),
              minOffNadirAngle: number().optional(),
              maxOffNadirAngle: number().optional(),
              minAoiIntersectionPercent: number().optional(),
              limit: number().optional(),
              offset: number().optional(),
              sortBy: string().optional(),
              sortOrder: string().optional(),
              hideUnavailable: boolean().optional(),
              dataProviders: array(string()).optional(),
              productTypes: array(string()).optional(),
            }),
          },
          async ({ fetch }, input) =>
            decodeJson(
              await fetch(`${base}/catalog/meta`, {
                method: "POST",
                signal,
                headers: jsonHeaders(account),
                body: JSON.stringify(input),
              }),
              json(),
            ),
        ),
      },
      { title: "Catalog", description: "Search commercial and open satellite imagery before ordering." },
    ),
  });
};

export default defineApp({ user: { accounts: { mapflow: mapflow.many() } }, icons }, async ({ user, signal }) => ({
  tools: router(await accountRouter(user?.accounts.mapflow ?? [], (account) => mapflowTools(account, signal), { signal }), {
    title: "Mapflow",
    description:
      "Run AI analysis on satellite and aerial imagery with Mapflow.ai: projects, processings and GeoJSON results, mosaics, images and imagery catalog search.",
    icons,
  }),
}));
