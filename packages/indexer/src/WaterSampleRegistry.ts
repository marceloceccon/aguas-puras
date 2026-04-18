import { ponder } from "ponder:registry";
import { sample } from "ponder:schema";

ponder.on("WaterSampleRegistry:SampleRegistered", async ({ event, context }) => {
  await context.db.insert(sample).values({
    attestationUID: event.args.attestationUID,
    dataHash: event.args.dataHash,
    attester: event.args.attester,
    blockNumber: event.block.number,
    blockTimestamp: event.block.timestamp,
    txHash: event.transaction.hash
  });
});

ponder.on("WaterSampleRegistry:LabReadingsUpdated", async ({ event, context }) => {
  await context.db
    .update(sample, { attestationUID: event.args.attestationUID })
    .set({
      labReadingsJson: event.args.newReadings,
      labReadingsUpdatedAt: event.block.timestamp,
      labReadingsUpdater: event.args.updater
    });
});
