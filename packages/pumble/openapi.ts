import type { JsonObject } from "apps";
import type { OpenapiToolNamesOptions } from "apps/openapi";

// Pumble publishes its API Keys addon OpenAPI document only inline in the Scalar page at
// https://pumble-api-keys.addons.marketplace.cake.com/api-docs/ (no standalone file URL), so it is embedded here.
const document: JsonObject = {
 "openapi": "3.0.0",
 "info": {
  "title": "Pumble API Addon documentation",
  "version": "1.0.0",
  "description": "Documentation of the endpoints available in Pumble API addon",
  "contact": {
   "name": "Pumble support",
   "email": "support@pumble.com"
  }
 },
 "servers": [
  {
   "url": "https://pumble-api-keys.addons.marketplace.cake.com",
   "description": "API Keys documentation"
  }
 ],
 "components": {
  "securitySchemes": {
   "ApiKeyAuth": {
    "type": "apiKey",
    "in": "header",
    "name": "ApiKey",
    "description": "Enter your API Key in the field below"
   }
  }
 },
 "security": [
  {
   "ApiKeyAuth": []
  }
 ],
 "paths": {
  "/listUsers": {
   "get": {
    "tags": [
     "Users"
    ],
    "summary": "List all users in the workspace",
    "description": "Returns a JSON array of every user that belongs to the workspace\nthe authenticated caller is part of.  No pagination is performed;\nthe full user list is returned in a single response.\n",
    "responses": {
     "200": {
      "description": "Successful retrieval of the user list",
      "content": {
       "application/json": {
        "example": [
         {
          "id": "6800b09c46b38741a2691ea3",
          "email": "",
          "name": "Pumblebot",
          "workspaceId": "6800b09c46b38741a2691ea0",
          "role": "USER",
          "status": "ACTIVATED",
          "avatar": {
           "fullPath": "http://localhost:9999/avatars/default/pumblebot",
           "scaledPath": "http://localhost:9999/avatars/default/pumblebot"
          },
          "timeZoneId": "America/Los_Angeles",
          "automaticallyTimeZone": true,
          "title": "Your friendly neighborhood bot.",
          "phone": "",
          "isAddonBot": false,
          "customStatus": null,
          "invitedBy": null,
          "activeUntil": 0,
          "isPumbleBot": true,
          "broadcastWarningShownTs": null
         }
        ]
       }
      }
     },
     "403": {
      "description": "Forbidden. The request parameters were invalid, or an internal error occurred when processing the request.",
      "content": {
       "application/json": {
        "example": {
         "error": "Failed to fetch workspace users"
        }
       }
      }
     }
    }
   }
  },
  "/listUserGroups": {
   "get": {
    "tags": [
     "Users"
    ],
    "summary": "List all user groups in the workspace",
    "description": "Retrieves a list of all user groups that belong to the\nworkspace the caller is authenticated for.  The API returns\nthe full array of groups in a single response (no pagination).\n",
    "responses": {
     "200": {
      "description": "A list of user groups retrieved successfully",
      "content": {
       "application/json": {
        "example": [
         {
          "id": "507f1f77bcf86cd799439011",
          "workspaceId": "507f1f77bcf86cd799439012",
          "createdBy": "507f1f77bcf86cd799439013",
          "disabled": false,
          "name": "Engineering",
          "handle": "engineering",
          "description": "Engineering team – all software engineers",
          "workspaceUserIds": [
           "507f1f77bcf86cd799439014",
           "507f1f77bcf86cd799439015",
           "507f1f77bcf86cd799439016"
          ]
         }
        ]
       }
      }
     },
     "403": {
      "description": "Forbidden. The request parameters were invalid, or an internal error occurred when processing the request.",
      "content": {
       "application/json": {
        "example": {
         "error": "Failed to fetch user groups"
        }
       }
      }
     }
    }
   }
  },
  "/myInfo": {
   "get": {
    "tags": [
     "Users"
    ],
    "summary": "Get information about the current user",
    "description": "Retrieves the authenticated user’s profile\n",
    "responses": {
     "200": {
      "description": "User information retrieved successfully",
      "content": {
       "application/json": {
        "example": {
         "id": "507f1f77bcf86cd799439011",
         "email": "user@example.com",
         "name": "John Doe",
         "workspaceId": "507f1f77bcf86cd799439012",
         "role": "OWNER",
         "status": "ACTIVATED",
         "avatar": {
          "fullPath": "http://localhost:9999/avatars/default/6800b09c46b38741a2691ea1",
          "scaledPath": "http://localhost:9999/avatars/default/48/6800b09c46b38741a2691ea1"
         },
         "timeZoneId": "America/New_York",
         "automaticallyTimeZone": true,
         "title": "Senior Engineer",
         "phone": "+1-555-1234",
         "isAddonBot": false,
         "customStatus": "In a meeting",
         "invitedBy": null,
         "activeUntil": 0,
         "isPumbleBot": false,
         "broadcastWarningShownTs": null
        }
       }
      }
     },
     "403": {
      "description": "Forbidden. The request parameters were invalid, or an\ninternal error occurred when processing the request.\n",
      "content": {
       "application/json": {
        "example": {
         "error": "Failed to fetch workspace user"
        }
       }
      }
     }
    }
   }
  },
  "/customStatus": {
   "post": {
    "tags": [
     "Users"
    ],
    "summary": "Update the custom status of a user",
    "description": "Updates the custom status of the authenticated user in the current workspace.",
    "requestBody": {
     "required": true,
     "content": {
      "application/json": {
       "example": {
        "code": ":joy:",
        "status": "testing",
        "expiration": "custom",
        "expiresAt": 1766487300000
       }
      }
     }
    },
    "responses": {
     "200": {
      "description": "Custom status updated successfully"
     },
     "403": {
      "description": "Forbidden. The request parameters were invalid, or an\ninternal error occurred when processing the request.\n",
      "content": {
       "application/json": {
        "example": {
         "error": "Failed to fetch user groups"
        }
       }
      }
     }
    }
   }
  },
  "/createScheduledMessage": {
   "post": {
    "tags": [
     "Scheduled Messages"
    ],
    "summary": "Create a scheduled message",
    "description": "Schedules a new message to be sent at a specified time.",
    "requestBody": {
     "required": true,
     "content": {
      "application/json": {
       "schema": {
        "type": "object",
        "properties": {
         "channelId": {
          "type": "string",
          "description": "The ID of the channel where the message will be scheduled to be sent."
         },
         "text": {
          "type": "string",
          "description": "The text content of the scheduled message."
         },
         "sendAt": {
          "type": "string",
          "format": "date-time",
          "description": "The timestamp at which the message should be sent."
         }
        }
       }
      }
     }
    },
    "responses": {
     "200": {
      "description": "Message successfully sent.",
      "content": {
       "application/json": {
        "schema": {
         "type": "object",
         "properties": {
          "id": {
           "type": "string",
           "description": "The ID of the created message.",
           "example": "507f1f77bcf86cd799439011"
          },
          "channelId": {
           "type": "string",
           "description": "The ID of the channel the message was posted to.",
           "example": "507f1f77bcf86cd799439012"
          }
         }
        }
       }
      }
     },
     "403": {
      "description": "Forbidden. Either the request body was invalid, or there was an issue processing the request\n",
      "content": {
       "application/json": {
        "schema": {
         "type": "object",
         "properties": {
          "error": {
           "type": "string",
           "description": "Human‑readable error message.",
           "example": "Could not find channel with that identifier"
          }
         }
        }
       }
      }
     }
    }
   }
  },
  "/fetchScheduledMessages": {
   "get": {
    "tags": [
     "Scheduled Messages"
    ],
    "summary": "Fetch a list of scheduled messages",
    "description": "Retrieves a list of scheduled messages for a specific channel\nor all channels.  Pagination is optional – use `cursor` to\nfetch subsequent pages and `limit` to control the page size.\n",
    "parameters": [
     {
      "name": "channelId",
      "in": "query",
      "schema": {
       "type": "string"
      },
      "description": "Optional. The ID of the channel to fetch scheduled messages from."
     },
     {
      "name": "cursor",
      "in": "query",
      "schema": {
       "type": "string"
      },
      "description": "Optional pagination cursor for fetching results."
     },
     {
      "name": "limit",
      "in": "query",
      "schema": {
       "type": "integer"
      },
      "description": "Optional number of scheduled messages to fetch (limit)."
     }
    ],
    "responses": {
     "200": {
      "description": "Scheduled messages fetched successfully",
      "content": {
       "application/json": {
        "example": {
         "scheduledMessages": [
          {
           "id": "69270c857584c01d36caaa83",
           "workspaceId": "6800b09c46b38741a2691ea0",
           "author": "6800b09c46b38741a2691ea1",
           "channelId": "68c90291898b4634d41a852c",
           "text": "test2",
           "sendAt": 1765792000000,
           "files": [],
           "blocks": [
            {
             "type": "rich_text",
             "elements": [
              {
               "type": "rich_text_section",
               "elements": [
                {
                 "type": "text",
                 "text": "test2"
                }
               ]
              }
             ]
            }
           ],
           "attachments": [],
           "recurrence": null
          }
         ],
         "hasMore": false
        }
       }
      }
     },
     "403": {
      "description": "Forbidden. Invalid request parameters or unable to fetch scheduled messages.\n",
      "content": {
       "application/json": {
        "example": {
         "error": "Failed to fetch scheduled messages or Unauthorized error message."
        }
       }
      }
     }
    }
   }
  },
  "/fetchScheduledMessage": {
   "get": {
    "tags": [
     "Scheduled Messages"
    ],
    "summary": "Fetch a specific scheduled message by ID",
    "description": "Retrieves details of a single scheduled message identified by\nits unique ID (`scheduledMessageId` query param).\n",
    "parameters": [
     {
      "name": "scheduledMessageId",
      "in": "query",
      "required": true,
      "schema": {
       "type": "string"
      },
      "description": "The unique identifier of the scheduled message to fetch."
     }
    ],
    "responses": {
     "200": {
      "description": "Scheduled message details fetched successfully",
      "content": {
       "application/json": {
        "example": {
         "id": "69270c857584c01d36caaa83",
         "workspaceId": "6800b09c46b38741a2691ea0",
         "author": "6800b09c46b38741a2691ea1",
         "channelId": "68c90291898b4634d41a852c",
         "text": "test2",
         "sendAt": 1765792000000,
         "files": [],
         "blocks": [
          {
           "type": "rich_text",
           "elements": [
            {
             "type": "rich_text_section",
             "elements": [
              {
               "type": "text",
               "text": "test2"
              }
             ]
            }
           ]
          }
         ],
         "attachments": [],
         "recurrence": null
        }
       }
      }
     },
     "403": {
      "description": "Forbidden. Invalid request parameters or unable to fetch scheduled message details.\n",
      "content": {
       "application/json": {
        "example": {
         "error": "Failed to fetch scheduled message details or Unauthorized error message."
        }
       }
      }
     }
    }
   }
  },
  "/editScheduledMessage": {
   "post": {
    "tags": [
     "Scheduled Messages"
    ],
    "summary": "Edit a scheduled message",
    "description": "Edits the content or delivery time of an existing scheduled message.\n",
    "requestBody": {
     "required": true,
     "content": {
      "application/json": {
       "example": {
        "scheduledMessageId": "69270cec7584c01d36caaacc",
        "text": "test message",
        "sendAt": 1765792000000,
        "channelId": "68c90291898b4634d41a852c"
       }
      }
     }
    },
    "responses": {
     "200": {
      "description": "Scheduled message edited successfully"
     },
     "403": {
      "description": "Forbidden. Invalid request body or unable to edit scheduled message.\n",
      "content": {
       "application/json": {
        "example": {
         "error": "Failed to edit scheduled message or Invalid request body."
        }
       }
      }
     }
    }
   }
  },
  "/deleteScheduledMessage": {
   "delete": {
    "tags": [
     "Scheduled Messages"
    ],
    "summary": "Delete a scheduled message by ID",
    "description": "Deletes an existing scheduled message identified by its unique ID.",
    "parameters": [
     {
      "name": "scheduledMessageId",
      "in": "query",
      "required": true,
      "schema": {
       "type": "string"
      },
      "description": "The unique identifier of the scheduled message to delete."
     }
    ],
    "responses": {
     "200": {
      "description": "Scheduled message deleted successfully."
     },
     "403": {
      "description": "Forbidden. Invalid request parameters or unable to delete scheduled message.",
      "content": {
       "text/plain": {
        "schema": {
         "type": "string",
         "example": "Failed to delete scheduled message or Invalid request parameters."
        }
       }
      }
     }
    }
   }
  },
  "/sendMessage": {
   "post": {
    "tags": [
     "Messages"
    ],
    "summary": "Send a message to a channel",
    "description": "Sends a message to a specified channel either as the authenticated user or as a bot.\n**Channel selection** - Provide **either** `channel` (the channel’s name) **or** `channelId` (the channel’s ID). - If `channelId` is omitted, the server will attempt to resolve the channel by its `channel` name. - If `channelId` is supplied, it will be used directly and the name lookup is skipped.",
    "requestBody": {
     "required": true,
     "content": {
      "application/json": {
       "schema": {
        "type": "object",
        "properties": {
         "channel": {
          "type": "string",
          "description": "The **name** of the channel to send the message to. Provide this **only if** you do not have the channel’s ID."
         },
         "channelId": {
          "type": "string",
          "description": "The **ID** of the channel to send the message to. Provide this if you already know the channel ID; otherwise it will be ignored."
         },
         "text": {
          "type": "string",
          "description": "The content of the message to be sent."
         },
         "asBot": {
          "type": "boolean",
          "default": false,
          "description": "Whether the message should be posted as a bot. Default is `false`."
         }
        }
       }
      }
     }
    },
    "responses": {
     "200": {
      "description": "Message successfully sent.",
      "content": {
       "application/json": {
        "schema": {
         "type": "object",
         "properties": {
          "id": {
           "type": "string",
           "description": "The ID of the created message.",
           "example": "507f1f77bcf86cd799439011"
          },
          "channelId": {
           "type": "string",
           "description": "The ID of the channel the message was posted to.",
           "example": "507f1f77bcf86cd799439012"
          }
         }
        }
       }
      }
     },
     "403": {
      "description": "Forbidden. Either the request body was invalid, the channel couldn’t be resolved, or a bot is not allowed to post to a private channel.",
      "content": {
       "application/json": {
        "schema": {
         "type": "object",
         "properties": {
          "error": {
           "type": "string",
           "description": "Human‑readable error message.",
           "example": "Could not find channel with that identifier"
          }
         }
        }
       }
      }
     }
    }
   }
  },
  "/sendReply": {
   "post": {
    "tags": [
     "Messages"
    ],
    "summary": "Reply to a message in a channel",
    "description": "Sends a reply to an existing message in a specified channel either as the authenticated user or as a bot.\n**Channel selection** - Provide **either** `channel` (the channel’s name) **or** `channelId` (the channel’s ID). - If `channelId` is omitted, the server will attempt to resolve the channel by its `channel` name. - If `channelId` is supplied, it will be used directly and the name lookup is skipped.",
    "requestBody": {
     "required": true,
     "content": {
      "application/json": {
       "schema": {
        "type": "object",
        "properties": {
         "channel": {
          "type": "string",
          "description": "The **name** of the channel where the message is located. Provide this only if you do not have the channel's ID."
         },
         "channelId": {
          "type": "string",
          "description": "The **ID** of the channel where the message is located. Provide this if you already know the channel ID; otherwise it will be ignored."
         },
         "messageId": {
          "type": "string",
          "description": "The ID of the message to reply to."
         },
         "text": {
          "type": "string",
          "description": "The content of the reply message."
         },
         "asBot": {
          "type": "boolean",
          "default": false,
          "description": "Whether the reply should be posted as a bot. Default is `false`."
         }
        }
       }
      }
     }
    },
    "responses": {
     "200": {
      "description": "Reply successfully sent.",
      "content": {
       "application/json": {
        "schema": {
         "type": "object",
         "properties": {
          "id": {
           "type": "string",
           "description": "The ID of the created reply message.",
           "example": "507f1f77bcf86cd799439013"
          },
          "channelId": {
           "type": "string",
           "description": "The ID of the channel the reply was posted to.",
           "example": "507f1f77bcf86cd799439012"
          }
         }
        }
       }
      }
     },
     "403": {
      "description": "Forbidden. Invalid request body, channel not found, or unauthorized access to private channels as a bot.",
      "content": {
       "application/json": {
        "schema": {
         "type": "object",
         "properties": {
          "error": {
           "type": "string",
           "description": "Human‑readable error message.",
           "example": "Could not find channel with that identifier"
          }
         }
        }
       }
      }
     }
    }
   }
  },
  "/dmUser": {
   "post": {
    "tags": [
     "Messages"
    ],
    "summary": "Send a direct message to a user",
    "description": "Sends a direct message to a single user. Provide **either** `userId` (the user’s ID) **or** `email` (the user’s e‑mail). The request body must contain a `text` field with the message content.",
    "requestBody": {
     "required": true,
     "content": {
      "application/json": {
       "schema": {
        "type": "object",
        "required": [
         "text"
        ],
        "properties": {
         "userId": {
          "type": "string",
          "description": "The ID of the user to send a message to. Provide this only if you already know the ID."
         },
         "email": {
          "type": "string",
          "description": "The e‑mail address of the user to send a message to. Provide this only if you do not have the ID."
         },
         "text": {
          "type": "string",
          "description": "The message content."
         }
        }
       }
      }
     }
    },
    "responses": {
     "200": {
      "description": "Direct message successfully sent.",
      "content": {
       "application/json": {
        "schema": {
         "type": "object",
         "properties": {
          "id": {
           "type": "string",
           "example": "507f1f77bcf86cd799439013"
          },
          "channelId": {
           "type": "string",
           "example": "507f1f77bcf86cd799439012"
          }
         }
        }
       }
      }
     },
     "403": {
      "description": "Forbidden. Either the request body was invalid, the user could not be resolved, or an internal error occurred while sending the message.",
      "content": {
       "application/json": {
        "schema": {
         "type": "object",
         "properties": {
          "error": {
           "type": "string",
           "example": "Could not find user with that e‑mail"
          }
         }
        }
       }
      }
     }
    }
   }
  },
  "/dmGroup": {
   "post": {
    "tags": [
     "Messages"
    ],
    "summary": "Send a direct message to a group of users",
    "description": "Sends a direct message to a group (multi‑user DM). Provide **either** a `userIds` array (IDs) **or** an `emails` array (e‑mails). The request body must contain a `text` field with the message content.",
    "requestBody": {
     "required": true,
     "content": {
      "application/json": {
       "schema": {
        "type": "object",
        "required": [
         "text"
        ],
        "properties": {
         "userIds": {
          "type": "array",
          "items": {
           "type": "string"
          },
          "description": "The list of user IDs that should receive the DM. Provide this only if you already know the IDs."
         },
         "emails": {
          "type": "array",
          "items": {
           "type": "string"
          },
          "description": "The list of e‑mail addresses for the participants. Provide this only if you do not have the IDs."
         },
         "text": {
          "type": "string",
          "description": "The message content."
         }
        }
       }
      }
     }
    },
    "responses": {
     "200": {
      "description": "Group direct message successfully sent.",
      "content": {
       "application/json": {
        "schema": {
         "type": "object",
         "properties": {
          "id": {
           "type": "string",
           "example": "507f1f77bcf86cd799439014"
          },
          "channelId": {
           "type": "string",
           "example": "507f1f77bcf86cd799439012"
          }
         }
        }
       }
      }
     },
     "403": {
      "description": "Forbidden. The request body was invalid, or an internal error occurred when processing the request.",
      "content": {
       "application/json": {
        "schema": {
         "type": "object",
         "properties": {
          "error": {
           "type": "string",
           "example": "Not all users could be found with the given e‑mails"
          }
         }
        }
       }
      }
     }
    }
   }
  },
  "/fetchMessage": {
   "get": {
    "tags": [
     "Messages"
    ],
    "summary": "Fetch a message by ID",
    "description": "Retrieves the full content of a message, including link previews, reactions, and other metadata. `messageId` is required; either `channelId` **or** `channel` must also be supplied.",
    "parameters": [
     {
      "in": "query",
      "name": "messageId",
      "required": true,
      "schema": {
       "type": "string"
      },
      "description": "The ID of the message to retrieve."
     },
     {
      "in": "query",
      "name": "channelId",
      "schema": {
       "type": "string"
      },
      "description": "The channel where the message lives. Either this or `channel` must be present."
     },
     {
      "in": "query",
      "name": "channel",
      "schema": {
       "type": "string"
      },
      "description": "The name of the channel. Either this or `channelId` must be supplied."
     }
    ],
    "responses": {
     "200": {
      "description": "Message fetched successfully.",
      "content": {
       "application/json": {
        "example": {
         "id": "68b2345c7518f59c33b81db9",
         "workspaceId": "6800c09c46b38741a2691ea1",
         "channelId": "6800c09c46b38741a2691ea7",
         "author": "6800c09c46b38741a2691ea2",
         "text": "Reminder: Submit your timesheet by Friday",
         "timestamp": "2025-09-01T10:00:00Z",
         "timestampMilli": 1725151200000,
         "subtype": "",
         "reactions": [],
         "linkPreviews": [
          {
           "id": "68b234557518f59c33b81dc0",
           "order": -50,
           "type": "message",
           "url": "http://localhost:3000/workspace/6800c09c46b38741a2691ea1/6837d373cc403a667795f75b?message=68a5b56fd1e65377d741b523",
           "blocks": [
            {
             "type": "rich_text",
             "elements": [
              {
               "type": "rich_text_section",
               "elements": [
                {
                 "type": "text",
                 "text": "⚠️ Please fill in your timesheet before end of week",
                 "style": {
                  "italic": true
                 }
                }
               ]
              }
             ]
            }
           ],
           "channelId": "6837d373cc403a667795f75b",
           "workspaceUserId": "6837d3732ba61099dd0c31a4",
           "timestamp": 1725151200000,
           "messageId": "68a5b56fd1e65377d741b523",
           "threadRootId": null
          }
         ],
         "isFollowing": true,
         "threadRootInfo": null,
         "threadReplyInfo": null,
         "files": [],
         "deleted": false,
         "edited": true,
         "localId": "loc-12345",
         "attachments": [],
         "authorAppId": null,
         "savedTimestampMilli": 0,
         "blocks": null,
         "meta": null
        }
       }
      }
     },
     "403": {
      "description": "Forbidden. The request body was invalid, or an internal error occurred when processing the request.",
      "content": {
       "application/json": {
        "schema": {
         "type": "object",
         "properties": {
          "error": {
           "type": "string",
           "example": "Invalid request parameters: messageId and channel identifier are required."
          }
         }
        }
       }
      }
     }
    }
   }
  },
  "/fetchThreadReplies": {
   "get": {
    "tags": [
     "Messages"
    ],
    "summary": "Fetch replies for a thread message",
    "description": "Retrieves the replies to a specific thread message in a channel.",
    "parameters": [
     {
      "in": "query",
      "name": "rootMessageId",
      "required": true,
      "schema": {
       "type": "string"
      },
      "description": "The unique identifier of the root message for which to fetch replies."
     },
     {
      "in": "query",
      "name": "channelId",
      "schema": {
       "type": "string"
      },
      "description": "The ID of the channel where the message is located. Either `channelId` or `channel` must be provided."
     },
     {
      "in": "query",
      "name": "channel",
      "schema": {
       "type": "string"
      },
      "description": "The name of the channel where the message is located. Either `channel` or `channelId` must be provided."
     },
     {
      "in": "query",
      "name": "cursor",
      "schema": {
       "type": "string"
      },
      "description": "Optional pagination cursor for fetching results."
     },
     {
      "in": "query",
      "name": "limit",
      "schema": {
       "type": "integer"
      },
      "description": "Optional number of replies to fetch (limit)."
     },
     {
      "in": "query",
      "name": "strategy",
      "schema": {
       "type": "string"
      },
      "description": "Optional pagination strategy."
     }
    ],
    "responses": {
     "200": {
      "description": "Thread replies fetched successfully.",
      "content": {
       "application/json": {
        "example": [
         {
          "id": "68b2345c7518f59c33b81db9",
          "workspaceId": "6800c09c46b38741a2691ea1",
          "channelId": "6800c09c46b38741a2691ea7",
          "author": "6800c09c46b38741a2691ea2",
          "text": "Reminder: Submit your timesheet by Friday",
          "timestamp": "2025-09-01T10:00:00Z",
          "timestampMilli": 1725151200000,
          "subtype": "",
          "reactions": [],
          "linkPreviews": [
           {
            "id": "68b234557518f59c33b81dc0",
            "order": -50,
            "type": "message",
            "url": "http://localhost:3000/workspace/6800c09c46b38741a2691ea1/6837d373cc403a667795f75b?message=68a5b56fd1e65377d741b523",
            "blocks": [
             {
              "type": "rich_text",
              "elements": [
               {
                "type": "rich_text_section",
                "elements": [
                 {
                  "type": "text",
                  "text": "⚠️ Please fill in your timesheet before end of week",
                  "style": {
                   "italic": true
                  }
                 }
                ]
               }
              ]
             }
            ],
            "channelId": "6837d373cc403a667795f75b",
            "workspaceUserId": "6837d3732ba61099dd0c31a4",
            "timestamp": 1725151200000,
            "messageId": "68a5b56fd1e65377d741b523",
            "threadRootId": null
           }
          ],
          "isFollowing": true,
          "threadRootInfo": null,
          "threadReplyInfo": null,
          "files": [],
          "deleted": false,
          "edited": true,
          "localId": "loc-12345",
          "attachments": [],
          "authorAppId": null,
          "savedTimestampMilli": 0,
          "blocks": null,
          "meta": null
         }
        ]
       }
      }
     },
     "403": {
      "description": "Forbidden. The request body was invalid, or an internal error occurred when processing the request.",
      "content": {
       "application/json": {
        "schema": {
         "type": "object",
         "properties": {
          "error": {
           "type": "string",
           "example": "Invalid request parameters: rootMessageId and channel identifier are required."
          }
         }
        }
       }
      }
     }
    }
   }
  },
  "/searchMessages": {
   "post": {
    "tags": [
     "Messages"
    ],
    "summary": "Search messages in channels",
    "description": "Searches for messages based on specified search criteria.",
    "requestBody": {
     "required": true,
     "content": {
      "application/json": {
       "schema": {
        "type": "object",
        "properties": {
         "text": {
          "type": "string",
          "description": "The text to search for within messages. At least one of `text`, `from`, or `in` is required."
         },
         "from": {
          "type": "array",
          "items": {
           "type": "string"
          },
          "description": "Array of user IDs whose messages should be searched (optional)."
         },
         "in": {
          "type": "array",
          "items": {
           "type": "string"
          },
          "description": "Array of channel identifiers where the search will be performed (optional)."
         }
        }
       }
      }
     }
    },
    "responses": {
     "200": {
      "description": "Search results retrieved successfully.",
      "content": {
       "application/json": {
        "example": [
         {
          "id": "68b2345c7518f59c33b81db9",
          "workspaceId": "6800c09c46b38741a2691ea1",
          "channelId": "6800c09c46b38741a2691ea7",
          "author": "6800c09c46b38741a2691ea2",
          "text": "Reminder: Submit your timesheet by Friday",
          "timestamp": "2025-09-01T10:00:00Z",
          "timestampMilli": 1725151200000,
          "subtype": "",
          "reactions": [],
          "linkPreviews": [
           {
            "id": "68b234557518f59c33b81dc0",
            "order": -50,
            "type": "message",
            "url": "http://localhost:3000/workspace/6800c09c46b38741a2691ea1/6837d373cc403a667795f75b?message=68a5b56fd1e65377d741b523",
            "blocks": [
             {
              "type": "rich_text",
              "elements": [
               {
                "type": "rich_text_section",
                "elements": [
                 {
                  "type": "text",
                  "text": "⚠️ Please fill in your timesheet before end of week",
                  "style": {
                   "italic": true
                  }
                 }
                ]
               }
              ]
             }
            ],
            "channelId": "6837d373cc403a667795f75b",
            "workspaceUserId": "6837d3732ba61099dd0c31a4",
            "timestamp": 1725151200000,
            "messageId": "68a5b56fd1e65377d741b523",
            "threadRootId": null
           }
          ],
          "isFollowing": true,
          "threadRootInfo": null,
          "threadReplyInfo": null,
          "files": [],
          "deleted": false,
          "edited": true,
          "localId": "loc-12345",
          "attachments": [],
          "authorAppId": null,
          "savedTimestampMilli": 0,
          "blocks": null,
          "meta": null
         },
         {
          "id": "68b2345c7518f59c33b81dc1",
          "workspaceId": "6800c09c46b38741a2691ea1",
          "channelId": "6800c09c46b38741a2691ea8",
          "author": "6800c09c46b38741a2691eb3",
          "text": "Got it, thanks for the heads‑up!",
          "timestamp": "2025-09-01T10:15:00Z",
          "timestampMilli": 1725152100000,
          "subtype": "",
          "reactions": [],
          "linkPreviews": [],
          "isFollowing": false,
          "threadRootInfo": null,
          "threadReplyInfo": null,
          "files": [],
          "deleted": false,
          "edited": false,
          "localId": "loc-12346",
          "attachments": [],
          "authorAppId": null,
          "savedTimestampMilli": 0,
          "blocks": null,
          "meta": null
         }
        ]
       }
      }
     },
     "403": {
      "description": "Forbidden. The request body was invalid, or an internal error occurred when processing the request.",
      "content": {
       "application/json": {
        "schema": {
         "type": "object",
         "properties": {
          "error": {
           "type": "string",
           "example": "Invalid request body: At least 'text', 'from', or 'in' filter is required for search."
          }
         }
        }
       }
      }
     }
    }
   }
  },
  "/deleteMessage": {
   "delete": {
    "tags": [
     "Messages"
    ],
    "summary": "Delete a message by ID",
    "description": "Deletes a specific message in a channel.",
    "parameters": [
     {
      "name": "messageId",
      "in": "query",
      "required": true,
      "schema": {
       "type": "string"
      },
      "description": "The unique identifier of the message to be deleted."
     },
     {
      "name": "channelId",
      "in": "query",
      "schema": {
       "type": "string"
      },
      "description": "The ID of the channel where the message is located. Either `channelId` or `channel` must be provided."
     },
     {
      "name": "channel",
      "in": "query",
      "schema": {
       "type": "string"
      },
      "description": "The name of the channel where the message is located. Either `channel` or `channelId` must be provided."
     }
    ],
    "responses": {
     "200": {
      "description": "Message deleted successfully."
     },
     "403": {
      "description": "Forbidden. Invalid request parameters or unable to delete message.",
      "content": {
       "text/plain": {
        "schema": {
         "type": "string",
         "example": "Failed to delete message or Could not find channel with that identifier."
        }
       }
      }
     }
    }
   }
  },
  "/listMessages": {
   "get": {
    "tags": [
     "Messages"
    ],
    "summary": "List messages in a channel",
    "description": "Retrieves a list of messages from a specific channel.",
    "parameters": [
     {
      "in": "query",
      "name": "channelId",
      "schema": {
       "type": "string"
      },
      "description": "The ID of the channel to fetch messages from. Either `channelId` or `channel` must be provided."
     },
     {
      "in": "query",
      "name": "channel",
      "schema": {
       "type": "string"
      },
      "description": "The name of the channel to fetch messages from. Either `channel` or `channelId` must be provided."
     },
     {
      "in": "query",
      "name": "cursor",
      "schema": {
       "type": "string"
      },
      "description": "Optional pagination cursor for fetching results."
     },
     {
      "in": "query",
      "name": "limit",
      "schema": {
       "type": "integer"
      },
      "description": "Optional number of messages to fetch (limit)."
     },
     {
      "in": "query",
      "name": "strategy",
      "schema": {
       "type": "string"
      },
      "description": "Optional pagination strategy."
     }
    ],
    "responses": {
     "200": {
      "description": "Messages listed successfully.",
      "content": {
       "application/json": {
        "example": [
         {
          "id": "68b2345c7518f59c33b81db9",
          "workspaceId": "6800c09c46b38741a2691ea1",
          "channelId": "6800c09c46b38741a2691ea7",
          "author": "6800c09c46b38741a2691ea2",
          "text": "Reminder: Submit your timesheet by Friday",
          "timestamp": "2025-09-01T10:00:00Z",
          "timestampMilli": 1725151200000,
          "subtype": "",
          "reactions": [],
          "linkPreviews": [
           {
            "id": "68b234557518f59c33b81dc0",
            "order": -50,
            "type": "message",
            "url": "http://localhost:3000/workspace/6800c09c46b38741a2691ea1/6837d373cc403a667795f75b?message=68a5b56fd1e65377d741b523",
            "blocks": [
             {
              "type": "rich_text",
              "elements": [
               {
                "type": "rich_text_section",
                "elements": [
                 {
                  "type": "text",
                  "text": "⚠️ Please fill in your timesheet before end of week",
                  "style": {
                   "italic": true
                  }
                 }
                ]
               }
              ]
             }
            ],
            "channelId": "6837d373cc403a667795f75b",
            "workspaceUserId": "6837d3732ba61099dd0c31a4",
            "timestamp": 1725151200000,
            "messageId": "68a5b56fd1e65377d741b523",
            "threadRootId": null
           }
          ],
          "isFollowing": true,
          "threadRootInfo": null,
          "threadReplyInfo": null,
          "files": [],
          "deleted": false,
          "edited": true,
          "localId": "loc-12345",
          "attachments": [],
          "authorAppId": null,
          "savedTimestampMilli": 0,
          "blocks": null,
          "meta": null
         },
         {
          "id": "68b2345c7518f59c33b81dc1",
          "workspaceId": "6800c09c46b38741a2691ea1",
          "channelId": "6800c09c46b38741a2691ea8",
          "author": "6800c09c46b38741a2691eb3",
          "text": "Got it, thanks for the heads‑up!",
          "timestamp": "2025-09-01T10:15:00Z",
          "timestampMilli": 1725152100000,
          "subtype": "",
          "reactions": [],
          "linkPreviews": [],
          "isFollowing": false,
          "threadRootInfo": null,
          "threadReplyInfo": null,
          "files": [],
          "deleted": false,
          "edited": false,
          "localId": "loc-12346",
          "attachments": [],
          "authorAppId": null,
          "savedTimestampMilli": 0,
          "blocks": null,
          "meta": null
         }
        ]
       }
      }
     },
     "403": {
      "description": "Forbidden. The request parameters were invalid, or an internal error occurred when processing the request.",
      "content": {
       "application/json": {
        "schema": {
         "type": "object",
         "properties": {
          "error": {
           "type": "string",
           "example": "Invalid request parameters: channel identifier is required."
          }
         }
        }
       }
      }
     }
    }
   }
  },
  "/addReaction": {
   "post": {
    "tags": [
     "Messages"
    ],
    "summary": "Add a reaction to a message",
    "description": "Adds a specified reaction (emoji) to a message.",
    "requestBody": {
     "required": true,
     "content": {
      "application/json": {
       "schema": {
        "type": "object",
        "properties": {
         "messageId": {
          "type": "string",
          "description": "The unique identifier of the message to which the reaction will be added."
         },
         "reaction": {
          "type": "string",
          "description": "The reaction code (emoji) to add. Must be at least 3 characters long."
         },
         "skinTone": {
          "type": "integer",
          "description": "Optional number that represents the skin tone of an emoji. Must be between 1 and 6."
         }
        }
       }
      }
     }
    },
    "responses": {
     "200": {
      "description": "Reaction added successfully."
     },
     "403": {
      "description": "Forbidden. The request parameters were invalid, or an internal error occurred when processing the request.",
      "content": {
       "application/json": {
        "schema": {
         "type": "object",
         "properties": {
          "error": {
           "type": "string",
           "example": "Invalid request parameters..."
          }
         }
        }
       }
      }
     }
    }
   }
  },
  "/removeReaction": {
   "delete": {
    "tags": [
     "Messages"
    ],
    "summary": "Remove a reaction from a message",
    "description": "Removes a specified reaction (emoji) from a message.",
    "parameters": [
     {
      "name": "messageId",
      "in": "query",
      "required": true,
      "schema": {
       "type": "string"
      },
      "description": "The unique identifier of the message from which to remove the reaction."
     },
     {
      "name": "reaction",
      "in": "query",
      "required": true,
      "schema": {
       "type": "string"
      },
      "description": "The reaction code (emoji) to be removed."
     },
     {
      "name": "skinTone",
      "in": "query",
      "required": false,
      "schema": {
       "type": "integer"
      },
      "description": "Optional number that represents the skin tone of an emoji. Must be between 1 and 6."
     }
    ],
    "responses": {
     "200": {
      "description": "Reaction removed successfully."
     },
     "403": {
      "description": "Forbidden. The request parameters were invalid, or an internal error occurred when processing the request.",
      "content": {
       "application/json": {
        "schema": {
         "type": "object",
         "properties": {
          "error": {
           "type": "string",
           "example": "Invalid request parameters..."
          }
         }
        }
       }
      }
     }
    }
   }
  },
  "/editMessage": {
   "post": {
    "tags": [
     "Messages"
    ],
    "summary": "Edit a message's text",
    "description": "Edits the text of an existing message.",
    "requestBody": {
     "required": true,
     "content": {
      "application/json": {
       "schema": {
        "type": "object",
        "properties": {
         "messageId": {
          "type": "string",
          "description": "The unique identifier of the message to be edited."
         },
         "channelId": {
          "type": "string",
          "description": "The ID of the channel where the message is located."
         },
         "text": {
          "type": "string",
          "description": "The new text for the message."
         }
        }
       }
      }
     }
    },
    "responses": {
     "200": {
      "description": "Message edited successfully."
     },
     "403": {
      "description": "Forbidden. The request parameters were invalid, or an internal error occurred when processing the request.",
      "content": {
       "application/json": {
        "schema": {
         "type": "object",
         "properties": {
          "error": {
           "type": "string",
           "example": "Invalid request parameters..."
          }
         }
        }
       }
      }
     }
    }
   }
  },
  "/listChannels": {
   "get": {
    "tags": [
     "Channels"
    ],
    "summary": "List all channels",
    "description": "Retrieves a list of all available channels.",
    "responses": {
     "200": {
      "description": "A list of channels retrieved successfully.",
      "content": {
       "application/json": {
        "example": [
         {
          "channel": {
           "addedById": null,
           "channelType": "DIRECT",
           "creatorId": "6800b09c46b38741a2691ea1",
           "description": "",
           "desktopNotificationPreferences": null,
           "id": "694527ec1b481acecb07cf83",
           "isAddonBot": false,
           "isArchived": false,
           "isHidden": false,
           "isInitial": false,
           "isMain": false,
           "isMember": true,
           "isMuted": false,
           "isPumbleBot": false,
           "lastMarkTimestamp": "2025-12-19T10:25:01.066Z",
           "lastMarkTimestampMilli": 1766139901066,
           "lastMessageTimestamp": "2025-12-19T10:24:59Z",
           "lastMessageTimestampMilli": 1766139899000,
           "mobileNotificationPreferences": null,
           "name": "",
           "notifyAboutRepliesInThreads": true,
           "postingPermissions": {
            "allowThreads": true,
            "allowMentions": true,
            "postingPermissionsGroup": "EVERYONE",
            "workspaceUserIds": []
           },
           "sectionId": "",
           "timestamp": "2025-12-19T10:24:44Z",
           "timestampMilli": 1766139884000,
           "workspaceId": "6800b09c46b38741a2691ea0"
          },
          "pinnedMessages": [],
          "users": [
           "68f1e771233b87db329cc5a5",
           "6800b09c46b38741a2691ea1"
          ]
         }
        ]
       }
      }
     },
     "403": {
      "description": "Error retrieving channels",
      "content": {
       "application/json": {
        "example": {
         "error": "Forbidden"
        }
       }
      }
     }
    }
   }
  },
  "/getChannel": {
   "get": {
    "tags": [
     "Channels"
    ],
    "summary": "Get channel details by ID or name",
    "description": "Retrieves the detailed information of a specific channel using its ID or name.",
    "parameters": [
     {
      "name": "channelId",
      "in": "query",
      "schema": {
       "type": "string"
      },
      "description": "Optional. The unique identifier for the channel to retrieve details about."
     },
     {
      "name": "channel",
      "in": "query",
      "schema": {
       "type": "string"
      },
      "description": "Optional. The name of the channel to retrieve details about."
     }
    ],
    "responses": {
     "200": {
      "description": "Channel details retrieved successfully.",
      "content": {
       "application/json": {
        "schema": {
         "type": "object",
         "properties": {
          "id": {
           "type": "string"
          },
          "name": {
           "type": "string"
          },
          "description": {
           "type": "string"
          }
         }
        }
       }
      }
     },
     "403": {
      "description": "Forbidden. Invalid request parameters or unable to retrieve channel details.",
      "content": {
       "text/plain": {
        "schema": {
         "type": "string",
         "example": "Error message from server response."
        }
       }
      }
     }
    }
   }
  },
  "/createChannel": {
   "post": {
    "tags": [
     "Channels"
    ],
    "summary": "Create a new channel",
    "description": "Creates a new channel with the specified name, type, and optional description.",
    "requestBody": {
     "required": true,
     "content": {
      "application/json": {
       "schema": {
        "type": "object",
        "properties": {
         "name": {
          "type": "string",
          "description": "The name of the new channel."
         },
         "type": {
          "type": "string",
          "description": "The type of channel (e.g., public, private)."
         },
         "description": {
          "type": "string",
          "description": "An optional description for the new channel."
         }
        }
       }
      }
     }
    },
    "responses": {
     "200": {
      "description": "Channel created successfully.",
      "content": {
       "application/json": {
        "schema": {
         "type": "object",
         "properties": {
          "id": {
           "type": "string"
          },
          "name": {
           "type": "string"
          }
         }
        }
       }
      }
     },
     "403": {
      "description": "Forbidden. Invalid request body or unable to create channel.",
      "content": {
       "text/plain": {
        "schema": {
         "type": "string",
         "example": "Error message from server response."
        }
       }
      }
     }
    }
   }
  },
  "/addUsersToChannel": {
   "post": {
    "tags": [
     "Channels"
    ],
    "summary": "Add users to a channel",
    "description": "Adds specified users to an existing channel.",
    "requestBody": {
     "required": true,
     "content": {
      "application/json": {
       "schema": {
        "type": "object",
        "properties": {
         "userIds": {
          "type": "array",
          "items": {
           "type": "string"
          },
          "description": "Array of unique identifiers for the users to add."
         },
         "channelId": {
          "type": "string",
          "description": "The unique identifier for the channel where users will be added."
         }
        }
       }
      }
     }
    },
    "responses": {
     "200": {
      "description": "Users successfully added to the channel."
     },
     "403": {
      "description": "Forbidden. Invalid request parameters or unable to add users to channel.",
      "content": {
       "text/plain": {
        "schema": {
         "type": "string",
         "example": "Error message from server response."
        }
       }
      }
     }
    }
   }
  },
  "/removeUserFromChannel": {
   "post": {
    "tags": [
     "Channels"
    ],
    "summary": "Remove a user from a channel",
    "description": "Removes a specified user from an existing channel.",
    "requestBody": {
     "required": true,
     "content": {
      "application/json": {
       "schema": {
        "type": "object",
        "properties": {
         "userId": {
          "type": "string",
          "description": "The unique identifier for the user to remove."
         },
         "channelId": {
          "type": "string",
          "description": "The unique identifier for the channel from which the user will be removed."
         }
        }
       }
      }
     }
    },
    "responses": {
     "200": {
      "description": "User successfully removed from the channel."
     },
     "403": {
      "description": "Forbidden. Invalid request parameters or unable to remove user from channel.",
      "content": {
       "text/plain": {
        "schema": {
         "type": "string",
         "example": "Error message from server response."
        }
       }
      }
     }
    }
   }
  }
 },
 "tags": []
};

export const options = {
  source: { document },
  allowedOrigin: "https://pumble-api-keys.addons.marketplace.cake.com",
  securitySchemes: { ApiKeyAuth: { type: "apiKey", in: "header", name: "ApiKey" } },
  methods: { apiKey: [{ scheme: "ApiKeyAuth", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
