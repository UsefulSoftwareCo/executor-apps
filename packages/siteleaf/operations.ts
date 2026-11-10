export type Operation = {
  group: string;
  name: string;
  method: "GET" | "POST" | "PUT" | "DELETE";
  path: string;
  description: string;
  /** Endpoint takes a multipart file upload; the tool accepts `content` and `filename`. */
  upload?: boolean;
  /** Endpoint is a Server-Sent Events stream; the tool reads it and returns the last event. */
  sse?: boolean;
};

const list = "Query: page, per_page, sort (field-asc or field-desc).";

// Endpoints from Siteleaf's official v2 API docs (https://learn.siteleaf.com/api/).
export const operations: Operation[] = [
  { group: "users", name: "me", method: "GET", path: "/users/me", description: "Get the currently authenticated user." },
  { group: "users", name: "list", method: "GET", path: "/sites/{site_id}/users", description: `List the users with access to a site. ${list}` },

  { group: "sites", name: "list", method: "GET", path: "/sites", description: `List your sites. ${list}` },
  { group: "sites", name: "create", method: "POST", path: "/sites", description: "Create a site. Body: title (required), domain (required), timezone (default UTC), metadata, defaults, empty (boolean, create without starter content)." },
  { group: "sites", name: "get", method: "GET", path: "/sites/{site_id}", description: "Get a site." },
  { group: "sites", name: "update", method: "PUT", path: "/sites/{site_id}", description: "Update a site. Body: title, domain, timezone, metadata, defaults, hosting (disabled, ftp, s3, cloudfiles or github), hosting_options (object of settings for the chosen host), sync (disabled or github), sync_options (object of settings for the chosen sync)." },
  { group: "sites", name: "delete", method: "DELETE", path: "/sites/{site_id}", description: "Delete a site." },
  { group: "sites", name: "publish", method: "POST", path: "/sites/{site_id}/publish", description: "Publish a site. Returns a job." },
  { group: "sites", name: "tags", method: "GET", path: "/sites/{site_id}/tags", description: "List the post tags used on a site." },
  { group: "sites", name: "categories", method: "GET", path: "/sites/{site_id}/categories", description: "List the post categories used on a site." },

  { group: "pages", name: "list", method: "GET", path: "/sites/{site_id}/pages", description: `List pages. Query: q (title and path search), sort, visibility (visible or hidden), extensions (comma separated, or markdown), page, per_page.` },
  { group: "pages", name: "create", method: "POST", path: "/sites/{site_id}/pages", description: "Create a page. Body: title (required), body, path, permalink, date (ISO8601), visibility (visible or hidden), metadata." },
  { group: "pages", name: "get", method: "GET", path: "/pages/{page_id}", description: "Get a page." },
  { group: "pages", name: "update", method: "PUT", path: "/pages/{page_id}", description: "Update a page. Body: title, body, path, permalink, date, visibility, metadata." },
  { group: "pages", name: "delete", method: "DELETE", path: "/pages/{page_id}", description: "Delete a page." },

  { group: "collections", name: "list", method: "GET", path: "/sites/{site_id}/collections", description: `List collections. ${list}` },
  { group: "collections", name: "create", method: "POST", path: "/sites/{site_id}/collections", description: "Create a collection. Body: title (required), path, permalink, output (boolean), metadata." },
  { group: "collections", name: "get", method: "GET", path: "/sites/{site_id}/collections/{path}", description: "Get a collection by its path." },
  { group: "collections", name: "update", method: "PUT", path: "/sites/{site_id}/collections/{path}", description: "Update a collection. Body: title, path, permalink, output, metadata." },
  { group: "collections", name: "delete", method: "DELETE", path: "/sites/{site_id}/collections/{path}", description: "Delete a collection." },
  { group: "collections", name: "listFiles", method: "GET", path: "/sites/{site_id}/collections/{path}/files", description: "List the static files in a collection. Query: q (filename search), sort, page, per_page." },
  { group: "collections", name: "uploadFile", method: "POST", path: "/sites/{site_id}/collections/{path}/files", upload: true, description: "Upload a static file (no YAML front matter) to a collection. Pass the text of the file as content and its name as filename." },

  { group: "documents", name: "list", method: "GET", path: "/sites/{site_id}/collections/{path}/documents", description: "List documents in a collection. Query: q (title and path search), sort, visibility (visible, hidden or draft), extensions, page, per_page." },
  { group: "documents", name: "create", method: "POST", path: "/sites/{site_id}/collections/{path}/documents", description: "Create a document. Body: title (required), body, path, permalink, date, visibility, metadata, tags (array), categories (array)." },
  { group: "documents", name: "get", method: "GET", path: "/documents/{document_id}", description: "Get a document." },
  { group: "documents", name: "update", method: "PUT", path: "/documents/{document_id}", description: "Update a document. Body: title, body, path, permalink, date, visibility, metadata, tags, categories." },
  { group: "documents", name: "delete", method: "DELETE", path: "/documents/{document_id}", description: "Delete a document." },

  { group: "source", name: "get", method: "GET", path: "/sites/{site_id}/source/{name}", description: "Get a source file's information, or list a directory. Use an empty name for the root directory (the request is sent to /sites/{site_id}/source with no trailing segment)." },
  { group: "source", name: "put", method: "PUT", path: "/sites/{site_id}/source/{name}", upload: true, description: "Create or replace a source file such as _includes/foo.html. Pass the text of the file as content. Creates a page, document or file as appropriate." },
  { group: "source", name: "delete", method: "DELETE", path: "/sites/{site_id}/source/{name}", description: "Delete a source file. Directories and _config.yml cannot be deleted." },

  { group: "jobs", name: "get", method: "GET", path: "/jobs/{job_id}", sse: true, description: "Get the latest status of a preview, publish or sync job. The vendor endpoint is a Server-Sent Events stream; this tool reads it for up to 15 seconds and returns the last event as {status (working, complete or error), message, updated_at}. If the job is still working when the read ends, call again. Job IDs expire 30 minutes after the last event." },
  { group: "jobs", name: "cancel", method: "DELETE", path: "/jobs/{job_id}", description: "Cancel a running job." },

  { group: "roles", name: "create", method: "POST", path: "/sites/{site_id}/roles", description: "Give a user access to a site. Body: user_id, kind (admin, publisher or writer)." },
  { group: "roles", name: "get", method: "GET", path: "/roles/{role_id}", description: "Get a role." },
  { group: "roles", name: "update", method: "PUT", path: "/roles/{role_id}", description: "Change a role. Body: kind (admin, publisher or writer)." },
  { group: "roles", name: "delete", method: "DELETE", path: "/roles/{role_id}", description: "Remove a role." },
];
