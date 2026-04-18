/**
 * Canonical FieldAgentRegistry ABI. Single source of truth; keep in sync with
 * packages/contracts/src/FieldAgentRegistry.sol.
 */
export const fieldAgentRegistryAbi = [
  // ---- writes ----
  {
    type: "function",
    name: "register",
    stateMutability: "nonpayable",
    inputs: [{ name: "encryptedPersonalDataCid", type: "string" }],
    outputs: []
  },
  {
    type: "function",
    name: "updatePersonalData",
    stateMutability: "nonpayable",
    inputs: [{ name: "encryptedPersonalDataCid", type: "string" }],
    outputs: []
  },
  {
    type: "function",
    name: "deactivate",
    stateMutability: "nonpayable",
    inputs: [{ name: "agent", type: "address" }],
    outputs: []
  },
  {
    type: "function",
    name: "setDataOwnerPublicKey",
    stateMutability: "nonpayable",
    inputs: [{ name: "pubkey", type: "bytes" }],
    outputs: []
  },

  // ---- views ----
  {
    type: "function",
    name: "isActive",
    stateMutability: "view",
    inputs: [{ name: "agent", type: "address" }],
    outputs: [{ type: "bool" }]
  },
  {
    type: "function",
    name: "dataOwnerPublicKey",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "bytes" }]
  },
  {
    type: "function",
    name: "getAgent",
    stateMutability: "view",
    inputs: [{ name: "agent", type: "address" }],
    outputs: [
      {
        type: "tuple",
        components: [
          { name: "registered", type: "bool" },
          { name: "active", type: "bool" },
          { name: "registeredAt", type: "uint64" },
          { name: "updatedAt", type: "uint64" },
          { name: "encryptedPersonalDataCid", type: "string" }
        ]
      }
    ]
  },

  // ---- events ----
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
