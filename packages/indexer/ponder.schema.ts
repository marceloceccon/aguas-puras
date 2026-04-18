import { onchainTable } from "ponder";

export const sample = onchainTable("sample", (t) => ({
  attestationUID: t.hex().primaryKey(),
  dataHash: t.hex().notNull(),
  attester: t.hex().notNull(),
  blockNumber: t.bigint().notNull(),
  blockTimestamp: t.bigint().notNull(),
  txHash: t.hex().notNull(),
  labReadingsJson: t.text(),
  labReadingsUpdatedAt: t.bigint(),
  labReadingsUpdater: t.hex()
}));

export const collector = onchainTable("collector", (t) => ({
  address: t.hex().primaryKey(),
  approved: t.boolean().notNull(),
  lastChangedAt: t.bigint().notNull(),
  lastChangedBlock: t.bigint().notNull(),
  approvedCount: t.integer().notNull().default(0),
  revokedCount: t.integer().notNull().default(0)
}));
