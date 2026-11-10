import type { JsonValue } from "apps";
import type { OpenapiToolNamesOptions } from "apps/openapi";

// The official Swagger 2.0 document points operations at shared `in: body` parameters
// (#/parameters/Feed, ...). The framework converter turns those into OpenAPI 3 request bodies
// but leaves the operation references behind, which makes the operation invalid. Inlining each
// shared body parameter into its operation puts the bodies in place; the schemas are identical to
// the spec's, with descriptions and examples added to some. The two webhook operations are
// removed: the spec declares them as `/webhooks/feed/:token` with no path parameter, so a tool
// could never supply the token, and they are keyless endpoints that do not take X-AIO-Key.
const patches: readonly { op: "replace" | "remove"; path: string; value?: JsonValue }[] = [
  { op: "remove", path: "/paths/~1webhooks~1feed~1:token" },
  { op: "remove", path: "/paths/~1webhooks~1feed~1:token~1raw" },
  {
    "op": "replace",
    "path": "/paths/~1{username}~1feeds/post/parameters",
    "value": [
      {
        "$ref": "#/parameters/UsernamePath"
      },
      {
        "$ref": "#/parameters/GroupParam"
      },
      {
        "name": "feed",
        "in": "body",
        "required": true,
        "schema": {
          "type": "object",
          "properties": {
            "name": {
              "type": "string"
            },
            "key": {
              "type": "string"
            },
            "description": {
              "type": "string"
            },
            "license": {
              "type": "string"
            }
          }
        }
      }
    ]
  },
  {
    "op": "replace",
    "path": "/paths/~1{username}~1feeds~1{feed_key}/put/parameters",
    "value": [
      {
        "$ref": "#/parameters/UsernamePath"
      },
      {
        "$ref": "#/parameters/FeedPath"
      },
      {
        "name": "feed",
        "in": "body",
        "required": true,
        "schema": {
          "type": "object",
          "properties": {
            "name": {
              "type": "string"
            },
            "key": {
              "type": "string"
            },
            "description": {
              "type": "string"
            },
            "license": {
              "type": "string"
            }
          }
        }
      }
    ]
  },
  {
    "op": "replace",
    "path": "/paths/~1{username}~1feeds~1{feed_key}/patch/parameters",
    "value": [
      {
        "$ref": "#/parameters/UsernamePath"
      },
      {
        "$ref": "#/parameters/FeedPath"
      },
      {
        "name": "feed",
        "in": "body",
        "required": true,
        "schema": {
          "type": "object",
          "properties": {
            "name": {
              "type": "string"
            },
            "key": {
              "type": "string"
            },
            "description": {
              "type": "string"
            },
            "license": {
              "type": "string"
            }
          }
        }
      }
    ]
  },
  {
    "op": "replace",
    "path": "/paths/~1{username}~1feeds~1{feed_key}~1data/post/parameters",
    "value": [
      {
        "$ref": "#/parameters/UsernamePath"
      },
      {
        "$ref": "#/parameters/FeedPath"
      },
      {
        "name": "datum",
        "in": "body",
        "required": true,
        "description": "Data record including a `value` field (required) and optionally including: `lat`, `lon`, `ele` (latitude, longitude, and elevation values), and `created_at` (a date/time string).",
        "schema": {
          "type": "object",
          "properties": {
            "value": {
              "type": "string"
            },
            "created_at": {
              "type": "string",
              "format": "dateTime"
            },
            "lat": {
              "type": "string"
            },
            "lon": {
              "type": "string"
            },
            "ele": {
              "type": "string"
            },
            "epoch": {
              "type": "number"
            }
          }
        }
      }
    ]
  },
  {
    "op": "replace",
    "path": "/paths/~1{username}~1feeds~1{feed_key}~1data~1batch/post/parameters",
    "value": [
      {
        "$ref": "#/parameters/UsernamePath"
      },
      {
        "$ref": "#/parameters/FeedPath"
      },
      {
        "name": "data",
        "in": "body",
        "required": true,
        "description": "A collection of data records including `value` (required) and optionally including: `lat`, `lon`, `ele` (latitude, longitude, and elevation values), and `created_at` (a date/time string).",
        "schema": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "value": {
                "type": "string"
              },
              "created_at": {
                "type": "string",
                "format": "dateTime"
              },
              "lat": {
                "type": "string"
              },
              "lon": {
                "type": "string"
              },
              "ele": {
                "type": "string"
              },
              "epoch": {
                "type": "number"
              }
            }
          }
        }
      }
    ]
  },
  {
    "op": "replace",
    "path": "/paths/~1{username}~1feeds~1{feed_key}~1data~1{id}/put/parameters",
    "value": [
      {
        "$ref": "#/parameters/UsernamePath"
      },
      {
        "$ref": "#/parameters/FeedPath"
      },
      {
        "$ref": "#/parameters/IDPath"
      },
      {
        "name": "datum",
        "in": "body",
        "required": true,
        "description": "Data record including a `value` field (required) and optionally including: `lat`, `lon`, `ele` (latitude, longitude, and elevation values), and `created_at` (a date/time string).",
        "schema": {
          "type": "object",
          "properties": {
            "value": {
              "type": "string"
            },
            "created_at": {
              "type": "string",
              "format": "dateTime"
            },
            "lat": {
              "type": "string"
            },
            "lon": {
              "type": "string"
            },
            "ele": {
              "type": "string"
            },
            "epoch": {
              "type": "number"
            }
          }
        }
      }
    ]
  },
  {
    "op": "replace",
    "path": "/paths/~1{username}~1feeds~1{feed_key}~1data~1{id}/patch/parameters",
    "value": [
      {
        "$ref": "#/parameters/UsernamePath"
      },
      {
        "$ref": "#/parameters/FeedPath"
      },
      {
        "$ref": "#/parameters/IDPath"
      },
      {
        "name": "datum",
        "in": "body",
        "required": true,
        "description": "Data record including a `value` field (required) and optionally including: `lat`, `lon`, `ele` (latitude, longitude, and elevation values), and `created_at` (a date/time string).",
        "schema": {
          "type": "object",
          "properties": {
            "value": {
              "type": "string"
            },
            "created_at": {
              "type": "string",
              "format": "dateTime"
            },
            "lat": {
              "type": "string"
            },
            "lon": {
              "type": "string"
            },
            "ele": {
              "type": "string"
            },
            "epoch": {
              "type": "number"
            }
          }
        }
      }
    ]
  },
  {
    "op": "replace",
    "path": "/paths/~1{username}~1groups/post/parameters",
    "value": [
      {
        "$ref": "#/parameters/UsernamePath"
      },
      {
        "name": "group",
        "in": "body",
        "required": true,
        "schema": {
          "type": "object",
          "properties": {
            "name": {
              "type": "string"
            },
            "description": {
              "type": "string"
            },
            "key": {
              "type": "string"
            }
          }
        },
        "x-examples": {
          "application/json": "{\"name\":\"Some Group\", \"description\":\"A collection of feeds\"}",
          "default": "{\"name\":\"Some Group\",\"description\":\"A collection of feeds\"}"
        }
      }
    ]
  },
  {
    "op": "replace",
    "path": "/paths/~1{username}~1groups~1{group_key}/put/parameters",
    "value": [
      {
        "$ref": "#/parameters/UsernamePath"
      },
      {
        "$ref": "#/parameters/GroupPath"
      },
      {
        "name": "group",
        "in": "body",
        "required": true,
        "schema": {
          "type": "object",
          "properties": {
            "name": {
              "type": "string"
            },
            "description": {
              "type": "string"
            },
            "key": {
              "type": "string"
            }
          }
        },
        "x-examples": {
          "application/json": "{\"name\":\"Some Group\", \"description\":\"A collection of feeds\"}",
          "default": "{\"name\":\"Some Group\",\"description\":\"A collection of feeds\"}"
        }
      }
    ]
  },
  {
    "op": "replace",
    "path": "/paths/~1{username}~1groups~1{group_key}/patch/parameters",
    "value": [
      {
        "$ref": "#/parameters/UsernamePath"
      },
      {
        "$ref": "#/parameters/GroupPath"
      },
      {
        "name": "group",
        "in": "body",
        "required": true,
        "schema": {
          "type": "object",
          "properties": {
            "name": {
              "type": "string"
            },
            "description": {
              "type": "string"
            },
            "key": {
              "type": "string"
            }
          }
        },
        "x-examples": {
          "application/json": "{\"name\":\"Some Group\", \"description\":\"A collection of feeds\"}",
          "default": "{\"name\":\"Some Group\",\"description\":\"A collection of feeds\"}"
        }
      }
    ]
  },
  {
    "op": "replace",
    "path": "/paths/~1{username}~1groups~1{group_key}~1feeds/post/parameters",
    "value": [
      {
        "$ref": "#/parameters/UsernamePath"
      },
      {
        "$ref": "#/parameters/GroupPath"
      },
      {
        "name": "feed",
        "in": "body",
        "required": true,
        "schema": {
          "type": "object",
          "properties": {
            "name": {
              "type": "string"
            },
            "key": {
              "type": "string"
            },
            "description": {
              "type": "string"
            },
            "license": {
              "type": "string"
            }
          }
        }
      }
    ]
  },
  {
    "op": "replace",
    "path": "/paths/~1{username}~1groups~1{group_key}~1data/post/parameters",
    "value": [
      {
        "$ref": "#/parameters/UsernamePath"
      },
      {
        "$ref": "#/parameters/GroupPath"
      },
      {
        "name": "group_feed_data",
        "in": "body",
        "required": true,
        "schema": {
          "type": "object",
          "required": [
            "feeds"
          ],
          "properties": {
            "location": {
              "type": "object",
              "description": "A location record with `lat`, `lon`, and [optional] `ele` properties.",
              "required": [
                "lat",
                "lon"
              ],
              "properties": {
                "lat": {
                  "type": "number"
                },
                "lon": {
                  "type": "number"
                },
                "ele": {
                  "type": "number"
                }
              }
            },
            "feeds": {
              "description": "An array of feed data records with `key` and `value` properties.",
              "type": "array",
              "items": {
                "type": "object",
                "required": [
                  "key",
                  "value"
                ],
                "properties": {
                  "key": {
                    "type": "string"
                  },
                  "value": {
                    "type": "string"
                  }
                }
              }
            },
            "created_at": {
              "type": "string",
              "description": "Optional created_at timestamp which will be applied to all feed values created."
            }
          }
        }
      }
    ]
  },
  {
    "op": "replace",
    "path": "/paths/~1{username}~1groups~1{group_key}~1feeds~1{feed_key}~1data/post/parameters",
    "value": [
      {
        "$ref": "#/parameters/UsernamePath"
      },
      {
        "$ref": "#/parameters/GroupPath"
      },
      {
        "$ref": "#/parameters/FeedPath"
      },
      {
        "name": "datum",
        "in": "body",
        "required": true,
        "description": "Data record including a `value` field (required) and optionally including: `lat`, `lon`, `ele` (latitude, longitude, and elevation values), and `created_at` (a date/time string).",
        "schema": {
          "type": "object",
          "properties": {
            "value": {
              "type": "string"
            },
            "created_at": {
              "type": "string",
              "format": "dateTime"
            },
            "lat": {
              "type": "string"
            },
            "lon": {
              "type": "string"
            },
            "ele": {
              "type": "string"
            },
            "epoch": {
              "type": "number"
            }
          }
        }
      }
    ]
  },
  {
    "op": "replace",
    "path": "/paths/~1{username}~1groups~1{group_key}~1feeds~1{feed_key}~1data~1batch/post/parameters",
    "value": [
      {
        "$ref": "#/parameters/UsernamePath"
      },
      {
        "$ref": "#/parameters/GroupPath"
      },
      {
        "$ref": "#/parameters/FeedPath"
      },
      {
        "name": "data",
        "in": "body",
        "required": true,
        "description": "A collection of data records including `value` (required) and optionally including: `lat`, `lon`, `ele` (latitude, longitude, and elevation values), and `created_at` (a date/time string).",
        "schema": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "value": {
                "type": "string"
              },
              "created_at": {
                "type": "string",
                "format": "dateTime"
              },
              "lat": {
                "type": "string"
              },
              "lon": {
                "type": "string"
              },
              "ele": {
                "type": "string"
              },
              "epoch": {
                "type": "number"
              }
            }
          }
        }
      }
    ]
  },
  {
    "op": "replace",
    "path": "/paths/~1{username}~1dashboards/post/parameters",
    "value": [
      {
        "$ref": "#/parameters/UsernamePath"
      },
      {
        "name": "dashboard",
        "in": "body",
        "required": true,
        "schema": {
          "type": "object",
          "properties": {
            "name": {
              "type": "string"
            },
            "description": {
              "type": "string"
            },
            "key": {
              "type": "string"
            }
          }
        }
      }
    ]
  },
  {
    "op": "replace",
    "path": "/paths/~1{username}~1dashboards~1{id}/put/parameters",
    "value": [
      {
        "$ref": "#/parameters/UsernamePath"
      },
      {
        "$ref": "#/parameters/IDPath"
      },
      {
        "name": "dashboard",
        "in": "body",
        "required": true,
        "schema": {
          "type": "object",
          "properties": {
            "name": {
              "type": "string"
            },
            "description": {
              "type": "string"
            },
            "key": {
              "type": "string"
            }
          }
        }
      }
    ]
  },
  {
    "op": "replace",
    "path": "/paths/~1{username}~1dashboards~1{id}/patch/parameters",
    "value": [
      {
        "$ref": "#/parameters/UsernamePath"
      },
      {
        "$ref": "#/parameters/IDPath"
      },
      {
        "name": "dashboard",
        "in": "body",
        "required": true,
        "schema": {
          "type": "object",
          "properties": {
            "name": {
              "type": "string"
            },
            "description": {
              "type": "string"
            },
            "key": {
              "type": "string"
            }
          }
        }
      }
    ]
  },
  {
    "op": "replace",
    "path": "/paths/~1{username}~1dashboards~1{dashboard_id}~1blocks/post/parameters",
    "value": [
      {
        "$ref": "#/parameters/UsernamePath"
      },
      {
        "name": "block",
        "in": "body",
        "required": true,
        "schema": {
          "type": "object",
          "properties": {
            "name": {
              "type": "string"
            },
            "description": {
              "type": "string"
            },
            "key": {
              "type": "string"
            },
            "dashboard_id": {
              "type": "number"
            },
            "visual_type": {
              "type": "string"
            },
            "column": {
              "type": "number"
            },
            "row": {
              "type": "number"
            },
            "size_x": {
              "type": "number"
            },
            "size_y": {
              "type": "number"
            },
            "block_feeds": {
              "type": "array",
              "items": {
                "type": "object",
                "properties": {
                  "feed_id": {
                    "type": "string"
                  },
                  "group_id": {
                    "type": "string"
                  }
                }
              }
            },
            "properties": {
              "type": "object"
            }
          }
        }
      },
      {
        "$ref": "#/parameters/DashboardIDPath"
      }
    ]
  },
  {
    "op": "replace",
    "path": "/paths/~1{username}~1dashboards~1{dashboard_id}~1blocks~1{id}/put/parameters",
    "value": [
      {
        "$ref": "#/parameters/UsernamePath"
      },
      {
        "$ref": "#/parameters/DashboardIDPath"
      },
      {
        "$ref": "#/parameters/IDPath"
      },
      {
        "name": "block",
        "in": "body",
        "required": true,
        "schema": {
          "type": "object",
          "properties": {
            "name": {
              "type": "string"
            },
            "description": {
              "type": "string"
            },
            "key": {
              "type": "string"
            },
            "dashboard_id": {
              "type": "number"
            },
            "visual_type": {
              "type": "string"
            },
            "column": {
              "type": "number"
            },
            "row": {
              "type": "number"
            },
            "size_x": {
              "type": "number"
            },
            "size_y": {
              "type": "number"
            },
            "block_feeds": {
              "type": "array",
              "items": {
                "type": "object",
                "properties": {
                  "feed_id": {
                    "type": "string"
                  },
                  "group_id": {
                    "type": "string"
                  }
                }
              }
            },
            "properties": {
              "type": "object"
            }
          }
        }
      }
    ]
  },
  {
    "op": "replace",
    "path": "/paths/~1{username}~1dashboards~1{dashboard_id}~1blocks~1{id}/patch/parameters",
    "value": [
      {
        "$ref": "#/parameters/UsernamePath"
      },
      {
        "$ref": "#/parameters/DashboardIDPath"
      },
      {
        "$ref": "#/parameters/IDPath"
      },
      {
        "name": "block",
        "in": "body",
        "required": true,
        "schema": {
          "type": "object",
          "properties": {
            "name": {
              "type": "string"
            },
            "description": {
              "type": "string"
            },
            "key": {
              "type": "string"
            },
            "dashboard_id": {
              "type": "number"
            },
            "visual_type": {
              "type": "string"
            },
            "column": {
              "type": "number"
            },
            "row": {
              "type": "number"
            },
            "size_x": {
              "type": "number"
            },
            "size_y": {
              "type": "number"
            },
            "block_feeds": {
              "type": "array",
              "items": {
                "type": "object",
                "properties": {
                  "feed_id": {
                    "type": "string"
                  },
                  "group_id": {
                    "type": "string"
                  }
                }
              }
            },
            "properties": {
              "type": "object"
            }
          }
        }
      }
    ]
  },
  {
    "op": "replace",
    "path": "/paths/~1{username}~1tokens/post/parameters",
    "value": [
      {
        "$ref": "#/parameters/UsernamePath"
      },
      {
        "name": "token",
        "in": "body",
        "required": true,
        "schema": {
          "type": "object",
          "properties": {
            "token": {
              "type": "string"
            }
          }
        }
      }
    ]
  },
  {
    "op": "replace",
    "path": "/paths/~1{username}~1tokens~1{id}/put/parameters",
    "value": [
      {
        "$ref": "#/parameters/UsernamePath"
      },
      {
        "$ref": "#/parameters/IDPath"
      },
      {
        "name": "token",
        "in": "body",
        "required": true,
        "schema": {
          "type": "object",
          "properties": {
            "token": {
              "type": "string"
            }
          }
        }
      }
    ]
  },
  {
    "op": "replace",
    "path": "/paths/~1{username}~1tokens~1{id}/patch/parameters",
    "value": [
      {
        "$ref": "#/parameters/UsernamePath"
      },
      {
        "$ref": "#/parameters/IDPath"
      },
      {
        "name": "token",
        "in": "body",
        "required": true,
        "schema": {
          "type": "object",
          "properties": {
            "token": {
              "type": "string"
            }
          }
        }
      }
    ]
  },
  {
    "op": "replace",
    "path": "/paths/~1{username}~1triggers/post/parameters",
    "value": [
      {
        "$ref": "#/parameters/UsernamePath"
      },
      {
        "name": "trigger",
        "in": "body",
        "required": true,
        "schema": {
          "type": "object",
          "properties": {
            "name": {
              "type": "string"
            }
          }
        }
      }
    ]
  },
  {
    "op": "replace",
    "path": "/paths/~1{username}~1triggers~1{id}/put/parameters",
    "value": [
      {
        "$ref": "#/parameters/UsernamePath"
      },
      {
        "$ref": "#/parameters/IDPath"
      },
      {
        "name": "trigger",
        "in": "body",
        "required": true,
        "schema": {
          "type": "object",
          "properties": {
            "name": {
              "type": "string"
            }
          }
        }
      }
    ]
  },
  {
    "op": "replace",
    "path": "/paths/~1{username}~1triggers~1{id}/patch/parameters",
    "value": [
      {
        "$ref": "#/parameters/UsernamePath"
      },
      {
        "$ref": "#/parameters/IDPath"
      },
      {
        "name": "trigger",
        "in": "body",
        "required": true,
        "schema": {
          "type": "object",
          "properties": {
            "name": {
              "type": "string"
            }
          }
        }
      }
    ]
  },
  {
    "op": "replace",
    "path": "/paths/~1{username}~1{type}~1{type_id}~1acl/post/parameters",
    "value": [
      {
        "$ref": "#/parameters/UsernamePath"
      },
      {
        "$ref": "#/parameters/PermTypePath"
      },
      {
        "$ref": "#/parameters/PermTypeIDPath"
      },
      {
        "name": "permission",
        "in": "body",
        "required": true,
        "schema": {
          "type": "object",
          "properties": {
            "mode": {
              "type": "string",
              "default": "r",
              "enum": [
                "r",
                "w",
                "rw"
              ]
            },
            "scope": {
              "type": "string",
              "default": "public",
              "enum": [
                "secret",
                "public",
                "user",
                "organization"
              ]
            },
            "scope_value": {
              "type": "string"
            }
          }
        }
      }
    ]
  },
  {
    "op": "replace",
    "path": "/paths/~1{username}~1{type}~1{type_id}~1acl~1{id}/put/parameters",
    "value": [
      {
        "$ref": "#/parameters/UsernamePath"
      },
      {
        "$ref": "#/parameters/PermTypePath"
      },
      {
        "$ref": "#/parameters/PermTypeIDPath"
      },
      {
        "$ref": "#/parameters/IDPath"
      },
      {
        "name": "permission",
        "in": "body",
        "required": true,
        "schema": {
          "type": "object",
          "properties": {
            "mode": {
              "type": "string",
              "default": "r",
              "enum": [
                "r",
                "w",
                "rw"
              ]
            },
            "scope": {
              "type": "string",
              "default": "public",
              "enum": [
                "secret",
                "public",
                "user",
                "organization"
              ]
            },
            "scope_value": {
              "type": "string"
            }
          }
        }
      }
    ]
  },
  {
    "op": "replace",
    "path": "/paths/~1{username}~1{type}~1{type_id}~1acl~1{id}/patch/parameters",
    "value": [
      {
        "$ref": "#/parameters/UsernamePath"
      },
      {
        "$ref": "#/parameters/PermTypePath"
      },
      {
        "$ref": "#/parameters/PermTypeIDPath"
      },
      {
        "$ref": "#/parameters/IDPath"
      },
      {
        "name": "permission",
        "in": "body",
        "required": true,
        "schema": {
          "type": "object",
          "properties": {
            "mode": {
              "type": "string",
              "default": "r",
              "enum": [
                "r",
                "w",
                "rw"
              ]
            },
            "scope": {
              "type": "string",
              "default": "public",
              "enum": [
                "secret",
                "public",
                "user",
                "organization"
              ]
            },
            "scope_value": {
              "type": "string"
            }
          }
        }
      }
    ]
  }
];

export const options = {
  source: { url: "https://io.adafruit.com/api/docs/v2.json" },
  allowedOrigin: "https://io.adafruit.com",
  securitySchemes: { HeaderKey: { type: "apiKey", in: "header", name: "X-AIO-Key" } },
  methods: { apiKey: [{ scheme: "HeaderKey", field: "key", part: "value", prefix: "" }] },
  oauth: [],
  patches,
} satisfies OpenapiToolNamesOptions;
