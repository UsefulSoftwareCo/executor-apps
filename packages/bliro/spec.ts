// The one operation Bliro documents for client applications (https://help.bliro.io/en/articles/10329784-api-access),
// taken from the swagger document embedded in https://api.bliro.io/docs/swagger-ui-init.js.
export const document = {
  "openapi": "3.0.0",
  "info": {
    "title": "Bliro API",
    "version": "1.0.0"
  },
  "servers": [
    {
      "url": "https://api.bliro.io"
    }
  ],
  "components": {
    "securitySchemes": {
      "bearerAuth": {
        "type": "http",
        "scheme": "bearer"
      }
    }
  },
  "paths": {
    "/v3/calls": {
      "get": {
        "summary": "Get calls",
        "description": "Retrieve a paginated list of calls with metadata and associated summary templates. Allows filtering with query options.",
        "tags": [
          "Calls"
        ],
        "parameters": [
          {
            "name": "keyword",
            "in": "query",
            "description": "Search keyword for title, participant name and record name",
            "required": false,
            "schema": {
              "type": "string"
            }
          },
          {
            "name": "startTimestamp",
            "in": "query",
            "description": "Filter by start timestamp (in milliseconds). Return calls where start timestamp is greater than or equal to the provided value",
            "required": false,
            "schema": {
              "type": "integer",
              "nullable": true
            }
          },
          {
            "name": "endTimestamp",
            "in": "query",
            "description": "Filter by end timestamp (in milliseconds). Return calls where end timestamp is less than or equal to the provided value",
            "required": false,
            "schema": {
              "type": "integer",
              "nullable": true
            }
          },
          {
            "name": "deliveryCompleted",
            "in": "query",
            "description": "Filter by delivery completed status",
            "required": false,
            "schema": {
              "type": "boolean"
            }
          },
          {
            "name": "deliveryFailed",
            "in": "query",
            "description": "Filter by delivery failed status",
            "required": false,
            "schema": {
              "type": "boolean"
            }
          },
          {
            "name": "deliveryNotSent",
            "in": "query",
            "description": "Filter by delivery not sent status",
            "required": false,
            "schema": {
              "type": "boolean"
            }
          },
          {
            "name": "contactName",
            "in": "query",
            "description": "Filter by contact name",
            "required": false,
            "schema": {
              "type": "string"
            }
          },
          {
            "name": "recordName",
            "in": "query",
            "description": "Filter by record name",
            "required": false,
            "schema": {
              "type": "string"
            }
          },
          {
            "name": "page",
            "in": "query",
            "description": "Page number for pagination",
            "required": false,
            "schema": {
              "type": "number"
            }
          },
          {
            "name": "limit",
            "in": "query",
            "description": "Number of items per page",
            "required": false,
            "schema": {
              "type": "number"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "A paginated list of calls.",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "additionalProperties": true
                }
              }
            }
          },
          "400": {
            "description": "Invalid input"
          },
          "401": {
            "description": "Unauthorized"
          }
        },
        "operationId": "getCalls",
        "security": [
          {
            "bearerAuth": []
          }
        ]
      }
    }
  }
} as const;
