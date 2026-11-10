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

const base = "https://api.modelry.ai/api";

const modelry = defineProvider({
  name: "Modelry",
  hosts: ["api.modelry.ai"],
  auth: {
    apiKey: secrets({
      label: "API token (app.modelry.ai/settings)",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // Listing workspaces is read-only and returns an array of the user's workspaces.
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/v1/workspaces`, { signal, headers: headers(account) });
    await decodeJson(response, json());
  },
});

type Account = { fields: { token: string } };

// Modelry expects the raw token in Authorization, with no Bearer prefix.
const headers = (account: Account) => ({ Authorization: account.fields.token, Accept: "application/json" });

const search = (params: Record<string, string | number | boolean | undefined | readonly string[]>) => {
  const out = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined) continue;
    if (typeof value === "object") for (const item of value) out.append(`${key}[]`, item);
    else out.set(key, String(value));
  }
  return out.toString();
};

const seg = encodeURIComponent;

const modelryTools = (account: Account, signal: AbortSignal) => {
  const send = (method: string, body?: unknown) => ({
    method,
    signal,
    headers: body === undefined ? headers(account) : { ...headers(account), "content-type": "application/json" },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  const read = { signal, headers: headers(account) };

  return router({
    listWorkspaces: query(
      { description: "List all workspaces the token's user can access.", input: object({}) },
      async ({ fetch }) => decodeJson(await fetch(`${base}/v1/workspaces`, read), json()),
    ),
    listProducts: query(
      {
        description:
          "List products with pagination and filters: page, perPage, keywords (free text), sku, batchId, title, tags, sortBy (array of sort expressions).",
        input: object({
          page: number().optional(),
          perPage: number().optional(),
          keywords: string().optional(),
          sku: string().optional(),
          batchId: string().optional(),
          title: string().optional(),
          tags: array(string()).optional(),
          sortBy: array(string()).optional(),
        }),
      },
      async ({ fetch }, { perPage, batchId, sortBy, ...rest }) =>
        decodeJson(
          await fetch(
            `${base}/v1/products?${search({ ...rest, per_page: perPage, batch_id: batchId, sort_by: sortBy })}`,
            read,
          ),
          json(),
        ),
    ),
    getProduct: query(
      { description: "Get one product by its numeric id.", input: object({ id: number() }) },
      async ({ fetch }, { id }) => decodeJson(await fetch(`${base}/v1/products/${seg(String(id))}`, read), json()),
    ),
    createProduct: mutation(
      {
        description:
          "Create a product. title and sku identify it; dimensions is a free-form string, batchId groups products, externalUrl links the product page.",
        input: object({
          title: string(),
          sku: string(),
          description: string().optional(),
          batchId: string().optional(),
          tags: array(string()).optional(),
          dimensions: string().optional(),
          externalUrl: string().optional(),
        }),
        approval: always(),
      },
      async ({ fetch }, { batchId, externalUrl, ...rest }) =>
        decodeJson(
          await fetch(
            `${base}/v1/products`,
            send("POST", { product: { ...rest, batch_id: batchId, external_url: externalUrl } }),
          ),
          json(),
        ),
    ),
    updateProduct: mutation(
      {
        description: "Update a product's title, sku, description, batchId, tags, dimensions or externalUrl.",
        input: object({
          id: number(),
          title: string().optional(),
          sku: string().optional(),
          description: string().optional(),
          batchId: string().optional(),
          tags: array(string()).optional(),
          dimensions: string().optional(),
          externalUrl: string().optional(),
        }),
        approval: always(),
      },
      async ({ fetch }, { id, batchId, externalUrl, ...rest }) =>
        decodeJson(
          await fetch(
            `${base}/v1/products/${seg(String(id))}`,
            send("PUT", { product: { ...rest, batch_id: batchId, external_url: externalUrl } }),
          ),
          json(),
        ),
    ),
    deleteProduct: mutation(
      { description: "Delete a product by id.", input: object({ id: number() }), approval: always() },
      async ({ fetch }, { id }) =>
        decodeJson(await fetch(`${base}/v1/products/${seg(String(id))}`, send("DELETE")), json()),
    ),
    downloadProductAssets: query(
      {
        description:
          "Get the download for a product's assets. Set sourceFile and/or deliveryFiles to choose which files are included.",
        input: object({
          productId: number(),
          sourceFile: boolean().optional(),
          deliveryFiles: boolean().optional(),
        }),
      },
      async ({ fetch }, { productId, sourceFile, deliveryFiles }) =>
        decodeJson(
          await fetch(
            `${base}/v1/products/${seg(String(productId))}/assets/download?${search({ source_file: sourceFile, delivery_files: deliveryFiles })}`,
            read,
          ),
          json(),
        ),
    ),
    createProductAsset: mutation(
      {
        description:
          "Attach an uploaded blob to a product as an asset. blobId comes from createBlob or uploadFile.",
        input: object({ productId: number(), blobId: string() }),
        approval: always(),
      },
      async ({ fetch }, { productId, blobId }) =>
        decodeJson(
          await fetch(
            `${base}/v1/products/${seg(String(productId))}/assets`,
            send("POST", { blob_id: blobId }),
          ),
          json(),
        ),
    ),
    deleteProductAsset: mutation(
      {
        description: "Delete one asset of a product.",
        input: object({ productId: number(), id: number() }),
        approval: always(),
      },
      async ({ fetch }, { productId, id }) =>
        decodeJson(
          await fetch(`${base}/v1/products/${seg(String(productId))}/assets/${seg(String(id))}`, send("DELETE")),
          json(),
        ),
    ),
    listEmbeds: query(
      { description: "List a product's embeds (3D viewers).", input: object({ productId: number() }) },
      async ({ fetch }, { productId }) =>
        decodeJson(await fetch(`${base}/v1/products/${seg(String(productId))}/embeds`, read), json()),
    ),
    getEmbed: query(
      { description: "Get one embed of a product.", input: object({ productId: number(), id: number() }) },
      async ({ fetch }, { productId, id }) =>
        decodeJson(await fetch(`${base}/v1/products/${seg(String(productId))}/embeds/${seg(String(id))}`, read), json()),
    ),
    createEmbed: mutation(
      {
        description:
          "Create an embed for a product. kinds lists the viewer kinds, blobIds and productAssetIds choose the files it shows.",
        input: object({
          productId: number(),
          title: string(),
          kinds: array(string()).optional(),
          blobIds: array(string()).optional(),
          productAssetIds: array(number()).optional(),
        }),
        approval: always(),
      },
      async ({ fetch }, { productId, title, kinds, blobIds, productAssetIds }) =>
        decodeJson(
          await fetch(
            `${base}/v1/products/${seg(String(productId))}/embeds`,
            send("POST", {
              product_viewer: { title, kinds, blob_ids: blobIds, product_asset_ids: productAssetIds },
            }),
          ),
          json(),
        ),
    ),
    publishEmbed: mutation(
      {
        description: "Publish a product embed so its viewer is publicly available.",
        input: object({ productId: number(), id: number() }),
        approval: always(),
      },
      async ({ fetch }, { productId, id }) =>
        decodeJson(
          await fetch(
            `${base}/v1/products/${seg(String(productId))}/embeds/${seg(String(id))}/publish`,
            send("PUT"),
          ),
          json(),
        ),
    ),
    deleteEmbed: mutation(
      {
        description: "Delete a product embed.",
        input: object({ productId: number(), id: number() }),
        approval: always(),
      },
      async ({ fetch }, { productId, id }) =>
        decodeJson(
          await fetch(`${base}/v1/products/${seg(String(productId))}/embeds/${seg(String(id))}`, send("DELETE")),
          json(),
        ),
    ),
    listModelingRequests: query(
      {
        description:
          "List 3D modeling requests. Filter by workspaceId, keywords, sku, batchUid, title or status; paginate with page and perPage.",
        input: object({
          page: number().optional(),
          perPage: number().optional(),
          workspaceId: number().optional(),
          keywords: string().optional(),
          sku: string().optional(),
          batchUid: string().optional(),
          title: string().optional(),
          status: string().optional(),
          sortBy: array(string()).optional(),
        }),
      },
      async ({ fetch }, { perPage, workspaceId, batchUid, sortBy, ...rest }) =>
        decodeJson(
          await fetch(
            `${base}/v1/modeling-requests?${search({ ...rest, per_page: perPage, workspace_id: workspaceId, batch_uid: batchUid, sort_by: sortBy })}`,
            read,
          ),
          json(),
        ),
    ),
    getModelingRequest: query(
      {
        description: "Get a modeling request by numeric id or by SKU, including its status.",
        input: object({ idOrSku: string() }),
      },
      async ({ fetch }, { idOrSku }) =>
        decodeJson(await fetch(`${base}/v1/modeling-requests/${seg(idOrSku)}`, read), json()),
    ),
    listModelingRequestAssets: query(
      {
        description: "List the delivered assets of a modeling request, by numeric id or SKU.",
        input: object({ idOrSku: string() }),
      },
      async ({ fetch }, { idOrSku }) =>
        decodeJson(await fetch(`${base}/v1/modeling-requests/${seg(idOrSku)}/assets`, read), json()),
    ),
    createModelingRequest: mutation(
      {
        description:
          "Order a 3D model. Provide title, sku and the existing productId; add dimensions, pipeline, specificRequirements, externalUrl and referenceFileBlobIds (blob ids from createBlob or uploadFile) as needed. Ordering can incur charges.",
        input: object({
          title: string(),
          sku: string(),
          productId: number().optional(),
          dimensions: string().optional(),
          pipeline: string().optional(),
          specificRequirements: string().optional(),
          externalUrl: string().optional(),
          referenceFileBlobIds: array(string()).optional(),
        }),
        approval: always(),
      },
      async ({ fetch }, { productId, specificRequirements, externalUrl, referenceFileBlobIds, ...rest }) =>
        decodeJson(
          await fetch(
            `${base}/v1/modeling-requests`,
            send("POST", {
              modeling_request: {
                ...rest,
                product_id: productId,
                specific_requirements: specificRequirements,
                external_url: externalUrl,
                reference_file_blob_ids: referenceFileBlobIds,
              },
            }),
          ),
          json(),
        ),
    ),
    approveModelingRequest: mutation(
      {
        description: "Approve a delivered modeling request, by numeric id or SKU.",
        input: object({ idOrSku: string() }),
        approval: always(),
      },
      async ({ fetch }, { idOrSku }) =>
        decodeJson(await fetch(`${base}/v1/modeling-requests/${seg(idOrSku)}/approve`, send("PUT")), json()),
    ),
    rejectModelingRequest: mutation(
      {
        description: "Reject a delivered modeling request, by numeric id or SKU.",
        input: object({ idOrSku: string() }),
        approval: always(),
      },
      async ({ fetch }, { idOrSku }) =>
        decodeJson(await fetch(`${base}/v1/modeling-requests/${seg(idOrSku)}/reject`, send("PUT")), json()),
    ),
    createReviewIssues: mutation(
      {
        description:
          "Add review issues to a modeling request (by id or SKU). Each issue has a filename, category, comment, severity (string such as \"high\"), and optional x/y position, order, reviewed flag and issueImage (base64 data URL, signed blob id).",
        input: object({
          idOrSku: string(),
          reviewIssues: array(
            object({
              filename: string(),
              category: string(),
              comment: string(),
              severity: string().optional(),
              order: string().optional(),
              reviewed: boolean().optional(),
              x: string().optional(),
              y: string().optional(),
              issueImage: string().optional(),
            }),
          ),
        }),
        approval: always(),
      },
      async ({ fetch }, { idOrSku, reviewIssues }) =>
        decodeJson(
          await fetch(
            `${base}/v1/modeling-requests/${seg(idOrSku)}/review_issues`,
            send("POST", {
              review_issues: reviewIssues.map(({ issueImage, ...issue }) => ({ ...issue, issue_image: issueImage })),
            }),
          ),
          json(),
        ),
    ),
    createBlob: mutation(
      {
        description:
          "Register a direct-upload blob (filename, byteSize, MD5 checksum in base64, contentType). Returns the direct upload target and the blob id to use in other calls.",
        input: object({ filename: string(), byteSize: number(), checksum: string(), contentType: string() }),
        approval: always(),
      },
      async ({ fetch }, { filename, byteSize, checksum, contentType }) =>
        decodeJson(
          await fetch(
            `${base}/v1/blobs`,
            send("POST", {
              blob: { filename, byte_size: byteSize, checksum, content_type: contentType },
            }),
          ),
          json(),
        ),
    ),
    uploadFile: mutation(
      {
        description:
          "Upload a small file as base64 text (filename, base64File, contentType). Returns the blob id for use in createProductAsset or createModelingRequest.",
        input: object({ filename: string(), base64File: string(), contentType: string() }),
        approval: always(),
      },
      async ({ fetch }, { filename, base64File, contentType }) =>
        decodeJson(
          await fetch(
            `${base}/v1/uploads`,
            send("POST", { filename, base64_file: base64File, content_type: contentType }),
          ),
          json(),
        ),
    ),
  });
};

export default defineApp({ user: { accounts: { modelry: modelry.many() } }, icons }, async ({ user, signal }) => ({
  tools: router(await accountRouter(user?.accounts.modelry ?? [], (account) => modelryTools(account, signal), { signal }), {
    title: "Modelry",
    description: "Products, 3D modeling requests, embeds and assets in Modelry, CGTrader's 3D product visualization platform.",
    icons,
  }),
}));
