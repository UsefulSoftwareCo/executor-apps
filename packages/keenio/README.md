# Keen.io

Record events and run analytics on Keen.io (the event analytics API that Keen is rebranding toward Stream): record single or bulk events, inspect collections and properties, run count, count_unique, minimum, maximum, sum, average, median, percentile, select_unique, multi_analysis, funnel and extraction queries, manage saved and cached queries and cached datasets, delete events, collections and properties, and manage project access keys.

**Interface:** hand-written tools over the REST API at `https://api.keen.io/3.0`, documented at https://keen.io/docs/api/. Keen publishes no OpenAPI document and no remote MCP server. 34 tools; every mutation needs approval.

**Auth:** one account type, "Project ID and keys". Enter the Project ID and the project's Master Key, both on the project's Access page in the Keen dashboard (https://keen.io). The key is sent as the raw `Authorization` header value. The master key is used for every call because it is the only key that can delete data and manage saved queries, datasets and access keys. There is no OAuth.

**Known gaps:** organization-level project management (`/organizations/ORG_ID/projects`, needs an Organization key) is not exposed; image beacon and URL redirect recording, the Kafka streaming endpoints, and the standard_deviation-only shorthand endpoint are not exposed (use `multiAnalysis`). Delete requests send filters in the request body.
