import {
  accountRouter,
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

const base = "https://api.keyzy.io/v2";

const keyzy = defineProvider({
  name: "Keyzy",
  hosts: ["api.keyzy.io"],
  auth: {
    apiKey: secrets({
      label: "App key",
      fields: object({ appId: string({ minLength: 1 }), apiKey: string({ minLength: 1 }) }),
    }),
  },
  // Keyzy has no current-account endpoint and show-license answers 401 for a missing license too,
  // so the check calls the register-products lookup with a too-short serial: it writes nothing and
  // answers 422 (serial not valid) or 404 for a valid key, and 401 only for wrong credentials.
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/register-products/x?${credentials(account)}`, { signal, headers: headers() });
    if (response.status === 401) throw new Error("Keyzy rejected the app_id and api_key.");
    if (response.status >= 500) throw new Error(`Keyzy answered ${response.status}.`);
  },
});

type Account = { fields: { appId: string; apiKey: string } };

// Keyzy rejects requests without a User-Agent.
const headers = () => ({ "User-Agent": "Executor/1.0", Accept: "application/json" });

const credentials = (account: Account) =>
  new URLSearchParams({ app_id: account.fields.appId, api_key: account.fields.apiKey }).toString();

const clean = (values: Record<string, string | number | boolean | undefined>) =>
  Object.fromEntries(Object.entries(values).filter(([, value]) => value !== undefined));

const keyzyTools = (account: Account, signal: AbortSignal) => {
  const auth = { app_id: account.fields.appId, api_key: account.fields.apiKey };
  const send = (
    fetch: typeof globalThis.fetch,
    method: string,
    path: string,
    body: Record<string, string | number | boolean | undefined> = {},
  ) =>
    // DELETE carries its parameters in the query string; other methods send a JSON body.
    method === "DELETE"
      ? fetch(`${base}${path}?${new URLSearchParams(Object.entries({ ...clean(body), ...auth }).map(([k, v]) => [k, String(v)]))}`, {
          method,
          signal,
          headers: headers(),
        })
      : fetch(`${base}${path}`, {
          method,
          signal,
          headers: { ...headers(), "Content-Type": "application/json" },
          body: JSON.stringify({ ...clean(body), ...auth }),
        });
  const get = (fetch: typeof globalThis.fetch, path: string) =>
    fetch(`${base}${path}${path.includes("?") ? "&" : "?"}${credentials(account)}`, { signal, headers: headers() });
  const serial = (value: string) => encodeURIComponent(value);

  return router({
    statusCheck: query(
      { description: "Check that the Keyzy API is up. Returns the string Success.", input: object({}) },
      async ({ fetch }) => (await fetch(`${base}/status-check`, { signal, headers: headers() })).text(),
    ),
    showLicense: query(
      {
        description:
          "Show one license by serial number: SKU, dealer, licensee name and email, type (perpetual, subscription or trial), start and end timestamps and whether it is registered. Needs a read or write key.",
        input: object({ serial: string() }),
      },
      async ({ fetch }, { serial: value }) =>
        decodeJson(await get(fetch, `/licenses/show-license/${serial(value)}`), json()),
    ),
    validateLicense: query(
      {
        description:
          "Validate a license serial against a product code, without identifying a device. Returns the validation message and the licensee, SKU, product and version codes. version must be the constant 2.0 (the default). To validate for a specific device use validateLicenseForDevice, which may register an activation. Needs a read or write key.",
        input: object({ code: string(), serial: string(), version: string().optional() }),
      },
      async ({ fetch }, input) =>
        decodeJson(
          await send(fetch, "POST", "/licenses/valid", {
            code: input.code,
            serial: input.serial,
            version: input.version ?? "2.0",
          }),
          json(),
        ),
    ),
    validateLicenseForDevice: mutation(
      {
        description:
          "Validate a license serial for a device by sending host_id (and optionally device_tag, an OS and bit-width label such as Windows 10__64bits). Keyzy may create or refresh an activation and use a device slot. version must be the constant 2.0 (the default). Needs a read or write key.",
        input: object({
          code: string(),
          serial: string(),
          hostId: string(),
          deviceTag: string().optional(),
          version: string().optional(),
        }),
        approval: always(),
      },
      async ({ fetch }, input) =>
        decodeJson(
          await send(fetch, "POST", "/licenses/valid", {
            code: input.code,
            serial: input.serial,
            version: input.version ?? "2.0",
            host_id: input.hostId,
            device_tag: input.deviceTag,
          }),
          json(),
        ),
    ),
    getEncryptedLicenseFile: mutation(
      {
        description:
          "Validate a license and return the encrypted license file for a product code, as used by the Keyzy C++ client library. hostId must be set for that library and registers the device as an activation. device_tag is an OS and bit-width label such as Windows 10__64bits.",
        input: object({
          code: string(),
          serial: string(),
          hostId: string().optional(),
          deviceTag: string().optional(),
        }),
        approval: always(),
      },
      async ({ fetch }, input) =>
        (
          await send(fetch, "POST", "/licenses/encrypted-file", {
            code: input.code,
            serial: input.serial,
            host_id: input.hostId,
            device_tag: input.deviceTag,
          })
        ).text(),
    ),
    listLicenseProducts: query(
      {
        description:
          "List the products attached to a license serial, with each product's code, key, signatures, active flag and max_host_count. Needs a write key.",
        input: object({ serial: string() }),
      },
      async ({ fetch }, input) => decodeJson(await send(fetch, "POST", "/licenses/products", input), json()),
    ),
    registerLicense: mutation(
      {
        description:
          "Create a license for a customer from a SKU and return its serial number. Keyzy emails the customer when the SKU has that setting on. type is perpetual, subscription or trial and defaults to the SKU's type; subscription and trial licenses require startAt and endAt as Unix timestamps in seconds. Needs a write key and a free license generated for the SKU.",
        input: object({
          skuNumber: string(),
          name: string(),
          email: string(),
          type: string().optional(),
          startAt: number().optional(),
          endAt: number().optional(),
        }),
        approval: always(),
      },
      async ({ fetch }, input) =>
        decodeJson(
          await send(fetch, "POST", "/licenses/register", {
            sku_number: input.skuNumber,
            name: input.name,
            email: input.email,
            type: input.type,
            start_at: input.startAt,
            end_at: input.endAt,
          }),
          json(),
        ),
    ),
    updateLicenseSku: mutation(
      {
        description:
          "Move a license to another SKU. The new SKU's type overwrites the license's type, so a subscription or trial SKU may need updateLicenseTime afterwards. Needs a write key.",
        input: object({ serial: string(), currentSkuNumber: string(), newSkuNumber: string() }),
        approval: always(),
      },
      async ({ fetch }, input) =>
        decodeJson(
          await send(fetch, "POST", "/licenses/update-sku", {
            serial: input.serial,
            current_sku_number: input.currentSkuNumber,
            new_sku_number: input.newSkuNumber,
          }),
          json(),
        ),
    ),
    updateLicenseTime: mutation(
      {
        description:
          "Set the start and end time of a subscription or trial license. startAt and endAt are Unix timestamps in seconds; startAt is optional. Needs a write key.",
        input: object({ serial: string(), endAt: number(), startAt: number().optional() }),
        approval: always(),
      },
      async ({ fetch }, input) =>
        decodeJson(
          await send(fetch, "POST", "/licenses/update-time", {
            serial: input.serial,
            end_at: input.endAt,
            start_at: input.startAt,
          }),
          json(),
        ),
    ),
    upgradeLicense: mutation(
      {
        description:
          "Upgrade a license by exchanging currentSerial for upgradeSerial. On success the current license is deleted and the upgrade license becomes available to activate. The pair must be an allowed upgrade path.",
        input: object({ currentSerial: string(), upgradeSerial: string() }),
        approval: always(),
      },
      async ({ fetch }, input) =>
        decodeJson(
          await send(fetch, "POST", "/licenses/upgrade", {
            current_serial: input.currentSerial,
            upgrade_serial: input.upgradeSerial,
          }),
          json(),
        ),
    ),
    deleteLicense: mutation(
      {
        description:
          "Delete a license and all of its activations by serial number. type (perpetual, subscription or trial) must match the license's actual type or nothing is deleted. Needs a write key.",
        input: object({ serial: string(), type: string() }),
        approval: always(),
      },
      async ({ fetch }, input) => decodeJson(await send(fetch, "DELETE", "/licenses/destroy-serial", input), json()),
    ),
    checkRegisterProductsSerial: query(
      {
        description:
          "Step 1 of registering an offline (dealer) license: check that a serial is unregistered and return its license and product details. Writes nothing. Needs a read or write key.",
        input: object({ serial: string() }),
      },
      async ({ fetch }, { serial: value }) =>
        decodeJson(await get(fetch, `/register-products/${serial(value)}`), json()),
    ),
    submitRegisterProducts: mutation(
      {
        description:
          "Step 2 of registering an offline (dealer) license: set the owner's email (and optionally name) for a serial and mark it registered. Run checkRegisterProductsSerial first.",
        input: object({ serial: string(), skuNumber: string(), email: string(), name: string().optional() }),
        approval: always(),
      },
      async ({ fetch }, input) =>
        decodeJson(
          await send(fetch, "PUT", `/register-products/${serial(input.serial)}`, {
            sku_number: input.skuNumber,
            email: input.email,
            name: input.name,
          }),
          json(),
        ),
    ),
    listActivations: query(
      {
        description:
          "List the device activations of a license serial: activation id, host_id, device_tag, activated flag, product and SKU. Use the id with updateActivation or deleteActivation. Needs a read or write key.",
        input: object({ serial: string() }),
      },
      async ({ fetch }, { serial: value }) => decodeJson(await get(fetch, `/activations/${serial(value)}`), json()),
    ),
    updateActivation: mutation(
      {
        description:
          "Activate or deactivate one activation by id (from listActivations) by setting its activated flag. Needs a write key.",
        input: object({ id: string(), activated: boolean() }),
        approval: always(),
      },
      async ({ fetch }, input) =>
        decodeJson(await send(fetch, "PUT", `/activations/${serial(input.id)}`, { activated: input.activated }), json()),
    ),
    deleteActivation: mutation(
      {
        description:
          "Delete one activation by id (from listActivations), freeing the seat while keeping the license. Needs a write key.",
        input: object({ id: string() }),
        approval: always(),
      },
      async ({ fetch }, input) => decodeJson(await send(fetch, "DELETE", `/activations/${serial(input.id)}`), json()),
    ),
  });
};

export default defineApp(
  { user: { accounts: { keyzy: keyzy.many() } }, icons },
  async ({ user, signal }) => ({
    tools: router(
      await accountRouter(user?.accounts.keyzy ?? [], (account) => keyzyTools(account, signal), { signal }),
      {
        title: "Keyzy",
        description: "Software licensing: register, validate, upgrade and delete licenses, and manage device activations.",
        icons,
      },
    ),
  }),
);
