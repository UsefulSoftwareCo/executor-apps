import type { JsonObject } from "apps";
import type { OpenapiToolNamesOptions } from "apps/openapi";

// Bika.ai publishes this document at https://bika.ai/api/openapi/bika/openapi.json. It uses
// ":param" path templates, a relative server URL and no security scheme, so this copy rewrites
// them to "{param}", an absolute server and bearer auth, and drops operations marked deprecated.
const document: JsonObject = {
  "openapi": "3.0.0",
  "info": {
    "version": "2.0.17-release.0",
    "title": "Bika.ai Official OpenAPI Documentation"
  },
  "servers": [
    {
      "url": "https://bika.ai/api/openapi/bika"
    }
  ],
  "components": {
    "schemas": {
      "AutomationTriggerVOArray": {
        "type": "string",
        "$schema": "http://json-schema.org/draft-07/schema#"
      },
      "NodeTreeVOSchema": {
        "type": "string",
        "$schema": "http://json-schema.org/draft-07/schema#"
      },
      "NodeTreeVOArraySchema": {
        "type": "string",
        "$schema": "http://json-schema.org/draft-07/schema#"
      },
      "RolePaginationVO": {
        "type": "object",
        "properties": {
          "pageNo": {
            "type": "number"
          },
          "pageSize": {
            "type": "number"
          },
          "total": {
            "type": "number"
          },
          "roles": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "id": {
                  "type": "string"
                },
                "templateId": {
                  "type": "string",
                  "nullable": true
                },
                "name": {
                  "type": "string"
                },
                "createdAt": {
                  "type": "string"
                },
                "deleted": {
                  "type": "boolean"
                },
                "type": {
                  "type": "string",
                  "enum": [
                    "Role"
                  ]
                },
                "sequence": {
                  "type": "number"
                },
                "manageSpace": {
                  "type": "boolean"
                },
                "permissions": {
                  "type": "array",
                  "items": {
                    "anyOf": [
                      {
                        "type": "string",
                        "enum": [
                          "member"
                        ]
                      },
                      {
                        "type": "string",
                        "enum": [
                          "team"
                        ]
                      },
                      {
                        "type": "string",
                        "enum": [
                          "role"
                        ]
                      },
                      {
                        "type": "string",
                        "enum": [
                          "resource"
                        ]
                      },
                      {
                        "type": "string",
                        "enum": [
                          "integration"
                        ]
                      },
                      {
                        "type": "string",
                        "enum": [
                          "template"
                        ]
                      },
                      {
                        "type": "string",
                        "enum": [
                          "security"
                        ]
                      },
                      {
                        "type": "string",
                        "enum": [
                          "publish"
                        ]
                      }
                    ]
                  }
                },
                "memberCount": {
                  "type": "number"
                }
              },
              "required": [
                "id",
                "name",
                "type",
                "manageSpace"
              ]
            }
          }
        },
        "required": [
          "pageNo",
          "pageSize",
          "total",
          "roles"
        ]
      },
      "RoleVO": {
        "type": "object",
        "properties": {
          "id": {
            "type": "string"
          },
          "templateId": {
            "type": "string",
            "nullable": true
          },
          "name": {
            "type": "string"
          },
          "createdAt": {
            "type": "string"
          },
          "deleted": {
            "type": "boolean"
          },
          "type": {
            "type": "string",
            "enum": [
              "Role"
            ]
          },
          "sequence": {
            "type": "number"
          },
          "manageSpace": {
            "type": "boolean"
          },
          "permissions": {
            "type": "array",
            "items": {
              "anyOf": [
                {
                  "type": "string",
                  "enum": [
                    "member"
                  ]
                },
                {
                  "type": "string",
                  "enum": [
                    "team"
                  ]
                },
                {
                  "type": "string",
                  "enum": [
                    "role"
                  ]
                },
                {
                  "type": "string",
                  "enum": [
                    "resource"
                  ]
                },
                {
                  "type": "string",
                  "enum": [
                    "integration"
                  ]
                },
                {
                  "type": "string",
                  "enum": [
                    "template"
                  ]
                },
                {
                  "type": "string",
                  "enum": [
                    "security"
                  ]
                },
                {
                  "type": "string",
                  "enum": [
                    "publish"
                  ]
                }
              ]
            }
          },
          "memberCount": {
            "type": "number"
          }
        },
        "required": [
          "id",
          "name",
          "type",
          "manageSpace"
        ]
      },
      "TeamPaginationVO": {
        "type": "object",
        "properties": {
          "pageNo": {
            "type": "number"
          },
          "pageSize": {
            "type": "number"
          },
          "total": {
            "type": "number"
          },
          "teams": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "id": {
                  "type": "string"
                },
                "templateId": {
                  "type": "string",
                  "nullable": true
                },
                "name": {
                  "type": "string"
                },
                "createdAt": {
                  "type": "string"
                },
                "deleted": {
                  "type": "boolean"
                },
                "parentId": {
                  "type": "string"
                },
                "memberCount": {
                  "type": "number"
                },
                "path": {
                  "type": "string",
                  "description": "Department hierarchy path"
                },
                "isGuest": {
                  "type": "boolean"
                },
                "type": {
                  "type": "string",
                  "enum": [
                    "Team"
                  ]
                }
              },
              "required": [
                "id",
                "name",
                "isGuest",
                "type"
              ]
            }
          }
        },
        "required": [
          "pageNo",
          "pageSize",
          "total",
          "teams"
        ]
      },
      "MemberPaginationVO": {
        "type": "object",
        "properties": {
          "pageNo": {
            "type": "number"
          },
          "pageSize": {
            "type": "number"
          },
          "total": {
            "type": "number"
          },
          "members": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "id": {
                  "type": "string"
                },
                "templateId": {
                  "type": "string",
                  "nullable": true
                },
                "name": {
                  "type": "string"
                },
                "createdAt": {
                  "type": "string"
                },
                "deleted": {
                  "type": "boolean"
                },
                "type": {
                  "type": "string",
                  "enum": [
                    "Member"
                  ]
                },
                "userId": {
                  "type": "string"
                },
                "email": {
                  "type": "string",
                  "nullable": true
                },
                "avatar": {
                  "oneOf": [
                    {
                      "type": "object",
                      "properties": {
                        "type": {
                          "type": "string",
                          "enum": [
                            "PRESET"
                          ]
                        },
                        "url": {
                          "type": "string"
                        }
                      },
                      "required": [
                        "type",
                        "url"
                      ]
                    },
                    {
                      "type": "object",
                      "properties": {
                        "type": {
                          "type": "string",
                          "enum": [
                            "COLOR"
                          ]
                        },
                        "color": {
                          "type": "string"
                        }
                      },
                      "required": [
                        "type",
                        "color"
                      ]
                    },
                    {
                      "type": "object",
                      "properties": {
                        "type": {
                          "type": "string",
                          "enum": [
                            "ATTACHMENT"
                          ]
                        },
                        "attachmentId": {
                          "type": "string"
                        },
                        "relativePath": {
                          "type": "string"
                        }
                      },
                      "required": [
                        "type",
                        "attachmentId",
                        "relativePath"
                      ]
                    },
                    {
                      "type": "object",
                      "properties": {
                        "type": {
                          "type": "string",
                          "enum": [
                            "EMOJI"
                          ]
                        },
                        "backgroundColor": {
                          "type": "string"
                        },
                        "emoji": {
                          "type": "string"
                        }
                      },
                      "required": [
                        "type",
                        "emoji"
                      ]
                    },
                    {
                      "type": "object",
                      "properties": {
                        "type": {
                          "type": "string",
                          "enum": [
                            "AI"
                          ]
                        },
                        "prompt": {
                          "type": "string"
                        },
                        "attachmentId": {
                          "type": "string"
                        },
                        "relativePath": {
                          "type": "string"
                        }
                      },
                      "required": [
                        "type",
                        "prompt",
                        "attachmentId",
                        "relativePath"
                      ]
                    },
                    {
                      "type": "object",
                      "properties": {
                        "type": {
                          "type": "string",
                          "enum": [
                            "UNSPLASH"
                          ]
                        },
                        "url": {
                          "type": "string",
                          "format": "uri"
                        },
                        "downloadUrl": {
                          "type": "string",
                          "format": "uri"
                        }
                      },
                      "required": [
                        "type",
                        "url"
                      ]
                    },
                    {
                      "type": "object",
                      "properties": {
                        "type": {
                          "type": "string",
                          "enum": [
                            "URL"
                          ]
                        },
                        "url": {
                          "type": "string"
                        }
                      },
                      "required": [
                        "type",
                        "url"
                      ]
                    }
                  ]
                },
                "nickName": {
                  "type": "string"
                },
                "isGuest": {
                  "type": "boolean"
                },
                "isSpaceOwner": {
                  "type": "boolean"
                },
                "relationType": {
                  "type": "string",
                  "enum": [
                    "USER",
                    "AI"
                  ]
                }
              },
              "required": [
                "id",
                "name",
                "type",
                "userId",
                "email",
                "isGuest",
                "relationType"
              ]
            }
          }
        },
        "required": [
          "pageNo",
          "pageSize",
          "total",
          "members"
        ]
      },
      "TeamVO": {
        "type": "object",
        "properties": {
          "id": {
            "type": "string"
          },
          "templateId": {
            "type": "string",
            "nullable": true
          },
          "name": {
            "type": "string"
          },
          "createdAt": {
            "type": "string"
          },
          "deleted": {
            "type": "boolean"
          },
          "parentId": {
            "type": "string"
          },
          "memberCount": {
            "type": "number"
          },
          "path": {
            "type": "string",
            "description": "Department hierarchy path"
          },
          "isGuest": {
            "type": "boolean"
          },
          "type": {
            "type": "string",
            "enum": [
              "Team"
            ]
          }
        },
        "required": [
          "id",
          "name",
          "isGuest",
          "type"
        ]
      },
      "MemberVOSchema": {
        "type": "string",
        "$schema": "http://json-schema.org/draft-07/schema#"
      },
      "DatabaseVOSchema": {
        "type": "string",
        "$schema": "http://json-schema.org/draft-07/schema#"
      },
      "FieldVOSchemaArray": {
        "type": "string",
        "$schema": "http://json-schema.org/draft-07/schema#"
      },
      "ViewVOSchema.array()": {
        "type": "string",
        "$schema": "http://json-schema.org/draft-07/schema#"
      },
      "RecordPaginationVO": {
        "type": "object",
        "properties": {
          "success": {
            "type": "boolean",
            "description": "Request success flag",
            "example": true
          },
          "code": {
            "type": "number",
            "description": "bika status code",
            "example": 200
          },
          "message": {
            "type": "string",
            "description": "Response message",
            "example": "SUCCESS"
          },
          "data": {
            "type": "object",
            "properties": {
              "total": {
                "type": "number"
              },
              "pageNum": {
                "type": "number"
              },
              "pageSize": {
                "type": "number"
              },
              "records": {
                "type": "array",
                "items": {
                  "allOf": [
                    {
                      "type": "object",
                      "properties": {
                        "recordId": {
                          "type": "string"
                        },
                        "fields": {
                          "type": "object",
                          "additionalProperties": {
                            "anyOf": [
                              {
                                "nullable": true
                              },
                              {
                                "type": "number"
                              },
                              {
                                "type": "string"
                              },
                              {
                                "type": "array",
                                "items": {
                                  "type": "string"
                                }
                              },
                              {
                                "type": "boolean"
                              },
                              {
                                "type": "string"
                              },
                              {
                                "type": "object",
                                "properties": {
                                  "en": {
                                    "type": "string"
                                  },
                                  "zh-CN": {
                                    "type": "string"
                                  },
                                  "zh-TW": {
                                    "type": "string"
                                  },
                                  "ja": {
                                    "type": "string"
                                  },
                                  "pt": {
                                    "type": "string"
                                  },
                                  "de": {
                                    "type": "string"
                                  }
                                }
                              },
                              {
                                "type": "object",
                                "properties": {
                                  "id": {
                                    "type": "string"
                                  },
                                  "name": {
                                    "type": "string"
                                  },
                                  "path": {
                                    "type": "string"
                                  },
                                  "bucket": {
                                    "type": "string"
                                  },
                                  "mimeType": {
                                    "type": "string"
                                  },
                                  "size": {
                                    "type": "number"
                                  },
                                  "fileName": {
                                    "type": "string",
                                    "nullable": true
                                  }
                                },
                                "required": [
                                  "id",
                                  "name",
                                  "path",
                                  "bucket",
                                  "mimeType",
                                  "size"
                                ]
                              },
                              {
                                "type": "object",
                                "properties": {
                                  "docId": {
                                    "type": "string"
                                  },
                                  "name": {
                                    "type": "string"
                                  }
                                },
                                "required": [
                                  "docId",
                                  "name"
                                ]
                              },
                              {
                                "type": "array",
                                "items": {
                                  "anyOf": [
                                    {
                                      "nullable": true
                                    },
                                    {
                                      "type": "number"
                                    },
                                    {
                                      "type": "string"
                                    },
                                    {
                                      "type": "array",
                                      "items": {
                                        "type": "string"
                                      }
                                    },
                                    {
                                      "type": "boolean"
                                    },
                                    {
                                      "type": "string"
                                    },
                                    {
                                      "type": "object",
                                      "properties": {
                                        "en": {
                                          "type": "string"
                                        },
                                        "zh-CN": {
                                          "type": "string"
                                        },
                                        "zh-TW": {
                                          "type": "string"
                                        },
                                        "ja": {
                                          "type": "string"
                                        },
                                        "pt": {
                                          "type": "string"
                                        },
                                        "de": {
                                          "type": "string"
                                        }
                                      }
                                    },
                                    {
                                      "type": "object",
                                      "properties": {
                                        "id": {
                                          "type": "string"
                                        },
                                        "name": {
                                          "type": "string"
                                        },
                                        "path": {
                                          "type": "string"
                                        },
                                        "bucket": {
                                          "type": "string"
                                        },
                                        "mimeType": {
                                          "type": "string"
                                        },
                                        "size": {
                                          "type": "number"
                                        },
                                        "fileName": {
                                          "type": "string",
                                          "nullable": true
                                        }
                                      },
                                      "required": [
                                        "id",
                                        "name",
                                        "path",
                                        "bucket",
                                        "mimeType",
                                        "size"
                                      ]
                                    },
                                    {
                                      "type": "object",
                                      "properties": {
                                        "docId": {
                                          "type": "string"
                                        },
                                        "name": {
                                          "type": "string"
                                        }
                                      },
                                      "required": [
                                        "docId",
                                        "name"
                                      ]
                                    },
                                    {
                                      "nullable": true
                                    }
                                  ]
                                }
                              },
                              {
                                "nullable": true
                              }
                            ]
                          }
                        }
                      },
                      "required": [
                        "recordId",
                        "fields"
                      ]
                    },
                    {
                      "type": "object",
                      "properties": {
                        "createdAt": {
                          "type": "number"
                        },
                        "updatedAt": {
                          "type": "number"
                        }
                      },
                      "required": [
                        "createdAt",
                        "updatedAt"
                      ]
                    }
                  ]
                }
              }
            },
            "required": [
              "total",
              "pageNum",
              "pageSize",
              "records"
            ]
          }
        },
        "required": [
          "success",
          "code",
          "message",
          "data"
        ]
      },
      "RecordRenderVO": {
        "type": "object",
        "properties": {
          "success": {
            "type": "boolean",
            "description": "Request success flag",
            "example": true
          },
          "code": {
            "type": "number",
            "description": "bika status code",
            "example": 200
          },
          "message": {
            "type": "string",
            "description": "Response message",
            "example": "SUCCESS"
          },
          "data": {
            "type": "object",
            "properties": {
              "id": {
                "type": "string"
              },
              "databaseId": {
                "type": "string"
              },
              "revision": {
                "type": "number"
              },
              "cells": {
                "type": "object",
                "additionalProperties": {
                  "type": "object",
                  "properties": {
                    "data": {
                      "anyOf": [
                        {
                          "nullable": true
                        },
                        {
                          "type": "number"
                        },
                        {
                          "type": "string"
                        },
                        {
                          "type": "array",
                          "items": {
                            "type": "string"
                          }
                        },
                        {
                          "type": "boolean"
                        },
                        {
                          "type": "string"
                        },
                        {
                          "type": "object",
                          "properties": {
                            "en": {
                              "type": "string"
                            },
                            "zh-CN": {
                              "type": "string"
                            },
                            "zh-TW": {
                              "type": "string"
                            },
                            "ja": {
                              "type": "string"
                            },
                            "pt": {
                              "type": "string"
                            },
                            "de": {
                              "type": "string"
                            }
                          }
                        },
                        {
                          "type": "object",
                          "properties": {
                            "id": {
                              "type": "string"
                            },
                            "name": {
                              "type": "string"
                            },
                            "path": {
                              "type": "string"
                            },
                            "bucket": {
                              "type": "string"
                            },
                            "mimeType": {
                              "type": "string"
                            },
                            "size": {
                              "type": "number"
                            },
                            "fileName": {
                              "type": "string",
                              "nullable": true
                            }
                          },
                          "required": [
                            "id",
                            "name",
                            "path",
                            "bucket",
                            "mimeType",
                            "size"
                          ]
                        },
                        {
                          "type": "object",
                          "properties": {
                            "docId": {
                              "type": "string"
                            },
                            "name": {
                              "type": "string"
                            }
                          },
                          "required": [
                            "docId",
                            "name"
                          ]
                        },
                        {
                          "type": "array",
                          "items": {
                            "anyOf": [
                              {
                                "nullable": true
                              },
                              {
                                "type": "number"
                              },
                              {
                                "type": "string"
                              },
                              {
                                "type": "array",
                                "items": {
                                  "type": "string"
                                }
                              },
                              {
                                "type": "boolean"
                              },
                              {
                                "type": "string"
                              },
                              {
                                "type": "object",
                                "properties": {
                                  "en": {
                                    "type": "string"
                                  },
                                  "zh-CN": {
                                    "type": "string"
                                  },
                                  "zh-TW": {
                                    "type": "string"
                                  },
                                  "ja": {
                                    "type": "string"
                                  },
                                  "pt": {
                                    "type": "string"
                                  },
                                  "de": {
                                    "type": "string"
                                  }
                                }
                              },
                              {
                                "type": "object",
                                "properties": {
                                  "id": {
                                    "type": "string"
                                  },
                                  "name": {
                                    "type": "string"
                                  },
                                  "path": {
                                    "type": "string"
                                  },
                                  "bucket": {
                                    "type": "string"
                                  },
                                  "mimeType": {
                                    "type": "string"
                                  },
                                  "size": {
                                    "type": "number"
                                  },
                                  "fileName": {
                                    "type": "string",
                                    "nullable": true
                                  }
                                },
                                "required": [
                                  "id",
                                  "name",
                                  "path",
                                  "bucket",
                                  "mimeType",
                                  "size"
                                ]
                              },
                              {
                                "type": "object",
                                "properties": {
                                  "docId": {
                                    "type": "string"
                                  },
                                  "name": {
                                    "type": "string"
                                  }
                                },
                                "required": [
                                  "docId",
                                  "name"
                                ]
                              },
                              {
                                "nullable": true
                              }
                            ]
                          }
                        },
                        {
                          "nullable": true
                        }
                      ]
                    },
                    "value": {
                      "anyOf": [
                        {
                          "type": "string"
                        },
                        {
                          "type": "object",
                          "properties": {
                            "en": {
                              "type": "string"
                            },
                            "zh-CN": {
                              "type": "string"
                            },
                            "zh-TW": {
                              "type": "string"
                            },
                            "ja": {
                              "type": "string"
                            },
                            "pt": {
                              "type": "string"
                            },
                            "de": {
                              "type": "string"
                            }
                          }
                        },
                        {
                          "type": "number"
                        },
                        {
                          "type": "array",
                          "items": {
                            "anyOf": [
                              {
                                "type": "string"
                              },
                              {
                                "type": "object",
                                "properties": {
                                  "en": {
                                    "type": "string"
                                  },
                                  "zh-CN": {
                                    "type": "string"
                                  },
                                  "zh-TW": {
                                    "type": "string"
                                  },
                                  "ja": {
                                    "type": "string"
                                  },
                                  "pt": {
                                    "type": "string"
                                  },
                                  "de": {
                                    "type": "string"
                                  }
                                }
                              },
                              {
                                "nullable": true
                              },
                              {
                                "nullable": true
                              }
                            ]
                          }
                        },
                        {
                          "type": "array",
                          "items": {
                            "type": "object",
                            "properties": {
                              "id": {
                                "type": "string",
                                "description": "Member ID"
                              },
                              "avatar": {
                                "oneOf": [
                                  {
                                    "type": "object",
                                    "properties": {
                                      "type": {
                                        "type": "string",
                                        "enum": [
                                          "PRESET"
                                        ]
                                      },
                                      "url": {
                                        "type": "string"
                                      }
                                    },
                                    "required": [
                                      "type",
                                      "url"
                                    ]
                                  },
                                  {
                                    "type": "object",
                                    "properties": {
                                      "type": {
                                        "type": "string",
                                        "enum": [
                                          "COLOR"
                                        ]
                                      },
                                      "color": {
                                        "type": "string"
                                      }
                                    },
                                    "required": [
                                      "type",
                                      "color"
                                    ]
                                  },
                                  {
                                    "type": "object",
                                    "properties": {
                                      "type": {
                                        "type": "string",
                                        "enum": [
                                          "ATTACHMENT"
                                        ]
                                      },
                                      "attachmentId": {
                                        "type": "string"
                                      },
                                      "relativePath": {
                                        "type": "string"
                                      }
                                    },
                                    "required": [
                                      "type",
                                      "attachmentId",
                                      "relativePath"
                                    ]
                                  },
                                  {
                                    "type": "object",
                                    "properties": {
                                      "type": {
                                        "type": "string",
                                        "enum": [
                                          "EMOJI"
                                        ]
                                      },
                                      "backgroundColor": {
                                        "type": "string"
                                      },
                                      "emoji": {
                                        "type": "string"
                                      }
                                    },
                                    "required": [
                                      "type",
                                      "emoji"
                                    ]
                                  },
                                  {
                                    "type": "object",
                                    "properties": {
                                      "type": {
                                        "type": "string",
                                        "enum": [
                                          "AI"
                                        ]
                                      },
                                      "prompt": {
                                        "type": "string"
                                      },
                                      "attachmentId": {
                                        "type": "string"
                                      },
                                      "relativePath": {
                                        "type": "string"
                                      }
                                    },
                                    "required": [
                                      "type",
                                      "prompt",
                                      "attachmentId",
                                      "relativePath"
                                    ]
                                  },
                                  {
                                    "type": "object",
                                    "properties": {
                                      "type": {
                                        "type": "string",
                                        "enum": [
                                          "UNSPLASH"
                                        ]
                                      },
                                      "url": {
                                        "type": "string",
                                        "format": "uri"
                                      },
                                      "downloadUrl": {
                                        "type": "string",
                                        "format": "uri"
                                      }
                                    },
                                    "required": [
                                      "type",
                                      "url"
                                    ]
                                  },
                                  {
                                    "type": "object",
                                    "properties": {
                                      "type": {
                                        "type": "string",
                                        "enum": [
                                          "URL"
                                        ]
                                      },
                                      "url": {
                                        "type": "string"
                                      }
                                    },
                                    "required": [
                                      "type",
                                      "url"
                                    ]
                                  }
                                ]
                              },
                              "name": {
                                "type": "string",
                                "description": "Member name"
                              },
                              "deleted": {
                                "type": "boolean"
                              }
                            },
                            "required": [
                              "id",
                              "name"
                            ]
                          }
                        },
                        {
                          "type": "object",
                          "properties": {
                            "id": {
                              "type": "string",
                              "description": "User ID"
                            },
                            "avatar": {
                              "oneOf": [
                                {
                                  "type": "object",
                                  "properties": {
                                    "type": {
                                      "type": "string",
                                      "enum": [
                                        "PRESET"
                                      ]
                                    },
                                    "url": {
                                      "type": "string"
                                    }
                                  },
                                  "required": [
                                    "type",
                                    "url"
                                  ]
                                },
                                {
                                  "type": "object",
                                  "properties": {
                                    "type": {
                                      "type": "string",
                                      "enum": [
                                        "COLOR"
                                      ]
                                    },
                                    "color": {
                                      "type": "string"
                                    }
                                  },
                                  "required": [
                                    "type",
                                    "color"
                                  ]
                                },
                                {
                                  "type": "object",
                                  "properties": {
                                    "type": {
                                      "type": "string",
                                      "enum": [
                                        "ATTACHMENT"
                                      ]
                                    },
                                    "attachmentId": {
                                      "type": "string"
                                    },
                                    "relativePath": {
                                      "type": "string"
                                    }
                                  },
                                  "required": [
                                    "type",
                                    "attachmentId",
                                    "relativePath"
                                  ]
                                },
                                {
                                  "type": "object",
                                  "properties": {
                                    "type": {
                                      "type": "string",
                                      "enum": [
                                        "EMOJI"
                                      ]
                                    },
                                    "backgroundColor": {
                                      "type": "string"
                                    },
                                    "emoji": {
                                      "type": "string"
                                    }
                                  },
                                  "required": [
                                    "type",
                                    "emoji"
                                  ]
                                },
                                {
                                  "type": "object",
                                  "properties": {
                                    "type": {
                                      "type": "string",
                                      "enum": [
                                        "AI"
                                      ]
                                    },
                                    "prompt": {
                                      "type": "string"
                                    },
                                    "attachmentId": {
                                      "type": "string"
                                    },
                                    "relativePath": {
                                      "type": "string"
                                    }
                                  },
                                  "required": [
                                    "type",
                                    "prompt",
                                    "attachmentId",
                                    "relativePath"
                                  ]
                                },
                                {
                                  "type": "object",
                                  "properties": {
                                    "type": {
                                      "type": "string",
                                      "enum": [
                                        "UNSPLASH"
                                      ]
                                    },
                                    "url": {
                                      "type": "string",
                                      "format": "uri"
                                    },
                                    "downloadUrl": {
                                      "type": "string",
                                      "format": "uri"
                                    }
                                  },
                                  "required": [
                                    "type",
                                    "url"
                                  ]
                                },
                                {
                                  "type": "object",
                                  "properties": {
                                    "type": {
                                      "type": "string",
                                      "enum": [
                                        "URL"
                                      ]
                                    },
                                    "url": {
                                      "type": "string"
                                    }
                                  },
                                  "required": [
                                    "type",
                                    "url"
                                  ]
                                }
                              ]
                            },
                            "name": {
                              "type": "string",
                              "description": "Member name or anonymous (i18n)"
                            },
                            "deleted": {
                              "type": "boolean"
                            }
                          },
                          "required": [
                            "id",
                            "name"
                          ]
                        },
                        {
                          "type": "array",
                          "items": {
                            "type": "object",
                            "properties": {
                              "id": {
                                "type": "string"
                              },
                              "name": {
                                "type": "string"
                              },
                              "path": {
                                "type": "string"
                              },
                              "bucket": {
                                "type": "string"
                              },
                              "mimeType": {
                                "type": "string"
                              },
                              "size": {
                                "type": "number"
                              },
                              "fileName": {
                                "type": "string",
                                "nullable": true
                              },
                              "thumbnailUrl": {
                                "type": "string",
                                "nullable": true
                              },
                              "previewUrl": {
                                "type": "string",
                                "nullable": true
                              },
                              "downloadUrl": {
                                "type": "string"
                              }
                            },
                            "required": [
                              "id",
                              "name",
                              "path",
                              "bucket",
                              "mimeType",
                              "size"
                            ]
                          }
                        },
                        {
                          "nullable": true
                        }
                      ]
                    },
                    "id": {
                      "type": "string"
                    },
                    "name": {
                      "type": "string"
                    }
                  },
                  "required": [
                    "id"
                  ]
                }
              },
              "commentCount": {
                "type": "number"
              },
              "groupKey": {
                "anyOf": [
                  {
                    "type": "string",
                    "enum": [
                      "data"
                    ]
                  },
                  {
                    "type": "string",
                    "enum": [
                      "value"
                    ]
                  }
                ]
              },
              "groupCount": {
                "type": "number"
              }
            },
            "required": [
              "id",
              "databaseId",
              "revision",
              "cells"
            ]
          }
        },
        "required": [
          "success",
          "code",
          "message",
          "data"
        ]
      },
      "RecordRenderVOArray": {
        "type": "object",
        "properties": {
          "success": {
            "type": "boolean",
            "description": "Request success flag",
            "example": true
          },
          "code": {
            "type": "number",
            "description": "bika status code",
            "example": 200
          },
          "message": {
            "type": "string",
            "description": "Response message",
            "example": "SUCCESS"
          },
          "data": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "id": {
                  "type": "string"
                },
                "databaseId": {
                  "type": "string"
                },
                "revision": {
                  "type": "number"
                },
                "cells": {
                  "type": "object",
                  "additionalProperties": {
                    "type": "object",
                    "properties": {
                      "data": {
                        "anyOf": [
                          {
                            "nullable": true
                          },
                          {
                            "type": "number"
                          },
                          {
                            "type": "string"
                          },
                          {
                            "type": "array",
                            "items": {
                              "type": "string"
                            }
                          },
                          {
                            "type": "boolean"
                          },
                          {
                            "type": "string"
                          },
                          {
                            "type": "object",
                            "properties": {
                              "en": {
                                "type": "string"
                              },
                              "zh-CN": {
                                "type": "string"
                              },
                              "zh-TW": {
                                "type": "string"
                              },
                              "ja": {
                                "type": "string"
                              },
                              "pt": {
                                "type": "string"
                              },
                              "de": {
                                "type": "string"
                              }
                            }
                          },
                          {
                            "type": "object",
                            "properties": {
                              "id": {
                                "type": "string"
                              },
                              "name": {
                                "type": "string"
                              },
                              "path": {
                                "type": "string"
                              },
                              "bucket": {
                                "type": "string"
                              },
                              "mimeType": {
                                "type": "string"
                              },
                              "size": {
                                "type": "number"
                              },
                              "fileName": {
                                "type": "string",
                                "nullable": true
                              }
                            },
                            "required": [
                              "id",
                              "name",
                              "path",
                              "bucket",
                              "mimeType",
                              "size"
                            ]
                          },
                          {
                            "type": "object",
                            "properties": {
                              "docId": {
                                "type": "string"
                              },
                              "name": {
                                "type": "string"
                              }
                            },
                            "required": [
                              "docId",
                              "name"
                            ]
                          },
                          {
                            "type": "array",
                            "items": {
                              "anyOf": [
                                {
                                  "nullable": true
                                },
                                {
                                  "type": "number"
                                },
                                {
                                  "type": "string"
                                },
                                {
                                  "type": "array",
                                  "items": {
                                    "type": "string"
                                  }
                                },
                                {
                                  "type": "boolean"
                                },
                                {
                                  "type": "string"
                                },
                                {
                                  "type": "object",
                                  "properties": {
                                    "en": {
                                      "type": "string"
                                    },
                                    "zh-CN": {
                                      "type": "string"
                                    },
                                    "zh-TW": {
                                      "type": "string"
                                    },
                                    "ja": {
                                      "type": "string"
                                    },
                                    "pt": {
                                      "type": "string"
                                    },
                                    "de": {
                                      "type": "string"
                                    }
                                  }
                                },
                                {
                                  "type": "object",
                                  "properties": {
                                    "id": {
                                      "type": "string"
                                    },
                                    "name": {
                                      "type": "string"
                                    },
                                    "path": {
                                      "type": "string"
                                    },
                                    "bucket": {
                                      "type": "string"
                                    },
                                    "mimeType": {
                                      "type": "string"
                                    },
                                    "size": {
                                      "type": "number"
                                    },
                                    "fileName": {
                                      "type": "string",
                                      "nullable": true
                                    }
                                  },
                                  "required": [
                                    "id",
                                    "name",
                                    "path",
                                    "bucket",
                                    "mimeType",
                                    "size"
                                  ]
                                },
                                {
                                  "type": "object",
                                  "properties": {
                                    "docId": {
                                      "type": "string"
                                    },
                                    "name": {
                                      "type": "string"
                                    }
                                  },
                                  "required": [
                                    "docId",
                                    "name"
                                  ]
                                },
                                {
                                  "nullable": true
                                }
                              ]
                            }
                          },
                          {
                            "nullable": true
                          }
                        ]
                      },
                      "value": {
                        "anyOf": [
                          {
                            "type": "string"
                          },
                          {
                            "type": "object",
                            "properties": {
                              "en": {
                                "type": "string"
                              },
                              "zh-CN": {
                                "type": "string"
                              },
                              "zh-TW": {
                                "type": "string"
                              },
                              "ja": {
                                "type": "string"
                              },
                              "pt": {
                                "type": "string"
                              },
                              "de": {
                                "type": "string"
                              }
                            }
                          },
                          {
                            "type": "number"
                          },
                          {
                            "type": "array",
                            "items": {
                              "anyOf": [
                                {
                                  "type": "string"
                                },
                                {
                                  "type": "object",
                                  "properties": {
                                    "en": {
                                      "type": "string"
                                    },
                                    "zh-CN": {
                                      "type": "string"
                                    },
                                    "zh-TW": {
                                      "type": "string"
                                    },
                                    "ja": {
                                      "type": "string"
                                    },
                                    "pt": {
                                      "type": "string"
                                    },
                                    "de": {
                                      "type": "string"
                                    }
                                  }
                                },
                                {
                                  "nullable": true
                                },
                                {
                                  "nullable": true
                                }
                              ]
                            }
                          },
                          {
                            "type": "array",
                            "items": {
                              "type": "object",
                              "properties": {
                                "id": {
                                  "type": "string",
                                  "description": "Member ID"
                                },
                                "avatar": {
                                  "oneOf": [
                                    {
                                      "type": "object",
                                      "properties": {
                                        "type": {
                                          "type": "string",
                                          "enum": [
                                            "PRESET"
                                          ]
                                        },
                                        "url": {
                                          "type": "string"
                                        }
                                      },
                                      "required": [
                                        "type",
                                        "url"
                                      ]
                                    },
                                    {
                                      "type": "object",
                                      "properties": {
                                        "type": {
                                          "type": "string",
                                          "enum": [
                                            "COLOR"
                                          ]
                                        },
                                        "color": {
                                          "type": "string"
                                        }
                                      },
                                      "required": [
                                        "type",
                                        "color"
                                      ]
                                    },
                                    {
                                      "type": "object",
                                      "properties": {
                                        "type": {
                                          "type": "string",
                                          "enum": [
                                            "ATTACHMENT"
                                          ]
                                        },
                                        "attachmentId": {
                                          "type": "string"
                                        },
                                        "relativePath": {
                                          "type": "string"
                                        }
                                      },
                                      "required": [
                                        "type",
                                        "attachmentId",
                                        "relativePath"
                                      ]
                                    },
                                    {
                                      "type": "object",
                                      "properties": {
                                        "type": {
                                          "type": "string",
                                          "enum": [
                                            "EMOJI"
                                          ]
                                        },
                                        "backgroundColor": {
                                          "type": "string"
                                        },
                                        "emoji": {
                                          "type": "string"
                                        }
                                      },
                                      "required": [
                                        "type",
                                        "emoji"
                                      ]
                                    },
                                    {
                                      "type": "object",
                                      "properties": {
                                        "type": {
                                          "type": "string",
                                          "enum": [
                                            "AI"
                                          ]
                                        },
                                        "prompt": {
                                          "type": "string"
                                        },
                                        "attachmentId": {
                                          "type": "string"
                                        },
                                        "relativePath": {
                                          "type": "string"
                                        }
                                      },
                                      "required": [
                                        "type",
                                        "prompt",
                                        "attachmentId",
                                        "relativePath"
                                      ]
                                    },
                                    {
                                      "type": "object",
                                      "properties": {
                                        "type": {
                                          "type": "string",
                                          "enum": [
                                            "UNSPLASH"
                                          ]
                                        },
                                        "url": {
                                          "type": "string",
                                          "format": "uri"
                                        },
                                        "downloadUrl": {
                                          "type": "string",
                                          "format": "uri"
                                        }
                                      },
                                      "required": [
                                        "type",
                                        "url"
                                      ]
                                    },
                                    {
                                      "type": "object",
                                      "properties": {
                                        "type": {
                                          "type": "string",
                                          "enum": [
                                            "URL"
                                          ]
                                        },
                                        "url": {
                                          "type": "string"
                                        }
                                      },
                                      "required": [
                                        "type",
                                        "url"
                                      ]
                                    }
                                  ]
                                },
                                "name": {
                                  "type": "string",
                                  "description": "Member name"
                                },
                                "deleted": {
                                  "type": "boolean"
                                }
                              },
                              "required": [
                                "id",
                                "name"
                              ]
                            }
                          },
                          {
                            "type": "object",
                            "properties": {
                              "id": {
                                "type": "string",
                                "description": "User ID"
                              },
                              "avatar": {
                                "oneOf": [
                                  {
                                    "type": "object",
                                    "properties": {
                                      "type": {
                                        "type": "string",
                                        "enum": [
                                          "PRESET"
                                        ]
                                      },
                                      "url": {
                                        "type": "string"
                                      }
                                    },
                                    "required": [
                                      "type",
                                      "url"
                                    ]
                                  },
                                  {
                                    "type": "object",
                                    "properties": {
                                      "type": {
                                        "type": "string",
                                        "enum": [
                                          "COLOR"
                                        ]
                                      },
                                      "color": {
                                        "type": "string"
                                      }
                                    },
                                    "required": [
                                      "type",
                                      "color"
                                    ]
                                  },
                                  {
                                    "type": "object",
                                    "properties": {
                                      "type": {
                                        "type": "string",
                                        "enum": [
                                          "ATTACHMENT"
                                        ]
                                      },
                                      "attachmentId": {
                                        "type": "string"
                                      },
                                      "relativePath": {
                                        "type": "string"
                                      }
                                    },
                                    "required": [
                                      "type",
                                      "attachmentId",
                                      "relativePath"
                                    ]
                                  },
                                  {
                                    "type": "object",
                                    "properties": {
                                      "type": {
                                        "type": "string",
                                        "enum": [
                                          "EMOJI"
                                        ]
                                      },
                                      "backgroundColor": {
                                        "type": "string"
                                      },
                                      "emoji": {
                                        "type": "string"
                                      }
                                    },
                                    "required": [
                                      "type",
                                      "emoji"
                                    ]
                                  },
                                  {
                                    "type": "object",
                                    "properties": {
                                      "type": {
                                        "type": "string",
                                        "enum": [
                                          "AI"
                                        ]
                                      },
                                      "prompt": {
                                        "type": "string"
                                      },
                                      "attachmentId": {
                                        "type": "string"
                                      },
                                      "relativePath": {
                                        "type": "string"
                                      }
                                    },
                                    "required": [
                                      "type",
                                      "prompt",
                                      "attachmentId",
                                      "relativePath"
                                    ]
                                  },
                                  {
                                    "type": "object",
                                    "properties": {
                                      "type": {
                                        "type": "string",
                                        "enum": [
                                          "UNSPLASH"
                                        ]
                                      },
                                      "url": {
                                        "type": "string",
                                        "format": "uri"
                                      },
                                      "downloadUrl": {
                                        "type": "string",
                                        "format": "uri"
                                      }
                                    },
                                    "required": [
                                      "type",
                                      "url"
                                    ]
                                  },
                                  {
                                    "type": "object",
                                    "properties": {
                                      "type": {
                                        "type": "string",
                                        "enum": [
                                          "URL"
                                        ]
                                      },
                                      "url": {
                                        "type": "string"
                                      }
                                    },
                                    "required": [
                                      "type",
                                      "url"
                                    ]
                                  }
                                ]
                              },
                              "name": {
                                "type": "string",
                                "description": "Member name or anonymous (i18n)"
                              },
                              "deleted": {
                                "type": "boolean"
                              }
                            },
                            "required": [
                              "id",
                              "name"
                            ]
                          },
                          {
                            "type": "array",
                            "items": {
                              "type": "object",
                              "properties": {
                                "id": {
                                  "type": "string"
                                },
                                "name": {
                                  "type": "string"
                                },
                                "path": {
                                  "type": "string"
                                },
                                "bucket": {
                                  "type": "string"
                                },
                                "mimeType": {
                                  "type": "string"
                                },
                                "size": {
                                  "type": "number"
                                },
                                "fileName": {
                                  "type": "string",
                                  "nullable": true
                                },
                                "thumbnailUrl": {
                                  "type": "string",
                                  "nullable": true
                                },
                                "previewUrl": {
                                  "type": "string",
                                  "nullable": true
                                },
                                "downloadUrl": {
                                  "type": "string"
                                }
                              },
                              "required": [
                                "id",
                                "name",
                                "path",
                                "bucket",
                                "mimeType",
                                "size"
                              ]
                            }
                          },
                          {
                            "nullable": true
                          }
                        ]
                      },
                      "id": {
                        "type": "string"
                      },
                      "name": {
                        "type": "string"
                      }
                    },
                    "required": [
                      "id"
                    ]
                  }
                },
                "commentCount": {
                  "type": "number"
                },
                "groupKey": {
                  "anyOf": [
                    {
                      "type": "string",
                      "enum": [
                        "data"
                      ]
                    },
                    {
                      "type": "string",
                      "enum": [
                        "value"
                      ]
                    }
                  ]
                },
                "groupCount": {
                  "type": "number"
                }
              },
              "required": [
                "id",
                "databaseId",
                "revision",
                "cells"
              ]
            }
          }
        },
        "required": [
          "success",
          "code",
          "message",
          "data"
        ]
      },
      "RecordVO": {
        "type": "object",
        "properties": {
          "id": {
            "type": "string",
            "description": "Record ID"
          },
          "fields": {
            "type": "object",
            "additionalProperties": {
              "anyOf": [
                {
                  "nullable": true
                },
                {
                  "type": "boolean"
                },
                {
                  "type": "number"
                },
                {
                  "type": "array",
                  "items": {
                    "type": "number"
                  }
                },
                {
                  "type": "string"
                },
                {
                  "type": "array",
                  "items": {
                    "type": "string"
                  }
                },
                {
                  "type": "object",
                  "properties": {
                    "id": {
                      "type": "string",
                      "description": "Contact Unique ID"
                    },
                    "name": {
                      "type": "string"
                    },
                    "deleted": {
                      "type": "boolean"
                    }
                  },
                  "required": [
                    "id",
                    "name"
                  ]
                },
                {
                  "type": "array",
                  "items": {
                    "type": "object",
                    "properties": {
                      "id": {
                        "type": "string",
                        "description": "Contact Unique ID"
                      },
                      "name": {
                        "type": "string"
                      },
                      "deleted": {
                        "type": "boolean"
                      }
                    },
                    "required": [
                      "id",
                      "name"
                    ]
                  }
                },
                {
                  "type": "array",
                  "items": {
                    "type": "object",
                    "properties": {
                      "id": {
                        "type": "string",
                        "description": "Contact Unique ID"
                      },
                      "type": {
                        "type": "string",
                        "enum": [
                          "Member",
                          "Team",
                          "Role"
                        ],
                        "description": "Contact Type, eg: MEMBER"
                      },
                      "name": {
                        "type": "string"
                      },
                      "deleted": {
                        "type": "boolean"
                      }
                    },
                    "required": [
                      "id",
                      "type",
                      "name"
                    ]
                  }
                },
                {
                  "type": "array",
                  "items": {
                    "type": "object",
                    "properties": {
                      "id": {
                        "type": "string"
                      },
                      "name": {
                        "type": "string"
                      },
                      "size": {
                        "type": "number"
                      },
                      "mimeType": {
                        "type": "string"
                      },
                      "url": {
                        "type": "string",
                        "description": "The URL of the attachment"
                      },
                      "thumbnailUrl": {
                        "type": "string",
                        "nullable": true
                      }
                    },
                    "required": [
                      "id",
                      "name",
                      "size",
                      "mimeType"
                    ]
                  }
                },
                {
                  "type": "object",
                  "properties": {
                    "docId": {
                      "type": "string"
                    },
                    "name": {
                      "type": "string"
                    }
                  },
                  "required": [
                    "docId",
                    "name"
                  ]
                },
                {
                  "type": "array",
                  "items": {
                    "type": "object",
                    "properties": {
                      "docId": {
                        "type": "string"
                      },
                      "name": {
                        "type": "string"
                      }
                    },
                    "required": [
                      "docId",
                      "name"
                    ]
                  }
                },
                {
                  "nullable": true
                }
              ]
            },
            "description": "The fields of the record, structured as key-value pairs.",
            "example": {
              "single_text": "text 1",
              "number": 123,
              "checkbox": true,
              "single_select": "Done",
              "multi_select": [
                "Monday",
                "Tuesday"
              ],
              "date": "2023-10-01T10:05:45.000Z",
              "date_range": "2023-10-01T10:05:45.000Z -> 2023-10-02T10:05:45.000Z",
              "created_at": "2023-10-01T00:00:00.000Z",
              "link_record": [
                "rec123",
                "rec456"
              ],
              "attachment": [
                {
                  "id": "att123",
                  "name": "attachment.jpg",
                  "size": 1024,
                  "mimeType": "image/jpeg",
                  "url": "https://example.com/attachment.jpg",
                  "thumbnailUrl": "https://example.com/thumbnail.jpg"
                }
              ],
              "assigners": [
                {
                  "id": "tem123",
                  "type": "Team",
                  "name": "HR Team"
                },
                {
                  "id": "rol123",
                  "type": "Role",
                  "name": "Manager"
                },
                {
                  "id": "mem123",
                  "type": "Member",
                  "name": "John Doe"
                }
              ],
              "created_by": {
                "id": "user123",
                "name": "Jane Smith"
              },
              "last_modified_by": {
                "id": "user123",
                "name": "Jane Smith"
              }
            }
          },
          "createdAt": {
            "type": "string",
            "description": "The creation timestamp of the record in the ISO format, eg: 2020-01-01T00:00:00.000Z",
            "example": "2026-10-12T02:38:19.765Z"
          },
          "updatedAt": {
            "type": "string",
            "description": "The last update timestamp of the record in the ISO format, eg: 2020-01-01T00:00:00.000Z",
            "example": "2026-10-12T02:38:19.765Z"
          }
        },
        "required": [
          "id",
          "fields",
          "createdAt"
        ]
      },
      "RecordPageInfoResponse": {
        "type": "object",
        "properties": {
          "success": {
            "type": "boolean",
            "description": "Request success flag",
            "example": true
          },
          "code": {
            "type": "number",
            "description": "bika status code",
            "example": 200
          },
          "message": {
            "type": "string",
            "description": "Response message",
            "example": "SUCCESS"
          },
          "data": {
            "type": "object",
            "properties": {
              "offset": {
                "type": "string",
                "description": "Return an offset if there are more records to fetch. use to fetch next page of records."
              },
              "hasMore": {
                "type": "boolean",
                "description": "Indicates if there are more records to fetch."
              },
              "records": {
                "type": "array",
                "items": {
                  "$ref": "#/components/schemas/RecordVO"
                },
                "description": "Array of record object"
              }
            },
            "required": [
              "hasMore",
              "records"
            ]
          }
        },
        "required": [
          "success",
          "code",
          "message",
          "data"
        ]
      },
      "RecordResponse": {
        "type": "object",
        "properties": {
          "success": {
            "type": "boolean",
            "description": "Request success flag",
            "example": true
          },
          "code": {
            "type": "number",
            "description": "bika status code",
            "example": 200
          },
          "message": {
            "type": "string",
            "description": "Response message",
            "example": "SUCCESS"
          },
          "data": {
            "$ref": "#/components/schemas/RecordVO"
          }
        },
        "required": [
          "success",
          "code",
          "message",
          "data"
        ]
      },
      "CreateRecordsResponse": {
        "type": "object",
        "properties": {
          "success": {
            "type": "boolean",
            "description": "Request success flag",
            "example": true
          },
          "code": {
            "type": "number",
            "description": "bika status code",
            "example": 200
          },
          "message": {
            "type": "string",
            "description": "Response message",
            "example": "SUCCESS"
          },
          "data": {
            "type": "object",
            "properties": {
              "records": {
                "type": "array",
                "items": {
                  "$ref": "#/components/schemas/RecordVO"
                },
                "description": "Array of record objects to be created."
              }
            },
            "required": [
              "records"
            ]
          }
        },
        "required": [
          "success",
          "code",
          "message",
          "data"
        ]
      },
      "CreateRecordsRequest": {
        "type": "object",
        "properties": {
          "fieldKey": {
            "type": "string",
            "example": "name",
            "description": "The fieldKey parameter specifies that let you return field objects where the key is:<br><strong>name</strong>: Uses the field name as the key (default).<br><strong>id</strong>: Uses the field ID as the key."
          },
          "records": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "fields": {
                  "type": "object",
                  "additionalProperties": {
                    "anyOf": [
                      {
                        "nullable": true
                      },
                      {
                        "type": "boolean"
                      },
                      {
                        "type": "number"
                      },
                      {
                        "type": "string"
                      },
                      {
                        "type": "array",
                        "items": {
                          "type": "string"
                        }
                      },
                      {
                        "type": "array",
                        "items": {
                          "type": "object",
                          "properties": {
                            "id": {
                              "type": "string",
                              "description": "Attachment Unique ID"
                            },
                            "name": {
                              "type": "string",
                              "description": "Attachment name, if not provided, the name will be the same as the original file name"
                            }
                          },
                          "required": [
                            "id"
                          ]
                        }
                      },
                      {
                        "nullable": true
                      }
                    ]
                  },
                  "description": "The fields of the record, structured as key-value pairs.",
                  "example": {
                    "single_text": "text 1",
                    "number": 123,
                    "checkbox": true,
                    "date": "2021-03-29T10:05:45-08:00"
                  }
                }
              },
              "required": [
                "fields"
              ]
            },
            "maxItems": 10,
            "description": "Array of record objects to be created.",
            "example": [
              {
                "fields": {
                  "single_text": "text 1",
                  "number": 123,
                  "currency": 99.99,
                  "percent": 50,
                  "checkbox": true,
                  "single_select": "Done",
                  "multi_select": [
                    "Monday",
                    "Tuesday"
                  ],
                  "date": "2021-03-29T10:05:00.000Z",
                  "date_range": "2021-03-29T10:05:00.000Z/2021-04-05T10:05:00.000Z",
                  "attachment": [
                    {
                      "id": "att123",
                      "name": "touch.jpg"
                    },
                    {
                      "id": "att456",
                      "name": "document.pdf"
                    }
                  ],
                  "assigners": [
                    "member_id",
                    "team_id",
                    "role_id"
                  ],
                  "link_record_ids": [
                    "rec123",
                    "rec456"
                  ]
                }
              }
            ]
          }
        }
      },
      "UpdateRecordRequest": {
        "type": "object",
        "properties": {
          "fieldKey": {
            "type": "string",
            "example": "name",
            "description": "The fieldKey parameter specifies that let you return field objects where the key is:<br><strong>name</strong>: Uses the field name as the key (default).<br><strong>id</strong>: Uses the field ID as the key."
          },
          "fields": {
            "type": "object",
            "additionalProperties": {
              "anyOf": [
                {
                  "nullable": true
                },
                {
                  "type": "boolean"
                },
                {
                  "type": "number"
                },
                {
                  "type": "string"
                },
                {
                  "type": "array",
                  "items": {
                    "type": "string"
                  }
                },
                {
                  "type": "array",
                  "items": {
                    "type": "object",
                    "properties": {
                      "id": {
                        "type": "string",
                        "description": "Attachment Unique ID"
                      },
                      "name": {
                        "type": "string",
                        "description": "Attachment name, if not provided, the name will be the same as the original file name"
                      }
                    },
                    "required": [
                      "id"
                    ]
                  }
                },
                {
                  "nullable": true
                }
              ]
            },
            "description": "The fields of the record, structured as key-value pairs.",
            "example": {
              "single_text": "text 1",
              "number": 123,
              "checkbox": true,
              "date": "2021-03-29T10:05:45-08:00"
            }
          }
        },
        "required": [
          "fields"
        ],
        "description": "Fields to update in the record.",
        "example": {
          "fieldKey": "name",
          "fields": {
            "single_text": "text 1",
            "number": 123,
            "currency": 99.99,
            "percent": 50,
            "checkbox": true,
            "single_select": "Done",
            "multi_select": [
              "Monday",
              "Tuesday"
            ],
            "date": "2021-03-29T10:05:00.000Z",
            "date_range": "2021-03-29T10:05:00.000Z/2021-04-05T10:05:00.000Z",
            "attachment": [
              {
                "id": "att123",
                "name": "touch.jpg"
              },
              {
                "id": "att456",
                "name": "document.pdf"
              }
            ],
            "assigners": [
              "member_id",
              "team_id",
              "role_id"
            ],
            "link_record_ids": [
              "rec123",
              "rec456"
            ]
          }
        }
      },
      "UpdateRecordsResponse": {
        "type": "object",
        "properties": {
          "success": {
            "type": "boolean",
            "description": "Request success flag",
            "example": true
          },
          "code": {
            "type": "number",
            "description": "bika status code",
            "example": 200
          },
          "message": {
            "type": "string",
            "description": "Response message",
            "example": "SUCCESS"
          },
          "data": {
            "type": "object",
            "properties": {
              "records": {
                "type": "array",
                "items": {
                  "$ref": "#/components/schemas/RecordVO"
                },
                "description": "Array of record objects that were updated."
              }
            },
            "required": [
              "records"
            ]
          }
        },
        "required": [
          "success",
          "code",
          "message",
          "data"
        ]
      },
      "UpdateRecordsRequest": {
        "type": "object",
        "properties": {
          "fieldKey": {
            "type": "string",
            "example": "name",
            "description": "The fieldKey parameter specifies that let you return field objects where the key is:<br><strong>name</strong>: Uses the field name as the key (default).<br><strong>id</strong>: Uses the field ID as the key."
          },
          "records": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "fields": {
                  "type": "object",
                  "additionalProperties": {
                    "anyOf": [
                      {
                        "nullable": true
                      },
                      {
                        "type": "boolean"
                      },
                      {
                        "type": "number"
                      },
                      {
                        "type": "string"
                      },
                      {
                        "type": "array",
                        "items": {
                          "type": "string"
                        }
                      },
                      {
                        "type": "array",
                        "items": {
                          "type": "object",
                          "properties": {
                            "id": {
                              "type": "string",
                              "description": "Attachment Unique ID"
                            },
                            "name": {
                              "type": "string",
                              "description": "Attachment name, if not provided, the name will be the same as the original file name"
                            }
                          },
                          "required": [
                            "id"
                          ]
                        }
                      },
                      {
                        "nullable": true
                      }
                    ]
                  },
                  "description": "The fields of the record, structured as key-value pairs.",
                  "example": {
                    "single_text": "text 1",
                    "number": 123,
                    "checkbox": true,
                    "date": "2021-03-29T10:05:45-08:00"
                  }
                },
                "id": {
                  "type": "string",
                  "example": "rec111",
                  "description": "Record ID"
                }
              },
              "required": [
                "fields",
                "id"
              ]
            },
            "maxItems": 10,
            "description": "Array of record objects to be updated.",
            "example": [
              {
                "id": "rec1",
                "fields": {
                  "single_text": "text 1",
                  "number": 123,
                  "currency": 99.99,
                  "percent": 50,
                  "checkbox": true,
                  "single_select": "Done",
                  "multi_select": [
                    "Monday",
                    "Tuesday"
                  ],
                  "date": "2021-03-29T10:05:00.000Z",
                  "date_range": "2021-03-29T10:05:00.000Z/2021-04-05T10:05:00.000Z",
                  "attachment": [
                    {
                      "id": "att123",
                      "name": "touch.jpg"
                    },
                    {
                      "id": "att456",
                      "name": "document.pdf"
                    }
                  ],
                  "assigners": [
                    "member_id",
                    "team_id",
                    "role_id"
                  ],
                  "link_record_ids": [
                    "rec123",
                    "rec456"
                  ]
                }
              },
              {
                "id": "rec2",
                "fields": {
                  "single_text": "text 1",
                  "number": 123,
                  "currency": 99.99,
                  "percent": 50,
                  "checkbox": true,
                  "single_select": "Done",
                  "multi_select": [
                    "Monday",
                    "Tuesday"
                  ],
                  "date": "2021-03-29T10:05:00.000Z",
                  "date_range": "2021-03-29T10:05:00.000Z/2021-04-05T10:05:00.000Z",
                  "attachment": [
                    {
                      "id": "att123",
                      "name": "touch.jpg"
                    },
                    {
                      "id": "att456",
                      "name": "document.pdf"
                    }
                  ],
                  "assigners": [
                    "member_id",
                    "team_id",
                    "role_id"
                  ],
                  "link_record_ids": [
                    "rec123",
                    "rec456"
                  ]
                }
              }
            ]
          }
        },
        "required": [
          "records"
        ]
      },
      "DeletedRecordResponse": {
        "type": "object",
        "properties": {
          "success": {
            "type": "boolean",
            "description": "Request success flag",
            "example": true
          },
          "code": {
            "type": "number",
            "description": "bika status code",
            "example": 200
          },
          "message": {
            "type": "string",
            "description": "Response message",
            "example": "SUCCESS"
          },
          "data": {
            "type": "object",
            "properties": {
              "id": {
                "type": "string",
                "description": "The ID of the record that was deleted."
              },
              "deleted": {
                "type": "boolean",
                "description": "Indicates whether the record was successfully deleted."
              }
            },
            "required": [
              "id",
              "deleted"
            ]
          }
        },
        "required": [
          "success",
          "code",
          "message",
          "data"
        ]
      },
      "DeleteRecordsResponse": {
        "type": "object",
        "properties": {
          "success": {
            "type": "boolean",
            "description": "Request success flag",
            "example": true
          },
          "code": {
            "type": "number",
            "description": "bika status code",
            "example": 200
          },
          "message": {
            "type": "string",
            "description": "Response message",
            "example": "SUCCESS"
          },
          "data": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "id": {
                  "type": "string",
                  "description": "The ID of the record that was deleted."
                },
                "deleted": {
                  "type": "boolean",
                  "description": "Indicates whether the record was successfully deleted."
                }
              },
              "required": [
                "id",
                "deleted"
              ]
            }
          }
        },
        "required": [
          "success",
          "code",
          "message",
          "data"
        ]
      },
      "OutgoingWebhookVOSchemaArray": {
        "type": "string",
        "$schema": "http://json-schema.org/draft-07/schema#"
      },
      "OutgoingWebhookCreateDTOSchema": {
        "type": "string",
        "$schema": "http://json-schema.org/draft-07/schema#"
      }
    },
    "parameters": {},
    "securitySchemes": {
      "bearerAuth": {
        "type": "http",
        "scheme": "bearer"
      }
    }
  },
  "paths": {
    "/v1/system/meta": {
      "get": {
        "tags": [
          "System"
        ],
        "description": "Get System Meta",
        "responses": {
          "200": {
            "description": "Node",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "success": {
                      "type": "boolean",
                      "description": "Request success flag",
                      "example": true
                    },
                    "code": {
                      "type": "number",
                      "description": "bika status code",
                      "example": 200
                    },
                    "message": {
                      "type": "string",
                      "description": "Response message",
                      "example": "SUCCESS"
                    },
                    "data": {
                      "type": "object",
                      "properties": {
                        "version": {
                          "type": "string"
                        },
                        "hostname": {
                          "type": "string"
                        },
                        "buildNumber": {
                          "type": "string"
                        },
                        "buildSha": {
                          "type": "string"
                        },
                        "buildTime": {
                          "type": "string"
                        },
                        "headers": {
                          "type": "object",
                          "additionalProperties": {
                            "type": "string"
                          }
                        },
                        "isFromCN": {
                          "type": "boolean"
                        }
                      },
                      "required": [
                        "version",
                        "hostname",
                        "headers"
                      ]
                    }
                  },
                  "required": [
                    "success",
                    "code",
                    "message",
                    "data"
                  ]
                }
              }
            }
          }
        }
      }
    },
    "/v1/automations/runs/{runId}/cancel": {
      "post": {
        "tags": [
          "Automation"
        ],
        "description": "Cancel Delay Automation",
        "parameters": [
          {
            "schema": {
              "type": "string"
            },
            "required": true,
            "name": "runId",
            "in": "path"
          }
        ],
        "responses": {
          "200": {
            "description": "Cancel Delay Automation",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "success": {
                      "type": "boolean",
                      "description": "Request success flag",
                      "example": true
                    },
                    "code": {
                      "type": "number",
                      "description": "bika status code",
                      "example": 200
                    },
                    "message": {
                      "type": "string",
                      "description": "Response message",
                      "example": "SUCCESS"
                    },
                    "data": {
                      "type": "boolean"
                    }
                  },
                  "required": [
                    "success",
                    "code",
                    "message",
                    "data"
                  ]
                }
              }
            }
          }
        }
      }
    },
    "/v1/spaces/{spaceId}/resources/automations/{automationId}/triggers": {
      "get": {
        "tags": [
          "Automation"
        ],
        "description": "List Automation Triggers",
        "parameters": [
          {
            "schema": {
              "type": "string",
              "example": "spc***"
            },
            "required": true,
            "name": "spaceId",
            "in": "path"
          },
          {
            "schema": {
              "type": "string"
            },
            "required": true,
            "name": "automationId",
            "in": "path"
          }
        ],
        "responses": {
          "200": {
            "description": "List Automation Triggers",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "success": {
                      "type": "boolean",
                      "description": "Request success flag",
                      "example": true
                    },
                    "code": {
                      "type": "number",
                      "description": "bika status code",
                      "example": 200
                    },
                    "message": {
                      "type": "string",
                      "description": "Response message",
                      "example": "SUCCESS"
                    },
                    "data": {
                      "$ref": "#/components/schemas/AutomationTriggerVOArray"
                    }
                  },
                  "required": [
                    "success",
                    "code",
                    "message",
                    "data"
                  ]
                }
              }
            }
          }
        }
      }
    },
    "/v1/spaces": {
      "get": {
        "tags": [
          "Spaces"
        ],
        "description": "List Spaces",
        "responses": {
          "200": {
            "description": "Node",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "success": {
                      "type": "boolean",
                      "description": "Request success flag",
                      "example": true
                    },
                    "code": {
                      "type": "number",
                      "description": "bika status code",
                      "example": 200
                    },
                    "message": {
                      "type": "string",
                      "description": "Response message",
                      "example": "SUCCESS"
                    },
                    "data": {
                      "type": "array",
                      "items": {
                        "type": "object",
                        "properties": {
                          "id": {
                            "type": "string"
                          },
                          "name": {
                            "type": "string"
                          },
                          "createBy": {
                            "type": "string"
                          },
                          "createdAt": {
                            "type": "string"
                          },
                          "slug": {
                            "type": "string"
                          },
                          "logo": {
                            "oneOf": [
                              {
                                "type": "object",
                                "properties": {
                                  "type": {
                                    "type": "string",
                                    "enum": [
                                      "PRESET"
                                    ]
                                  },
                                  "url": {
                                    "type": "string"
                                  }
                                },
                                "required": [
                                  "type",
                                  "url"
                                ]
                              },
                              {
                                "type": "object",
                                "properties": {
                                  "type": {
                                    "type": "string",
                                    "enum": [
                                      "COLOR"
                                    ]
                                  },
                                  "color": {
                                    "type": "string"
                                  }
                                },
                                "required": [
                                  "type",
                                  "color"
                                ]
                              },
                              {
                                "type": "object",
                                "properties": {
                                  "type": {
                                    "type": "string",
                                    "enum": [
                                      "ATTACHMENT"
                                    ]
                                  },
                                  "attachmentId": {
                                    "type": "string"
                                  },
                                  "relativePath": {
                                    "type": "string"
                                  }
                                },
                                "required": [
                                  "type",
                                  "attachmentId",
                                  "relativePath"
                                ]
                              },
                              {
                                "type": "object",
                                "properties": {
                                  "type": {
                                    "type": "string",
                                    "enum": [
                                      "EMOJI"
                                    ]
                                  },
                                  "backgroundColor": {
                                    "type": "string"
                                  },
                                  "emoji": {
                                    "type": "string"
                                  }
                                },
                                "required": [
                                  "type",
                                  "emoji"
                                ]
                              },
                              {
                                "type": "object",
                                "properties": {
                                  "type": {
                                    "type": "string",
                                    "enum": [
                                      "AI"
                                    ]
                                  },
                                  "prompt": {
                                    "type": "string"
                                  },
                                  "attachmentId": {
                                    "type": "string"
                                  },
                                  "relativePath": {
                                    "type": "string"
                                  }
                                },
                                "required": [
                                  "type",
                                  "prompt",
                                  "attachmentId",
                                  "relativePath"
                                ]
                              },
                              {
                                "type": "object",
                                "properties": {
                                  "type": {
                                    "type": "string",
                                    "enum": [
                                      "UNSPLASH"
                                    ]
                                  },
                                  "url": {
                                    "type": "string",
                                    "format": "uri"
                                  },
                                  "downloadUrl": {
                                    "type": "string",
                                    "format": "uri"
                                  }
                                },
                                "required": [
                                  "type",
                                  "url"
                                ]
                              },
                              {
                                "type": "object",
                                "properties": {
                                  "type": {
                                    "type": "string",
                                    "enum": [
                                      "URL"
                                    ]
                                  },
                                  "url": {
                                    "type": "string"
                                  }
                                },
                                "required": [
                                  "type",
                                  "url"
                                ]
                              }
                            ]
                          },
                          "settings": {
                            "type": "object",
                            "properties": {
                              "announcement": {
                                "anyOf": [
                                  {
                                    "type": "string"
                                  },
                                  {
                                    "type": "object",
                                    "properties": {
                                      "en": {
                                        "type": "string"
                                      },
                                      "zh-CN": {
                                        "type": "string"
                                      },
                                      "zh-TW": {
                                        "type": "string"
                                      },
                                      "ja": {
                                        "type": "string"
                                      },
                                      "pt": {
                                        "type": "string"
                                      },
                                      "de": {
                                        "type": "string"
                                      }
                                    }
                                  }
                                ],
                                "description": "Announcement displayed on Dashboard homepage"
                              },
                              "watermark": {
                                "type": "boolean",
                                "description": "Watermark feature"
                              },
                              "allowEmailDomains": {
                                "type": "array",
                                "items": {
                                  "type": "string"
                                },
                                "description": "Enterprise email settings, if set, only these domains can join"
                              },
                              "joinPermission": {
                                "type": "string",
                                "enum": [
                                  "INVITE",
                                  "OPEN",
                                  "APPROVAL"
                                ]
                              },
                              "wallpaper": {
                                "oneOf": [
                                  {
                                    "type": "object",
                                    "properties": {
                                      "type": {
                                        "type": "string",
                                        "enum": [
                                          "PRESET"
                                        ]
                                      },
                                      "url": {
                                        "type": "string"
                                      }
                                    },
                                    "required": [
                                      "type",
                                      "url"
                                    ]
                                  },
                                  {
                                    "type": "object",
                                    "properties": {
                                      "type": {
                                        "type": "string",
                                        "enum": [
                                          "COLOR"
                                        ]
                                      },
                                      "color": {
                                        "type": "string"
                                      }
                                    },
                                    "required": [
                                      "type",
                                      "color"
                                    ]
                                  },
                                  {
                                    "type": "object",
                                    "properties": {
                                      "type": {
                                        "type": "string",
                                        "enum": [
                                          "ATTACHMENT"
                                        ]
                                      },
                                      "attachmentId": {
                                        "type": "string"
                                      },
                                      "relativePath": {
                                        "type": "string"
                                      }
                                    },
                                    "required": [
                                      "type",
                                      "attachmentId",
                                      "relativePath"
                                    ]
                                  },
                                  {
                                    "type": "object",
                                    "properties": {
                                      "type": {
                                        "type": "string",
                                        "enum": [
                                          "EMOJI"
                                        ]
                                      },
                                      "backgroundColor": {
                                        "type": "string"
                                      },
                                      "emoji": {
                                        "type": "string"
                                      }
                                    },
                                    "required": [
                                      "type",
                                      "emoji"
                                    ]
                                  },
                                  {
                                    "type": "object",
                                    "properties": {
                                      "type": {
                                        "type": "string",
                                        "enum": [
                                          "AI"
                                        ]
                                      },
                                      "prompt": {
                                        "type": "string"
                                      },
                                      "attachmentId": {
                                        "type": "string"
                                      },
                                      "relativePath": {
                                        "type": "string"
                                      }
                                    },
                                    "required": [
                                      "type",
                                      "prompt",
                                      "attachmentId",
                                      "relativePath"
                                    ]
                                  },
                                  {
                                    "type": "object",
                                    "properties": {
                                      "type": {
                                        "type": "string",
                                        "enum": [
                                          "UNSPLASH"
                                        ]
                                      },
                                      "url": {
                                        "type": "string",
                                        "format": "uri"
                                      },
                                      "downloadUrl": {
                                        "type": "string",
                                        "format": "uri"
                                      }
                                    },
                                    "required": [
                                      "type",
                                      "url"
                                    ]
                                  },
                                  {
                                    "type": "object",
                                    "properties": {
                                      "type": {
                                        "type": "string",
                                        "enum": [
                                          "URL"
                                        ]
                                      },
                                      "url": {
                                        "type": "string"
                                      }
                                    },
                                    "required": [
                                      "type",
                                      "url"
                                    ]
                                  }
                                ]
                              },
                              "onboardingStage": {
                                "type": "string",
                                "enum": [
                                  "DONE",
                                  "INIT",
                                  "UI",
                                  "AUTH",
                                  "TRIAL"
                                ],
                                "description": "Onboarding stage"
                              },
                              "onboardings": {
                                "type": "array",
                                "items": {
                                  "type": "string",
                                  "enum": [
                                    "INVITE_CODE",
                                    "INTRO_BILLING_PLAN",
                                    "ONBOARDING_TEMPLATES",
                                    "VIDEO_TUTORIAL"
                                  ]
                                }
                              },
                              "removeLogos": {
                                "type": "boolean",
                                "description": "Whether to remove logos in forms, public pages, etc. Premium enterprise feature"
                              },
                              "virtualMissionFilters": {
                                "type": "array",
                                "items": {
                                  "oneOf": [
                                    {
                                      "type": "object",
                                      "properties": {
                                        "type": {
                                          "type": "string",
                                          "enum": [
                                            "DATABASE_RECORD"
                                          ]
                                        },
                                        "databaseId": {
                                          "type": "string"
                                        },
                                        "filters": {
                                          "type": "object",
                                          "additionalProperties": {
                                            "nullable": true
                                          }
                                        },
                                        "memberFieldId": {
                                          "type": "string"
                                        }
                                      },
                                      "required": [
                                        "type",
                                        "databaseId",
                                        "filters",
                                        "memberFieldId"
                                      ]
                                    },
                                    {
                                      "type": "object",
                                      "properties": {
                                        "type": {
                                          "type": "string",
                                          "enum": [
                                            "OTHERS"
                                          ]
                                        }
                                      },
                                      "required": [
                                        "type"
                                      ]
                                    }
                                  ]
                                }
                              },
                              "enableMission": {
                                "type": "boolean",
                                "description": "Enable Mission feature"
                              },
                              "enableReport": {
                                "type": "boolean",
                                "description": "Enable Report feature"
                              },
                              "enableSmartSpaceLauncher": {
                                "type": "boolean",
                                "description": "Enable Smart Space Launcher feature"
                              },
                              "resourceGlobalDefaultPermission": {
                                "type": "string",
                                "nullable": true,
                                "enum": [
                                  "FULL_ACCESS",
                                  "CAN_EDIT",
                                  "CAN_EDIT_CONTENT",
                                  "CAN_COMMENT",
                                  "CAN_VIEW",
                                  "NO_ACCESS"
                                ]
                              }
                            },
                            "description": "Space additional settings"
                          },
                          "owner": {
                            "type": "string",
                            "description": "Space owner user ID"
                          }
                        },
                        "required": [
                          "id",
                          "name",
                          "logo",
                          "settings"
                        ]
                      }
                    }
                  },
                  "required": [
                    "success",
                    "code",
                    "message",
                    "data"
                  ]
                }
              }
            }
          }
        }
      }
    },
    "/v1/spaces/{spaceId}": {
      "get": {
        "tags": [
          "Spaces"
        ],
        "description": "Get Space",
        "parameters": [
          {
            "schema": {
              "type": "string"
            },
            "required": true,
            "name": "spaceId",
            "in": "path"
          }
        ],
        "responses": {
          "200": {
            "description": "Node",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "success": {
                      "type": "boolean",
                      "description": "Request success flag",
                      "example": true
                    },
                    "code": {
                      "type": "number",
                      "description": "bika status code",
                      "example": 200
                    },
                    "message": {
                      "type": "string",
                      "description": "Response message",
                      "example": "SUCCESS"
                    },
                    "data": {
                      "type": "object",
                      "properties": {
                        "id": {
                          "type": "string"
                        },
                        "name": {
                          "type": "string"
                        },
                        "createBy": {
                          "type": "string"
                        },
                        "createdAt": {
                          "type": "string"
                        },
                        "slug": {
                          "type": "string"
                        },
                        "logo": {
                          "oneOf": [
                            {
                              "type": "object",
                              "properties": {
                                "type": {
                                  "type": "string",
                                  "enum": [
                                    "PRESET"
                                  ]
                                },
                                "url": {
                                  "type": "string"
                                }
                              },
                              "required": [
                                "type",
                                "url"
                              ]
                            },
                            {
                              "type": "object",
                              "properties": {
                                "type": {
                                  "type": "string",
                                  "enum": [
                                    "COLOR"
                                  ]
                                },
                                "color": {
                                  "type": "string"
                                }
                              },
                              "required": [
                                "type",
                                "color"
                              ]
                            },
                            {
                              "type": "object",
                              "properties": {
                                "type": {
                                  "type": "string",
                                  "enum": [
                                    "ATTACHMENT"
                                  ]
                                },
                                "attachmentId": {
                                  "type": "string"
                                },
                                "relativePath": {
                                  "type": "string"
                                }
                              },
                              "required": [
                                "type",
                                "attachmentId",
                                "relativePath"
                              ]
                            },
                            {
                              "type": "object",
                              "properties": {
                                "type": {
                                  "type": "string",
                                  "enum": [
                                    "EMOJI"
                                  ]
                                },
                                "backgroundColor": {
                                  "type": "string"
                                },
                                "emoji": {
                                  "type": "string"
                                }
                              },
                              "required": [
                                "type",
                                "emoji"
                              ]
                            },
                            {
                              "type": "object",
                              "properties": {
                                "type": {
                                  "type": "string",
                                  "enum": [
                                    "AI"
                                  ]
                                },
                                "prompt": {
                                  "type": "string"
                                },
                                "attachmentId": {
                                  "type": "string"
                                },
                                "relativePath": {
                                  "type": "string"
                                }
                              },
                              "required": [
                                "type",
                                "prompt",
                                "attachmentId",
                                "relativePath"
                              ]
                            },
                            {
                              "type": "object",
                              "properties": {
                                "type": {
                                  "type": "string",
                                  "enum": [
                                    "UNSPLASH"
                                  ]
                                },
                                "url": {
                                  "type": "string",
                                  "format": "uri"
                                },
                                "downloadUrl": {
                                  "type": "string",
                                  "format": "uri"
                                }
                              },
                              "required": [
                                "type",
                                "url"
                              ]
                            },
                            {
                              "type": "object",
                              "properties": {
                                "type": {
                                  "type": "string",
                                  "enum": [
                                    "URL"
                                  ]
                                },
                                "url": {
                                  "type": "string"
                                }
                              },
                              "required": [
                                "type",
                                "url"
                              ]
                            }
                          ]
                        },
                        "settings": {
                          "type": "object",
                          "properties": {
                            "announcement": {
                              "anyOf": [
                                {
                                  "type": "string"
                                },
                                {
                                  "type": "object",
                                  "properties": {
                                    "en": {
                                      "type": "string"
                                    },
                                    "zh-CN": {
                                      "type": "string"
                                    },
                                    "zh-TW": {
                                      "type": "string"
                                    },
                                    "ja": {
                                      "type": "string"
                                    },
                                    "pt": {
                                      "type": "string"
                                    },
                                    "de": {
                                      "type": "string"
                                    }
                                  }
                                }
                              ],
                              "description": "Announcement displayed on Dashboard homepage"
                            },
                            "watermark": {
                              "type": "boolean",
                              "description": "Watermark feature"
                            },
                            "allowEmailDomains": {
                              "type": "array",
                              "items": {
                                "type": "string"
                              },
                              "description": "Enterprise email settings, if set, only these domains can join"
                            },
                            "joinPermission": {
                              "type": "string",
                              "enum": [
                                "INVITE",
                                "OPEN",
                                "APPROVAL"
                              ]
                            },
                            "wallpaper": {
                              "oneOf": [
                                {
                                  "type": "object",
                                  "properties": {
                                    "type": {
                                      "type": "string",
                                      "enum": [
                                        "PRESET"
                                      ]
                                    },
                                    "url": {
                                      "type": "string"
                                    }
                                  },
                                  "required": [
                                    "type",
                                    "url"
                                  ]
                                },
                                {
                                  "type": "object",
                                  "properties": {
                                    "type": {
                                      "type": "string",
                                      "enum": [
                                        "COLOR"
                                      ]
                                    },
                                    "color": {
                                      "type": "string"
                                    }
                                  },
                                  "required": [
                                    "type",
                                    "color"
                                  ]
                                },
                                {
                                  "type": "object",
                                  "properties": {
                                    "type": {
                                      "type": "string",
                                      "enum": [
                                        "ATTACHMENT"
                                      ]
                                    },
                                    "attachmentId": {
                                      "type": "string"
                                    },
                                    "relativePath": {
                                      "type": "string"
                                    }
                                  },
                                  "required": [
                                    "type",
                                    "attachmentId",
                                    "relativePath"
                                  ]
                                },
                                {
                                  "type": "object",
                                  "properties": {
                                    "type": {
                                      "type": "string",
                                      "enum": [
                                        "EMOJI"
                                      ]
                                    },
                                    "backgroundColor": {
                                      "type": "string"
                                    },
                                    "emoji": {
                                      "type": "string"
                                    }
                                  },
                                  "required": [
                                    "type",
                                    "emoji"
                                  ]
                                },
                                {
                                  "type": "object",
                                  "properties": {
                                    "type": {
                                      "type": "string",
                                      "enum": [
                                        "AI"
                                      ]
                                    },
                                    "prompt": {
                                      "type": "string"
                                    },
                                    "attachmentId": {
                                      "type": "string"
                                    },
                                    "relativePath": {
                                      "type": "string"
                                    }
                                  },
                                  "required": [
                                    "type",
                                    "prompt",
                                    "attachmentId",
                                    "relativePath"
                                  ]
                                },
                                {
                                  "type": "object",
                                  "properties": {
                                    "type": {
                                      "type": "string",
                                      "enum": [
                                        "UNSPLASH"
                                      ]
                                    },
                                    "url": {
                                      "type": "string",
                                      "format": "uri"
                                    },
                                    "downloadUrl": {
                                      "type": "string",
                                      "format": "uri"
                                    }
                                  },
                                  "required": [
                                    "type",
                                    "url"
                                  ]
                                },
                                {
                                  "type": "object",
                                  "properties": {
                                    "type": {
                                      "type": "string",
                                      "enum": [
                                        "URL"
                                      ]
                                    },
                                    "url": {
                                      "type": "string"
                                    }
                                  },
                                  "required": [
                                    "type",
                                    "url"
                                  ]
                                }
                              ]
                            },
                            "onboardingStage": {
                              "type": "string",
                              "enum": [
                                "DONE",
                                "INIT",
                                "UI",
                                "AUTH",
                                "TRIAL"
                              ],
                              "description": "Onboarding stage"
                            },
                            "onboardings": {
                              "type": "array",
                              "items": {
                                "type": "string",
                                "enum": [
                                  "INVITE_CODE",
                                  "INTRO_BILLING_PLAN",
                                  "ONBOARDING_TEMPLATES",
                                  "VIDEO_TUTORIAL"
                                ]
                              }
                            },
                            "removeLogos": {
                              "type": "boolean",
                              "description": "Whether to remove logos in forms, public pages, etc. Premium enterprise feature"
                            },
                            "virtualMissionFilters": {
                              "type": "array",
                              "items": {
                                "oneOf": [
                                  {
                                    "type": "object",
                                    "properties": {
                                      "type": {
                                        "type": "string",
                                        "enum": [
                                          "DATABASE_RECORD"
                                        ]
                                      },
                                      "databaseId": {
                                        "type": "string"
                                      },
                                      "filters": {
                                        "type": "object",
                                        "additionalProperties": {
                                          "nullable": true
                                        }
                                      },
                                      "memberFieldId": {
                                        "type": "string"
                                      }
                                    },
                                    "required": [
                                      "type",
                                      "databaseId",
                                      "filters",
                                      "memberFieldId"
                                    ]
                                  },
                                  {
                                    "type": "object",
                                    "properties": {
                                      "type": {
                                        "type": "string",
                                        "enum": [
                                          "OTHERS"
                                        ]
                                      }
                                    },
                                    "required": [
                                      "type"
                                    ]
                                  }
                                ]
                              }
                            },
                            "enableMission": {
                              "type": "boolean",
                              "description": "Enable Mission feature"
                            },
                            "enableReport": {
                              "type": "boolean",
                              "description": "Enable Report feature"
                            },
                            "enableSmartSpaceLauncher": {
                              "type": "boolean",
                              "description": "Enable Smart Space Launcher feature"
                            },
                            "resourceGlobalDefaultPermission": {
                              "type": "string",
                              "nullable": true,
                              "enum": [
                                "FULL_ACCESS",
                                "CAN_EDIT",
                                "CAN_EDIT_CONTENT",
                                "CAN_COMMENT",
                                "CAN_VIEW",
                                "NO_ACCESS"
                              ]
                            }
                          },
                          "description": "Space additional settings"
                        },
                        "owner": {
                          "type": "string",
                          "description": "Space owner user ID"
                        }
                      },
                      "required": [
                        "id",
                        "name",
                        "logo",
                        "settings"
                      ]
                    }
                  },
                  "required": [
                    "success",
                    "code",
                    "message",
                    "data"
                  ]
                }
              }
            }
          }
        }
      }
    },
    "/v1/spaces/{spaceId}/embed-links": {
      "get": {
        "tags": [
          "Spaces"
        ],
        "description": "List Embedded Links",
        "parameters": [
          {
            "schema": {
              "type": "string",
              "example": "spc***"
            },
            "required": true,
            "name": "spaceId",
            "in": "path"
          }
        ],
        "responses": {
          "200": {
            "description": "Node",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "success": {
                      "type": "boolean",
                      "description": "Request success flag",
                      "example": true
                    },
                    "code": {
                      "type": "number",
                      "description": "bika status code",
                      "example": 200
                    },
                    "message": {
                      "type": "string",
                      "description": "Response message",
                      "example": "SUCCESS"
                    },
                    "data": {
                      "type": "array",
                      "items": {
                        "type": "object",
                        "properties": {
                          "id": {
                            "type": "string"
                          },
                          "objectType": {
                            "type": "string"
                          },
                          "objectId": {
                            "type": "string"
                          },
                          "url": {
                            "type": "string"
                          }
                        },
                        "required": [
                          "id",
                          "objectType",
                          "objectId",
                          "url"
                        ]
                      }
                    }
                  },
                  "required": [
                    "success",
                    "code",
                    "message",
                    "data"
                  ]
                }
              }
            }
          }
        }
      },
      "post": {
        "tags": [
          "Spaces"
        ],
        "description": "Create Embedded Links",
        "parameters": [
          {
            "schema": {
              "type": "string",
              "example": "spc***"
            },
            "required": true,
            "name": "spaceId",
            "in": "path"
          }
        ],
        "requestBody": {
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "objectType": {
                    "type": "string",
                    "enum": [
                      "NODE_RESOURCE"
                    ]
                  },
                  "objectId": {
                    "type": "string"
                  }
                },
                "required": [
                  "objectType",
                  "objectId"
                ]
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Node",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "success": {
                      "type": "boolean",
                      "description": "Request success flag",
                      "example": true
                    },
                    "code": {
                      "type": "number",
                      "description": "bika status code",
                      "example": 200
                    },
                    "message": {
                      "type": "string",
                      "description": "Response message",
                      "example": "SUCCESS"
                    },
                    "data": {
                      "type": "object",
                      "properties": {
                        "id": {
                          "type": "string"
                        },
                        "objectType": {
                          "type": "string"
                        },
                        "objectId": {
                          "type": "string"
                        },
                        "url": {
                          "type": "string"
                        }
                      },
                      "required": [
                        "id",
                        "objectType",
                        "objectId",
                        "url"
                      ]
                    }
                  },
                  "required": [
                    "success",
                    "code",
                    "message",
                    "data"
                  ]
                }
              }
            }
          }
        }
      }
    },
    "/v1/spaces/{spaceId}/embed-links/{embedLinkId}": {
      "delete": {
        "tags": [
          "Spaces"
        ],
        "description": "Delete Embedded Link",
        "parameters": [
          {
            "schema": {
              "type": "string",
              "example": "spc***"
            },
            "required": true,
            "name": "spaceId",
            "in": "path"
          },
          {
            "schema": {
              "type": "string"
            },
            "required": true,
            "name": "embedLinkId",
            "in": "path"
          }
        ],
        "responses": {
          "200": {
            "description": "Node",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "success": {
                      "type": "boolean",
                      "description": "Request success flag",
                      "example": true
                    },
                    "code": {
                      "type": "number",
                      "description": "bika status code",
                      "example": 200
                    },
                    "message": {
                      "type": "string",
                      "description": "Response message",
                      "example": "SUCCESS"
                    },
                    "data": {
                      "type": "boolean"
                    }
                  },
                  "required": [
                    "success",
                    "code",
                    "message",
                    "data"
                  ]
                }
              }
            }
          },
          "401": {
            "description": "Node",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "success": {
                      "type": "boolean",
                      "description": "Request success flag",
                      "example": true
                    },
                    "code": {
                      "type": "number",
                      "description": "bika status code",
                      "example": 200
                    },
                    "message": {
                      "type": "string",
                      "description": "Response message",
                      "example": "SUCCESS"
                    },
                    "data": {
                      "type": "object",
                      "properties": {}
                    }
                  },
                  "required": [
                    "success",
                    "code",
                    "message",
                    "data"
                  ]
                }
              }
            }
          }
        }
      }
    },
    "/v1/spaces/{spaceId}/attachments": {
      "post": {
        "tags": [
          "Spaces"
        ],
        "description": "Upload Attachment",
        "parameters": [
          {
            "schema": {
              "type": "string",
              "example": "spc***"
            },
            "required": true,
            "name": "spaceId",
            "in": "path"
          }
        ],
        "requestBody": {
          "content": {
            "multipart/form-data": {
              "schema": {
                "type": "object",
                "properties": {
                  "file": {
                    "anyOf": [
                      {
                        "type": "string",
                        "format": "binary"
                      },
                      {
                        "type": "array",
                        "items": {
                          "type": "string",
                          "format": "binary"
                        },
                        "maxItems": 3
                      }
                    ],
                    "description": "One file or up to 3 files"
                  }
                },
                "required": [
                  "file"
                ]
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Space Attachment",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "success": {
                      "type": "boolean",
                      "description": "Request success flag",
                      "example": true
                    },
                    "code": {
                      "type": "number",
                      "description": "bika status code",
                      "example": 200
                    },
                    "message": {
                      "type": "string",
                      "description": "Response message",
                      "example": "SUCCESS"
                    },
                    "data": {
                      "type": "array",
                      "items": {
                        "type": "object",
                        "properties": {
                          "id": {
                            "type": "string"
                          },
                          "name": {
                            "type": "string"
                          },
                          "path": {
                            "type": "string"
                          },
                          "bucket": {
                            "type": "string"
                          },
                          "mimeType": {
                            "type": "string"
                          },
                          "size": {
                            "type": "number"
                          },
                          "fileName": {
                            "type": "string",
                            "nullable": true
                          }
                        },
                        "required": [
                          "id",
                          "name",
                          "path",
                          "bucket",
                          "mimeType",
                          "size"
                        ]
                      }
                    }
                  },
                  "required": [
                    "success",
                    "code",
                    "message",
                    "data"
                  ]
                }
              }
            }
          }
        }
      }
    },
    "/v1/spaces/{spaceId}/nodes/{nodeId}": {
      "get": {
        "tags": [
          "Nodes"
        ],
        "description": "Get Node Resource",
        "parameters": [
          {
            "schema": {
              "type": "string",
              "example": "spc***"
            },
            "required": true,
            "name": "spaceId",
            "in": "path"
          },
          {
            "schema": {
              "type": "string",
              "example": "dat***"
            },
            "required": true,
            "name": "nodeId",
            "in": "path"
          }
        ],
        "responses": {
          "200": {
            "description": "Node",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/NodeTreeVOSchema"
                }
              }
            }
          }
        }
      }
    },
    "/v1/spaces/{spaceId}/nodes": {
      "get": {
        "tags": [
          "Nodes"
        ],
        "description": "List Node Resources",
        "parameters": [
          {
            "schema": {
              "type": "string",
              "example": "spc***"
            },
            "required": true,
            "name": "spaceId",
            "in": "path"
          }
        ],
        "responses": {
          "200": {
            "description": "Node Array",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/NodeTreeVOArraySchema"
                }
              }
            }
          }
        }
      }
    },
    "/v1/spaces/{spaceId}/roles": {
      "get": {
        "tags": [
          "Roles"
        ],
        "description": "List Roles",
        "parameters": [
          {
            "schema": {
              "type": "string",
              "example": "spc***"
            },
            "required": true,
            "name": "spaceId",
            "in": "path"
          },
          {
            "schema": {
              "type": "string"
            },
            "required": false,
            "name": "name",
            "in": "query"
          },
          {
            "schema": {
              "type": "string",
              "default": "createdAt"
            },
            "required": false,
            "name": "sort",
            "in": "query"
          },
          {
            "schema": {
              "type": "string"
            },
            "required": false,
            "name": "direction",
            "in": "query"
          },
          {
            "schema": {
              "type": "number",
              "minimum": 1,
              "default": 1
            },
            "required": false,
            "name": "pageNo",
            "in": "query"
          },
          {
            "schema": {
              "type": "number",
              "minimum": 1,
              "maximum": 100,
              "default": 27
            },
            "required": false,
            "name": "pageSize",
            "in": "query"
          }
        ],
        "responses": {
          "200": {
            "description": "Success Get Roles",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "success": {
                      "type": "boolean",
                      "description": "Request success flag",
                      "example": true
                    },
                    "code": {
                      "type": "number",
                      "description": "bika status code",
                      "example": 200
                    },
                    "message": {
                      "type": "string",
                      "description": "Response message",
                      "example": "SUCCESS"
                    },
                    "data": {
                      "$ref": "#/components/schemas/RolePaginationVO"
                    }
                  },
                  "required": [
                    "success",
                    "code",
                    "message",
                    "data"
                  ]
                }
              }
            }
          }
        }
      },
      "post": {
        "tags": [
          "Roles"
        ],
        "description": "Create Role",
        "parameters": [
          {
            "schema": {
              "type": "string",
              "example": "spc***"
            },
            "required": true,
            "name": "spaceId",
            "in": "path"
          }
        ],
        "requestBody": {
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
                  "manageSpace": {
                    "type": "boolean",
                    "default": false
                  },
                  "permissions": {
                    "type": "array",
                    "items": {
                      "anyOf": [
                        {
                          "type": "string",
                          "enum": [
                            "member"
                          ]
                        },
                        {
                          "type": "string",
                          "enum": [
                            "team"
                          ]
                        },
                        {
                          "type": "string",
                          "enum": [
                            "role"
                          ]
                        },
                        {
                          "type": "string",
                          "enum": [
                            "resource"
                          ]
                        },
                        {
                          "type": "string",
                          "enum": [
                            "integration"
                          ]
                        },
                        {
                          "type": "string",
                          "enum": [
                            "template"
                          ]
                        },
                        {
                          "type": "string",
                          "enum": [
                            "security"
                          ]
                        },
                        {
                          "type": "string",
                          "enum": [
                            "publish"
                          ]
                        }
                      ]
                    }
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
          "201": {
            "description": "Success Create Role",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "success": {
                      "type": "boolean",
                      "description": "Request success flag",
                      "example": true
                    },
                    "code": {
                      "type": "number",
                      "description": "bika status code",
                      "example": 200
                    },
                    "message": {
                      "type": "string",
                      "description": "Response message",
                      "example": "SUCCESS"
                    },
                    "data": {
                      "$ref": "#/components/schemas/RoleVO"
                    }
                  },
                  "required": [
                    "success",
                    "code",
                    "message",
                    "data"
                  ]
                }
              }
            }
          }
        }
      }
    },
    "/v1/spaces/{spaceId}/roles/{roleId}": {
      "put": {
        "tags": [
          "Roles"
        ],
        "description": "Create Role",
        "parameters": [
          {
            "schema": {
              "type": "string",
              "example": "spc***"
            },
            "required": true,
            "name": "spaceId",
            "in": "path"
          },
          {
            "schema": {
              "type": "string"
            },
            "required": true,
            "name": "roleId",
            "in": "path"
          }
        ],
        "requestBody": {
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "name": {
                    "type": "string"
                  },
                  "manageSpace": {
                    "type": "boolean"
                  },
                  "permissions": {
                    "type": "array",
                    "items": {
                      "anyOf": [
                        {
                          "type": "string",
                          "enum": [
                            "member"
                          ]
                        },
                        {
                          "type": "string",
                          "enum": [
                            "team"
                          ]
                        },
                        {
                          "type": "string",
                          "enum": [
                            "role"
                          ]
                        },
                        {
                          "type": "string",
                          "enum": [
                            "resource"
                          ]
                        },
                        {
                          "type": "string",
                          "enum": [
                            "integration"
                          ]
                        },
                        {
                          "type": "string",
                          "enum": [
                            "template"
                          ]
                        },
                        {
                          "type": "string",
                          "enum": [
                            "security"
                          ]
                        },
                        {
                          "type": "string",
                          "enum": [
                            "publish"
                          ]
                        }
                      ]
                    }
                  }
                }
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Success Update Role",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "success": {
                      "type": "boolean",
                      "description": "Request success flag",
                      "example": true
                    },
                    "code": {
                      "type": "number",
                      "description": "bika status code",
                      "example": 200
                    },
                    "message": {
                      "type": "string",
                      "description": "Response message",
                      "example": "SUCCESS"
                    },
                    "data": {
                      "$ref": "#/components/schemas/RoleVO"
                    }
                  },
                  "required": [
                    "success",
                    "code",
                    "message",
                    "data"
                  ]
                }
              }
            }
          }
        }
      },
      "delete": {
        "tags": [
          "Roles"
        ],
        "description": "Delete Role",
        "parameters": [
          {
            "schema": {
              "type": "string",
              "example": "spc***"
            },
            "required": true,
            "name": "spaceId",
            "in": "path"
          },
          {
            "schema": {
              "type": "string"
            },
            "required": true,
            "name": "roleId",
            "in": "path"
          }
        ],
        "responses": {
          "200": {
            "description": "Success Delete Role",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "success": {
                      "type": "boolean",
                      "description": "Request success flag",
                      "example": true
                    },
                    "code": {
                      "type": "number",
                      "description": "bika status code",
                      "example": 200
                    },
                    "message": {
                      "type": "string",
                      "description": "Response message",
                      "example": "SUCCESS"
                    },
                    "data": {
                      "type": "object",
                      "properties": {}
                    }
                  },
                  "required": [
                    "success",
                    "code",
                    "message"
                  ]
                }
              }
            }
          }
        }
      }
    },
    "/v1/spaces/{spaceId}/teams": {
      "get": {
        "tags": [
          "Teams"
        ],
        "description": "List Teams",
        "parameters": [
          {
            "schema": {
              "type": "string",
              "example": "spc***"
            },
            "required": true,
            "name": "spaceId",
            "in": "path"
          },
          {
            "schema": {
              "type": "number",
              "minimum": 1,
              "default": 1
            },
            "required": false,
            "name": "pageNo",
            "in": "query"
          },
          {
            "schema": {
              "type": "number",
              "minimum": 1,
              "maximum": 100,
              "default": 27
            },
            "required": false,
            "name": "pageSize",
            "in": "query"
          },
          {
            "schema": {
              "type": "string",
              "description": "Parent Team Id, empty means to get the sub teams of root"
            },
            "required": false,
            "description": "Parent Team Id, empty means to get the sub teams of root",
            "name": "parentTeamId",
            "in": "query"
          }
        ],
        "responses": {
          "200": {
            "description": "Success List Sub Teams",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "success": {
                      "type": "boolean",
                      "description": "Request success flag",
                      "example": true
                    },
                    "code": {
                      "type": "number",
                      "description": "bika status code",
                      "example": 200
                    },
                    "message": {
                      "type": "string",
                      "description": "Response message",
                      "example": "SUCCESS"
                    },
                    "data": {
                      "$ref": "#/components/schemas/TeamPaginationVO"
                    }
                  },
                  "required": [
                    "success",
                    "code",
                    "message",
                    "data"
                  ]
                }
              }
            }
          }
        }
      },
      "post": {
        "tags": [
          "Teams"
        ],
        "description": "Create a Team",
        "parameters": [
          {
            "schema": {
              "type": "string",
              "example": "spc***"
            },
            "required": true,
            "name": "spaceId",
            "in": "path"
          }
        ],
        "requestBody": {
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "parentTeamId": {
                    "type": "string",
                    "description": "Parent Team Id, for openapi, empty string means to create a root team"
                  },
                  "name": {
                    "type": "string"
                  }
                },
                "required": [
                  "parentTeamId",
                  "name"
                ]
              }
            }
          }
        },
        "responses": {
          "201": {
            "description": "Success Create a Team",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "success": {
                      "type": "boolean",
                      "description": "Request success flag",
                      "example": true
                    },
                    "code": {
                      "type": "number",
                      "description": "bika status code",
                      "example": 200
                    },
                    "message": {
                      "type": "string",
                      "description": "Response message",
                      "example": "SUCCESS"
                    },
                    "data": {
                      "$ref": "#/components/schemas/TeamVO"
                    }
                  },
                  "required": [
                    "success",
                    "code",
                    "message",
                    "data"
                  ]
                }
              }
            }
          }
        }
      }
    },
    "/v1/spaces/{spaceId}/teams/{teamId}/members": {
      "get": {
        "tags": [
          "Teams"
        ],
        "description": "List Team Members",
        "parameters": [
          {
            "schema": {
              "type": "string",
              "example": "spc***"
            },
            "required": true,
            "name": "spaceId",
            "in": "path"
          },
          {
            "schema": {
              "type": "string",
              "description": "Team Id"
            },
            "required": true,
            "description": "Team Id",
            "name": "teamId",
            "in": "path"
          },
          {
            "schema": {
              "type": "number",
              "minimum": 1,
              "default": 1
            },
            "required": false,
            "name": "pageNo",
            "in": "query"
          },
          {
            "schema": {
              "type": "number",
              "minimum": 1,
              "maximum": 100,
              "default": 27
            },
            "required": false,
            "name": "pageSize",
            "in": "query"
          }
        ],
        "responses": {
          "200": {
            "description": "Success List Team Members",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "success": {
                      "type": "boolean",
                      "description": "Request success flag",
                      "example": true
                    },
                    "code": {
                      "type": "number",
                      "description": "bika status code",
                      "example": 200
                    },
                    "message": {
                      "type": "string",
                      "description": "Response message",
                      "example": "SUCCESS"
                    },
                    "data": {
                      "$ref": "#/components/schemas/MemberPaginationVO"
                    }
                  },
                  "required": [
                    "success",
                    "code",
                    "message",
                    "data"
                  ]
                }
              }
            }
          }
        }
      }
    },
    "/v1/spaces/{spaceId}/teams/{teamId}": {
      "put": {
        "tags": [
          "Teams"
        ],
        "description": "Update a Team",
        "parameters": [
          {
            "schema": {
              "type": "string",
              "example": "spc***"
            },
            "required": true,
            "name": "spaceId",
            "in": "path"
          },
          {
            "schema": {
              "type": "string",
              "description": "Team Id"
            },
            "required": true,
            "description": "Team Id",
            "name": "teamId",
            "in": "path"
          }
        ],
        "requestBody": {
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "name": {
                    "type": "string"
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
            "description": "Success Update a Team",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "success": {
                      "type": "boolean",
                      "description": "Request success flag",
                      "example": true
                    },
                    "code": {
                      "type": "number",
                      "description": "bika status code",
                      "example": 200
                    },
                    "message": {
                      "type": "string",
                      "description": "Response message",
                      "example": "SUCCESS"
                    },
                    "data": {
                      "$ref": "#/components/schemas/TeamVO"
                    }
                  },
                  "required": [
                    "success",
                    "code",
                    "message",
                    "data"
                  ]
                }
              }
            }
          }
        }
      },
      "delete": {
        "tags": [
          "Teams"
        ],
        "description": "Delete a Team",
        "parameters": [
          {
            "schema": {
              "type": "string",
              "example": "spc***"
            },
            "required": true,
            "name": "spaceId",
            "in": "path"
          },
          {
            "schema": {
              "type": "string",
              "description": "Team Id"
            },
            "required": true,
            "description": "Team Id",
            "name": "teamId",
            "in": "path"
          }
        ],
        "responses": {
          "200": {
            "description": "Success Delete a Team",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "success": {
                      "type": "boolean",
                      "description": "Request success flag",
                      "example": true
                    },
                    "code": {
                      "type": "number",
                      "description": "bika status code",
                      "example": 200
                    },
                    "message": {
                      "type": "string",
                      "description": "Response message",
                      "example": "SUCCESS"
                    },
                    "data": {
                      "type": "object",
                      "properties": {}
                    }
                  },
                  "required": [
                    "success",
                    "code",
                    "message",
                    "data"
                  ]
                }
              }
            }
          }
        }
      }
    },
    "/v1/spaces/{spaceId}/members/{memberId}": {
      "get": {
        "tags": [
          "Members"
        ],
        "description": "Get Member",
        "parameters": [
          {
            "schema": {
              "type": "string",
              "example": "spc***"
            },
            "required": true,
            "name": "spaceId",
            "in": "path"
          },
          {
            "schema": {
              "type": "string",
              "description": "Member Id"
            },
            "required": true,
            "description": "Member Id",
            "name": "memberId",
            "in": "path"
          }
        ],
        "responses": {
          "200": {
            "description": "Success Get Member",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/MemberVOSchema"
                }
              }
            }
          }
        }
      },
      "put": {
        "tags": [
          "Members"
        ],
        "description": "Update Member",
        "parameters": [
          {
            "schema": {
              "type": "string",
              "example": "spc***"
            },
            "required": true,
            "name": "spaceId",
            "in": "path"
          },
          {
            "schema": {
              "type": "string",
              "description": "Member Id"
            },
            "required": true,
            "description": "Member Id",
            "name": "memberId",
            "in": "path"
          }
        ],
        "requestBody": {
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "name": {
                    "type": "string",
                    "description": "Member name"
                  },
                  "teamIds": {
                    "type": "array",
                    "items": {
                      "type": "string"
                    },
                    "description": "List of team IDs"
                  },
                  "roleIds": {
                    "type": "array",
                    "items": {
                      "type": "string"
                    },
                    "description": "List of role IDs"
                  }
                }
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Success Update Member",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "success": {
                      "type": "boolean",
                      "description": "Request success flag",
                      "example": true
                    },
                    "code": {
                      "type": "number",
                      "description": "bika status code",
                      "example": 200
                    },
                    "message": {
                      "type": "string",
                      "description": "Response message",
                      "example": "SUCCESS"
                    },
                    "data": {
                      "type": "object",
                      "properties": {
                        "id": {
                          "type": "string"
                        },
                        "templateId": {
                          "type": "string",
                          "nullable": true
                        },
                        "name": {
                          "type": "string"
                        },
                        "createdAt": {
                          "type": "string"
                        },
                        "deleted": {
                          "type": "boolean"
                        },
                        "type": {
                          "type": "string",
                          "enum": [
                            "Member"
                          ]
                        },
                        "userId": {
                          "type": "string"
                        },
                        "email": {
                          "type": "string",
                          "nullable": true
                        },
                        "avatar": {
                          "oneOf": [
                            {
                              "type": "object",
                              "properties": {
                                "type": {
                                  "type": "string",
                                  "enum": [
                                    "PRESET"
                                  ]
                                },
                                "url": {
                                  "type": "string"
                                }
                              },
                              "required": [
                                "type",
                                "url"
                              ]
                            },
                            {
                              "type": "object",
                              "properties": {
                                "type": {
                                  "type": "string",
                                  "enum": [
                                    "COLOR"
                                  ]
                                },
                                "color": {
                                  "type": "string"
                                }
                              },
                              "required": [
                                "type",
                                "color"
                              ]
                            },
                            {
                              "type": "object",
                              "properties": {
                                "type": {
                                  "type": "string",
                                  "enum": [
                                    "ATTACHMENT"
                                  ]
                                },
                                "attachmentId": {
                                  "type": "string"
                                },
                                "relativePath": {
                                  "type": "string"
                                }
                              },
                              "required": [
                                "type",
                                "attachmentId",
                                "relativePath"
                              ]
                            },
                            {
                              "type": "object",
                              "properties": {
                                "type": {
                                  "type": "string",
                                  "enum": [
                                    "EMOJI"
                                  ]
                                },
                                "backgroundColor": {
                                  "type": "string"
                                },
                                "emoji": {
                                  "type": "string"
                                }
                              },
                              "required": [
                                "type",
                                "emoji"
                              ]
                            },
                            {
                              "type": "object",
                              "properties": {
                                "type": {
                                  "type": "string",
                                  "enum": [
                                    "AI"
                                  ]
                                },
                                "prompt": {
                                  "type": "string"
                                },
                                "attachmentId": {
                                  "type": "string"
                                },
                                "relativePath": {
                                  "type": "string"
                                }
                              },
                              "required": [
                                "type",
                                "prompt",
                                "attachmentId",
                                "relativePath"
                              ]
                            },
                            {
                              "type": "object",
                              "properties": {
                                "type": {
                                  "type": "string",
                                  "enum": [
                                    "UNSPLASH"
                                  ]
                                },
                                "url": {
                                  "type": "string",
                                  "format": "uri"
                                },
                                "downloadUrl": {
                                  "type": "string",
                                  "format": "uri"
                                }
                              },
                              "required": [
                                "type",
                                "url"
                              ]
                            },
                            {
                              "type": "object",
                              "properties": {
                                "type": {
                                  "type": "string",
                                  "enum": [
                                    "URL"
                                  ]
                                },
                                "url": {
                                  "type": "string"
                                }
                              },
                              "required": [
                                "type",
                                "url"
                              ]
                            }
                          ]
                        },
                        "nickName": {
                          "type": "string"
                        },
                        "isGuest": {
                          "type": "boolean"
                        },
                        "isSpaceOwner": {
                          "type": "boolean"
                        },
                        "relationType": {
                          "type": "string",
                          "enum": [
                            "USER",
                            "AI"
                          ]
                        }
                      },
                      "required": [
                        "id",
                        "name",
                        "type",
                        "userId",
                        "email",
                        "isGuest",
                        "relationType"
                      ]
                    }
                  },
                  "required": [
                    "success",
                    "code",
                    "message",
                    "data"
                  ]
                }
              }
            }
          }
        }
      },
      "delete": {
        "tags": [
          "Members"
        ],
        "description": "Delete Member",
        "parameters": [
          {
            "schema": {
              "type": "string",
              "example": "spc***"
            },
            "required": true,
            "name": "spaceId",
            "in": "path"
          },
          {
            "schema": {
              "type": "string",
              "description": "Member Id"
            },
            "required": true,
            "description": "Member Id",
            "name": "memberId",
            "in": "path"
          }
        ],
        "responses": {
          "200": {
            "description": "Success Delete Member",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "success": {
                      "type": "boolean",
                      "description": "Request success flag",
                      "example": true
                    },
                    "code": {
                      "type": "number",
                      "description": "bika status code",
                      "example": 200
                    },
                    "message": {
                      "type": "string",
                      "description": "Response message",
                      "example": "SUCCESS"
                    },
                    "data": {
                      "type": "object",
                      "properties": {}
                    }
                  },
                  "required": [
                    "success",
                    "code",
                    "message",
                    "data"
                  ]
                }
              }
            }
          }
        }
      }
    },
    "/v1/spaces/{spaceId}/resources/databases/{databaseId}": {
      "get": {
        "tags": [
          "Databases"
        ],
        "description": "Get Database",
        "parameters": [
          {
            "schema": {
              "type": "string",
              "example": "spc***"
            },
            "required": true,
            "name": "spaceId",
            "in": "path"
          },
          {
            "schema": {
              "type": "string",
              "example": "dat***"
            },
            "required": true,
            "name": "databaseId",
            "in": "path"
          }
        ],
        "responses": {
          "200": {
            "description": "Create Database Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/DatabaseVOSchema"
                }
              }
            }
          }
        }
      }
    },
    "/v1/spaces/{spaceId}/resources/databases/{databaseId}/fields": {
      "get": {
        "tags": [
          "Databases"
        ],
        "description": "Get Database Fields",
        "parameters": [
          {
            "schema": {
              "type": "string",
              "example": "spc***"
            },
            "required": true,
            "name": "spaceId",
            "in": "path"
          },
          {
            "schema": {
              "type": "string",
              "example": "dat***"
            },
            "required": true,
            "name": "databaseId",
            "in": "path"
          }
        ],
        "responses": {
          "200": {
            "description": "Database Field Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/FieldVOSchemaArray"
                }
              }
            }
          }
        }
      }
    },
    "/v1/spaces/{spaceId}/resources/databases/{databaseId}/views": {
      "get": {
        "tags": [
          "Databases"
        ],
        "description": "Get Database Views",
        "parameters": [
          {
            "schema": {
              "type": "string",
              "example": "spc***"
            },
            "required": true,
            "name": "spaceId",
            "in": "path"
          },
          {
            "schema": {
              "type": "string",
              "example": "dat***"
            },
            "required": true,
            "name": "databaseId",
            "in": "path"
          }
        ],
        "responses": {
          "200": {
            "description": "Database View VO Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/ViewVOSchema.array()"
                }
              }
            }
          }
        }
      }
    },
    "/v2/spaces/{spaceId}/resources/databases/{databaseId}/records": {
      "get": {
        "tags": [
          "Databases v2"
        ],
        "operationId": "List Records",
        "description": "List Records",
        "parameters": [
          {
            "schema": {
              "type": "string",
              "example": "spc***"
            },
            "required": true,
            "name": "spaceId",
            "in": "path"
          },
          {
            "schema": {
              "type": "string",
              "example": "dat***"
            },
            "required": true,
            "name": "databaseId",
            "in": "path"
          },
          {
            "schema": {
              "type": "string",
              "example": "Asia/Shanghai",
              "description": "(Optional) The time zone that should be used to format dates when using <strong>cellFormat=string.</strong><br> This parameter is required when using <strong>cellFormat=string.</strong><br>this parameter must be encoded before passing it as a value. <br>For example, <strong>Asia/Shanghai</strong> should be encoded as <strong>Asia%2FShanghai</strong>."
            },
            "required": false,
            "description": "(Optional) The time zone that should be used to format dates when using <strong>cellFormat=string.</strong><br> This parameter is required when using <strong>cellFormat=string.</strong><br>this parameter must be encoded before passing it as a value. <br>For example, <strong>Asia/Shanghai</strong> should be encoded as <strong>Asia%2FShanghai</strong>.",
            "name": "timeZone",
            "in": "query"
          },
          {
            "schema": {
              "type": "string",
              "enum": [
                "en",
                "zh-CN",
                "zh-TW",
                "ja",
                "pt",
                "de"
              ],
              "example": "en",
              "description": "(Optional) The user locale that should be used to format dates when using <strong>cellFormat=string.</strong> <br>This parameter is required when using <strong>cellFormat=string.</strong>"
            },
            "required": false,
            "description": "(Optional) The user locale that should be used to format dates when using <strong>cellFormat=string.</strong> <br>This parameter is required when using <strong>cellFormat=string.</strong>",
            "name": "userLocale",
            "in": "query"
          },
          {
            "schema": {
              "type": "string",
              "description": "(Optional) Use the offset from the previous request to fetch the next page of records. <br>If not set, the first page of records will be returned."
            },
            "required": false,
            "description": "(Optional) Use the offset from the previous request to fetch the next page of records. <br>If not set, the first page of records will be returned.",
            "name": "offset",
            "in": "query"
          },
          {
            "schema": {
              "type": "number",
              "example": 100,
              "description": "(Optional) Specifies the page number of the pagination, default is 100,<br>used in conjunction with the parameter <strong>pageSize</strong>."
            },
            "required": false,
            "description": "(Optional) Specifies the page number of the pagination, default is 100,<br>used in conjunction with the parameter <strong>pageSize</strong>.",
            "name": "pageSize",
            "in": "query"
          },
          {
            "schema": {
              "type": "number",
              "example": 300,
              "description": "(Optional) Limits the total number of records returned.<br>If the value is less than the actual total number of records in the database,<br>the database number of records returned will be limited to that value."
            },
            "required": false,
            "description": "(Optional) Limits the total number of records returned.<br>If the value is less than the actual total number of records in the database,<br>the database number of records returned will be limited to that value.",
            "name": "maxRecords",
            "in": "query"
          },
          {
            "schema": {
              "type": "array",
              "items": {
                "type": "string"
              },
              "example": [
                "field1",
                "field2"
              ],
              "description": "(Optional) Specify which fields to return in the records.<br>If this parameter is included, only the specified fields will be returned in the records."
            },
            "required": false,
            "description": "(Optional) Specify which fields to return in the records.<br>If this parameter is included, only the specified fields will be returned in the records.",
            "name": "fields",
            "in": "query",
            "style": "form",
            "explode": true
          },
          {
            "schema": {
              "type": "string",
              "example": "field1==\"value1\";field2>10",
              "description": "(Optional) Use the grammar as a filter condition to return matching records,<br>the filter must be encoded first before passing it as a value.<br>For example, <strong>field1==\"value1\";field2>10</strong> should be encoded as <strong>field1%3D%3D%22value1%22%3Bfield2%3E10</strong>.<br>please access help document <a target=\"_blank\" href=\"https://bika.ai/help/guide/developer/filter-query-language\">Filter Query Language</a> understanding how the grammar is used."
            },
            "required": false,
            "description": "(Optional) Use the grammar as a filter condition to return matching records,<br>the filter must be encoded first before passing it as a value.<br>For example, <strong>field1==\"value1\";field2>10</strong> should be encoded as <strong>field1%3D%3D%22value1%22%3Bfield2%3E10</strong>.<br>please access help document <a target=\"_blank\" href=\"https://bika.ai/help/guide/developer/filter-query-language\">Filter Query Language</a> understanding how the grammar is used.",
            "name": "filter",
            "in": "query"
          },
          {
            "schema": {
              "type": "array",
              "items": {
                "type": "object",
                "properties": {
                  "field": {
                    "type": "string",
                    "description": "The field to sort by"
                  },
                  "order": {
                    "type": "string",
                    "enum": [
                      "asc",
                      "desc"
                    ],
                    "description": "The order to sort by, either ascending (<strong>asc</strong>) or descending (<strong>desc</strong>)"
                  }
                }
              },
              "description": "(Optional) Sorts the records in the specified database.An array of multiple sort objects.<br>Supports order: \"asc\" and reverse order: \"desc\". <br>Note: The sort condition specified by this parameter will override the sort condition in the view.<br>eg: <strong>sort[0][field]=field1&sort[0][order]=asc&sort[1][field]=field2&sort[1][order]=desc</strong>"
            },
            "required": false,
            "description": "(Optional) Sorts the records in the specified database.An array of multiple sort objects.<br>Supports order: \"asc\" and reverse order: \"desc\". <br>Note: The sort condition specified by this parameter will override the sort condition in the view.<br>eg: <strong>sort[0][field]=field1&sort[0][order]=asc&sort[1][field]=field2&sort[1][order]=desc</strong>",
            "style": "deepObject",
            "explode": true,
            "name": "sort",
            "in": "query"
          },
          {
            "schema": {
              "type": "string",
              "example": "json",
              "description": "(Optional) The cellFormat parameter defines how cell values are returned:<br><strong>json</strong>: Returns structured data based on the field type (default).<br><strong>string</strong>: Returns user-friendly text; requires both timeZone and userLocale.<br>Note: The string format may change and should not be relied on for consistency.<br>More details about cellFormat can be found in the <a target=\"_blank\" href=\"https://bika.ai/help/guide/developer/cell-value\">Cell Value</a>."
            },
            "required": false,
            "description": "(Optional) The cellFormat parameter defines how cell values are returned:<br><strong>json</strong>: Returns structured data based on the field type (default).<br><strong>string</strong>: Returns user-friendly text; requires both timeZone and userLocale.<br>Note: The string format may change and should not be relied on for consistency.<br>More details about cellFormat can be found in the <a target=\"_blank\" href=\"https://bika.ai/help/guide/developer/cell-value\">Cell Value</a>.",
            "name": "cellFormat",
            "in": "query"
          },
          {
            "schema": {
              "type": "string",
              "example": "name",
              "description": "The fieldKey parameter specifies that let you return field objects where the key is:<br><strong>name</strong>: Uses the field name as the key (default).<br><strong>id</strong>: Uses the field ID as the key."
            },
            "required": false,
            "description": "The fieldKey parameter specifies that let you return field objects where the key is:<br><strong>name</strong>: Uses the field name as the key (default).<br><strong>id</strong>: Uses the field ID as the key.",
            "name": "fieldKey",
            "in": "query"
          }
        ],
        "responses": {
          "200": {
            "description": "List Records Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/RecordPageInfoResponse"
                }
              }
            }
          }
        }
      },
      "post": {
        "tags": [
          "Databases v2"
        ],
        "operationId": "Create Records",
        "description": "Create Records",
        "parameters": [
          {
            "schema": {
              "type": "string",
              "example": "spc***"
            },
            "required": true,
            "name": "spaceId",
            "in": "path"
          },
          {
            "schema": {
              "type": "string",
              "example": "dat***"
            },
            "required": true,
            "name": "databaseId",
            "in": "path"
          }
        ],
        "requestBody": {
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/CreateRecordsRequest"
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Create Records Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/CreateRecordsResponse"
                }
              }
            }
          }
        }
      },
      "put": {
        "tags": [
          "Databases v2"
        ],
        "operationId": "Update Multiple Records",
        "description": "Updates up to 10 records",
        "parameters": [
          {
            "schema": {
              "type": "string",
              "example": "spc***"
            },
            "required": true,
            "name": "spaceId",
            "in": "path"
          },
          {
            "schema": {
              "type": "string",
              "example": "dat***"
            },
            "required": true,
            "name": "databaseId",
            "in": "path"
          }
        ],
        "requestBody": {
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/UpdateRecordsRequest"
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Update Records Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/UpdateRecordsResponse"
                }
              }
            }
          }
        }
      },
      "delete": {
        "tags": [
          "Databases v2"
        ],
        "operationId": "Delete Multiple Records",
        "description": "Delete up to 10 recordIds",
        "parameters": [
          {
            "schema": {
              "type": "string",
              "example": "spc***"
            },
            "required": true,
            "name": "spaceId",
            "in": "path"
          },
          {
            "schema": {
              "type": "string",
              "example": "dat***"
            },
            "required": true,
            "name": "databaseId",
            "in": "path"
          },
          {
            "schema": {
              "type": "array",
              "items": {
                "type": "string"
              },
              "minItems": 1,
              "maxItems": 10,
              "example": [
                "rec1***",
                "rec2***"
              ],
              "description": "Array of record IDs to delete, max 10 records"
            },
            "required": true,
            "description": "Array of record IDs to delete, max 10 records",
            "name": "records",
            "in": "query"
          }
        ],
        "responses": {
          "200": {
            "description": "Delete Records Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/DeleteRecordsResponse"
                }
              }
            }
          }
        }
      }
    },
    "/v2/spaces/{spaceId}/resources/databases/{databaseId}/records/{recordId}": {
      "get": {
        "tags": [
          "Databases v2"
        ],
        "operationId": "Get Record",
        "description": "Get Record",
        "parameters": [
          {
            "schema": {
              "type": "string",
              "example": "spc***"
            },
            "required": true,
            "name": "spaceId",
            "in": "path"
          },
          {
            "schema": {
              "type": "string",
              "example": "dat***"
            },
            "required": true,
            "name": "databaseId",
            "in": "path"
          },
          {
            "schema": {
              "type": "string",
              "example": "rec***"
            },
            "required": true,
            "name": "recordId",
            "in": "path"
          },
          {
            "schema": {
              "type": "string",
              "example": "Asia/Shanghai",
              "description": "(Optional) The time zone that should be used to format dates when using <strong>cellFormat=string.</strong><br> This parameter is required when using <strong>cellFormat=string.</strong><br>this parameter must be encoded before passing it as a value. <br>For example, <strong>Asia/Shanghai</strong> should be encoded as <strong>Asia%2FShanghai</strong>."
            },
            "required": false,
            "description": "(Optional) The time zone that should be used to format dates when using <strong>cellFormat=string.</strong><br> This parameter is required when using <strong>cellFormat=string.</strong><br>this parameter must be encoded before passing it as a value. <br>For example, <strong>Asia/Shanghai</strong> should be encoded as <strong>Asia%2FShanghai</strong>.",
            "name": "timeZone",
            "in": "query"
          },
          {
            "schema": {
              "type": "string",
              "enum": [
                "en",
                "zh-CN",
                "zh-TW",
                "ja",
                "pt",
                "de"
              ],
              "example": "en",
              "description": "(Optional) The user locale that should be used to format dates when using <strong>cellFormat=string.</strong> <br>This parameter is required when using <strong>cellFormat=string.</strong>"
            },
            "required": false,
            "description": "(Optional) The user locale that should be used to format dates when using <strong>cellFormat=string.</strong> <br>This parameter is required when using <strong>cellFormat=string.</strong>",
            "name": "userLocale",
            "in": "query"
          },
          {
            "schema": {
              "type": "string",
              "example": "json",
              "description": "(Optional) The cellFormat parameter defines how cell values are returned:<br><strong>json</strong>: Returns structured data based on the field type (default).<br><strong>string</strong>: Returns user-friendly text; requires both timeZone and userLocale.<br>Note: The string format may change and should not be relied on for consistency.<br>More details about cellFormat can be found in the <a target=\"_blank\" href=\"https://bika.ai/help/guide/developer/cell-value\">Cell Value</a>."
            },
            "required": false,
            "description": "(Optional) The cellFormat parameter defines how cell values are returned:<br><strong>json</strong>: Returns structured data based on the field type (default).<br><strong>string</strong>: Returns user-friendly text; requires both timeZone and userLocale.<br>Note: The string format may change and should not be relied on for consistency.<br>More details about cellFormat can be found in the <a target=\"_blank\" href=\"https://bika.ai/help/guide/developer/cell-value\">Cell Value</a>.",
            "name": "cellFormat",
            "in": "query"
          },
          {
            "schema": {
              "type": "string",
              "example": "name",
              "description": "The fieldKey parameter specifies that let you return field objects where the key is:<br><strong>name</strong>: Uses the field name as the key (default).<br><strong>id</strong>: Uses the field ID as the key."
            },
            "required": false,
            "description": "The fieldKey parameter specifies that let you return field objects where the key is:<br><strong>name</strong>: Uses the field name as the key (default).<br><strong>id</strong>: Uses the field ID as the key.",
            "name": "fieldKey",
            "in": "query"
          }
        ],
        "responses": {
          "200": {
            "description": "Get Record Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/RecordResponse"
                }
              }
            }
          }
        }
      },
      "put": {
        "tags": [
          "Databases v2"
        ],
        "operationId": "Update Record",
        "description": "Update Record",
        "parameters": [
          {
            "schema": {
              "type": "string",
              "example": "spc***"
            },
            "required": true,
            "name": "spaceId",
            "in": "path"
          },
          {
            "schema": {
              "type": "string",
              "example": "dat***"
            },
            "required": true,
            "name": "databaseId",
            "in": "path"
          },
          {
            "schema": {
              "type": "string",
              "example": "rec***"
            },
            "required": true,
            "name": "recordId",
            "in": "path"
          }
        ],
        "requestBody": {
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/UpdateRecordRequest"
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Update Record Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/RecordResponse"
                }
              }
            }
          }
        }
      },
      "delete": {
        "tags": [
          "Databases v2"
        ],
        "operationId": "Delete Record",
        "description": "Delete Record",
        "parameters": [
          {
            "schema": {
              "type": "string",
              "example": "spc***"
            },
            "required": true,
            "name": "spaceId",
            "in": "path"
          },
          {
            "schema": {
              "type": "string",
              "example": "dat***"
            },
            "required": true,
            "name": "databaseId",
            "in": "path"
          },
          {
            "schema": {
              "type": "string",
              "example": "rec***"
            },
            "required": true,
            "name": "recordId",
            "in": "path"
          }
        ],
        "responses": {
          "200": {
            "description": "Delete Record Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/DeletedRecordResponse"
                }
              }
            }
          }
        }
      }
    },
    "/v1/spaces/{spaceId}/outgoing-webhooks": {
      "get": {
        "tags": [
          "Outgoing Webhooks"
        ],
        "description": "List Outgoing Webhooks",
        "parameters": [
          {
            "schema": {
              "type": "string",
              "example": "spc***"
            },
            "required": true,
            "name": "spaceId",
            "in": "path"
          }
        ],
        "responses": {
          "200": {
            "description": "Outgoing Webhook Value Object (VO)",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "success": {
                      "type": "boolean",
                      "description": "Request success flag",
                      "example": true
                    },
                    "code": {
                      "type": "number",
                      "description": "bika status code",
                      "example": 200
                    },
                    "message": {
                      "type": "string",
                      "description": "Response message",
                      "example": "SUCCESS"
                    },
                    "data": {
                      "$ref": "#/components/schemas/OutgoingWebhookVOSchemaArray"
                    }
                  },
                  "required": [
                    "success",
                    "code",
                    "message",
                    "data"
                  ]
                }
              }
            }
          }
        }
      },
      "post": {
        "tags": [
          "Outgoing Webhooks"
        ],
        "description": "Create Space's Outgoing Webhooks",
        "parameters": [
          {
            "schema": {
              "type": "string",
              "example": "spc***"
            },
            "required": true,
            "name": "spaceId",
            "in": "path"
          }
        ],
        "requestBody": {
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/OutgoingWebhookCreateDTOSchema"
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Outgoing Webhook Value Object (VO)",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "success": {
                      "type": "boolean",
                      "description": "Request success flag",
                      "example": true
                    },
                    "code": {
                      "type": "number",
                      "description": "bika status code",
                      "example": 200
                    },
                    "message": {
                      "type": "string",
                      "description": "Response message",
                      "example": "SUCCESS"
                    },
                    "data": {
                      "type": "object",
                      "properties": {
                        "id": {
                          "type": "string"
                        },
                        "name": {
                          "type": "string"
                        },
                        "callbackURL": {
                          "type": "string"
                        },
                        "description": {
                          "type": "string"
                        },
                        "eventType": {
                          "type": "string",
                          "enum": [
                            "ON_NODE_CREATED",
                            "ON_NODE_UPDATED",
                            "ON_NODE_DELETED",
                            "ON_RECORD_CREATED",
                            "ON_RECORD_UPDATED",
                            "ON_RECORD_DELETED",
                            "ON_FORM_SUBMITTED",
                            "BEFORE_MEMBER_JOINED",
                            "ON_MEMBER_INVITE",
                            "DO_MEMBER_INVITE"
                          ]
                        }
                      },
                      "required": [
                        "id",
                        "name",
                        "callbackURL",
                        "eventType"
                      ]
                    }
                  },
                  "required": [
                    "success",
                    "code",
                    "message",
                    "data"
                  ]
                }
              }
            }
          }
        }
      }
    },
    "/v1/spaces/{spaceId}/outgoing-webhooks/{outgoingWebhookId}": {
      "delete": {
        "tags": [
          "Outgoing Webhooks"
        ],
        "description": "Delete Outgoing Webhook",
        "parameters": [
          {
            "schema": {
              "type": "string",
              "example": "spc***"
            },
            "required": true,
            "name": "spaceId",
            "in": "path"
          },
          {
            "schema": {
              "type": "string"
            },
            "required": true,
            "name": "outgoingWebhookId",
            "in": "path"
          }
        ],
        "responses": {
          "200": {
            "description": "Outgoing Webhook Value Object (VO)",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "success": {
                      "type": "boolean",
                      "description": "Request success flag",
                      "example": true
                    },
                    "code": {
                      "type": "number",
                      "description": "bika status code",
                      "example": 200
                    },
                    "message": {
                      "type": "string",
                      "description": "Response message",
                      "example": "SUCCESS"
                    },
                    "data": {
                      "type": "boolean"
                    }
                  },
                  "required": [
                    "success",
                    "code",
                    "message",
                    "data"
                  ]
                }
              }
            }
          }
        }
      }
    },
    "/v1/user/profile": {
      "get": {
        "tags": [
          "User"
        ],
        "description": "Get user profile",
        "responses": {
          "200": {
            "description": "Node",
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
                    "email": {
                      "type": "string",
                      "nullable": true,
                      "format": "email"
                    },
                    "phone": {
                      "type": "string",
                      "nullable": true
                    },
                    "settings": {
                      "type": "object",
                      "properties": {
                        "themeMode": {
                          "type": "string",
                          "enum": [
                            "light",
                            "dark",
                            "system"
                          ]
                        },
                        "themeStyle": {
                          "type": "string",
                          "enum": [
                            "dracula",
                            "solarized",
                            "default"
                          ]
                        },
                        "customColors": {
                          "anyOf": [
                            {
                              "type": "string",
                              "enum": [
                                "DEFAULT"
                              ]
                            },
                            {
                              "type": "object",
                              "properties": {
                                "sidebarBackgroundColor": {
                                  "type": "string"
                                },
                                "contentBackgroundColor": {
                                  "type": "string"
                                }
                              }
                            }
                          ]
                        },
                        "locale": {
                          "type": "string",
                          "enum": [
                            "en",
                            "zh-CN",
                            "zh-TW",
                            "ja",
                            "pt",
                            "de"
                          ]
                        },
                        "notification": {
                          "type": "object",
                          "properties": {
                            "email": {
                              "type": "boolean",
                              "default": true
                            },
                            "push": {
                              "type": "boolean",
                              "default": true
                            },
                            "SMS": {
                              "type": "boolean",
                              "default": true
                            }
                          }
                        },
                        "questionaire": {
                          "type": "boolean"
                        }
                      }
                    },
                    "timeZone": {
                      "type": "string"
                    },
                    "avatar": {
                      "oneOf": [
                        {
                          "type": "object",
                          "properties": {
                            "type": {
                              "type": "string",
                              "enum": [
                                "PRESET"
                              ]
                            },
                            "url": {
                              "type": "string"
                            }
                          },
                          "required": [
                            "type",
                            "url"
                          ]
                        },
                        {
                          "type": "object",
                          "properties": {
                            "type": {
                              "type": "string",
                              "enum": [
                                "COLOR"
                              ]
                            },
                            "color": {
                              "type": "string"
                            }
                          },
                          "required": [
                            "type",
                            "color"
                          ]
                        },
                        {
                          "type": "object",
                          "properties": {
                            "type": {
                              "type": "string",
                              "enum": [
                                "ATTACHMENT"
                              ]
                            },
                            "attachmentId": {
                              "type": "string"
                            },
                            "relativePath": {
                              "type": "string"
                            }
                          },
                          "required": [
                            "type",
                            "attachmentId",
                            "relativePath"
                          ]
                        },
                        {
                          "type": "object",
                          "properties": {
                            "type": {
                              "type": "string",
                              "enum": [
                                "EMOJI"
                              ]
                            },
                            "backgroundColor": {
                              "type": "string"
                            },
                            "emoji": {
                              "type": "string"
                            }
                          },
                          "required": [
                            "type",
                            "emoji"
                          ]
                        },
                        {
                          "type": "object",
                          "properties": {
                            "type": {
                              "type": "string",
                              "enum": [
                                "AI"
                              ]
                            },
                            "prompt": {
                              "type": "string"
                            },
                            "attachmentId": {
                              "type": "string"
                            },
                            "relativePath": {
                              "type": "string"
                            }
                          },
                          "required": [
                            "type",
                            "prompt",
                            "attachmentId",
                            "relativePath"
                          ]
                        },
                        {
                          "type": "object",
                          "properties": {
                            "type": {
                              "type": "string",
                              "enum": [
                                "UNSPLASH"
                              ]
                            },
                            "url": {
                              "type": "string",
                              "format": "uri"
                            },
                            "downloadUrl": {
                              "type": "string",
                              "format": "uri"
                            }
                          },
                          "required": [
                            "type",
                            "url"
                          ]
                        },
                        {
                          "type": "object",
                          "properties": {
                            "type": {
                              "type": "string",
                              "enum": [
                                "URL"
                              ]
                            },
                            "url": {
                              "type": "string"
                            }
                          },
                          "required": [
                            "type",
                            "url"
                          ]
                        }
                      ]
                    },
                    "metadata": {
                      "type": "object",
                      "properties": {
                        "referralCode": {
                          "type": "string"
                        },
                        "referralUserId": {
                          "type": "string"
                        },
                        "referralAwarded": {
                          "type": "boolean"
                        },
                        "mobileAppInstallAward": {
                          "type": "boolean"
                        },
                        "isChinaUser": {
                          "type": "boolean"
                        },
                        "isPremiumPlanNotified": {
                          "type": "boolean"
                        },
                        "nodeTypeFirstVisits": {
                          "type": "object",
                          "additionalProperties": {
                            "type": "boolean"
                          }
                        },
                        "closingAppliedAt": {
                          "type": "string",
                          "format": "date-time"
                        },
                        "closingScheduledAt": {
                          "type": "string",
                          "format": "date-time"
                        }
                      }
                    },
                    "status": {
                      "type": "string",
                      "enum": [
                        "ACTIVE",
                        "CLOSING_PENDING",
                        "DELETED"
                      ]
                    },
                    "createdAt": {
                      "type": "string"
                    }
                  },
                  "required": [
                    "id",
                    "name",
                    "email",
                    "avatar"
                  ]
                }
              }
            }
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
}
;

export const options = {
  source: { document },
  allowedOrigin: "https://bika.ai",
  securitySchemes: { bearerAuth: { type: "http", scheme: "bearer" } },
  methods: { apiKey: [{ scheme: "bearerAuth", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
