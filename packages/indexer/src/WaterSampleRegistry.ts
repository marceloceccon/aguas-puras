import { ponder } from "ponder:registry";
import { sample } from "ponder:schema";

ponder.on("WaterSampleRegistry:SamplePublished", async ({ event, context }) => {
  await context.db.insert(sample).values({
    attestationUID: event.args.attestationUID,
    dataHash: event.args.dataHash,
    fieldAgent: event.args.fieldAgent,
    publisher: event.args.publisher,
    publishedAt: event.block.timestamp,
    publishedBlock: event.block.number,
    publishTxHash: event.transaction.hash,
    imageCid: event.args.imageCid,
    labReadingsJson: event.args.labReadingsJson,
    reviewed: false
  });
});

ponder.on("WaterSampleRegistry:SampleReviewed", async ({ event, context }) => {
  await context.db
    .update(sample, { attestationUID: event.args.attestationUID })
    .set({
      reviewer: event.args.reviewer,
      reviewedAt: event.block.timestamp,
      reviewed: true
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
