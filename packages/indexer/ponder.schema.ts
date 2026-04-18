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
