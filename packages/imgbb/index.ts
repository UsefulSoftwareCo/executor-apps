import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  json,
  mutation,
  number,
  object,
  router,
  secrets,
  string,
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const url = "https://api.imgbb.com/1/upload";

const imgbb = defineProvider({
  name: "ImgBB",
  hosts: ["api.imgbb.com"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // ImgBB has no read-only endpoint, so this posts an upload with no image (nothing is uploaded).
  // Only the verified signature is treated as a bad key: HTTP 400 with {"error":{"code":100,
  // "message":"Invalid API v1 key."}}. Any response that is not the ImgBB JSON envelope
  // (an outage, rate limit or HTML error page) fails the check.
  async health({ account, fetch, signal }) {
    const response = await fetch(`${url}?key=${encodeURIComponent(account.fields.token)}`, {
      method: "POST",
      signal,
      body: new FormData(),
    });
    const body = await response.text();
    if (response.status === 403 || /"code"\s*:\s*100\b|invalid api/i.test(body)) {
      throw new Error("ImgBB rejected the API key");
    }
    let envelope: unknown;
    try {
      envelope = JSON.parse(body);
    } catch {
      envelope = undefined;
    }
    if (typeof envelope !== "object" || envelope === null || !("status_code" in envelope || "error" in envelope)) {
      throw new Error(`ImgBB did not answer with its JSON envelope (HTTP ${response.status})`);
    }
  },
});

type Account = { fields: { token: string } };

const imgbbTools = (account: Account, signal: AbortSignal) =>
  router({
    upload: mutation(
      {
        description:
          "Upload one image to ImgBB and get its public links back: data.url (direct), data.url_viewer (page), data.display_url, data.thumb.url, data.medium.url, data.delete_url, plus width, height, size and mime details. image is either an image URL or base64-encoded image data without a data: prefix, up to 32 MB. name sets the file name. expiration deletes the image automatically after that many seconds (60 to 15552000, about 180 days); omit to keep it forever. Uploaded images are public to anyone with the link.",
        input: object({
          image: string({ minLength: 1 }),
          name: string().optional(),
          expiration: number().optional(),
        }),
        approval: always(),
      },
      async ({ fetch }, { image, name, expiration }) => {
        const form = new FormData();
        form.set("image", image);
        if (name !== undefined) form.set("name", name);
        const query = new URLSearchParams({ key: account.fields.token });
        if (expiration !== undefined) query.set("expiration", String(expiration));
        return decodeJson(await fetch(`${url}?${query}`, { method: "POST", signal, body: form }), json());
      },
    ),
  });

export default defineApp({ user: { accounts: { imgbb: imgbb.many() } }, icons }, async ({ user, signal }) => ({
  tools: router(await accountRouter(user?.accounts.imgbb ?? [], (account) => imgbbTools(account, signal), { signal }), {
    title: "ImgBB",
    description: "Upload images to ImgBB from a URL or base64 data and get hosted, thumbnail and delete links.",
    icons,
  }),
}));
