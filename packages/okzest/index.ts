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

const base = "https://api.okzest.com/v1";

const okzest = defineProvider({
  name: "OKZest",
  hosts: ["api.okzest.com"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // Listing designs is read-only and consumes no image quota.
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/images`, { signal, headers: headers(account) });
    await decodeJson(response, json());
  },
});

type Account = { fields: { token: string } };

const headers = (account: Account) => ({ "x-api-key": account.fields.token, Accept: "application/json" });

const toBase64 = (bytes: Uint8Array) => {
  let binary = "";
  for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(binary);
};

const okzestTools = (account: Account, signal: AbortSignal) =>
  router({
    listDesigns: query(
      {
        description:
          "List all designs in the account. Each has a name, the share url (https://media.okzest.com/img?c=<company>&i=<design>), optional_url_params with their ESP merge tags, open counts for the billing cycle and lifetime, and created and updated dates.",
        input: object({}),
      },
      async ({ fetch }) => decodeJson(await fetch(`${base}/images`, { signal, headers: headers(account) }), json()),
    ),
    getDesign: query(
      {
        description:
          "Get one design by its design id (shown on the design's share page or returned by listDesigns): name, share url, URL parameters and open counts.",
        input: object({ designId: string() }),
      },
      async ({ fetch }, { designId }) =>
        decodeJson(
          await fetch(`${base}/images/${encodeURIComponent(designId)}`, { signal, headers: headers(account) }),
          json(),
        ),
    ),
    getDesignFields: query(
      {
        description:
          "Get the editable fields (layers) of a design, so you know which layer_id values createImage can change.",
        input: object({ designId: string() }),
      },
      async ({ fetch }, { designId }) =>
        decodeJson(
          await fetch(`${base}/images/${encodeURIComponent(designId)}/fields`, { signal, headers: headers(account) }),
          json(),
        ),
    ),
    createImage: mutation(
      {
        description:
          "Render a new image from a design with per-call changes; the saved design is not modified. layers is a list of changes, each with layer_id (shown on the design page) and any of text, color, image_url, is_screenshot (image_url is a web page to screenshot) or is_logo (image_url is a company website to fetch a logo from). background is the reserved background layer, an object with any of color (hex, e.g. \"#eda32b\"), image_url, width and height (the intro page also shows a bare color string, which is passed through as given). format is gif, jpg, png or webp (default jpg); quality (1-100) applies to jpg and webp only. Returns the image as base64 in `data` with its `contentType`. Counts against the plan's image quota.",
        input: object({
          designId: string(),
          layers: array(
            object({
              layer_id: string(),
              text: string().optional(),
              color: string().optional(),
              image_url: string().optional(),
              is_screenshot: boolean().optional(),
              is_logo: boolean().optional(),
            }),
          ).optional(),
          background: json().optional(),
          format: string().optional(),
          quality: number().optional(),
        }),
        approval: always(),
      },
      async ({ fetch }, { designId, layers, background, format, quality }) => {
        const response = await fetch(`${base}/images`, {
          method: "POST",
          signal,
          headers: { ...headers(account), "content-type": "application/json" },
          body: JSON.stringify({
            design_id: designId,
            ...(layers === undefined ? {} : { layers }),
            ...(background === undefined ? {} : { background }),
            ...(format === undefined ? {} : { format }),
            ...(quality === undefined ? {} : { quality }),
          }),
        });
        if (!response.ok) throw new Error(`OKZest returned ${response.status}: ${await response.text()}`);
        const contentType = response.headers.get("content-type") ?? "image/jpeg";
        return { contentType, data: toBase64(new Uint8Array(await response.arrayBuffer())) };
      },
    ),
  });

export default defineApp({ user: { accounts: { okzest: okzest.many() } }, icons }, async ({ user, signal }) => ({
  tools: router(await accountRouter(user?.accounts.okzest ?? [], (account) => okzestTools(account, signal), { signal }), {
    title: "OKZest",
    description: "Render personalized images from OKZest designs and list your designs and their editable fields.",
    icons,
  }),
}));
