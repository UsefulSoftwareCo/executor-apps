export type Operation = {
  group: string;
  name: string;
  method: "GET" | "POST" | "DELETE";
  path: string;
  description: string;
};

const task = (name: string, path: string, description: string): Operation => ({
  group: "tasks",
  name,
  method: "POST",
  path,
  description: `${description} Creates a standalone task; pass the task options as body. Poll it with tasks.get.`,
});

export const operations: Operation[] = [
  { group: "account", name: "me", method: "GET", path: "/users/me", description: "Get the authenticated user, including remaining credits." },
  { group: "jobs", name: "list", method: "GET", path: "/jobs", description: "List jobs. Filter with query key 'filter[status]', query key 'filter[tag]', query.include, query.per_page and query.page." },
  { group: "jobs", name: "create", method: "POST", path: "/jobs", description: "Create a job. Body: { tasks: { <name>: { operation: 'import/url' | 'convert' | 'export/url' | ..., input: '<task name>', ... } }, tag?, webhook_url? }." },
  { group: "jobs", name: "get", method: "GET", path: "/jobs/{id}", description: "Get a job with its tasks and export results (query.include=tasks)." },
  { group: "jobs", name: "delete", method: "DELETE", path: "/jobs/{id}", description: "Delete a job and its tasks." },
  { group: "tasks", name: "list", method: "GET", path: "/tasks", description: "List tasks. Filter with the literal query key 'filter[job_id]', query key 'filter[status]', query key 'filter[operation]', query.per_page and query.page." },
  { group: "tasks", name: "get", method: "GET", path: "/tasks/{id}", description: "Get a task and its result files." },
  { group: "tasks", name: "delete", method: "DELETE", path: "/tasks/{id}", description: "Delete a task." },
  { group: "tasks", name: "cancel", method: "POST", path: "/tasks/{id}/cancel", description: "Cancel a waiting or processing task." },
  { group: "tasks", name: "retry", method: "POST", path: "/tasks/{id}/retry", description: "Retry a failed task." },
  task("importUrl", "/import/url", "Import a file from a public URL (body: url, filename?)."),
  task("importUpload", "/import/upload", "Create an upload task; the result form holds the URL and parameters to upload a file."),
  task("importBase64", "/import/base64", "Import a file from base64 data (body: file, filename)."),
  task("importRaw", "/import/raw", "Import a text file from raw content (body: file, filename)."),
  task("exportUrl", "/export/url", "Create temporary download URLs for the files of another task (body: input, inline?, archive_multiple_files?)."),
  task("convert", "/convert", "Convert a file (body: input, input_format?, output_format, engine?, filename?, plus format specific options)."),
  task("optimize", "/optimize", "Optimize or compress a PDF, PNG or JPG (body: input, input_format, profile?, quality?)."),
  task("watermark", "/watermark", "Add a text or image watermark to a PDF, image or video."),
  task("captureWebsite", "/capture-website", "Capture a web page as PDF, PNG or JPG (body: url, output_format, ...)."),
  task("thumbnail", "/thumbnail", "Create a PNG, JPG or WEBP thumbnail (body: input, output_format, width?, height?, fit?)."),
  task("merge", "/merge", "Merge several files into one PDF (body: input (array), output_format: 'pdf')."),
  task("archive", "/archive", "Create a ZIP, RAR, 7Z, TAR, TAR.GZ or TAR.BZ2 archive (body: input (array), output_format)."),
  task("command", "/command", "Run a FFmpeg, ImageMagick or GraphicsMagick command (body: input, engine, command, arguments)."),
  task("metadata", "/metadata", "Read file metadata with ExifTool (body: input)."),
  task("writeMetadata", "/metadata/write", "Write XMP/IPTC metadata to a file (body: input, metadata)."),
  { group: "discovery", name: "operations", method: "GET", path: "/operations", description: "List supported operations and formats. Filter with query key 'filter[operation]', query key 'filter[input_format]', query key 'filter[output_format]', query key 'filter[engine]' and query.include=options,engine_versions." },
  { group: "discovery", name: "formats", method: "GET", path: "/convert/formats", description: "List supported conversion formats." },
  { group: "webhooks", name: "list", method: "GET", path: "/webhooks", description: "List webhooks." },
  { group: "webhooks", name: "create", method: "POST", path: "/webhooks", description: "Create a webhook. Body: { url, events: ['job.finished', 'job.failed', ...], signing_secret? }." },
  { group: "webhooks", name: "delete", method: "DELETE", path: "/webhooks/{id}", description: "Delete a webhook." },
];
