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
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const base = "https://api.passslot.com/v1";

const passslot = defineProvider({
  name: "PassSlot",
  hosts: ["api.passslot.com"],
  auth: {
    apiKey: secrets({
      label: "App key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // Listing templates is read-only; a key limited to pass type IDs may be refused with 403.
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/templates`, { signal, headers: headers(account) });
    await decodeJson(response, json());
  },
});

type Account = { fields: { token: string } };

// The app key is the basic-auth username with an empty password.
const headers = (account: Account) => ({
  Authorization: `Basic ${btoa(`${account.fields.token}:`)}`,
  Accept: "application/json",
});

const enc = encodeURIComponent;

// DELETE and some PUT calls answer with an empty body.
async function parse(response: Response) {
  if (!response.ok) {
    throw new Error(`PassSlot ${response.status}: ${(await response.text()).slice(0, 500)}`);
  }
  const text = await response.text();
  return text === "" ? { ok: true } : JSON.parse(text);
}

const passId = { passTypeIdentifier: string(), serialNumber: string() };
const pass = (i: { passTypeIdentifier: string; serialNumber: string }) =>
  `passes/${enc(i.passTypeIdentifier)}/${enc(i.serialNumber)}`;

const passslotTools = (account: Account, signal: AbortSignal) => {
  const get = (description: string, input: any, path: (i: any) => string) =>
    query({ description, input }, async ({ fetch }, i: any) =>
      parse(await fetch(`${base}/${path(i)}`, { signal, headers: headers(account) })),
    );
  const send = (
    method: "POST" | "PUT" | "DELETE",
    description: string,
    input: any,
    path: (i: any) => string,
    body?: (i: any) => unknown,
  ) =>
    mutation({ description, input, approval: always() }, async ({ fetch }, i: any) =>
      parse(
        await fetch(`${base}/${path(i)}`, {
          method,
          signal,
          headers: body ? { ...headers(account), "content-type": "application/json" } : headers(account),
          body: body ? JSON.stringify(body(i)) : undefined,
        }),
      ),
    );

  const id = { id: string() };
  const name = { name: string() };
  const values = record(string());
  const tid = object(id);

  return router({
    passes: router(
      {
        list: get("List descriptions of all created Wallet passes.", object({}), () => "passes"),
        listByType: get(
          "List the Wallet passes of one pass type ID (for example pass.com.example.card).",
          object({ passTypeIdentifier: string() }),
          (i) => `passes/${enc(i.passTypeIdentifier)}`,
        ),
        url: get("Get the short link to a Wallet pass.", object(passId), (i) => `${pass(i)}/url`),
        passJson: get("Get the full Wallet pass.json description of a pass.", object(passId), (i) => `${pass(i)}/passjson`),
        getValues: get("Get the placeholder values of a pass.", object(passId), (i) => `${pass(i)}/values`),
        getStatus: get("Get the status of a pass.", object(passId), (i) => `${pass(i)}/status`),
        getImages: get("List the images of a pass (template images are not included).", object(passId), (i) => `${pass(i)}/images`),
        getPrice: get("Get the custom price of a pass (Professional plan).", object(passId), (i) => `${pass(i)}/price`),
        email: send(
          "POST",
          "Email a pass to an address.",
          object({ ...passId, email: string() }),
          (i) => `${pass(i)}/email`,
          (i) => ({ email: i.email }),
        ),
        push: send(
          "POST",
          "Send a push update to a pass so Wallet refreshes it on the device.",
          object(passId),
          (i) => `${pass(i)}/push`,
        ),
        updateValues: send(
          "PUT",
          "Update the placeholder values of a pass. values maps placeholder names to strings.",
          object({ ...passId, values }),
          (i) => `${pass(i)}/values`,
          (i) => i.values,
        ),
        updateValue: send(
          "PUT",
          "Update one placeholder of a pass.",
          object({ ...passId, placeholderName: string(), value: string() }),
          (i) => `${pass(i)}/value/${enc(i.placeholderName)}`,
          (i) => ({ value: i.value }),
        ),
        updateStatus: send(
          "PUT",
          "Update the status of a pass, for example to void or redeem it. status is a JSON object as documented at https://www.passslot.com/developer/api/resources/updatePassStatus.",
          object({ ...passId, status: json() }),
          (i) => `${pass(i)}/status`,
          (i) => i.status,
        ),
        setPrice: send(
          "PUT",
          "Set the custom price of a pass (Professional plan). price is a JSON object as documented for the price resource.",
          object({ ...passId, price: json() }),
          (i) => `${pass(i)}/price`,
          (i) => i.price,
        ),
        deletePrice: send("DELETE", "Delete the custom price of a pass.", object(passId), (i) => `${pass(i)}/price`),
        deleteImages: send("DELETE", "Delete all images of a pass (template images are kept).", object(passId), (i) => `${pass(i)}/images`),
        delete: send("DELETE", "Delete a pass.", object(passId), pass),
      },
      { title: "Passes", description: "Look up, update, push, email and delete individual Wallet passes." },
    ),
    templates: router(
      {
        list: get("List all pass templates.", object({}), () => "templates"),
        get: get("Show one pass template.", tid, (i) => `templates/${enc(i.id)}`),
        url: get("Get the short distribution link of a template.", tid, (i) => `templates/${enc(i.id)}/url`),
        getImages: get("List the images of a template.", tid, (i) => `templates/${enc(i.id)}/images`),
        getActions: get("Get the redeem and reactivate actions of a template.", tid, (i) => `templates/${enc(i.id)}/actions`),
        getBranding: get("Get the branding settings of a template.", tid, (i) => `templates/${enc(i.id)}/branding`),
        getRestrictions: get("Get the distribution restrictions of a template.", tid, (i) => `templates/${enc(i.id)}/restrictions`),
        getPayment: get("Get the payment settings of a template (Professional plan).", tid, (i) => `templates/${enc(i.id)}/payment`),
        create: send(
          "POST",
          "Create a pass template. template is the JSON template description as documented at https://www.passslot.com/developer/api/resources/createTemplate.",
          object({ template: json() }),
          () => "templates",
          (i) => i.template,
        ),
        update: send(
          "PUT",
          "Update a pass template with a JSON template description.",
          object({ ...id, template: json() }),
          (i) => `templates/${enc(i.id)}`,
          (i) => i.template,
        ),
        updateActions: send(
          "PUT",
          "Update the redeem and reactivate actions and updateFields of a template.",
          object({ ...id, actions: json() }),
          (i) => `templates/${enc(i.id)}/actions`,
          (i) => i.actions,
        ),
        updateBranding: send(
          "PUT",
          "Update the branding settings of a template.",
          object({ ...id, branding: json() }),
          (i) => `templates/${enc(i.id)}/branding`,
          (i) => i.branding,
        ),
        updateRestrictions: send(
          "PUT",
          "Update the distribution restrictions of a template.",
          object({ ...id, restrictions: json() }),
          (i) => `templates/${enc(i.id)}/restrictions`,
          (i) => i.restrictions,
        ),
        updatePayment: send(
          "PUT",
          "Update the payment settings of a template (Professional plan).",
          object({ ...id, payment: json() }),
          (i) => `templates/${enc(i.id)}/payment`,
          (i) => i.payment,
        ),
        deleteImages: send("DELETE", "Delete all images of a template.", tid, (i) => `templates/${enc(i.id)}/images`),
        delete: send("DELETE", "Delete a pass template.", tid, (i) => `templates/${enc(i.id)}`),
      },
      { title: "Templates", description: "Manage pass templates, their actions, branding, restrictions and payment settings." },
    ),
    generate: router(
      {
        fromTemplate: send(
          "POST",
          "Create a pass from a template id. values maps the template's placeholder names to strings; returns serialNumber, passTypeIdentifier and a download url.",
          object({ ...id, values }),
          (i) => `templates/${enc(i.id)}/pass`,
          (i) => i.values,
        ),
        fromTemplateName: send(
          "POST",
          "Create a pass from a template looked up by name. values maps placeholder names to strings; returns serialNumber, passTypeIdentifier and a download url.",
          object({ ...name, values }),
          (i) => `templates/names/${enc(i.name)}/pass`,
          (i) => i.values,
        ),
      },
      { title: "Pass generation", description: "Issue new Wallet passes from templates." },
    ),
    passTypes: router(
      {
        list: get("List the pass type IDs available to the key.", object({}), () => "passtypes"),
        get: get("Show one pass type ID.", tid, (i) => `passtypes/${enc(i.id)}`),
      },
      { title: "Pass type IDs", description: "Pass type identifiers registered with Apple." },
    ),
    scanners: router(
      {
        list: get("List all scanners.", object({}), () => "scanners"),
        get: get("Show one scanner.", tid, (i) => `scanners/${enc(i.id)}`),
        create: send("POST", "Create a scanner from a JSON description.", object({ scanner: json() }), () => "scanners", (i) => i.scanner),
        update: send(
          "PUT",
          "Update a scanner with a JSON description.",
          object({ ...id, scanner: json() }),
          (i) => `scanners/${enc(i.id)}`,
          (i) => i.scanner,
        ),
        delete: send("DELETE", "Delete a scanner.", tid, (i) => `scanners/${enc(i.id)}`),
      },
      { title: "Scanners", description: "Manage pass scanners." },
    ),
  });
};

export default defineApp({ user: { accounts: { passslot: passslot.many() } }, icons }, async ({ user, signal }) => ({
  tools: router(await accountRouter(user?.accounts.passslot ?? [], (account) => passslotTools(account, signal), { signal }), {
    title: "PassSlot",
    description: "Create and manage Apple Wallet passes: templates, pass generation, values, status, push updates, pass type IDs and scanners.",
    icons,
  }),
}));
