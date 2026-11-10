import { decodeJson, defineProvider, object, plain, secrets, string } from "apps";
import { host, regions } from "./region.ts";

export const onepassword = defineProvider({
  name: "1Password",
  hosts: regions.map(([, events]) => events),
  auth: {
    apiKey: secrets({
      label: "Events Reporting token (not a service account token)",
      // The region is not secret: app code needs its value to choose the regional host.
      fields: object({ token: string({ minLength: 1 }), region: plain(string({ minLength: 1 })) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch(`https://${host(account.fields.region)}/api/v2/auth/introspect`, {
      signal,
      headers: { Authorization: `Bearer ${account.fields.token}` },
    });
    const body = await decodeJson(response, object({ uuid: string() }));
    return { accountInfo: { externalId: body.uuid, displayName: "1Password Events Reporting token" } };
  },
});
