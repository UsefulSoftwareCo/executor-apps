import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  number,
  object,
  router,
  secrets,
  string,
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { liveOpenapiRouter } from "apps/openapi";
import { icons } from "./icon.js";
import { options } from "./openapi.js";

const justOneApi = defineProvider({
  name: "Just One API",
  hosts: ["api.justoneapi.com"],
  auth: {
    apiKey: secrets({
      label: "Access token",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // There is no account endpoint, and the vendor docs do not say whether the token or the parameters
  // are checked first, so the check makes one real (billed) lookup of a public item. Only a valid
  // token with balance answers code 0.
  async health({ account, fetch, signal }) {
    const url = new URL("https://api.justoneapi.com/api/taobao/get-item-detail/v1");
    url.searchParams.set("token", account.fields.token);
    url.searchParams.set("itemId", "520813250866");
    const response = await fetch(url.toString(), { signal });
    const body = await decodeJson(response, object({ code: number() }));
    if (body.code === 0) return;
    if (body.code === 100) throw new Error("Just One API rejected the access token (code 100)");
    if (body.code === 601) throw new Error("Just One API account has insufficient balance (code 601)");
    if (body.code === 602) throw new Error("Just One API token budget exceeded (code 602)");
    throw new Error(`Just One API health check failed with code ${body.code}`);
  },
});

export default defineApp(
  { user: { accounts: { justOneApi: justOneApi.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.justOneApi ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Just One API",
        description:
          "Public social media, creator, entertainment and ecommerce data: Xiaohongshu, Douyin, Weibo, Bilibili, Taobao, TikTok, YouTube, WeChat and more. Calls are metered against the account balance.",
        icons,
      },
    ),
  }),
);
