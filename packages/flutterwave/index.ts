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

const base = "https://api.flutterwave.com/v3";

const flutterwave = defineProvider({
  name: "Flutterwave",
  hosts: ["api.flutterwave.com"],
  auth: {
    apiKey: secrets({
      label: "Secret key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // Reading wallet balances needs only the secret key and changes nothing.
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/balances`, {
      signal,
      headers: { Authorization: `Bearer ${account.fields.token}`, Accept: "application/json" },
    });
    await decodeJson(response, object({ status: string() }));
  },
});

type Account = { fields: { token: string } };

const qs = (params: Record<string, string | number | undefined>) => {
  const out = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) if (value !== undefined) out.set(key, String(value));
  const text = out.toString();
  return text === "" ? "" : `?${text}`;
};

const pathPart = (value: string | number) => encodeURIComponent(String(value));

const Page = { page: number().optional() };
const Range = { from: string().optional(), to: string().optional() };
const RequiredRange = { from: string(), to: string() };
const Id = object({ id: string() });

const flutterwaveTools = (account: Account, signal: AbortSignal) => {
  const headers = {
    Authorization: `Bearer ${account.fields.token}`,
    Accept: "application/json",
    "Content-Type": "application/json",
  };
  const call = async (
    fetch: typeof globalThis.fetch,
    method: "GET" | "POST" | "PUT" | "DELETE",
    path: string,
    params: Record<string, string | number | undefined> = {},
    body?: unknown,
  ) =>
    decodeJson(
      await fetch(`${base}${path}${qs(params)}`, {
        method,
        signal,
        headers,
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      }),
      json(),
    );

  return router(
    {
      transactions: router(
        {
          list: query(
            {
              description:
                "List transactions, newest first. from and to (YYYY-MM-DD) are required; filter further by customer_email, customer_fullname, status (successful, failed, pending), tx_ref, currency; page from 1.",
              input: object({
                ...Page,
                ...RequiredRange,
                customer_email: string().optional(),
                customer_fullname: string().optional(),
                status: string().optional(),
                tx_ref: string().optional(),
                currency: string().optional(),
              }),
            },
            async ({ fetch }, input) => call(fetch, "GET", "/transactions", input),
          ),
          verify: query(
            { description: "Verify a transaction by its numeric Flutterwave transaction id.", input: Id },
            async ({ fetch }, { id }) => call(fetch, "GET", `/transactions/${pathPart(id)}/verify`),
          ),
          verifyByReference: query(
            {
              description: "Verify a transaction by your own tx_ref.",
              input: object({ tx_ref: string() }),
            },
            async ({ fetch }, input) => call(fetch, "GET", "/transactions/verify_by_reference", input),
          ),
          timeline: query(
            { description: "Get the event timeline of a transaction by id.", input: Id },
            async ({ fetch }, { id }) => call(fetch, "GET", `/transactions/${pathPart(id)}/events`),
          ),
          fee: query(
            {
              description:
                "Get the fee for a transaction amount in a currency (both required). payment_type is for example card, debit_ng_account, mobilemoney; card_first6digits refines card fees.",
              input: object({
                amount: number(),
                currency: string(),
                payment_type: string().optional(),
                card_first6digits: string().optional(),
              }),
            },
            async ({ fetch }, input) => call(fetch, "GET", "/transactions/fee", input),
          ),
        },
        { title: "Transactions", description: "List, verify and inspect transactions." },
      ),
      refunds: router(
        {
          list: query(
            {
              description: "List refunds. Filter by from/to, status, currency, flw_ref or transaction id.",
              input: object({
                ...Range,
                status: string().optional(),
                currency: string().optional(),
                flw_ref: string().optional(),
                id: string().optional(),
              }),
            },
            async ({ fetch }, input) => call(fetch, "GET", "/refunds", input),
          ),
          get: query(
            { description: "Get one refund by id.", input: Id },
            async ({ fetch }, { id }) => call(fetch, "GET", `/refunds/${pathPart(id)}`),
          ),
          create: mutation(
            {
              description:
                "Refund a transaction by its id. Omit amount for a full refund. Moves money back to the customer.",
              input: object({ id: string(), amount: number().optional() }),
              approval: always(),
            },
            async ({ fetch }, { id, amount }) =>
              call(fetch, "POST", `/transactions/${pathPart(id)}/refund`, {}, amount === undefined ? {} : { amount }),
          ),
        },
        { title: "Refunds", description: "List and create refunds." },
      ),
      paymentLinks: router(
        {
          create: mutation(
            {
              description:
                "Create a hosted payment link. body needs tx_ref, amount and customer { email, name, phonenumber }; optional currency, redirect_url, payment_options, meta, customizations, configuration, link_expiration, payment_plan, subaccounts. Returns data.link.",
              input: object({ body: json() }),
              approval: always(),
            },
            async ({ fetch }, { body }) => call(fetch, "POST", "/payments", {}, body),
          ),
        },
        { title: "Payment links", description: "Create hosted payment links." },
      ),
      charges: router(
        {
          create: mutation(
            {
              description:
                "Start a direct charge (POST /charges?type=...). type is the payment method: bank_transfer, mono (Nigerian bank account), ussd, mpesa, mobile_money_ghana, mobile_money_uganda, mobile_money_rwanda, mobile_money_tanzania, mobile_money_zambia, mobile_money_franco, ach_payment, account-ach-uk, qr, voucher_payment, fawry_pay. body is the method's payload (tx_ref, amount, currency, email and method-specific fields such as phone_number or network). Card charges need client-side encryption and are not supported here.",
              input: object({ type: string(), body: json() }),
              approval: always(),
            },
            async ({ fetch }, { type, body }) => call(fetch, "POST", "/charges", { type }, body),
          ),
          validate: mutation(
            {
              description:
                "Complete a charge that needs an OTP. body needs otp and flw_ref; optional type (card, account).",
              input: object({ body: json() }),
              approval: always(),
            },
            async ({ fetch }, { body }) => call(fetch, "POST", "/validate-charge", {}, body),
          ),
        },
        { title: "Charges", description: "Direct charges (non-card payment methods) and charge validation." },
      ),
      transfers: router(
        {
          list: query(
            {
              description: "List transfers. Filter by reference, status (NEW, PENDING, SUCCESSFUL, FAILED), from/to; page from 1.",
              input: object({ ...Page, ...Range, reference: string().optional(), status: string().optional() }),
            },
            async ({ fetch }, input) => call(fetch, "GET", "/transfers", input),
          ),
          get: query(
            { description: "Get one transfer by id.", input: Id },
            async ({ fetch }, { id }) => call(fetch, "GET", `/transfers/${pathPart(id)}`),
          ),
          fee: query(
            {
              description: "Get transfer fees for an amount and currency. type is account or mobilemoney.",
              input: object({ amount: number(), currency: string(), type: string().optional() }),
            },
            async ({ fetch }, input) => call(fetch, "GET", "/transfers/fee", input),
          ),
          rates: query(
            {
              description: "Get the exchange rate for a cross-currency transfer.",
              input: object({ amount: number(), destination_currency: string(), source_currency: string() }),
            },
            async ({ fetch }, input) => call(fetch, "GET", "/transfers/rates", input),
          ),
          create: mutation(
            {
              description:
                "Send a payout. body needs account_bank, account_number, amount, currency; optional narration, reference, beneficiary_name, debit_currency, callback_url, meta. Moves real money out of the wallet.",
              input: object({ body: json() }),
              approval: always(),
            },
            async ({ fetch }, { body }) => call(fetch, "POST", "/transfers", {}, body),
          ),
          createBulk: mutation(
            {
              description: "Send many payouts at once. The vendor reference page lists currency and bulk_data as required and title, error_reporting as optional, but its bulk_data item schema (email, mobile_number, recipient_address) disagrees with the Bulk Transfers guide, which shows bulk_data items for bank payouts as { bank_code, account_number, amount, currency, narration }. Send currency and bulk_data, plus an optional title; follow the guide for bank items.",
              input: object({ body: json() }),
              approval: always(),
            },
            async ({ fetch }, { body }) => call(fetch, "POST", "/bulk-transfers", {}, body),
          ),
          retry: mutation(
            { description: "Retry a failed transfer by id.", input: Id, approval: always() },
            async ({ fetch }, { id }) => call(fetch, "POST", `/transfers/${pathPart(id)}/retries`),
          ),
        },
        { title: "Transfers", description: "Payouts to bank accounts and mobile money wallets." },
      ),
      beneficiaries: router(
        {
          list: query(
            { description: "List transfer beneficiaries.", input: object({ ...Page }) },
            async ({ fetch }, input) => call(fetch, "GET", "/beneficiaries", input),
          ),
          get: query(
            { description: "Get one beneficiary by id.", input: Id },
            async ({ fetch }, { id }) => call(fetch, "GET", `/beneficiaries/${pathPart(id)}`),
          ),
          create: mutation(
            {
              description: "Create a beneficiary. body needs account_number, account_bank and beneficiary_name; optional currency, bank_name.",
              input: object({ body: json() }),
              approval: always(),
            },
            async ({ fetch }, { body }) => call(fetch, "POST", "/beneficiaries", {}, body),
          ),
          delete: mutation(
            { description: "Delete a beneficiary by id.", input: Id, approval: always() },
            async ({ fetch }, { id }) => call(fetch, "DELETE", `/beneficiaries/${pathPart(id)}`),
          ),
        },
        { title: "Beneficiaries", description: "Saved transfer recipients." },
      ),
      paymentPlans: router(
        {
          list: query(
            {
              description: "List payment plans. Filter by from, to, status, interval, amount, currency; page from 1.",
              input: object({
                ...Page,
                ...Range,
                status: string().optional(),
                interval: string().optional(),
                amount: number().optional(),
                currency: string().optional(),
              }),
            },
            async ({ fetch }, input) => call(fetch, "GET", "/payment-plans", input),
          ),
          get: query(
            { description: "Get a payment plan by id.", input: Id },
            async ({ fetch }, { id }) => call(fetch, "GET", `/payment-plans/${pathPart(id)}`),
          ),
          create: mutation(
            {
              description: "Create a payment plan. body needs amount, name and interval (hourly, daily, weekly, monthly, quarterly, yearly); optional duration, currency.",
              input: object({ body: json() }),
              approval: always(),
            },
            async ({ fetch }, { body }) => call(fetch, "POST", "/payment-plans", {}, body),
          ),
          update: mutation(
            {
              description: "Update a payment plan. body may set name and status.",
              input: object({ id: string(), body: json() }),
              approval: always(),
            },
            async ({ fetch }, { id, body }) => call(fetch, "PUT", `/payment-plans/${pathPart(id)}`, {}, body),
          ),
          cancel: mutation(
            { description: "Cancel a payment plan by id.", input: Id, approval: always() },
            async ({ fetch }, { id }) => call(fetch, "PUT", `/payment-plans/${pathPart(id)}/cancel`),
          ),
        },
        { title: "Payment plans", description: "Recurring billing plans." },
      ),
      subscriptions: router(
        {
          list: query(
            {
              description: "List subscriptions. Filter by email, transaction_id, plan, subscribed_from, subscribed_to, next_due_from, next_due_to, status, page.",
              input: object({
                ...Page,
                email: string().optional(),
                transaction_id: string().optional(),
                plan: string().optional(),
                subscribed_from: string().optional(),
                subscribed_to: string().optional(),
                next_due_from: string().optional(),
                next_due_to: string().optional(),
                status: string().optional(),
              }),
            },
            async ({ fetch }, input) => call(fetch, "GET", "/subscriptions", input),
          ),
          cancel: mutation(
            { description: "Cancel a subscription by id.", input: Id, approval: always() },
            async ({ fetch }, { id }) => call(fetch, "PUT", `/subscriptions/${pathPart(id)}/cancel`),
          ),
          activate: mutation(
            { description: "Reactivate a cancelled subscription by id.", input: Id, approval: always() },
            async ({ fetch }, { id }) => call(fetch, "PUT", `/subscriptions/${pathPart(id)}/activate`),
          ),
        },
        { title: "Subscriptions", description: "Customer subscriptions to payment plans." },
      ),
      subaccounts: router(
        {
          list: query(
            {
              description: "List collection subaccounts. Filter by account_bank, account_number, bank_name; page from 1.",
              input: object({
                ...Page,
                account_bank: string().optional(),
                account_number: string().optional(),
                bank_name: string().optional(),
              }),
            },
            async ({ fetch }, input) => call(fetch, "GET", "/subaccounts", input),
          ),
          get: query(
            { description: "Get a subaccount by id.", input: Id },
            async ({ fetch }, { id }) => call(fetch, "GET", `/subaccounts/${pathPart(id)}`),
          ),
          create: mutation(
            {
              description: "Create a subaccount. body needs account_bank, account_number, business_name, business_mobile, country, split_type and split_value.",
              input: object({ body: json() }),
              approval: always(),
            },
            async ({ fetch }, { body }) => call(fetch, "POST", "/subaccounts", {}, body),
          ),
          update: mutation(
            { description: "Update a subaccount by id with the fields in body.", input: object({ id: string(), body: json() }), approval: always() },
            async ({ fetch }, { id, body }) => call(fetch, "PUT", `/subaccounts/${pathPart(id)}`, {}, body),
          ),
          delete: mutation(
            { description: "Delete a subaccount by id.", input: Id, approval: always() },
            async ({ fetch }, { id }) => call(fetch, "DELETE", `/subaccounts/${pathPart(id)}`),
          ),
        },
        { title: "Subaccounts", description: "Collection subaccounts for split payments." },
      ),
      payoutSubaccounts: router(
        {
          list: query(
            {
              description: "List payout subaccounts with cursor pagination (limit, next_cursor). Filter by email, account_reference or nuban.",
              input: object({
                limit: number().optional(),
                next_cursor: string().optional(),
                email: string().optional(),
                account_reference: string().optional(),
                nuban: string().optional(),
              }),
            },
            async ({ fetch }, input) => call(fetch, "GET", "/payout-subaccounts", input),
          ),
          listReversals: query(
            {
              description: "Query wallet funding reversals and refunds (GET /payout-subaccounts/refunds). Filter by status (SUCCESSFUL, PENDING, FAILED), from, to (YYYY-MM-DD), reference.",
              input: object({ ...Range, status: string().optional(), reference: string().optional() }),
            },
            async ({ fetch }, input) => call(fetch, "GET", "/payout-subaccounts/refunds", input),
          ),
          initiateRefund: mutation(
            {
              description: "Initiate a wallet refund (POST /payout-subaccounts/refunds) for a funding_reference; optional debit_currency. Moves money.",
              input: object({ body: json() }),
              approval: always(),
            },
            async ({ fetch }, { body }) => call(fetch, "POST", "/payout-subaccounts/refunds", {}, body),
          ),
        },
        { title: "Payout subaccounts", description: "Payout subaccounts." },
      ),
      virtualAccounts: router(
        {
          get: query(
            { description: "Get a virtual account number by its order_ref.", input: object({ order_ref: string() }) },
            async ({ fetch }, { order_ref }) => call(fetch, "GET", `/virtual-account-numbers/${pathPart(order_ref)}`),
          ),
          create: mutation(
            {
              description: "Create a virtual account number. body needs email and amount (amount is required by the reference); optional currency (NGN or GHS), is_permanent, expires, bvn, nin, tx_ref, firstname, lastname, narration, phonenumber, bank_code.",
              input: object({ body: json() }),
              approval: always(),
            },
            async ({ fetch }, { body }) => call(fetch, "POST", "/virtual-account-numbers", {}, body),
          ),
          createBulk: mutation(
            {
              description: "Create virtual account numbers in bulk. body needs batch_ref and bulk_data (list of { email, firstname, lastname, bvn, is_permanent }); optional narration, currency (NGN or GHS).",
              input: object({ body: json() }),
              approval: always(),
            },
            async ({ fetch }, { body }) => call(fetch, "POST", "/bulk-virtual-account-numbers", {}, body),
          ),
          getBulk: query(
            { description: "Get a bulk virtual account batch by batch_id.", input: object({ batch_id: string() }) },
            async ({ fetch }, { batch_id }) => call(fetch, "GET", `/bulk-virtual-account-numbers/${pathPart(batch_id)}`),
          ),
        },
        { title: "Virtual accounts", description: "Virtual account numbers for collections." },
      ),
      tokenizedCharges: router(
        {
          getBulk: query(
            { description: "Get a bulk tokenized charge batch by bulk_id.", input: object({ bulk_id: string() }) },
            async ({ fetch }, { bulk_id }) => call(fetch, "GET", `/bulk-tokenized-charges/${pathPart(bulk_id)}`),
          ),
          createBulk: mutation(
            {
              description: "Charge many saved card tokens. body needs retry_strategy { retry_interval, retry_amount_variable, retry_attempt_variable } and bulk_data (items with token, currency, country, amount, email, tx_ref); optional title.",
              input: object({ body: json() }),
              approval: always(),
            },
            async ({ fetch }, { body }) => call(fetch, "POST", "/bulk-tokenized-charges", {}, body),
          ),
        },
        { title: "Tokenized charges", description: "Recurring charges against saved card tokens." },
      ),
      banks: router(
        {
          listByCountry: query(
            { description: "List banks for a country code (NG, GH, KE, UG, ZA, TZ, ...).", input: object({ country: string(), include_provider_type: number().optional() }) },
            async ({ fetch }, { country, ...rest }) => call(fetch, "GET", `/banks/${pathPart(country)}`, rest),
          ),
          branches: query(
            { description: "List branches of a bank by bank id.", input: Id },
            async ({ fetch }, { id }) => call(fetch, "GET", `/banks/${pathPart(id)}/branches`),
          ),
          resolveAccount: mutation(
            {
              description: "Resolve a bank account name from account_number and account_bank (bank code). Read-only lookup, sent as POST.",
              input: object({ account_number: string(), account_bank: string() }),
              approval: always(),
            },
            async ({ fetch }, input) => call(fetch, "POST", "/accounts/resolve", {}, input),
          ),
          resolveCardBin: query(
            { description: "Resolve card details (issuer, type, country) from the first 6 digits.", input: object({ bin: string() }) },
            async ({ fetch }, { bin }) => call(fetch, "GET", `/card-bins/${pathPart(bin)}`),
          ),
        },
        { title: "Banks", description: "Bank lists and account lookups." },
      ),
      bills: router(
        {
          categories: query(
            { description: "List top bill categories, optionally for a country.", input: object({ country: string().optional() }) },
            async ({ fetch }, input) => call(fetch, "GET", "/top-bill-categories", input),
          ),
          listBillers: query(
            { description: "List billers in a bill category for a country (country is required).", input: object({ category: string(), country: string() }) },
            async ({ fetch }, { category, ...rest }) => call(fetch, "GET", `/bills/${pathPart(category)}/billers`, rest),
          ),
          listBillerProducts: query(
            { description: "List the items sold by a biller code.", input: object({ biller_code: string() }) },
            async ({ fetch }, { biller_code }) => call(fetch, "GET", `/billers/${pathPart(biller_code)}/items`),
          ),
          validateItem: query(
            { description: "Validate a customer identifier (meter, phone, smartcard) against a bill item code.", input: object({ item_code: string(), customer: string() }) },
            async ({ fetch }, { item_code, customer }) => call(fetch, "GET", `/bill-items/${pathPart(item_code)}/validate`, { customer }),
          ),
          history: query(
            {
              description: "List bill payment history. Filter by status, from, to, page, limit, reference, batch_reference, category, country.",
              input: object({
                ...Page,
                ...Range,
                limit: number().optional(),
                reference: string().optional(),
                status: string().optional(),
                batch_reference: string().optional(),
                category: string().optional(),
                country: string().optional(),
              }),
            },
            async ({ fetch }, input) => call(fetch, "GET", "/bills/history", input),
          ),
          create: mutation(
            {
              description: "Pay a bill (airtime, data, power, cable) for a biller_code and item_code (POST /billers/{biller_code}/items/{item_code}/payment). body needs country, customer_id and amount; optional reference, callback_url. Spends wallet funds.",
              input: object({ biller_code: string(), item_code: string(), body: json() }),
              approval: always(),
            },
            async ({ fetch }, { biller_code, item_code, body }) =>
              call(fetch, "POST", `/billers/${pathPart(biller_code)}/items/${pathPart(item_code)}/payment`, {}, body),
          ),
        },
        { title: "Bills", description: "Airtime, data, utility and cable payments." },
      ),
      wallet: router(
        {
          balances: query(
            { description: "Get all wallet balances.", input: object({}) },
            async ({ fetch }) => call(fetch, "GET", "/balances"),
          ),
          balanceByCurrency: query(
            { description: "Get the wallet balance for one currency, such as NGN.", input: object({ currency: string() }) },
            async ({ fetch }, { currency }) => call(fetch, "GET", `/balances/${pathPart(currency)}`),
          ),
          statement: query(
            {
              description: "Get the wallet statement. from and to (YYYY-MM-DD) and currency (ISO 4217, for example USD) are required; optional type (D debit, C credit); page from 1.",
              input: object({ ...Page, ...RequiredRange, currency: string(), type: string().optional() }),
            },
            async ({ fetch }, input) => call(fetch, "GET", "/wallet/statement", input),
          ),
        },
        { title: "Wallet", description: "Balances and statements." },
      ),
      settlements: router(
        {
          list: query(
            {
              description: "List settlements. Filter by from, to, subaccount_id, disburse_ref; page from 1.",
              input: object({ ...Page, ...Range, subaccount_id: string().optional(), disburse_ref: string().optional() }),
            },
            async ({ fetch }, input) => call(fetch, "GET", "/settlements", input),
          ),
          get: query(
            { description: "Get one settlement by id.", input: Id },
            async ({ fetch }, { id }) => call(fetch, "GET", `/settlements/${pathPart(id)}`),
          ),
        },
        { title: "Settlements", description: "Settlements paid out to your bank." },
      ),
      chargebacks: router(
        {
          list: query(
            {
              description: "List chargebacks. Filter by status, from, to, currency, flw_ref, id; page from 1.",
              input: object({ ...Page, ...Range, status: string().optional(), currency: string().optional(), id: string().optional(), flw_ref: string().optional() }),
            },
            async ({ fetch }, input) => call(fetch, "GET", "/chargebacks", input),
          ),
          get: query(
            { description: "Get one chargeback by id.", input: Id },
            async ({ fetch }, { id }) => call(fetch, "GET", `/chargebacks/${pathPart(id)}`),
          ),
          accept: mutation(
            { description: "Accept or decline a chargeback. body needs action (accept or decline) and comment.", input: object({ id: string(), body: json() }), approval: always() },
            async ({ fetch }, { id, body }) => call(fetch, "PUT", `/chargebacks/${pathPart(id)}`, {}, body),
          ),
        },
        { title: "Chargebacks", description: "Review and respond to chargebacks." },
      ),
      verification: router(
        {
          initiateBvn: mutation(
            { description: "Start a BVN verification. body needs bvn, firstname, lastname and redirect_url.", input: object({ body: json() }), approval: always() },
            async ({ fetch }, { body }) => call(fetch, "POST", "/bvn/verifications", {}, body),
          ),
          getBvn: query(
            { description: "Get the result of a BVN verification by reference.", input: object({ reference: string() }) },
            async ({ fetch }, { reference }) => call(fetch, "GET", `/bvn/verifications/${pathPart(reference)}`),
          ),
        },
        { title: "Verification", description: "BVN identity verification." },
      ),
    },
    {},
  );
};

export default defineApp({ user: { accounts: { flutterwave: flutterwave.many() } }, icons }, async ({ user, signal }) => ({
  tools: router(await accountRouter(user?.accounts.flutterwave ?? [], (account) => flutterwaveTools(account, signal), { signal }), {
    title: "Flutterwave",
    description:
      "Flutterwave payments (API v3): transactions, refunds, payment links, transfers, beneficiaries, payment plans, subscriptions, subaccounts, virtual accounts, bills, banks, balances, settlements and chargebacks.",
    icons,
    instructions:
      "Use a test-mode secret key (FLWSECK_TEST-...) while experimenting. Dates are YYYY-MM-DD. Tools that take body pass the JSON payload documented in the description straight to Flutterwave.",
  }),
}));
