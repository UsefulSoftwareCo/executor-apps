# Elevio

Manage an Elevio knowledge base (Elevio is now part of Dixa): list, read, create, update and delete articles and categories, and search articles by language. 11 tools.

**Interface:** hand-written tools over Elevio's REST API at `https://api.elev.io/v1`, documented at https://api-docs.elevio.help/en/articles/73-rest-api-introduction. Elevio publishes no OpenAPI document, so the tools follow the Articles, Categories and Search reference pages under https://api-docs.elevio.help (the pages are client-rendered, so their exact URLs could not be fetched and are not pinned here; the intro URL above is the stable entry point).

**Auth:** API key plus JWT. Both are generated as a pair on the API Keys page of the Elevio dashboard and sent as `x-api-key` and `Authorization: Bearer`. Elevio has no OAuth. Create, update and delete tools ask for approval.

**Icon:** Elevio publishes no SVG; this is its official 114px app icon (apple-touch-icon) upscaled to 256px.

**Gaps:** the REST API covers only articles, categories and search; widget, analytics and user-feedback data are not exposed. Article and category bodies are passed as raw JSON per the field reference.
