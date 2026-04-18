export const WaterSampleRegistryAbi = [
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
