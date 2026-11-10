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
import { options } from "./openapi.js";

const carsxe = defineProvider({
  name: "CarsXE",
  hosts: ["api.carsxe.com"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // OBD code decoding is a cheap lookup that needs only a valid key.
  async health({ account, fetch, signal }) {
    const url = new URL("https://api.carsxe.com/obdcodesdecoder");
    url.searchParams.set("key", account.fields.token);
    url.searchParams.set("code", "P0300");
    const response = await fetch(url.toString(), { signal });
    await decodeJson(response, object({}));
  },
});

export default defineApp(
  { user: { accounts: { carsxe: carsxe.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.carsxe ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "CarsXE",
        description: "Vehicle data: VIN decoding, specifications, recalls, market value, history, plate decoding, images, recognition and OBD codes.",
        icons,
      },
    ),
  }),
);
