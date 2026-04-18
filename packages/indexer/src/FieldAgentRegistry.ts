import { ponder } from "ponder:registry";
import { dataOwnerKey, fieldAgent } from "ponder:schema";
import { bytesToHex } from "viem";

ponder.on("FieldAgentRegistry:AgentRegistered", async ({ event, context }) => {
  await context.db
    .insert(fieldAgent)
    .values({
      address: event.args.agent,
      active: true,
      encryptedPersonalDataCid: event.args.encryptedPersonalDataCid,
      registeredAt: event.block.timestamp,
      updatedAt: event.block.timestamp,
      updateCount: 0
    })
    .onConflictDoUpdate((row) => ({
      active: true,
      encryptedPersonalDataCid: event.args.encryptedPersonalDataCid,
      registeredAt: event.block.timestamp,
      updatedAt: event.block.timestamp,
      updateCount: row.updateCount
    }));
});

ponder.on("FieldAgentRegistry:AgentPersonalDataUpdated", async ({ event, context }) => {
  await context.db
    .update(fieldAgent, { address: event.args.agent })
    .set((row) => ({
      encryptedPersonalDataCid: event.args.encryptedPersonalDataCid,
      updatedAt: event.block.timestamp,
      updateCount: row.updateCount + 1
    }));
});

ponder.on("FieldAgentRegistry:AgentDeactivated", async ({ event, context }) => {
  await context.db
    .update(fieldAgent, { address: event.args.agent })
    .set({
      active: false,
      updatedAt: event.block.timestamp
    });
});

ponder.on("FieldAgentRegistry:DataOwnerPublicKeyUpdated", async ({ event, context }) => {
  const pubkeyBytes = event.args.pubkey as `0x${string}` | Uint8Array;
  const pubkeyHex = typeof pubkeyBytes === "string" ? pubkeyBytes : bytesToHex(pubkeyBytes);
  await context.db
    .insert(dataOwnerKey)
    .values({
      id: 1,
      pubkey: pubkeyHex,
      updatedAt: event.block.timestamp,
      updatedBy: event.args.by
    })
    .onConflictDoUpdate(() => ({
      pubkey: pubkeyHex,
      updatedAt: event.block.timestamp,
      updatedBy: event.args.by
    }));
});
