import type { JsonObject } from "apps";
import type { OpenapiToolNamesOptions } from "apps/openapi";

// VerifiedEmail publishes no standalone OpenAPI file: https://developer.verified.email/ renders
// Swagger UI with the official document embedded in swagger-ui-init.js. This is that document,
// copied verbatim except that parameter schemas pointing at #/components/parameters/X (a
// parameter-object path, which is not a schema) now point at the same-named #/components/schemas/X.
const document: JsonObject = {
  "openapi": "3.0.0",
  "info": {
    "title": "VerifiedEmail API documentation",
    "description": "Welcome to the VerifiedEmail API. This documentation covers all publicly available endpoints and capabilities.",
    "contact": {
      "email": "hello@verified.email"
    },
    "version": "1.0"
  },
  "servers": [
    {
      "url": "https://api.verified.email",
      "description": "API Endpoint"
    }
  ],
  "components": {
    "securitySchemes": {
      "API_KEY": {
        "type": "http",
        "scheme": "bearer",
        "description": "Your API key is required to authenticate requests to the API. Multiple API keys with different permissions can be generated for your account. Please refer to https://app.verified.email/apikeys"
      }
    },
    "parameters": {
      "id": {
        "in": "path",
        "required": true,
        "allowEmptyValue": true,
        "example": "",
        "schema": {
          "$ref": "#/components/schemas/id"
        },
        "description": "Entity ID",
        "name": "Entity ID"
      },
      "email": {
        "in": "query",
        "required": false,
        "schema": {
          "$ref": "#/components/schemas/email"
        },
        "description": "A single email address or a comma-separated list of emails to be verified",
        "name": "email"
      },
      "offset": {
        "description": "Number of items to offset the result set by.",
        "in": "query",
        "required": false,
        "name": "offset",
        "schema": {
          "type": "integer",
          "minimum": 0
        }
      },
      "limit": {
        "in": "query",
        "required": false,
        "name": "limit",
        "schema": {
          "type": "integer",
          "minimum": 1,
          "maximum": 10,
          "default": 10
        },
        "description": "Numbers of items to return."
      },
      "sortField": {
        "in": "query",
        "required": false,
        "name": "sortField",
        "schema": {
          "type": "string",
          "default": "dateAdded"
        },
        "description": "Sort field"
      },
      "sortOrder": {
        "in": "query",
        "required": false,
        "name": "sortOrder",
        "schema": {
          "type": "string",
          "default": "desc"
        },
        "description": "Sort order"
      }
    },
    "requestBodies": {
      "list": {
        "description": "Verification list update object",
        "required": true,
        "content": {
          "application/json": {
            "schema": {
              "$ref": "#/components/schemas/verificationListUpdateRequest"
            }
          },
          "multipart/form-data": {
            "schema": {
              "$ref": "#/components/schemas/verificationListUpdateWithFileRequest"
            }
          }
        }
      },
      "apikey": {
        "description": "API update object",
        "required": true,
        "content": {
          "application/json": {
            "schema": {
              "$ref": "#/components/schemas/apikeyRequestUpdate"
            }
          }
        }
      },
      "widget": {
        "description": "Widget update object",
        "required": true,
        "content": {
          "application/json": {
            "schema": {
              "$ref": "#/components/schemas/widgetRequestUpdate"
            }
          }
        }
      },
      "download": {
        "description": "Download update object",
        "required": true,
        "content": {
          "application/json": {
            "schema": {
              "$ref": "#/components/schemas/downloadRequestUpdate"
            }
          }
        }
      }
    },
    "schemas": {
      "empty": {
        "type": "string",
        "example": ""
      },
      "notAuthorized": {
        "type": "object",
        "properties": {
          "error": {
            "properties": {
              "code": {
                "type": "integer",
                "example": 403
              },
              "message": {
                "type": "string",
                "example": "You are not authorized to perform this operation"
              }
            }
          }
        }
      },
      "notFound": {
        "type": "object",
        "properties": {
          "error": {
            "properties": {
              "code": {
                "type": "integer",
                "example": 404
              },
              "message": {
                "type": "string",
                "example": "Item not found"
              }
            }
          }
        }
      },
      "count": {
        "description": "Total count of items",
        "type": "integer",
        "example": 2
      },
      "limit": {
        "description": "Limit number of results",
        "type": "integer",
        "example": 10
      },
      "offset": {
        "description": "Offset results",
        "type": "integer",
        "example": 0
      },
      "sortField": {
        "description": "Sort order field",
        "type": "string",
        "example": "dateAdded"
      },
      "sortOrder": {
        "description": "sortOrder. Options: desc, asc",
        "type": "string",
        "example": "desc"
      },
      "email": {
        "description": "E-mail address",
        "type": "string",
        "format": "email",
        "example": "john@gmail.com"
      },
      "id": {
        "description": "Unique ID",
        "type": "string",
        "format": "uuid",
        "example": "d2220f77bbd94e2caa54f165641029ad"
      },
      "listId": {
        "description": "Unique ID of a verification list",
        "type": "string",
        "format": "uuid",
        "example": "d2220f77bbd94e2caa54f165641029ad"
      },
      "dateAdded": {
        "description": "Creation time (ISO format)",
        "type": "string",
        "example": "2024-02-12T15:19:21+00:00"
      },
      "dateLastVerified": {
        "description": "Time of last verification (ISO format)",
        "type": "string",
        "nullable": true,
        "example": "2024-02-12T15:19:21+00:00"
      },
      "isAutoRefill": {
        "description": "Automatically purchase verification credits if your balance is not sufficient to complete verification and payment method is on file.",
        "type": "boolean",
        "example": false
      },
      "metadata": {
        "type": "object",
        "properties": {
          "count": {
            "$ref": "#/components/schemas/count"
          },
          "limit": {
            "$ref": "#/components/schemas/limit"
          },
          "offset": {
            "$ref": "#/components/schemas/offset"
          },
          "sortField": {
            "$ref": "#/components/schemas/sortField"
          },
          "sortOrder": {
            "$ref": "#/components/schemas/sortOrder"
          }
        }
      },
      "metadataExtended": {
        "type": "object",
        "properties": {
          "count": {
            "$ref": "#/components/schemas/count"
          },
          "limit": {
            "$ref": "#/components/schemas/limit"
          },
          "offset": {
            "$ref": "#/components/schemas/offset"
          },
          "sortField": {
            "$ref": "#/components/schemas/sortField"
          },
          "sortOrder": {
            "$ref": "#/components/schemas/sortOrder"
          }
        }
      },
      "metadataVerification": {
        "type": "object",
        "nullable": true,
        "properties": {
          "listId": {
            "$ref": "#/components/schemas/listId"
          },
          "count": {
            "$ref": "#/components/schemas/count"
          }
        }
      },
      "verificationListUpdateRequest": {
        "type": "object",
        "properties": {
          "emails": {
            "description": "E-mail list for the verification list",
            "type": "array",
            "items": {
              "type": "string",
              "default": ""
            }
          },
          "status": {
            "description": "Update list status. The only accepted value is `progress` to start verification for this list.",
            "type": "string",
            "example": "progress",
            "enum": [
              "progress"
            ]
          },
          "autoVerify": {
            "description": "Update Auto Verification mode. The only accepted values are `off` and `weekly`",
            "type": "string",
            "example": "off",
            "enum": [
              "off",
              "weekly"
            ]
          }
        }
      },
      "verificationListUpdateWithFileRequest": {
        "type": "object",
        "properties": {
          "file": {
            "description": "Upload file with the e-mail list",
            "type": "string",
            "format": "binary"
          },
          "status": {
            "description": "Update list status. The only accepted value is `progress` to start verification for this list.",
            "type": "string",
            "example": "progress",
            "enum": [
              "progress"
            ]
          },
          "autoVerify": {
            "description": "Update Auto Verification mode. The only accepted values are `off` and `weekly`",
            "type": "string",
            "example": "off",
            "enum": [
              "off",
              "weekly"
            ]
          }
        }
      },
      "list": {
        "type": "object",
        "properties": {
          "id": {
            "$ref": "#/components/schemas/id"
          },
          "title": {
            "description": "Verification list title",
            "type": "string",
            "example": "My Users List"
          },
          "status": {
            "description": "Verification list status.",
            "type": "string",
            "example": "new",
            "enum": [
              "new",
              "ready",
              "progress",
              "failed",
              "partial",
              "verified"
            ]
          },
          "isAutoRefill": {
            "description": "Automatically purchase verification credits if your balance is not sufficient to complete verification and payment method is on file.",
            "type": "boolean"
          },
          "score": {
            "description": "List score",
            "type": "integer"
          },
          "type": {
            "description": "Verification list type",
            "type": "string",
            "example": "widget",
            "enum": [
              "user",
              "system",
              "widget",
              "zapier",
              "integration"
            ]
          },
          "error": {
            "description": "Last error",
            "type": "string"
          },
          "autoVerify": {
            "description": "Auto Verification mode",
            "type": "string",
            "example": "off",
            "enum": [
              "off",
              "weekly"
            ]
          },
          "integration": {
            "description": "An integration object (if a list is associated with an integration) or null",
            "type": "object"
          },
          "records": {
            "description": "List statistics",
            "type": "object",
            "properties": {
              "isOverlapping": {
                "type": "boolean",
                "default": false
              },
              "total": {
                "type": "integer",
                "default": 0
              },
              "duplicate": {
                "type": "integer",
                "default": 0
              },
              "malformed": {
                "type": "integer",
                "default": 0
              },
              "billable": {
                "type": "integer",
                "default": 0
              },
              "pending": {
                "type": "integer",
                "default": 0
              },
              "unknown": {
                "type": "integer",
                "default": 0
              },
              "nonexistent": {
                "type": "integer",
                "default": 0
              },
              "inactive": {
                "type": "integer",
                "default": ""
              },
              "full": {
                "type": "integer",
                "default": 0
              },
              "ghosts": {
                "type": "integer",
                "default": 0
              },
              "failed": {
                "type": "integer",
                "default": 0
              },
              "undeliverable": {
                "type": "integer",
                "default": 0
              },
              "deliverable": {
                "type": "integer",
                "default": 0
              },
              "free": {
                "type": "integer",
                "default": 0
              },
              "government": {
                "type": "integer",
                "default": 0
              },
              "academic": {
                "type": "integer",
                "default": 0
              },
              "military": {
                "type": "integer",
                "default": 0
              },
              "disposable": {
                "type": "integer",
                "default": 0
              },
              "catchall": {
                "type": "integer",
                "default": 0
              },
              "role": {
                "type": "integer",
                "default": 0
              },
              "googleworkspace": {
                "type": "integer",
                "default": 0
              },
              "outlook365": {
                "type": "integer",
                "default": 0
              }
            }
          },
          "dateAdded": {
            "$ref": "#/components/schemas/dateAdded"
          },
          "dateLastVerified": {
            "$ref": "#/components/schemas/dateLastVerified"
          }
        }
      },
      "verificationObject": {
        "type": "object",
        "properties": {
          "email": {
            "$ref": "#/components/schemas/email"
          },
          "score": {
            "description": "Email Score",
            "type": "integer"
          },
          "result": {
            "description": "Verification result",
            "type": "string",
            "example": "pending",
            "enum": [
              "pending",
              "malformed",
              "ghost",
              "unknown",
              "blocked",
              "nonexistent",
              "inactive",
              "failed",
              "full",
              "deliverable"
            ]
          },
          "role": {
            "description": "Role",
            "type": "string",
            "nullable": true
          },
          "alias": {
            "description": "E-mail alias",
            "type": "string",
            "nullable": true
          },
          "canonical": {
            "description": "Canonical",
            "type": "string",
            "nullable": true
          },
          "isGhost": {
            "type": "boolean",
            "nullable": true,
            "default": false
          },
          "isMX": {
            "type": "boolean",
            "nullable": true,
            "default": false
          },
          "isSubdomain": {
            "type": "boolean",
            "nullable": true,
            "default": false
          },
          "isCatchAll": {
            "type": "boolean",
            "nullable": true,
            "default": false
          },
          "isFree": {
            "type": "boolean",
            "nullable": true,
            "default": false
          },
          "isDisposable": {
            "type": "boolean",
            "nullable": true,
            "default": false
          },
          "isGovernment": {
            "type": "boolean",
            "nullable": true,
            "default": false
          },
          "isAcademic": {
            "type": "boolean",
            "nullable": true,
            "default": false
          },
          "isMilitary": {
            "type": "boolean",
            "nullable": true,
            "default": false
          },
          "isGoogleWorkspace": {
            "type": "boolean",
            "nullable": true,
            "default": false
          },
          "isOutlook365": {
            "type": "boolean",
            "nullable": true,
            "default": false
          },
          "dateAdded": {
            "$ref": "#/components/schemas/dateAdded"
          },
          "dateLastVerified": {
            "$ref": "#/components/schemas/dateLastVerified"
          },
          "dateLastValid": {
            "type": "string",
            "nullable": true,
            "example": "2024-02-12T15:19:21+00:00"
          }
        }
      },
      "apikey": {
        "type": "object",
        "properties": {
          "id": {
            "$ref": "#/components/schemas/id"
          },
          "title": {
            "description": "Title",
            "type": "string",
            "example": "Development apikey"
          },
          "status": {
            "description": "API key status",
            "type": "string",
            "enum": [
              "active",
              "disabled"
            ]
          },
          "key": {
            "description": "API key value",
            "type": "string",
            "example": "api_d2220f77bbd94e2caa54f165641029ad"
          },
          "isAutoRefill": {
            "$ref": "#/components/schemas/isAutoRefill"
          },
          "permissions": {
            "description": "Limit key access to specific scopes",
            "type": "object",
            "properties": {
              "entitlements": {
                "description": "Get information about available credits.",
                "type": "boolean"
              },
              "lists": {
                "description": "Upload, append, verify, delete, and download email lists.",
                "type": "boolean"
              },
              "billing": {
                "description": "Purchase credits, enable and cancel Auto Verification, delete payment method from your account.",
                "type": "boolean"
              },
              "verifications": {
                "description": "Verify emails individually using a dedicated API endpoint.",
                "type": "boolean"
              },
              "apikeys": {
                "description": "Create, view, modify, and delete API Keys in your account.",
                "type": "boolean"
              },
              "webhooks": {
                "description": "Create, list, modify, and disable Webhooks.",
                "type": "boolean"
              }
            }
          }
        }
      },
      "apikeyRequestUpdate": {
        "type": "object",
        "properties": {
          "title": {
            "description": "Title",
            "type": "string",
            "example": "Development apikey"
          },
          "isAutoRefill": {
            "description": "Automatically purchase verification credits if your balance drops below 10 and payment method is on file.",
            "type": "boolean"
          },
          "permissions": {
            "description": "Limit key access to specific scopes",
            "type": "object",
            "properties": {
              "entitlements": {
                "description": "Get information about available credits.",
                "type": "boolean"
              },
              "lists": {
                "description": "Upload, append, verify, delete, and download email lists.",
                "type": "boolean"
              },
              "billing": {
                "description": "Purchase credits, enable and cancel Auto Verification, delete payment method from your account.",
                "type": "boolean"
              },
              "verifications": {
                "description": "Verify emails individually using a dedicated API endpoint.",
                "type": "boolean"
              },
              "apikeys": {
                "description": "Create, view, modify, and delete API Keys in your account.",
                "type": "boolean"
              },
              "webhooks": {
                "description": "Create, list, modify, and disable Webhooks.",
                "type": "boolean"
              }
            }
          }
        }
      },
      "apikeyResponse": {
        "type": "object",
        "properties": {
          "apikey": {
            "$ref": "#/components/schemas/apikey"
          }
        }
      },
      "download": {
        "type": "object",
        "description": "Download request object",
        "properties": {
          "id": {
            "$ref": "#/components/schemas/id"
          },
          "listId": {
            "$ref": "#/components/schemas/listId"
          },
          "include": {
            "type": "array",
            "description": "Email status array which included for this download",
            "items": {
              "type": "string",
              "enum": [
                "pending",
                "malformed",
                "ghost",
                "unknown",
                "nonexistent",
                "failed",
                "full",
                "deliverable"
              ]
            }
          },
          "url": {
            "description": "Direct URL link",
            "type": "string"
          },
          "status": {
            "description": "Download request status",
            "type": "string",
            "example": "new",
            "enum": [
              "new",
              "progress",
              "completed",
              "failed",
              "deleted"
            ]
          },
          "dateAdded": {
            "$ref": "#/components/schemas/dateAdded"
          },
          "dateReady": {
            "description": "File ready time (ISO format)",
            "type": "string",
            "example": "2024-02-12T15:19:21+00:00"
          }
        }
      },
      "downloadRequestUpdate": {
        "type": "object",
        "properties": {
          "listId": {
            "$ref": "#/components/schemas/listId"
          },
          "include": {
            "type": "array",
            "description": "Email status array which included for this download. Options: pending, malformed, ghost, unknown, nonexistent, failed, full, deliverable",
            "items": {
              "type": "string",
              "enum": [
                "pending",
                "malformed",
                "ghost",
                "unknown",
                "nonexistent",
                "failed",
                "full",
                "deliverable"
              ]
            }
          }
        }
      },
      "downloadResponse": {
        "type": "object",
        "properties": {
          "download": {
            "$ref": "#/components/schemas/download"
          }
        }
      },
      "widget": {
        "type": "object",
        "properties": {
          "id": {
            "$ref": "#/components/schemas/id"
          },
          "title": {
            "description": "Widget title",
            "type": "string",
            "example": "Verification widget for my site"
          },
          "status": {
            "description": "Widget status",
            "type": "string",
            "example": "active",
            "enum": [
              "active",
              "inactive",
              "disabled"
            ]
          },
          "isAutoRefill": {
            "$ref": "#/components/schemas/isAutoRefill"
          },
          "list": {
            "description": "Verification list associated",
            "type": "object",
            "$ref": "#/components/schemas/list"
          }
        }
      },
      "widgetRequestUpdate": {
        "type": "object",
        "properties": {
          "title": {
            "description": "Widget title",
            "type": "string",
            "example": "Verification widget for my site"
          },
          "status": {
            "description": "Widget status",
            "type": "string",
            "example": "active",
            "enum": [
              "active",
              "inactive",
              "disabled"
            ]
          },
          "isAutoRefill": {
            "$ref": "#/components/schemas/isAutoRefill"
          }
        }
      },
      "widgetResponse": {
        "type": "object",
        "properties": {
          "widget": {
            "$ref": "#/components/schemas/widget"
          }
        }
      },
      "entitlements": {
        "type": "object",
        "properties": {
          "payAsYouGo": {
            "type": "object",
            "properties": {
              "credits": {
                "description": "Reflects remaining number of standard verification credits in the account, depletes as we verify, only for verifications initiated by the user",
                "type": "integer"
              },
              "needed": {
                "description": "Total number of emails across all the lists now",
                "type": "integer"
              }
            }
          },
          "autoVerify": {
            "type": "object",
            "properties": {
              "credits": {
                "description": "Reflects total number of emails user is allowed to enable auto verification for across all lists. does not deplete – only indicates a total limit.",
                "type": "integer"
              },
              "needed": {
                "description": "Total number of emails in lists which have auto verification enabled",
                "type": "integer"
              }
            }
          }
        }
      }
    }
  },
  "paths": {
    "/v1/apikeys": {
      "get": {
        "tags": [
          "Manage API Keys"
        ],
        "summary": "Get a list of API keys in your account",
        "operationId": "GetApiKeys",
        "parameters": [
          {
            "name": "offset",
            "in": "query",
            "schema": {
              "$ref": "#/components/schemas/offset"
            }
          },
          {
            "name": "limit",
            "in": "query",
            "schema": {
              "$ref": "#/components/schemas/limit"
            }
          },
          {
            "name": "sortField",
            "in": "query",
            "schema": {
              "$ref": "#/components/schemas/sortField"
            }
          },
          {
            "name": "sortOrder",
            "in": "query",
            "schema": {
              "$ref": "#/components/schemas/sortOrder"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "Successful response",
            "content": {
              "application/json": {
                "schema": {
                  "properties": {
                    "apikeys": {
                      "type": "array",
                      "items": {
                        "$ref": "#/components/schemas/apikey"
                      }
                    },
                    "metadata": {
                      "$ref": "#/components/schemas/metadata"
                    }
                  },
                  "type": "object"
                }
              }
            }
          },
          "403": {
            "description": "Not authorized",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/notAuthorized"
                }
              }
            }
          }
        },
        "security": [
          {
            "API_KEY": []
          }
        ]
      }
    },
    "/v1/apikeys/{id}": {
      "get": {
        "tags": [
          "Manage API Keys"
        ],
        "summary": "Get information about a single API key",
        "operationId": "GetApiKey",
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "description": "API key ID",
            "required": true,
            "schema": {
              "$ref": "#/components/schemas/id"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "API key object",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/apikeyResponse"
                }
              }
            }
          },
          "403": {
            "description": "Not Authorized",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/notAuthorized"
                }
              }
            }
          },
          "404": {
            "description": "Not Found",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/notFound"
                }
              }
            }
          }
        },
        "security": [
          {
            "API_KEY": []
          }
        ]
      },
      "post": {
        "tags": [
          "Manage API Keys"
        ],
        "summary": "Update an API key",
        "operationId": "SaveApiKey",
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "description": "API key ID",
            "required": true,
            "allowEmptyValue": true,
            "schema": {
              "$ref": "#/components/schemas/id"
            }
          }
        ],
        "requestBody": {
          "$ref": "#/components/requestBodies/apikey"
        },
        "responses": {
          "200": {
            "description": "Updated API key object",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/apikeyResponse"
                }
              }
            }
          },
          "403": {
            "description": "Not Authorized",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/notAuthorized"
                }
              }
            }
          },
          "404": {
            "description": "Not Found",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/notFound"
                }
              }
            }
          }
        },
        "security": [
          {
            "API_KEY": []
          }
        ]
      },
      "delete": {
        "tags": [
          "Manage API Keys"
        ],
        "summary": "Delete an API Key",
        "operationId": "DeleteApiKey",
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "description": "API key ID",
            "required": true,
            "schema": {
              "$ref": "#/components/schemas/id"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "Successful response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/empty"
                }
              }
            }
          },
          "403": {
            "description": "Not Authorized",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/notAuthorized"
                }
              }
            }
          },
          "404": {
            "description": "Not Found",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/notFound"
                }
              }
            }
          }
        },
        "security": [
          {
            "API_KEY": []
          }
        ]
      }
    },
    "/v1/downloads": {
      "get": {
        "tags": [
          "Download Verification Results"
        ],
        "summary": "Get a list of previously created download requests",
        "operationId": "GetDownloads",
        "parameters": [
          {
            "name": "offset",
            "in": "query",
            "schema": {
              "$ref": "#/components/schemas/offset"
            }
          },
          {
            "name": "limit",
            "in": "query",
            "schema": {
              "$ref": "#/components/schemas/limit"
            }
          },
          {
            "name": "sortField",
            "in": "query",
            "schema": {
              "$ref": "#/components/schemas/sortField"
            }
          },
          {
            "name": "sortOrder",
            "in": "query",
            "schema": {
              "$ref": "#/components/schemas/sortOrder"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "Successful response",
            "content": {
              "application/json": {
                "schema": {
                  "properties": {
                    "downloads": {
                      "type": "array",
                      "items": {
                        "$ref": "#/components/schemas/download"
                      }
                    },
                    "metadata": {
                      "$ref": "#/components/schemas/metadata"
                    }
                  },
                  "type": "object"
                }
              }
            }
          },
          "403": {
            "description": "Not Authorized",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/notAuthorized"
                }
              }
            }
          }
        },
        "security": [
          {
            "API_KEY": []
          }
        ]
      }
    },
    "/v1/downloads/{id}": {
      "get": {
        "tags": [
          "Download Verification Results"
        ],
        "summary": "Get information about a single download request",
        "operationId": "GetDownload",
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "description": "Download Request ID",
            "required": true,
            "schema": {
              "$ref": "#/components/schemas/id"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "Download request object",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/downloadResponse"
                }
              }
            }
          },
          "403": {
            "description": "Not Authorized",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/notAuthorized"
                }
              }
            }
          },
          "404": {
            "description": "Not Found",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/notFound"
                }
              }
            }
          }
        },
        "security": [
          {
            "API_KEY": []
          }
        ]
      },
      "post": {
        "tags": [
          "Download Verification Results"
        ],
        "summary": "Update or create a download request",
        "operationId": "SaveDownload",
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "description": "Download ID",
            "required": true,
            "allowEmptyValue": true,
            "schema": {
              "$ref": "#/components/schemas/id"
            }
          }
        ],
        "requestBody": {
          "$ref": "#/components/requestBodies/download"
        },
        "responses": {
          "200": {
            "description": "New or updated download request object",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/downloadResponse"
                }
              }
            }
          },
          "403": {
            "description": "Not Authorized",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/notAuthorized"
                }
              }
            }
          },
          "404": {
            "description": "Not Found",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/notFound"
                }
              }
            }
          }
        },
        "security": [
          {
            "API_KEY": []
          }
        ]
      },
      "delete": {
        "tags": [
          "Download Verification Results"
        ],
        "summary": "Delete a download request",
        "description": "delete record",
        "operationId": "DeleteDownload",
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "description": "Download Request ID",
            "required": true,
            "schema": {
              "$ref": "#/components/schemas/id"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "Successful response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/empty"
                }
              }
            }
          },
          "403": {
            "description": "Not Authorized",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/notAuthorized"
                }
              }
            }
          },
          "404": {
            "description": "Not Found",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/notFound"
                }
              }
            }
          }
        },
        "security": [
          {
            "API_KEY": []
          }
        ]
      }
    },
    "/v1/entitlements": {
      "get": {
        "tags": [
          "Entitlements"
        ],
        "summary": "Get information about available credits",
        "operationId": "GetEntitlements",
        "responses": {
          "200": {
            "description": "Successful response",
            "content": {
              "application/json": {
                "schema": {
                  "properties": {
                    "entitlements": {
                      "$ref": "#/components/schemas/entitlements"
                    }
                  },
                  "type": "object"
                }
              }
            }
          },
          "403": {
            "description": "Not Authorized",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/notAuthorized"
                }
              }
            }
          }
        },
        "security": [
          {
            "API_KEY": []
          }
        ]
      }
    },
    "/v1/lists": {
      "get": {
        "tags": [
          "Verifying Email Lists"
        ],
        "summary": "Get all email lists in your account",
        "operationId": "GetLists",
        "parameters": [
          {
            "name": "offset",
            "in": "query",
            "schema": {
              "$ref": "#/components/schemas/offset"
            }
          },
          {
            "name": "limit",
            "in": "query",
            "schema": {
              "$ref": "#/components/schemas/limit"
            }
          },
          {
            "name": "sortField",
            "in": "query",
            "schema": {
              "$ref": "#/components/schemas/sortField"
            }
          },
          {
            "name": "sortOrder",
            "in": "query",
            "schema": {
              "$ref": "#/components/schemas/sortOrder"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "Verification lists",
            "content": {
              "application/json": {
                "schema": {
                  "properties": {
                    "lists": {
                      "type": "array",
                      "items": {
                        "$ref": "#/components/schemas/list"
                      }
                    },
                    "metadata": {
                      "$ref": "#/components/schemas/metadataExtended"
                    }
                  },
                  "type": "object"
                }
              }
            }
          },
          "403": {
            "description": "Not Authorized",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/notAuthorized"
                }
              }
            }
          }
        },
        "security": [
          {
            "API_KEY": []
          }
        ]
      }
    },
    "/v1/lists/{id}": {
      "get": {
        "tags": [
          "Verifying Email Lists"
        ],
        "summary": "Get information about a single list",
        "operationId": "GetList",
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "description": "Email list ID",
            "required": true,
            "schema": {
              "$ref": "#/components/schemas/id"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "Email list",
            "content": {
              "application/json": {
                "schema": {
                  "properties": {
                    "list": {
                      "$ref": "#/components/schemas/list"
                    }
                  },
                  "type": "object"
                }
              }
            }
          },
          "403": {
            "description": "Not Authorized",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/notAuthorized"
                }
              }
            }
          },
          "404": {
            "description": "Not Found",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/notFound"
                }
              }
            }
          }
        },
        "security": [
          {
            "API_KEY": []
          }
        ]
      },
      "post": {
        "tags": [
          "Verifying Email Lists"
        ],
        "summary": "Update a list or start verification",
        "description": "Depdning on a parameter set, a list will be created or updated or verification will be started. To start verification include \"status: progress\" in your request.",
        "operationId": "ApproveList",
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "description": "Email list ID",
            "required": true,
            "allowEmptyValue": true,
            "schema": {
              "$ref": "#/components/schemas/id"
            }
          }
        ],
        "requestBody": {
          "$ref": "#/components/requestBodies/list"
        },
        "responses": {
          "200": {
            "description": "Email list",
            "content": {
              "application/json": {
                "schema": {
                  "properties": {
                    "list": {
                      "$ref": "#/components/schemas/list"
                    }
                  },
                  "type": "object"
                }
              }
            }
          },
          "403": {
            "description": "Not Authorized",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/notAuthorized"
                }
              }
            }
          },
          "404": {
            "description": "Not Found",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/notFound"
                }
              }
            }
          }
        },
        "security": [
          {
            "API_KEY": []
          }
        ]
      },
      "delete": {
        "tags": [
          "Verifying Email Lists"
        ],
        "summary": "Delete email list",
        "operationId": "DeleteList",
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "description": "Email list ID",
            "required": true,
            "schema": {
              "$ref": "#/components/schemas/id"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "Successful response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/empty"
                }
              }
            }
          },
          "403": {
            "description": "Not Authorized",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/notAuthorized"
                }
              }
            }
          },
          "404": {
            "description": "Not Found",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/notFound"
                }
              }
            }
          }
        },
        "security": [
          {
            "API_KEY": []
          }
        ]
      }
    },
    "/v1/verifications": {
      "get": {
        "tags": [
          "Verifying Individual Emails"
        ],
        "summary": "Verify up to 10 emails in a synchronous request",
        "operationId": "Verify",
        "parameters": [
          {
            "name": "email",
            "in": "query",
            "schema": {
              "$ref": "#/components/schemas/email"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "Successful Response",
            "content": {
              "application/json": {
                "schema": {
                  "properties": {
                    "verifications": {
                      "type": "array",
                      "items": {
                        "$ref": "#/components/schemas/verificationObject"
                      }
                    },
                    "metadata": {
                      "$ref": "#/components/schemas/metadataVerification"
                    }
                  },
                  "type": "object"
                }
              }
            }
          },
          "403": {
            "description": "Not Authorized",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/notAuthorized"
                }
              }
            }
          }
        },
        "security": [
          {
            "API_KEY": []
          }
        ]
      }
    },
    "/v1/widgets": {
      "get": {
        "tags": [
          "Website Widgets"
        ],
        "summary": "Get a list of widgets in your account",
        "operationId": "GetWidgets",
        "parameters": [
          {
            "name": "offset",
            "in": "query",
            "schema": {
              "$ref": "#/components/schemas/offset"
            }
          },
          {
            "name": "limit",
            "in": "query",
            "schema": {
              "$ref": "#/components/schemas/limit"
            }
          },
          {
            "name": "sortField",
            "in": "query",
            "schema": {
              "$ref": "#/components/schemas/sortField"
            }
          },
          {
            "name": "sortOrder",
            "in": "query",
            "schema": {
              "$ref": "#/components/schemas/sortOrder"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "List of website widgets",
            "content": {
              "application/json": {
                "schema": {
                  "properties": {
                    "widgets": {
                      "type": "array",
                      "items": {
                        "$ref": "#/components/schemas/widget"
                      }
                    },
                    "metadata": {
                      "$ref": "#/components/schemas/metadata"
                    }
                  },
                  "type": "object"
                }
              }
            }
          },
          "403": {
            "description": "Not authorized",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/notAuthorized"
                }
              }
            }
          }
        },
        "security": [
          {
            "API_KEY": []
          }
        ]
      }
    },
    "/v1/widgets/{id}": {
      "get": {
        "tags": [
          "Website Widgets"
        ],
        "summary": "Get information about a single widget",
        "operationId": "GetWidget",
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "description": "Widget ID",
            "required": true,
            "schema": {
              "$ref": "#/components/schemas/id"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "Widget object",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/widgetResponse"
                }
              }
            }
          },
          "403": {
            "description": "Not authorized",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/notAuthorized"
                }
              }
            }
          },
          "404": {
            "description": "Not found",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/notFound"
                }
              }
            }
          }
        },
        "security": [
          {
            "API_KEY": []
          }
        ]
      },
      "post": {
        "tags": [
          "Website Widgets"
        ],
        "summary": "Update or create a widget",
        "operationId": "SaveWidget",
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "description": "Widget ID",
            "required": true,
            "allowEmptyValue": true,
            "schema": {
              "$ref": "#/components/schemas/id"
            }
          }
        ],
        "requestBody": {
          "$ref": "#/components/requestBodies/widget"
        },
        "responses": {
          "200": {
            "description": "Updated or created widget object",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/widgetResponse"
                }
              }
            }
          },
          "403": {
            "description": "Not authorized",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/notAuthorized"
                }
              }
            }
          },
          "404": {
            "description": "Not authorized",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/notFound"
                }
              }
            }
          }
        },
        "security": [
          {
            "API_KEY": []
          }
        ]
      },
      "delete": {
        "tags": [
          "Website Widgets"
        ],
        "summary": "Delete a widget",
        "operationId": "DeleteWidget",
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "description": "Widget ID",
            "required": true,
            "schema": {
              "$ref": "#/components/schemas/id"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "Empty body",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/empty"
                }
              }
            }
          },
          "403": {
            "description": "Not authorized",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/notAuthorized"
                }
              }
            }
          },
          "404": {
            "description": "Not found",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/notFound"
                }
              }
            }
          }
        },
        "security": [
          {
            "API_KEY": []
          }
        ]
      }
    }
  },
  "tags": [
    {
      "name": "Manage API Keys",
      "description": "Manage API Keys"
    },
    {
      "name": "Download Verification Results",
      "description": "Download Verification Results"
    },
    {
      "name": "Entitlements",
      "description": "Entitlements"
    },
    {
      "name": "Verifying Email Lists",
      "description": "Verifying Email Lists"
    },
    {
      "name": "Verifying Individual Emails",
      "description": "Verifying Individual Emails"
    },
    {
      "name": "Website Widgets",
      "description": "Website Widgets"
    }
  ]
};

export const options = {
  source: { document },
  allowedOrigin: "https://api.verified.email",
  securitySchemes: { API_KEY: { type: "http", scheme: "bearer" } },
  methods: { apiKey: [{ scheme: "API_KEY", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
