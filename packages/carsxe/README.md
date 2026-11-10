# CarsXE

Vehicle data from CarsXE: VIN decoding and specifications, international VIN decoding, recalls (by VIN, year/make/model, campaign and batch), market value, history, lien and theft records, license plate decoding, vehicle images, plate and VIN image recognition, year/make/model lookup and OBD code decoding.

Interface: CarsXE's official OpenAPI document, https://carsxe.com/openapi.yaml (also served at https://api.carsxe.com/openapi.json). All operations target https://api.carsxe.com. CarsXE also runs an official MCP server (https://mcp.carsxe.com/mcp); it is not mounted because the REST document covers the same ground.

Auth: API key. Create one in the CarsXE dashboard (https://api.carsxe.com/dashboard/developer). It is sent as the `key` query parameter. The MCP server supports OAuth, but the REST API does not, so none is offered.

Known gaps: the x402 pay-per-request alternative and the scoped `X-CarsXE-Batch-Token` header for recalls batch follow-ups are not supported; use the API key. Mutating operations (batch submit, image recognition POSTs) require approval.
