import type { OpenapiToolNamesOptions } from "apps/openapi";

// Official V2 OpenAPI bundle published with the beaconcha.in docs (Mintlify).
// Every V2 endpoint is a POST with a JSON body, but all of them only read data except SelfReportValidators,
// so the read operations are kinds=query (no approval) and SelfReportValidators stays a mutation.
const kinds = {
  GetValidatorOverview: "query",
  GetValidatorApyRoi: "query",
  GetValidatorRewardsAggregate: "query",
  GetValidatorRewardsList: "query",
  GetValidatorPerformanceAggregate: "query",
  GetValidatorUpcomingDutySlots: "query",
  GetValidatorBestMaintenanceWindow: "query",
  GetValidatorPerformanceList: "query",
  GetValidatorBalances: "query",
  GetValidatorSyncCommitteePeriods: "query",
  GetValidatorProposalSlots: "query",
  GetValidatorAttestationSlots: "query",
  GetValidatorPtcSlots: "query",
  GetValidatorDepositSlots: "query",
  GetValidatorWithdrawalSlots: "query",
  GetValidatorStakingQueues: "query",
  GetValidatorQueueDepositDetails: "query",
  GetValidatorQueueWithdrawalDetails: "query",
  GetValidatorQueueConsolidationDetails: "query",
  GetValidatorQueueCompoundingSwitchDetails: "query",
  GetEpochOverview: "query",
  GetSlotOverview: "query",
  GetSlotSyncCommitteeDuties: "query",
  GetAttestationDutiesForSlot: "query",
  GetSlotPtcDuties: "query",
  GetSlotWithdrawals: "query",
  GetSlotDeposits: "query",
  GetSlotConsolidations: "query",
  GetBlockOverview: "query",
  GetBlockRewards: "query",
  GetStakingQueuesHistory: "query",
  GetBlockMevTiming: "query",
  GetBlockMevBids: "query",
  GetValidatorMevTimingAggregate: "query",
  GetEntityMevTiming: "query",
  GetNetworkMevTiming: "query",
  GetSyncCommitteeOverview: "query",
  GetSyncCommitteeValidators: "query",
  GetStakingQueues: "query",
  GetQueueRequestFees: "query",
  GetQueueRequestFeesCurrent: "query",
  GetExplorerState: "query",
  GetValidatorStatuses: "query",
  GetNetworkConfig: "query",
  GetNetworkPerformanceAggregate: "query",
  GetEthStore: "query",
  GetEntitiesOverview: "query",
  GetSubEntitiesOverview: "query",
  GetMachineMetrics: "query",
  GetMachineMetricsMachineNames: "query",
} as const;

const patches = [
  // GetValidatorMetadata is marked x-internal in the spec; it is not exposed.
  { op: "remove", path: "/paths/~1api~1v2~1ethereum~1validators~1metadata" },
  // The legacy v2 schema for /queues was sunset on 2026-07-02 and every request now gets v2.1, so point
  // application/json at the v2.1 schema.
  {
    op: "replace",
    path: "/components/responses/QueueStats/content/application~1json/schema/$ref",
    value: "#/components/schemas/QueueStats2.Container",
  },
] as unknown as NonNullable<OpenapiToolNamesOptions["patches"]>;

export const options = {
  source: { url: "https://docs.beaconcha.in/v3/bundled.yaml" },
  allowedOrigin: "https://beaconcha.in",
  securitySchemes: { ApiKeyAuth: { type: "http", scheme: "bearer" } },
  methods: { apiKey: [{ scheme: "ApiKeyAuth", field: "token", part: "value", prefix: "" }] },
  oauth: [],
  kinds,
  patches,
} satisfies OpenapiToolNamesOptions;
