import { onchainTable } from "ponder";

export const sample = onchainTable("sample", (t) => ({
  attestationUID: t.hex().primaryKey(),
  dataHash: t.hex().notNull(),
  fieldAgent: t.hex().notNull(),
  publisher: t.hex().notNull(),
  publishedAt: t.bigint().notNull(),
  publishedBlock: t.bigint().notNull(),
  publishTxHash: t.hex().notNull(),
  imageCid: t.text().notNull(),
  labReadingsJson: t.text().notNull(),
  reviewer: t.hex(),
  reviewedAt: t.bigint(),
  reviewed: t.boolean().notNull().default(false),
  labReadingsUpdatedAt: t.bigint(),
  labReadingsUpdater: t.hex()
}));

export const fieldAgent = onchainTable("field_agent", (t) => ({
  address: t.hex().primaryKey(),
  active: t.boolean().notNull(),
  encryptedPersonalDataCid: t.text().notNull(),
  registeredAt: t.bigint().notNull(),
  updatedAt: t.bigint().notNull(),
  updateCount: t.integer().notNull().default(0)
}));

export const dataOwnerKey = onchainTable("data_owner_key", (t) => ({
  id: t.integer().primaryKey(),
  pubkey: t.hex().notNull(),
  updatedAt: t.bigint().notNull(),
  updatedBy: t.hex().notNull()
}));
