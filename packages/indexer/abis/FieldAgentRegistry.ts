export const FieldAgentRegistryAbi = [
  {
    type: "event",
    name: "AgentRegistered",
    inputs: [
      { name: "agent", type: "address", indexed: true },
      { name: "encryptedPersonalDataCid", type: "string", indexed: false },
      { name: "timestamp", type: "uint64", indexed: false }
    ]
  },
  {
    type: "event",
    name: "AgentPersonalDataUpdated",
    inputs: [
      { name: "agent", type: "address", indexed: true },
      { name: "encryptedPersonalDataCid", type: "string", indexed: false },
      { name: "timestamp", type: "uint64", indexed: false }
    ]
  },
  {
    type: "event",
    name: "AgentDeactivated",
    inputs: [
      { name: "agent", type: "address", indexed: true },
      { name: "by", type: "address", indexed: true },
      { name: "timestamp", type: "uint64", indexed: false }
    ]
  },
  {
    type: "event",
    name: "DataOwnerPublicKeyUpdated",
    inputs: [
      { name: "by", type: "address", indexed: true },
      { name: "pubkey", type: "bytes", indexed: false }
    ]
  }
] as const;
