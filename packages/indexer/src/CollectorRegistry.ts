import { ponder } from "ponder:registry";
import { collector } from "ponder:schema";

ponder.on("CollectorRegistry:CollectorApproved", async ({ event, context }) => {
  await context.db
    .insert(collector)
    .values({
      address: event.args.collector,
      approved: true,
      lastChangedAt: event.block.timestamp,
      lastChangedBlock: event.block.number,
      approvedCount: 1,
      revokedCount: 0
    })
    .onConflictDoUpdate((row) => ({
      approved: true,
      lastChangedAt: event.block.timestamp,
      lastChangedBlock: event.block.number,
      approvedCount: row.approvedCount + 1
    }));
});

ponder.on("CollectorRegistry:CollectorRevoked", async ({ event, context }) => {
  await context.db
    .insert(collector)
    .values({
      address: event.args.collector,
      approved: false,
      lastChangedAt: event.block.timestamp,
      lastChangedBlock: event.block.number,
      approvedCount: 0,
      revokedCount: 1
    })
    .onConflictDoUpdate((row) => ({
      approved: false,
      lastChangedAt: event.block.timestamp,
      lastChangedBlock: event.block.number,
      revokedCount: row.revokedCount + 1
    }));
});
