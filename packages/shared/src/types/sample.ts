/** Mixed numeric readings + reserved string metadata keys (e.g. `_imageCid`). */
export type LabReadings = Record<string, number | string>;

/** ECIES ciphertext envelope (eth-crypto v1) pinned to IPFS. */
export interface EncryptedBlob {
  iv: string;
  ephemPublicKey: string;
  ciphertext: string;
  mac: string;
  version: "eth-crypto-v1";
  encryptedAt: number;
}
