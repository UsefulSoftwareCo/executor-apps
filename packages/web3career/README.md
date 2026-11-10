# Web3 Career

Search Web3 Career (web3.career) job listings by technology tag, country, remote status and result count, with optional full descriptions. One read-only tool, `searchJobs`.

## Interface

Custom tools over the official Web3.career Jobs API, `GET https://web3.career/api/v1`. The vendor publishes no downloadable OpenAPI file, only reference pages at https://docs.bondex.app/api-reference (Web3 Career is part of Bondex), so the tool is hand-written. The API returns a mixed array (`[string, string, [jobs]]`); the tool unwraps the nested jobs array.

## Auth

- API token (`apiKey`): sign up at https://web3.career/web3-jobs-api to get a token. It is sent as the `token` query parameter, the only method the API supports. No OAuth.

## Notes and gaps

- The vendor requires linking to jobs with the returned `apply_url` unmodified and without `rel="nofollow"`.
- `tag` takes one exact lowercase slug; unknown tags or country slugs return zero jobs, not an error.
- No pagination (only `limit`, 1-100) and no job-detail endpoint. Rate limits return HTTP 429.
- The icon is the crystal ball from the site's 80px favicon; the vendor publishes no larger or SVG mark.
