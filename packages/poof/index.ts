import {
  accountRouter,
  array,
  decodeJson,
  defineApp,
  defineProvider,
  json,
  mutation,
  object,
  query,
  router,
  secrets,
  string,
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const origin = "https://www.poof.io";

const poof = defineProvider({
  name: "Poof",
  hosts: ["www.poof.io"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // Poof has no account endpoint; listing transactions is a read-only call that needs a valid key.
  async health({ account, fetch, signal }) {
    const response = await fetch(`${origin}/api/v1/fetch_transactions`, {
      method: "POST",
      signal,
      headers: { Authorization: account.fields.token, "Content-Type": "application/json" },
      body: "{}",
    });
    await decodeJson(response, json());
  },
});

const Empty = object({});
const Crypto = string({ minLength: 1 });
const Metadata = json();

export default defineApp(
  { user: { accounts: { poof: poof.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.poof ?? [],
        (account) => {
          // Poof takes the API key as the raw Authorization header (no Bearer prefix) and POSTs JSON everywhere.
          const post = async (path: string, body: Record<string, unknown>) =>
            decodeJson(
              await fetch(`${origin}${path}`, {
                method: "POST",
                signal,
                headers: { Authorization: account.fields.token, "Content-Type": "application/json" },
                body: JSON.stringify(body),
              }),
              json(),
            );
          return router({
            crypto: router(
              {
                balance: query(
                  { description: "Get the current balance of your Poof wallet for a coin (for example bitcoin, ethereum).", input: object({ crypto: Crypto }) },
                  async (_ctx, input) => post("/api/v1/balance", input),
                ),
                createDepositAddress: mutation(
                  {
                    description:
                      "Create a unique deposit address from your HD wallet for a USD amount in a cryptocurrency. Poof watches it for payments and returns the address, crypto amount and rate.",
                    input: object({ amount: string({ minLength: 1 }), crypto: Crypto, currency: string({ minLength: 1 }).optional(), metadata: Metadata.optional() }),
                    approval: always(),
                  },
                  async (_ctx, input) => post("/api/v2/create_charge", input),
                ),
                createPaymentLink: mutation(
                  {
                    description: "Create a shareable crypto payment link (invoice) for a USD amount in a cryptocurrency.",
                    input: object({ amount: string({ minLength: 1 }), crypto: Crypto, currency: string({ minLength: 1 }).optional(), redirect: string({ minLength: 1 }).optional(), metadata: Metadata }),
                    approval: always(),
                  },
                  async (_ctx, input) => post("/api/v1/create_invoice", input),
                ),
                createWallet: mutation(
                  {
                    description: "Create an HD wallet for a network (for example bitcoin, polygon, ethereum). Each account is limited to one wallet per network.",
                    input: object({ currency: Crypto }),
                    approval: always(),
                  },
                  async (_ctx, input) => post("/api/v2/create_wallet", input),
                ),
                sendPayout: mutation(
                  {
                    description: "Send cryptocurrency from your Poof wallet to an external address. Moves real funds.",
                    input: object({ amount: string({ minLength: 1 }), crypto: Crypto, address: string({ minLength: 1 }) }),
                    approval: always(),
                  },
                  async (_ctx, input) => post("/api/v1/payouts", input),
                ),
              },
              { title: "Crypto", description: "Prices, gas, wallet balances, deposit addresses, payment links and payouts." },
            ),
            fiat: router(
              {
                createCharge: mutation(
                  {
                    description: "Start a one-time fiat charge through a gateway such as paypal, stripe or square. Returns a payment link, QR code and tracking id.",
                    input: object({
                      amount: string({ minLength: 1 }),
                      payment: string({ minLength: 1 }),
                      currency: string({ minLength: 1 }),
                      redirect_url: string({ minLength: 1 }),
                      success_url: string({ minLength: 1 }),
                    }),
                    approval: always(),
                  },
                  async (_ctx, input) => post("/api/v1/create_fiat_charge", input),
                ),
                createInvoice: mutation(
                  {
                    description: "Create a fiat invoice paid through a processor such as paypal, cashapp, skrill or coinbase. Returns a checkout URL.",
                    input: object({
                      amount: string({ minLength: 1 }),
                      payment: string({ minLength: 1 }),
                      currency: string({ minLength: 1 }),
                      redirect_url: string({ minLength: 1 }),
                      success_url: string({ minLength: 1 }),
                    }),
                    approval: always(),
                  },
                  async (_ctx, input) => post("/api/v1/create_fiat_invoice", input),
                ),
                createCheckout: mutation(
                  {
                    description: "Create a hosted Poof checkout session for a merchant username and amount, returning a payment link.",
                    input: object({
                      username: string({ minLength: 1 }),
                      amount: string({ minLength: 1 }),
                      fields: array(string()).optional(),
                      disable_payments: array(string()).optional(),
                      success_url: string().optional(),
                      redirect: string().optional(),
                      product_id: string().optional(),
                      product_quantity: string().optional(),
                      instant_payment_notification: string().optional(),
                      default: json().optional(),
                      metadata: Metadata.optional(),
                    }),
                    approval: always(),
                  },
                  async (_ctx, input) => post("/api/v1/checkout", input),
                ),
              },
              { title: "Fiat", description: "Fiat charges, invoices and hosted checkouts." },
            ),
            webhooks: router(
              {
                create: mutation(
                  {
                    description: "Subscribe an HTTPS endpoint to Poof payment notifications. Poof limits the number of webhooks per account.",
                    input: object({ url: string({ minLength: 1 }) }),
                    approval: always(),
                  },
                  async (_ctx, input) => post("/api/v1/create_webhook", input),
                ),
              },
              { title: "Webhooks", description: "Webhook subscriptions." },
            ),
            transactions: router(
              {
                list: query(
                  { description: "List all transactions on the account.", input: Empty },
                  async () => post("/api/v1/fetch_transactions", {}),
                ),
                get: query(
                  { description: "Fetch one transaction by id.", input: object({ transaction: string({ minLength: 1 }) }) },
                  async (_ctx, input) => post("/api/v1/transaction", input),
                ),
              },
              { title: "Transactions", description: "Transaction history." },
            ),
          });
        },
        { signal },
      ),
      {
        title: "Poof",
        description: "Poof payments: crypto and fiat charges, invoices, checkouts, deposit addresses, payouts, webhooks and transaction history.",
        icons,
      },
    ),
  }),
);
