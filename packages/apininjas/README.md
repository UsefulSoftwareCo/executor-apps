# API Ninjas

Covers the API Ninjas data catalog: finance and markets, geography and weather, text and NLP, health and nutrition, entertainment, reference data, validation and utilities (about 244 operations).

Interface: OpenAPI, the official combined document at https://api-ninjas.com/openapi.json (server https://api.api-ninjas.com).

Auth: API key only (API Ninjas has no OAuth). Create a key at https://api-ninjas.com/profile after registering; it is sent as the `X-Api-Key` header.

Known gaps: the six POST operations (embeddings, face detection, image to text, object detection, sudoku solve, text similarity) require approval like any mutation, although they only compute results. Some endpoints are premium-tier and return 400/403 on free keys. The health check calls `/v1/advice`, which counts against the monthly quota.
