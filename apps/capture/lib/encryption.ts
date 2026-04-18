/**
 * ECIES envelope for field-agent personal data.
 *
 * Field agents encrypt their personal data (name, CPF, contact, kit serial)
 * to the current AguasPuras Data Owner's secp256k1 public key. Only the wallet
 * holding the matching private key can decrypt. The ciphertext is pinned to
 * IPFS; only the CID is stored on-chain (FieldAgentRegistry).
 *
 * Uses eth-crypto (battle-tested ECIES + AES over secp256k1 ethereum keys).
 * Library API accepts an uncompressed pubkey WITHOUT the `0x04` prefix, so we
 * strip it before calling in.
 *
 * LGPD / GDPR note: right-to-be-forgotten is realised by (a) deactivating the
 * agent on FieldAgentRegistry, (b) rotating the Data Owner pubkey so any
 * future ciphertext can't be decrypted by the old keypair, and (c) the
 * Foundation running a scheduled un-pin on its Pinata-hosted blobs after
 * receiving a deletion request.
 */

import EthCrypto from "eth-crypto";

export interface FieldAgentPersonalData {
  name: string;
  cpf: string;
  email?: string;
  phone?: string;
  kitSerial?: string;
  address?: string;
}

export interface EncryptedBlob {
  iv: string;
  ephemPublicKey: string;
  ciphertext: string;
  mac: string;
  version: "eth-crypto-v1";
  encryptedAt: number;
}

function stripPrefix(pubkey: `0x${string}`): string {
  // eth-crypto expects the uncompressed pubkey without the leading 04 byte.
  return pubkey.startsWith("0x04") ? pubkey.slice(4) : pubkey.slice(2);
}

export async function encryptForDataOwner(
  data: FieldAgentPersonalData,
  dataOwnerPubkey: `0x${string}`
): Promise<EncryptedBlob> {
  const pubkeyNoPrefix = stripPrefix(dataOwnerPubkey);
  const json = JSON.stringify(data);
  const cipher = await EthCrypto.encryptWithPublicKey(pubkeyNoPrefix, json);
  return {
    iv: cipher.iv,
    ephemPublicKey: cipher.ephemPublicKey,
    ciphertext: cipher.ciphertext,
    mac: cipher.mac,
    version: "eth-crypto-v1",
    encryptedAt: Date.now()
  };
}

export async function decryptWithDataOwner(
  blob: EncryptedBlob,
  dataOwnerPrivkey: `0x${string}` | string
): Promise<FieldAgentPersonalData> {
  const priv = typeof dataOwnerPrivkey === "string" && dataOwnerPrivkey.startsWith("0x")
    ? dataOwnerPrivkey.slice(2)
    : dataOwnerPrivkey;
  const plaintext = await EthCrypto.decryptWithPrivateKey(priv, {
    iv: blob.iv,
    ephemPublicKey: blob.ephemPublicKey,
    ciphertext: blob.ciphertext,
    mac: blob.mac
  });
  return JSON.parse(plaintext) as FieldAgentPersonalData;
}
