# Campaign Cleaner

Clean, inline and analyze HTML email campaigns with [Campaign Cleaner](https://campaigncleaner.com): submit a campaign, poll its status, read the cleaned HTML and analysis, download the PDF report, list and delete saved campaigns, check credits, and run inbox placement tests.

## Interface

Hand-written tools over the vendor's REST API (`https://api.campaigncleaner.com/v1`), documented at <https://docs.campaigncleaner.com/api-reference/introduction>. The docs site's `openapi.json` describes an unrelated product (a B2B verification API), so it is not used. Nine tools: `getCredits`, `getCampaignList`, `getCampaignStatus`, `getCampaign`, `getCampaignPdfAnalysis`, `getInboxTestResults`, `sendCampaign`, `createInboxTest`, `deleteCampaign`. Mutations require approval.

## Auth

API key only (no OAuth). Create it in your Campaign Cleaner account under API Management > API Keys. It is sent in the `X-CC-API-Key` header to `api.campaigncleaner.com`.

## Known gaps

- The vendor documents conflicting defaults for four `sendCampaign` settings; set them explicitly.
- The vendor names the image max-width setting `image_max_width` in prose but `set_image_max_width` in the OpenAPI text; `imageMaxWidth` sends `image_max_width` and is unconfirmed against a live response.
- `getCampaignPdfAnalysis` returns the PDF base64-encoded.
