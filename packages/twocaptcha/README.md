# 2Captcha

Solve CAPTCHAs with 2Captcha: create solving tasks (reCAPTCHA v2/v3 and Enterprise, Cloudflare Turnstile, image captchas and every other type the API accepts), poll for the solution, check the account balance and report correct or incorrect results.

**Interface:** hand-written tools over the documented API v2 (`https://api.2captcha.com`, reference at https://2captcha.com/api-docs). 2Captcha publishes no OpenAPI document and no remote MCP server, so the five API methods are wrapped directly as nine tools: `getBalance`, `createTask`, `getTaskResult`, `reportCorrect`, `reportIncorrect`, plus four typed create helpers. `createTask` accepts any raw task object, so all task types work; the four typed helpers (`createRecaptchaV2Task`, `createRecaptchaV3Task`, `createTurnstileTask`, `createImageTask`) cover the common cases. Everything that spends balance or files a report requires approval.

**Auth:** API key. Copy it from your 2Captcha dashboard at https://2captcha.com/enterpage (the key is shown under your account settings). The key goes in the `clientKey` field of each request body, which the tools fill in. 2Captcha has no OAuth.

**Icon:** the padlock mark from 2Captcha's own GitHub organization avatar (https://github.com/2captcha), with its dark tile removed. The mark is not in Simple Icons and the vendor's site SVG is a white wordmark only.

**Known gaps:** no tool polls to completion; call `getTaskResult` every 5 to 10 seconds. The API returns HTTP 200 with a non-zero `errorId` on failure, so check `errorId`, `errorCode` and `errorDescription` in each result. The `test` debugging method and callback (`callbackUrl`) webhooks are not exposed, and proxy task variants are available only through raw `createTask`.
