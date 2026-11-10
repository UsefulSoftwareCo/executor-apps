import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  object,
  router,
  secrets,
  string,
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { liveOpenapiRouter } from "apps/openapi";
import { icons } from "./icon.js";
import { apis } from "./openapi.js";

const ipgeolocation = defineProvider({
  name: "IPGeolocation.io",
  hosts: ["api.ipgeolocation.io"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // Timezone lookup by zone name is read-only and needs no IP.
  async health({ account, fetch, signal }) {
    const response = await fetch(
      `https://api.ipgeolocation.io/v3/timezone?tz=UTC&apiKey=${encodeURIComponent(account.fields.token)}`,
      { signal },
    );
    await decodeJson(response, object({}));
  },
});

export default defineApp(
  { user: { accounts: { ipgeolocation: ipgeolocation.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.ipgeolocation ?? [],
        (account) => {
          const mount = (options: (typeof apis)[keyof typeof apis]) =>
            withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
              tool.kind === "mutation" ? always() : undefined,
            );
          return router(
            {
              location: mount(apis.location),
              security: mount(apis.security),
              userAgent: mount(apis.userAgent),
              asn: mount(apis.asn),
              abuse: mount(apis.abuse),
              timezone: mount(apis.timezone),
              astronomy: mount(apis.astronomy),
            },
            { title: "IPGeolocation.io", description: "IPGeolocation.io account." },
          );
        },
        { signal },
      ),
      {
        title: "IPGeolocation.io",
        description:
          "IPGeolocation.io. location: IP geolocation, single and bulk. security: threat, VPN, proxy and Tor signals. userAgent: parse User-Agent strings. asn: ASN details. abuse: IP abuse contacts. timezone: timezone lookup and conversion. astronomy: sun and moon data and time series.",
        icons,
      },
    ),
  }),
);
