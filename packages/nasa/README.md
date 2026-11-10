# NASA

NASA open data in one package: Astronomy Picture of the Day, near-Earth objects (NeoWs), space weather (DONKI), Mars rover photos, EPIC and Landsat Earth imagery, technology transfer, plus the keyless NASA services for the image and video library, EONET natural events, the Exoplanet Archive, JPL close approaches, fireballs and Sentry impact risk, and TechPort projects. 37 read-only tools.

**Interface:** hand-written tools over NASA's documented HTTP APIs. NASA publishes no single OpenAPI document or remote MCP server for these (api.nasa.gov documents each API on a web page), so each endpoint is wrapped directly. Sources: https://api.nasa.gov/ (keyed APIs on `api.nasa.gov`), https://images.nasa.gov/docs/images.nasa.gov_api_docs.pdf (`images-api.nasa.gov`), https://eonet.gsfc.nasa.gov/docs/v3 (`eonet.gsfc.nasa.gov`), https://exoplanetarchive.ipac.caltech.edu/docs/TAP/usingTAP.html, https://ssd-api.jpl.nasa.gov/doc/ (`ssd-api.jpl.nasa.gov`) and https://techport.nasa.gov/help/api (`techport.nasa.gov`), https://technology.nasa.gov/api (`technology.nasa.gov`).

**Auth:** API key. Get a free key at https://api.nasa.gov/ (the form issues it by email); `DEMO_KEY` also works with a low hourly limit. The key is sent in the `X-Api-Key` header, which api.data.gov documents (https://api.data.gov/docs/developer-manual/), and only to `api.nasa.gov`. The other hosts need no key and are called without credentials. NASA has no OAuth.

**Icon:** the NASA worm logo from Simple Icons (the product's mark, not the agency meatball seal).

**Known gaps:** no mutations exist. The Exoplanet Archive tool takes raw ADQL, so an agent must know the table names. TechTransfer search uses the keyless path form documented at https://technology.nasa.gov/api (`https://technology.nasa.gov/api/api/{patent|software|spinoff}/{keywords}`); the page documents no paging parameters and returns positional arrays. Not covered: the CMR, FIRMS, POWER, TLE and Sounds APIs, the InSight weather service (retired), GIBS tile services, EPIC image binaries (the tool returns names that build the archive URL), OSDR/GeneLab and the Open Science data APIs.
