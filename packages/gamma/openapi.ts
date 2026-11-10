import type { JsonObject } from "apps";
import type { OpenapiToolNamesOptions } from "apps/openapi";

// Gamma publishes its OpenAPI 3.0 description only as fragments embedded in each page of
// https://developers.gamma.app (llms.txt lists them), not as one file. This is those fragments
// merged: every endpoint under /v1.0 on https://public-api.gamma.app.
const document: JsonObject =
{
 "openapi": "3.0.0",
 "info": {
  "title": "Gamma Public API",
  "version": "1.0"
 },
 "servers": [
  {
   "url": "https://public-api.gamma.app"
  }
 ],
 "paths": {
  "/v1.0/gammas/{gammaId}/archive": {
   "post": {
    "description": "Archives a Gamma document. The operation is idempotent - archiving an already archived Gamma succeeds.",
    "operationId": "archiveGamma",
    "parameters": [
     {
      "name": "gammaId",
      "required": true,
      "in": "path",
      "description": "The unique ID of the Gamma to archive",
      "schema": {
       "type": "string"
      }
     }
    ],
    "responses": {
     "200": {
      "description": "Gamma archived successfully",
      "content": {
       "application/json": {
        "schema": {
         "$ref": "#/components/schemas/ArchiveGammaResponse"
        }
       }
      }
     },
     "400": {
      "description": "Invalid request parameters"
     },
     "401": {
      "description": "Invalid or missing API key"
     },
     "403": {
      "description": "Access denied - edit permission required"
     }
    },
    "summary": "Archive a Gamma",
    "tags": [
     "public-api"
    ]
   }
  },
  "/v1.0/images/media/{savedMediaId}/archive": {
   "post": {
    "description": "Removes an item you created (such as a generated image) from the workspace media library. The operation is idempotent - archiving an already archived item succeeds. The underlying file is not deleted: existing URLs continue to work.",
    "operationId": "archiveImage",
    "parameters": [
     {
      "name": "savedMediaId",
      "required": true,
      "in": "path",
      "description": "The media library identifier of the item to archive, as returned in `image.savedMediaId` by the image generation status endpoint",
      "schema": {
       "type": "string"
      }
     }
    ],
    "responses": {
     "200": {
      "description": "Item archived successfully",
      "content": {
       "application/json": {
        "schema": {
         "$ref": "#/components/schemas/ArchiveImageResponse"
        }
       }
      }
     },
     "400": {
      "description": "Invalid request parameters"
     },
     "401": {
      "description": "Invalid or missing API key"
     },
     "403": {
      "description": "Access denied or feature not available"
     },
     "404": {
      "description": "Item not found"
     }
    },
    "summary": "Archive a media item",
    "tags": [
     "public-api"
    ]
   }
  },
  "/v1.0/agent/generations": {
   "post": {
    "description": "Creates an asynchronous generation job run by the Gamma agent. `prompt` is the only required field. Guidance fields (`numCards`, `sourceUrls`, `additionalInstructions`) are soft targets; `numCards` must not exceed the card maximum for the workspace plan. A `folderId` or `sharingOptions` setting that a workspace admin restricts is ignored and reported in `warnings`. Returns a `gen_`-prefixed generation ID to poll with `GET /v1.0/agent/generations/{generationId}`.",
    "operationId": "createAgentGeneration",
    "parameters": [],
    "requestBody": {
     "required": true,
     "content": {
      "application/json": {
       "schema": {
        "$ref": "#/components/schemas/CreateAgentGeneration"
       }
      }
     }
    },
    "responses": {
     "202": {
      "description": "Generation job created",
      "content": {
       "application/json": {
        "schema": {
         "$ref": "#/components/schemas/CreateAgentGenerationResponse"
        }
       }
      }
     },
     "400": {
      "description": "Invalid request parameters, `numCards` above the plan maximum, a `templateId` that is not an accessible template or gamma, a `themeId` that is not an available theme, or `themeId` combined with `templateId`"
     },
     "401": {
      "description": "Invalid or missing API key"
     },
     "403": {
      "description": "Insufficient credits, a `quality` tier the plan does not include, or access denied"
     },
     "429": {
      "description": "Rate limit exceeded, or the workspace has too many in-flight agent jobs (`code: workspace_concurrency_limit_exceeded`, with a `Retry-After` header)"
     },
     "503": {
      "description": "The service is busy; retry the request"
     }
    },
    "summary": "Create agent generation",
    "tags": [
     "public-api"
    ]
   }
  },
  "/v1.0/generations/from-template": {
   "post": {
    "description": "Creates an asynchronous generation job from a template Gamma with variable substitution.",
    "operationId": "createFromTemplateGeneration",
    "parameters": [],
    "requestBody": {
     "required": true,
     "content": {
      "application/json": {
       "schema": {
        "$ref": "#/components/schemas/FromTemplateGeneration"
       }
      }
     }
    },
    "responses": {
     "200": {
      "description": "Generation job created successfully",
      "content": {
       "application/json": {
        "schema": {
         "$ref": "#/components/schemas/FromTemplateGenerationResponse"
        }
       }
      }
     },
     "400": {
      "description": "Invalid request or template not found"
     },
     "401": {
      "description": "Invalid or missing API key"
     },
     "402": {
      "description": "Insufficient credits"
     },
     "403": {
      "description": "Feature not enabled for workspace"
     }
    },
    "summary": "Create generation from template",
    "tags": [
     "public-api"
    ]
   }
  },
  "/v1.0/generations": {
   "post": {
    "description": "Creates an asynchronous generation job. Provide either `inputText` for a single-page File, or a `pages` array to generate a multi-page File (optionally published as a Gamma site via `publish`). Returns a generation ID that can be used to poll for status.",
    "operationId": "createGeneration",
    "parameters": [],
    "requestBody": {
     "required": true,
     "content": {
      "application/json": {
       "schema": {
        "$ref": "#/components/schemas/Generation"
       }
      }
     }
    },
    "responses": {
     "200": {
      "description": "Generation job created successfully",
      "content": {
       "application/json": {
        "schema": {
         "$ref": "#/components/schemas/CreateGenerationResponse"
        }
       }
      }
     },
     "400": {
      "description": "Invalid request parameters"
     },
     "401": {
      "description": "Invalid or missing API key"
     },
     "402": {
      "description": "Insufficient credits"
     },
     "403": {
      "description": "Access denied or feature not available"
     }
    },
    "summary": "Create async generation",
    "tags": [
     "public-api"
    ]
   }
  },
  "/v1.0/images": {
   "post": {
    "description": "Creates an asynchronous image generation job that produces one standalone on-brand image. Returns an image generation ID that can be used to poll for status. If `themeId` is provided but does not exist or is not accessible to your workspace, the request fails with 400.",
    "operationId": "createImageGeneration",
    "parameters": [],
    "requestBody": {
     "required": true,
     "content": {
      "application/json": {
       "schema": {
        "$ref": "#/components/schemas/CreateImageGeneration"
       }
      }
     }
    },
    "responses": {
     "200": {
      "description": "Image generation job created successfully",
      "content": {
       "application/json": {
        "schema": {
         "$ref": "#/components/schemas/CreateImageGenerationResponse"
        }
       }
      }
     },
     "400": {
      "description": "Invalid request parameters"
     },
     "401": {
      "description": "Invalid or missing API key"
     },
     "402": {
      "description": "Insufficient credits"
     },
     "403": {
      "description": "Access denied or feature not available"
     },
     "404": {
      "description": "Not found"
     }
    },
    "summary": "Create async image generation",
    "tags": [
     "public-api"
    ]
   }
  },
  "/v1.0/gammas/{gammaId}": {
   "delete": {
    "description": "Deletes a Gamma document. Requires workspace admin role on the workspace the API key belongs to. The Gamma is auto-archived first if not already archived, so a single call handles the full archive-then-delete transition. The Gamma becomes immediately inaccessible and is removed from all workspace views. After deletion, the Gamma is no longer addressable via the API; subsequent requests for the same ID return the same response as for a non-existent Gamma.",
    "operationId": "deleteGamma",
    "parameters": [
     {
      "name": "gammaId",
      "required": true,
      "in": "path",
      "description": "The unique ID of the Gamma to delete",
      "schema": {
       "type": "string"
      }
     }
    ],
    "responses": {
     "200": {
      "description": "Gamma deleted successfully",
      "content": {
       "application/json": {
        "schema": {
         "$ref": "#/components/schemas/DeleteGammaResponse"
        }
       }
      }
     },
     "400": {
      "description": "Invalid request parameters"
     },
     "401": {
      "description": "Invalid or missing API key"
     },
     "403": {
      "description": "Access denied - workspace admin role required"
     }
    },
    "summary": "Delete a Gamma",
    "tags": [
     "public-api"
    ]
   },
   "get": {
    "description": "Returns metadata for a single gamma. Accepts either a file ID or the doc ID from a gamma.app/docs/... URL. Designed for link-preview integrations (Atlassian Smart Links, Notion Link Previews).",
    "operationId": "getGamma",
    "parameters": [
     {
      "name": "gammaId",
      "required": true,
      "in": "path",
      "description": "The gamma file ID or the doc ID from the gamma.app/docs/... URL",
      "schema": {
       "minLength": 1,
       "maxLength": 128,
       "pattern": "^[A-Za-z0-9_-]+$",
       "type": "string"
      }
     }
    ],
    "responses": {
     "200": {
      "description": "Gamma metadata retrieved successfully",
      "content": {
       "application/json": {
        "schema": {
         "$ref": "#/components/schemas/GetGammaResponse"
        }
       }
      }
     },
     "400": {
      "description": "Invalid gamma ID"
     },
     "401": {
      "description": "Invalid or missing credentials"
     },
     "403": {
      "description": "Access denied"
     },
     "404": {
      "description": "Gamma not found"
     }
    },
    "summary": "Get gamma metadata",
    "tags": [
     "public-api"
    ]
   }
  },
  "/v1.0/agent/gammas/{gammaId}/edits": {
   "post": {
    "description": "Creates an asynchronous AI edit of one page of an existing Gamma from a natural-language `prompt`. Returns an edit ID to poll with `GET /v1.0/agent/edits/{editId}`. Requires at least edit permission on the Gamma. Only one edit runs on a page at a time, and an edit cannot add pages.",
    "operationId": "editGamma",
    "parameters": [
     {
      "name": "gammaId",
      "required": true,
      "in": "path",
      "description": "The Gamma to edit: a gamma (file) ID, or a page ID (the id in a\ngamma.app/docs/<id> URL). A file ID edits the Gamma's main page; a page\nID edits that page.",
      "schema": {
       "type": "string"
      }
     }
    ],
    "requestBody": {
     "required": true,
     "content": {
      "application/json": {
       "schema": {
        "$ref": "#/components/schemas/EditGamma"
       }
      }
     }
    },
    "responses": {
     "201": {
      "description": "Edit job created",
      "content": {
       "application/json": {
        "schema": {
         "$ref": "#/components/schemas/EditGammaResponse"
        }
       }
      }
     },
     "400": {
      "description": "Invalid request parameters, or a Gamma that is archived, has no pages, or is of a type that cannot be edited"
     },
     "401": {
      "description": "Invalid or missing API key"
     },
     "403": {
      "description": "Insufficient credits, no edit permission on the Gamma, or a `quality` tier the plan does not include"
     },
     "404": {
      "description": "Gamma not found"
     },
     "409": {
      "description": "An edit is already in progress for this page (`code: edit_in_progress`, with the running `editId` when it belongs to your workspace)"
     },
     "429": {
      "description": "Rate limit exceeded, or the workspace has too many in-flight agent jobs (`code: workspace_concurrency_limit_exceeded`, with a `Retry-After` header)"
     },
     "503": {
      "description": "The service is busy; retry the request"
     }
    },
    "summary": "Edit an existing Gamma",
    "tags": [
     "public-api"
    ]
   }
  },
  "/v1.0/gammas/{gammaId}/export": {
   "post": {
    "description": "Creates an asynchronous export job for an existing Gamma in the requested format. Returns an export ID to poll for the download URL.",
    "operationId": "exportGamma",
    "parameters": [
     {
      "name": "gammaId",
      "required": true,
      "in": "path",
      "description": "The ID of the Gamma to export — accepts a gamma (file) ID or a page/doc ID (the id in a gamma.app/docs/<id> URL).",
      "schema": {
       "type": "string"
      }
     }
    ],
    "requestBody": {
     "required": true,
     "content": {
      "application/json": {
       "schema": {
        "$ref": "#/components/schemas/CreateExportRequest"
       }
      }
     }
    },
    "responses": {
     "200": {
      "description": "Export job created successfully",
      "content": {
       "application/json": {
        "schema": {
         "$ref": "#/components/schemas/CreateExportResponse"
        }
       }
      }
     },
     "400": {
      "description": "Invalid request parameters"
     },
     "401": {
      "description": "Invalid or missing API key"
     },
     "403": {
      "description": "Feature not available for workspace"
     },
     "404": {
      "description": "Gamma not found"
     }
    },
    "summary": "Export an existing Gamma",
    "tags": [
     "public-api"
    ]
   }
  },
  "/v1.0/agent/generations/{generationId}": {
   "get": {
    "description": "Retrieves the current status of an agent generation. Poll this endpoint until `status` is \"completed\" or \"failed\". The `gamma` object can appear on a pending generation once the document has been created.",
    "operationId": "getAgentGenerationStatus",
    "parameters": [
     {
      "name": "generationId",
      "required": true,
      "in": "path",
      "description": "The generation id returned by `POST /v1.0/agent/generations`.\nAgent generation ids are prefixed `gen_`.",
      "schema": {
       "maxLength": 128,
       "pattern": "^gen_[A-Za-z0-9]+$",
       "type": "string"
      }
     }
    ],
    "responses": {
     "200": {
      "description": "Generation status retrieved successfully",
      "content": {
       "application/json": {
        "schema": {
         "oneOf": [
          {
           "$ref": "#/components/schemas/PendingAgentGenerationResponse"
          },
          {
           "$ref": "#/components/schemas/CompletedAgentGenerationResponse"
          },
          {
           "$ref": "#/components/schemas/FailedAgentGenerationResponse"
          }
         ]
        }
       }
      }
     },
     "400": {
      "description": "Invalid request parameters"
     },
     "401": {
      "description": "Invalid or missing API key"
     },
     "404": {
      "description": "Generation not found"
     },
     "429": {
      "description": "Rate limit exceeded"
     }
    },
    "summary": "Get agent generation status",
    "tags": [
     "public-api"
    ]
   }
  },
  "/v1.0/agent/edits/{editId}": {
   "get": {
    "description": "Retrieves the current status of an edit job. Poll this endpoint until `status` is \"completed\" or \"failed\".",
    "operationId": "getEditStatus",
    "parameters": [
     {
      "name": "editId",
      "required": true,
      "in": "path",
      "description": "The edit ID returned by `POST /v1.0/agent/gammas/{gammaId}/edits`.",
      "schema": {
       "type": "string"
      }
     }
    ],
    "responses": {
     "200": {
      "description": "Edit status retrieved successfully",
      "content": {
       "application/json": {
        "schema": {
         "oneOf": [
          {
           "$ref": "#/components/schemas/PendingEditStatusResponse"
          },
          {
           "$ref": "#/components/schemas/CompletedEditStatusResponse"
          },
          {
           "$ref": "#/components/schemas/FailedEditStatusResponse"
          }
         ]
        }
       }
      }
     },
     "400": {
      "description": "Invalid request parameters"
     },
     "401": {
      "description": "Invalid or missing API key"
     },
     "404": {
      "description": "Edit not found"
     },
     "429": {
      "description": "Rate limit exceeded"
     }
    },
    "summary": "Get edit status",
    "tags": [
     "public-api"
    ]
   }
  },
  "/v1.0/exports/{id}": {
   "get": {
    "description": "Retrieves the current status of an export job. Poll this endpoint until status is \"completed\" or \"failed\".",
    "operationId": "getExportStatus",
    "parameters": [
     {
      "name": "id",
      "required": true,
      "in": "path",
      "description": "The unique export ID returned from the export endpoint",
      "schema": {
       "type": "string"
      }
     }
    ],
    "responses": {
     "200": {
      "description": "Export status retrieved successfully",
      "content": {
       "application/json": {
        "schema": {
         "$ref": "#/components/schemas/ExportStatusResponse"
        }
       }
      }
     },
     "400": {
      "description": "Invalid request parameters"
     },
     "401": {
      "description": "Invalid or missing API key"
     },
     "404": {
      "description": "Export not found"
     }
    },
    "summary": "Get export status",
    "tags": [
     "public-api"
    ]
   }
  },
  "/v1.0/gammas/{gammaId}/analytics": {
   "get": {
    "description": "Returns doc-level engagement metrics for a Gamma: total views, unique viewers/editors, card count, last opened time, and a 30-day daily unique-viewer breakdown. Requires at least edit permission on the Gamma. When the API key's user has manage permission the metrics cover all viewers (`scope: \"all\"`); otherwise they cover only that user's own activity (`scope: \"self\"`). Data is eventually consistent (~hourly).",
    "operationId": "getGammaAnalytics",
    "parameters": [
     {
      "name": "gammaId",
      "required": true,
      "in": "path",
      "description": "The ID of the Gamma — accepts a gamma (file) ID or a page/doc ID (the ID in a gamma.app/docs/<id> URL).",
      "schema": {
       "type": "string"
      }
     }
    ],
    "responses": {
     "200": {
      "description": "Analytics retrieved successfully",
      "content": {
       "application/json": {
        "schema": {
         "$ref": "#/components/schemas/GammaAnalytics"
        }
       }
      }
     },
     "400": {
      "description": "Invalid request parameters"
     },
     "401": {
      "description": "Invalid or missing API key"
     },
     "403": {
      "description": "Access denied — at least edit permission required"
     },
     "404": {
      "description": "Gamma not found"
     }
    },
    "summary": "Get Gamma analytics",
    "tags": [
     "public-api"
    ]
   }
  },
  "/v1.0/gammas/{gammaId}/analytics/cards": {
   "get": {
    "description": "Returns per-card engagement data for a Gamma: view time (absolute seconds) and viewer reach (percentage) per card. Requires at least edit permission on the Gamma. When the API key's user has manage permission the data covers all viewers (`scope: \"all\"`); otherwise it covers only that user's own activity (`scope: \"self\"`). Data is eventually consistent (~hourly).",
    "operationId": "getGammaCardAnalytics",
    "parameters": [
     {
      "name": "gammaId",
      "required": true,
      "in": "path",
      "description": "The ID of the Gamma — accepts a gamma (file) ID or a page/doc ID (the ID in a gamma.app/docs/<id> URL).",
      "schema": {
       "type": "string"
      }
     }
    ],
    "responses": {
     "200": {
      "description": "Card analytics retrieved successfully",
      "content": {
       "application/json": {
        "schema": {
         "$ref": "#/components/schemas/GammaCardAnalytics"
        }
       }
      }
     },
     "400": {
      "description": "Invalid request parameters"
     },
     "401": {
      "description": "Invalid or missing API key"
     },
     "403": {
      "description": "Access denied — at least edit permission required"
     },
     "404": {
      "description": "Gamma not found"
     }
    },
    "summary": "Get per-card analytics",
    "tags": [
     "public-api"
    ]
   }
  },
  "/v1.0/gammas/{gammaId}/comments": {
   "get": {
    "description": "Returns comment threads on a Gamma, cursor-paginated. Supports an updatedSince filter for efficient delta polling.",
    "operationId": "listGammaComments",
    "parameters": [
     {
      "name": "gammaId",
      "required": true,
      "in": "path",
      "description": "The ID of the Gamma to list comments for",
      "schema": {
       "type": "string"
      }
     },
     {
      "name": "limit",
      "required": false,
      "in": "query",
      "description": "Maximum number of comments to return per page",
      "schema": {
       "minimum": 1,
       "maximum": 50,
       "type": "number"
      }
     },
     {
      "name": "after",
      "required": false,
      "in": "query",
      "description": "Cursor for pagination (from previous response's nextCursor)",
      "schema": {
       "type": "string"
      }
     },
     {
      "name": "updatedSince",
      "required": false,
      "in": "query",
      "description": "ISO-8601 timestamp cursor. When provided, only comment threads with\nactivity (including new replies) after this timestamp are returned —\nenabling efficient delta polling.",
      "schema": {
       "type": "string"
      }
     },
     {
      "name": "includeArchived",
      "required": false,
      "in": "query",
      "description": "When true, archived (deleted) comments and replies are included in the\nresponse, each carrying an `archived` flag. Defaults to false.",
      "schema": {
       "type": "boolean"
      }
     }
    ],
    "responses": {
     "200": {
      "description": "Comments retrieved successfully",
      "content": {
       "application/json": {
        "schema": {
         "$ref": "#/components/schemas/ListCommentsResponse"
        }
       }
      }
     },
     "400": {
      "description": "Invalid request parameters (e.g. malformed updatedSince)"
     },
     "401": {
      "description": "Invalid or missing API key"
     },
     "403": {
      "description": "Insufficient permissions — caller must have comment-level access"
     },
     "404": {
      "description": "Gamma not found"
     }
    },
    "summary": "List comments on a Gamma",
    "tags": [
     "public-api"
    ]
   }
  },
  "/v1.0/gammas/{gammaId}/analytics/viewers": {
   "get": {
    "description": "Returns paginated per-viewer engagement data for a Gamma. Requires at least edit permission on the Gamma. When the API key's user has manage permission the list covers all viewers (`scope: \"all\"`); otherwise it contains at most that user's own row (`scope: \"self\"`). Viewers are capped at 500. Data is eventually consistent (~hourly).",
    "operationId": "getGammaViewerAnalytics",
    "parameters": [
     {
      "name": "gammaId",
      "required": true,
      "in": "path",
      "description": "The ID of the Gamma — accepts a gamma (file) ID or a page/doc ID (the ID in a gamma.app/docs/<id> URL).",
      "schema": {
       "type": "string"
      }
     },
     {
      "name": "limit",
      "required": false,
      "in": "query",
      "description": "Maximum number of viewers to return",
      "schema": {
       "minimum": 1,
       "maximum": 50,
       "type": "number"
      }
     },
     {
      "name": "after",
      "required": false,
      "in": "query",
      "description": "Cursor for pagination (from a previous response's nextCursor)",
      "schema": {
       "type": "string"
      }
     },
     {
      "name": "sortDirection",
      "required": false,
      "in": "query",
      "description": "Sort direction, applied to the viewer's most recent open time",
      "schema": {
       "type": "string",
       "enum": [
        "asc",
        "desc"
       ]
      }
     }
    ],
    "responses": {
     "200": {
      "description": "Viewer analytics retrieved successfully",
      "content": {
       "application/json": {
        "schema": {
         "$ref": "#/components/schemas/GammaViewerAnalytics"
        }
       }
      }
     },
     "400": {
      "description": "Invalid request parameters"
     },
     "401": {
      "description": "Invalid or missing API key"
     },
     "403": {
      "description": "Access denied — at least edit permission required"
     },
     "404": {
      "description": "Gamma not found"
     }
    },
    "summary": "Get per-viewer analytics",
    "tags": [
     "public-api"
    ]
   }
  },
  "/v1.0/gammas/{gammaId}/analytics/viewers/{userId}": {
   "get": {
    "description": "Returns one viewer's engagement with a Gamma: display name, email, last-opened time, cards viewed, and the relative time spent on each card (percentage of that viewer's total view time). Only authenticated viewers are addressable. Requires at least edit permission on the Gamma. When the API key's user has manage permission any viewer is addressable (`scope: \"all\"`); otherwise only the API key user's own activity is addressable (`scope: \"self\"`). Data is eventually consistent (~hourly).",
    "operationId": "getGammaViewerDetailAnalytics",
    "parameters": [
     {
      "name": "gammaId",
      "required": true,
      "in": "path",
      "description": "The ID of the Gamma — accepts a gamma (file) ID or a page/doc ID (the ID in a gamma.app/docs/<id> URL).",
      "schema": {
       "type": "string"
      }
     },
     {
      "name": "userId",
      "required": true,
      "in": "path",
      "description": "The viewer's user ID — the viewerId returned by the viewers list endpoint for authenticated viewers.",
      "schema": {
       "type": "string"
      }
     }
    ],
    "responses": {
     "200": {
      "description": "Viewer analytics retrieved successfully",
      "content": {
       "application/json": {
        "schema": {
         "$ref": "#/components/schemas/GammaViewerDetailAnalytics"
        }
       }
      }
     },
     "400": {
      "description": "Invalid request parameters"
     },
     "401": {
      "description": "Invalid or missing API key"
     },
     "403": {
      "description": "Access denied — at least edit permission required; manage permission required to address viewers other than yourself"
     },
     "404": {
      "description": "Gamma not found, or no viewer with this user ID"
     }
    },
    "summary": "Get single-viewer analytics",
    "tags": [
     "public-api"
    ]
   }
  },
  "/v1.0/generations/{id}": {
   "get": {
    "description": "Retrieves the current status of a generation job. Poll this endpoint until status is \"completed\" or \"failed\".",
    "operationId": "getGenerationStatus",
    "parameters": [
     {
      "name": "id",
      "required": true,
      "in": "path",
      "description": "The unique generation ID returned from the create endpoint",
      "schema": {
       "type": "string"
      }
     }
    ],
    "responses": {
     "200": {
      "description": "Generation status retrieved successfully",
      "content": {
       "application/json": {
        "schema": {
         "$ref": "#/components/schemas/GenerationStatusResponse"
        }
       }
      }
     },
     "400": {
      "description": "Invalid request parameters"
     },
     "401": {
      "description": "Invalid or missing API key"
     },
     "404": {
      "description": "Generation not found"
     }
    },
    "summary": "Get generation status",
    "tags": [
     "public-api"
    ]
   }
  },
  "/v1.0/images/{id}": {
   "get": {
    "description": "Retrieves the current status of an image generation job. Poll this endpoint until status is \"completed\" or \"failed\".",
    "operationId": "getImageGenerationStatus",
    "parameters": [
     {
      "name": "id",
      "required": true,
      "in": "path",
      "description": "The unique image generation ID returned from the create endpoint",
      "schema": {
       "type": "string"
      }
     }
    ],
    "responses": {
     "200": {
      "description": "Image generation status retrieved successfully",
      "content": {
       "application/json": {
        "schema": {
         "$ref": "#/components/schemas/ImageGenerationStatusResponse"
        }
       }
      }
     },
     "400": {
      "description": "Invalid request parameters"
     },
     "401": {
      "description": "Invalid or missing API key"
     },
     "404": {
      "description": "Image generation not found"
     }
    },
    "summary": "Get image generation status",
    "tags": [
     "public-api"
    ]
   }
  },
  "/v1.0/folders": {
   "get": {
    "description": "Lists all folders the authenticated user is a member of within the workspace.",
    "operationId": "listFolders",
    "parameters": [
     {
      "name": "query",
      "required": false,
      "in": "query",
      "description": "Search query to filter folders by name",
      "schema": {
       "type": "string"
      }
     },
     {
      "name": "limit",
      "required": false,
      "in": "query",
      "description": "Maximum number of folders to return",
      "schema": {
       "minimum": 1,
       "maximum": 50,
       "type": "number"
      }
     },
     {
      "name": "after",
      "required": false,
      "in": "query",
      "description": "Cursor for pagination (from previous response's nextCursor)",
      "schema": {
       "type": "string"
      }
     }
    ],
    "responses": {
     "200": {
      "description": "Folders retrieved successfully",
      "content": {
       "application/json": {
        "schema": {
         "$ref": "#/components/schemas/ListFoldersResponse"
        }
       }
      }
     },
     "400": {
      "description": "Invalid request parameters"
     },
     "401": {
      "description": "Invalid or missing API key"
     }
    },
    "summary": "List folders",
    "tags": [
     "public-api"
    ]
   }
  },
  "/v1.0/themes": {
   "get": {
    "description": "Lists all themes available to the workspace, including standard themes and custom workspace themes.",
    "operationId": "listThemes",
    "parameters": [
     {
      "name": "query",
      "required": false,
      "in": "query",
      "description": "Search query to filter themes by name",
      "schema": {
       "type": "string"
      }
     },
     {
      "name": "limit",
      "required": false,
      "in": "query",
      "description": "Maximum number of themes to return",
      "schema": {
       "minimum": 1,
       "maximum": 50,
       "type": "number"
      }
     },
     {
      "name": "after",
      "required": false,
      "in": "query",
      "description": "Cursor for pagination (from previous response's nextCursor)",
      "schema": {
       "type": "string"
      }
     },
     {
      "name": "type",
      "required": false,
      "in": "query",
      "description": "Filter by theme type: \"standard\" for built-in themes, \"custom\" for workspace-created themes. Must be kept consistent across paginated requests; changing it mid-pagination will yield inconsistent results.",
      "schema": {
       "type": "string",
       "enum": [
        "custom",
        "standard"
       ]
      }
     }
    ],
    "responses": {
     "200": {
      "description": "Themes retrieved successfully",
      "content": {
       "application/json": {
        "schema": {
         "$ref": "#/components/schemas/ListThemesResponse"
        }
       }
      }
     },
     "400": {
      "description": "Invalid request parameters"
     },
     "401": {
      "description": "Invalid or missing API key"
     }
    },
    "summary": "List themes",
    "tags": [
     "public-api"
    ]
   }
  },
  "/v1.0/gammas/search": {
   "get": {
    "description": "Full-text search over the gammas the caller can access, matched against titles and body text. When a query is provided, results are relevance-ranked. When no query is provided (an empty query with at least one filter), results are ordered by last-updated descending.",
    "operationId": "searchGammas",
    "parameters": [
     {
      "name": "q",
      "required": false,
      "in": "query",
      "description": "Full-text search query matched against gamma titles and body text.\nOptional when at least one filter (createdBy, updatedAfter, updatedBefore)\nis set.",
      "schema": {
       "type": "string"
      }
     },
     {
      "name": "createdBy",
      "required": false,
      "in": "query",
      "description": "Restrict results to gammas created by this user: 'me', an email address,\nor a user ID.",
      "schema": {
       "type": "string"
      }
     },
     {
      "name": "updatedAfter",
      "required": false,
      "in": "query",
      "description": "ISO-8601 lower bound (inclusive) on the gamma's last-updated time.",
      "schema": {
       "type": "string"
      }
     },
     {
      "name": "updatedBefore",
      "required": false,
      "in": "query",
      "description": "ISO-8601 upper bound (inclusive) on the gamma's last-updated time.",
      "schema": {
       "type": "string"
      }
     },
     {
      "name": "includeArchived",
      "required": false,
      "in": "query",
      "description": "When true, archived gammas are included in results. Defaults to false.",
      "schema": {
       "type": "boolean"
      }
     },
     {
      "name": "limit",
      "required": false,
      "in": "query",
      "description": "Maximum number of hits to return (1-25)",
      "schema": {
       "minimum": 1,
       "maximum": 25,
       "type": "number"
      }
     }
    ],
    "responses": {
     "200": {
      "description": "Search results retrieved successfully",
      "content": {
       "application/json": {
        "schema": {
         "$ref": "#/components/schemas/SearchGammasResponse"
        }
       }
      }
     },
     "400": {
      "description": "Invalid query parameters"
     },
     "401": {
      "description": "Invalid or missing credentials"
     },
     "503": {
      "description": "Document search is temporarily unavailable"
     }
    },
    "summary": "Search gammas",
    "tags": [
     "public-api"
    ]
   }
  },
  "/v1.0/templates/search": {
   "get": {
    "description": "Search the caller's workspace templates and the official Gamma explore templates. Returns two lists. With a query, workspace templates use best-effort relevance ranking against title and body text and may fall back to last-edited browse order, while explore templates use their best-effort ranking. An empty query returns both lists in browse order. Workspace browse results use last-edited order, most recent first. Workspace template IDs can be passed as the gammaId to generate-from-template, which validates eligibility at generation time and may reject some templates, such as multi-page or site-bound ones. Explore templates (the official Gamma templates) are not accepted as the gammaId for generate-from-template.",
    "operationId": "searchTemplates",
    "parameters": [
     {
      "name": "q",
      "required": false,
      "in": "query",
      "description": "Search query. Workspace templates use best-effort relevance ranking against title and body text and may fall back to last-edited browse order. Explore templates use their ranked search. When omitted, both lists are a browse.",
      "schema": {
       "maxLength": 2000,
       "type": "string"
      }
     },
     {
      "name": "limit",
      "required": false,
      "in": "query",
      "description": "Maximum number of hits to return per list (1-25)",
      "schema": {
       "minimum": 1,
       "maximum": 25,
       "type": "number"
      }
     }
    ],
    "responses": {
     "200": {
      "description": "Search results retrieved successfully",
      "content": {
       "application/json": {
        "schema": {
         "$ref": "#/components/schemas/SearchTemplatesResponse"
        }
       }
      }
     },
     "400": {
      "description": "Invalid query parameters"
     },
     "401": {
      "description": "Invalid or missing credentials"
     }
    },
    "summary": "Search templates",
    "tags": [
     "public-api"
    ]
   }
  }
 },
 "components": {
  "schemas": {
   "ArchiveGammaResponse": {
    "type": "object",
    "properties": {
     "gammaId": {
      "type": "string",
      "description": "The ID of the archived Gamma"
     },
     "archived": {
      "type": "boolean",
      "description": "Confirmation that the Gamma is archived"
     }
    },
    "required": [
     "gammaId",
     "archived"
    ]
   },
   "ArchiveImageResponse": {
    "type": "object",
    "properties": {
     "savedMediaId": {
      "type": "string",
      "description": "The media library identifier of the archived item"
     },
     "archived": {
      "type": "boolean",
      "description": "Confirmation that the item is archived"
     }
    },
    "required": [
     "savedMediaId",
     "archived"
    ]
   },
   "CreateAgentGeneration": {
    "type": "object",
    "properties": {
     "themeId": {
      "type": "string",
      "description": "Optional saved theme to apply, using an `id` from `GET /v1.0/themes`. The theme is applied on Gamma's Standard Brand Base design for the requested `format`. Cannot be combined with `templateId`: a template or gamma keeps its own look.",
      "minLength": 1,
      "maxLength": 128
     },
     "numCards": {
      "type": "integer",
      "description": "Target number of cards, capped at the plan's maximum (10 on free plans,\n100 on paid plans); a higher value is rejected with 400. Within the cap\nit is a soft target: the agent may deviate by a card or two, and the\nresult is not validated against it.",
      "minimum": 1,
      "maximum": 100
     },
     "prompt": {
      "type": "string",
      "description": "The brief: what to generate. The only required field.",
      "maxLength": 400000
     },
     "folderId": {
      "type": "string",
      "description": "Folder to place the generated Gamma in, within the caller's workspace.\nUse an `id` from `GET /v1.0/folders`."
     },
     "sharingOptions": {
      "description": "Access settings for the generated Gamma.",
      "allOf": [
       {
        "$ref": "#/components/schemas/AgentGenerationSharingOptions"
       }
      ]
     },
     "format": {
      "type": "string",
      "description": "Output format. Defaults to \"presentation\" when omitted. `webpage` is\nnot supported by the agent engine and is rejected.",
      "enum": [
       "document",
       "presentation",
       "social"
      ]
     },
     "templateId": {
      "type": "string",
      "description": "Optional starting point: the id of an accessible workspace template, of\na regular gamma in the workspace, or of an official\nGamma template (the `exploreTemplates[].id` returned by\n`GET /v1.0/templates/search`). The selection works the way picking the\nsame template or gamma in the Gamma app does: the prompt decides how the\nsource is used, from filling its layouts with new content to borrowing\nonly its look or moving its content onto a new design, and the source\nitself stays unchanged. An official template id names the currently\npublished copy: it survives routine\nupdates but can change when Gamma rebuilds or reintroduces the template,\nso rediscover it through the search endpoint if a saved id stops being\naccepted. Unknown, unauthorized, other-workspace, archived and retired\nids are all rejected with the same 400; no other template is substituted\nfor a rejected id.",
      "minLength": 1,
      "maxLength": 128
     },
     "quality": {
      "type": "string",
      "description": "Quality preset: \"lite\", \"standard\", or \"max\" — the same presets the\nGamma app offers. Higher presets are plan-gated. Omitting the field\ninherits the API default.",
      "enum": [
       "lite",
       "max",
       "standard"
      ]
     },
     "sourceUrls": {
      "description": "Guidance: up to 10 http or https URLs the agent should read and use as source material\n— a soft request, not a binding fetch list. A URL that cannot be read is\nskipped; it does not fail the generation.",
      "maxItems": 10,
      "type": "array",
      "items": {
       "type": "string",
       "format": "uri"
      }
     },
     "additionalInstructions": {
      "type": "string",
      "description": "Guidance: extra direction for the generation (tone, audience,\nlanguage, style). Treated as guidance the agent aims to follow, not\na constraint the output is validated against.",
      "minLength": 0,
      "maxLength": 5000
     },
     "exportAs": {
      "type": "string",
      "description": "Export the finished gamma after a successful generation as a PDF, PPTX,\nor PNG zip. Export failure is reported as a warning on the generation,\nnever as a failed generation.",
      "enum": [
       "pdf",
       "png",
       "pptx"
      ]
     },
     "disableConnectors": {
      "type": "boolean",
      "description": "Opt this run out of workspace connector access (e.g. Notion, Slack)."
     }
    },
    "required": [
     "prompt"
    ]
   },
   "AgentGenerationSharingOptions": {
    "type": "object",
    "properties": {
     "workspaceAccess": {
      "description": "Default access level for workspace members",
      "enum": [
       "comment",
       "edit",
       "fullAccess",
       "noAccess",
       "view"
      ],
      "type": "string"
     },
     "externalAccess": {
      "description": "Access level for external users (via shared link)",
      "enum": [
       "comment",
       "edit",
       "noAccess",
       "view"
      ],
      "type": "string"
     },
     "emailOptions": {
      "description": "Email sharing configuration",
      "allOf": [
       {
        "$ref": "#/components/schemas/EmailOptions"
       }
      ]
     }
    }
   },
   "EmailOptions": {
    "type": "object",
    "properties": {
     "access": {
      "description": "Permission level for email recipients",
      "enum": [
       "comment",
       "edit",
       "fullAccess",
       "view"
      ],
      "type": "string"
     },
     "recipients": {
      "description": "Email addresses to share with",
      "minItems": 1,
      "type": "array",
      "items": {
       "type": "string",
       "format": "email"
      }
     }
    },
    "required": [
     "recipients"
    ]
   },
   "CreateAgentGenerationResponse": {
    "type": "object",
    "properties": {
     "generationId": {
      "type": "string",
      "description": "Unique id for the generation job, prefixed `gen_`.",
      "pattern": "^gen_[A-Za-z0-9]+$"
     },
     "status": {
      "type": "string",
      "description": "Always \"pending\" on create.",
      "enum": [
       "pending"
      ]
     },
     "warnings": {
      "description": "Request-level warnings. Empty array when there are none.",
      "type": "array",
      "items": {
       "$ref": "#/components/schemas/AgentGenerationWarning"
      }
     }
    },
    "required": [
     "generationId",
     "status",
     "warnings"
    ]
   },
   "AgentGenerationWarning": {
    "type": "object",
    "properties": {
     "code": {
      "type": "string",
      "description": "Machine-readable warning code.",
      "enum": [
       "email_full_access_members_only",
       "email_invites_failed",
       "export_failed",
       "external_access_failed",
       "folder_placement_failed",
       "ignored_email_options",
       "ignored_email_recipients",
       "ignored_external_access",
       "ignored_folder_id",
       "ignored_workspace_access",
       "workspace_access_failed"
      ]
     },
     "message": {
      "type": "string",
      "description": "Human-readable explanation, suitable for display."
     }
    },
    "required": [
     "code",
     "message"
    ]
   },
   "FromTemplateGeneration": {
    "type": "object",
    "properties": {
     "exportAs": {
      "description": "Export format for automatic export after generation",
      "enum": [
       "pdf",
       "png",
       "pptx"
      ],
      "type": "string"
     },
     "prompt": {
      "type": "string",
      "description": "Text prompt describing what to generate",
      "minLength": 1,
      "maxLength": 400000
     },
     "title": {
      "type": "string",
      "description": "Custom title for the generated Gamma. If not provided, a title will be automatically generated from the content.",
      "minLength": 1,
      "maxLength": 500
     },
     "gammaId": {
      "type": "string",
      "description": "The File ID of the gamma to be used as a template. The File must contain exactly one Page."
     },
     "themeId": {
      "type": "string",
      "description": "Theme ID to apply to the generated Gamma"
     },
     "imageOptions": {
      "description": "Image generation options",
      "allOf": [
       {
        "$ref": "#/components/schemas/FromTemplateImageOptions"
       }
      ]
     },
     "sharingOptions": {
      "description": "Sharing and permissions options",
      "allOf": [
       {
        "$ref": "#/components/schemas/SharingOptions"
       }
      ]
     },
     "folderId": {
      "type": "string",
      "description": "Folder to place the generated Gamma in."
     },
     "folderIds": {
      "description": "Folder to place the generated Gamma in. Accepts at most 1 folder ID.\nIgnored when folderId is provided.",
      "deprecated": true,
      "maxItems": 1,
      "type": "array",
      "items": {
       "type": "string"
      }
     }
    },
    "required": [
     "prompt",
     "gammaId"
    ]
   },
   "FromTemplateImageOptions": {
    "type": "object",
    "properties": {
     "model": {
      "description": "AI model for image generation",
      "allOf": [
       {
        "$ref": "#/components/schemas/ImageModel"
       }
      ]
     },
     "style": {
      "type": "string",
      "description": "Style description for images",
      "minLength": 0,
      "maxLength": 5000
     }
    }
   },
   "ImageModel": {
    "type": "string",
    "enum": [
     "dall-e-3",
     "flux-1-pro",
     "flux-1-quick",
     "flux-1-ultra",
     "flux-2-flex",
     "flux-2-klein",
     "flux-2-max",
     "flux-2-pro",
     "flux-kontext-fast",
     "flux-kontext-max",
     "flux-kontext-pro",
     "gemini-2.5-flash-image",
     "gemini-3-pro-image",
     "gemini-3-pro-image-hd",
     "gemini-3.1-flash-image",
     "gemini-3.1-flash-image-hd",
     "gemini-3.1-flash-image-mini",
     "gpt-image-1-high",
     "gpt-image-1-medium",
     "gpt-image-1-mini-high",
     "gpt-image-1-mini-low",
     "gpt-image-1-mini-medium",
     "gpt-image-2",
     "gpt-image-2-hd",
     "gpt-image-2-mini",
     "ideogram-v3",
     "ideogram-v3-quality",
     "ideogram-v3-turbo",
     "leonardo-motion-2",
     "leonardo-motion-2-fast",
     "leonardo-phoenix",
     "luma-photon-1",
     "luma-photon-flash-1",
     "luma-ray-2",
     "luma-ray-2-flash",
     "recraft-v3",
     "recraft-v3-svg",
     "recraft-v4",
     "recraft-v4-pro",
     "recraft-v4-svg",
     "veo-3.1",
     "veo-3.1-fast"
    ],
    "description": "AI model to use for image generation"
   },
   "SharingOptions": {
    "type": "object",
    "properties": {
     "workspaceAccess": {
      "description": "Default access level for workspace members",
      "enum": [
       "comment",
       "edit",
       "fullAccess",
       "noAccess",
       "view"
      ],
      "type": "string"
     },
     "externalAccess": {
      "description": "Access level for external users (via shared link)",
      "enum": [
       "comment",
       "edit",
       "noAccess",
       "view"
      ],
      "type": "string"
     },
     "emailOptions": {
      "description": "Email sharing configuration",
      "allOf": [
       {
        "$ref": "#/components/schemas/EmailOptions"
       }
      ]
     }
    }
   },
   "FromTemplateGenerationResponse": {
    "type": "object",
    "properties": {
     "generationId": {
      "type": "string",
      "description": "Unique identifier for the generation job"
     },
     "warnings": {
      "type": "string",
      "description": "Warnings about the request"
     }
    },
    "required": [
     "generationId"
    ]
   },
   "Generation": {
    "type": "object",
    "properties": {
     "textMode": {
      "description": "How to interpret the input text",
      "enum": [
       "condense",
       "generate",
       "preserve"
      ],
      "type": "string"
     },
     "pages": {
      "description": "Generate multiple pages in a single File. When provided, takes precedence over the top-level per-page fields (`inputText`, `textMode`, `numCards`, `format`, `additionalInstructions`, `cardSplit`, `textOptions`, `imageOptions`). File-level options (theme, sharing, folders, card dimensions, export, publish) still apply to all pages. Up to 50 pages per request.",
      "minItems": 1,
      "maxItems": 50,
      "type": "array",
      "items": {
       "$ref": "#/components/schemas/PageGeneration"
      }
     },
     "format": {
      "description": "Output format for the generated Gamma",
      "enum": [
       "document",
       "presentation",
       "social",
       "webpage"
      ],
      "type": "string"
     },
     "cardSplit": {
      "description": "How to split content across cards",
      "enum": [
       "auto",
       "inputTextBreaks"
      ],
      "type": "string"
     },
     "exportAs": {
      "description": "Export format for automatic export after generation",
      "enum": [
       "pdf",
       "png",
       "pptx"
      ],
      "type": "string"
     },
     "inputText": {
      "type": "string",
      "description": "The text content to generate from (topic, outline, or full content)",
      "minLength": 1,
      "maxLength": 400000
     },
     "title": {
      "type": "string",
      "description": "Custom title for the generated Gamma. If not provided, a title will be automatically generated from the content.",
      "minLength": 1,
      "maxLength": 500
     },
     "additionalInstructions": {
      "type": "string",
      "description": "Additional instructions for the AI",
      "minLength": 0,
      "maxLength": 5000
     },
     "publish": {
      "type": "boolean",
      "description": "If true, publishes the generated File as a Gamma site after all\npages succeed. Applies to multi-page (`pages`) requests."
     },
     "numCards": {
      "type": "number",
      "description": "Target number of cards/slides to generate",
      "minimum": 1
     },
     "themeId": {
      "type": "string",
      "description": "Theme ID to apply (from /themes endpoint)"
     },
     "textOptions": {
      "description": "Text generation options",
      "allOf": [
       {
        "$ref": "#/components/schemas/TextOptions"
       }
      ]
     },
     "imageOptions": {
      "description": "Image generation and selection options",
      "allOf": [
       {
        "$ref": "#/components/schemas/ImageOptions"
       }
      ]
     },
     "cardOptions": {
      "description": "Card dimensions and layout options",
      "allOf": [
       {
        "$ref": "#/components/schemas/CardOptions"
       }
      ]
     },
     "sharingOptions": {
      "description": "Sharing and permissions options",
      "allOf": [
       {
        "$ref": "#/components/schemas/SharingOptions"
       }
      ]
     },
     "folderId": {
      "type": "string",
      "description": "Folder to place the generated Gamma in."
     },
     "folderIds": {
      "description": "Folder to place the generated Gamma in. Accepts at most 1 folder ID.\nIgnored when folderId is provided.",
      "deprecated": true,
      "maxItems": 1,
      "type": "array",
      "items": {
       "type": "string"
      }
     }
    }
   },
   "PageGeneration": {
    "type": "object",
    "properties": {
     "textMode": {
      "description": "How to interpret this page's input text",
      "enum": [
       "condense",
       "generate",
       "preserve"
      ],
      "type": "string"
     },
     "format": {
      "description": "Output format for this page",
      "enum": [
       "document",
       "presentation",
       "social",
       "webpage"
      ],
      "type": "string"
     },
     "cardSplit": {
      "description": "How to split content across cards for this page",
      "enum": [
       "auto",
       "inputTextBreaks"
      ],
      "type": "string"
     },
     "title": {
      "type": "string",
      "description": "Custom title for this page. If not provided, a title will be\nautomatically generated from the content.",
      "minLength": 1,
      "maxLength": 500
     },
     "inputText": {
      "type": "string",
      "description": "The text content to generate from (topic, outline, or full content)",
      "minLength": 1,
      "maxLength": 400000
     },
     "additionalInstructions": {
      "type": "string",
      "description": "Additional instructions for the AI for this page",
      "minLength": 0,
      "maxLength": 5000
     },
     "numCards": {
      "type": "number",
      "description": "Target number of cards for this page",
      "minimum": 1
     },
     "path": {
      "type": "string",
      "description": "URL slug for this page within the published site. When omitted,\nGamma derives a slug from the generated title and disambiguates\ncollisions. Honored for additional pages (pages 2..N); the first\npage is the File's main page and its path is implicit.",
      "minLength": 1,
      "maxLength": 500
     },
     "textOptions": {
      "description": "Text generation options for this page",
      "allOf": [
       {
        "$ref": "#/components/schemas/TextOptions"
       }
      ]
     },
     "imageOptions": {
      "description": "Image generation and selection options for this page",
      "allOf": [
       {
        "$ref": "#/components/schemas/ImageOptions"
       }
      ]
     }
    },
    "required": [
     "inputText"
    ]
   },
   "TextOptions": {
    "type": "object",
    "properties": {
     "amount": {
      "description": "Controls the amount of text generated per card",
      "enum": [
       "brief",
       "detailed",
       "extensive",
       "medium"
      ],
      "type": "string"
     },
     "language": {
      "description": "Language code for the generated content",
      "enum": [
       "af",
       "ar",
       "ar-sa",
       "bg",
       "bn",
       "bs",
       "ca",
       "cs",
       "cy",
       "da",
       "de",
       "el",
       "en",
       "en-gb",
       "en-in",
       "es",
       "es-419",
       "es-es",
       "es-mx",
       "et",
       "fa",
       "fi",
       "fr",
       "gu",
       "ha",
       "he",
       "hi",
       "hr",
       "hu",
       "id",
       "is",
       "it",
       "ja",
       "ja-da",
       "kk",
       "kn",
       "ko",
       "lt",
       "lv",
       "mk",
       "ml",
       "mr",
       "ms",
       "nb",
       "nl",
       "pl",
       "pt-br",
       "pt-pt",
       "ro",
       "ru",
       "sl",
       "sq",
       "sr",
       "sv",
       "sw",
       "ta",
       "te",
       "th",
       "tl",
       "tr",
       "uk",
       "ur",
       "uz",
       "vi",
       "yo",
       "zh-cn",
       "zh-tw"
      ],
      "type": "string"
     },
     "tone": {
      "type": "string",
      "description": "The tone or writing style for the generated text",
      "minLength": 0,
      "maxLength": 500
     },
     "audience": {
      "type": "string",
      "description": "The target audience for the content",
      "minLength": 0,
      "maxLength": 500
     }
    }
   },
   "ImageOptions": {
    "type": "object",
    "properties": {
     "model": {
      "description": "AI model to use for image generation",
      "allOf": [
       {
        "$ref": "#/components/schemas/ImageModel"
       }
      ]
     },
     "source": {
      "description": "Source for images: AI-generated or web search",
      "enum": [
       "aiGenerated",
       "giphy",
       "noImages",
       "pexels",
       "pictographic",
       "placeholder",
       "themeAccent",
       "webAllImages",
       "webFreeToUse",
       "webFreeToUseCommercially"
      ],
      "type": "string"
     },
     "style": {
      "type": "string",
      "description": "Style description for AI-generated images",
      "minLength": 0,
      "maxLength": 5000
     }
    }
   },
   "CardOptions": {
    "type": "object",
    "properties": {
     "dimensions": {
      "description": "Card aspect ratio/dimensions",
      "enum": [
       "16x9",
       "1x1",
       "4x3",
       "4x5",
       "9x16",
       "a4",
       "fluid",
       "letter",
       "pageless"
      ],
      "type": "string"
     },
     "headerFooter": {
      "description": "Header and footer configuration",
      "allOf": [
       {
        "$ref": "#/components/schemas/HeaderFooter"
       }
      ]
     }
    }
   },
   "HeaderFooter": {
    "type": "object",
    "properties": {
     "topLeft": {
      "description": "Element in top-left position",
      "allOf": [
       {
        "$ref": "#/components/schemas/HeaderFooterElement"
       }
      ]
     },
     "topCenter": {
      "description": "Element in top-center position",
      "allOf": [
       {
        "$ref": "#/components/schemas/HeaderFooterElement"
       }
      ]
     },
     "topRight": {
      "description": "Element in top-right position",
      "allOf": [
       {
        "$ref": "#/components/schemas/HeaderFooterElement"
       }
      ]
     },
     "bottomLeft": {
      "description": "Element in bottom-left position",
      "allOf": [
       {
        "$ref": "#/components/schemas/HeaderFooterElement"
       }
      ]
     },
     "bottomCenter": {
      "description": "Element in bottom-center position",
      "allOf": [
       {
        "$ref": "#/components/schemas/HeaderFooterElement"
       }
      ]
     },
     "bottomRight": {
      "description": "Element in bottom-right position",
      "allOf": [
       {
        "$ref": "#/components/schemas/HeaderFooterElement"
       }
      ]
     },
     "hideFromFirstCard": {
      "type": "boolean",
      "description": "Hide header/footer from the first card (title card)"
     },
     "hideFromLastCard": {
      "type": "boolean",
      "description": "Hide header/footer from the last card"
     }
    }
   },
   "HeaderFooterElement": {
    "type": "object",
    "properties": {
     "type": {
      "type": "string",
      "description": "Type of element to display",
      "enum": [
       "cardNumber",
       "image",
       "text"
      ]
     },
     "source": {
      "type": "string",
      "description": "Image source type (required when type is \"image\")",
      "enum": [
       "custom",
       "themeLogo"
      ]
     },
     "src": {
      "type": "string",
      "description": "Custom image URL (required when source is \"custom\")",
      "format": "uri",
      "minLength": 1,
      "maxLength": 2048
     },
     "value": {
      "type": "string",
      "description": "Text content (required when type is \"text\")",
      "minLength": 1,
      "maxLength": 500
     },
     "size": {
      "type": "string",
      "description": "Size of the image element",
      "enum": [
       "lg",
       "md",
       "sm",
       "xl"
      ]
     }
    },
    "required": [
     "type"
    ]
   },
   "CreateGenerationResponse": {
    "type": "object",
    "properties": {
     "generationId": {
      "type": "string",
      "description": "Unique identifier for the generation job"
     },
     "warnings": {
      "type": "string",
      "description": "File-level warnings about the request (e.g., ignored sharing,\nfolder, or dimension options that apply to the whole gamma)."
     },
     "pageWarnings": {
      "description": "Page-level warnings, one entry per requested page (index-aligned\nwith the `pages` request array); `null` for a page with none. Each\nentry contains only that page's warnings.",
      "type": "array",
      "items": {
       "type": "string"
      }
     }
    },
    "required": [
     "generationId"
    ]
   },
   "CreateImageGeneration": {
    "type": "object",
    "properties": {
     "type": {
      "description": "Visual style of the generated images. Defaults to \"illustration\".\nSkipped when referenceImages are present — references take precedence\nand style comes from the prompt.",
      "enum": [
       "abstract",
       "illustration",
       "photo",
       "scene"
      ],
      "type": "string",
      "default": "illustration"
     },
     "sizePreset": {
      "description": "Output size preset (sets the aspect ratio; exact pixel dimensions are\nmodel-determined). Defaults to \"social-square\" (1:1).",
      "enum": [
       "banner",
       "slide",
       "social-portrait",
       "social-square",
       "story"
      ],
      "type": "string",
      "default": "social-square"
     },
     "referenceImages": {
      "description": "Reference images with subject semantics (\"put this character or product\nin the scene\"). Maximum 4. When present, they take precedence over `type`\nand `themeId`.",
      "maxItems": 4,
      "type": "array",
      "items": {
       "$ref": "#/components/schemas/ReferenceImage"
      }
     },
     "prompt": {
      "type": "string",
      "description": "Description of the image to generate. Background treatments (\"on white\",\n\"contained in a circle\") go here.",
      "maxLength": 5000,
      "pattern": "\\S"
     },
     "themeId": {
      "type": "string",
      "description": "Theme to brand the images with. Defaults to the workspace default theme.\nApplied for all types except `\"scene\"`, whose curated style ignores theme\ncolors (a `theme_ignored_for_type` warning is returned if you supply\n`themeId` for `scene`). Also ignored when referenceImages are present —\nreferences drive the look."
     }
    },
    "required": [
     "prompt"
    ]
   },
   "ReferenceImage": {
    "type": "object",
    "properties": {
     "url": {
      "type": "string",
      "description": "HTTPS URL of the reference image. The server fetches, validates, and\nrehosts the image before generation.",
      "format": "uri",
      "pattern": "^https://"
     },
     "role": {
      "type": "string",
      "description": "How the reference influences generation. `subject` places the pictured\ncharacter or product into the generated scene.",
      "enum": [
       "subject"
      ]
     }
    },
    "required": [
     "url"
    ]
   },
   "CreateImageGenerationResponse": {
    "type": "object",
    "properties": {
     "imageGenerationId": {
      "type": "string",
      "description": "Unique identifier for the image generation job. Poll\n`GET /v1.0/images/{id}` with this id until status is \"completed\" or\n\"failed\"."
     },
     "warnings": {
      "description": "Warnings known at request time (e.g. a skipped style or theme)",
      "type": "array",
      "items": {
       "$ref": "#/components/schemas/ImageGenerationWarning"
      }
     }
    },
    "required": [
     "imageGenerationId"
    ]
   },
   "ImageGenerationWarning": {
    "type": "object",
    "properties": {
     "code": {
      "description": "Machine-readable warning code",
      "enum": [
       "curated_style_skipped_for_references",
       "no_brand_theme_applied",
       "theme_ignored_for_type",
       "theme_skipped_for_references"
      ],
      "type": "string"
     },
     "message": {
      "type": "string",
      "description": "Human-readable explanation"
     }
    },
    "required": [
     "code",
     "message"
    ]
   },
   "DeleteGammaResponse": {
    "type": "object",
    "properties": {
     "status": {
      "type": "string",
      "description": "Status of the deletion request. Always `deleted` on success.",
      "enum": [
       "deleted"
      ]
     },
     "gammaId": {
      "type": "string",
      "description": "The ID of the deleted Gamma"
     },
     "message": {
      "type": "string",
      "description": "Customer-facing message confirming the Gamma has been deleted."
     }
    },
    "required": [
     "status",
     "gammaId",
     "message"
    ]
   },
   "EditGamma": {
    "type": "object",
    "properties": {
     "prompt": {
      "type": "string",
      "description": "Natural-language instruction describing the edit.",
      "maxLength": 10000
     },
     "quality": {
      "type": "string",
      "description": "How much model effort the edit runs with, matching the quality tiers in the\nGamma agent UI. `max` requires a plan that includes it. An omitted quality\nruns the highest default tier the plan allows.",
      "enum": [
       "lite",
       "max",
       "standard"
      ]
     },
     "disableConnectors": {
      "type": "boolean",
      "description": "Opt this edit out of workspace connector access (e.g. Notion, Slack)."
     }
    },
    "required": [
     "prompt"
    ]
   },
   "EditGammaResponse": {
    "type": "object",
    "properties": {
     "editId": {
      "type": "string",
      "description": "Unique ID for the edit job. Poll `GET /v1.0/agent/edits/{editId}` with it."
     },
     "gammaUrl": {
      "type": "string",
      "description": "URL to the Gamma being edited"
     }
    },
    "required": [
     "editId",
     "gammaUrl"
    ]
   },
   "CreateExportRequest": {
    "type": "object",
    "properties": {
     "exportAs": {
      "description": "File format to export the Gamma to.",
      "enum": [
       "pdf",
       "png",
       "pptx"
      ],
      "type": "string"
     }
    },
    "required": [
     "exportAs"
    ]
   },
   "CreateExportResponse": {
    "type": "object",
    "properties": {
     "exportId": {
      "type": "string",
      "description": "Unique identifier for the export job. Poll `GET /v1.0/exports/:id` with it."
     }
    },
    "required": [
     "exportId"
    ]
   },
   "PendingAgentGenerationResponse": {
    "type": "object",
    "properties": {
     "generationId": {
      "type": "string",
      "description": "Unique id for the generation job, prefixed `gen_`.",
      "pattern": "^gen_[A-Za-z0-9]+$"
     },
     "status": {
      "type": "string",
      "enum": [
       "pending"
      ]
     },
     "gamma": {
      "description": "Can appear once the document has been created.",
      "allOf": [
       {
        "$ref": "#/components/schemas/AgentGenerationGamma"
       }
      ]
     },
     "warnings": {
      "description": "Always empty while pending. Request-level warnings are returned on create\nand again on the completed response.",
      "type": "array",
      "items": {
       "$ref": "#/components/schemas/AgentGenerationWarning"
      }
     },
     "updatedTime": {
      "type": "string",
      "description": "ISO-8601 timestamp of the last state change."
     }
    },
    "required": [
     "generationId",
     "status",
     "warnings",
     "updatedTime"
    ]
   },
   "AgentGenerationGamma": {
    "type": "object",
    "properties": {
     "gammaId": {
      "type": "string",
      "description": "File id of the generated gamma."
     },
     "gammaUrl": {
      "type": "string",
      "description": "Editor URL of the generated gamma."
     }
    },
    "required": [
     "gammaId",
     "gammaUrl"
    ]
   },
   "CompletedAgentGenerationResponse": {
    "type": "object",
    "properties": {
     "generationId": {
      "type": "string",
      "description": "Unique id for the generation job, prefixed `gen_`.",
      "pattern": "^gen_[A-Za-z0-9]+$"
     },
     "status": {
      "type": "string",
      "enum": [
       "completed"
      ]
     },
     "gamma": {
      "$ref": "#/components/schemas/AgentGenerationGamma"
     },
     "result": {
      "$ref": "#/components/schemas/AgentGenerationResult"
     },
     "exportUrl": {
      "type": "string",
      "description": "Download URL for the exported artifact. Present only when `exportAs`\nwas requested and the export succeeded; a failed export appears as an\n`export_failed` warning instead."
     },
     "warnings": {
      "description": "Warnings accumulated during the run. Empty array when there are none.",
      "type": "array",
      "items": {
       "$ref": "#/components/schemas/AgentGenerationWarning"
      }
     },
     "updatedTime": {
      "type": "string",
      "description": "ISO-8601 timestamp of the last state change."
     },
     "credits": {
      "description": "Credit accounting for this job. Present on every completed or failed\nresponse; each member is best-effort and omitted when unknown.",
      "allOf": [
       {
        "$ref": "#/components/schemas/AgentCreditsResponse"
       }
      ]
     }
    },
    "required": [
     "generationId",
     "status",
     "gamma",
     "result",
     "warnings",
     "updatedTime",
     "credits"
    ]
   },
   "AgentGenerationResult": {
    "type": "object",
    "properties": {
     "summary": {
      "type": "string",
      "description": "Agent-written summary of what was generated."
     }
    },
    "required": [
     "summary"
    ]
   },
   "AgentCreditsResponse": {
    "type": "object",
    "properties": {
     "deducted": {
      "type": "number",
      "description": "Credits recorded as debited from your balance for this job so far: the\nagent's model and tool spend settled from its ledger plus image generation\ncharged as it ran. Actual amounts removed, not list prices — spend that\ncould not be charged because the balance was empty is not included. It can\nstill grow if a late settlement lands after completion, and accounting is\nbest-effort: a failed record write can leave it low, and `0` means no\ncharge was recorded. Omitted when the job's charge record cannot be\nlooked up at all."
     },
     "remaining": {
      "type": "number",
      "description": "Credits currently available to the authenticated user in this workspace,\nread when this status was served. Not what this job cost: other jobs,\npurchases and refills move it between polls. Omitted if the balance\nlookup fails."
     }
    }
   },
   "FailedAgentGenerationResponse": {
    "type": "object",
    "properties": {
     "generationId": {
      "type": "string",
      "description": "Unique id for the generation job, prefixed `gen_`.",
      "pattern": "^gen_[A-Za-z0-9]+$"
     },
     "status": {
      "type": "string",
      "enum": [
       "failed"
      ]
     },
     "gamma": {
      "description": "Present when the document was created before the failure.",
      "allOf": [
       {
        "$ref": "#/components/schemas/AgentGenerationGamma"
       }
      ]
     },
     "error": {
      "$ref": "#/components/schemas/AgentGenerationError"
     },
     "warnings": {
      "description": "Usually empty: warnings returned on create are not guaranteed to be\nrepeated here, so keep them from the create response.",
      "type": "array",
      "items": {
       "$ref": "#/components/schemas/AgentGenerationWarning"
      }
     },
     "updatedTime": {
      "type": "string",
      "description": "ISO-8601 timestamp of the last state change."
     },
     "credits": {
      "description": "Credit accounting for this job. Present on every completed or failed\nresponse; each member is best-effort and omitted when unknown.",
      "allOf": [
       {
        "$ref": "#/components/schemas/AgentCreditsResponse"
       }
      ]
     }
    },
    "required": [
     "generationId",
     "status",
     "error",
     "warnings",
     "updatedTime",
     "credits"
    ]
   },
   "AgentGenerationError": {
    "type": "object",
    "properties": {
     "reason": {
      "type": "string",
      "description": "Machine-readable failure reason.",
      "enum": [
       "access_revoked",
       "generation_failed",
       "insufficient_credits",
       "timeout",
       "unavailable"
      ]
     },
     "message": {
      "type": "string",
      "description": "Human-readable explanation."
     },
     "statusCode": {
      "type": "number",
      "description": "HTTP-style status code for the failure reason."
     }
    },
    "required": [
     "reason",
     "message",
     "statusCode"
    ]
   },
   "PendingEditStatusResponse": {
    "type": "object",
    "properties": {
     "status": {
      "type": "string",
      "enum": [
       "pending"
      ]
     },
     "editId": {
      "type": "string",
      "description": "Unique ID for the edit job."
     },
     "gammaId": {
      "type": "string",
      "description": "File ID of the Gamma being edited."
     },
     "gammaUrl": {
      "type": "string",
      "description": "URL to the Gamma being edited"
     },
     "pageId": {
      "type": "string",
      "description": "ID of the page the edit applies to."
     },
     "updatedTime": {
      "type": "string",
      "description": "ISO-8601 timestamp of the last state change."
     }
    },
    "required": [
     "status",
     "editId",
     "gammaId",
     "gammaUrl",
     "pageId",
     "updatedTime"
    ]
   },
   "CompletedEditStatusResponse": {
    "type": "object",
    "properties": {
     "status": {
      "type": "string",
      "enum": [
       "completed"
      ]
     },
     "editId": {
      "type": "string",
      "description": "Unique ID for the edit job."
     },
     "gammaId": {
      "type": "string",
      "description": "File ID of the edited Gamma."
     },
     "gammaUrl": {
      "type": "string",
      "description": "URL to the Gamma being edited"
     },
     "pageId": {
      "type": "string",
      "description": "ID of the page the edit applies to."
     },
     "result": {
      "$ref": "#/components/schemas/EditResult"
     },
     "updatedTime": {
      "type": "string",
      "description": "ISO-8601 timestamp of the last state change."
     },
     "credits": {
      "description": "Credit accounting for this job. Present on every completed or failed\nresponse; each member is best-effort and omitted when unknown.",
      "allOf": [
       {
        "$ref": "#/components/schemas/AgentCreditsResponse"
       }
      ]
     }
    },
    "required": [
     "status",
     "editId",
     "gammaId",
     "gammaUrl",
     "pageId",
     "result",
     "updatedTime",
     "credits"
    ]
   },
   "EditResult": {
    "type": "object",
    "properties": {
     "summary": {
      "type": "string",
      "description": "Agent-written summary of the applied changes."
     }
    },
    "required": [
     "summary"
    ]
   },
   "FailedEditStatusResponse": {
    "type": "object",
    "properties": {
     "status": {
      "type": "string",
      "enum": [
       "failed"
      ]
     },
     "editId": {
      "type": "string",
      "description": "Unique ID for the edit job."
     },
     "gammaId": {
      "type": "string",
      "description": "File ID of the Gamma being edited."
     },
     "gammaUrl": {
      "type": "string",
      "description": "URL to the Gamma being edited"
     },
     "pageId": {
      "type": "string",
      "description": "ID of the page the edit applies to."
     },
     "error": {
      "$ref": "#/components/schemas/EditError"
     },
     "updatedTime": {
      "type": "string",
      "description": "ISO-8601 timestamp of the last state change."
     },
     "credits": {
      "description": "Credit accounting for this job. Present on every completed or failed\nresponse; each member is best-effort and omitted when unknown.",
      "allOf": [
       {
        "$ref": "#/components/schemas/AgentCreditsResponse"
       }
      ]
     }
    },
    "required": [
     "status",
     "editId",
     "gammaId",
     "gammaUrl",
     "pageId",
     "error",
     "updatedTime",
     "credits"
    ]
   },
   "EditError": {
    "type": "object",
    "properties": {
     "reason": {
      "description": "Machine-readable failure reason. A failed edit may have been partially\napplied, so inspect the Gamma before retrying.",
      "enum": [
       "access_revoked",
       "edit_failed",
       "insufficient_credits",
       "target_not_found",
       "timeout",
       "unavailable",
       "unsupported_target"
      ],
      "type": "string"
     },
     "message": {
      "type": "string",
      "description": "Human-readable explanation."
     },
     "statusCode": {
      "type": "number",
      "description": "HTTP-style status code for the failure reason."
     }
    },
    "required": [
     "reason",
     "message",
     "statusCode"
    ]
   },
   "ExportStatusResponse": {
    "type": "object",
    "properties": {
     "exportAs": {
      "description": "The requested export format, echoed from the request. Always present —\npinned from the original request, so it's returned for every status\n(`pending`, `completed`, and `failed`).",
      "enum": [
       "pdf",
       "png",
       "pptx"
      ],
      "type": "string"
     },
     "exportId": {
      "type": "string",
      "description": "Unique identifier for the export job."
     },
     "status": {
      "type": "string",
      "description": "Current status of the export job. Poll until \"completed\" or \"failed\".",
      "enum": [
       "completed",
       "failed",
       "pending"
      ]
     },
     "gammaId": {
      "type": "string",
      "description": "Canonical file ID of the exported Gamma. Always present. Always the file\nID, even when a page/doc ID was supplied as `gammaId` in the export request\n(it resolves to its parent gamma), so this may differ from the value you\npassed."
     },
     "exportUrl": {
      "type": "string",
      "description": "URL to download the exported file (when completed). The file format matches\n`exportAs`: `pptx` → .pptx, `pdf` → .pdf, `png` → a .zip archive containing\none PNG per card (not a single PNG file). Anyone with this URL can download\nthe file until it expires (about one week) — access is not tied to your API\nkey. Treat the link as a secret: don't log it, share it, or embed it in\nclient-side code."
     },
     "error": {
      "description": "Error details (when failed).",
      "allOf": [
       {
        "$ref": "#/components/schemas/ExportError"
       }
      ]
     }
    },
    "required": [
     "exportAs",
     "exportId",
     "status",
     "gammaId"
    ]
   },
   "ExportError": {
    "type": "object",
    "properties": {
     "reason": {
      "description": "Machine-readable failure reason so callers can react programmatically.\n`render_timeout` and `export_failed` are transient (safe to retry);\n`deck_too_large` and `no_content` require changing the input.",
      "enum": [
       "deck_too_large",
       "export_failed",
       "no_content",
       "render_timeout"
      ],
      "type": "string"
     },
     "message": {
      "type": "string",
      "description": "Human-readable error message."
     },
     "statusCode": {
      "type": "number",
      "description": "Indicative status code for the failure."
     }
    },
    "required": [
     "message",
     "statusCode"
    ]
   },
   "GammaAnalytics": {
    "type": "object",
    "properties": {
     "scope": {
      "description": "Which activity the metrics cover: `all` — every viewer of the Gamma\n(the API key's user has manage permission); `self` — only the API key\nuser's own activity (edit permission).",
      "enum": [
       "all",
       "self"
      ],
      "type": "string"
     },
     "gammaId": {
      "type": "string",
      "description": "The Gamma (file) ID"
     },
     "totalViews": {
      "type": "number",
      "description": "Total number of view events, including repeat opens by the same viewer."
     },
     "uniqueViewers": {
      "type": "number",
      "description": "Total unique viewers (authenticated + anonymous)"
     },
     "uniqueEditors": {
      "type": "number",
      "description": "Total unique editors"
     },
     "cardCount": {
      "type": "number",
      "description": "Number of cards in the Gamma"
     },
     "lastOpened": {
      "type": "string",
      "nullable": true,
      "description": "ISO-8601 timestamp of the most recent view, or null if never viewed"
     },
     "dailyViews": {
      "description": "Daily unique viewer breakdown (30-day rolling window)",
      "allOf": [
       {
        "$ref": "#/components/schemas/DailyViews"
       }
      ]
     }
    },
    "required": [
     "scope",
     "gammaId",
     "totalViews",
     "uniqueViewers",
     "uniqueEditors",
     "cardCount",
     "lastOpened",
     "dailyViews"
    ]
   },
   "DailyViews": {
    "type": "object",
    "properties": {
     "dayCount": {
      "type": "number",
      "description": "Number of days in the window"
     },
     "timezone": {
      "type": "string",
      "description": "IANA timezone used for day boundaries"
     },
     "days": {
      "description": "Per-day viewer counts",
      "type": "array",
      "items": {
       "$ref": "#/components/schemas/DailyViewEntry"
      }
     }
    },
    "required": [
     "dayCount",
     "timezone",
     "days"
    ]
   },
   "DailyViewEntry": {
    "type": "object",
    "properties": {
     "date": {
      "type": "string",
      "description": "Calendar date (YYYY-MM-DD)"
     },
     "uniqueViewers": {
      "type": "number",
      "description": "Number of unique viewers on this day"
     }
    },
    "required": [
     "date",
     "uniqueViewers"
    ]
   },
   "GammaCardAnalytics": {
    "type": "object",
    "properties": {
     "scope": {
      "description": "Which activity the card stats cover: `all` — every viewer of the Gamma\n(the API key's user has manage permission); `self` — only the API key\nuser's own activity (edit permission).",
      "enum": [
       "all",
       "self"
      ],
      "type": "string"
     },
     "gammaId": {
      "type": "string",
      "description": "The Gamma (file) ID"
     },
     "uniqueViewers": {
      "type": "number",
      "description": "Total unique viewers for the Gamma"
     },
     "uniqueEditors": {
      "type": "number",
      "description": "Total unique editors"
     },
     "cardCount": {
      "type": "number",
      "description": "Number of cards in the Gamma"
     },
     "cards": {
      "description": "Per-card engagement stats for every card in the Gamma, ordered by card\nposition. Cards with no recorded activity have zeroed stats.",
      "type": "array",
      "items": {
       "$ref": "#/components/schemas/CardAnalyticsEntry"
      }
     }
    },
    "required": [
     "scope",
     "gammaId",
     "uniqueViewers",
     "uniqueEditors",
     "cardCount",
     "cards"
    ]
   },
   "CardAnalyticsEntry": {
    "type": "object",
    "properties": {
     "cardId": {
      "type": "string",
      "description": "The card ID within the Gamma"
     },
     "cardName": {
      "type": "string",
      "nullable": true,
      "description": "Title of the card, or null if the card has no discernible title"
     },
     "cardPosition": {
      "type": "number",
      "description": "1-indexed position of the card within the Gamma"
     },
     "viewTimeSeconds": {
      "type": "number",
      "description": "Total view time across all viewers, in seconds"
     },
     "viewersPercent": {
      "type": "number",
      "description": "Percentage of unique viewers who viewed this card (0-100)"
     }
    },
    "required": [
     "cardId",
     "cardName",
     "cardPosition",
     "viewTimeSeconds",
     "viewersPercent"
    ]
   },
   "ListCommentsResponse": {
    "type": "object",
    "properties": {
     "data": {
      "description": "Array of comment threads",
      "type": "array",
      "items": {
       "$ref": "#/components/schemas/CommentItem"
      }
     },
     "hasMore": {
      "type": "boolean",
      "description": "Whether more results exist beyond this page"
     },
     "nextCursor": {
      "type": "string",
      "nullable": true,
      "description": "Cursor for fetching the next page (null if no more results)"
     }
    },
    "required": [
     "data",
     "hasMore",
     "nextCursor"
    ]
   },
   "CommentItem": {
    "type": "object",
    "properties": {
     "id": {
      "type": "string",
      "description": "Unique comment identifier"
     },
     "cardId": {
      "type": "string",
      "nullable": true,
      "description": "ID of the card this comment is attached to, or null for page-level comments"
     },
     "targetText": {
      "type": "string",
      "nullable": true,
      "description": "Quoted snippet of the text the comment targets, as plain text"
     },
     "targetHtml": {
      "type": "string",
      "nullable": true,
      "description": "Quoted snippet of the text the comment targets, as HTML"
     },
     "author": {
      "description": "Author of the comment",
      "allOf": [
       {
        "$ref": "#/components/schemas/CommentAuthor"
       }
      ]
     },
     "contentText": {
      "type": "string",
      "description": "Comment content as plain text — text, @mentions, and emoji, with paragraphs\nseparated by newlines."
     },
     "status": {
      "type": "string",
      "description": "Comment status: open or closed",
      "enum": [
       "closed",
       "open"
      ]
     },
     "archived": {
      "type": "boolean",
      "description": "Whether the comment has been archived (deleted)"
     },
     "mentionedUsers": {
      "description": "Users mentioned in this comment (user IDs)",
      "type": "array",
      "items": {
       "type": "string"
      }
     },
     "replies": {
      "description": "Threaded replies to this comment",
      "type": "array",
      "items": {
       "$ref": "#/components/schemas/CommentReply"
      }
     },
     "createdTime": {
      "type": "string",
      "description": "ISO-8601 timestamp of when the comment was created"
     },
     "updatedTime": {
      "type": "string",
      "description": "ISO-8601 timestamp of when the comment was last modified"
     }
    },
    "required": [
     "id",
     "cardId",
     "targetText",
     "targetHtml",
     "author",
     "contentText",
     "status",
     "archived",
     "mentionedUsers",
     "replies",
     "createdTime",
     "updatedTime"
    ]
   },
   "CommentAuthor": {
    "type": "object",
    "properties": {
     "id": {
      "type": "string",
      "description": "Unique user identifier"
     },
     "name": {
      "type": "string",
      "nullable": true,
      "description": "Display name of the author, or null if the user has no name set"
     }
    },
    "required": [
     "id",
     "name"
    ]
   },
   "CommentReply": {
    "type": "object",
    "properties": {
     "id": {
      "type": "string",
      "description": "Unique reply identifier"
     },
     "author": {
      "description": "Author of the reply",
      "allOf": [
       {
        "$ref": "#/components/schemas/CommentAuthor"
       }
      ]
     },
     "contentText": {
      "type": "string",
      "description": "Reply content as plain text — text, @mentions, and emoji, with paragraphs\nseparated by newlines."
     },
     "mentionedUsers": {
      "description": "Users mentioned in this reply (user IDs)",
      "type": "array",
      "items": {
       "type": "string"
      }
     },
     "archived": {
      "type": "boolean",
      "description": "Whether the reply has been archived (deleted)"
     },
     "createdTime": {
      "type": "string",
      "description": "ISO-8601 timestamp of when the reply was created"
     },
     "updatedTime": {
      "type": "string",
      "description": "ISO-8601 timestamp of when the reply was last modified"
     }
    },
    "required": [
     "id",
     "author",
     "contentText",
     "mentionedUsers",
     "archived",
     "createdTime",
     "updatedTime"
    ]
   },
   "GammaViewerAnalytics": {
    "type": "object",
    "properties": {
     "scope": {
      "description": "Which viewers the rows cover: `all` — every viewer of the Gamma\n(the API key's user has manage permission); `self` — at most the API key\nuser's own row (edit permission).",
      "enum": [
       "all",
       "self"
      ],
      "type": "string"
     },
     "gammaId": {
      "type": "string",
      "description": "The Gamma (file) ID"
     },
     "data": {
      "description": "Viewer engagement rows",
      "type": "array",
      "items": {
       "$ref": "#/components/schemas/ViewerAnalyticsEntry"
      }
     },
     "hasMore": {
      "type": "boolean",
      "description": "Whether more viewers exist beyond this page"
     },
     "nextCursor": {
      "type": "string",
      "nullable": true,
      "description": "Cursor for fetching the next page (null if no more results)"
     }
    },
    "required": [
     "scope",
     "gammaId",
     "data",
     "hasMore",
     "nextCursor"
    ]
   },
   "ViewerAnalyticsEntry": {
    "type": "object",
    "properties": {
     "viewerId": {
      "type": "string",
      "description": "Stable viewer identifier. For authenticated viewers this is their user ID;\nfor anonymous viewers this is their anonymous ID."
     },
     "displayName": {
      "type": "string",
      "nullable": true,
      "description": "Display name of the viewer, or null for anonymous viewers"
     },
     "email": {
      "type": "string",
      "nullable": true,
      "description": "Email of the viewer, or null for anonymous viewers"
     },
     "lastOpened": {
      "type": "string",
      "nullable": true,
      "description": "ISO-8601 timestamp of the viewer's most recent Gamma open/view, or null if unknown"
     },
     "cardsViewed": {
      "type": "number",
      "description": "Number of cards the viewer has viewed"
     }
    },
    "required": [
     "viewerId",
     "displayName",
     "email",
     "lastOpened",
     "cardsViewed"
    ]
   },
   "GammaViewerDetailAnalytics": {
    "type": "object",
    "properties": {
     "scope": {
      "description": "Which viewers are addressable: `all` — any viewer of the Gamma\n(the API key's user has manage permission); `self` — only the API key\nuser's own activity (edit permission).",
      "enum": [
       "all",
       "self"
      ],
      "type": "string"
     },
     "gammaId": {
      "type": "string",
      "description": "The Gamma (file) ID"
     },
     "userId": {
      "type": "string",
      "description": "The viewer's user ID"
     },
     "displayName": {
      "type": "string",
      "nullable": true,
      "description": "Display name of the viewer"
     },
     "email": {
      "type": "string",
      "nullable": true,
      "description": "Email of the viewer"
     },
     "lastOpened": {
      "type": "string",
      "nullable": true,
      "description": "ISO-8601 timestamp of the viewer's most recent Gamma open/view, or null if unknown"
     },
     "cardsViewed": {
      "type": "number",
      "description": "Number of cards this viewer has viewed, counting only cards currently in the Gamma"
     },
     "cardCount": {
      "type": "number",
      "description": "Total number of cards in the Gamma (the denominator for cardsViewed)"
     },
     "perCardTimeSpent": {
      "description": "Relative time spent per card, as a percentage of this viewer's total view\ntime on the Gamma. Covers every card in the Gamma, ordered by card\nposition; cards the viewer has never viewed have a viewTimePercent of 0.",
      "type": "array",
      "items": {
       "$ref": "#/components/schemas/ViewerCardTimeSpent"
      }
     }
    },
    "required": [
     "scope",
     "gammaId",
     "userId",
     "displayName",
     "email",
     "lastOpened",
     "cardsViewed",
     "cardCount",
     "perCardTimeSpent"
    ]
   },
   "ViewerCardTimeSpent": {
    "type": "object",
    "properties": {
     "cardId": {
      "type": "string",
      "description": "The card ID within the Gamma"
     },
     "cardName": {
      "type": "string",
      "nullable": true,
      "description": "Title of the card, or null if the card has no discernible title"
     },
     "cardPosition": {
      "type": "number",
      "description": "1-indexed position of the card within the Gamma"
     },
     "viewTimePercent": {
      "type": "number",
      "description": "Percentage of this viewer's total view time on the Gamma that was spent\non this card (0-100). Sums to ~100 across the cards the viewer has seen."
     }
    },
    "required": [
     "cardId",
     "cardName",
     "cardPosition",
     "viewTimePercent"
    ]
   },
   "GetGammaResponse": {
    "type": "object",
    "properties": {
     "id": {
      "type": "string",
      "description": "Unique gamma identifier (file ID)"
     },
     "title": {
      "type": "string",
      "description": "Gamma title"
     },
     "type": {
      "type": "string",
      "description": "Gamma type: 'template' or 'regular'",
      "enum": [
       "regular",
       "template"
      ]
     },
     "url": {
      "type": "string",
      "description": "Canonical URL to view the gamma"
     },
     "thumbnailUrl": {
      "type": "string",
      "nullable": true,
      "description": "URL of a thumbnail image for the gamma, or null if unavailable"
     },
     "description": {
      "type": "string",
      "nullable": true,
      "description": "Description or preview text for the gamma, or null if unavailable"
     },
     "author": {
      "nullable": true,
      "description": "Author of the gamma, or null if unavailable",
      "type": "object",
      "allOf": [
       {
        "$ref": "#/components/schemas/GammaAuthor"
       }
      ]
     },
     "createdTime": {
      "type": "string",
      "nullable": true,
      "description": "ISO-8601 timestamp of when the gamma was created, or null if unavailable"
     },
     "updatedTime": {
      "type": "string",
      "nullable": true,
      "description": "ISO-8601 timestamp of when the gamma was last modified, or null if unavailable"
     },
     "themeId": {
      "type": "string",
      "nullable": true,
      "description": "ID of the theme applied to the gamma, or null if no theme is set"
     },
     "archived": {
      "type": "boolean",
      "description": "Whether the gamma is archived"
     }
    },
    "required": [
     "id",
     "title",
     "type",
     "url",
     "thumbnailUrl",
     "description",
     "author",
     "createdTime",
     "updatedTime",
     "themeId",
     "archived"
    ]
   },
   "GammaAuthor": {
    "type": "object",
    "properties": {
     "name": {
      "type": "string",
      "description": "Display name of the author"
     },
     "avatarUrl": {
      "type": "string",
      "nullable": true,
      "description": "URL of the author's avatar image, or null if not set"
     }
    },
    "required": [
     "name",
     "avatarUrl"
    ]
   },
   "GenerationStatusResponse": {
    "type": "object",
    "properties": {
     "generationId": {
      "type": "string",
      "description": "Unique identifier for the generation job"
     },
     "status": {
      "type": "string",
      "description": "Current status of the generation job",
      "enum": [
       "completed",
       "failed",
       "pending"
      ]
     },
     "gammaId": {
      "type": "string",
      "description": "File ID of the generated Gamma (when completed)"
     },
     "gammaUrl": {
      "type": "string",
      "description": "URL to the generated Gamma (when completed)"
     },
     "error": {
      "description": "Error details (when failed)",
      "allOf": [
       {
        "$ref": "#/components/schemas/ErrorResponse"
       }
      ]
     },
     "exportUrl": {
      "type": "string",
      "description": "URL to download the exported file (when exportAs was specified).\nThe file format matches exportAs: `pptx` → .pptx, `pdf` → .pdf, `png` → a .zip archive containing one PNG per card (not a single PNG file).\nAnyone with this URL can download the file until it expires (about one week) — access is not tied to your API key. Treat the link as a secret: don't log it, share it, or embed it in client-side code."
     },
     "credits": {
      "description": "Credit usage information",
      "allOf": [
       {
        "$ref": "#/components/schemas/CreditsResponse"
       }
      ]
     },
     "pages": {
      "description": "Per-page results for multi-page generations.\nOnly present when the generation was created with a `pages` array.",
      "type": "array",
      "items": {
       "$ref": "#/components/schemas/PageGenerationResult"
      }
     }
    },
    "required": [
     "generationId",
     "status"
    ]
   },
   "ErrorResponse": {
    "type": "object",
    "properties": {
     "message": {
      "type": "string",
      "description": "Human-readable error message"
     },
     "statusCode": {
      "type": "number",
      "description": "HTTP status code"
     }
    },
    "required": [
     "message",
     "statusCode"
    ]
   },
   "CreditsResponse": {
    "type": "object",
    "properties": {
     "deducted": {
      "type": "number",
      "description": "Number of credits deducted for this operation"
     },
     "remaining": {
      "type": "number",
      "description": "Remaining credits in the workspace"
     }
    },
    "required": [
     "deducted",
     "remaining"
    ]
   },
   "PageGenerationResult": {
    "type": "object",
    "properties": {
     "gammaId": {
      "type": "string",
      "description": "Doc ID of this page within the File."
     },
     "gammaUrl": {
      "type": "string",
      "description": "Direct URL to this page."
     },
     "status": {
      "type": "string",
      "description": "Current status of this page's generation.",
      "enum": [
       "completed",
       "failed",
       "pending"
      ]
     },
     "error": {
      "description": "Error details if this page failed.",
      "allOf": [
       {
        "$ref": "#/components/schemas/ErrorResponse"
       }
      ]
     },
     "exportUrl": {
      "type": "string",
      "description": "URL to download this page's exported file (present only when\n`exportAs` was specified). Each page is exported independently; the\nfile format matches `exportAs` (`pptx` → .pptx, `pdf` → .pdf,\n`png` → a .zip of one PNG per card)."
     }
    },
    "required": [
     "gammaId",
     "gammaUrl",
     "status"
    ]
   },
   "ImageGenerationStatusResponse": {
    "type": "object",
    "properties": {
     "imageGenerationId": {
      "type": "string",
      "description": "Unique identifier for the image generation job"
     },
     "status": {
      "type": "string",
      "description": "Current status of the image generation job",
      "enum": [
       "completed",
       "failed",
       "pending"
      ]
     },
     "image": {
      "description": "The generated image (present when completed)",
      "allOf": [
       {
        "$ref": "#/components/schemas/GeneratedImage"
       }
      ]
     },
     "warnings": {
      "description": "Warnings about how the request was interpreted (e.g. a skipped style or\ntheme)",
      "type": "array",
      "items": {
       "$ref": "#/components/schemas/ImageGenerationWarning"
      }
     },
     "error": {
      "description": "Error details (when failed)",
      "allOf": [
       {
        "$ref": "#/components/schemas/ErrorResponse"
       }
      ]
     },
     "credits": {
      "description": "Credit usage information",
      "allOf": [
       {
        "$ref": "#/components/schemas/CreditsResponse"
       }
      ]
     }
    },
    "required": [
     "imageGenerationId",
     "status"
    ]
   },
   "GeneratedImage": {
    "type": "object",
    "properties": {
     "url": {
      "type": "string",
      "description": "CDN URL of the generated image"
     },
     "width": {
      "type": "number",
      "description": "Image width in pixels"
     },
     "height": {
      "type": "number",
      "description": "Image height in pixels"
     },
     "format": {
      "type": "string",
      "description": "File format of the generated image. Output is model-native (commonly\n\"png\" or \"webp\") — it is not converted."
     },
     "mimeType": {
      "type": "string",
      "description": "MIME type of the generated image"
     },
     "transparency": {
      "type": "boolean",
      "description": "Whether the image has an alpha channel"
     },
     "aspectRatioUsed": {
      "type": "string",
      "description": "The aspect ratio the image was generated at"
     },
     "savedMediaId": {
      "type": "string",
      "description": "Identifier of the image in the Gamma media library"
     }
    },
    "required": [
     "url",
     "width",
     "height",
     "format",
     "mimeType",
     "transparency",
     "aspectRatioUsed"
    ]
   },
   "ListFoldersResponse": {
    "type": "object",
    "properties": {
     "data": {
      "description": "Array of folder items",
      "type": "array",
      "items": {
       "$ref": "#/components/schemas/FolderItem"
      }
     },
     "hasMore": {
      "type": "boolean",
      "description": "Whether more results exist beyond this page"
     },
     "nextCursor": {
      "type": "string",
      "nullable": true,
      "description": "Cursor for fetching the next page (null if no more results)"
     }
    },
    "required": [
     "data",
     "hasMore",
     "nextCursor"
    ]
   },
   "FolderItem": {
    "type": "object",
    "properties": {
     "id": {
      "type": "string",
      "description": "Unique folder identifier"
     },
     "name": {
      "type": "string",
      "description": "Display name of the folder"
     }
    },
    "required": [
     "id",
     "name"
    ]
   },
   "ListThemesResponse": {
    "type": "object",
    "properties": {
     "data": {
      "description": "Array of theme items",
      "type": "array",
      "items": {
       "$ref": "#/components/schemas/ThemeItem"
      }
     },
     "hasMore": {
      "type": "boolean",
      "description": "Whether more results exist beyond this page"
     },
     "nextCursor": {
      "type": "string",
      "nullable": true,
      "description": "Cursor for fetching the next page (null if no more results)"
     }
    },
    "required": [
     "data",
     "hasMore",
     "nextCursor"
    ]
   },
   "ThemeItem": {
    "type": "object",
    "properties": {
     "id": {
      "type": "string",
      "description": "Unique theme identifier"
     },
     "name": {
      "type": "string",
      "description": "Display name of the theme"
     },
     "colorKeywords": {
      "description": "Keywords describing the theme's color palette",
      "type": "array",
      "items": {
       "type": "string"
      }
     },
     "toneKeywords": {
      "description": "Keywords describing the theme's tone/style",
      "type": "array",
      "items": {
       "type": "string"
      }
     },
     "type": {
      "type": "string",
      "description": "Theme type: standard (built-in) or custom (workspace-created)",
      "enum": [
       "custom",
       "standard"
      ]
     }
    },
    "required": [
     "id",
     "name",
     "type"
    ]
   },
   "SearchGammasResponse": {
    "type": "object",
    "properties": {
     "hits": {
      "description": "Array of hits, relevance-ranked when a query is provided and ordered by\nlast-updated descending otherwise",
      "type": "array",
      "items": {
       "$ref": "#/components/schemas/GammaSearchHit"
      }
     }
    },
    "required": [
     "hits"
    ]
   },
   "GammaSearchHit": {
    "type": "object",
    "properties": {
     "id": {
      "type": "string",
      "description": "Unique gamma identifier"
     },
     "title": {
      "type": "string",
      "nullable": true,
      "description": "Gamma title, or null if untitled"
     },
     "url": {
      "type": "string",
      "description": "URL to view the gamma"
     },
     "highlight": {
      "type": "string",
      "nullable": true,
      "description": "Query-centered snippet from the gamma's text, or null when no snippet is\navailable (e.g. filter-only browse)"
     },
     "createdBy": {
      "type": "string",
      "nullable": true,
      "description": "Display name of the gamma's creator, or null if unavailable"
     },
     "updatedTime": {
      "type": "string",
      "nullable": true,
      "description": "ISO-8601 timestamp of when the gamma was last modified"
     },
     "archived": {
      "type": "boolean",
      "description": "True when the hit is an archived gamma (only possible with\nincludeArchived)"
     }
    },
    "required": [
     "id",
     "title",
     "url",
     "highlight",
     "createdBy",
     "updatedTime",
     "archived"
    ]
   },
   "SearchTemplatesResponse": {
    "type": "object",
    "properties": {
     "workspaceTemplates": {
      "description": "Hits from the caller's workspace templates. With a query, hits use best-effort relevance ranking and may fall back to last-edited browse order. Without a query, hits are ordered by last edit, most recent first. IDs can be passed as the gammaId to generate-from-template, which validates eligibility at generation time and may reject some templates.",
      "type": "array",
      "items": {
       "$ref": "#/components/schemas/WorkspaceTemplateSearchHit"
      }
     },
     "workspaceDegraded": {
      "type": "boolean",
      "description": "True when workspace relevance ranking failed and workspaceTemplates use last-edited browse order. Omitted otherwise."
     },
     "exploreTemplates": {
      "description": "Hits from the official Gamma templates, relevance-ranked when a query is\nprovided. Ranking is best-effort. Not accepted as the gammaId for\ngenerate-from-template.",
      "type": "array",
      "items": {
       "$ref": "#/components/schemas/ExploreTemplateSearchHit"
      }
     }
    },
    "required": [
     "workspaceTemplates",
     "exploreTemplates"
    ]
   },
   "WorkspaceTemplateSearchHit": {
    "type": "object",
    "properties": {
     "id": {
      "type": "string",
      "description": "Template identifier, to pass as the gammaId to generate-from-template"
     },
     "title": {
      "type": "string",
      "nullable": true,
      "description": "Template title, or null if untitled"
     },
     "url": {
      "type": "string",
      "description": "URL to view the template"
     },
     "previewUrl": {
      "type": "string",
      "nullable": true,
      "description": "Preview image URL, or null if unavailable"
     }
    },
    "required": [
     "id",
     "title",
     "url",
     "previewUrl"
    ]
   },
   "ExploreTemplateSearchHit": {
    "type": "object",
    "properties": {
     "id": {
      "type": "string",
      "description": "Template identifier. Not accepted as the gammaId for generate-from-template."
     },
     "title": {
      "type": "string",
      "nullable": true,
      "description": "Template title, or null if untitled"
     },
     "url": {
      "type": "string",
      "description": "URL to view the template"
     },
     "thumbnailUrl": {
      "type": "string",
      "nullable": true,
      "description": "Thumbnail image URL, or null if unavailable"
     },
     "previewUrl": {
      "type": "string",
      "nullable": true,
      "description": "Preview image URL, or null if unavailable"
     }
    },
    "required": [
     "id",
     "title",
     "url",
     "thumbnailUrl",
     "previewUrl"
    ]
   }
  },
  "securitySchemes": {
   "api-key": {
    "type": "apiKey",
    "in": "header",
    "name": "X-API-KEY",
    "description": "API key for authentication"
   },
   "bearer": {
    "scheme": "bearer",
    "bearerFormat": "JWT",
    "type": "http",
    "description": "OAuth bearer token for authentication"
   }
  }
 },
 "security": [
  {
   "api-key": []
  },
  {
   "bearer": []
  }
 ]
};

export const options = {
  source: { document },
  allowedOrigin: "https://public-api.gamma.app",
  securitySchemes: {
    "api-key": { type: "apiKey", in: "header", name: "X-API-KEY" },
    bearer: { type: "http", scheme: "bearer" },
  },
  methods: {
    apiKey: [{ scheme: "api-key", field: "token", part: "value", prefix: "" }],
    oauth: [{ scheme: "bearer", field: "access_token", part: "value", prefix: "" }],
  },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
