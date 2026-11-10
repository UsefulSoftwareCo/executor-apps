import type { OpenapiToolNamesOptions } from "apps/openapi";

// Both documents are published by SmartBear on SwaggerHub itself and pinned to a version.
// Both authenticate with the user's API key in the Authorization header.
const methods = { apiKey: [{ scheme: "TokenSecured", field: "token", part: "value" as const, prefix: "" }] };

// The Swagger 2.0 document declares ten operations' bodies as shared parameters, which its converted form
// rejects ("Missing key"). Inlining each body parameter makes all ten loadable.
const patches = [
 {
  "path": "/paths/~1apis~1{owner}~1{api}~1{version}~1clone/post/parameters",
  "value": [
   {
    "$ref": "#/parameters/apiOwner"
   },
   {
    "$ref": "#/parameters/api"
   },
   {
    "$ref": "#/parameters/versionToClone"
   },
   {
    "in": "body",
    "name": "body",
    "description": "An object that contains the new version number and other parameters. The version number must be in the format described in the [documentation](https://support.smartbear.com/swaggerhub/docs/apis/versioning.html#format).",
    "required": true,
    "schema": {
     "$ref": "#/definitions/NewVersion"
    }
   }
  ]
 },
 {
  "path": "/paths/~1apis~1{owner}~1{api}~1{version}~1settings~1lifecycle/put/parameters",
  "value": [
   {
    "$ref": "#/parameters/apiOwner"
   },
   {
    "$ref": "#/parameters/api"
   },
   {
    "$ref": "#/parameters/version"
   },
   {
    "in": "body",
    "name": "body",
    "description": "An object that specifies the new `published` state: `true` means published, `false` - unpublished",
    "required": true,
    "schema": {
     "$ref": "#/definitions/LifecycleSettings"
    }
   },
   {
    "name": "force",
    "in": "query",
    "description": "To publish an API that references _unpublished_ domains, this parameter must be `true`. Otherwise, the request will be rejected with status code 424.",
    "required": false,
    "type": "boolean",
    "default": false
   }
  ]
 },
 {
  "path": "/paths/~1apis~1{owner}~1{api}~1{version}~1settings~1private/put/parameters",
  "value": [
   {
    "$ref": "#/parameters/apiOwner"
   },
   {
    "$ref": "#/parameters/api"
   },
   {
    "$ref": "#/parameters/version"
   },
   {
    "in": "body",
    "name": "body",
    "description": "An object that specifies the new visibility level: `true` means private, `false` - public",
    "required": true,
    "schema": {
     "$ref": "#/definitions/VisibilitySettings"
    }
   }
  ]
 },
 {
  "path": "/paths/~1projects~1{owner}/post/parameters",
  "value": [
   {
    "name": "body",
    "in": "body",
    "description": "The project data. Properties that are not provided are set to empty values.\n",
    "required": true,
    "schema": {
     "$ref": "#/definitions/Project"
    }
   }
  ]
 },
 {
  "path": "/paths/~1projects~1{owner}~1{projectId}/put/parameters",
  "value": [
   {
    "name": "body",
    "in": "body",
    "description": "The project data. Properties that are not provided are set to empty values.\n",
    "required": true,
    "schema": {
     "$ref": "#/definitions/Project"
    }
   }
  ]
 },
 {
  "path": "/paths/~1apis~1{owner}~1{api}~1{version}~1integrations/post/parameters",
  "value": [
   {
    "$ref": "#/parameters/apiOwner"
   },
   {
    "$ref": "#/parameters/api"
   },
   {
    "$ref": "#/parameters/version"
   },
   {
    "name": "body",
    "in": "body",
    "required": true,
    "description": "Can be one of the following objects:\n\n| `configType` value        | Object |\n| ------------------------- | ------ |\n| AMAZON_API_GATEWAY        | AmazonApiGatewayIntegration |\n| AMAZON_API_GATEWAY_LAMBDA | AmazonApiGatewayLambdaIntegration |\n| API_AUTO_MOCKING          | AutoMockingIntegration |\n| APIGEE_EDGE               | ApigeeEdgeIntegration |\n| AZURE_API_MANAGEMENT      | AzureApiManagementIntegration |\n| AZURE_DEVOPS_SERVICES     | AzureDevopsServicesIntegration |\n| BITBUCKET_CLOUD           | BitbucketCloudIntegration |\n| BITBUCKET_SERVER          | BitbucketServerIntegration |\n| GITHUB                    | GitHubIntegration |\n| GITHUB_ENTERPRISE         | GitHubEnterpriseIntegration |\n| GITLAB                    | GitLabIntegration |\n| WEBHOOK                   | WebhookIntegration |\n\nFor more examples, see the JSON files in this repository:\nhttps://github.com/SmartBear/swaggerhub-cli/tree/master/examples/integrations",
    "schema": {
     "type": "object",
     "example": {
      "configType": "GITHUB",
      "name": "Java client SDK",
      "token": "abcd12345",
      "owner": "myOrg",
      "repository": "petstore",
      "branch": "develop",
      "target": "java",
      "syncMethod": "Advanced Sync",
      "outputFolder": "sdk/java",
      "providedPaths": [
       "*"
      ],
      "managedPaths": [],
      "ignoredPaths": [],
      "enabled": true
     }
    }
   }
  ]
 },
 {
  "path": "/paths/~1apis~1{owner}~1{api}~1{version}~1integrations~1{integrationId}/put/parameters",
  "value": [
   {
    "$ref": "#/parameters/apiOwner"
   },
   {
    "$ref": "#/parameters/api"
   },
   {
    "$ref": "#/parameters/version"
   },
   {
    "$ref": "#/parameters/integrationId"
   },
   {
    "name": "body",
    "in": "body",
    "required": true,
    "description": "Can be one of the following objects:\n\n| `configType` value        | Object |\n| ------------------------- | ------ |\n| AMAZON_API_GATEWAY        | AmazonApiGatewayIntegration |\n| AMAZON_API_GATEWAY_LAMBDA | AmazonApiGatewayLambdaIntegration |\n| API_AUTO_MOCKING          | AutoMockingIntegration |\n| APIGEE_EDGE               | ApigeeEdgeIntegration |\n| AZURE_API_MANAGEMENT      | AzureApiManagementIntegration |\n| AZURE_DEVOPS_SERVICES     | AzureDevopsServicesIntegration |\n| BITBUCKET_CLOUD           | BitbucketCloudIntegration |\n| BITBUCKET_SERVER          | BitbucketServerIntegration |\n| GITHUB                    | GitHubIntegration |\n| GITHUB_ENTERPRISE         | GitHubEnterpriseIntegration |\n| GITLAB                    | GitLabIntegration |\n| WEBHOOK                   | WebhookIntegration |\n\nFor more examples, see the JSON files in this repository:\nhttps://github.com/SmartBear/swaggerhub-cli/tree/master/examples/integrations",
    "schema": {
     "type": "object",
     "example": {
      "configType": "GITHUB",
      "name": "Java client SDK",
      "token": "abcd12345",
      "owner": "myOrg",
      "repository": "petstore",
      "branch": "develop",
      "target": "java",
      "syncMethod": "Advanced Sync",
      "outputFolder": "sdk/java",
      "providedPaths": [
       "*"
      ],
      "managedPaths": [],
      "ignoredPaths": [],
      "enabled": true
     }
    }
   }
  ]
 },
 {
  "path": "/paths/~1domains~1{owner}~1{domain}~1{version}~1clone/post/parameters",
  "value": [
   {
    "$ref": "#/parameters/domainOwner"
   },
   {
    "$ref": "#/parameters/domain"
   },
   {
    "$ref": "#/parameters/versionToClone"
   },
   {
    "in": "body",
    "name": "body",
    "description": "An object that contains the new version number and other parameters. The version number must be in the format described in the [documentation](https://support.smartbear.com/swaggerhub/docs/apis/versioning.html#format).",
    "required": true,
    "schema": {
     "$ref": "#/definitions/NewVersion"
    }
   }
  ]
 },
 {
  "path": "/paths/~1domains~1{owner}~1{domain}~1{version}~1settings~1lifecycle/put/parameters",
  "value": [
   {
    "$ref": "#/parameters/domainOwner"
   },
   {
    "$ref": "#/parameters/domain"
   },
   {
    "$ref": "#/parameters/version"
   },
   {
    "in": "body",
    "name": "body",
    "description": "An object that specifies the new `published` state: `true` means published, `false` - unpublished",
    "required": true,
    "schema": {
     "$ref": "#/definitions/LifecycleSettings"
    }
   },
   {
    "name": "force",
    "in": "query",
    "description": "To publish a domain that references other _unpublished_ domains, this parameter must be `true`. Otherwise, the request will be rejected with status code 424.",
    "required": false,
    "type": "boolean",
    "default": false
   }
  ]
 },
 {
  "path": "/paths/~1domains~1{owner}~1{domain}~1{version}~1settings~1private/put/parameters",
  "value": [
   {
    "$ref": "#/parameters/domainOwner"
   },
   {
    "$ref": "#/parameters/domain"
   },
   {
    "$ref": "#/parameters/version"
   },
   {
    "in": "body",
    "name": "body",
    "description": "An object that specifies the new visibility level: `true` means private, `false` - public",
    "required": true,
    "schema": {
     "$ref": "#/definitions/VisibilitySettings"
    }
   },
   {
    "name": "force",
    "in": "query",
    "description": "To change the visibility from _public_ to _private_ in case this domain is referenced from other _public_ definitions, this parameter must be `true`. Otherwise, the request will be rejected with status code 424.",
    "required": false,
    "type": "boolean",
    "default": false
   }
  ]
 }
].map(({ path, value }) => ({ op: "replace", path, value })) as unknown as NonNullable<
  OpenapiToolNamesOptions["patches"]
>;

export const registryOptions = {
  source: { url: "https://api.swaggerhub.com/apis/swagger-hub/registry-api/1.4.0/swagger.json" },
  allowedOrigin: "https://api.swaggerhub.com",
  securitySchemes: { TokenSecured: { type: "apiKey", name: "Authorization", in: "header" } },
  // The document declares no security; send the account's credential on every operation.
  fallbackSecurity: [{ TokenSecured: [] }],
  methods,
  patches,
  oauth: [],
} satisfies OpenapiToolNamesOptions;

export const userManagementOptions = {
  source: { url: "https://api.swaggerhub.com/apis/swagger-hub/user-management-api/2.5.0/swagger.json" },
  allowedOrigin: "https://api.swaggerhub.com",
  securitySchemes: { ApiKeyAuth: { type: "apiKey", name: "Authorization", in: "header" } },
  methods: { apiKey: [{ scheme: "ApiKeyAuth", field: "token", part: "value" as const, prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;

export const options = registryOptions;
