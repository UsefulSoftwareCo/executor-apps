import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  oauth2,
  object,
  router,
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { liveOpenapiRouter } from "apps/openapi";
import { icons } from "./icon.js";
import { libraryOptions, pickerOptions } from "./openapi.js";

const Albums = object({});

const googlePhotos = defineProvider({
  name: "Google Photos",
  hosts: ["photoslibrary.googleapis.com", "photospicker.googleapis.com"],
  auth: {
    // Google has no dynamic client registration: the connect page asks for a Google Cloud OAuth client.
    oauth: oauth2({
      discover: "https://accounts.google.com",
      scopes: [
        "https://www.googleapis.com/auth/photoslibrary.appendonly",
        "https://www.googleapis.com/auth/photoslibrary.readonly.appcreateddata",
        "https://www.googleapis.com/auth/photoslibrary.edit.appcreateddata",
        "https://www.googleapis.com/auth/photospicker.mediaitems.readonly",
      ],
      // Google issues refresh tokens only when asked for offline access.
      authorizationParams: { access_type: "offline", prompt: "consent" },
    }),
  },
  async health({ account, fetch, signal }) {
    // The Photos APIs have no profile endpoint; listing one album proves the token works.
    const response = await fetch("https://photoslibrary.googleapis.com/v1/albums?pageSize=1", {
      signal,
      headers: { Authorization: `Bearer ${account.fields.access_token}` },
    });
    await decodeJson(response, Albums);
    return {};
  },
});

export default defineApp(
  { user: { accounts: { googlePhotos: googlePhotos.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.googlePhotos ?? [],
        (account) => {
          const approve = <T extends Parameters<typeof withApprovals>[0]>(r: T) =>
            withApprovals(r, (tool) => (tool.kind === "mutation" ? always() : undefined));
          return router(
            {
              library: approve(liveOpenapiRouter({ ...libraryOptions, cache, fetch, signal, account })),
              picker: approve(liveOpenapiRouter({ ...pickerOptions, cache, fetch, signal, account })),
            },
            { title: "Google Photos", description: "Google Photos Library and Picker APIs." },
          );
        },
        { signal },
      ),
      {
        title: "Google Photos",
        description:
          "Google Photos. library: create, list and edit albums, add and remove items, search and edit media items created by this app. picker: create a Picker session so the user selects photos, then list the picked items.",
        icons,
      },
    ),
  }),
);
