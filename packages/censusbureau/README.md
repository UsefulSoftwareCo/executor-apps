# Census Bureau

U.S. Census Bureau statistics: browse the Census Data API catalog (about 1,800 datasets), inspect a dataset's variables, groups and geographies, query the American Community Survey (1- and 5-year), the decennial census redistricting data or any other dataset, and geocode addresses with the Census Geocoder.

**Interface:** custom hand-written tools (16). The Census Bureau publishes no OpenAPI document; its API is described by per-dataset discovery JSON (`https://api.census.gov/data.json`, `<dataset>/variables.json`, `geography.json`). Tools call `https://api.census.gov/data` and `https://geocoding.geo.census.gov/geocoder`. All tools are read-only.

**Auth:** API key. Request a free key at https://api.census.gov/data/key_signup.html; Executor sends it as the `key` query parameter to `api.census.gov`. The geocoder is public and receives no credentials. The Census Data API has no OAuth.

**Known gaps:** the Geocoder batch (CSV upload) endpoints, TIGERweb and the Census Data API's less common endpoints (`sorts`, `tags`) are not wrapped; use `data.query` with any dataset path for everything under `/data`. Census returns errors such as an invalid key as HTML or plain text, which surface as failed calls.
