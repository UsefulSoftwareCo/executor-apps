# NeuronWriter

Covers NeuronWriter's Content Writer API (v0.5): list projects and queries, create a keyword analysis, read its term, question and competitor recommendations, read saved content, and import or score HTML against a query.

Interface: hand-written tools over the vendor's REST API, documented at https://neuronwriter.com/faqs/neuronwriter-api-how-to-use/ (base URL `https://app.neuronwriter.com/neuron-api/0.5/writer`, every method is a POST with a JSON body). NeuronWriter publishes no OpenAPI document or MCP server. All seven documented methods are exposed.

Auth: API key only (sent as `X-API-KEY`). Copy it from your NeuronWriter profile, "Neuron API access" tab. The API needs the Gold plan or higher. NeuronWriter has no OAuth.

Approvals: `newQuery` (spends one monthly analysis) and `importContent` (overwrites editor content) require approval. `evaluateContent` is a POST but saves nothing, so it is a query.

Known gaps: the vendor documents no response schemas, so results are returned as raw JSON. The health check calls `list-projects`.
