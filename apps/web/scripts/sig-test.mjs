import { privateKeyToAccount } from "viem/accounts";
import { keccak256, toBytes } from "viem";

const key = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
const method = (process.argv[2] ?? "POST").toUpperCase();
const pathname = process.argv[3] ?? "/api/studies";
const body = process.argv[4] ?? "";

const account = privateKeyToAccount(key);
const bodyText = method === "GET" || method === "HEAD" || method === "DELETE" ? "" : body;
const bodyHash = keccak256(toBytes(bodyText));
const timestamp = Math.floor(Date.now() / 1000);
const message = `AguasPuras admin\n${method} ${pathname}\n${timestamp}\n${bodyHash}`;
const signature = await account.signMessage({ message });
process.stdout.write(`AguasPuras ${account.address} ${timestamp} ${signature}`);
