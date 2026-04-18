export const CollectorRegistryAbi = [
  {
    type: "event",
    name: "CollectorApproved",
    inputs: [{ name: "collector", type: "address", indexed: true }]
  },
  {
    type: "event",
    name: "CollectorRevoked",
    inputs: [{ name: "collector", type: "address", indexed: true }]
  },
  {
    type: "event",
    name: "OwnershipTransferred",
    inputs: [
      { name: "previousOwner", type: "address", indexed: true },
      { name: "newOwner", type: "address", indexed: true }
    ]
  }
] as const;
