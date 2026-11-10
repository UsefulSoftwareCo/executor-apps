import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  json,
  mutation,
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

const base = "https://api.ignisign.io";

const ignisign = defineProvider({
  name: "IgniSign",
  hosts: ["api.ignisign.io"],
  auth: {
    // The only OAuth2 flow IgniSign has is signer-facing (bare-signature sessions); it is not offered for connecting an account, so the application API key is the only method.
    apiKey: secrets({
      label: "Application API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const { appId } = parseKey(account.fields.token);
    const response = await fetch(`${base}/v4/applications/${encodeURIComponent(appId)}/context`, {
      signal,
      headers: { Authorization: `Bearer ${account.fields.token}`, Accept: "application/json" },
    });
    await decodeJson(response, object({}));
  },
});

// API keys look like skv2_<env>_<appId without prefix>_<secret> (per the SDK README); the app id and environment are part of most paths. The index-based split follows the SDK's own exportAppIdAndEnv.
function parseKey(token: string): { appId: string; appEnv: string } {
  const [, env, id] = token.split("_");
  if (!env || !id) throw new Error("Not an IgniSign API key: expected the form skv2_<env>_<appId>_<secret>.");
  return { appId: `appId_${id}`, appEnv: env.toUpperCase() };
}

const section = (options: { title: string; description: string }, tools: Record<string, any>) => router(tools, options);

type Params = Record<string, unknown>;
type Method = "GET" | "POST" | "PUT" | "DELETE";

function build(token: string, fetcher: typeof fetch, signal: AbortSignal | undefined) {
  const { appId, appEnv } = parseKey(token);

  const run = async (method: Method, template: string, input: Params, hasBody: boolean) => {
    const path = template
      .replace(":appId", encodeURIComponent(appId))
      .replace(":appEnv", encodeURIComponent(appEnv))
      .replace(/:(\w+)/g, (_, name: string) => encodeURIComponent(String(input[name])));
    const url = new URL(`${base}${path}`);
    for (const [key, value] of Object.entries((input.query as Params | undefined) ?? {})) {
      if (value === undefined || value === null) continue;
      if (Array.isArray(value)) for (const item of value) url.searchParams.append(key, String(item));
      else url.searchParams.set(key, typeof value === "object" ? JSON.stringify(value) : String(value));
    }
    const body = hasBody ? (input.body as Params | undefined) : undefined;
    const response = await fetcher(url.toString(), {
      method,
      signal,
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
        ...(body === undefined ? {} : { "Content-Type": "application/json" }),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    if (response.status === 204) return { ok: true };
    return decodeJson(response, json());
  };

  const ids = (template: string) =>
    Object.fromEntries(
      [...template.matchAll(/:(\w+)/g)]
        .map((m) => m[1]!)
        .filter((name) => name !== "appId" && name !== "appEnv")
        .map((name) => [name, string()]),
    );
  const filters = record(json()).optional();

  const read = (template: string, description: string) =>
    query({ description, input: object({ ...ids(template), query: filters }) }, async (_ctx, input: Params) =>
      run("GET", template, input, false),
    );
  const write = (method: Exclude<Method, "GET">, template: string, description: string, body: "required" | "optional" | "none" = "required") =>
    mutation(
      {
        description,
        input: object({
          ...ids(template),
          query: filters,
          ...(body === "required" ? { body: record(json()) } : body === "optional" ? { body: record(json()).optional() } : {}),
        }),
      },
      async (_ctx, input: Params) => run(method, template, input, body !== "none"),
    );

  const app = "/v4/applications/:appId";
  const env = `${app}/envs/:appEnv`;

  return router({
    applications: section(
      { title: "Application", description: "The application (and environment) the API key belongs to." },
      {
        context: read(`${app}/context`, "Context of the application: its environments and configuration."),
        invitedUsers: router({
          list: read(`${app}/users-invitations`, "List users invited to the application."),
          invite: write("POST", `${app}/users-invitations`, "Invite a user to the application. body is the invitation object."),
          resend: write("POST", `${app}/users-invitations/:userInvitationId/resend`, "Resend a user invitation.", "none"),
          update: write("PUT", `${app}/users-invitations/:userInvitationId`, "Edit an invited user. body holds the fields to change."),
          cancel: write("DELETE", `${app}/users-invitations/:userInvitationId`, "Cancel a user invitation.", "none"),
        }),
      },
    ),
    signerProfiles: section(
      { title: "Signer profiles", description: "Signer profiles define the signature level and inputs a signer needs." },
      {
        list: read(`${env}/signer-profiles`, "List signer profiles of the environment."),
        get: read(`${env}/signer-profiles/:signerProfileId`, "Retrieve one signer profile."),
        inputsNeeded: read(`${env}/signer-profiles/:signerProfileId/inputs-needed`, "Inputs a signer must provide for a signer profile."),
      },
    ),
    signers: section(
      { title: "Signers", description: "People who sign documents." },
      {
        paginate: read(`${env}/signers-paginate`, "List signers, paginated. Pagination goes in query."),
        search: write("POST", `${env}/signers-search`, "Search signers. body holds the search criteria."),
        get: read(`${env}/signers/:signerId`, "Retrieve a signer summary."),
        details: read(`${env}/signers/:signerId/details`, "Retrieve a signer with details."),
        create: write("POST", `${env}/signers`, "Create a signer. body is the signer object."),
        update: write("PUT", `${env}/signers/:signerId`, "Update a signer. body holds the fields to change."),
        revoke: write("DELETE", `${env}/signers/:signerId/revoke`, "Revoke a signer.", "none"),
        regenerateAuthSecret: write("PUT", `${env}/signers/:signerId/regenerate-auth-secret`, "Regenerate a signer's authentication secret.", "optional"),
        initSetup: write("POST", `${env}/signer-setup`, "Initialize a signer setup session. body is the setup request."),
      },
    ),
    signatureRequests: section(
      { title: "Signature requests", description: "Create, publish and close signature requests." },
      {
        list: read(`${env}/signature-requests`, "List signature requests of the environment."),
        statuses: write("POST", `${env}/signature-requests/status`, "Statuses of the given signature requests. body is { signatureRequestIds: string[] }."),
        context: read(`/v4/signature-requests/:signatureRequestId/context`, "Retrieve a signature request with its documents and signers."),
        init: write("POST", `${env}/signature-requests`, "Initialize a signature request (draft). body is the request object."),
        update: write("PUT", `/v4/signature-requests/:signatureRequestId`, "Update a draft signature request. body holds the fields to change."),
        publish: write("PUT", `/v4/signature-requests/:signatureRequestId/publish`, "Publish a signature request, which notifies its signers.", "optional"),
        close: write("PUT", `/v4/signature-requests/:signatureRequestId/close`, "Close a signature request.", "optional"),
        oneCall: write("POST", `/v4/signature-requests/one-call-sign`, "Create and publish a signature request in a single call. body is the full request."),
      },
    ),
    documents: section(
      { title: "Documents", description: "Documents attached to signature requests. File upload and download endpoints need multipart or binary bodies and are not exposed." },
      {
        init: write("POST", `${env}/init-documents`, "Initialize a document. body describes it (label, type, ...)."),
        get: read(`/v4/documents/:documentId`, "Retrieve a document."),
        context: read(`/v4/documents/:documentId/context`, "Retrieve a document's context."),
        update: write("PUT", `/v4/documents/:documentId`, "Update a document. body holds the fields to change."),
        remove: write("DELETE", `/v4/documents/:documentId`, "Delete a document.", "none"),
        provideDataJson: write("POST", `/v4/documents/:documentId/data-json-content`, "Provide a document's content as JSON data. body is the data."),
        providePrivateContent: write("POST", `/v4/documents/:documentId/private-content`, "Provide a document's private content (hash). body is the content descriptor."),
        removeContent: write("DELETE", `/v4/documents/:documentId/content`, "Remove a document's content.", "none"),
        createRequest: write("POST", `/v4/documents/:documentId/requests`, "Create a document request. body is the request."),
      },
    ),
    signatures: section(
      { title: "Signatures", description: "Signatures and proofs of signed documents." },
      {
        list: read(`/v4/documents/:documentId/signatures`, "List the signatures of a document."),
        get: read(`/v4/documents/:documentId/signatures/:signatureId`, "Retrieve one signature of a document."),
        images: read(`/v4/documents/:documentId/img-signatures`, "Signature images of a document."),
      },
    ),
    webhooks: section(
      { title: "Webhooks", description: "Webhook endpoints and their delivered events." },
      {
        list: read(`${env}/webhooks`, "List webhook endpoints."),
        add: write("POST", `${env}/webhooks`, "Add a webhook endpoint. body holds the url and events."),
        update: write("PUT", `/v4/webhooks/:webhookId`, "Update a webhook endpoint. body holds the fields to change."),
        remove: write("DELETE", `/v4/webhooks/:webhookId`, "Remove a webhook endpoint.", "none"),
        events: read(`/v4/webhooks/:webhookId/events`, "List events delivered to a webhook endpoint."),
        event: read(`/v4/webhooks/:webhookId/events/:eventId`, "Retrieve one webhook event."),
        resendEvent: write("POST", `/v4/webhooks/:webhookId/events/:eventId/resend`, "Resend a webhook event.", "none"),
      },
    ),
    seal: section(
      { title: "Seal and log capsules", description: "Machine-to-machine seals and log capsules." },
      {
        signM2M: write("POST", `${env}/m2m/:m2mId/sign`, "Seal (sign machine to machine) with a configured seal. body holds the document hash and signature."),
        bareSignatureConfiguration: read(`${env}/bare-signatures-configuration`, "Bare signature configuration of the environment."),
        createLogCapsule: write("POST", `${env}/log-capsules`, "Create a log capsule. body is the capsule content."),
      },
    ),
  });
}

export default defineApp(
  { user: { accounts: { ignisign: ignisign.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.ignisign ?? [],
        (account) => withApprovals(build(account.fields.token, fetch, signal), (tool) => (tool.kind === "mutation" ? always() : undefined)),
        { signal },
      ),
      {
        title: "IgniSign",
        description: "Electronic signatures with IgniSign: signature requests, documents, signers, signer profiles, webhooks, proofs and seals.",
        icons,
      },
    ),
  }),
);
