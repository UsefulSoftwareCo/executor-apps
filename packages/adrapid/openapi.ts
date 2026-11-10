import type { JsonObject } from "apps";
import type { OpenapiToolNamesOptions } from "apps/openapi";

// Adrapid's published client-api.yaml splits its operations into a sibling api.yaml through
// relative $refs, which the compiler cannot follow. This is that document with the refs resolved.
// Source: https://api.adrapid.com/spec/v1/client-api.yaml (+ api.yaml). The read-only
// GET /templates, /medias and /fonts operations are copied from api.yaml (integrator document).
const document: JsonObject = {
 "openapi": "3.0.0",
 "info": {
  "version": "1.0.0",
  "title": "Adrapid User API",
  "description": "Adrapid's API for users. This API support the creation of optimized banners in HTML5, images, PDF files and videos. Authentication is made with a JWT bearer provided by Adrapid in your user account."
 },
 "servers": [
  {
   "url": "https://api.adrapid.com/v1/api",
   "description": "API endpoint"
  }
 ],
 "tags": [
  {
   "name": "banners",
   "description": "Banner operations."
  },
  {
   "name": "templates",
   "description": "Template operations."
  },
  {
   "name": "resources",
   "description": "Resources listing"
  },
  {
   "name": "fonts",
   "description": "Fonts operations."
  }
 ],
 "components": {
  "securitySchemes": {
   "bearerAuth": {
    "type": "http",
    "scheme": "bearer",
    "bearerFormat": "JWT"
   }
  }
 },
 "paths": {
  "/banners/{id}": {
   "get": {
    "tags": [
     "banners"
    ],
    "summary": "get banner",
    "parameters": [
     {
      "name": "id",
      "in": "path",
      "required": true,
      "description": "uuid",
      "schema": {
       "type": "string",
       "format": "uuid"
      }
     }
    ],
    "responses": {
     "200": {
      "description": "Banner Information",
      "content": {
       "application/json": {
        "schema": {
         "allOf": [
          {
           "type": "object",
           "required": [
            "id",
            "name",
            "ownerId"
           ],
           "properties": {
            "id": {
             "type": "string",
             "format": "uuid",
             "readOnly": true
            },
            "name": {
             "type": "string"
            },
            "ownerId": {
             "type": "string",
             "format": "uuid",
             "readOnly": true
            },
            "createdAt": {
             "type": "string",
             "format": "date-time",
             "readOnly": true,
             "description": "Creation date"
            },
            "updatedAt": {
             "type": "string",
             "format": "date-time",
             "readOnly": true,
             "description": "Last updated"
            }
           }
          },
          {
           "type": "object",
           "properties": {
            "status": {
             "type": "string",
             "enum": [
              "exporting",
              "uploaded",
              "failed",
              "ready"
             ],
             "readOnly": true,
             "description": "Status of the banner. Status will be ready when all files have been created."
            },
            "files": {
             "type": "array",
             "readOnly": true,
             "description": "List of files created for this banner",
             "items": {
              "description": "Exported banner item with specific size and format.",
              "type": "object",
              "properties": {
               "name": {
                "type": "string",
                "description": "name of the banner file",
                "readOnly": true
               },
               "type": {
                "type": "string",
                "enum": [
                 "html5",
                 "image",
                 "video",
                 "pdf",
                 "json",
                 "gif"
                ],
                "description": "Type of the banner file",
                "readOnly": true
               },
               "width": {
                "type": "integer",
                "readOnly": true
               },
               "height": {
                "type": "integer",
                "readOnly": true
               },
               "sizeId": {
                "type": "string",
                "format": "uuid",
                "readOnly": true,
                "description": "for multisize banners size id of the current bannerfile."
               },
               "index": {
                "type": "string",
                "format": "uri",
                "description": "Relative URL for the index file in the banner."
               },
               "url": {
                "type": "string",
                "format": "uri",
                "description": "Absolute URL for the index file in the banner."
               },
               "files": {
                "description": "List of files for this banner file.",
                "type": "array",
                "items": {
                 "minItems": 1,
                 "type": "object",
                 "properties": {
                  "name": {
                   "type": "string",
                   "description": "Name of the file"
                  },
                  "mimeType": {
                   "type": "string"
                  },
                  "path": {
                   "type": "string",
                   "description": "Relative path to the file"
                  },
                  "size": {
                   "type": "integer",
                   "description": "Size in Kb"
                  }
                 }
                }
               }
              }
             },
             "example": [
              {
               "name": "base.html",
               "type": "html5_unpacked",
               "files": [
                {
                 "name": "name.mp4",
                 "path": "path/to/file.mp4",
                 "size": 887441
                },
                {
                 "name": "name.jpeg",
                 "path": "path/to/file.jpeg",
                 "size": 131102
                },
                {
                 "name": "base.html",
                 "path": "path/to/file.index",
                 "size": 28383
                }
               ],
               "width": 300,
               "height": 600,
               "sizeName": "base"
              },
              {
               "name": "250x360.html",
               "type": "html5",
               "files": [
                {
                 "name": "250x360.html",
                 "path": "path2/to/file.html",
                 "size": 28426
                }
               ],
               "width": 250,
               "height": 360,
               "sizeId": "787814e5-fb53-4923-a0d7-c69518a0ece9",
               "sizeName": "250x360"
              }
             ]
            },
            "failedReason": {
             "type": "string",
             "readOnly": true
            },
            "name": {
             "type": "string",
             "readOnly": true
            },
            "templateId": {
             "type": "string",
             "format": "uuid",
             "readOnly": true,
             "description": "Immutable template with the same content as this banner. Can be cloned to create a new banner from the current one."
            },
            "parentTemplateId": {
             "type": "string",
             "format": "uuid",
             "readOnly": true,
             "description": "Parent template of current banner."
            }
           }
          }
         ]
        }
       }
      }
     },
     "401": {
      "description": "Access token is missing or invalid"
     }
    }
   }
  },
  "/banners": {
   "get": {
    "tags": [
     "banners"
    ],
    "summary": "get banners",
    "parameters": [
     {
      "name": "offset",
      "in": "query",
      "description": "Number of items to skip before returning the results.",
      "required": false,
      "schema": {
       "type": "integer",
       "format": "int32",
       "minimum": 0,
       "default": 0
      }
     },
     {
      "name": "limit",
      "in": "query",
      "description": "Max number of items to return.",
      "required": false,
      "schema": {
       "type": "integer",
       "format": "int32",
       "minimum": 10,
       "default": 10
      }
     },
     {
      "in": "query",
      "name": "search",
      "description": "A search string to filter the response with.",
      "required": false,
      "schema": {
       "type": "string",
       "default": ""
      }
     },
     {
      "status": null,
      "name": "status",
      "in": "query",
      "description": "Status of the banner. Status will be ready when all files have been created.",
      "schema": {
       "type": "string",
       "enum": [
        "exporting",
        "ready",
        "failed"
       ]
      }
     }
    ],
    "responses": {
     "200": {
      "description": "lists all the banners matching the input parameters criteria",
      "content": {
       "application/json": {
        "schema": {
         "properties": {
          "count": {
           "type": "integer"
          },
          "rows": {
           "type": "array",
           "items": {
            "allOf": [
             {
              "type": "object",
              "required": [
               "id",
               "name",
               "ownerId"
              ],
              "properties": {
               "id": {
                "type": "string",
                "format": "uuid",
                "readOnly": true
               },
               "name": {
                "type": "string"
               },
               "ownerId": {
                "type": "string",
                "format": "uuid",
                "readOnly": true
               },
               "createdAt": {
                "type": "string",
                "format": "date-time",
                "readOnly": true,
                "description": "Creation date"
               },
               "updatedAt": {
                "type": "string",
                "format": "date-time",
                "readOnly": true,
                "description": "Last updated"
               }
              }
             },
             {
              "type": "object",
              "properties": {
               "status": {
                "type": "string",
                "enum": [
                 "exporting",
                 "uploaded",
                 "failed",
                 "ready"
                ],
                "readOnly": true,
                "description": "Status of the banner. Status will be ready when all files have been created."
               },
               "files": {
                "type": "array",
                "readOnly": true,
                "description": "List of files created for this banner",
                "items": {
                 "description": "Exported banner item with specific size and format.",
                 "type": "object",
                 "properties": {
                  "name": {
                   "type": "string",
                   "description": "name of the banner file",
                   "readOnly": true
                  },
                  "type": {
                   "type": "string",
                   "enum": [
                    "html5",
                    "image",
                    "video",
                    "pdf",
                    "json",
                    "gif"
                   ],
                   "description": "Type of the banner file",
                   "readOnly": true
                  },
                  "width": {
                   "type": "integer",
                   "readOnly": true
                  },
                  "height": {
                   "type": "integer",
                   "readOnly": true
                  },
                  "sizeId": {
                   "type": "string",
                   "format": "uuid",
                   "readOnly": true,
                   "description": "for multisize banners size id of the current bannerfile."
                  },
                  "index": {
                   "type": "string",
                   "format": "uri",
                   "description": "Relative URL for the index file in the banner."
                  },
                  "url": {
                   "type": "string",
                   "format": "uri",
                   "description": "Absolute URL for the index file in the banner."
                  },
                  "files": {
                   "description": "List of files for this banner file.",
                   "type": "array",
                   "items": {
                    "minItems": 1,
                    "type": "object",
                    "properties": {
                     "name": {
                      "type": "string",
                      "description": "Name of the file"
                     },
                     "mimeType": {
                      "type": "string"
                     },
                     "path": {
                      "type": "string",
                      "description": "Relative path to the file"
                     },
                     "size": {
                      "type": "integer",
                      "description": "Size in Kb"
                     }
                    }
                   }
                  }
                 }
                },
                "example": [
                 {
                  "name": "base.html",
                  "type": "html5_unpacked",
                  "files": [
                   {
                    "name": "name.mp4",
                    "path": "path/to/file.mp4",
                    "size": 887441
                   },
                   {
                    "name": "name.jpeg",
                    "path": "path/to/file.jpeg",
                    "size": 131102
                   },
                   {
                    "name": "base.html",
                    "path": "path/to/file.index",
                    "size": 28383
                   }
                  ],
                  "width": 300,
                  "height": 600,
                  "sizeName": "base"
                 },
                 {
                  "name": "250x360.html",
                  "type": "html5",
                  "files": [
                   {
                    "name": "250x360.html",
                    "path": "path2/to/file.html",
                    "size": 28426
                   }
                  ],
                  "width": 250,
                  "height": 360,
                  "sizeId": "787814e5-fb53-4923-a0d7-c69518a0ece9",
                  "sizeName": "250x360"
                 }
                ]
               },
               "failedReason": {
                "type": "string",
                "readOnly": true
               },
               "name": {
                "type": "string",
                "readOnly": true
               },
               "templateId": {
                "type": "string",
                "format": "uuid",
                "readOnly": true,
                "description": "Immutable template with the same content as this banner. Can be cloned to create a new banner from the current one."
               },
               "parentTemplateId": {
                "type": "string",
                "format": "uuid",
                "readOnly": true,
                "description": "Parent template of current banner."
               }
              }
             }
            ]
           }
          }
         }
        }
       }
      }
     },
     "401": {
      "description": "Access token is missing or invalid"
     }
    }
   },
   "post": {
    "tags": [
     "banners"
    ],
    "summary": "Create a new banner",
    "requestBody": {
     "required": true,
     "content": {
      "application/json": {
       "schema": {
        "properties": {
         "sizeIds": {
          "oneOf": [
           {
            "description": "Include all template sizes.",
            "type": "string",
            "enum": [
             "all"
            ]
           },
           {
            "description": "Array of sizes to export the banner. [\"550e8400-e29b-41d4-a716-446655440000\", \"550e8400-e29b-41d4-a716-446655440001\"]",
            "type": "array",
            "items": {
             "type": "string"
            }
           }
          ]
         },
         "sizes": {
          "description": "Array of sizes.",
          "type": "array",
          "items": {
           "type": "object",
           "description": "Override properties."
          }
         },
         "templateId": {
          "description": "Template to create the banner",
          "type": "string",
          "format": "uuid"
         },
         "modes": {
          "description": "Modes to export the banner. Valid modes are html5, png, jpeg, webp, video, pdf",
          "type": "object",
          "properties": {
           "html5": {
            "type": "object",
            "properties": {
             "packed": {
              "type": "boolean",
              "description": "Set banner in a single file with embedded images.",
              "default": true
             },
             "felxible": {
              "type": "boolean",
              "description": "Set a flexible banner that will adapt to his container.",
              "default": false
             }
            }
           },
           "amp": {
            "type": "boolean"
           },
           "png": {
            "type": "boolean"
           },
           "jpeg": {
            "type": "boolean"
           },
           "pdf": {
            "type": "boolean"
           },
           "webp": {
            "type": "boolean"
           },
           "video": {
            "type": "object",
            "properties": {
             "fps": {
              "type": "number",
              "description": "Frame Per Second of resulting video.",
              "default": 14,
              "minimum": 1,
              "maximum": 60
             },
             "crf": {
              "type": "number",
              "description": "Constant Rate Factor. Less is more quality.",
              "minimum": 1,
              "maximum": 60,
              "default": 18
             },
             "audio": {
              "type": "object",
              "description": "Add audio file to video. Supported formats are mp3 and ogg.",
              "properties": {
               "offset": {
                "type": "number",
                "description": "Audio offset. Can be negative number."
               },
               "src": {
                "type": "string",
                "description": "URL of the audio file."
               }
              }
             }
            }
           },
           "gif": {
            "type": "object",
            "properties": {
             "fps": {
              "type": "number",
              "description": "Frame per second of resulting gif.",
              "default": 14,
              "minimum": 1,
              "maximum": 25
             },
             "frames": {
              "type": "array",
              "description": "Select specific seconds in the timeline to be used as frames.",
              "default": [
               0
              ],
              "minLength": 1,
              "maxLength": 15
             }
            }
           }
          }
         },
         "clicktag": {
          "description": "Clicktag URL",
          "type": "string",
          "format": "url"
         },
         "overrides": {
          "description": "Override data that will apply to the template",
          "type": "object",
          "properties": {
           "itemName": {
            "type": "object",
            "description": "Object containing details of the specific item referenced in the key name",
            "properties": {
             "text": {
              "type": "string",
              "description": "Text to be set"
             },
             "references": {
              "type": "object",
              "description": "Used to override an image in the banner with another image previusly uploaded",
              "properties": {
               "url": {
                "type": "string",
                "description": "id of the image to replace"
               }
              }
             },
             "url": {
              "type": "string",
              "format": "url",
              "description": "External url of an image. Any web compatible image format is supported."
             },
             "css": {
              "type": "object",
              "desrciption": "CSS rules to apply to the element. IE color or visibility."
             }
            }
           }
          }
         },
         "templateData": {
          "description": "Adrapid player data serialized to create a banner",
          "type": "object"
         },
         "sync": {
          "description": "Get banner url in the same response. Delay the response until the banner is ready. Usually in a few seconds with a maxtime of two minutes.",
          "type": "boolean",
          "default": false
         },
         "editable": {
          "description": "Make banner editable, creating a template that is a copy of the banner.",
          "type": "boolean",
          "default": false
         },
         "excludeBaseSize": {
          "description": "Exclude base size from the banner. Only applies to multisize banners.",
          "type": "boolean",
          "default": false
         }
        },
        "example": {
         "sizeIds": [
          "550e8400-e29b-41d4-a716-446655440000",
          "550e8400-e29b-41d4-a716-446655440000"
         ],
         "templateId": "550e8400-e29b-41d4-a716-446655440000",
         "modes": {
          "html5": true,
          "png": true,
          "jpeg": true,
          "gif": {
           "fps": 5
          }
         },
         "clicktag": "https://www.bbc.co.uk/news",
         "overrides": {
          "Title_text_1": {
           "text": "Drink",
           "css": {
            "color": "black"
           }
          },
          "Body_img_1": {
           "references": {
            "url": "550e8400-e29b-41d4-a716-446655440000"
           }
          },
          "Body_img_2": {
           "url": "external image url"
          }
         },
         "sync": true
        }
       }
      }
     }
    },
    "produces": [
     "application/json"
    ],
    "responses": {
     "200": {
      "description": "Banner Information",
      "content": {
       "application/json": {
        "schema": {
         "allOf": [
          {
           "type": "object",
           "required": [
            "id",
            "name",
            "ownerId"
           ],
           "properties": {
            "id": {
             "type": "string",
             "format": "uuid",
             "readOnly": true
            },
            "name": {
             "type": "string"
            },
            "ownerId": {
             "type": "string",
             "format": "uuid",
             "readOnly": true
            },
            "createdAt": {
             "type": "string",
             "format": "date-time",
             "readOnly": true,
             "description": "Creation date"
            },
            "updatedAt": {
             "type": "string",
             "format": "date-time",
             "readOnly": true,
             "description": "Last updated"
            }
           }
          },
          {
           "type": "object",
           "properties": {
            "status": {
             "type": "string",
             "enum": [
              "exporting",
              "uploaded",
              "failed",
              "ready"
             ],
             "readOnly": true,
             "description": "Status of the banner. Status will be ready when all files have been created."
            },
            "files": {
             "type": "array",
             "readOnly": true,
             "description": "List of files created for this banner",
             "items": {
              "description": "Exported banner item with specific size and format.",
              "type": "object",
              "properties": {
               "name": {
                "type": "string",
                "description": "name of the banner file",
                "readOnly": true
               },
               "type": {
                "type": "string",
                "enum": [
                 "html5",
                 "image",
                 "video",
                 "pdf",
                 "json",
                 "gif"
                ],
                "description": "Type of the banner file",
                "readOnly": true
               },
               "width": {
                "type": "integer",
                "readOnly": true
               },
               "height": {
                "type": "integer",
                "readOnly": true
               },
               "sizeId": {
                "type": "string",
                "format": "uuid",
                "readOnly": true,
                "description": "for multisize banners size id of the current bannerfile."
               },
               "index": {
                "type": "string",
                "format": "uri",
                "description": "Relative URL for the index file in the banner."
               },
               "url": {
                "type": "string",
                "format": "uri",
                "description": "Absolute URL for the index file in the banner."
               },
               "files": {
                "description": "List of files for this banner file.",
                "type": "array",
                "items": {
                 "minItems": 1,
                 "type": "object",
                 "properties": {
                  "name": {
                   "type": "string",
                   "description": "Name of the file"
                  },
                  "mimeType": {
                   "type": "string"
                  },
                  "path": {
                   "type": "string",
                   "description": "Relative path to the file"
                  },
                  "size": {
                   "type": "integer",
                   "description": "Size in Kb"
                  }
                 }
                }
               }
              }
             },
             "example": [
              {
               "name": "base.html",
               "type": "html5_unpacked",
               "files": [
                {
                 "name": "name.mp4",
                 "path": "path/to/file.mp4",
                 "size": 887441
                },
                {
                 "name": "name.jpeg",
                 "path": "path/to/file.jpeg",
                 "size": 131102
                },
                {
                 "name": "base.html",
                 "path": "path/to/file.index",
                 "size": 28383
                }
               ],
               "width": 300,
               "height": 600,
               "sizeName": "base"
              },
              {
               "name": "250x360.html",
               "type": "html5",
               "files": [
                {
                 "name": "250x360.html",
                 "path": "path2/to/file.html",
                 "size": 28426
                }
               ],
               "width": 250,
               "height": 360,
               "sizeId": "787814e5-fb53-4923-a0d7-c69518a0ece9",
               "sizeName": "250x360"
              }
             ]
            },
            "failedReason": {
             "type": "string",
             "readOnly": true
            },
            "name": {
             "type": "string",
             "readOnly": true
            },
            "templateId": {
             "type": "string",
             "format": "uuid",
             "readOnly": true,
             "description": "Immutable template with the same content as this banner. Can be cloned to create a new banner from the current one."
            },
            "parentTemplateId": {
             "type": "string",
             "format": "uuid",
             "readOnly": true,
             "description": "Parent template of current banner."
            }
           }
          }
         ]
        }
       }
      }
     },
     "401": {
      "description": "Access token is missing or invalid"
     },
     "402": {
      "description": "Not enough user quota to realise that operation"
     }
    }
   }
  },
  "/me": {
   "get": {
    "tags": [
     "system"
    ],
    "summary": "Get User and API info.",
    "responses": {
     "200": {
      "description": "Info about the user making the request and app version.",
      "content": {
       "application/json": {
        "schema": {
         "properties": {
          "backendVersion": {
           "description": "Version of the APP.",
           "type": "string"
          },
          "apiVersion": {
           "description": "Version of the API.",
           "type": "string"
          },
          "user": {
           "description": "Details of the user making the request.",
           "type": "object",
           "properties": {
            "id": {
             "description": "Id of the user.",
             "type": "string",
             "format": "uuid"
            },
            "username": {
             "description": "Id of the user.",
             "type": "string"
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
  "/": {
   "get": {
    "tags": [
     "system"
    ],
    "summary": "returns info about the API.",
    "responses": {
     "200": {
      "description": "Information about the API.",
      "content": {
       "application/json": {
        "schema": {
         "properties": {
          "description": {
           "type": "string",
           "description": "Description of this enpoint"
          },
          "backendVersion": {
           "type": "string",
           "description": "Server backend version"
          },
          "apiVersion": {
           "type": "string",
           "description": "Server backend version"
          }
         }
        }
       }
      }
     },
     "401": {
      "description": "Access token is missing or invalid"
     }
    }
   }
  },
  "/templates": {
   "get": {
    "tags": [
     "resources"
    ],
    "summary": "get templates",
    "parameters": [
     {
      "name": "offset",
      "in": "query",
      "description": "Number of items to skip before returning the results.",
      "required": false,
      "schema": {
       "type": "integer",
       "format": "int32",
       "minimum": 0,
       "default": 0
      }
     },
     {
      "name": "limit",
      "in": "query",
      "description": "Max number of items to return.",
      "required": false,
      "schema": {
       "type": "integer",
       "format": "int32",
       "minimum": 10,
       "default": 10
      }
     },
     {
      "in": "query",
      "name": "search",
      "description": "A search string to filter the response with.",
      "required": false,
      "schema": {
       "type": "string",
       "default": ""
      }
     }
    ],
    "responses": {
     "200": {
      "description": "lists all the templates matching the input parameters criteria",
      "content": {
       "application/json": {
        "schema": {
         "properties": {
          "count": {
           "type": "integer"
          },
          "rows": {
           "type": "array",
           "items": {
            "description": "Adrapid Template.",
            "allOf": [
             {
              "type": "object",
              "required": [
               "id",
               "name",
               "ownerId"
              ],
              "properties": {
               "id": {
                "type": "string",
                "format": "uuid",
                "readOnly": true
               },
               "name": {
                "type": "string"
               },
               "ownerId": {
                "type": "string",
                "format": "uuid",
                "readOnly": true
               },
               "createdAt": {
                "type": "string",
                "format": "date-time",
                "readOnly": true,
                "description": "Creation date"
               },
               "updatedAt": {
                "type": "string",
                "format": "date-time",
                "readOnly": true,
                "description": "Last updated"
               }
              }
             },
             {
              "type": "object",
              "required": [
               "data"
              ],
              "properties": {
               "data": {
                "description": "Template representation data",
                "type": "object"
               },
               "print": {
                "description": "Template is for print. Static content with no animations",
                "type": "boolean"
               },
               "publisher": {
                "description": "Template publisher",
                "type": "string"
               }
              }
             }
            ]
           }
          }
         }
        }
       }
      }
     },
     "401": {
      "description": "Access token is missing or invalid"
     }
    }
   }
  },
  "/medias": {
   "get": {
    "tags": [
     "resources"
    ],
    "summary": "get medias",
    "parameters": [
     {
      "name": "offset",
      "in": "query",
      "description": "Number of items to skip before returning the results.",
      "required": false,
      "schema": {
       "type": "integer",
       "format": "int32",
       "minimum": 0,
       "default": 0
      }
     },
     {
      "name": "limit",
      "in": "query",
      "description": "Max number of items to return.",
      "required": false,
      "schema": {
       "type": "integer",
       "format": "int32",
       "minimum": 10,
       "default": 10
      }
     },
     {
      "in": "query",
      "name": "search",
      "description": "A search string to filter the response with.",
      "required": false,
      "schema": {
       "type": "string",
       "default": ""
      }
     }
    ],
    "responses": {
     "200": {
      "description": "lists all the medias matching the input parameters criteria",
      "content": {
       "application/json": {
        "schema": {
         "properties": {
          "count": {
           "type": "integer"
          },
          "rows": {
           "type": "array",
           "items": {
            "allOf": [
             {
              "type": "object",
              "required": [
               "id",
               "name",
               "ownerId"
              ],
              "properties": {
               "id": {
                "type": "string",
                "format": "uuid",
                "readOnly": true
               },
               "name": {
                "type": "string"
               },
               "ownerId": {
                "type": "string",
                "format": "uuid",
                "readOnly": true
               },
               "createdAt": {
                "type": "string",
                "format": "date-time",
                "readOnly": true,
                "description": "Creation date"
               },
               "updatedAt": {
                "type": "string",
                "format": "date-time",
                "readOnly": true,
                "description": "Last updated"
               }
              }
             },
             {
              "type": "object",
              "required": [
               "mimeType",
               "status"
              ],
              "properties": {
               "mimeType": {
                "type": "string"
               },
               "meanColor": {
                "type": "integer"
               },
               "status": {
                "type": "string",
                "enum": [
                 "uploading",
                 "uploaded",
                 "transcoding",
                 "failed",
                 "ready"
                ]
               },
               "progress": {
                "type": "integer",
                "minimum": 0,
                "maximum": 100
               },
               "file": {
                "type": "string"
               }
              }
             }
            ]
           }
          }
         }
        }
       }
      }
     },
     "401": {
      "description": "Access token is missing or invalid"
     }
    }
   }
  },
  "/fonts": {
   "get": {
    "tags": [
     "resources"
    ],
    "summary": "get fonts",
    "parameters": [
     {
      "name": "offset",
      "in": "query",
      "description": "Number of items to skip before returning the results.",
      "required": false,
      "schema": {
       "type": "integer",
       "format": "int32",
       "minimum": 0,
       "default": 0
      }
     },
     {
      "name": "limit",
      "in": "query",
      "description": "Max number of items to return.",
      "required": false,
      "schema": {
       "type": "integer",
       "format": "int32",
       "minimum": 10,
       "default": 10
      }
     },
     {
      "in": "query",
      "name": "search",
      "description": "A search string to filter the response with.",
      "required": false,
      "schema": {
       "type": "string",
       "default": ""
      }
     }
    ],
    "responses": {
     "200": {
      "description": "lists all the fonts matching the input parameters criteria",
      "content": {
       "application/json": {
        "schema": {
         "properties": {
          "count": {
           "type": "integer"
          },
          "rows": {
           "type": "array",
           "items": {
            "allOf": [
             {
              "type": "object",
              "required": [
               "id",
               "name",
               "ownerId"
              ],
              "properties": {
               "id": {
                "type": "string",
                "format": "uuid",
                "readOnly": true
               },
               "name": {
                "type": "string"
               },
               "ownerId": {
                "type": "string",
                "format": "uuid",
                "readOnly": true
               },
               "createdAt": {
                "type": "string",
                "format": "date-time",
                "readOnly": true,
                "description": "Creation date"
               },
               "updatedAt": {
                "type": "string",
                "format": "date-time",
                "readOnly": true,
                "description": "Last updated"
               }
              }
             },
             {
              "type": "object",
              "required": [
               "family"
              ],
              "properties": {
               "source": {
                "type": "string",
                "enum": [
                 "google",
                 "custom",
                 "adobe"
                ]
               },
               "family": {
                "type": "string"
               },
               "category": {
                "type": "string"
               },
               "variants": {
                "type": "array",
                "items": {
                 "type": "string"
                }
               },
               "subsets": {
                "type": "array",
                "items": {
                 "type": "string"
                }
               },
               "version": {
                "type": "string"
               },
               "lastModified": {
                "type": "string"
               }
              }
             }
            ]
           }
          }
         }
        }
       }
      }
     },
     "401": {
      "description": "Access token is missing or invalid"
     }
    }
   }
  }
 }
};

export const options = {
  source: { document },
  allowedOrigin: "https://api.adrapid.com",
  securitySchemes: { bearerAuth: { type: "http", scheme: "bearer" } },
  // The document declares no security; send the account's credential on every operation.
  fallbackSecurity: [{ bearerAuth: [] }],
  methods: { apiKey: [{ scheme: "bearerAuth", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
