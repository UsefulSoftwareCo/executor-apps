# PageVitals

Web performance monitoring with PageVitals: websites, tested pages, Lighthouse test series and per-test results, CrUX and Google Search timelines, multistep tests, performance budgets, opportunities and field (RUM) reports for pages, countries and resources.

Interface: hand-written tools over PageVitals' official REST API (`https://api.pagevitals.com`), documented at https://pagevitals.com/docs/rest-api/reference/. PageVitals publishes no OpenAPI document, so the tools are written from the reference pages (39 operations across websites, pages, settings, tests, multistep, budgets, opportunities and field). Path ids are tool arguments; querystring options go in `query` and JSON bodies in `body`. Every write (POST, PUT, DELETE, including triggering test runs) requires approval.

Auth: API key only (PageVitals offers no OAuth). Create it in the PageVitals app under the account menu, API Keys, Create API key. Choose Admin for writes (adding or deleting websites, pages, budgets and multistep tests) or Viewer for read-only reports. The key is shown once. It is sent as `Authorization: Bearer <key>` to `api.pagevitals.com`.

Known gaps: the field-testing report endpoints with chart intervals beyond pages, countries and resources are not documented in the reference and are not included; multistep step editing and webhooks are not part of the documented REST API.

Note: the vendor docs give PUT and DELETE for a page as `/{website-id}/settings/{page-id}` (no `pages/` segment) while the collection path is `/settings/pages`. The package follows the documented form, but the docs page may contain a typo; this is unverified against a live Admin key because no vendor calls with credentials are made during authoring.

The vendor docs themselves mark the waterfall and validation test endpoints as incomplete ("we're working on the docs"), so those are a known gap.
