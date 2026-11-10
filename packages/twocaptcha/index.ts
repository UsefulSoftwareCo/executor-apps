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
  record,
  router,
  secrets,
  string,
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const base = "https://api.2captcha.com";

type Account = { fields: { token: string } };

const post = async (
  fetch: typeof globalThis.fetch,
  signal: AbortSignal,
  account: Account,
  method: string,
  body: Record<string, unknown>,
) =>
  decodeJson(
    await fetch(`${base}/${method}`, {
      method: "POST",
      signal,
      headers: { "content-type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ clientKey: account.fields.token, ...body }),
    }),
    json(),
  );

const twocaptcha = defineProvider({
  name: "2Captcha",
  hosts: ["api.2captcha.com"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // 2Captcha answers HTTP 200 with errorId != 0 for a bad key, so the body must be checked.
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/getBalance`, {
      method: "POST",
      signal,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ clientKey: account.fields.token }),
    });
    const result = await decodeJson(response, object({ errorId: number() }));
    if (result.errorId !== 0) throw new Error(`2Captcha rejected the API key (errorId ${result.errorId})`);
  },
});

const pollNote =
  "Returns { errorId, taskId }. The API answers HTTP 200 even on failure: errorId is non-zero and errorCode/errorDescription explain it. Poll getTaskResult with the taskId no sooner than 5 seconds later.";

const twocaptchaTools = (account: Account, signal: AbortSignal) =>
  router({
    getBalance: query(
      {
        description: "Get the account balance in USD. Returns { errorId, balance }.",
        input: object({}),
      },
      async ({ fetch }) => post(fetch, signal, account, "getBalance", {}),
    ),
    getTaskResult: query(
      {
        description:
          "Fetch the result of a task created with createTask or a create* helper. While solving it returns { errorId: 0, status: \"processing\" } (wait 5-10 seconds and ask again); when done, { status: \"ready\", solution, cost, ip, createTime, endTime, solveCount }. The solution shape depends on the task type (for example solution.gRecaptchaResponse for reCAPTCHA, solution.token for Turnstile, solution.text for image captchas). A failed task returns a non-zero errorId with errorCode, for example ERROR_CAPTCHA_UNSOLVABLE.",
        input: object({ taskId: number() }),
      },
      async ({ fetch }, { taskId }) => post(fetch, signal, account, "getTaskResult", { taskId }),
    ),
    createTask: mutation(
      {
        description: `Create a solving task of any type. task is the raw task object with a "type" field, for example { type: "RecaptchaV2TaskProxyless", websiteURL, websiteKey }; other types include RecaptchaV2EnterpriseTaskProxyless, RecaptchaV3TaskProxyless, TurnstileTaskProxyless, FunCaptchaTaskProxyless, GeeTestTaskProxyless, ImageToTextTask, CoordinatesTask, GridTask, RotateTask and AmazonTaskProxyless, plus the proxy variants (drop "Proxyless" and add proxyType, proxyAddress, proxyPort, proxyLogin, proxyPassword). See https://2captcha.com/api-docs for each type's fields. languagePool is "en" (default) or "ru" for image and text captchas. Each task spends account balance. ${pollNote}`,
        input: object({
          task: record(json()),
          languagePool: string().optional(),
        }),
        approval: always(),
      },
      async ({ fetch }, { task, languagePool }) =>
        post(fetch, signal, account, "createTask", {
          task,
          ...(languagePool === undefined ? {} : { languagePool }),
        }),
    ),
    createRecaptchaV2Task: mutation(
      {
        description: `Solve a reCAPTCHA v2 (checkbox or invisible) without a proxy. websiteURL is the page address, websiteKey the site key (data-sitekey). Set isInvisible for invisible reCAPTCHA, enterprise for reCAPTCHA v2 Enterprise (RecaptchaV2EnterpriseTaskProxyless). apiDomain is google.com (default) or recaptcha.net. The solution is solution.gRecaptchaResponse. ${pollNote}`,
        input: object({
          websiteURL: string(),
          websiteKey: string(),
          isInvisible: boolean().optional(),
          enterprise: boolean().optional(),
          apiDomain: string().optional(),
        }),
        approval: always(),
      },
      async ({ fetch }, { websiteURL, websiteKey, isInvisible, enterprise, apiDomain }) =>
        post(fetch, signal, account, "createTask", {
          task: {
            type: enterprise === true ? "RecaptchaV2EnterpriseTaskProxyless" : "RecaptchaV2TaskProxyless",
            websiteURL,
            websiteKey,
            ...(isInvisible === undefined ? {} : { isInvisible }),
            ...(apiDomain === undefined ? {} : { apiDomain }),
          },
        }),
    ),
    createRecaptchaV3Task: mutation(
      {
        description: `Solve a reCAPTCHA v3 without a proxy. websiteURL and websiteKey identify the page and site key; pageAction is the action name the page passes to grecaptcha.execute; minScore is the required score to request (0.3, 0.7 or 0.9). Set isEnterprise for reCAPTCHA v3 Enterprise (same RecaptchaV3TaskProxyless type). apiDomain is google.com (default) or recaptcha.net. The solution is solution.gRecaptchaResponse. ${pollNote}`,
        input: object({
          websiteURL: string(),
          websiteKey: string(),
          pageAction: string().optional(),
          minScore: number(),
          isEnterprise: boolean().optional(),
          apiDomain: string().optional(),
        }),
        approval: always(),
      },
      async ({ fetch }, { websiteURL, websiteKey, pageAction, minScore, isEnterprise, apiDomain }) =>
        post(fetch, signal, account, "createTask", {
          task: {
            type: "RecaptchaV3TaskProxyless",
            websiteURL,
            websiteKey,
            ...(pageAction === undefined ? {} : { pageAction }),
            minScore,
            ...(isEnterprise === undefined ? {} : { isEnterprise }),
            ...(apiDomain === undefined ? {} : { apiDomain }),
          },
        }),
    ),
    createTurnstileTask: mutation(
      {
        description: `Solve a Cloudflare Turnstile challenge without a proxy. websiteURL is the page address and websiteKey the Turnstile site key. Optional action, data and pagedata are the values the widget exposes. The solution is solution.token; solution.userAgent is also returned and must be used (the same User-Agent) together with the token. ${pollNote}`,
        input: object({
          websiteURL: string(),
          websiteKey: string(),
          action: string().optional(),
          data: string().optional(),
          pagedata: string().optional(),
        }),
        approval: always(),
      },
      async ({ fetch }, { websiteURL, websiteKey, action, data, pagedata }) =>
        post(fetch, signal, account, "createTask", {
          task: {
            type: "TurnstileTaskProxyless",
            websiteURL,
            websiteKey,
            ...(action === undefined ? {} : { action }),
            ...(data === undefined ? {} : { data }),
            ...(pagedata === undefined ? {} : { pagedata }),
          },
        }),
    ),
    createImageTask: mutation(
      {
        description: `Solve a normal image captcha (distorted text or digits). body is the image as base64 (a data: URI prefix is also accepted; JPEG, PNG or GIF, up to 100 kB and 1000px per side). Optional comment tells the worker what to enter. numeric is 0 (no preference), 1 (digits only), 2 (letters only), 3 (digits-only or letters-only) or 4 (must mix digits and letters). minLength and maxLength bound the answer (0 means no limit). caseSensitive makes the answer case-sensitive (sent as the API field "case"). phrase requires an answer of two or more words separated by a space. math marks captchas that need a calculation. The solution is solution.text. ${pollNote}`,
        input: object({
          body: string(),
          comment: string().optional(),
          numeric: number().optional(),
          minLength: number().optional(),
          maxLength: number().optional(),
          caseSensitive: boolean().optional(),
          phrase: boolean().optional(),
          math: boolean().optional(),
          languagePool: string().optional(),
        }),
        approval: always(),
      },
      async ({ fetch }, { languagePool, body, comment, numeric, minLength, maxLength, caseSensitive, phrase, math }) =>
        post(fetch, signal, account, "createTask", {
          task: {
            type: "ImageToTextTask",
            body,
            ...(comment === undefined ? {} : { comment }),
            ...(numeric === undefined ? {} : { numeric }),
            ...(minLength === undefined ? {} : { minLength }),
            ...(maxLength === undefined ? {} : { maxLength }),
            ...(caseSensitive === undefined ? {} : { case: caseSensitive }),
            ...(phrase === undefined ? {} : { phrase }),
            ...(math === undefined ? {} : { math }),
          },
          ...(languagePool === undefined ? {} : { languagePool }),
        }),
    ),
    reportCorrect: mutation(
      {
        description:
          "Tell 2Captcha a solution was accepted by the target site. Call it after the answer worked. Returns { errorId, status: \"success\" }.",
        input: object({ taskId: number() }),
        approval: always(),
      },
      async ({ fetch }, { taskId }) => post(fetch, signal, account, "reportCorrect", { taskId }),
    ),
    reportIncorrect: mutation(
      {
        description:
          "Report that the target site rejected a solution, to request a review and possible refund (not guaranteed). Do not use when most of your solutions fail; that points to a problem in the integration. Returns { errorId, status: \"success\" }.",
        input: object({ taskId: number() }),
        approval: always(),
      },
      async ({ fetch }, { taskId }) => post(fetch, signal, account, "reportIncorrect", { taskId }),
    ),
  });

export default defineApp({ user: { accounts: { twocaptcha: twocaptcha.many() } }, icons }, async ({ user, signal }) => ({
  tools: router(await accountRouter(user?.accounts.twocaptcha ?? [], (account) => twocaptchaTools(account, signal), { signal }), {
    title: "2Captcha",
    description:
      "Solve reCAPTCHA, Cloudflare Turnstile, image and other CAPTCHAs with 2Captcha: create tasks, poll for solutions, check balance and report results.",
    icons,
  }),
}));
