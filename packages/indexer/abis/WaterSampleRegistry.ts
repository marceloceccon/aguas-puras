export const WaterSampleRegistryAbi = [
  {
    type: "event",
    name: "SampleRegistered",
    inputs: [
      { name: "attestationUID", type: "bytes32", indexed: true },
      { name: "attester", type: "address", indexed: true },
      { name: "dataHash", type: "bytes32", indexed: false },
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
