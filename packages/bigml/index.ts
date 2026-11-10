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
  record,
  router,
  secrets,
  string,
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";
import { redactMeta } from "./redact.js";

const base = "https://bigml.io/andromeda";

const bigml = defineProvider({
  name: "BigML",
  hosts: ["bigml.io"],
  auth: {
    // BigML authenticates every request with a username and API key pair in the query string.
    apiKey: secrets({
      label: "BigML username and API key",
      fields: object({ username: string({ minLength: 1 }), token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const url = new URL(`${base}/project`);
    url.searchParams.set("limit", "1");
    url.searchParams.set("username", account.fields.username);
    url.searchParams.set("api_key", account.fields.token);
    const response = await fetch(url.toString(), { signal });
    await decodeJson(response, object({}));
    return { accountInfo: { externalId: account.fields.username, displayName: account.fields.username } };
  },
});

type Fetch = typeof fetch;
type Params = Record<string, unknown>;

// Query values are scalars; arrays become comma lists (BigML's `__in` filters) and objects JSON.
function queryValue(value: unknown): string {
  if (Array.isArray(value)) return value.map(queryValue).join(",");
  if (value !== null && typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function client(username: string, token: string, fetcher: Fetch, signal: AbortSignal | undefined) {
  const send = async (method: string, path: string, params: Params, body?: Params) => {
    const url = new URL(`${base}/${path}`);
    for (const [key, value] of Object.entries(params)) {
      if (value === undefined || value === null) continue;
      url.searchParams.set(key, queryValue(value));
    }
    url.searchParams.set("username", username);
    url.searchParams.set("api_key", token);
    const response = await fetcher(url.toString(), {
      method,
      signal,
      ...(body === undefined ? {} : { headers: { "content-type": "application/json" }, body: JSON.stringify(body) }),
    });
    const text = await response.text();
    // Errors carry the status and BigML's own error body, never the request URL.
    if (!response.ok) throw new Error(`BigML returned ${response.status}: ${text.slice(0, 500)}`);
    if (text.trim() === "") return { status: response.status };
    try {
      return redactMeta(JSON.parse(text));
    } catch {
      return { status: response.status, body: text.slice(0, 2000) };
    }
  };
  return {
    get: (path: string, params: Params = {}) => send("GET", path, params),
    post: (path: string, body: Params) => send("POST", path, {}, body),
    put: (path: string, body: Params) => send("PUT", path, {}, body),
    del: (path: string) => send("DELETE", path, {}),
  };
}

type Client = ReturnType<typeof client>;

// Every BigML resource type lives at /<type> and /<type>/<id>. `create` says what a POST needs.
const resources: ReadonlyArray<readonly [type: string, label: string, create: string]> = [
  ["project", "project", "Optional: name, description, tags."],
  ["source", "data source", "Provide remote (a URL such as https://, s3://, azure:// or dropbox://), or data (inline text). Optional: name, source_parser."],
  ["dataset", "dataset", "Provide source (a source id), or origin_batch_resource, or sample/cluster ids. Optional: name, objective_field, fields, input_fields."],
  ["sample", "sample", "Provide dataset (a dataset id). Optional: name."],
  ["correlation", "correlation", "Provide dataset (a dataset id). Optional: name, objective_field, correlations."],
  ["statisticaltest", "statistical test", "Provide dataset (a dataset id). Optional: name, objective_field."],
  ["model", "decision tree model", "Provide dataset (a dataset id). Optional: name, objective_field, input_fields, ensemble tuning keys."],
  ["ensemble", "ensemble", "Provide dataset (a dataset id). Optional: name, number_of_models, objective_field, randomize."],
  ["cluster", "cluster", "Provide dataset (a dataset id). Optional: name, k, input_fields, critical_value."],
  ["anomaly", "anomaly detector", "Provide dataset (a dataset id). Optional: name, top_n, anomaly_seed."],
  ["association", "association discovery", "Provide dataset (a dataset id). Optional: name, search_strategy, max_k."],
  ["logisticregression", "logistic regression", "Provide dataset (a dataset id). Optional: name, objective_field, regularization."],
  ["linearregression", "linear regression", "Provide dataset (a dataset id). Optional: name, objective_field, bias."],
  ["deepnet", "deepnet", "Provide dataset (a dataset id). Optional: name, objective_field, search, hidden_layers."],
  ["timeseries", "time series", "Provide dataset (a dataset id). Optional: name, objective_fields, period."],
  ["topicmodel", "topic model", "Provide dataset (a dataset id). Optional: name, number_of_topics, input_fields."],
  ["pca", "PCA", "Provide dataset (a dataset id). Optional: name, input_fields."],
  ["fusion", "fusion", "Provide models (a list of supervised model ids). Optional: name, weights."],
  ["optiml", "OptiML", "Provide dataset (a dataset id). Optional: name, objective_field, max_training_time, model_types."],
  ["evaluation", "evaluation", "Provide a model-like resource id (model, ensemble, logisticregression, deepnet, fusion, ...) and dataset (a dataset id). Optional: name."],
  ["prediction", "single prediction", "Provide model (a model-like resource id) and input_data (an object of field name or id to value). Optional: name."],
  ["centroid", "single centroid", "Provide cluster (a cluster id) and input_data. Optional: name."],
  ["anomalyscore", "single anomaly score", "Provide anomaly (an anomaly detector id) and input_data. Optional: name."],
  ["associationset", "association set", "Provide association (an association id) and input_data. Optional: name."],
  ["topicdistribution", "single topic distribution", "Provide topicmodel (a topic model id) and input_data. Optional: name."],
  ["projection", "single projection", "Provide pca (a PCA id) and input_data. Optional: name."],
  ["forecast", "forecast", "Provide timeseries (a time series id) and input_data (an object keyed by objective field id). Optional: name."],
  ["batchprediction", "batch prediction", "Provide model (a model-like resource id) and dataset (a dataset id). Optional: name, output_dataset, all_fields."],
  ["batchcentroid", "batch centroid", "Provide cluster (a cluster id) and dataset (a dataset id). Optional: name, output_dataset."],
  ["batchanomalyscore", "batch anomaly score", "Provide anomaly (an anomaly detector id) and dataset (a dataset id). Optional: name, output_dataset."],
  ["batchtopicdistribution", "batch topic distribution", "Provide topicmodel (a topic model id) and dataset (a dataset id). Optional: name, output_dataset."],
  ["batchprojection", "batch projection", "Provide pca (a PCA id) and dataset (a dataset id). Optional: name, output_dataset."],
  ["script", "WhizzML script", "Provide source_code (WhizzML text). Optional: name, inputs, outputs, imports."],
  ["library", "WhizzML library", "Provide source_code (WhizzML text). Optional: name, imports."],
  ["execution", "WhizzML execution", "Provide script (a script id or list of ids) or source_code, plus inputs. Optional: name, outputs."],
  ["configuration", "configuration", "Provide configuration (an object of default creation arguments by resource type). Optional: name."],
  ["externalconnector", "external connector", "Provide source (database type such as postgresql, mysql, sqlserver, elasticsearch) and connection details. Optional: name."],
];

// The id may be given bare (5f1c...) or in full (model/5f1c...).
function path(type: string, id: string) {
  const bare = id.includes("/") ? id.slice(id.indexOf("/") + 1) : id;
  return `${type}/${encodeURIComponent(bare)}`;
}

function resourceRouter(c: Client, [type, label, create]: (typeof resources)[number]) {
  return router({
    list: query(
      {
        description: `List ${label} resources, newest first by default. filter holds BigML query-string filters such as { name__icontains: "churn", "tags__in": "prod" }; orderBy is a field such as -created or name.`,
        input: object({
          limit: number().optional(),
          offset: number().optional(),
          orderBy: string().optional(),
          filter: record(json()).optional(),
        }),
      },
      async (_ctx, { limit, offset, orderBy, filter }) =>
        c.get(type, { ...filter, limit, offset, order_by: orderBy }),
    ),
    get: query(
      {
        description: `Get one ${label} by id (for example ${type}/5f1c2d3e4f5a6b7c8d9e0f1a). Includes its status; poll until status.code is 5 (finished).`,
        input: object({ id: string({ minLength: 1 }) }),
      },
      async (_ctx, { id }) => c.get(path(type, id)),
    ),
    create: mutation(
      {
        description: `Create a ${label}. args is the JSON body BigML expects. ${create} Creation is asynchronous: the returned resource has a status to poll with get.`,
        input: object({ args: record(json()) }),
        approval: always(),
      },
      async (_ctx, { args }) => c.post(type, args),
    ),
    update: mutation(
      {
        description: `Update a ${label}. args holds the fields to change, such as name, description, tags or category.`,
        input: object({ id: string({ minLength: 1 }), args: record(json()) }),
        approval: always(),
      },
      async (_ctx, { id, args }) => c.put(path(type, id), args),
    ),
    delete: mutation(
      {
        description: `Permanently delete a ${label}.`,
        input: object({ id: string({ minLength: 1 }) }),
        approval: always(),
      },
      async (_ctx, { id }) => c.del(path(type, id)),
    ),
  });
}

export default defineApp(
  { user: { accounts: { bigml: bigml.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.bigml ?? [],
        (account) => {
          const c = client(account.fields.username, account.fields.token, fetch, signal);
          return router(Object.fromEntries(resources.map((r) => [r[0], resourceRouter(c, r)])));
        },
        { signal },
      ),
      {
        title: "BigML",
        description:
          "BigML machine learning: sources, datasets, models, ensembles, clusters, anomaly detectors, deepnets, time series, evaluations, predictions, batch jobs, WhizzML scripts and projects.",
        icons,
      },
    ),
  }),
);
