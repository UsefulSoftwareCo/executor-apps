export type Operation = {
  group: string;
  name: string;
  method: "GET" | "POST" | "PUT";
  path: string;
  description: string;
};

// Viral Loops API v3 (https://developers.viral-loops.com). Every call is scoped to the campaign
// that owns the apiToken. A participant is identified by email or referralCode in query (GET) or in body.user (POST).
export const operations: Operation[] = [
  { group: "campaign", name: "info", method: "GET", path: "/campaign/data", description: "Get the public information of the campaign." },
  { group: "campaign", name: "stats", method: "GET", path: "/campaign/stats", description: "Get the lead count and total referral count of the campaign." },
  { group: "participants", name: "register", method: "POST", path: "/campaign/participant", description: "Register a new participant. Body: publicToken (required; the campaign public token, not the secret apiToken stored in the account), user {email (required), firstname, lastname, consents, extraData}, optional referrer {referralCode}, refSource, acquiredFrom." },
  { group: "participants", name: "edit", method: "PUT", path: "/campaign/participant", description: "Edit a participant. Body: email or referralCode, newAttributes {firstname, lastname, referralCount, conversionCount, extraDataJson} (the first four are required by the vendor schema; extraDataJson is merged), optional sendEmails, triggerIntegrations." },
  { group: "participants", name: "get", method: "GET", path: "/campaign/participant/data", description: "Get full data of one participant. Pass email or referralCode in query." },
  { group: "participants", name: "referrals", method: "GET", path: "/campaign/participant/referrals", description: "List a participant's referrals, paginated. Query: email or referralCode, limit, offset, conversionStatus." },
  { group: "participants", name: "referrer", method: "GET", path: "/campaign/participant/referrer", description: "Get the referrer of a participant. Pass email or referralCode in query." },
  { group: "participants", name: "order", method: "GET", path: "/campaign/participant/order", description: "Get the order in which a participant joined the campaign. Pass email or referralCode in query." },
  { group: "participants", name: "rank", method: "GET", path: "/campaign/participant/rank", description: "Get the leaderboard/waitlist rank of an unflagged participant. Pass email or referralCode in query." },
  { group: "participants", name: "query", method: "POST", path: "/campaign/participant/query", description: "Return information about campaign participants. Body: filter, participants, referrers." },
  { group: "participants", name: "search", method: "POST", path: "/campaign/participant/search", description: "Search and filter participants with advanced filters. Body: filters, pagination." },
  { group: "participants", name: "flag", method: "POST", path: "/campaign/participant/flag", description: "Flag participants (early access or rewarded) so they drop off the waiting list or leaderboard without being deleted. Body: participants." },
  { group: "participants", name: "convert", method: "POST", path: "/campaign/participant/convert", description: "Track a conversion event for a registered participant. Body: user {email or referralCode}, optional options (such as value)." },
  { group: "rewards", name: "pending", method: "GET", path: "/campaign/participant/rewards/pending", description: "Get pending rewards of a participant. Omit email and referralCode for a paginated list across participants. Query may include filter." },
  { group: "rewards", name: "given", method: "GET", path: "/campaign/participant/rewards/given", description: "Get given rewards of a participant. Omit email and referralCode for a paginated list across participants. Query may include filter." },
  { group: "rewards", name: "redeem", method: "POST", path: "/campaign/participant/rewards/redeem", description: "Redeem a pending reward, moving it to given rewards. Body: user {email or referralCode}, rewardId." },
];
