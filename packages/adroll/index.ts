import {
  accountRouter,
  array,
  boolean,
  decodeJson,
  defineApp,
  defineProvider,
  json,
  mutation,
  number,
  oauth2,
  object,
  query,
  router,
  type Schema,
  secrets,
  string,
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const base = "https://services.adroll.com";

type Account =
  | { method: "token"; fields: { token: string; clientId: string } }
  | { method: "oauth"; fields: { access_token: string } };

const OrganizationInfo = object({ eid: string(), name: string() });

const adroll = defineProvider({
  name: "AdRoll",
  hosts: ["services.adroll.com"],
  auth: {
    // A Personal Access Token identifies the user; the app's client ID goes in the apikey query parameter.
    token: secrets({
      label: "Personal access token",
      fields: object({ token: string({ minLength: 1 }), clientId: string({ minLength: 1 }) }),
    }),
    // AdRoll has no client registration endpoint: the connect page asks for the app's client ID and secret.
    oauth: oauth2({
      authorizationUrl: `${base}/auth/authorize`,
      tokenUrl: `${base}/auth/token`,
      tokenEndpointAuthMethod: "client_secret_post",
      scopes: ["all"],
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/api/v1/organization/get${apiKeyQuery(account)}`, {
      signal,
      headers: headers(account),
    });
    const body = await decodeJson(response, OrganizationInfo);
    return { accountInfo: { externalId: body.eid, displayName: body.name } };
  },
});

function headers(account: Account): Record<string, string> {
  return {
    Accept: "application/json",
    Authorization: account.method === "oauth" ? `Bearer ${account.fields.access_token}` : `Token ${account.fields.token}`,
  };
}

// The apikey query parameter is sent only with Personal Access Tokens, never in a request body.
function apiKeyQuery(account: Account): string {
  return account.method === "token" ? `?apikey=${encodeURIComponent(account.fields.clientId)}` : "";
}

type Kind = "query" | "mutation";
type FieldType = "string" | "number" | "boolean" | "array" | "json";
type Field = [name: string, type: FieldType, required: boolean, where: "query" | "body", description: string];
type Row = [resource: string, action: string, method: string, path: string, kind: Kind, description: string, fields: Field[]];

const rows: Row[] = [
  ["ad", "clone", "POST", "/api/v1/ad/clone", "mutation", "Clones an ad. Any parameters given will override the corresponding field in the original ad. The fields below may be overridden.", [
    ["destination_url", "string", false, "body", "The URL that the browser will navigate to when the ad is clicked (Optional; default: None)"],
    ["name", "string", false, "body", "The name of the ad (Optional; default: None)"],
    ["headline", "string", false, "body", "The headline text of the Facebook ad (Optional, only for Facebook ads; default: \u2018\u2019)"],
    ["body", "string", false, "body", "The body text of the Facebook ad (Optional, only for Facebook ads; default: \u2018\u2019)"]
  ]],
  ["ad", "create_templated_web_ads", "POST", "/api/v1/ad/create_templated_web_ads", "mutation", "Creates a set of ads from a template. Assumes that you\u2019ve already called the `advertisable_logo/create` api to upload a logo for the provided advertisable.", [
    ["advertisable", "string", true, "body", "The EID of the advertisable to which these ads will belong"],
    ["name", "string", true, "body", "The name of the ad set. Appends to the following default naming convention as such \u2018Dynamic_[ad size]_[date]_[ad set name]\u2019. Properties such as theme name are recommended (limited to 30 characters)"],
    ["theme_color", "string", true, "body", "Hexadecimal color code for the color of the CTA box, e.g. #FFFF00"],
    ["text_cta", "string", true, "body", "The call to action text shown on the cta box. Since the available space depends on the specific template you\u2019re using, this field doesn\u2019t have a limit."],
    ["dynamic_template_id", "number", true, "body", "The ID of the template to be created"],
    ["text_promo", "string", false, "body", "The call to action text shown on the cta box (Optional; default: \u2018\u2019)"],
    ["sale_price_option", "number", false, "body", "How price should be seen inside the Ad. 0 - don\u2019t show the price, 1 - show the price normalized, 2 - show sale price, 3 - show original price with strikethrough, sale price, and discount percentage. (Optional; default: \u2018\u2019)"],
    ["prefix", "string", false, "body", "Product URLs will be prefixed with this when Dynamic Creative is clicked, used for redirect-style click trackers (Optional; default: \u2018\u2019)"],
    ["tracking", "string", false, "body", "URL query parameters to add to product URLs when Dynamic Creative is clicked (Optional; default: \u2018\u2019)"],
    ["countdown_end", "string", false, "body", "The end date a countdown timer ticks down to in ISO 8601 timestamp format. Append with \u2018Z\u2019 for UTC time. (Optional; default: \u2018\u2019)"],
    ["product_group", "string", false, "body", "A product group defined on a feed to be included in the recommendations endpoint call (Optional; default: \u2018\u2019)"]
  ]],
  ["ad", "edit", "PUT", "/api/v1/ad/edit", "mutation", "Edits an ad. If a major data point is edited (i.e. destination_url), it will create a new ad and put it in an admin approval state. A new ad is created to allow your old ad to continue to run until the edited ad is approved. If innocuous data is entered, or the ad is not part of a campaign, it will just be edited in place.", [
    ["ad", "string", true, "query", "EID of the ad to edit"],
    ["destination_url", "string", false, "query", "The new destination_url for the ad (Optional; default: None)"],
    ["name", "string", false, "query", "The new name of the ad (Optional; default: None)"],
    ["headline", "string", false, "query", "The headline text of the Facebook ad (Optional, only for Facebook ads; default: \u2018\u2019)"],
    ["body", "string", false, "query", "The body text of the Facebook ad (Optional, only for Facebook ads; default: \u2018\u2019)"]
  ]],
  ["ad", "get", "GET", "/api/v1/ad/get", "query", "Fetches an ad by its EID.", [
    ["ad", "string", true, "query", "The EID of the ad to fetch"]
  ]],
  ["adgroup", "add_segments", "POST", "/api/v1/adgroup/add_segments", "mutation", "Adds (associates) segments to an adgroup.", [
    ["adgroup", "string", true, "body", "The EID of the adgroup to add the segments to"],
    ["segments", "string", true, "body", "A comma-separated string of the EIDs of the segments to add to this adgroup"],
    ["is_negative", "boolean", false, "body", "Whether or not this segment is negatively targeted (Optional; default: False)"]
  ]],
  ["adgroup", "create", "POST", "/api/v1/adgroup/create", "mutation", "Creates a new adgroup on a campaign.", [
    ["campaign", "string", true, "body", "EID of campaign to attach the adgroup to"],
    ["name", "string", false, "body", "The name of the new adgroup (Optional; default: None)"],
    ["status", "string", false, "body", "The status of the adgroup. One of [\u2018approved\u2019, \u2018draft\u2019] (Optional; default: \u2018approved\u2019)"],
    ["ads", "string", false, "body", "A comma-separated string of Ad EIDs to attach to the adgroup (Optional; default: None)"],
    ["positive_segments", "string", false, "body", "A comma-separated string of Segment EIDs to attach to the adgroup as positive segments (Optional; default: None)"],
    ["negative_segments", "string", false, "body", "A comma-separated string of Segment EIDs to attach to the adgroup as negative segments (Optional; default: None)"],
    ["geo_targets", "string", false, "body", "JSON string of desired geo targets for the adgroup The parsed JSON should be an array of objects, each object should be like: {\u201ccountry_id\u201d:19, \u201ceid\u201d:\u201dYD2QNVI2GVH4DP4TIO8GEO\u201d, \u201cis_negative\u201d:false} The first ID should be one of: - \u201ccountry_id\u201d - \u201cregion_id\u201d - \u201cmetro_id\u201d - \u201ccity_id\u201d - \u201cpostal_code_id\u201d - \u201cpostal_code\u201d \u201cis_negative\u201d is a boolean, defaulting to False. When is_negative is true, that means the geolocation is excluded. \u201ceid\u201d is the true identifier obtained from magellan about this geo_target. Example of JSON string: \u2018[{\u201ccountry_id\u201d:19,\u201deid\u201d:\u201dYD2QNVI2GVH4DP4TIO8GEO\u201d,\u201dis_negative\u201d:false}, {\u201cregion_id\u201d:\u201dUSCA\u201d,\u201deid\u201d:\u201dFPDT2YVTEZG3LNMQ5Q8GEO\u201d,\u201dis_negative\u201d:false}]\u2019 All existing geo targets will be removed before adding the new ones. If omitted, the adgroup will get the same geo targets as other adgroups in the same campaign.(Optional; default: None)"],
    ["placement_targets", "array", false, "body", "A JSON list of placements targets for Facebook ads - DEPRECATED it will not be returned anymore"]
  ]],
  ["adgroup", "deselect_ads", "POST", "/api/v1/adgroup/deselect_ads", "mutation", "Detaches ads from an adgroup.", [
    ["adgroup", "string", true, "body", "The EID of the adgroup whose ads are to be detached"],
    ["ads", "array", true, "body", "A list of the EIDs of the ads to detach from this adgroup"]
  ]],
  ["adgroup", "edit", "POST", "/api/v1/adgroup/edit", "mutation", "Edits an adgroup.", [
    ["adgroup", "string", true, "body", "EID of the adgroup to edit"],
    ["name", "string", false, "body", "The name of the adgroup (Optional; default: None)"],
    ["status", "string", false, "body", "The status of the adgroup. One of [\u2018approved\u2019, \u2018paused\u2019] (Optional; default: None)"],
    ["ads", "string", false, "body", "A comma-separated string of Ad EIDs to attach to the adgroup (Optional; default: None)"],
    ["positive_segments", "string", false, "body", "A comma-separated string of Segment EIDs to attach to the adgroup as positive segments. Will take the place of existing positive segments. (Optional; default: None)"],
    ["negative_segments", "string", false, "body", "A comma-separated string of Segment EIDs to attach to the adgroup as negative segments. Will take the place of existing negative segments. (Optional; default: None)"],
    ["geo_targets", "string", false, "body", "JSON string of desired geo targets for the adgroup The parsed JSON should be an array of objects, each object should be like: {\u201ccountry_id\u201d:19, \u201ceid\u201d:\u201dYD2QNVI2GVH4DP4TIO8GEO\u201d, \u201cis_negative\u201d:false} The first ID should be one of: - \u201ccountry_id\u201d - \u201cregion_id\u201d - \u201cmetro_id\u201d - \u201ccity_id\u201d - \u201cpostal_code_id\u201d - \u201cpostal_code\u201d \u201cis_negative\u201d is a boolean, defaulting to False. When is_negative is true, that means the geolocation is excluded. \u201ceid\u201d is the true identifier obtained from magellan about this geo_target. Example of JSON string: \u2018[{\u201ccountry_id\u201d:19,\u201deid\u201d:\u201dYD2QNVI2GVH4DP4TIO8GEO\u201d,\u201dis_negative\u201d:false}, {\u201cregion_id\u201d:\u201dUSCA\u201d,\u201deid\u201d:\u201dFPDT2YVTEZG3LNMQ5Q8GEO\u201d,\u201dis_negative\u201d:false}]\u2019 All existing geo targets will be removed before adding the new ones. (Optional; default: None)"],
    ["geo_target_worldwide", "boolean", false, "body", "If passed, all geo targets of the adgroup will be removed. (Optional)"]
  ]],
  ["adgroup", "get", "GET", "/api/v1/adgroup/get", "query", "Fetches an adgroup by its EID.", [
    ["adgroup", "string", true, "query", "The EID of the adgroup to fetch"]
  ]],
  ["adgroup", "get_ads", "GET", "/api/v1/adgroup/get_ads", "query", "Fetches the ads associated with this adgroup, based on the specified filter parameters. If a filter argument is not specified for a field, and the field does not have a default value, then no filtering will be done on that field.", [
    ["adgroup", "string", true, "query", "The EID of the advertisable whose ads are to be fetched"],
    ["is_active", "boolean", false, "query", "If True, only active ads will be returned, and vice versa (Optional; default: True)"],
    ["statuses", "array", false, "query", "Only ads that match one of these statuses will be returned (Optional; default: None)"],
    ["types", "array", false, "query", "Only ads that match one of these types will be returned (Optional; default: None)"],
    ["width", "number", false, "query", "Only ads having one of the specified widths will be returned (Optional; default: None)"],
    ["height", "number", false, "query", "Only ads having one of the specified heights will be returned (Optional; default: None)"]
  ]],
  ["adgroup", "pause", "POST", "/api/v1/adgroup/pause", "mutation", "Pauses an adgroup.", [
    ["adgroup", "string", true, "body", "EID of the adgroup to pause"]
  ]],
  ["adgroup", "pause_ad", "POST", "/api/v1/adgroup/pause_ad", "mutation", "Pauses a running ad.", [
    ["adgroup", "string", true, "body", "The EID of the adgroup on which to pause the ad"],
    ["ad", "string", true, "body", "The EID of the ad to pause on the given adgroup"]
  ]],
  ["adgroup", "pause_ads", "POST", "/api/v1/adgroup/pause_ads", "mutation", "Pauses a list of running ads in an adgroup.", [
    ["adgroup", "string", true, "body", "The EID of the adgroup on which to pause the ad"],
    ["ads", "string", true, "body", "The EIDs of the ads to pause on the given adgroup"]
  ]],
  ["adgroup", "remove_segments", "POST", "/api/v1/adgroup/remove_segments", "mutation", "Removes (dissociates) segments from an adgroup.", [
    ["adgroup", "string", true, "body", "The EID of the adgroup from which to remove the segments"],
    ["segments", "string", true, "body", "A comma-separated string of the EIDs of the segments to remove from this adgroup"]
  ]],
  ["adgroup", "select_ads", "POST", "/api/v1/adgroup/select_ads", "mutation", "Attach ads to an adgroup.", [
    ["adgroup", "string", true, "body", "The EID of the adgroup to attach the ads to"],
    ["ads", "array", true, "body", "A list of the EIDs of the ads to attach to the adgroup"]
  ]],
  ["adgroup", "unpause", "POST", "/api/v1/adgroup/unpause", "mutation", "Unpauses an adgroup.", [
    ["adgroup", "string", true, "body", "EID of the adgroup to unpause"]
  ]],
  ["adgroup", "unpause_ad", "POST", "/api/v1/adgroup/unpause_ad", "mutation", "Unpauses a paused ad.", [
    ["adgroup", "string", true, "body", "The EID of the adgroup on which to unpause the ad"],
    ["ad", "string", true, "body", "The EID of the ad to unpause on the given adgroup"]
  ]],
  ["adgroup", "unpause_ads", "POST", "/api/v1/adgroup/unpause_ads", "mutation", "Unpauses a list of running ads in an adgroup.", [
    ["adgroup", "string", true, "body", "The EID of the adgroup on which to pause the ad"],
    ["ads", "string", true, "body", "The EIDs of the ads to pause on the given adgroup"]
  ]],
  ["advertisable", "create", "POST", "/api/v1/advertisable/create", "mutation", "Creates a new advertisable.", [
    ["name", "string", true, "body", "The name of the advertisable."],
    ["organization", "string", true, "body", "The EID of the organization who will own this advertisable. You need to own this organization."],
    ["set_as_default", "boolean", false, "body", "Whether or not the created advertisable should be your new default advertisable. (Optional; default: False)"],
    ["url", "string", false, "body", "The advertisable\u2019s URL. (Optional; default: None)"],
    ["product_name", "string", false, "body", "The advertisable\u2019s specified product or brand. (Optional; default: None)"],
    ["country_code", "string", false, "body", "The ISO\u200c-3166 2-Letter country code the company is based in. This field is used to handle data collection policies in different countries. If left blank, we will apply our most conservative rules. (Optional; default: None)"]
  ]],
  ["advertisable", "edit", "POST", "/api/v1/advertisable/edit", "mutation", "Edits an advertisable.", [
    ["advertisable", "string", true, "body", "EID of the advertisable to edit"],
    ["click_through_conversion_window", "number", false, "body", "Size of this advertisables\u2019 click through conversion window in days (Optional; default: None)"],
    ["name", "string", false, "body", "The name of the advertisable (Optional; default: None)"],
    ["path_name", "string", false, "body", "A unique string used in all URLs referring to this advertisable (Optional; default: None)"],
    ["url", "string", false, "body", "The advertisable\u2019s URL (Optional; default: None)"],
    ["product_name", "string", false, "body", "The advertisable\u2019s specified product or brand (Optional; default: None)"],
    ["view_through_conversion_window", "number", false, "body", "Size of this advertisables\u2019 view through conversion window in days (Optional; default: None)"],
    ["is_twitter_syncing", "boolean", false, "body", "Whether this advertisable is actively syncing its cookie data to Twitter (Optional; default: None)"],
    ["twitter_handle", "string", false, "body", "Twitter handle used by the advertisable (Optional; default: None)"],
    ["country_code", "string", false, "body", "The ISO-3166 2-Letter country code the advertisable is registered in. (Optional; default: None)"],
    ["is_coop_approved", "boolean", false, "body", "True if the advertisable should be opted-into prospecting (Optional; default: False)"]
  ]],
  ["advertisable", "enable_rollcrawl", "POST", "/api/v1/advertisable/enable_rollcrawl", "mutation", "Enable RollCrawl on an advertisable and set the feed URL. This is an advanced feature that first must be enabled by AdRoll admins before use.", [
    ["advertisable", "string", true, "body", "The EID of the advertisable."],
    ["url", "string", true, "body", "The URL of the product feed. Must point to an XML, JSON or CSV resource or a zipped or gzipped version of such a resource."],
    ["crawl_interval_seconds", "number", false, "body", "The interval to run the crawl. Must be between 720 and 43200. (Optional; default: 2880)"]
  ]],
  ["advertisable", "get", "GET", "/api/v1/advertisable/get", "query", "Fetches an advertisable by its EID.", [
    ["advertisable", "string", true, "query", "The EID of the advertisable to fetch"]
  ]],
  ["advertisable", "get_adgroups", "GET", "/api/v1/advertisable/get_adgroups", "query", "Fetches the adgroups associated with an advertisable based on the given filters. There are two sets of filters, one for choosing which campaigns to select, and one for choosing which adgroups to select from those campaigns.", [
    ["advertisable", "string", true, "query", "The EID of the advertisable whose adgroups are to be fetched"],
    ["camp_active", "boolean", false, "query", "If True, only active campaigns will be returned, and vice versa (Optional; default: True)"],
    ["camp_statuses", "array", false, "query", "Only campaigns that match one of these statuses will be returned (Optional; default: None)"],
    ["camp_blacklist_statuses", "array", false, "query", "Only campaigns whose status is not one of these will be returned (Optional; default: None)"],
    ["camp_types", "array", false, "query", "Only campaigns that match one of these types will be returned (Optional; default: None)"],
    ["statuses", "array", false, "query", "Only adgroups that match one of these statuses will be returned (Optional; default: [\u2018approved\u2019, \u2018admin_review\u2019, \u2018paused\u2019, \u2018admin_paused\u2019])"],
    ["blacklist_statuses", "array", false, "query", "Only adgroups whose status is not one of these will be returned (Optional; default: None)"]
  ]],
  ["advertisable", "get_adgroups_fast", "GET", "/api/v1/advertisable/get_adgroups_fast", "query", "Fetches the adgroups associated with an advertisable based on the given filters. There are two sets of filters, one for choosing which campaigns to select, and one for choosing which adgroups to select from those campaigns.", [
    ["advertisable", "string", true, "query", "The EID of the advertisable whose adgroups are to be fetched"],
    ["camp_active", "boolean", false, "query", "If True, only active campaigns will be returned, and vice versa (Optional; default: True)"],
    ["camp_eids", "array", false, "query", "Only campaigns that match one of these EIDs will be returned (Optional; default: None)"],
    ["camp_statuses", "array", false, "query", "Only campaigns that match one of these statuses will be returned (Optional; default: None)"],
    ["camp_blacklist_statuses", "array", false, "query", "Only campaigns whose status is not one of these will be returned (Optional; default: None)"],
    ["camp_types", "array", false, "query", "Only campaigns that match one of these types will be returned (Optional; default: None)"],
    ["statuses", "array", false, "query", "Only adgroups that match one of these statuses will be returned (Optional; default: [\u2018approved\u2019, \u2018admin_review\u2019, \u2018paused\u2019, \u2018admin_paused\u2019])"],
    ["blacklist_statuses", "array", false, "query", "Only adgroups whose status is not one of these will be returned (Optional; default: None)"]
  ]],
  ["advertisable", "get_ads", "GET", "/api/v1/advertisable/get_ads", "query", "Fetches the ads associated with an advertisable based on the given filters. If a filter argument is not specified for a field, and the field does not have a default value, then no filtering will be done on that field.", [
    ["advertisable", "string", true, "query", "The EID of the advertisable whose ads are to be fetched"],
    ["is_active", "boolean", false, "query", "If True, only active ads will be returned, and vice versa (Optional; default: True)"],
    ["statuses", "array", false, "query", "Only ads that match one of these statuses will be returned (Optional; default: None)"],
    ["types", "array", false, "query", "Only ads that match one of these types will be returned (Optional; default: None)"],
    ["width", "number", false, "query", "Only ads having the specified width will be returned (Optional; default: None)"],
    ["height", "number", false, "query", "Only ads having the specified height will be returned (Optional; default: None)"],
    ["include_fb", "boolean", false, "query", "If True, Facebook ads will be included; if False, Facebook ads will be excluded (Optional; default: True)"]
  ]],
  ["advertisable", "get_ads_fast", "GET", "/api/v1/advertisable/get_ads_fast", "query", "Fetches the ads associated with an advertisable based on the given filters. If a filter argument is not specified for a field, and the field does not have a default value, then no filtering will be done on that field.", [
    ["advertisable", "string", true, "query", "The EID of the advertisable whose ads are to be fetched"],
    ["is_active", "boolean", false, "query", "If True, only active ads will be returned, and vice versa (Optional; default: True)"],
    ["statuses", "array", false, "query", "Only ads that match one of these statuses will be returned (Optional; default: None)"],
    ["types", "array", false, "query", "Only ads that match one of these types will be returned (Optional; default: None)"],
    ["width", "number", false, "query", "Only ads having the specified width will be returned (Optional; default: None)"],
    ["height", "number", false, "query", "Only ads having the specified height will be returned (Optional; default: None)"],
    ["include_fb", "boolean", false, "query", "If True, ads with Facebook ad formats will be included (Optional; default: True)"]
  ]],
  ["advertisable", "get_campaigns", "GET", "/api/v1/advertisable/get_campaigns", "query", "Fetches the campaigns associated with an advertisable based on the given filters. If a filter argument is not specified for a field, and the field does not have a default value, then no filtering will be done on that field.", [
    ["advertisable", "string", true, "query", "The EID of the advertisable whose campaigns are to be fetched"],
    ["is_active", "boolean", false, "query", "If True, only active campaigns will be returned, and vice versa (Optional; default: True)"],
    ["statuses", "array", false, "query", "Only campaigns that match one of these statuses will be returned (Optional; default: None)"],
    ["blacklist_statuses", "array", false, "query", "Only campaigns whose status is not one of these will be returned (Optional; default: None)"],
    ["types", "array", false, "query", "Only campaigns that match one of these types will be returned (Optional; default: None)"]
  ]],
  ["advertisable", "get_campaigns_fast", "GET", "/api/v1/advertisable/get_campaigns_fast", "query", "Fetches the campaigns associated with an advertisable based on the given filters. If a filter argument is not specified for a field, and the field does not have a default value, then no filtering will be done on that field.", [
    ["advertisable", "string", true, "query", "The EID of the advertisable whose campaigns are to be fetched"],
    ["is_active", "boolean", false, "query", "If True, only active campaigns will be returned, and vice versa (Optional; default: True)"],
    ["statuses", "array", false, "query", "Only campaigns that match one of these statuses will be returned (Optional; default: None)"],
    ["blacklist_statuses", "array", false, "query", "Only campaigns whose status is not one of these will be returned (Optional; default: None)"],
    ["types", "array", false, "query", "Only campaigns that match one of these types will be returned (Optional; default: None)"]
  ]],
  ["advertisable", "get_pixel", "GET", "/api/v1/advertisable/get_pixel", "query", "Fetches the active pixel for a given advertisable", [
    ["advertisable", "string", true, "query", "EID of the advertisable. :number pixel_version: pixel version requested, default to 2"],
    ["tag_source", "string", true, "query", "source of pixel tag code"]
  ]],
  ["advertisable", "get_segments", "GET", "/api/v1/advertisable/get_segments", "query", "Fetches the segments from the active pixel for a given advertisable", [
    ["advertisable", "string", true, "query", "EID of the advertisable. :number page: Current page, defaults to 0. :number per_page: Number of results in each page, do not fill if you don\u2019t want pagination."],
    ["sort", "string", false, "query", "Column to sort the data (rules.created_date, rules.duration_sec)."],
    ["type", "string", true, "query", "Filter by the type. :number duration: Filter by the duration in days."],
    ["created_start", "string", false, "query", "Filter by segments created before this date."],
    ["created_end", "string", false, "query", "Filter by segments created after this date."],
    ["include_migration_data", "boolean", false, "query", "Wether to include CDP+ migration related data in the response."]
  ]],
  ["advertisable", "get_suggested_country", "GET", "/api/v1/advertisable/get_suggested_country", "query", "Recommends a country for an advertiser based on other known data", [
    
  ]],
  ["campaign", "create", "POST", "/api/v1/campaign/create", "mutation", "Creates a new campaign", [
    ["advertisable", "string", true, "body", "EID of the advertisable to which this campaign will belong"],
    ["budget", "number", true, "body", "The WEEKLY budget for the campaign"],
    ["ui_budget_daily", "boolean", false, "body", "Whether or not this campaign should show a daily budget in the UI. (Optional; default: true)"],
    ["is_retargeting", "boolean", false, "body", "Is this a retargeting campaign? Otherwise, false == geo campaign. (Optional; default: false)"],
    ["is_fbx_newsfeed", "boolean", false, "body", "Is this a Facebook newsfeed campaign? Otherwise, false (Optional; default: false)"],
    ["adgroups", "array", false, "body", "List of EIDs of adgroups to attach to this campaign (Optional; default: None)"],
    ["cpc", "number", false, "body", "The CPC goal for the campaign (Optional; default: None)"],
    ["cpm", "number", false, "body", "The CPM limit of the campaign, used in pricing model (Optional; default: None)"],
    ["start_date", "string", false, "body", "The day the campaign will start (Optional; default: tomorrow)"],
    ["end_date", "string", false, "body", "The day the campaign will end, exclusive. If None, then will run without end. (Optional; default: None)"],
    ["name", "string", false, "body", "The name of the campaign (Optional; default: None)"],
    ["status", "string", false, "body", "The status of the campaign. One of [\u2018admin_review\u2019, \u2018draft\u2019] (Optional; default: admin_review)"],
    ["max_cpm", "number", false, "body", "The CPM limit for the networks, used in bidding (Optional; default: None)"],
    ["networks", "string", false, "body", "A string of letters representing which networks to set up initially. Currently only supports \u2018f\u2019 (Facebook). (Optional; default: None)"]
  ]],
  ["campaign", "edit", "POST", "/api/v1/campaign/edit", "mutation", "Edits an existing campaign.", [
    ["campaign", "string", true, "body", "The EID of the campaign to edit"],
    ["budget", "number", false, "body", "The new WEEKLY budget for the campaign (Optional; default: None)"],
    ["ui_budget_daily", "boolean", false, "body", "Whether or not this campaign is configured with a daily budget in the UI"],
    ["cpc", "number", false, "body", "The new CPC goal for the campaign (Optional; default: None)"],
    ["cpm", "number", false, "body", "The new CPM limit of the campaign, to be used in bidding (Optional; default: None)"],
    ["end_date", "string", false, "body", "The new end date of the campaign, exclusive (Optional; default: None)"],
    ["is_retargeting", "boolean", false, "body", "Whether or not the campaign is a retargeting campaign (Optional; default: None)"],
    ["name", "string", false, "body", "The new name of the campaign (Optional; default: None)"],
    ["start_date", "string", false, "body", "The new start date of the campaign (Optional; default: None)"]
  ]],
  ["campaign", "get", "GET", "/api/v1/campaign/get", "query", "Fetches a campaign by its EID.", [
    ["campaign", "string", true, "query", "The EID of the campaign to fetch"]
  ]],
  ["campaign", "get_adgroups", "GET", "/api/v1/campaign/get_adgroups", "query", "Fetches the adgroups associated with a campaign.", [
    ["campaign", "string", true, "query", "The EID of the campaign whose adgroups are to be fetched"]
  ]],
  ["campaign", "pause", "PUT", "/api/v1/campaign/pause", "mutation", "Pauses a campaign.", [
    ["campaign", "string", true, "query", "The EID of the campaign to pause"]
  ]],
  ["campaign", "pause_ads", "PUT", "/api/v1/campaign/pause_ads", "mutation", "Pauses a list of ads in a campaign.", [
    ["campaign", "string", true, "query", "The EID of the campaign"],
    ["ads", "string", true, "query", "The EIDs of the ads to pause"]
  ]],
  ["campaign", "unpause", "PUT", "/api/v1/campaign/unpause", "mutation", "Unpauses a campaign.", [
    ["campaign", "string", true, "query", "The EID of the campaign to unpause"]
  ]],
  ["campaign", "unpause_ads", "PUT", "/api/v1/campaign/unpause_ads", "mutation", "Unpauses a list of ads in a campaign.", [
    ["campaign", "string", true, "query", "The EID of the campaign"],
    ["ads", "string", true, "query", "The EIDs of the ads to unpause"]
  ]],
  ["consent_banner", "retrieve", "GET", "/api/v1/consent_banner/retrieve", "query", "Fetch the consent banner configuration by Advertisable EID. consent_banner_state will be one of: adroll: advertisable has selected AdRoll\u2019s consent banner solution custom_pending: advertisable has opted to use their own consent solution and it is pending AdRoll approval custom_approved: advertisable\u2019s own consent solution has been approved by AdRoll admins custom_rejected: advertisable\u2019s own consent solution was rejected by AdRoll admins banner_declined: advertisable has selected not to use a consent solution and AdRoll will not track/serve ads to users in GDPR countries (available only to advertisables in countries not covered by GDPR) null: no selection has been made by the advertisable", [
    ["advertisable", "string", true, "query", "EID of advertisable"]
  ]],
  ["consent_banner", "update", "POST", "/api/v1/consent_banner/update", "mutation", "Update or create banner configuration for given advertisable", [
    ["advertisable", "string", true, "body", "EID of advertisable"],
    ["state", "string", true, "body", "new state for banner config. One of \u2018adroll\u2019, \u2018custom_pending\u2019, \u2018banner_declined\u2019"],
    ["feedback", "string", false, "body", "(optional) some context about a resubmission update (custom_rejected -> custom_pending transition only)."]
  ]],
  ["contextual_categories", "get_all_contextual_categories", "GET", "/api/v1/contextual_categories/get_all_contextual_categories", "query", "Provides a list of contextual categories that can be used for targeting in a Web Contextual campaign. You may specify one or more EIDs in the targeting criteria for adgroups under a Web Contextual campaign.", [
    
  ]],
  ["dynamic_configuration", "edit", "PUT", "/api/v1/dynamic_configuration/edit", "mutation", "Edit the Dynamic configuration.", [
    ["advertisable", "string", true, "query", "EID of the advertisable."],
    ["key", "string", true, "query", "Name of property being edited"],
    ["value", "string", true, "query", "Value of property to set"]
  ]],
  ["dynamic_configuration", "enable", "POST", "/api/v1/dynamic_configuration/enable", "mutation", "Enable feed parsing on an advertisable and create a feed configuration.", [
    ["advertisable", "string", true, "body", "The EID of the advertisable."],
    ["url", "string", true, "body", "The URL of the product feed. Must point to an XML, JSON or CSV resource or a zipped or gzipped version of such a resource."]
  ]],
  ["dynamic_configuration", "get", "GET", "/api/v1/dynamic_configuration/get", "query", "Get the Dynamic configuration.", [
    ["advertisable", "string", true, "query", "EID of the advertisable."]
  ]],
  ["dynamic_template", "get_all_for_advertisable", "GET", "/api/v1/dynamic_template/get_all_for_advertisable", "query", "Retrieve a list of all the available *dynamic_templates* for an *advertisable*.", [
    ["advertisable", "string", true, "query", "EID of the *advertisable*"]
  ]],
  ["dynamic_template_capability_description", "get_all", "GET", "/api/v1/dynamic_template_capability_description/get_all", "query", "Retrieve a list of all the available template capabilities", [
    
  ]],
  ["feed", "autoconfigure", "POST", "/api/v1/feed/autoconfigure", "mutation", "Automatically configure a product feed for an Advertisable. This feature must be enabled for your account before you can use it.", [
    ["advertisable", "string", true, "body", "EID of the Advertisable"],
    ["url", "string", true, "body", "URL of the product feed. Must point to an XML, JSON or CSV resource. The resource can be compressed using zip or gzip."]
  ]],
  ["invoice", "get", "GET", "/api/v1/invoice/get", "query", "Fetch an invoice by ID", [
    ["invoice", "string", true, "query", "The ID of the invoice."]
  ]],
  ["marketplace", "create", "POST", "/api/v1/marketplace/create", "mutation", "Create a marketplace mapping. Once setup, all Pixel views with a ``adroll_shop_id`` parameter that match ``shop_id`` will be attributed to ``dest_advertisable_id`` instead of ``source_advertisable_id``.", [
    ["source_advertisable", "string", true, "body", "EID of the *marketplace* (parent) Advertisable"],
    ["dest_advertisable", "string", true, "body", "EID of the *merchant* (child) Advertisable"],
    ["shop_id", "string", true, "body", "Unique identifier for the *merchant* within the *marketplace*"],
    ["external_shop_id", "string", false, "body", "An identifier for the merchant that is used by the merchant. Must be unique within entries with the same source_advertisable (Optional; default: None)"]
  ]],
  ["marketplace", "get", "GET", "/api/v1/marketplace/get", "query", "Retrieve a list of marketplace mappings for a *marketplace* and *merchant*.", [
    ["source_advertisable", "string", true, "query", "EID of the *marketplace* (parent) Advertisable"],
    ["dest_advertisable", "string", true, "query", "EID of the *merchant* (child) Advertisable"]
  ]],
  ["marketplace_deals", "get", "GET", "/api/v1/marketplace_deals/get", "query", "List approved+active deals available to the given advertisable\u2019s business unit.", [
    ["advertisable", "string", true, "query", "EID of the Advertisable browsing inventory"],
    ["limit", "number", false, "query", "Page size (default 50, max 200)"],
    ["offset", "number", false, "query", "Page offset (default 0)"],
    ["sort_by", "string", false, "query", "One of ``newest``, ``impressions``, ``cpm`` (default ``newest``)"],
    ["order", "string", true, "query", "One of ``asc``, ``desc`` (default ``desc``)"],
    ["q", "string", false, "query", "Optional keyword search across deal_id, internal name, external name"],
    ["formats", "array", false, "query", "Optional list of inventory types (display, olv, mobile_app, ctv_ott, native)"],
    ["exchanges", "array", false, "query", "Optional list of exchange IDs (e.g. adx, apn, pubmatic)"],
    ["countries", "array", false, "query", "Optional list of 2-character ISO country codes; matches deals serving any of them"]
  ]],
  ["marketplace_deals", "metadata", "GET", "/api/v1/marketplace_deals/metadata", "query", "Filter-dropdown metadata for the Marketplace UI. Returns the set of exchanges, formats, and countries currently represented in the inventory visible to the given advertisable. Designed to be cached on the frontend for the session \u2014 the response carries a private `Cache-Control: private, max-age=300` header.", [
    ["advertisable", "string", true, "query", "EID of the Advertisable browsing inventory"]
  ]],
  ["organization", "get", "GET", "/api/v1/organization/get", "query", "Fetch the details about a given organization.", [
    ["organization", "string", false, "query", "The EID of the organization to retrieve (optional; default: your organization)."]
  ]],
  ["organization", "get_accounts", "GET", "/api/v1/organization/get_accounts", "query", "Fetch the accounts associated with an organization.", [
    ["organization", "string", false, "query", "The EID of the organization (optional; default: your organization)."],
    ["exclude_statuses", "string", false, "query", "Comma-separated account statuses to exclude (optional; default: no statuses excluded)."],
    ["include_balances", "boolean", false, "query", "Whether to include balance information for the accounts (optional; default: True)."],
    ["include_advertisables", "boolean", false, "query", "Whether to include a list of advertisables associated to each account (optional; default: False)."],
    ["include_advertisables_count", "boolean", false, "query", "Whether to include a count of advertisables associated to each account (optional; default: False)."]
  ]],
  ["organization", "get_advertisables", "GET", "/api/v1/organization/get_advertisables", "query", "Fetch the advertisables associated with an organization.", [
    ["organization", "string", false, "query", "The EID of the organization (optional; default: your organization)."]
  ]],
  ["organization", "get_advertisables_paginated", "GET", "/api/v1/organization/get_advertisables_paginated", "query", "Fetch the advertisables associated with an organization.", [
    ["organization", "string", false, "query", "The EID of the organization (optional; default: your organization). :number page: Current page (optional; default: 1)"],
    ["per_page", "number", false, "query", "How many advertisables to return (optional; default: 10)"]
  ]],
  ["organization", "get_billing_methods", "GET", "/api/v1/organization/get_billing_methods", "query", "Fetch the billing methods associated with an organization.", [
    ["organization", "string", false, "query", "The EID of the organization (optional; default: your organization)."]
  ]],
  ["organization", "get_users", "GET", "/api/v1/organization/get_users", "query", "Fetch the users associated with an organization, their role within the organization and their associated advertisables.", [
    ["organization", "string", true, "query", "The EID of the organization (optional; default: your organization). :number page: Current page, defaults to 0. :number per_page: Number of results in each page, do not fill if you don\u2019t want pagination."],
    ["email", "string", false, "query", "Filter by email."]
  ]],
  ["pixel", "get", "GET", "/api/v1/pixel/get", "query", "Fetch the pixel by EID.", [
    ["pixel", "string", true, "query", "EID of the pixel"]
  ]],
  ["pixel", "get_rules", "GET", "/api/v1/pixel/get_rules", "query", "Fetch all the rules associated with a pixel.", [
    ["pixel", "string", true, "query", "The EID of the pixel in question."]
  ]],
  ["pixel", "get_segments", "GET", "/api/v1/pixel/get_segments", "query", "Fetch all the segments associated with a pixel.", [
    ["pixel", "string", true, "query", "The EID of the pixel in question. :number page: Current page, defaults to 0. :number per_page: Number of results in each page, do not fill if you don\u2019t want pagination."],
    ["sort", "string", false, "query", "Column to sort the data (rules.created_date, rules.duration_sec)."],
    ["type", "string", true, "query", "Filter by the type. :number duration: Filter by the duration in days."],
    ["created_start", "string", false, "query", "Filter by segments created before this date."],
    ["created_end", "string", false, "query", "Filter by segments created after this date."]
  ]],
  ["policy", "send_email", "POST", "/api/v1/policy/send_email", "mutation", "Send email using SendWithUs with optional template version support.", [
    ["advertisable", "string", true, "body", "EID of the advertisable"],
    ["template_name", "string", true, "body", "Name of the email template to use"],
    ["email_data", "json", false, "body", "Data to be used in the email template"],
    ["template_version", "string", false, "body", "Version of the template to use (Optional)"]
  ]],
  ["product_feeds", "add_feed_config", "PUT", "/api/v1/product_feeds/add_feed_config", "mutation", "Add a new feed configuration by registering a new product feed.", [
    ["advertisable", "string", true, "query", "EID of the Advertisable that the feed belongs to"],
    ["feed_url", "string", true, "query", "URL of the feed"],
    ["feedtype", "string", true, "query", "Data format used in the feed: auto, csv, xml, json"],
    ["skipfirstrow", "boolean", false, "query", "True if the CSV contains a header row that should be skipped"],
    ["delimiter", "string", false, "query", "Field delimiter used for CSV feeds"],
    ["escapechar", "string", false, "query", "Escape character used for CSV feeds"],
    ["quotechar", "string", false, "query", "Quote character used for CSV feeds"],
    ["skipinitialspace", "boolean", false, "query", "True if the parser should ignore whitespace after the delimiter character in CSV feeds"],
    ["encoding", "string", false, "query", "File encoding used by the feed"],
    ["tag_name", "string", false, "query", "XML element containing product info"],
    ["locale", "string", false, "query", "Cultural locale of the data defaults to en_US"],
    ["prices_in_locale_format", "boolean", false, "query", "True if the price field contains a locale character (i.e. $)"]
  ]],
  ["product_feeds", "autoconfigure", "POST", "/api/v1/product_feeds/autoconfigure", "mutation", "Automatically configure a product feed for an Advertisable. This feature must be enabled for your account before you can use it.", [
    ["advertisable", "string", true, "body", "EID of the Advertisable"],
    ["url", "string", true, "body", "URL of the product feed. Must point to an XML, JSON or CSV resource. The resource can be compressed using zip or gzip."]
  ]],
  ["product_feeds", "delete_feed_config", "GET", "/api/v1/product_feeds/delete_feed_config", "mutation", "Delete a feed configuration", [
    ["feed_config", "string", true, "query", "EID of the feed configuration to delete"]
  ]],
  ["product_feeds", "delete_parser_config", "GET", "/api/v1/product_feeds/delete_parser_config", "mutation", "Delete a parser configuration.", [
    ["feed_config", "string", true, "query", "EID of the parent feed configuration"],
    ["key", "string", true, "query", "Name of the field configuration to remove"]
  ]],
  ["product_feeds", "edit_feed_config", "PUT", "/api/v1/product_feeds/edit_feed_config", "mutation", "Edit a feed configuration", [
    ["feed_config", "string", true, "query", "EID of the feed configuration to edit"],
    ["key", "string", true, "query", "Name of property being edited"],
    ["value", "string", true, "query", "Value of property to set"]
  ]],
  ["product_feeds", "feed_downloadable", "GET", "/api/v1/product_feeds/feed_downloadable", "query", "Verify whether the config at the given feed is downloadable or not", [
    ["feed_url", "string", true, "query", "URL to verify"]
  ]],
  ["product_feeds", "feed_status", "GET", "/api/v1/product_feeds/feed_status", "query", "Get the parse status for the active feed configurations for the specified advertisable.", [
    ["advertisable", "string", true, "query", "Advertisable EID to check the parse status for"]
  ]],
  ["product_feeds", "get_feed_config", "GET", "/api/v1/product_feeds/get_feed_config", "query", "Fetch the feed configuration that matches the specified EID", [
    ["feed_config", "string", true, "query", "EID of the feed configuration"]
  ]],
  ["product_feeds", "get_parser_config", "GET", "/api/v1/product_feeds/get_parser_config", "query", "Get all parser configurations for the given feed configuration.", [
    ["feed_config", "string", true, "query", "EID of the feed configuration to retrieve"]
  ]],
  ["product_feeds", "get_products", "GET", "/api/v1/product_feeds/get_products", "query", "Get the parsed products for any or all of the feeds for an advertisable", [
    ["advertisable", "string", true, "query", "EID of the Advertisable"],
    ["query", "string", false, "query", "search string"],
    ["size", "number", false, "query", "number of records to fetch"],
    ["page", "number", false, "query", "chunk position by size"],
    ["feed_selected", "string", false, "query", "EID of feed to fetch products from"],
    ["any_word", "string", false, "query", "search for any word of query"]
  ]],
  ["product_feeds", "get_troubled_products", "GET", "/api/v1/product_feeds/get_troubled_products", "query", "Get the top 5 troubled products for an advertisable", [
    ["advertisable", "string", true, "query", "EID of the Advertisable"]
  ]],
  ["product_feeds", "match_rate", "GET", "/api/v1/product_feeds/match_rate", "query", "Get the all time match rate statistics for the given Advertisable. If a date is specified, get the match rate for that date as well. Note that statistics are maintained for a rolling window of the past six months.", [
    ["advertisable", "string", true, "query", "Advertisable EID to get match rate statistics for"],
    ["date", "string", false, "query", "If specified, match rate for this date (PST) will also be retrieved. Recommended format `YYYY-MM-DD`. (Optional; default: None)"]
  ]],
  ["product_feeds", "parse_preview", "GET", "/api/v1/product_feeds/parse_preview", "query", "Provides a preview of the given raw product data parsed using the given parse configuration.", [
    ["advertisable", "string", true, "query", "EID of the Advertisable"],
    ["parse_prices_in_locale_format", "boolean", false, "query", "Whether to parse prices based on the locale"],
    ["language_tag", "string", false, "query", "Language tag"],
    ["parser_configs", "string", false, "query", "Stringified JSON object defining configuration for each field"],
    ["product_data", "string", false, "query", "Raw product data to be parsed as string"]
  ]],
  ["product_feeds", "set_parser_config", "GET", "/api/v1/product_feeds/set_parser_config", "mutation", "Set parser configuration for the specified key.", [
    ["feed_config", "string", true, "query", "EID of the feed configuration"],
    ["key", "string", true, "query", "Name of the field The following parameters set the parser configuration attributes:"],
    ["is_required", "boolean", false, "query", "True if this field is required for the parsed product to be valid"],
    ["path", "string", false, "query", "Column number (CSV), field name (JSON), or tag name (XML) for the field"],
    ["attribute", "string", false, "query", "Attribute on the tag to use (i.e. text)"],
    ["type", "string", true, "query", "Field type (either text, image, price)"],
    ["regular_expression", "string", false, "query", "Regular expression to search the field"],
    ["regular_expression_replace", "string", false, "query", "Replacement string to apply to the field"]
  ]],
  ["product_feeds", "set_parser_configs", "POST", "/api/v1/product_feeds/set_parser_configs", "mutation", "Set parser configs. You\u2019ll need to specify a Parser Configuration for each field. Since we require a minimum number of fields, you\u2019ll have at least four Parser Configurations. Any additional fields will depend on the Dynamic Creative template you\u2019re using.", [
    ["feed_config", "string", true, "body", "EID of the feed configuration"],
    ["parser_configs", "string", false, "body", "Stringified JSON object defining configuration for each field The parser_configs parameter consists of an object of fields names as keys and field specification objects consisting of the following attributes:"],
    ["is_required", "boolean", false, "body", "True if this field is required for the parsed product to be valid"],
    ["path", "string", false, "body", "Column number (CSV), field name (JSON), or tag name (XML) for the field"],
    ["attribute", "string", false, "body", "Attribute on the tag to use (i.e. text)"],
    ["regular_expression", "string", false, "body", "Regular expression to search the field"],
    ["regular_expression_replace", "string", false, "body", "Replacement string to apply to the field"],
    ["type", "string", true, "body", "Field type (either text, image, price) Example parser_configs object: :: { \u201cid\u201d: { \u201cpath\u201d: \u201cid\u201d, \u201ctype\u201d: \u201ctext\u201d, \u201cattribute\u201d: \u201ctext\u201d, \u201cis_required\u201d: \u201ctrue\u201d }, \u201ctitle\u201d: { \u201cpath\u201d: \u201ctitle\u201d, \u201ctype\u201d: \u201ctext\u201d, \u201cattribute\u201d: \u201ctext\u201d, \u201cis_required\u201d: \u201ctrue\u201d }, \u201cimage\u201d: { \u201cpath\u201d: \u201cimage\u201d, \u201ctype\u201d: \u201cimage\u201d, \u201cattribute\u201d: \u201ctext\u201d, \u201cis_required\u201d: \u201ctrue\u201d }, \u201curl\u201d: { \u201cpath\u201d: \u201curl\u201d, \u201ctype\u201d: \u201ctext\u201d, \u201cattribute\u201d: \u201ctext\u201d, \u201cis_required\u201d: \u201ctrue\u201d }, \u201cprice\u201d: { \u201cpath\u201d: \u201cprice\u201d, \u201ctype\u201d: \u201cprice\u201d, \u201cattribute\u201d: \u201ctext\u201d, \u201cis_required\u201d: \u201ctrue\u201d } }"]
  ]],
  ["report", "ad", "GET", "/api/v1/report/ad", "query", "Pull reports for your ads. The entity data_format returns: { results : [{ ad : 'My Ad' , eid : 'CYTQSJ3EIVDDRAG3MPDLEU' , status : 'approved' , ad_size : '300x250' , created_date : '2010-02-23' , cpc : 1.0 , ctr : 0.234 , cpm : 2.34 , cost : 500.00 , impressions : 213675 , clicks : 500 , prospects : 6983 }] }", [
    ["campaigns", "array", false, "query", "List of campaign EIDs (optional; default: None)"],
    ["adgroups", "array", false, "query", "List of ad group EIDs (optional; default: None)"],
    ["ads", "array", false, "query", "List of ad EIDs (optional; default: None)"],
    ["advertisables", "array", false, "query", "List of advertisable EIDs (optional; default: None)"],
    ["data_format", "string", false, "query", "\u2018summary\u2019, \u2018date\u2019, or \u2018entity\u2019 (required)"],
    ["currency", "string", false, "query", "the currency code to use for the report (optional; default: \u2018USD\u2019)"],
    ["past_days", "number", false, "query", "Run the report for the last n days (optional; default: None)"],
    ["start_date", "string", false, "query", "start date of report (optional; default: None)"],
    ["end_date", "string", false, "query", "end date of report (optional; default: None)"]
  ]],
  ["report", "advertisable", "GET", "/api/v1/report/advertisable", "query", "Pull reports for one or more advertisables. The entity data_format returns an object in the following format, for each advertisable EID given: { results : [{ advertisable : 'My Advertisable' , eid : 'CYTQSJ3EIVDDRAG3MPDLEU' , status : 'approved' , created_date : '2010-02-23' , cpc : 1.0 , ctr : 0.234 , cpm : 2.34 , cost : 500.00 , impressions : 213675 , clicks : 500 , prospects : 6983 }] }", [
    ["campaigns", "array", false, "query", "List of campaign EIDs (optional; default: None). If campaign EIDs are passed, only data from these campaigns will be returned."],
    ["adgroups", "array", false, "query", "List of ad group EIDs (optional; default: None). If adgroup EIDs are passed, only data from these adgroups will be returned."],
    ["ads", "array", true, "query", "List of ad EIDs (optional; default: None). If ad EIDs are passed, only data from these ads will be returned."],
    ["advertisables", "array", false, "query", "List of advertisable EIDs (at least one is required)"],
    ["data_format", "string", false, "query", "\u2018summary\u2019, \u2018date\u2019, or \u2018entity\u2019 (required)"],
    ["currency", "string", false, "query", "the currency code to use for the report (optional; default: \u2018USD\u2019)"],
    ["past_days", "number", false, "query", "Run the report for the last n days (optional; default: None)"],
    ["start_date", "string", false, "query", "start date of report (optional; default: None)"],
    ["end_date", "string", false, "query", "end date of report (optional; default: None)"]
  ]],
  ["report", "campaign", "GET", "/api/v1/report/campaign", "query", "Pull reports for campaigns. Note : Prospecting and new-style Facebook campaigns are not available in this endpoint. We recommend using the GraphQL Reporting API if you need to retrieve data for all campaign types. The entity data_format returns: { results : [{ campaign : 'My campaign 1' , eid : 'CYTQSJ3EIVDDRAG3MPDLEU' , advertiser : 'My Advertisable' , type : 'Retargeting' , status : 'approved' , created_date : '2010-02-23' , start_date : '2010-02-23' , end_date : null , budget : 3234.0 , cpc : 1.0 , ctr : 0.234 , cpm : 2.34 , cost : 500.00 , impressions : 213675 , clicks : 500 , prospects : 6983 }] }", [
    ["campaigns", "array", false, "query", "List of campaign EIDs (optional; default: None)"],
    ["adgroups", "array", false, "query", "List of ad group EIDs (optional; default: None)"],
    ["ads", "array", false, "query", "List of ad EIDs (optional; default: None)"],
    ["advertisables", "array", false, "query", "List of advertisable EIDs (optional; default: None)"],
    ["data_format", "string", false, "query", "\u2018summary\u2019, \u2018date\u2019, or \u2018entity\u2019 (required)"],
    ["currency", "string", false, "query", "the currency code to use for the report (optional; default: \u2018USD\u2019)"],
    ["past_days", "number", false, "query", "Run the report for the last n days (optional; default: None)"],
    ["start_date", "string", false, "query", "start date of report (optional; default: None)"],
    ["end_date", "string", false, "query", "end date of report (optional; default: None)"],
    ["attributions", "boolean", false, "query", "include attribution data (optional; default: False)"]
  ]],
  ["rule", "create", "POST", "/api/v1/rule/create", "mutation", "Create a new rule on a given pixel.", [
    ["pixel", "string", true, "body", "The EID of the pixel in which we want to create a new rule"],
    ["type", "string", true, "body", "The type of the rule being created. One of [c, s, p, b] (c=Conversion, s=Segment, p=Prospect, b=Cart). You can\u2019t change this later."],
    ["order", "number", true, "body", "The priority order in which this rule needs to be applied among the others. Must be unique in the Pixel. The lower the number, the higher the priority."],
    ["name", "string", false, "body", "The arbitrary name of the rule (Optional; default: None)."],
    ["display_name", "string", false, "body", "The display name of the rule (Optional; default: None)."],
    ["pattern", "string", true, "body", "The regexp-like expression that matches a URL, if creating a URL rule."],
    ["duration", "number", true, "body", "The duration of inactivity that can elapse before a user is dropped from this rule."],
    ["source", "string", false, "body", "one of [c, d, m] (c=cookie, d=crm_data, m=mobile)"]
  ]],
  ["rule", "get", "GET", "/api/v1/rule/get", "query", "Fetch a rule object by EID.", [
    ["rule", "string", true, "query", "The EID of the rule."]
  ]],
  ["rule", "get_segments", "GET", "/api/v1/rule/get_segments", "query", "Fetch the segments on a specific rule.", [
    ["rule", "string", true, "query", "The EID of the rule."]
  ]],
  ["segment", "edit", "POST", "/api/v1/segment/edit", "mutation", "Edit an existing segment.", [
    ["conversion_value", "number", true, "body", "The value of a conversion from this segment (in USD)."],
    ["duration", "number", true, "body", "The duration of inactivity that can elapse before a user is dropped from this segment."]
  ]],
  ["segment", "get", "GET", "/api/v1/segment/get", "query", "Get an existing segment by its EID.", [
    ["segment", "string", true, "query", "The EID of the segment."],
    ["include_int_id", "boolean", false, "query", "whether the response should include segment integer id or not."],
    ["include_lookalike", "boolean", false, "query", "Whether to include lookalike data."],
    ["include_migration_data", "boolean", false, "query", "Wether to include CDP+ migration related data in the response. :LookalikeSegment lookalike_parent: (Optional) The preloaded LookalikeSegment for the segment, to avoid extra database queries. :FacebookCustomAudience facebook_custom_audience: (Optional) The preloaded FacebookCustomAudience for the segment, to avoid extra database queries."]
  ]],
  ["user", "edit", "POST", "/api/v1/user/edit", "mutation", "Edit an existing User with given parameters. { 'u' : user . id , 'username' : \"deliboard\" , 'first_name' : 'Deli' , 'last_name' : 'Board' , 'email_preference_general' : 'true' , 'email_preference_payment' : 'false' , 'email_preference_campaign_notifications' : 'true' , 'email_preference_help_and_suggestions' : 'true' }", [
    ["u", "string", true, "body", "The ID of the user you want to modify"],
    ["username", "string", false, "body", "The arbitrary username of the user."],
    ["first_name", "string", false, "body", "The arbitrary first name of the user."],
    ["last_name", "string", false, "body", "The arbitrary last name of the user."],
    ["email_preference_general", "string", false, "body", "The general email preference as key value pair with boolean designating desired emails to receive."],
    ["email_preference_payment", "string", false, "body", "The payment email preference as key value pair with boolean designating desired emails to receive."],
    ["email_preference_campaign_notifications", "string", false, "body", "The general email preference as key value pair with boolean designating desired emails to receive."]
  ]],
  ["user", "get", "GET", "/api/v1/user/get", "query", "Fetch the currently logged in user", [
    ["load_advertisables", "boolean", false, "query", "Should we fetch advertisables from db?"],
    ["active_advertisables", "array", false, "query", "List of active advertisables for this user, will be used if load_advertisables is false."]
  ]],
  ["user", "grant", "POST", "/api/v1/user/grant", "mutation", "Grant a user in your organization additional privileges. This action may not be conducted by any non-admin user and may not be performed on one\u2019s own user.", [
    ["u", "string", true, "body", "ID of the user to deactivate."],
    ["advertisables", "string", false, "body", "comma-separated string of EIDs for the advertisables you wish to grant a non-admin user access to (admin users have implicit access to every advertisables in an organization. Optional."],
    ["organization_role", "string", false, "body", "pass either \u2018user\u2019 or \u2018admin\u2019 to designate a role within your organization for the specified user. Optional"]
  ]],
  ["xdevice_opt_in", "retrieve", "GET", "/api/v1/xdevice_opt_in/retrieve", "query", "Retrieve cross-device opt-in setting", [
    ["advertisable", "string", true, "query", "EID of advertisable"]
  ]],
  ["xdevice_opt_in", "update", "POST", "/api/v1/xdevice_opt_in/update", "mutation", "Update the cross-device opt-in setting", [
    ["advertisable", "string", true, "body", "EID of advertisable"],
    ["value", "boolean", true, "body", "True if the advertisable should be opted-into the cross-device graph"]
  ]],
];

function schemaFor(fields: Field[]) {
  const shape: Record<string, Schema<unknown, boolean>> = {};
  for (const [name, type, required] of fields) {
    const base: Schema<unknown, boolean> =
      type === "number" ? number() : type === "boolean" ? boolean() : type === "array" ? array(string()) : type === "json" ? json() : string();
    shape[name] = required ? base : base.optional();
  }
  return object(shape);
}

// The schema builders carry no per-field descriptions, so parameter docs go in the tool description.
function describe(description: string, fields: Field[]): string {
  if (fields.length === 0) return description;
  const params = fields.map(([name, type, required, , doc]) => `- ${name} (${type}${required ? ", required" : ""}): ${doc}`);
  return `${description}\n\nParameters:\n${params.join("\n")}`;
}

function build(account: Account, fetcher: typeof fetch, signal: AbortSignal | undefined) {
  const call = async (method: string, path: string, fields: Field[], input: Record<string, unknown>) => {
    const search = new URLSearchParams();
    const form = new URLSearchParams();
    if (account.method === "token") search.set("apikey", account.fields.clientId);
    for (const [name, type, , where] of fields) {
      const value = input[name];
      if (value === undefined || value === null) continue;
      const target = where === "query" || method === "GET" ? search : form;
      if (Array.isArray(value)) for (const item of value) target.append(name, String(item));
      else target.append(name, type === "json" ? JSON.stringify(value) : String(value));
    }
    const hasBody = method !== "GET" && form.size > 0;
    const response = await fetcher(`${base}${path}?${search.toString()}`, {
      method,
      signal,
      headers: hasBody ? { ...headers(account), "Content-Type": "application/x-www-form-urlencoded" } : headers(account),
      ...(hasBody ? { body: form.toString() } : {}),
    });
    return decodeJson(response, json());
  };

  const groups = new Map<string, Record<string, unknown>>();
  for (const [resource, action, method, path, kind, description, fields] of rows) {
    const options = { description: describe(description, fields), input: schemaFor(fields) };
    const handler = async (_ctx: unknown, input: Record<string, unknown>) => call(method, path, fields, input);
    const tool = kind === "mutation" ? mutation(options, handler as never) : query(options, handler as never);
    const group = groups.get(resource) ?? {};
    group[action] = tool;
    groups.set(resource, group);
  }
  return router(Object.fromEntries([...groups].map(([name, tools]) => [name, router(tools as never)])) as never);
}

export default defineApp(
  { user: { accounts: { adroll: adroll.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.adroll ?? [],
        (account) =>
          withApprovals(build(account as Account, fetch, signal), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "AdRoll",
        description:
          "Advertisables, campaigns, ad groups, ads, audiences and segments, pixels, product feeds and performance reports from the AdRoll (NextRoll) CRUD API.",
        icons,
      },
    ),
  }),
);
