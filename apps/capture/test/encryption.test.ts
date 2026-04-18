import EthCrypto from "eth-crypto";
import { describe, expect, it } from "vitest";
import {
  decryptWithDataOwner,
  encryptForDataOwner,
  type FieldAgentPersonalData
} from "@/lib/encryption";

// Generate a fresh secp256k1 keypair at test time — we don't want committed keys.
function fresh() {
  const id = EthCrypto.createIdentity();
  return {
    privateKey: id.privateKey as `0x${string}`,
    publicKey: ("0x04" + id.publicKey) as `0x${string}`
  };
}

const sample: FieldAgentPersonalData = {
  name: "Maria da Silva",
  cpf: "123.456.789-00",
  email: "maria@example.com",
  phone: "+55 48 99999-0000",
  kitSerial: "KIT-001",
  address: "Rua Felipe Schmidt, 100, Florianópolis-SC"
};

describe("encryptForDataOwner / decryptWithDataOwner", () => {
  it("round-trips plaintext exactly", async () => {
    const { privateKey, publicKey } = fresh();
    const blob = await encryptForDataOwner(sample, publicKey);
    const plain = await decryptWithDataOwner(blob, privateKey);
    expect(plain).toEqual(sample);
  });

  it("produces an envelope with the v1 version tag + all required fields", async () => {
    const { publicKey } = fresh();
    const blob = await encryptForDataOwner(sample, publicKey);
    expect(blob.version).toBe("eth-crypto-v1");
    expect(blob.iv).toBeTruthy();
    expect(blob.ephemPublicKey).toBeTruthy();
    expect(blob.ciphertext).toBeTruthy();
    expect(blob.mac).toBeTruthy();
    expect(typeof blob.encryptedAt).toBe("number");
  });

  it("is non-deterministic (fresh iv+ephem per call)", async () => {
    const { publicKey } = fresh();
    const a = await encryptForDataOwner(sample, publicKey);
    const b = await encryptForDataOwner(sample, publicKey);
    expect(a.ciphertext).not.toBe(b.ciphertext);
    expect(a.ephemPublicKey).not.toBe(b.ephemPublicKey);
  });

  it("fails to decrypt with a different private key", async () => {
    const owner = fresh();
    const intruder = fresh();
    const blob = await encryptForDataOwner(sample, owner.publicKey);
    await expect(decryptWithDataOwner(blob, intruder.privateKey)).rejects.toBeTruthy();
  });

  it("supports pubkey without the 0x04 prefix as well", async () => {
    const { privateKey, publicKey } = fresh();
    const noPrefix = ("0x" + publicKey.slice(4)) as `0x${string}`;
    const blob = await encryptForDataOwner(sample, noPrefix);
    const plain = await decryptWithDataOwner(blob, privateKey);
    expect(plain).toEqual(sample);
  });
});
