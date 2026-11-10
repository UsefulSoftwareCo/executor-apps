import {
  accountRouter,
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

const base = "https://cloud.boltiot.com/remote";

const invalidKey = "Invalid API key";

// Bolt answers HTTP 200 with { success: 0|"0", value } for failures, so every body must be checked.
const failure = (body: unknown): string | undefined => {
  if (typeof body !== "object" || body === null || !("success" in body)) return undefined;
  if (String(body.success) !== "0") return undefined;
  return "value" in body ? String(body.value) : "unknown error";
};

const boltiot = defineProvider({
  name: "Bolt IoT",
  hosts: ["cloud.boltiot.com"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // Bolt has no account-level endpoint. A read-only version call against a placeholder device is
  // rejected with "Invalid API key" for a bad key; any other reply means the key was accepted.
  async health({ account, fetch, signal }) {
    const response = await fetch(
      `${base}/${encodeURIComponent(account.fields.token)}/version?${search({ deviceName: "BOLT0" })}`,
      { signal },
    );
    if (!response.ok) throw new Error(`Bolt Cloud returned HTTP ${response.status}`);
    const body = await decodeJson(response, json());
    if (failure(body) === invalidKey) throw new Error(invalidKey);
  },
});

type Account = { fields: { token: string } };

const search = (params: Record<string, string | number | undefined>) => {
  const out = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) if (value !== undefined) out.set(key, String(value));
  return out.toString();
};

const device = { deviceName: string() };
const deviceHint = "deviceName is the Bolt device id, for example BOLT12345678.";

const boltiotTools = (account: Account, signal: AbortSignal) => {
  const call = async (
    fetch: typeof globalThis.fetch,
    command: string,
    params: Record<string, string | number | undefined>,
  ) => {
    const response = await fetch(`${base}/${encodeURIComponent(account.fields.token)}/${command}?${search(params)}`, {
      signal,
    });
    if (response.status === 429) throw new Error(`Bolt Cloud ${command} was rate limited (HTTP 429)`);
    if (!response.ok) throw new Error(`Bolt Cloud ${command} failed with HTTP ${response.status}`);
    const body = await decodeJson(response, json());
    const message = failure(body);
    if (message !== undefined) throw new Error(`Bolt Cloud ${command} failed: ${message}`);
    return body;
  };
  return router({
    isOnline: query(
      {
        description: `Check whether a Bolt device is online (not on the vendor docs page; observed in third-party clients). Returns { success, value } where value is "1" when online. ${deviceHint}`,
        input: object(device),
      },
      async ({ fetch }, input) => call(fetch, "isOnline", input),
    ),
    isAlive: query(
      {
        description: `Check device connectivity. Returns value "alive" or "dead". ${deviceHint}`,
        input: object(device),
      },
      async ({ fetch }, input) => call(fetch, "isAlive", input),
    ),
    version: query(
      {
        description: `Get the Bolt hardware version and firmware version of a device. ${deviceHint}`,
        input: object(device),
      },
      async ({ fetch }, input) => call(fetch, "version", input),
    ),
    digitalRead: query(
      {
        description: `Read a digital pin. pin is 0-7 or A0-A3. value is "1" (high) or "0" (low). ${deviceHint}`,
        input: object({ ...device, pin: string() }),
      },
      async ({ fetch }, input) => call(fetch, "digitalRead", input),
    ),
    analogRead: query(
      {
        description: `Read an analog pin, returning a 10-bit value from 0 to 1023. pin is 0-7 or A0-A3 per the vendor docs (the vendor example uses A0). ${deviceHint}`,
        input: object({ ...device, pin: string().default("A0") }),
      },
      async ({ fetch }, input) => call(fetch, "analogRead", input),
    ),
    serialRead: query(
      {
        description: `Read data received on the device's serial Rx pin. Optional till is a terminator character: reading stops when it is seen. Call serialBegin first. ${deviceHint}`,
        input: object({ ...device, till: string().optional() }),
      },
      async ({ fetch }, input) => call(fetch, "serialRead", input),
    ),
    digitalWrite: mutation(
      {
        description: `Set a digital pin HIGH (5V) or LOW (0V) on a device. pin is 0-7 or A0-A3, state is HIGH or LOW. ${deviceHint}`,
        input: object({ ...device, pin: string(), state: string() }),
        approval: always(),
      },
      async ({ fetch }, input) => call(fetch, "digitalWrite", input),
    ),
    analogWrite: mutation(
      {
        description: `Write a PWM value from 0 to 255 to a pin (the vendor docs give pin as 1-5). ${deviceHint}`,
        input: object({ ...device, pin: string(), value: number() }),
        approval: always(),
      },
      async ({ fetch }, input) => call(fetch, "analogWrite", input),
    ),
    serialBegin: mutation(
      {
        description: `Start serial (UART) communication at a baud-rate code from 0 to 3; the vendor documents 2 as 9600 baud. Call before serialWrite or serialRead. ${deviceHint}`,
        input: object({ ...device, baud: number() }),
        approval: always(),
      },
      async ({ fetch }, input) => call(fetch, "serialBegin", input),
    ),
    serialWrite: mutation(
      {
        description: `Send an ASCII string over the device's serial Tx pin. Call serialBegin first. ${deviceHint}`,
        input: object({ ...device, data: string() }),
        approval: always(),
      },
      async ({ fetch }, input) => call(fetch, "serialWrite", input),
    ),
    serialWriteRead: mutation(
      {
        description: `Send an ASCII string over serial and read the reply in one call (serialWR, not on the vendor docs page; observed in third-party clients). Optional till is a terminator character for the reply. Call serialBegin first. ${deviceHint}`,
        input: object({ ...device, data: string(), till: string().optional() }),
        approval: always(),
      },
      async ({ fetch }, input) => call(fetch, "serialWR", input),
    ),
    restart: mutation(
      {
        description: `Restart a Bolt device. ${deviceHint}`,
        input: object(device),
        approval: always(),
      },
      async ({ fetch }, input) => call(fetch, "restart", input),
    ),
  });
};

export default defineApp({ user: { accounts: { boltiot: boltiot.many() } }, icons }, async ({ user, signal }) => ({
  tools: router(await accountRouter(user?.accounts.boltiot ?? [], (account) => boltiotTools(account, signal), { signal }), {
    title: "Bolt IoT",
    description: "Control Bolt IoT devices through Bolt Cloud: read and write pins, serial I/O, device status, version and restart.",
    icons,
  }),
}));
