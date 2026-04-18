/**
 * Canonical WaterSampleRegistry v2 ABI. Single source of truth; consumed by
 * apps/capture, apps/web, and (optionally) packages/indexer.
 *
 * Keep this in strict sync with packages/contracts/src/WaterSampleRegistry.sol.
 * A CI job that diffs this against `forge inspect WaterSampleRegistry abi` is
 * the next hardening step.
 */
export const waterSampleRegistryAbi = [
  // ---- writes ----
  {
    type: "function",
    name: "publishSample",
    stateMutability: "nonpayable",
    inputs: [
      { name: "fieldAgent", type: "address" },
      { name: "attestationUID", type: "bytes32" },
      { name: "dataHash", type: "bytes32" },
      { name: "imageCid", type: "string" },
      { name: "labReadingsJson", type: "string" }
    ],
    outputs: []
  },
  {
    type: "function",
    name: "reviewAndSign",
    stateMutability: "nonpayable",
    inputs: [{ name: "attestationUID", type: "bytes32" }],
    outputs: []
  },
  {
    type: "function",
    name: "updateLabReadings",
    stateMutability: "nonpayable",
    inputs: [
      { name: "attestationUID", type: "bytes32" },
      { name: "newReadings", type: "string" }
    ],
    outputs: []
  },

  // ---- views ----
  {
    type: "function",
    name: "getSample",
    stateMutability: "view",
    inputs: [{ name: "attestationUID", type: "bytes32" }],
    outputs: [
      {
        type: "tuple",
        components: [
          { name: "dataHash", type: "bytes32" },
          { name: "fieldAgent", type: "address" },
          { name: "publisher", type: "address" },
          { name: "reviewer", type: "address" },
          { name: "publishedAt", type: "uint64" },
          { name: "reviewedAt", type: "uint64" },
          { name: "imageCid", type: "string" },
          { name: "labReadingsJson", type: "string" },
          { name: "reviewed", type: "bool" }
        ]
      }
    ]
  },
  {
    type: "function",
    name: "exists",
    stateMutability: "view",
    inputs: [{ name: "attestationUID", type: "bytes32" }],
    outputs: [{ type: "bool" }]
  },
  {
    type: "function",
    name: "isReviewed",
    stateMutability: "view",
    inputs: [{ name: "attestationUID", type: "bytes32" }],
    outputs: [{ type: "bool" }]
  },

  // ---- events ----
  {
    type: "event",
    name: "SamplePublished",
    inputs: [
      { name: "attestationUID", type: "bytes32", indexed: true },
      { name: "fieldAgent", type: "address", indexed: true },
      { name: "publisher", type: "address", indexed: true },
      { name: "dataHash", type: "bytes32", indexed: false },
      { name: "imageCid", type: "string", indexed: false },
      { name: "labReadingsJson", type: "string", indexed: false },
      { name: "timestamp", type: "uint64", indexed: false }
    ]
  },
  {
    type: "event",
    name: "SampleReviewed",
    inputs: [
      { name: "attestationUID", type: "bytes32", indexed: true },
      { name: "reviewer", type: "address", indexed: true },
      { name: "timestamp", type: "uint64", indexed: false }
    ]
  },
  {
    type: "event",
    name: "LabReadingsUpdated",
    inputs: [
      { name: "attestationUID", type: "bytes32", indexed: true },
      { name: "updater", type: "address", indexed: true },
      { name: "newReadings", type: "string", indexed: false }
    ]
  }
] as const;
