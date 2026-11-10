import type { JsonObject } from "apps";
import type { OpenapiToolNamesOptions } from "apps/openapi";

// Heartbeat publishes its API reference on ReadMe (https://heartbeat.readme.io), one OpenAPI
// fragment per operation page and no combined document. This is those fragments merged into one
// document (Heartbeat API 1.0.0, https://api.heartbeat.chat/v0).
const document: JsonObject =
{
 "openapi": "3.0.0",
 "info": {
  "version": "1.0.0",
  "title": "Heartbeat API",
  "license": {
   "name": "http://www.apache.org/licenses/LICENSE-2.0.html"
  },
  "contact": {
   "name": "Heartbeat API Support",
   "email": "support@heartbeat.chat"
  },
  "description": "An API for managing your Heartbeat community"
 },
 "servers": [
  {
   "url": "https://api.heartbeat.chat/v0"
  }
 ],
 "tags": [
  {
   "name": "channels"
  },
  {
   "name": "courses"
  },
  {
   "name": "documents"
  },
  {
   "name": "events"
  },
  {
   "name": "groups"
  },
  {
   "name": "invitations"
  },
  {
   "name": "messages"
  },
  {
   "name": "roles"
  },
  {
   "name": "users"
  },
  {
   "name": "voice"
  },
  {
   "name": "webhooks"
  }
 ],
 "paths": {
  "/groups/{groupID}/memberships": {
   "put": {
    "operationId": "addToGroup",
    "description": "Add users to a group",
    "tags": [
     "groups"
    ],
    "parameters": [
     {
      "in": "path",
      "name": "groupID",
      "required": true,
      "schema": {
       "type": "string",
       "format": "uuid"
      }
     }
    ],
    "requestBody": {
     "required": true,
     "content": {
      "application/json": {
       "schema": {
        "type": "object",
        "properties": {
         "emails": {
          "description": "The emails of the users that should be added to the group",
          "type": "array",
          "items": {
           "type": "string",
           "format": "email"
          }
         },
         "shouldRemoveFromSiblingGroups": {
          "description": "If true, the users will be removed from any other groups that share a parent group with the selected group. Useful when moving users between different stages",
          "type": "boolean"
         }
        },
        "required": [
         "emails"
        ]
       }
      }
     }
    },
    "responses": {
     "200": {
      "description": "Successful response"
     },
     "401": {
      "$ref": "#/components/responses/UnauthorizedError"
     },
     "404": {
      "description": "Could not find requested group id or user email"
     }
    }
   },
   "delete": {
    "operationId": "removeFromGroup",
    "description": "Remove users from a group",
    "tags": [
     "groups"
    ],
    "parameters": [
     {
      "in": "path",
      "name": "groupID",
      "required": true,
      "schema": {
       "type": "string",
       "format": "uuid"
      }
     }
    ],
    "requestBody": {
     "required": true,
     "content": {
      "application/json": {
       "schema": {
        "type": "object",
        "properties": {
         "emails": {
          "description": "The emails of the users that should be removed from the group",
          "type": "array",
          "items": {
           "type": "string",
           "format": "email"
          }
         }
        },
        "required": [
         "emails"
        ]
       }
      }
     }
    },
    "responses": {
     "200": {
      "description": "Successful response"
     },
     "401": {
      "$ref": "#/components/responses/UnauthorizedError"
     },
     "404": {
      "description": "Could not find requested group id or user email"
     }
    }
   }
  },
  "/channels": {
   "put": {
    "operationId": "createChannel",
    "description": "Create a new Channel in a Heartbeat community",
    "tags": [
     "channels"
    ],
    "parameters": [],
    "requestBody": {
     "required": true,
     "content": {
      "application/json": {
       "schema": {
        "type": "object",
        "properties": {
         "name": {
          "type": "string",
          "example": "random"
         },
         "description": {
          "type": "string",
          "example": "A place to discuss anything you want"
         },
         "isPrivate": {
          "type": "boolean"
         },
         "channelCategoryID": {
          "type": "string",
          "format": "uuid",
          "description": "The id for the category where the channel should be created"
         },
         "invitedUsers": {
          "description": "A list of emails corresponding to the users that can access this channel. If the channel is private, only these users will be able to access the channel. If both invitedUsers & invitedGroups are provided, the lists will be combined.",
          "type": "array",
          "items": {
           "type": "string",
           "format": "email"
          }
         },
         "invitedGroups": {
          "description": "If the channel is private, only these groups will be able to access the channel. If both invitedUsers & invitedGroups are provided, the lists will be combined.",
          "type": "array",
          "items": {
           "type": "string",
           "format": "uuid"
          }
         },
         "isReadOnly": {
          "type": "boolean",
          "description": "If true, only admins & moderators will be able to create threads in this channel. This option is not currently available for chat channels"
         },
         "channelType": {
          "type": "string",
          "enum": [
           "POSTS",
           "CHAT"
          ],
          "description": "Thread channels are created by default"
         }
        },
        "required": [
         "name",
         "isPrivate",
         "channelCategoryID"
        ]
       }
      }
     }
    },
    "responses": {
     "200": {
      "description": "Successful response"
     },
     "400": {
      "$ref": "#/components/responses/ValidationError"
     },
     "401": {
      "$ref": "#/components/responses/UnauthorizedError"
     }
    }
   },
   "get": {
    "operationId": "getChannels",
    "description": "Returns an array of all channels",
    "tags": [
     "channels"
    ],
    "responses": {
     "200": {
      "description": "Successful response",
      "content": {
       "application/json": {
        "schema": {
         "type": "array",
         "items": {
          "$ref": "#/components/schemas/Channel"
         }
        }
       }
      }
     },
     "401": {
      "$ref": "#/components/responses/UnauthorizedError"
     }
    }
   }
  },
  "/channelCategories": {
   "put": {
    "operationId": "createChannelCategory",
    "description": "Create a new channel category in a Heartbeat community",
    "tags": [
     "channels"
    ],
    "parameters": [],
    "requestBody": {
     "required": true,
     "content": {
      "application/json": {
       "schema": {
        "type": "object",
        "properties": {
         "name": {
          "type": "string",
          "example": "Cohort 2"
         }
        },
        "required": [
         "name"
        ]
       }
      }
     }
    },
    "responses": {
     "200": {
      "description": "Successful response",
      "content": {
       "application/json": {
        "schema": {
         "$ref": "#/components/schemas/ChannelCategory"
        }
       }
      }
     },
     "400": {
      "$ref": "#/components/responses/ValidationError"
     },
     "401": {
      "$ref": "#/components/responses/UnauthorizedError"
     }
    }
   },
   "get": {
    "operationId": "getChannelCategories",
    "description": "Returns an array of all channel categories within a community",
    "tags": [
     "channels"
    ],
    "responses": {
     "200": {
      "description": "Successful response",
      "content": {
       "application/json": {
        "schema": {
         "type": "array",
         "items": {
          "$ref": "#/components/schemas/ChannelCategory"
         }
        }
       }
      }
     },
     "401": {
      "$ref": "#/components/responses/UnauthorizedError"
     }
    }
   }
  },
  "/chatChannel/{channelID}/message": {
   "put": {
    "operationId": "createChatMessage",
    "description": "Send a new chat message to a chat channel",
    "tags": [
     "messages"
    ],
    "parameters": [
     {
      "in": "path",
      "name": "channelID",
      "required": true,
      "schema": {
       "type": "string",
       "format": "uuid"
      }
     }
    ],
    "requestBody": {
     "required": true,
     "content": {
      "application/json": {
       "schema": {
        "type": "object",
        "properties": {
         "text": {
          "type": "string",
          "example": "<p>Hello!</p>",
          "description": "See the Rich Text page to learn more about formatting"
         },
         "from": {
          "description": "The user id of the sender. Only an admin user can be chosen. If this field is not provided, the user that created the API key will be used.",
          "type": "string",
          "format": "uuid"
         },
         "createdAt": {
          "type": "string",
          "format": "date-time",
          "description": "Optional timestamp to override the default creation time for the chat message. Must be in ISO 8601 format.",
          "example": "2023-10-15T14:30:00.000Z"
         }
        },
        "required": [
         "text",
         "from"
        ]
       }
      }
     }
    },
    "responses": {
     "204": {
      "description": "Successful response"
     },
     "400": {
      "$ref": "#/components/responses/ValidationError"
     },
     "401": {
      "$ref": "#/components/responses/UnauthorizedError"
     }
    }
   }
  },
  "/comments": {
   "put": {
    "operationId": "createComment",
    "description": "Create a new comment",
    "tags": [
     "channels"
    ],
    "parameters": [],
    "requestBody": {
     "required": true,
     "content": {
      "application/json": {
       "schema": {
        "type": "object",
        "properties": {
         "text": {
          "type": "string",
          "example": "<p>Hello!</p>",
          "description": "See the Rich Text page to learn more about formatting"
         },
         "threadID": {
          "type": "string",
          "format": "uuid"
         },
         "parentCommentID": {
          "type": "string",
          "format": "uuid",
          "nullable": true,
          "description": "Heartbeat comments have two levels of nesting. If null is provided, then the comment will be a direct reply to the thread. If a comment id is provided, then the comment will be a reply to that comment. The provided comment id must be a comment that is a direct reply to the thread."
         },
         "userID": {
          "description": "The user that will be shown as the author of the comment. Only an admin user can be chosen. If this field is not provided, the user that created the API key will be used",
          "type": "string",
          "format": "uuid"
         },
         "createdAt": {
          "type": "string",
          "format": "date-time",
          "description": "Optional timestamp to override the default creation time for the comment. Must be in ISO 8601 format.",
          "example": "2023-10-15T14:30:00.000Z"
         }
        },
        "required": [
         "text",
         "threadID",
         "parentCommentID"
        ]
       }
      }
     }
    },
    "responses": {
     "200": {
      "description": "Successful response",
      "content": {
       "application/json": {
        "schema": {
         "$ref": "#/components/schemas/Comment"
        }
       }
      }
     },
     "400": {
      "$ref": "#/components/responses/ValidationError"
     },
     "401": {
      "$ref": "#/components/responses/UnauthorizedError"
     }
    }
   }
  },
  "/directChats": {
   "put": {
    "operationId": "createDirectChat",
    "description": "Create a new direct chat between two users. If one already exists, then nothing will be created and the existing chat id & URL will be returned.",
    "tags": [
     "messages"
    ],
    "parameters": [],
    "requestBody": {
     "required": true,
     "content": {
      "application/json": {
       "schema": {
        "type": "object",
        "properties": {
         "userID1": {
          "type": "string",
          "format": "uuid",
          "description": "One of the users in the direct chat",
          "example": "4f4fffdb-1e21-41ee-8569-2627bb7e80d2"
         },
         "userID2": {
          "type": "string",
          "format": "uuid",
          "description": "The other user in the direct chat",
          "example": "258d5dcb-cea3-44f4-95f7-3ebe291a7142"
         }
        },
        "required": [
         "userID1",
         "userID2"
        ]
       }
      }
     }
    },
    "responses": {
     "200": {
      "description": "Successful response",
      "content": {
       "application/json": {
        "schema": {
         "type": "object",
         "properties": {
          "chatID": {
           "type": "string",
           "format": "uuid",
           "example": "5dbcf5c9-5e7e-4285-9dab-6d3ce7f4dd2f"
          },
          "url": {
           "type": "string",
           "description": "A URL pointing to this direct chat",
           "example": "https://app.heartbeat.chat/mycommunity/c/5dbcf5c9-5e7e-4285-9dab-6d3ce7f4dd2f"
          }
         }
        }
       }
      }
     },
     "400": {
      "$ref": "#/components/responses/ValidationError"
     },
     "401": {
      "$ref": "#/components/responses/UnauthorizedError"
     },
     "404": {
      "description": "Could not find a user with a matching user id"
     }
    }
   }
  },
  "/directMessages": {
   "put": {
    "operationId": "createDirectMessage",
    "description": "Send a new direct message",
    "tags": [
     "messages"
    ],
    "parameters": [],
    "requestBody": {
     "required": true,
     "content": {
      "application/json": {
       "schema": {
        "type": "object",
        "properties": {
         "text": {
          "type": "string",
          "example": "<p>Hello!</p>",
          "description": "See the Rich Text page to learn more about formatting"
         },
         "to": {
          "type": "string",
          "format": "uuid",
          "description": "The user id of the receiver."
         },
         "from": {
          "description": "The user id of the sender. Only an admin user can be chosen. If this field is not provided, the user that created the API key will be used.",
          "type": "string",
          "format": "uuid"
         }
        },
        "required": [
         "text",
         "to"
        ]
       }
      }
     }
    },
    "responses": {
     "204": {
      "description": "Successful response"
     },
     "400": {
      "$ref": "#/components/responses/ValidationError"
     },
     "401": {
      "$ref": "#/components/responses/UnauthorizedError"
     },
     "404": {
      "description": "Could not find a user with a matching user id"
     }
    }
   }
  },
  "/events": {
   "put": {
    "operationId": "createEvent",
    "description": "Create a new Event in a Heartbeat community",
    "tags": [
     "events"
    ],
    "parameters": [],
    "requestBody": {
     "required": true,
     "content": {
      "application/json": {
       "schema": {
        "type": "object",
        "properties": {
         "name": {
          "type": "string",
          "example": "Community Onboarding"
         },
         "description": {
          "type": "string",
          "example": "A time for everyone to meet each other & understand what our community is all about"
         },
         "startTime": {
          "type": "string",
          "format": "date-time"
         },
         "duration": {
          "type": "number"
         },
         "location": {
          "description": "Where the event will be held. If the string 'HEARTBEAT' is provided, then the event will take place in a Heartbeat voice channel. If the string 'ZOOM' is provided, then the event will take place in a custom Zoom link (this option can only be chosen if a Zoom account has been integrated with Heartbeat). Otherwise, the provided string will be passed directly to the Custom location field.",
          "type": "string",
          "example": "ZOOM"
         },
         "invitedUsers": {
          "description": "A list of users that should be invited to the event. If the email matches an existing Heartbeat user, the Heartbeat user will be invited. Otherwise, an event invite will be sent directly to the provided email address. If both invitedUsers & invitedGroups are empty, the event will be open to everyone in the community.",
          "type": "array",
          "items": {
           "type": "string",
           "format": "email"
          }
         },
         "invitedGroups": {
          "description": "A list of groups that should be invited to the event. If both invitedUsers & invitedGroups are empty, the event will be open to everyone in the community.",
          "type": "array",
          "items": {
           "type": "string",
           "format": "uuid"
          }
         }
        },
        "required": [
         "name",
         "startTime",
         "duration",
         "location"
        ]
       }
      }
     }
    },
    "responses": {
     "200": {
      "description": "Successful response"
     },
     "400": {
      "$ref": "#/components/responses/ValidationError"
     },
     "401": {
      "$ref": "#/components/responses/UnauthorizedError"
     }
    }
   },
   "get": {
    "operationId": "getEvents",
    "description": "Return an array all Events within a Community",
    "tags": [
     "events"
    ],
    "parameters": [
     {
      "in": "query",
      "name": "groupID",
      "description": "If provided, only events that have been assigned to this group will be returned",
      "schema": {
       "type": "string",
       "format": "uuid"
      }
     }
    ],
    "responses": {
     "200": {
      "description": "Successful response",
      "content": {
       "application/json": {
        "schema": {
         "type": "array",
         "items": {
          "$ref": "#/components/schemas/Event"
         }
        }
       }
      }
     },
     "401": {
      "$ref": "#/components/responses/UnauthorizedError"
     },
     "404": {
      "description": "Could not find requested group id"
     }
    }
   }
  },
  "/groups": {
   "put": {
    "operationId": "createGroup",
    "description": "Create a new Group in a Heartbeat community",
    "tags": [
     "groups"
    ],
    "parameters": [],
    "requestBody": {
     "required": true,
     "content": {
      "application/json": {
       "schema": {
        "type": "object",
        "properties": {
         "name": {
          "type": "string",
          "example": "Cohort 1"
         },
         "description": {
          "type": "string"
         },
         "members": {
          "description": "The email addresses of the users that should be added to the group",
          "type": "array",
          "items": {
           "type": "string",
           "format": "email"
          }
         },
         "parentGroupID": {
          "description": "The id of the parent group",
          "type": "string",
          "format": "uuid"
         },
         "isIsolated": {
          "description": "Whether the group is isolated. Refer to Heartbeat docs to learn more about what this entails",
          "type": "boolean"
         },
         "isJoinable": {
          "description": "Whether the group is joinable. Refer to Heartbeat docs to learn more about what this entails",
          "type": "boolean"
         }
        },
        "required": [
         "name"
        ]
       }
      }
     }
    },
    "responses": {
     "200": {
      "description": "Successful response"
     },
     "400": {
      "$ref": "#/components/responses/ValidationError"
     },
     "401": {
      "$ref": "#/components/responses/UnauthorizedError"
     }
    }
   },
   "get": {
    "operationId": "getGroups",
    "description": "Returns an array of all Groups within a Heartbeat community",
    "tags": [
     "groups"
    ],
    "parameters": [],
    "responses": {
     "200": {
      "description": "Successful response",
      "content": {
       "application/json": {
        "schema": {
         "type": "array",
         "items": {
          "$ref": "#/components/schemas/Group"
         }
        }
       }
      }
     },
     "401": {
      "$ref": "#/components/responses/UnauthorizedError"
     }
    }
   }
  },
  "/invitations": {
   "put": {
    "operationId": "createInvitation",
    "description": "Create a new invitation link within a Heartbeat community",
    "tags": [
     "invitations"
    ],
    "parameters": [],
    "requestBody": {
     "required": true,
     "content": {
      "application/json": {
       "schema": {
        "type": "object",
        "properties": {
         "roleID": {
          "description": "Members joining via this invitation link will join as this role",
          "type": "string",
          "format": "uuid"
         },
         "groupIDs": {
          "description": "Members joining via this invitation link will automatically be in these groups",
          "type": "array",
          "items": {
           "type": "string",
           "format": "uuid"
          }
         }
        },
        "required": [
         "roleID",
         "groupIDs"
        ]
       }
      }
     }
    },
    "responses": {
     "200": {
      "description": "Successful response",
      "content": {
       "application/json": {
        "schema": {
         "$ref": "#/components/schemas/Invitation"
        }
       }
      }
     },
     "401": {
      "$ref": "#/components/responses/UnauthorizedError"
     }
    }
   },
   "get": {
    "operationId": "getInvitations",
    "description": "Return an array of all the invitations within a Heartbeat community",
    "tags": [
     "invitations"
    ],
    "parameters": [],
    "responses": {
     "200": {
      "description": "Successful response",
      "content": {
       "application/json": {
        "schema": {
         "type": "array",
         "items": {
          "$ref": "#/components/schemas/Invitation"
         }
        }
       }
      }
     },
     "401": {
      "$ref": "#/components/responses/UnauthorizedError"
     }
    }
   }
  },
  "/lessons": {
   "put": {
    "operationId": "createLesson",
    "description": "Create a new lesson",
    "tags": [
     "courses"
    ],
    "parameters": [],
    "requestBody": {
     "required": true,
     "content": {
      "application/json": {
       "schema": {
        "type": "object",
        "properties": {
         "courseID": {
          "type": "string",
          "format": "uuid",
          "description": "The course where the lesson should be created"
         },
         "cohortID": {
          "type": "string",
          "format": "uuid",
          "description": "The cohort where the lesson should be created"
         },
         "moduleID": {
          "type": "string",
          "format": "uuid",
          "description": "The module where the lesson should be created"
         },
         "title": {
          "type": "string",
          "minLength": 1,
          "description": "The title of the lesson"
         },
         "content": {
          "type": "string",
          "description": "The content of the lesson (in Markdown)"
         },
         "hero": {
          "type": "object",
          "nullable": true,
          "properties": {
           "type": {
            "type": "string",
            "enum": [
             "VIDEO"
            ]
           },
           "content": {
            "oneOf": [
             {
              "type": "object",
              "properties": {
               "type": {
                "type": "string",
                "enum": [
                 "NATIVE_VIDEO"
                ]
               },
               "videoID": {
                "type": "string",
                "format": "uuid",
                "description": "The id of the Heartbeat video that should be displayed in the hero section"
               }
              }
             },
             {
              "type": "object",
              "properties": {
               "type": {
                "type": "string",
                "enum": [
                 "EXTERNAL_VIDEO_EMBED"
                ]
               },
               "url": {
                "type": "string",
                "format": "uri",
                "description": "The URL of an external video to display in the hero section. Youtube, Vimeo & Loom links are supported."
               }
              }
             }
            ]
           }
          }
         },
         "publishStatus": {
          "oneOf": [
           {
            "type": "object",
            "properties": {
             "type": {
              "type": "string",
              "enum": [
               "DRAFT"
              ]
             }
            }
           },
           {
            "type": "object",
            "properties": {
             "type": {
              "type": "string",
              "enum": [
               "PUBLISH"
              ]
             }
            }
           },
           {
            "type": "object",
            "properties": {
             "type": {
              "type": "string",
              "enum": [
               "DRIP"
              ]
             },
             "numDays": {
              "type": "integer",
              "description": "The lesson will become available to users this many days after they start the course"
             }
            }
           },
           {
            "type": "object",
            "properties": {
             "type": {
              "type": "string",
              "enum": [
               "SCHEDULE_PUBLISH"
              ]
             },
             "date": {
              "type": "string",
              "format": "date-time"
             }
            }
           },
           {
            "type": "object",
            "properties": {
             "type": {
              "type": "string",
              "enum": [
               "SET_AS_FREE"
              ]
             }
            }
           }
          ]
         },
         "communityEmbedCards": {
          "type": "array",
          "items": {
           "type": "object",
           "required": [
            "title",
            "description",
            "content"
           ],
           "properties": {
            "title": {
             "type": "string"
            },
            "description": {
             "type": "string"
            },
            "content": {
             "$ref": "#/components/schemas/CommunityEmbedCardContent"
            }
           }
          }
         }
        },
        "required": [
         "courseID",
         "cohortID",
         "moduleID",
         "title",
         "content",
         "hero",
         "publishStatus",
         "communityEmbedCards"
        ]
       }
      }
     }
    },
    "responses": {
     "200": {
      "description": "Successful response",
      "content": {
       "application/json": {
        "schema": {
         "$ref": "#/components/schemas/Lesson"
        }
       }
      }
     },
     "400": {
      "$ref": "#/components/responses/ValidationError"
     },
     "401": {
      "$ref": "#/components/responses/UnauthorizedError"
     }
    }
   }
  },
  "/pendingUser": {
   "put": {
    "operationId": "createPendingUser",
    "description": "Create a new pending user in a Heartbeat community. A pending user does not yet existing within the community. However, the first time they attempt to log in, they will be created as a user within the community. If this is called for a pending user that already exists, it will update the pending user. If this is called for a user that already exists within the community, it will return an error.",
    "tags": [
     "users"
    ],
    "parameters": [],
    "requestBody": {
     "required": true,
     "content": {
      "application/json": {
       "schema": {
        "type": "object",
        "properties": {
         "email": {
          "description": "The user's email. Must be unique to the community",
          "type": "string",
          "format": "email",
          "example": "dmoney@scrutefarms.com"
         },
         "name": {
          "description": "The user's full name",
          "type": "string",
          "example": "Dwight Schrute"
         },
         "roleID": {
          "description": "The id of the role the user should have",
          "type": "string",
          "format": "uuid"
         },
         "groupIDs": {
          "description": "A list of the ids of the groups that the user should belong to",
          "type": "array",
          "items": {
           "type": "string",
           "format": "uuid"
          }
         },
         "profilePicture": {
          "description": "A Data URI scheme in the JPG, GIF, or PNG format. Ensure you use the proper content type (image/jpeg, image/png, image/gif) that matches the image data being provided",
          "type": "string",
          "example": "data:image/jpeg;base64,BASE64_ENCODED_JPEG_IMAGE_DATA"
         },
         "bio": {
          "description": "The user's bio",
          "type": "string",
          "example": "I'm the best salesman at Dunder Mifflin"
         }
        },
        "required": [
         "email",
         "name",
         "roleID"
        ]
       }
      }
     }
    },
    "responses": {
     "200": {
      "description": "Successful response",
      "content": {
       "application/json": {
        "schema": {
         "type": "object",
         "properties": {
          "success": {
           "type": "boolean",
           "example": true
          }
         }
        }
       }
      }
     },
     "400": {
      "$ref": "#/components/responses/ValidationError"
     },
     "401": {
      "$ref": "#/components/responses/UnauthorizedError"
     }
    }
   }
  },
  "/threads": {
   "put": {
    "operationId": "createThread",
    "description": "Create a new thread",
    "tags": [
     "channels"
    ],
    "parameters": [],
    "requestBody": {
     "required": true,
     "content": {
      "application/json": {
       "schema": {
        "type": "object",
        "properties": {
         "text": {
          "type": "string",
          "example": "<p>Welcome everyone!</p>",
          "description": "See the Rich Text page to learn more about formatting"
         },
         "channelID": {
          "type": "string",
          "format": "uuid"
         },
         "userID": {
          "description": "The user that will be shown as the author of the thread. Only an admin user can be chosen. If this field is not provided, the user that created the API key will be used",
          "type": "string",
          "format": "uuid"
         },
         "embeds": {
          "type": "array",
          "description": "An array of HTML embed codes to include in the thread. Useful for embedding media players (e.g., podcast episodes), videos, or other external content. Each embed must contain an iframe element.",
          "items": {
           "type": "string"
          },
          "example": [
           "<iframe src=\"https://open.spotify.com/embed/episode/...\" width=\"100%\" height=\"232\" frameBorder=\"0\"></iframe>"
          ]
         },
         "createdAt": {
          "type": "string",
          "format": "date-time",
          "description": "Optional timestamp to override the default creation time for the thread. Must be in ISO 8601 format.",
          "example": "2023-10-15T14:30:00.000Z"
         }
        },
        "required": [
         "text",
         "channelID"
        ]
       }
      }
     }
    },
    "responses": {
     "200": {
      "description": "Successful response",
      "content": {
       "application/json": {
        "schema": {
         "$ref": "#/components/schemas/Thread"
        }
       }
      }
     },
     "400": {
      "$ref": "#/components/responses/ValidationError"
     },
     "401": {
      "$ref": "#/components/responses/UnauthorizedError"
     }
    }
   }
  },
  "/users": {
   "put": {
    "operationId": "createUser",
    "description": "Create a new user in a Heartbeat community",
    "tags": [
     "users"
    ],
    "parameters": [],
    "requestBody": {
     "required": true,
     "content": {
      "application/json": {
       "schema": {
        "type": "object",
        "properties": {
         "email": {
          "description": "The user's email. Must be unique to the community",
          "type": "string",
          "format": "email",
          "example": "dmoney@scrutefarms.com"
         },
         "name": {
          "description": "The user's full name",
          "type": "string",
          "example": "Dwight Schrute"
         },
         "roleID": {
          "description": "The id of the role the user should have",
          "type": "string",
          "format": "uuid"
         },
         "groupIDs": {
          "description": "A list of the ids of the groups that the user should belong to",
          "type": "array",
          "items": {
           "type": "string",
           "format": "uuid"
          }
         },
         "profilePicture": {
          "description": "A Data URI scheme in the JPG, GIF, or PNG format. Ensure you use the proper content type (image/jpeg, image/png, image/gif) that matches the image data being provided",
          "type": "string",
          "example": "data:image/jpeg;base64,BASE64_ENCODED_JPEG_IMAGE_DATA"
         },
         "bio": {
          "description": "The user's bio",
          "type": "string",
          "example": "I'm the best salesman at Dunder Mifflin"
         },
         "status": {
          "description": "The user's status",
          "type": "string",
          "example": "Trying to get promoted to Assistant Regional Manager"
         },
         "linkedin": {
          "description": "A link to the user's LinkedIn profile",
          "type": "string",
          "example": "https://www.linkedin.com/in/dwight-schrute/"
         },
         "twitter": {
          "description": "A link to the user's Twitter profile",
          "type": "string",
          "example": "https://twitter.com/dwight_schrute"
         },
         "instagram": {
          "description": "A link to the user's Instagram profile",
          "type": "string",
          "example": "https://www.instagram.com/dwightschrute/"
         },
         "website": {
          "description": "A link to the user's website",
          "type": "string",
          "example": "https://www.schrutefarms.com"
         },
         "createIntroductionThread": {
          "description": "If true and a value for bio is provided, an introduction thread for the user will be created in the channel designated for introductions in your community settings. The introduction thread will include the user's bio",
          "type": "boolean"
         }
        },
        "required": [
         "email",
         "name",
         "roleID"
        ]
       }
      }
     }
    },
    "responses": {
     "200": {
      "description": "Successful response"
     },
     "400": {
      "$ref": "#/components/responses/ValidationError"
     },
     "401": {
      "$ref": "#/components/responses/UnauthorizedError"
     }
    }
   },
   "delete": {
    "operationId": "deleteUser",
    "description": "Remove a user from a Heartbeat community. The user will no longer be able to access the community. Threads, comments & messages from the user will not be removed",
    "tags": [
     "users"
    ],
    "parameters": [],
    "requestBody": {
     "required": true,
     "content": {
      "application/json": {
       "schema": {
        "type": "object",
        "properties": {
         "email": {
          "description": "The email of the user to be deleted. If no user with the provided email exists, will return a 404 response.",
          "type": "string",
          "format": "email",
          "example": "dmoney@scrutefarms.com"
         }
        },
        "required": [
         "email"
        ]
       }
      }
     }
    },
    "responses": {
     "200": {
      "description": "Successful response"
     },
     "400": {
      "$ref": "#/components/responses/ValidationError"
     },
     "401": {
      "$ref": "#/components/responses/UnauthorizedError"
     },
     "404": {
      "description": "Could not find a user with the provided email address"
     }
    }
   },
   "get": {
    "operationId": "getUsers",
    "description": "Return an array of all users within a Heartbeat community",
    "tags": [
     "users"
    ],
    "parameters": [],
    "responses": {
     "200": {
      "description": "Successful response",
      "content": {
       "application/json": {
        "schema": {
         "type": "array",
         "items": {
          "$ref": "#/components/schemas/User"
         }
        }
       }
      }
     },
     "401": {
      "$ref": "#/components/responses/UnauthorizedError"
     }
    }
   },
   "post": {
    "operationId": "updateUser",
    "description": "Update a user's profile information",
    "tags": [
     "users"
    ],
    "parameters": [],
    "requestBody": {
     "required": true,
     "content": {
      "application/json": {
       "schema": {
        "type": "object",
        "properties": {
         "email": {
          "description": "The email of the user that will be updated. If no user with the provided email exists, will return a 404 response.",
          "type": "string",
          "format": "email",
          "example": "dmoney@scrutefarms.com"
         },
         "name": {
          "description": "The user's full name",
          "type": "string",
          "example": "Dwight Schrute"
         },
         "profilePicture": {
          "description": "A Data URI scheme in the JPG, GIF, or PNG format. Ensure you use the proper content type (image/jpeg, image/png, image/gif) that matches the image data being provided",
          "type": "string",
          "example": "data:image/jpeg;base64,BASE64_ENCODED_JPEG_IMAGE_DATA"
         },
         "bio": {
          "description": "The user's bio",
          "type": "string",
          "example": "I'm the best salesman at Dunder Mifflin"
         },
         "status": {
          "description": "The user's status",
          "type": "string",
          "example": "Trying to get promoted to Assistant Regional Manager"
         },
         "linkedin": {
          "description": "A link to the user's LinkedIn profile",
          "type": "string",
          "example": "https://www.linkedin.com/in/dwight-schrute/"
         },
         "twitter": {
          "description": "A link to the user's Twitter profile",
          "type": "string",
          "example": "https://twitter.com/dwight_schrute"
         },
         "instagram": {
          "description": "A link to the user's Instagram profile",
          "type": "string",
          "example": "https://www.instagram.com/dwightschrute/"
         },
         "completedLessons": {
          "description": "Lessons included here will be added to the user's list of completed lessons. This field will never cause a lesson to be removed from the user's list of completed lessons.",
          "type": "array",
          "items": {
           "type": "object",
           "properties": {
            "lessonID": {
             "type": "string",
             "format": "uuid"
            },
            "timestamp": {
             "type": "string",
             "format": "date-time"
            }
           }
          }
         }
        },
        "required": [
         "email"
        ]
       }
      }
     }
    },
    "responses": {
     "200": {
      "description": "Successful response"
     },
     "400": {
      "$ref": "#/components/responses/ValidationError"
     },
     "401": {
      "$ref": "#/components/responses/UnauthorizedError"
     },
     "404": {
      "description": "Could not find a user with the provided email address"
     }
    }
   }
  },
  "/voiceChannels": {
   "put": {
    "operationId": "createVoiceChannel",
    "description": "Create a new voice channel in a Heartbeat community",
    "tags": [
     "voice"
    ],
    "parameters": [],
    "requestBody": {
     "required": true,
     "content": {
      "application/json": {
       "schema": {
        "type": "object",
        "properties": {
         "name": {
          "type": "string",
          "example": "random"
         },
         "description": {
          "type": "string",
          "example": "A place to discuss anything you want"
         },
         "isPrivate": {
          "type": "boolean"
         },
         "channelCategoryID": {
          "type": "string",
          "format": "uuid",
          "description": "The id for the category where the channel should be created"
         },
         "invitedUsers": {
          "description": "A list of emails corresponding to the users that can access this channel. If the channel is private, only these users will be able to access the voice channel. If both invitedUsers & invitedGroups are provided, the lists will be combined.",
          "type": "array",
          "items": {
           "type": "string",
           "format": "email"
          }
         },
         "invitedGroups": {
          "description": "If the voice channel is private, only these groups will be able to access the channel. If both invitedUsers & invitedGroups are provided, the lists will be combined.",
          "type": "array",
          "items": {
           "type": "string",
           "format": "uuid"
          }
         }
        },
        "required": [
         "name",
         "channelCategoryID"
        ]
       }
      }
     }
    },
    "responses": {
     "200": {
      "description": "Successful response"
     },
     "400": {
      "$ref": "#/components/responses/ValidationError"
     },
     "401": {
      "$ref": "#/components/responses/UnauthorizedError"
     }
    }
   }
  },
  "/webhooks": {
   "put": {
    "operationId": "createWebhook",
    "description": "Create a new webhook",
    "tags": [
     "webhooks"
    ],
    "parameters": [],
    "requestBody": {
     "required": true,
     "content": {
      "application/json": {
       "schema": {
        "type": "object",
        "properties": {
         "action": {
          "$ref": "#/components/schemas/WebhookAction"
         },
         "url": {
          "description": "The URL where webhook events will be sent to",
          "type": "string",
          "format": "uri"
         }
        },
        "required": [
         "action",
         "url"
        ]
       }
      }
     }
    },
    "responses": {
     "200": {
      "description": "Successful response",
      "content": {
       "application/json": {
        "schema": {
         "type": "object",
         "properties": {
          "id": {
           "description": "The id of the webhook that was just created",
           "type": "string",
           "format": "uuid"
          }
         }
        }
       }
      }
     },
     "401": {
      "$ref": "#/components/responses/UnauthorizedError"
     }
    }
   },
   "get": {
    "operationId": "getWebhooks",
    "description": "Get a list of all of your webhooks",
    "tags": [
     "webhooks"
    ],
    "parameters": [],
    "responses": {
     "200": {
      "description": "Successful response",
      "content": {
       "application/json": {
        "schema": {
         "type": "array",
         "items": {
          "$ref": "#/components/schemas/Webhook"
         }
        }
       }
      }
     },
     "401": {
      "$ref": "#/components/responses/UnauthorizedError"
     }
    }
   }
  },
  "/channels/{channelID}": {
   "delete": {
    "operationId": "deleteChannel",
    "description": "Delete a channel.",
    "tags": [
     "channels"
    ],
    "parameters": [
     {
      "in": "path",
      "name": "channelID",
      "required": true,
      "schema": {
       "type": "string",
       "format": "uuid"
      }
     }
    ],
    "responses": {
     "200": {
      "description": "Successful response"
     },
     "400": {
      "$ref": "#/components/responses/ValidationError"
     },
     "401": {
      "$ref": "#/components/responses/UnauthorizedError"
     }
    }
   },
   "post": {
    "operationId": "updateChannel",
    "description": "Edit a channel. All fields are optional, only fields that are provided will be changed.",
    "tags": [
     "channels"
    ],
    "parameters": [
     {
      "in": "path",
      "name": "channelID",
      "required": true,
      "schema": {
       "type": "string",
       "format": "uuid"
      }
     }
    ],
    "requestBody": {
     "required": true,
     "content": {
      "application/json": {
       "schema": {
        "type": "object",
        "properties": {
         "name": {
          "type": "string",
          "example": "random"
         },
         "description": {
          "type": "string",
          "example": "A place to discuss anything you want"
         },
         "restrictedTo": {
          "description": "An object describing who can access this channel. If set to null, then the channel will be public.",
          "nullable": true,
          "type": "object",
          "properties": {
           "invitedUsers": {
            "description": "A list of emails corresponding to the users that can access this channel. If the channel is private, only these users will be able to access the channel. If both invitedUsers & invitedGroups are provided, the lists will be combined.",
            "type": "array",
            "items": {
             "type": "string",
             "format": "email"
            }
           },
           "invitedGroups": {
            "description": "If the channel is private, only these groups will be able to access the channel. If both invitedUsers & invitedGroups are provided, the lists will be combined.",
            "type": "array",
            "items": {
             "type": "string",
             "format": "uuid"
            }
           }
          }
         },
         "isReadOnly": {
          "type": "boolean",
          "description": "If true, only admins & moderators will be able to create threads in this channel. This option is not currently available for chat channels"
         }
        }
       }
      }
     }
    },
    "responses": {
     "200": {
      "description": "Successful response"
     },
     "400": {
      "$ref": "#/components/responses/ValidationError"
     },
     "401": {
      "$ref": "#/components/responses/UnauthorizedError"
     }
    }
   }
  },
  "/channelCategories/{channelCategoryID}": {
   "delete": {
    "operationId": "deleteChannelCategory",
    "description": "Delete an existing channel category in a Heartbeat community",
    "tags": [
     "channels"
    ],
    "parameters": [
     {
      "in": "path",
      "name": "channelCategoryID",
      "required": true,
      "schema": {
       "type": "string",
       "format": "uuid"
      }
     }
    ],
    "responses": {
     "200": {
      "description": "Successful response"
     },
     "400": {
      "$ref": "#/components/responses/ValidationError"
     },
     "401": {
      "$ref": "#/components/responses/UnauthorizedError"
     }
    }
   },
   "post": {
    "operationId": "updateChannelCategory",
    "description": "Edit an existing channel category in a Heartbeat community",
    "tags": [
     "channels"
    ],
    "parameters": [
     {
      "in": "path",
      "name": "channelCategoryID",
      "required": true,
      "schema": {
       "type": "string",
       "format": "uuid"
      }
     }
    ],
    "requestBody": {
     "required": true,
     "content": {
      "application/json": {
       "schema": {
        "type": "object",
        "properties": {
         "name": {
          "type": "string",
          "example": "Cohort 2"
         }
        },
        "required": [
         "name"
        ]
       }
      }
     }
    },
    "responses": {
     "200": {
      "description": "Successful response"
     },
     "400": {
      "$ref": "#/components/responses/ValidationError"
     },
     "401": {
      "$ref": "#/components/responses/UnauthorizedError"
     }
    }
   }
  },
  "/groups/{groupID}": {
   "delete": {
    "operationId": "deleteGroup",
    "description": "Delete a group",
    "tags": [
     "groups"
    ],
    "parameters": [
     {
      "in": "path",
      "name": "groupID",
      "required": true,
      "schema": {
       "type": "string",
       "format": "uuid"
      }
     }
    ],
    "responses": {
     "200": {
      "description": "Successful response"
     },
     "400": {
      "description": "The group cannot be deleted. A reason will be provided"
     },
     "401": {
      "$ref": "#/components/responses/UnauthorizedError"
     },
     "404": {
      "description": "Could not find requested group id"
     }
    }
   },
   "get": {
    "operationId": "getGroup",
    "description": "Get a group",
    "tags": [
     "groups"
    ],
    "parameters": [
     {
      "in": "path",
      "name": "groupID",
      "required": true,
      "schema": {
       "type": "string",
       "format": "uuid"
      }
     }
    ],
    "responses": {
     "200": {
      "description": "Successful response",
      "content": {
       "application/json": {
        "schema": {
         "$ref": "#/components/schemas/Group"
        }
       }
      }
     },
     "401": {
      "$ref": "#/components/responses/UnauthorizedError"
     },
     "404": {
      "description": "Could not find requested group id"
     }
    }
   },
   "post": {
    "operationId": "updateGroup",
    "description": "Edit a group. All fields are optional, only fields that are provided will be changed.",
    "tags": [
     "groups"
    ],
    "parameters": [
     {
      "in": "path",
      "name": "groupID",
      "required": true,
      "description": "The id of the group",
      "schema": {
       "type": "string",
       "format": "uuid"
      }
     }
    ],
    "requestBody": {
     "required": true,
     "content": {
      "application/json": {
       "schema": {
        "type": "object",
        "properties": {
         "name": {
          "type": "string",
          "example": "Cohort 1"
         },
         "description": {
          "type": "string"
         },
         "isIsolated": {
          "description": "Whether the group is isolated. Refer to Heartbeat docs to learn more about what this entails",
          "type": "boolean"
         },
         "isJoinable": {
          "description": "Whether the group is joinable. Refer to Heartbeat docs to learn more about what this entails",
          "type": "boolean"
         }
        }
       }
      }
     }
    },
    "responses": {
     "200": {
      "description": "Successful response"
     },
     "401": {
      "$ref": "#/components/responses/UnauthorizedError"
     }
    }
   }
  },
  "/webhooks/{webhookID}": {
   "delete": {
    "operationId": "deleteWebhook",
    "description": "Delete a webhook",
    "tags": [
     "webhooks"
    ],
    "parameters": [
     {
      "in": "path",
      "name": "webhookID",
      "required": true,
      "schema": {
       "type": "string",
       "format": "uuid"
      }
     }
    ],
    "responses": {
     "200": {
      "description": "Successful response"
     },
     "401": {
      "$ref": "#/components/responses/UnauthorizedError"
     }
    }
   }
  },
  "/find/users": {
   "get": {
    "operationId": "findUser",
    "description": "Get a user by email",
    "tags": [
     "users"
    ],
    "parameters": [
     {
      "in": "query",
      "name": "email",
      "required": true,
      "description": "The email of the user",
      "schema": {
       "type": "string",
       "format": "email"
      }
     }
    ],
    "responses": {
     "200": {
      "description": "Successful response",
      "content": {
       "application/json": {
        "schema": {
         "type": "array",
         "items": {
          "$ref": "#/components/schemas/User"
         }
        }
       }
      }
     },
     "401": {
      "$ref": "#/components/responses/UnauthorizedError"
     },
     "404": {
      "description": "Could not find a user with a matching email"
     }
    }
   }
  },
  "/chatChannel/{channelID}/messages": {
   "get": {
    "operationId": "getChatChannelMessages",
    "description": "Get chat messages from a chat channel. Results are paginated using cursor-based pagination.",
    "tags": [
     "messages"
    ],
    "parameters": [
     {
      "in": "path",
      "name": "channelID",
      "required": true,
      "schema": {
       "type": "string",
       "format": "uuid"
      }
     },
     {
      "in": "query",
      "name": "startingAfter",
      "description": "Cursor for pagination - return results after this chat message ID",
      "schema": {
       "type": "string",
       "format": "uuid"
      }
     },
     {
      "in": "query",
      "name": "limit",
      "description": "Number of results to return (1-100)",
      "schema": {
       "type": "integer",
       "minimum": 1,
       "maximum": 100,
       "default": 50
      }
     }
    ],
    "responses": {
     "200": {
      "description": "Successful response",
      "content": {
       "application/json": {
        "schema": {
         "$ref": "#/components/schemas/ChatMessagesPage"
        }
       }
      }
     },
     "400": {
      "$ref": "#/components/responses/ValidationError"
     },
     "401": {
      "$ref": "#/components/responses/UnauthorizedError"
     },
     "404": {
      "description": "Could not find requested chat channel or startingAfter message"
     }
    }
   }
  },
  "/courses": {
   "get": {
    "operationId": "getCourses",
    "description": "Get all of the courses in your community",
    "tags": [
     "courses"
    ],
    "responses": {
     "200": {
      "description": "Successful response",
      "content": {
       "application/json": {
        "schema": {
         "type": "array",
         "items": {
          "$ref": "#/components/schemas/Course"
         }
        }
       }
      }
     },
     "401": {
      "$ref": "#/components/responses/UnauthorizedError"
     }
    }
   }
  },
  "/directMessages/{chatID}": {
   "get": {
    "operationId": "getDirectMessages",
    "description": "Get the 100 most recent chat messages from a direct message conversation. Only direct messages that include at least one admin user can be accessed via the API.",
    "tags": [
     "messages"
    ],
    "parameters": [
     {
      "in": "path",
      "name": "chatID",
      "required": true,
      "schema": {
       "type": "string",
       "format": "uuid"
      }
     }
    ],
    "responses": {
     "200": {
      "description": "Successful response",
      "content": {
       "application/json": {
        "schema": {
         "type": "array",
         "items": {
          "$ref": "#/components/schemas/ChatMessage"
         }
        }
       }
      }
     },
     "401": {
      "$ref": "#/components/responses/UnauthorizedError"
     },
     "404": {
      "description": "Could not find requested direct message"
     }
    }
   }
  },
  "/documents/{documentID}": {
   "get": {
    "operationId": "getDocument",
    "description": "Get a document by ID, including its content",
    "tags": [
     "documents"
    ],
    "parameters": [
     {
      "in": "path",
      "name": "documentID",
      "required": true,
      "schema": {
       "type": "string",
       "format": "uuid"
      }
     }
    ],
    "responses": {
     "200": {
      "description": "Successful response",
      "content": {
       "application/json": {
        "schema": {
         "$ref": "#/components/schemas/Document"
        }
       }
      }
     },
     "401": {
      "$ref": "#/components/responses/UnauthorizedError"
     },
     "404": {
      "description": "Could not find requested document"
     }
    }
   }
  },
  "/documents": {
   "get": {
    "operationId": "getDocuments",
    "description": "Return an array of all documents (wiki posts) within a Heartbeat community. Results are paginated using cursor-based pagination.",
    "tags": [
     "documents"
    ],
    "parameters": [
     {
      "in": "query",
      "name": "startingAfter",
      "description": "Cursor for pagination - return results after this document ID",
      "schema": {
       "type": "string",
       "format": "uuid"
      }
     },
     {
      "in": "query",
      "name": "limit",
      "description": "Number of results to return (1-100)",
      "schema": {
       "type": "integer",
       "minimum": 1,
       "maximum": 100,
       "default": 50
      }
     }
    ],
    "responses": {
     "200": {
      "description": "Successful response",
      "content": {
       "application/json": {
        "schema": {
         "type": "array",
         "items": {
          "$ref": "#/components/schemas/DocumentList"
         }
        }
       }
      }
     },
     "401": {
      "$ref": "#/components/responses/UnauthorizedError"
     }
    }
   }
  },
  "/events/{eventID}": {
   "get": {
    "operationId": "getEvent",
    "description": "Get an event",
    "tags": [
     "events"
    ],
    "parameters": [
     {
      "in": "path",
      "name": "eventID",
      "required": true,
      "schema": {
       "type": "string",
       "format": "uuid"
      }
     }
    ],
    "responses": {
     "200": {
      "description": "Successful response",
      "content": {
       "application/json": {
        "schema": {
         "$ref": "#/components/schemas/Event"
        }
       }
      }
     },
     "401": {
      "$ref": "#/components/responses/UnauthorizedError"
     },
     "404": {
      "description": "Could not find requested event id"
     }
    }
   }
  },
  "/events/{eventID}/attendance": {
   "get": {
    "operationId": "getEventAttendance",
    "description": "Returns attendance data for the last 10 instances of the specified event. If this event is a non-recurring event, an array of size 1 will be returned with attendance data.",
    "tags": [
     "events"
    ],
    "parameters": [
     {
      "in": "path",
      "name": "eventID",
      "required": true,
      "schema": {
       "type": "string",
       "format": "uuid"
      }
     }
    ],
    "responses": {
     "200": {
      "description": "Successful response",
      "content": {
       "application/json": {
        "schema": {
         "type": "array",
         "items": {
          "type": "object",
          "properties": {
           "startTime": {
            "type": "string",
            "format": "date-time"
           },
           "endTime": {
            "type": "string",
            "format": "date-time"
           },
           "attendees": {
            "type": "object",
            "required": [
             "isUser",
             "name"
            ],
            "properties": {
             "id": {
              "type": "string",
              "format": "uuid",
              "description": "If this attendee was matched to a Heartbeat user, their user id will be populated here."
             },
             "email": {
              "type": "string",
              "format": "email"
             },
             "name": {
              "type": "string"
             },
             "isUser": {
              "type": "boolean",
              "description": "Whether or not this attendee was matched to a Heartbeat user."
             }
            }
           }
          }
         }
        }
       }
      }
     },
     "401": {
      "$ref": "#/components/responses/UnauthorizedError"
     },
     "404": {
      "description": "Could not find event ID"
     }
    }
   }
  },
  "/events/{eventID}/instances": {
   "get": {
    "operationId": "getEventInstances",
    "description": "Return all the event instances of a recurring Event",
    "tags": [
     "events"
    ],
    "parameters": [
     {
      "in": "path",
      "name": "eventID",
      "required": true,
      "schema": {
       "type": "string",
       "format": "uuid"
      }
     }
    ],
    "responses": {
     "200": {
      "description": "Successful response",
      "content": {
       "application/json": {
        "schema": {
         "type": "array",
         "items": {
          "type": "object",
          "properties": {
           "startTime": {
            "type": "string",
            "format": "date-time"
           },
           "endTime": {
            "type": "string",
            "format": "date-time"
           }
          }
         }
        }
       }
      }
     },
     "401": {
      "$ref": "#/components/responses/UnauthorizedError"
     },
     "404": {
      "description": "Could not find event id"
     }
    }
   }
  },
  "/lessons/{lessonID}": {
   "get": {
    "operationId": "getLesson",
    "description": "Get a lesson by id",
    "tags": [
     "courses"
    ],
    "parameters": [
     {
      "in": "path",
      "name": "lessonID",
      "required": true,
      "schema": {
       "type": "string",
       "format": "uuid"
      }
     }
    ],
    "responses": {
     "200": {
      "description": "Successful response",
      "content": {
       "application/json": {
        "schema": {
         "$ref": "#/components/schemas/Lesson"
        }
       }
      }
     },
     "401": {
      "$ref": "#/components/responses/UnauthorizedError"
     },
     "404": {
      "description": "Could not find the specified lesson"
     }
    }
   },
   "post": {
    "operationId": "updateLesson",
    "description": "Update a lesson",
    "tags": [
     "courses"
    ],
    "parameters": [
     {
      "in": "path",
      "name": "lessonID",
      "required": true,
      "schema": {
       "type": "string",
       "format": "uuid"
      }
     }
    ],
    "requestBody": {
     "required": true,
     "content": {
      "application/json": {
       "schema": {
        "type": "object",
        "properties": {
         "title": {
          "type": "string",
          "minLength": 1,
          "description": "The title of the lesson"
         },
         "content": {
          "type": "string",
          "description": "The content of the lesson (in Markdown)"
         },
         "hero": {
          "type": "object",
          "nullable": true,
          "properties": {
           "type": {
            "type": "string",
            "enum": [
             "VIDEO"
            ]
           },
           "content": {
            "oneOf": [
             {
              "type": "object",
              "properties": {
               "type": {
                "type": "string",
                "enum": [
                 "NATIVE_VIDEO"
                ]
               },
               "videoID": {
                "type": "string",
                "format": "uuid",
                "description": "The id of the Heartbeat video that should be displayed in the hero section"
               }
              }
             },
             {
              "type": "object",
              "properties": {
               "type": {
                "type": "string",
                "enum": [
                 "EXTERNAL_VIDEO_EMBED"
                ]
               },
               "url": {
                "type": "string",
                "format": "uri",
                "description": "The URL of an external video to display in the hero section. Youtube, Vimeo & Loom links are supported."
               }
              }
             }
            ]
           }
          }
         },
         "publishStatus": {
          "oneOf": [
           {
            "type": "object",
            "properties": {
             "type": {
              "type": "string",
              "enum": [
               "DRAFT"
              ]
             }
            }
           },
           {
            "type": "object",
            "properties": {
             "type": {
              "type": "string",
              "enum": [
               "PUBLISH"
              ]
             }
            }
           },
           {
            "type": "object",
            "properties": {
             "type": {
              "type": "string",
              "enum": [
               "DRIP"
              ]
             },
             "numDays": {
              "type": "integer",
              "description": "The lesson will become available to users this many days after they start the course"
             }
            }
           },
           {
            "type": "object",
            "properties": {
             "type": {
              "type": "string",
              "enum": [
               "SCHEDULE_PUBLISH"
              ]
             },
             "date": {
              "type": "string",
              "format": "date-time"
             }
            }
           },
           {
            "type": "object",
            "properties": {
             "type": {
              "type": "string",
              "enum": [
               "SET_AS_FREE"
              ]
             }
            }
           }
          ]
         },
         "communityEmbedCards": {
          "type": "array",
          "items": {
           "type": "object",
           "required": [
            "title",
            "description",
            "content"
           ],
           "properties": {
            "title": {
             "type": "string"
            },
            "description": {
             "type": "string"
            },
            "content": {
             "$ref": "#/components/schemas/CommunityEmbedCardContent"
            }
           }
          }
         }
        }
       }
      }
     }
    },
    "responses": {
     "200": {
      "description": "Successful response",
      "content": {
       "application/json": {
        "schema": {
         "$ref": "#/components/schemas/Lesson"
        }
       }
      }
     },
     "400": {
      "$ref": "#/components/responses/ValidationError"
     },
     "401": {
      "$ref": "#/components/responses/UnauthorizedError"
     }
    }
   }
  },
  "/notifications": {
   "get": {
    "operationId": "getNotifications",
    "description": "Get the number of pending notifications a user in your community has",
    "tags": [
     "users"
    ],
    "parameters": [
     {
      "in": "query",
      "name": "email",
      "description": "The email address of the user",
      "required": true,
      "schema": {
       "type": "string",
       "format": "email"
      }
     }
    ],
    "responses": {
     "200": {
      "description": "Successful response",
      "content": {
       "application/json": {
        "schema": {
         "type": "object",
         "properties": {
          "count": {
           "description": "The number of pending notifications",
           "type": "number"
          }
         }
        }
       }
      }
     },
     "401": {
      "$ref": "#/components/responses/UnauthorizedError"
     },
     "404": {
      "description": "Could not find requested user"
     }
    }
   }
  },
  "/roles": {
   "get": {
    "operationId": "getRoles",
    "description": "Returns an array of all the roles in a Heartbeat community",
    "tags": [
     "roles"
    ],
    "parameters": [],
    "responses": {
     "200": {
      "description": "Successful response",
      "content": {
       "application/json": {
        "schema": {
         "type": "array",
         "items": {
          "$ref": "#/components/schemas/Role"
         }
        }
       }
      }
     },
     "401": {
      "$ref": "#/components/responses/UnauthorizedError"
     }
    }
   }
  },
  "/threads/{threadID}": {
   "get": {
    "operationId": "getThread",
    "description": "Get a thread",
    "tags": [
     "channels"
    ],
    "parameters": [
     {
      "in": "path",
      "name": "threadID",
      "required": true,
      "schema": {
       "type": "string",
       "format": "uuid"
      }
     }
    ],
    "responses": {
     "200": {
      "description": "Successful response",
      "content": {
       "application/json": {
        "schema": {
         "$ref": "#/components/schemas/Thread"
        }
       }
      }
     },
     "401": {
      "$ref": "#/components/responses/UnauthorizedError"
     },
     "404": {
      "description": "Could not find requested thread"
     }
    }
   }
  },
  "/channels/{channelID}/threads": {
   "get": {
    "operationId": "getThreads",
    "description": "Returns threads in a channel, newest first. Results are paginated using cursor-based pagination.",
    "tags": [
     "channels"
    ],
    "parameters": [
     {
      "in": "path",
      "name": "channelID",
      "required": true,
      "schema": {
       "type": "string",
       "format": "uuid"
      }
     },
     {
      "in": "query",
      "name": "startingAfter",
      "description": "Cursor for pagination - return results after this thread ID",
      "schema": {
       "type": "string",
       "format": "uuid"
      }
     },
     {
      "in": "query",
      "name": "limit",
      "description": "Number of results to return (1-100)",
      "schema": {
       "type": "integer",
       "minimum": 1,
       "maximum": 100,
       "default": 20
      }
     }
    ],
    "responses": {
     "200": {
      "description": "Successful response",
      "content": {
       "application/json": {
        "schema": {
         "type": "array",
         "items": {
          "$ref": "#/components/schemas/Thread"
         }
        }
       }
      }
     },
     "401": {
      "$ref": "#/components/responses/UnauthorizedError"
     },
     "404": {
      "description": "Could not find requested channel or startingAfter thread"
     }
    }
   }
  },
  "/users/{userID}": {
   "get": {
    "operationId": "getUser",
    "description": "Get a user by id",
    "tags": [
     "users"
    ],
    "parameters": [
     {
      "in": "path",
      "name": "userID",
      "required": true,
      "schema": {
       "type": "string",
       "format": "uuid"
      }
     }
    ],
    "responses": {
     "200": {
      "description": "Successful response",
      "content": {
       "application/json": {
        "schema": {
         "$ref": "#/components/schemas/User"
        }
       }
      }
     },
     "401": {
      "$ref": "#/components/responses/UnauthorizedError"
     },
     "404": {
      "description": "Could not find the specified user"
     }
    }
   }
  },
  "/users/{userID}/completed-lessons": {
   "get": {
    "operationId": "getUserCompletedLessons",
    "description": "Returns a user's completed lessons, newest completion first. Results are paginated using cursor-based pagination.",
    "tags": [
     "users",
     "courses"
    ],
    "parameters": [
     {
      "in": "path",
      "name": "userID",
      "required": true,
      "schema": {
       "type": "string",
       "format": "uuid"
      }
     },
     {
      "in": "query",
      "name": "startingAfter",
      "description": "Cursor for pagination - return results after this lesson ID",
      "schema": {
       "type": "string",
       "format": "uuid"
      }
     },
     {
      "in": "query",
      "name": "limit",
      "description": "Number of results to return (1-100)",
      "schema": {
       "type": "integer",
       "minimum": 1,
       "maximum": 100,
       "default": 50
      }
     }
    ],
    "responses": {
     "200": {
      "description": "Successful response",
      "content": {
       "application/json": {
        "schema": {
         "type": "array",
         "items": {
          "$ref": "#/components/schemas/CompletedLesson"
         }
        }
       }
      }
     },
     "400": {
      "$ref": "#/components/responses/ValidationError"
     },
     "401": {
      "$ref": "#/components/responses/UnauthorizedError"
     },
     "404": {
      "description": "Could not find the specified user or startingAfter lesson"
     }
    }
   }
  },
  "/videos": {
   "get": {
    "operationId": "getVideos",
    "description": "Get all of the Heartbeat native videos in your community",
    "tags": [
     "courses"
    ],
    "responses": {
     "200": {
      "description": "Successful response",
      "content": {
       "application/json": {
        "schema": {
         "type": "array",
         "items": {
          "type": "object",
          "properties": {
           "id": {
            "type": "string",
            "format": "uuid",
            "description": "Unique identifier for the video."
           },
           "name": {
            "type": "string",
            "description": "The name of the video."
           },
           "createdAt": {
            "type": "string",
            "format": "date-time"
           },
           "aspectRatio": {
            "type": "string",
            "description": "The aspect ratio of the video (e.g., \"16:9\", \"4:3\")."
           },
           "duration": {
            "type": "integer",
            "format": "int32",
            "description": "The duration of the video in seconds."
           },
           "views": {
            "type": "integer",
            "format": "int32",
            "description": "The number of times the video has been viewed."
           }
          }
         }
        }
       }
      }
     },
     "401": {
      "$ref": "#/components/responses/UnauthorizedError"
     }
    }
   }
  },
  "/users/reactivate": {
   "post": {
    "operationId": "reactivateUser",
    "description": "Reactivate a user. Can be called after calling delete on a user to allow them to access the community again.",
    "tags": [
     "users"
    ],
    "parameters": [],
    "requestBody": {
     "required": true,
     "content": {
      "application/json": {
       "schema": {
        "type": "object",
        "properties": {
         "email": {
          "description": "The email of the user to reactivate. If no user with the provided email exists, will return a 404 response.",
          "type": "string",
          "format": "email",
          "example": "dmoney@scrutefarms.com"
         }
        },
        "required": [
         "email"
        ]
       }
      }
     }
    },
    "responses": {
     "200": {
      "description": "Successful response"
     },
     "401": {
      "$ref": "#/components/responses/UnauthorizedError"
     },
     "404": {
      "description": "Could not find the specified user"
     }
    }
   }
  },
  "/invitations/{invitationID}": {
   "post": {
    "operationId": "updateInvitation",
    "description": "Add users to an existing invitation",
    "tags": [
     "invitations"
    ],
    "parameters": [
     {
      "in": "path",
      "name": "invitationID",
      "required": true,
      "description": "The id of the invitation",
      "schema": {
       "type": "string",
       "format": "uuid"
      }
     }
    ],
    "requestBody": {
     "required": true,
     "content": {
      "application/json": {
       "schema": {
        "type": "object",
        "properties": {
         "emails": {
          "description": "The list of emails to add to the invitation",
          "type": "array",
          "items": {
           "type": "string",
           "format": "email"
          }
         },
         "shouldSendEmail": {
          "description": "Whether or not to send an invitation email to the users. If false, the users will be allowed to signup via the invitation link, however they will not receive an email from Heartbeat inviting them to join.",
          "type": "boolean"
         }
        },
        "required": [
         "emails",
         "shouldSendEmail"
        ]
       }
      }
     }
    },
    "responses": {
     "200": {
      "description": "Successful response"
     },
     "401": {
      "$ref": "#/components/responses/UnauthorizedError"
     },
     "404": {
      "description": "Could not find requested invitation"
     }
    }
   }
  },
  "/voiceChannels/{voiceChannelID}": {
   "post": {
    "operationId": "updateVoiceChannel",
    "description": "Edit a voice channel. All fields are optional, only fields that are provided will be changed.",
    "tags": [
     "voice"
    ],
    "parameters": [
     {
      "in": "path",
      "name": "voiceChannelID",
      "required": true,
      "schema": {
       "type": "string",
       "format": "uuid"
      }
     }
    ],
    "requestBody": {
     "required": true,
     "content": {
      "application/json": {
       "schema": {
        "type": "object",
        "properties": {
         "name": {
          "type": "string",
          "example": "random"
         },
         "description": {
          "type": "string",
          "example": "A place to discuss anything you want"
         },
         "restrictedTo": {
          "description": "An object describing who can access this voice channel. If set to null, then the voice channel will be public.",
          "nullable": true,
          "type": "object",
          "properties": {
           "invitedUsers": {
            "description": "A list of emails corresponding to the users that can access this voice channel. If both invitedUsers & invitedGroups are provided, the lists will be combined.",
            "type": "array",
            "items": {
             "type": "string",
             "format": "email"
            }
           },
           "invitedGroups": {
            "description": "Only these groups will be able to access the voice channel. If both invitedUsers & invitedGroups are provided, the lists will be combined.",
            "type": "array",
            "items": {
             "type": "string",
             "format": "uuid"
            }
           }
          }
         }
        }
       }
      }
     }
    },
    "responses": {
     "200": {
      "description": "Successful response"
     },
     "400": {
      "$ref": "#/components/responses/ValidationError"
     },
     "401": {
      "$ref": "#/components/responses/UnauthorizedError"
     }
    }
   }
  }
 },
 "components": {
  "securitySchemes": {
   "bearerAuth": {
    "type": "http",
    "scheme": "bearer",
    "bearerFormat": "APIKEY"
   }
  },
  "responses": {
   "UnauthorizedError": {
    "description": "API Key is missing or invalid"
   },
   "ValidationError": {
    "description": "Invalid request body"
   }
  },
  "schemas": {
   "ChannelCategory": {
    "type": "object",
    "properties": {
     "id": {
      "type": "string",
      "format": "uuid",
      "description": "The channel cateogry id"
     },
     "name": {
      "type": "string",
      "description": "The name of the channel cateogry",
      "example": "Alumni"
     }
    }
   },
   "Reactions": {
    "type": "object",
    "description": "Current reactions keyed by the reacting user's ID. Each value contains that user's emoji reactions.",
    "additionalProperties": {
     "type": "array",
     "items": {
      "type": "string"
     }
    }
   },
   "Comment": {
    "type": "object",
    "properties": {
     "id": {
      "type": "string",
      "format": "uuid"
     },
     "userID": {
      "type": "string",
      "format": "uuid",
      "description": "The id of the user that created this comment"
     },
     "content": {
      "type": "string",
      "description": "The content of the comment",
      "example": "<p>This is the comments's content</p>"
     },
     "reactions": {
      "$ref": "#/components/schemas/Reactions"
     },
     "images": {
      "type": "array",
      "items": {
       "type": "string"
      },
      "description": "A list of URLs pointing to any image attachments on the comment"
     },
     "files": {
      "type": "array",
      "items": {
       "type": "string"
      },
      "description": "A list of URLs pointing to any file attachments on the comment"
     },
     "createdAt": {
      "type": "string",
      "format": "date-time"
     },
     "children": {
      "type": "array",
      "items": {
       "$ref": "#/components/schemas/CommentReply"
      },
      "description": "A list of child comments. Heartbeat comments only have 2 levels of nesting, so a child comment will never have more child comments underneath"
     }
    }
   },
   "CommentReply": {
    "type": "object",
    "properties": {
     "id": {
      "type": "string",
      "format": "uuid"
     },
     "userID": {
      "type": "string",
      "format": "uuid",
      "description": "The id of the user that created this comment"
     },
     "content": {
      "type": "string",
      "description": "The content of the comment",
      "example": "<p>This is the comments's content</p>"
     },
     "reactions": {
      "$ref": "#/components/schemas/Reactions"
     },
     "images": {
      "type": "array",
      "items": {
       "type": "string"
      },
      "description": "A list of URLs pointing to any image attachments on the comment"
     },
     "files": {
      "type": "array",
      "items": {
       "type": "string"
      },
      "description": "A list of URLs pointing to any file attachments on the comment"
     },
     "createdAt": {
      "type": "string",
      "format": "date-time"
     }
    }
   },
   "Invitation": {
    "type": "object",
    "properties": {
     "id": {
      "type": "string",
      "format": "uuid",
      "description": "The invitation id"
     },
     "code": {
      "type": "string",
      "description": "A 6 digit alphanumeric code included within the invitation link. Invitation links use the following format: https://app.heartbeat.chat/example/invitation?code=<CODE> OR https://example.customdomain.com/invitation?code=<CODE>"
     },
     "role": {
      "type": "object",
      "properties": {
       "id": {
        "type": "string",
        "format": "uuid",
        "description": "The id of the role"
       },
       "name": {
        "type": "string",
        "description": "The name of the role",
        "example": "Moderator"
       }
      }
     },
     "groups": {
      "type": "array",
      "items": {
       "type": "object",
       "properties": {
        "id": {
         "type": "string",
         "format": "uuid",
         "description": "The id of the group"
        },
        "name": {
         "type": "string",
         "description": "The name of the group",
         "example": "Party Planning Committee"
        }
       }
      }
     }
    }
   },
   "Lesson": {
    "type": "object",
    "properties": {
     "id": {
      "type": "string",
      "description": "Unique identifier for the lesson",
      "format": "uuid"
     },
     "createdAt": {
      "type": "string",
      "format": "date-time",
      "description": "Timestamp of when the lesson was created."
     },
     "createdBy": {
      "type": "string",
      "description": "User ID of the person who created the lesson.",
      "format": "uuid"
     },
     "title": {
      "type": "string",
      "description": "Title of the lesson."
     },
     "content": {
      "type": "string",
      "description": "Content of the lesson."
     },
     "communityEmbedCards": {
      "type": "array",
      "items": {
       "$ref": "#/components/schemas/CommunityEmbedCard"
      }
     }
    }
   },
   "CommunityEmbedCard": {
    "type": "object",
    "properties": {
     "id": {
      "type": "string",
      "format": "uuid",
      "description": "Unique identifier for the community embed card."
     },
     "title": {
      "type": "string",
      "description": "Title of the community embed card."
     },
     "description": {
      "type": "string",
      "description": "Description of the community embed card."
     },
     "content": {
      "$ref": "#/components/schemas/CommunityEmbedCardContent"
     }
    }
   },
   "CommunityEmbedCardContent": {
    "oneOf": [
     {
      "type": "object",
      "required": [
       "type",
       "channelID"
      ],
      "properties": {
       "type": {
        "type": "string",
        "enum": [
         "CHANNEL"
        ]
       },
       "channelID": {
        "type": "string",
        "format": "uuid",
        "description": "Unique identifier for the channel."
       }
      }
     },
     {
      "type": "object",
      "required": [
       "type",
       "postID"
      ],
      "properties": {
       "type": {
        "type": "string",
        "enum": [
         "POST"
        ]
       },
       "postID": {
        "type": "string",
        "format": "uuid",
        "description": "Unique identifier for the post."
       }
      }
     },
     {
      "type": "object",
      "required": [
       "type",
       "eventID"
      ],
      "properties": {
       "type": {
        "type": "string",
        "enum": [
         "EVENT"
        ]
       },
       "eventID": {
        "type": "string",
        "format": "uuid",
        "description": "Unique identifier for the event."
       }
      }
     },
     {
      "type": "object",
      "required": [
       "type",
       "wikiPostID"
      ],
      "properties": {
       "type": {
        "type": "string",
        "enum": [
         "DOCUMENT"
        ]
       },
       "wikiPostID": {
        "type": "string",
        "format": "uuid",
        "description": "Unique identifier for the wiki post."
       }
      }
     },
     {
      "type": "object",
      "required": [
       "type",
       "userIDs",
       "promptDirectMessage"
      ],
      "properties": {
       "type": {
        "type": "string",
        "enum": [
         "USERS"
        ]
       },
       "userIDs": {
        "type": "array",
        "items": {
         "type": "string",
         "format": "uuid"
        },
        "description": "List of unique identifiers for users."
       },
       "promptDirectMessage": {
        "type": "boolean",
        "description": "Whether course members should be given the option to DM these users"
       }
      }
     },
     {
      "type": "object",
      "required": [
       "type"
      ],
      "properties": {
       "type": {
        "type": "string",
        "enum": [
         "MATCHUPS"
        ]
       }
      }
     }
    ]
   },
   "Thread": {
    "type": "object",
    "properties": {
     "id": {
      "type": "string",
      "format": "uuid"
     },
     "channelID": {
      "type": "string",
      "format": "uuid",
      "description": "The id of the channel where this thread exists"
     },
     "userID": {
      "type": "string",
      "format": "uuid",
      "description": "The id of the user that created this thread"
     },
     "content": {
      "type": "string",
      "description": "The content of the thread",
      "example": "<p>This is the thread's content</p>"
     },
     "reactions": {
      "$ref": "#/components/schemas/Reactions"
     },
     "files": {
      "type": "array",
      "items": {
       "type": "string"
      },
      "description": "A list of URLs pointing to any file attachments on the thread"
     },
     "createdAt": {
      "type": "string",
      "format": "date-time"
     },
     "url": {
      "type": "string",
      "description": "A URL pointing to this thread",
      "example": "https://app.heartbeat.chat/mycommunity/t/general/5dbcf5c9-5e7e-4285-9dab-6d3ce7f4dd1e"
     },
     "comments": {
      "type": "array",
      "items": {
       "$ref": "#/components/schemas/Comment"
      }
     }
    }
   },
   "WebhookAction": {
    "description": "Which actions in your Heartbeat community should trigger this webhook. See the Webhooks page to learn more about each action",
    "discriminator": {
     "propertyName": "name",
     "mapping": {
      "USER_JOIN": "#/components/schemas/UserJoinWebhookAction",
      "USER_UPDATE": "#/components/schemas/UserUpdateWebhookAction",
      "GROUP_JOIN": "#/components/schemas/GroupJoinWebhookAction",
      "ABANDONED_CART": "#/components/schemas/AbandonedInvitationLinkWebhookAction",
      "THREAD_CREATE": "#/components/schemas/ThreadCreateWebhookAction",
      "MENTION": "#/components/schemas/MentionWebhookAction",
      "DIRECT_MESSAGE": "#/components/schemas/DirectMessageWebhookAction",
      "COURSE_COMPLETED": "#/components/schemas/CourseCompletedWebhookAction",
      "EVENT_CREATE": "#/components/schemas/EventCreateWebhookAction",
      "EVENT_RSVP": "#/components/schemas/EventRSVPWebhookAction",
      "DOCUMENT_CREATE": "#/components/schemas/DocumentCreateWebhookAction"
     }
    },
    "oneOf": [
     {
      "$ref": "#/components/schemas/UserJoinWebhookAction"
     },
     {
      "$ref": "#/components/schemas/UserUpdateWebhookAction"
     },
     {
      "$ref": "#/components/schemas/GroupJoinWebhookAction"
     },
     {
      "$ref": "#/components/schemas/AbandonedInvitationLinkWebhookAction"
     },
     {
      "$ref": "#/components/schemas/ThreadCreateWebhookAction"
     },
     {
      "$ref": "#/components/schemas/MentionWebhookAction"
     },
     {
      "$ref": "#/components/schemas/DirectMessageWebhookAction"
     },
     {
      "$ref": "#/components/schemas/CourseCompletedWebhookAction"
     },
     {
      "$ref": "#/components/schemas/EventCreateWebhookAction"
     },
     {
      "$ref": "#/components/schemas/EventRSVPWebhookAction"
     },
     {
      "$ref": "#/components/schemas/DocumentCreateWebhookAction"
     }
    ]
   },
   "MentionWebhookAction": {
    "type": "object",
    "properties": {
     "name": {
      "type": "string",
      "enum": [
       "MENTION"
      ]
     },
     "filter": {
      "type": "object",
      "properties": {
       "userSelection": {
        "type": "array",
        "items": {
         "type": "object",
         "properties": {
          "id": {
           "type": "string",
           "format": "uuid"
          },
          "type": {
           "type": "string",
           "enum": [
            "USER",
            "GROUP"
           ]
          }
         },
         "required": [
          "id",
          "type"
         ]
        }
       },
       "channelIDs": {
        "type": "array",
        "items": {
         "type": "string",
         "format": "uuid"
        }
       }
      },
      "required": [
       "userSelection"
      ]
     }
    },
    "required": [
     "name",
     "filter"
    ]
   },
   "ThreadCreateWebhookAction": {
    "type": "object",
    "properties": {
     "name": {
      "type": "string",
      "enum": [
       "THREAD_CREATE"
      ]
     },
     "filter": {
      "type": "object",
      "properties": {
       "channelID": {
        "type": "string",
        "format": "uuid"
       },
       "triggerOnMove": {
        "type": "boolean",
        "default": false,
        "description": "If enabled, this webhook will trigger when threads are moved into the specified channel"
       }
      },
      "required": [
       "channelID"
      ]
     }
    },
    "required": [
     "name"
    ]
   },
   "UserJoinWebhookAction": {
    "type": "object",
    "properties": {
     "name": {
      "type": "string",
      "enum": [
       "USER_JOIN"
      ]
     }
    },
    "required": [
     "name"
    ]
   },
   "UserUpdateWebhookAction": {
    "type": "object",
    "properties": {
     "name": {
      "type": "string",
      "enum": [
       "USER_UPDATE"
      ]
     }
    },
    "required": [
     "name"
    ]
   },
   "EventCreateWebhookAction": {
    "type": "object",
    "properties": {
     "name": {
      "type": "string",
      "enum": [
       "EVENT_CREATE"
      ]
     }
    },
    "required": [
     "name"
    ]
   },
   "DocumentCreateWebhookAction": {
    "type": "object",
    "properties": {
     "name": {
      "type": "string",
      "enum": [
       "DOCUMENT_CREATE"
      ]
     }
    },
    "required": [
     "name"
    ]
   },
   "GroupJoinWebhookAction": {
    "type": "object",
    "properties": {
     "name": {
      "type": "string",
      "enum": [
       "GROUP_JOIN"
      ]
     },
     "filter": {
      "type": "object",
      "properties": {
       "groupID": {
        "type": "string",
        "format": "uuid"
       }
      },
      "required": [
       "groupID"
      ]
     }
    },
    "required": [
     "name"
    ]
   },
   "CourseCompletedWebhookAction": {
    "type": "object",
    "properties": {
     "name": {
      "type": "string",
      "enum": [
       "COURSE_COMPLETED"
      ]
     },
     "filter": {
      "type": "object",
      "properties": {
       "courseID": {
        "type": "string",
        "format": "uuid"
       }
      },
      "required": [
       "courseID"
      ]
     }
    },
    "required": [
     "name"
    ]
   },
   "DirectMessageWebhookAction": {
    "type": "object",
    "properties": {
     "name": {
      "type": "string",
      "enum": [
       "DIRECT_MESSAGE"
      ]
     },
     "filter": {
      "type": "object",
      "properties": {
       "userID": {
        "type": "string",
        "format": "uuid"
       }
      },
      "required": [
       "userID"
      ]
     }
    },
    "required": [
     "name",
     "filter"
    ]
   },
   "EventRSVPWebhookAction": {
    "type": "object",
    "properties": {
     "name": {
      "type": "string",
      "enum": [
       "EVENT_RSVP"
      ]
     },
     "filter": {
      "type": "object",
      "properties": {
       "userType": {
        "type": "string",
        "enum": [
         "HEARTBEAT_USER",
         "GUEST"
        ]
       },
       "eventID": {
        "type": "string",
        "format": "uuid"
       }
      }
     }
    },
    "required": [
     "name"
    ]
   },
   "AbandonedInvitationLinkWebhookAction": {
    "type": "object",
    "properties": {
     "name": {
      "type": "string",
      "enum": [
       "ABANDONED_CART"
      ]
     },
     "filter": {
      "type": "object",
      "properties": {
       "invitationLinkID": {
        "type": "string",
        "format": "uuid"
       },
       "groupIDs": {
        "type": "array",
        "items": {
         "type": "string",
         "format": "uuid"
        }
       }
      }
     }
    },
    "required": [
     "name"
    ]
   },
   "User": {
    "type": "object",
    "properties": {
     "id": {
      "type": "string",
      "format": "uuid"
     },
     "email": {
      "type": "string",
      "format": "email",
      "example": "dmoney@schrutefarms.com"
     },
     "name": {
      "type": "string",
      "description": "The user's full name",
      "example": "Dwight Schrute"
     },
     "firstName": {
      "type": "string",
      "description": "The user's first name",
      "example": "Dwight"
     },
     "lastName": {
      "type": "string",
      "description": "The user's last name",
      "example": "Schrute"
     },
     "lastLogin": {
      "type": "string",
      "format": "date-time",
      "nullable": true,
      "description": "The most recent time the user started a session in this community. Null if the user has never logged in."
     },
     "role": {
      "type": "string",
      "description": "The user's current role",
      "example": "Moderator"
     },
     "isAdmin": {
      "type": "boolean",
      "description": "Whether or not the user is an administrator"
     },
     "groups": {
      "type": "array",
      "items": {
       "type": "object",
       "properties": {
        "id": {
         "type": "string",
         "format": "uuid",
         "description": "The group id"
        },
        "name": {
         "type": "string",
         "description": "The group name",
         "example": "Party Planning Committee"
        }
       }
      }
     },
     "onboardingResponses": {
      "type": "array",
      "items": {
       "type": "object",
       "properties": {
        "question": {
         "type": "string",
         "description": "The question this user was asked while onboarding",
         "example": "Where are you from?"
        },
        "answer": {
         "type": "string",
         "description": "This user's answer to the question",
         "example": "I'm from Seattle"
        },
        "isPrivate": {
         "type": "boolean",
         "description": "Whether this question was marked as private"
        }
       }
      }
     },
     "bio": {
      "type": "string",
      "description": "The user's Heartbeat bio",
      "example": "I'm the best salesman at Dunder Mifflin"
     },
     "avatar": {
      "type": "string",
      "format": "uri",
      "description": "A URL that points to the user's Heartbeat avatar"
     },
     "linkedInSummary": {
      "type": "string",
      "description": "A single formatted string containing the user's entire LinkedIn history. Empty if no LinkedIn data is available"
     },
     "socialLinks": {
      "type": "object",
      "description": "The social links the user has added to their profile. Unset links are omitted",
      "properties": {
       "linkedin": {
        "type": "string"
       },
       "twitter": {
        "type": "string"
       },
       "instagram": {
        "type": "string"
       },
       "calendar": {
        "type": "string"
       },
       "personalWebsite": {
        "type": "string"
       },
       "community": {
        "type": "string"
       }
      }
     },
     "linkedInData": {
      "type": "object",
      "nullable": true,
      "properties": {
       "profileUrl": {
        "type": "string",
        "example": "https://www.linkedin.com/in/dwight-schrute/"
       },
       "headline": {
        "type": "string",
        "nullable": true,
        "example": "Ready to crush your sales quotas"
       },
       "company": {
        "type": "string",
        "nullable": true,
        "example": "Dunder Mifflin"
       },
       "description": {
        "type": "string",
        "nullable": true,
        "example": "I'm a motivated salesman always willing to go the extra mile"
       },
       "location": {
        "type": "string",
        "nullable": true,
        "example": "Scranton, Pennsylvania, United States"
       },
       "jobs": {
        "type": "array",
        "nullable": true,
        "items": {
         "type": "object",
         "properties": {
          "companyName": {
           "type": "string",
           "nullable": true,
           "example": "Dunder Mifflin"
          },
          "jobTitle": {
           "type": "string",
           "nullable": true,
           "example": "Assistant to the Regional Manager"
          },
          "description": {
           "type": "string",
           "nullable": true
          },
          "location": {
           "type": "string",
           "nullable": true,
           "example": "Scranton, Pennsylvania, United States"
          },
          "dateRange": {
           "type": "string",
           "nullable": true,
           "example": "Mar 2005 - May 2013 OR May 2014 - Present"
          }
         }
        }
       },
       "schools": {
        "type": "array",
        "nullable": true,
        "items": {
         "type": "object",
         "properties": {
          "schoolName": {
           "type": "string",
           "nullable": true,
           "example": "Scranton University"
          },
          "degree": {
           "type": "string",
           "nullable": true,
           "example": "Bachelor's Degree"
          },
          "degreeSpec": {
           "type": "string",
           "nullable": true,
           "example": "Business Administration"
          },
          "dateRange": {
           "type": "string",
           "nullable": true,
           "example": "Aug 1988 - May 1992"
          }
         }
        }
       },
       "skills": {
        "type": "array",
        "nullable": true,
        "items": {
         "type": "string"
        },
        "example": [
         "Beet Farming",
         "German"
        ]
       }
      }
     }
    }
   },
   "Channel": {
    "type": "object",
    "properties": {
     "id": {
      "type": "string",
      "format": "uuid",
      "description": "The channel id"
     },
     "name": {
      "type": "string",
      "description": "The name of the channel",
      "example": "introductions"
     },
     "emoji": {
      "type": "string",
      "description": "The emoji for the channel",
      "example": "👋"
     },
     "type": {
      "description": "What type of channel this is.",
      "type": "string",
      "enum": [
       "POSTS",
       "CHAT",
       "VOICE"
      ]
     },
     "isDraft": {
      "description": "Whether the channel is a draft. A draft channel is only accessible to admins until it is published.",
      "type": "boolean"
     }
    }
   },
   "ChatMessage": {
    "type": "object",
    "properties": {
     "id": {
      "type": "string",
      "format": "uuid"
     },
     "userID": {
      "type": "string",
      "format": "uuid",
      "description": "The id of the user that created this chat message"
     },
     "content": {
      "type": "string",
      "description": "The content of the chat message",
      "example": "<p>This is the chat message's content</p>"
     },
     "images": {
      "type": "array",
      "items": {
       "type": "string"
      },
      "description": "A list of URLs pointing to any image attachments on the comment"
     },
     "files": {
      "type": "array",
      "items": {
       "type": "string"
      },
      "description": "A list of URLs pointing to any file attachments on the comment"
     },
     "createdAt": {
      "type": "string",
      "format": "date-time"
     }
    }
   },
   "ChatMessagesPage": {
    "type": "object",
    "required": [
     "data",
     "hasMore"
    ],
    "properties": {
     "data": {
      "type": "array",
      "items": {
       "$ref": "#/components/schemas/ChatMessage"
      }
     },
     "hasMore": {
      "type": "boolean",
      "description": "Indicates if more chat messages are available after the last returned message."
     }
    }
   },
   "Course": {
    "type": "object",
    "properties": {
     "id": {
      "type": "string",
      "description": "Unique identifier for the course",
      "format": "uuid"
     },
     "name": {
      "type": "string",
      "description": "The name of the course"
     },
     "description": {
      "type": "string",
      "description": "Text describing the course value, outcomes, and content"
     },
     "thumbnail": {
      "type": "string",
      "nullable": true,
      "description": "URL of the course thumbnail image. Null if no image is set.",
      "example": "https://example.com/course-thumbnail.jpg"
     },
     "coverImage": {
      "type": "string",
      "nullable": true,
      "description": "URL of the course cover image. Null if no image is set.",
      "example": "https://example.com/course-cover.jpg"
     },
     "category": {
      "type": "object",
      "description": "The category/section this course belongs to.",
      "properties": {
       "id": {
        "type": "string",
        "format": "uuid",
        "description": "Unique identifier for the course category"
       },
       "name": {
        "type": "string",
        "description": "Name of the course category"
       }
      }
     },
     "cohorts": {
      "type": "array",
      "description": "List of cohorts associated with the course",
      "items": {
       "type": "object",
       "properties": {
        "id": {
         "type": "string",
         "description": "Unique identifier for the cohort",
         "format": "uuid"
        },
        "name": {
         "type": "string",
         "description": "The name of the cohort"
        },
        "modules": {
         "type": "array",
         "description": "List of modules in the cohort",
         "items": {
          "type": "object",
          "properties": {
           "id": {
            "type": "string",
            "description": "Unique identifier for the module",
            "format": "uuid"
           },
           "name": {
            "type": "string",
            "description": "The name of the module"
           },
           "lessons": {
            "type": "array",
            "description": "List of lessons in the module",
            "items": {
             "type": "object",
             "properties": {
              "id": {
               "type": "string",
               "description": "Unique identifier for the lesson",
               "format": "uuid"
              },
              "name": {
               "type": "string",
               "description": "The name of the lesson"
              }
             }
            }
           }
          }
         }
        }
       }
      }
     }
    }
   },
   "Document": {
    "type": "object",
    "properties": {
     "id": {
      "type": "string",
      "format": "uuid",
      "description": "Unique identifier for the document"
     },
     "name": {
      "type": "string",
      "description": "The title/name of the document"
     },
     "link": {
      "type": "string",
      "format": "uri",
      "description": "A URL pointing to this document in the Heartbeat community"
     },
     "content": {
      "type": "string",
      "description": "The markdown content of the document"
     }
    }
   },
   "DocumentList": {
    "type": "object",
    "properties": {
     "id": {
      "type": "string",
      "format": "uuid",
      "description": "Unique identifier for the document"
     },
     "name": {
      "type": "string",
      "description": "The title/name of the document"
     },
     "link": {
      "type": "string",
      "format": "uri",
      "description": "A URL pointing to this document in the Heartbeat community"
     }
    }
   },
   "Event": {
    "type": "object",
    "properties": {
     "id": {
      "type": "string",
      "format": "uuid"
     },
     "name": {
      "type": "string",
      "description": "The Heartbeat event name",
      "example": "Toby's Going-Away Party"
     },
     "description": {
      "type": "string",
      "description": "The event description",
      "example": "The best event to happen this year. Look forward to fireworks and BBQ!"
     },
     "startTime": {
      "type": "string",
      "format": "date-time",
      "description": "The original start time for the event in UTC. If this event is recurring, this might be in the past."
     },
     "endTime": {
      "type": "string",
      "format": "date-time",
      "description": "The original end time for the event in UTC. If this event is recurring, this may be in the past."
     },
     "recurring": {
      "type": "boolean",
      "description": "Whether the event is recurring.",
      "example": true
     },
     "createdAt": {
      "type": "string",
      "format": "date-time",
      "description": "The date and time in UTC at which the event was created."
     },
     "createdBy": {
      "type": "string",
      "format": "uuid",
      "description": "The user id of the person that created the event"
     },
     "invitedUsers": {
      "description": "The users that are invited to this event",
      "type": "array",
      "items": {
       "type": "string",
       "format": "uuid"
      }
     },
     "invitedGroups": {
      "description": "The groups that are invited to this event",
      "type": "array",
      "items": {
       "type": "string",
       "format": "uuid"
      }
     },
     "coverImage": {
      "type": "string",
      "nullable": true,
      "description": "URL of the event cover image. Null if no image is set.",
      "example": "https://example.com/event-cover.jpg"
     }
    }
   },
   "Group": {
    "type": "object",
    "properties": {
     "id": {
      "type": "string",
      "format": "uuid"
     },
     "name": {
      "type": "string",
      "example": "Party Planning Committee"
     },
     "description": {
      "type": "string",
      "example": "Designated committee to plan holiday, birthday, & retirement parties"
     },
     "color": {
      "type": "string",
      "format": "The hex code color of the group",
      "example": "#FF6347"
     },
     "parentGroupID": {
      "type": "string",
      "format": "uuid",
      "nullable": true,
      "description": "The id of the group's parent. Returns null if the group has no parent"
     },
     "users": {
      "type": "array",
      "items": {
       "type": "object",
       "properties": {
        "id": {
         "type": "string",
         "format": "uuid",
         "description": "The heartbeat user id"
        },
        "name": {
         "type": "string",
         "example": "Angela Martin"
        },
        "email": {
         "type": "string",
         "format": "email",
         "description": "the email of the user",
         "example": "angela.martin@dundermifflin.com"
        }
       }
      }
     },
     "archived": {
      "type": "boolean",
      "description": "Whether the group has been archived or not",
      "example": false
     }
    }
   },
   "Role": {
    "type": "object",
    "properties": {
     "id": {
      "type": "string",
      "format": "uuid",
      "description": "The role id"
     },
     "name": {
      "type": "string",
      "description": "The name of the role",
      "example": "Moderator"
     }
    }
   },
   "CompletedLesson": {
    "type": "object",
    "properties": {
     "lessonID": {
      "type": "string",
      "format": "uuid",
      "description": "The completed lesson's ID"
     },
     "completedAt": {
      "type": "string",
      "format": "date-time",
      "description": "When the user completed the lesson"
     }
    }
   },
   "Webhook": {
    "type": "object",
    "properties": {
     "id": {
      "type": "string",
      "format": "uuid"
     },
     "createdAt": {
      "type": "string",
      "format": "date-time"
     },
     "url": {
      "type": "string",
      "format": "uri"
     },
     "trigger": {
      "$ref": "#/components/schemas/WebhookAction"
     }
    }
   }
  }
 },
 "security": [
  {
   "bearerAuth": []
  }
 ]
};

export const options = {
  source: { document },
  allowedOrigin: "https://api.heartbeat.chat",
  securitySchemes: { bearerAuth: { type: "http", scheme: "bearer" } },
  methods: { apiKey: [{ scheme: "bearerAuth", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
